-- =========================================================
-- Stage 1D Final Blockers Migration
-- Construction Daily Report & Site Control Platform
-- File: supabase/migrations/20260517100000_stage1d_final_blockers.sql
--
-- Purpose:
-- 1. Remove direct client INSERT access to approval_logs
-- 2. Protect reports.status from direct client manipulation
-- 3. Keep workflow RPC functions working safely
--
-- IMPORTANT:
-- This migration must be applied AFTER:
-- 20260516000000_schema_security_storage.sql
-- 20260517000000_stage1c_hardening.sql
-- =========================================================


-- =========================================================
-- 1. Remove direct approval_logs INSERT policy
-- =========================================================

drop policy if exists
  "Authenticated users can insert approval logs through controlled functions"
on public.approval_logs;

comment on table public.approval_logs is
  'Immutable approval history. Inserted only by controlled workflow RPC functions. No direct client insert/update/delete access.';


-- =========================================================
-- 2. Status protection trigger helper
-- =========================================================

create or replace function public.protect_report_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Allow admin / SQL Editor / service-side operations where auth.uid() is null.
  if auth.uid() is null then
    return new;
  end if;

  -- Allow controlled workflow RPC functions only.
  if current_setting('app.allow_report_status_change', true) = 'on' then
    return new;
  end if;

  -- Block direct client-side status changes.
  if new.status is distinct from old.status then
    raise exception
      'Report status cannot be changed directly. Use workflow RPC functions.'
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;

comment on function public.protect_report_status() is
  'Prevents direct client manipulation of report workflow status. Workflow RPCs must set app.allow_report_status_change = on.';


-- =========================================================
-- 3. Patch workflow RPCs to safely change report status
-- =========================================================

create or replace function public.submit_report(
  p_report_id uuid,
  p_comment text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_report public.reports;
begin
  select *
  into v_report
  from public.reports
  where id = p_report_id;

  if v_report.id is null then
    raise exception 'Report not found';
  end if;

  if not public.is_project_member(v_report.project_id) then
    raise exception 'Not authorized';
  end if;

  if v_report.status not in ('draft', 'returned') then
    raise exception 'Only draft or returned reports can be submitted';
  end if;

  if v_report.locked = true then
    raise exception 'Locked reports cannot be submitted';
  end if;

  if v_report.completeness_score < 80 then
    raise exception 'Report completeness score must be at least 80 percent before submission';
  end if;

  perform set_config('app.allow_report_status_change', 'on', true);

  update public.reports
  set
    status = 'submitted',
    submitted_at = now(),
    updated_by = auth.uid(),
    updated_at = now()
  where id = p_report_id;

  insert into public.approval_logs (
    report_id,
    action_by,
    from_status,
    to_status,
    action,
    comments
  )
  values (
    p_report_id,
    auth.uid(),
    v_report.status,
    'submitted',
    'submit',
    p_comment
  );
end;
$$;


create or replace function public.return_report(
  p_report_id uuid,
  p_comment text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_report public.reports;
begin
  if p_comment is null or length(trim(p_comment)) = 0 then
    raise exception 'Return comment is required';
  end if;

  select *
  into v_report
  from public.reports
  where id = p_report_id;

  if v_report.id is null then
    raise exception 'Report not found';
  end if;

  if v_report.status not in ('submitted', 'approved_by_pm') then
    raise exception 'Only submitted or PM-approved reports can be returned';
  end if;

  if v_report.status = 'submitted'
     and not public.has_project_role(
       v_report.project_id,
       array['admin', 'project_manager']::public.user_role[]
     )
  then
    raise exception 'Only project manager can return submitted reports';
  end if;

  if v_report.status = 'approved_by_pm'
     and not public.has_project_role(
       v_report.project_id,
       array['admin', 'client_representative']::public.user_role[]
     )
  then
    raise exception 'Only client representative can return PM-approved reports';
  end if;

  perform set_config('app.allow_report_status_change', 'on', true);

  update public.reports
  set
    status = 'returned',
    locked = false,
    updated_by = auth.uid(),
    updated_at = now()
  where id = p_report_id;

  insert into public.approval_logs (
    report_id,
    action_by,
    from_status,
    to_status,
    action,
    comments
  )
  values (
    p_report_id,
    auth.uid(),
    v_report.status,
    'returned',
    'return',
    p_comment
  );
end;
$$;


create or replace function public.approve_report_by_pm(
  p_report_id uuid,
  p_comment text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_report public.reports;
begin
  select *
  into v_report
  from public.reports
  where id = p_report_id;

  if v_report.id is null then
    raise exception 'Report not found';
  end if;

  if not public.has_project_role(
    v_report.project_id,
    array['admin', 'project_manager']::public.user_role[]
  )
  then
    raise exception 'Only project manager can approve this report';
  end if;

  if v_report.status <> 'submitted' then
    raise exception 'Only submitted reports can be approved by PM';
  end if;

  perform set_config('app.allow_report_status_change', 'on', true);

  update public.reports
  set
    status = 'approved_by_pm',
    approved_pm_at = now(),
    updated_by = auth.uid(),
    updated_at = now()
  where id = p_report_id;

  insert into public.approval_logs (
    report_id,
    action_by,
    from_status,
    to_status,
    action,
    comments
  )
  values (
    p_report_id,
    auth.uid(),
    'submitted',
    'approved_by_pm',
    'approve_by_pm',
    p_comment
  );
end;
$$;


create or replace function public.approve_report_by_client(
  p_report_id uuid,
  p_comment text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_report public.reports;
begin
  select *
  into v_report
  from public.reports
  where id = p_report_id;

  if v_report.id is null then
    raise exception 'Report not found';
  end if;

  if not public.has_project_role(
    v_report.project_id,
    array['admin', 'client_representative']::public.user_role[]
  )
  then
    raise exception 'Only client representative can approve this report';
  end if;

  if v_report.status <> 'approved_by_pm' then
    raise exception 'Only PM-approved reports can be approved by client';
  end if;

  perform set_config('app.allow_report_status_change', 'on', true);

  update public.reports
  set
    status = 'approved_by_client',
    approved_client_at = now(),
    locked = true,
    updated_by = auth.uid(),
    updated_at = now()
  where id = p_report_id;

  insert into public.approval_logs (
    report_id,
    action_by,
    from_status,
    to_status,
    action,
    comments
  )
  values (
    p_report_id,
    auth.uid(),
    'approved_by_pm',
    'approved_by_client',
    'approve_by_client',
    p_comment
  );
end;
$$;


create or replace function public.archive_report(
  p_report_id uuid,
  p_comment text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_report public.reports;
begin
  select *
  into v_report
  from public.reports
  where id = p_report_id;

  if v_report.id is null then
    raise exception 'Report not found';
  end if;

  if not public.has_project_role(
    v_report.project_id,
    array['admin', 'project_manager']::public.user_role[]
  )
  then
    raise exception 'Only admin or project manager can archive reports';
  end if;

  if v_report.status <> 'approved_by_client' then
    raise exception 'Only client-approved reports can be archived';
  end if;

  perform set_config('app.allow_report_status_change', 'on', true);

  update public.reports
  set
    status = 'archived',
    archived_at = now(),
    locked = true,
    updated_by = auth.uid(),
    updated_at = now()
  where id = p_report_id;

  insert into public.approval_logs (
    report_id,
    action_by,
    from_status,
    to_status,
    action,
    comments
  )
  values (
    p_report_id,
    auth.uid(),
    'approved_by_client',
    'archived',
    'archive',
    p_comment
  );
end;
$$;


-- =========================================================
-- 4. Attach status protection trigger
-- =========================================================

drop trigger if exists trg_protect_report_status on public.reports;

create trigger trg_protect_report_status
before update on public.reports
for each row
execute function public.protect_report_status();


-- =========================================================
-- 5. Function execute grants
-- =========================================================

grant execute on function public.submit_report(uuid, text) to authenticated;
grant execute on function public.return_report(uuid, text) to authenticated;
grant execute on function public.approve_report_by_pm(uuid, text) to authenticated;
grant execute on function public.approve_report_by_client(uuid, text) to authenticated;
grant execute on function public.archive_report(uuid, text) to authenticated;


-- =========================================================
-- End of Stage 1D Final Blockers Migration
-- =========================================================
