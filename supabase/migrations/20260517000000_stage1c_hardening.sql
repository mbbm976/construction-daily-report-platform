-- =========================================================
-- Stage 1C Hardening Migration
-- Construction Daily Report & Site Control Platform
-- File: supabase/migrations/20260517000000_stage1c_hardening.sql
--
-- This is an INCREMENTAL patch on top of Stage 1 migration.
-- Do NOT run this before Stage 1 migration is applied.
-- Safe to re-run (idempotent where possible).
-- =========================================================


-- =========================================================
-- SECTION 1: profiles.role default hardening
--
-- Change default role from 'site_engineer' to 'viewer'
-- so that newly registered users have the least privilege
-- until an admin explicitly promotes them.
-- =========================================================

alter table public.profiles
  alter column role set default 'viewer';

comment on column public.profiles.role is
  'Default is viewer. Must be explicitly set by admin via RPC.';


-- =========================================================
-- SECTION 2: Profile privilege escalation protection
--
-- Prevent authenticated users from updating:
--   - their own role
--   - their own organization_id
--   - their own is_active flag
--
-- Approach: BEFORE UPDATE trigger that blocks changes
-- to protected fields when auth.uid() is not null
-- (i.e. when called from frontend/client context).
-- Service role operations via SQL Editor (auth.uid() = null)
-- are intentionally allowed for admin bootstrapping.
-- =========================================================

create or replace function public.protect_profile_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Allow service role / SQL Editor bootstrap (auth.uid() is null)
  if auth.uid() is null then
    return new;
  end if;

  -- Block role escalation
  if new.role is distinct from old.role then
    raise exception
      'Profile role cannot be changed directly. Use admin RPC functions.'
      using errcode = 'P0001';
  end if;

  -- Block organization reassignment
  if new.organization_id is distinct from old.organization_id then
    raise exception
      'Profile organization_id cannot be changed directly.'
      using errcode = 'P0001';
  end if;

  -- Block self-deactivation or reactivation
  if new.is_active is distinct from old.is_active then
    raise exception
      'Profile is_active flag cannot be changed directly.'
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_protect_profile_fields on public.profiles;
create trigger trg_protect_profile_fields
  before update on public.profiles
  for each row
  execute function public.protect_profile_fields();
-- =========================================================
-- SECTION 2B: Profile insert hardening
--
-- Prevent new authenticated users from creating privileged
-- profiles during self-registration.
--
-- New users may only create their own viewer profile with
-- no organization assignment. Organization and role assignment
-- must be handled later by admin/service process.
-- =========================================================

drop policy if exists "Users can insert own profile" on public.profiles;

create policy "Users can insert own profile"
on public.profiles
for insert
to authenticated
with check (
  id = auth.uid()
  and role = 'viewer'::public.user_role
  and organization_id is null
  and is_active = true
);

comment on function public.protect_profile_fields() is
  'Blocks client-side escalation of role, organization_id, and is_active.
   Service role (auth.uid() = null) is allowed for admin bootstrap.';


-- =========================================================
-- SECTION 3: Project member management RPC functions
--
-- Rules enforced inside each function:
--   - Caller must be an active admin or project_manager
--     of the target project.
--   - Only an admin-role caller can assign admin role.
--   - Target profile must belong to the same organization
--     as the project.
--   - All inputs are validated before any DML.
-- =========================================================

-- ---------------------------------------------------------
-- Helper: assert caller has management rights on project
-- ---------------------------------------------------------
create or replace function public.assert_project_manager_access(
  p_project_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.has_project_role(
    p_project_id,
    array['admin', 'project_manager']::public.user_role[]
  ) then
    raise exception
      'Access denied: caller must be admin or project_manager of this project.'
      using errcode = 'P0001';
  end if;
end;
$$;

-- ---------------------------------------------------------
-- 3a. add_project_member
-- ---------------------------------------------------------
create or replace function public.add_project_member(
  p_project_id  uuid,
  p_profile_id  uuid,
  p_role        public.user_role
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_project          public.projects;
  v_target_profile   public.profiles;
  v_caller_role      public.user_role;
  v_existing_role    public.user_role;
begin
  -- 1. Validate inputs
  if p_project_id is null or p_profile_id is null or p_role is null then
    raise exception 'project_id, profile_id and role are required.'
      using errcode = 'P0001';
  end if;

  -- 2. Caller must be admin or project_manager
  perform public.assert_project_manager_access(p_project_id);

  -- 3. Load project
  select * into v_project
  from public.projects
  where id = p_project_id
    and is_active = true;

  if v_project.id is null then
    raise exception 'Project not found or inactive.'
      using errcode = 'P0001';
  end if;

  -- 4. Load target profile
  select * into v_target_profile
  from public.profiles
  where id = p_profile_id
    and is_active = true;

  if v_target_profile.id is null then
    raise exception 'Target profile not found or inactive.'
      using errcode = 'P0001';
  end if;

  -- 5. Target must belong to same organization as project
  if v_target_profile.organization_id is distinct from v_project.organization_id then
    raise exception
      'Target profile does not belong to the same organization as the project.'
      using errcode = 'P0001';
  end if;

    -- 6. Load caller role and existing membership role
  select pm.role into v_caller_role
  from public.project_members pm
  where pm.project_id = p_project_id
    and pm.profile_id = auth.uid()
    and pm.is_active = true;

  if v_caller_role is null then
    raise exception
      'Access denied: caller is not an active member of this project.'
      using errcode = 'P0001';
  end if;

  select pm.role into v_existing_role
  from public.project_members pm
  where pm.project_id = p_project_id
    and pm.profile_id = p_profile_id;

  -- Only an admin-role caller can assign admin role
  if p_role = 'admin' and v_caller_role is distinct from 'admin' then
    raise exception
      'Only a project admin can assign the admin role to another member.'
      using errcode = 'P0001';
  end if;

  -- Only an admin-role caller can change or reactivate an existing admin member
  if v_existing_role = 'admin' and v_caller_role is distinct from 'admin' then
    raise exception
      'Only a project admin can change or reactivate an existing admin member.'
      using errcode = 'P0001';
  end if;

  -- 7. Insert or reactivate existing membership
  insert into public.project_members (
    project_id,
    profile_id,
    role,
    is_active
  )
  values (
    p_project_id,
    p_profile_id,
    p_role,
    true
  )
  on conflict (project_id, profile_id)
  do update
    set role      = excluded.role,
        is_active = true;

  -- 8. Audit
  insert into public.audit_logs (
    table_name, record_id, actor_id, action, new_data
  )
  values (
    'project_members',
    p_profile_id,
    auth.uid(),
    'add_project_member',
    jsonb_build_object(
      'project_id', p_project_id,
      'profile_id', p_profile_id,
      'role',       p_role
    )
  );
end;
$$;

-- ---------------------------------------------------------
-- 3b. update_project_member_role
-- ---------------------------------------------------------
create or replace function public.update_project_member_role(
  p_project_id  uuid,
  p_profile_id  uuid,
  p_new_role    public.user_role
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller_role  public.user_role;
  v_old_role     public.user_role;
  v_member_exists boolean;
begin
  -- 1. Validate inputs
  if p_project_id is null or p_profile_id is null or p_new_role is null then
    raise exception 'project_id, profile_id and new_role are required.'
      using errcode = 'P0001';
  end if;

  -- 2. Caller must be admin or project_manager
  perform public.assert_project_manager_access(p_project_id);

  -- 3. Target membership must exist and be active
  select pm.role, true
  into v_old_role, v_member_exists
  from public.project_members pm
  where pm.project_id = p_project_id
    and pm.profile_id = p_profile_id
    and pm.is_active  = true;

  if not coalesce(v_member_exists, false) then
    raise exception 'Target is not an active member of this project.'
      using errcode = 'P0001';
  end if;

  -- 4. Only admin can assign or revoke admin role
  if p_new_role = 'admin' or v_old_role = 'admin' then
    select pm.role into v_caller_role
    from public.project_members pm
    where pm.project_id = p_project_id
      and pm.profile_id = auth.uid()
      and pm.is_active  = true;

    if v_caller_role is distinct from 'admin' then
      raise exception
        'Only a project admin can assign or revoke the admin role.'
        using errcode = 'P0001';
    end if;
  end if;

  -- 5. Perform update
  update public.project_members
  set role = p_new_role
  where project_id = p_project_id
    and profile_id = p_profile_id
    and is_active  = true;

  -- 6. Audit
  insert into public.audit_logs (
    table_name, record_id, actor_id, action, old_data, new_data
  )
  values (
    'project_members',
    p_profile_id,
    auth.uid(),
    'update_project_member_role',
    jsonb_build_object('role', v_old_role),
    jsonb_build_object(
      'project_id', p_project_id,
      'profile_id', p_profile_id,
      'role',       p_new_role
    )
  );
end;
$$;

-- ---------------------------------------------------------
-- 3c. deactivate_project_member
-- ---------------------------------------------------------
create or replace function public.deactivate_project_member(
  p_project_id  uuid,
  p_profile_id  uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller_role  public.user_role;
  v_target_role  public.user_role;
begin
  -- 1. Validate inputs
  if p_project_id is null or p_profile_id is null then
    raise exception 'project_id and profile_id are required.'
      using errcode = 'P0001';
  end if;

  -- 2. Prevent self-deactivation
  if p_profile_id = auth.uid() then
    raise exception 'You cannot deactivate your own project membership.'
      using errcode = 'P0001';
  end if;

  -- 3. Caller must be admin or project_manager
  perform public.assert_project_manager_access(p_project_id);

  -- 4. Load target membership
  select pm.role into v_target_role
  from public.project_members pm
  where pm.project_id = p_project_id
    and pm.profile_id = p_profile_id
    and pm.is_active  = true;

  if v_target_role is null then
    raise exception 'Target is not an active member of this project.'
      using errcode = 'P0001';
  end if;

  -- 5. Only admin can deactivate another admin
  if v_target_role = 'admin' then
    select pm.role into v_caller_role
    from public.project_members pm
    where pm.project_id = p_project_id
      and pm.profile_id = auth.uid()
      and pm.is_active  = true;

    if v_caller_role is distinct from 'admin' then
      raise exception
        'Only a project admin can deactivate another admin member.'
        using errcode = 'P0001';
    end if;
  end if;

  -- 6. Soft-delete
  update public.project_members
  set is_active = false
  where project_id = p_project_id
    and profile_id = p_profile_id;

  -- 7. Audit
  insert into public.audit_logs (
    table_name, record_id, actor_id, action, old_data
  )
  values (
    'project_members',
    p_profile_id,
    auth.uid(),
    'deactivate_project_member',
    jsonb_build_object(
      'project_id', p_project_id,
      'profile_id', p_profile_id,
      'role',       v_target_role
    )
  );
end;
$$;

comment on function public.add_project_member(uuid, uuid, public.user_role) is
  'Adds or reactivates a project member. Caller must be admin or project_manager.';
comment on function public.update_project_member_role(uuid, uuid, public.user_role) is
  'Updates a project member role. Only admin can assign/revoke admin role.';
comment on function public.deactivate_project_member(uuid, uuid) is
  'Soft-deletes a project membership. Prevents self-deactivation.';


-- =========================================================
-- SECTION 4: Improved storage helper functions
--
-- Replaces the simple storage_project_id() from Stage 1.
-- Path format enforced:
--   projects/{project_id}/reports/{report_id}/{section}/{file}
--
-- New helpers:
--   storage_extract_project_id(name)  → uuid | null
--   storage_extract_report_id(name)   → uuid | null
--   storage_report_is_editable(name)  → boolean
-- =========================================================

-- ---------------------------------------------------------
-- 4a. Extract project_id from storage path
-- ---------------------------------------------------------
create or replace function public.storage_extract_project_id(p_name text)
returns uuid
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_part text;
begin
  -- Expected: projects/{project_id}/reports/{report_id}/{section}/{file}
  if split_part(p_name, '/', 1) <> 'projects' then
    return null;
  end if;

  v_part := split_part(p_name, '/', 2);
  if v_part is null or v_part = '' then
    return null;
  end if;

  return v_part::uuid;
exception
  when invalid_text_representation then
    return null;
end;
$$;

-- ---------------------------------------------------------
-- 4b. Extract report_id from storage path
-- ---------------------------------------------------------
create or replace function public.storage_extract_report_id(p_name text)
returns uuid
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_part text;
begin
  -- Expected: projects/{project_id}/reports/{report_id}/{section}/{file}
  if split_part(p_name, '/', 1) <> 'projects' then
    return null;
  end if;

  if split_part(p_name, '/', 3) <> 'reports' then
    return null;
  end if;

  v_part := split_part(p_name, '/', 4);
  if v_part is null or v_part = '' then
    return null;
  end if;

  return v_part::uuid;
exception
  when invalid_text_representation then
    return null;
end;
$$;

-- ---------------------------------------------------------
-- 4c. Validate report belongs to project in path
--     AND report is editable (draft/returned, not locked)
-- ---------------------------------------------------------
create or replace function public.storage_report_is_editable(p_name text)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_project_id uuid;
  v_report_id  uuid;
  v_report     public.reports;
begin
  v_project_id := public.storage_extract_project_id(p_name);
  v_report_id  := public.storage_extract_report_id(p_name);

  if v_project_id is null or v_report_id is null then
    return false;
  end if;

  select * into v_report
  from public.reports
  where id         = v_report_id
    and project_id = v_project_id
    and status     in ('draft', 'returned')
    and locked     = false;

  return found;
end;
$$;

-- ---------------------------------------------------------
-- 4d. Recreate storage policies using improved helpers
--     (drop old policies from Stage 1 first)
-- ---------------------------------------------------------

drop policy if exists "Project members can read report files"   on storage.objects;
drop policy if exists "Project members can upload report files" on storage.objects;
drop policy if exists "Project members can update report files" on storage.objects;
drop policy if exists "Project members can delete report files" on storage.objects;

-- READ: any active project member may download
create policy "Project members can read report files"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'daily-report-files'
  and public.is_project_member(
    public.storage_extract_project_id(name)
  )
);

-- INSERT: project member + report must be draft/returned/unlocked
create policy "Project members can upload report files"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'daily-report-files'
  and public.is_project_member(
    public.storage_extract_project_id(name)
  )
  and public.storage_report_is_editable(name)
);

-- UPDATE (replace): same constraint as insert
create policy "Project members can update report files"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'daily-report-files'
  and public.is_project_member(
    public.storage_extract_project_id(name)
  )
  and public.storage_report_is_editable(name)
)
with check (
  bucket_id = 'daily-report-files'
  and public.is_project_member(
    public.storage_extract_project_id(name)
  )
  and public.storage_report_is_editable(name)
);

-- DELETE: project member + report must still be editable
create policy "Project members can delete report files"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'daily-report-files'
  and public.is_project_member(
    public.storage_extract_project_id(name)
  )
  and public.storage_report_is_editable(name)
);

comment on function public.storage_extract_project_id(text) is
  'Extracts project_id UUID from storage path: projects/{pid}/reports/{rid}/...';
comment on function public.storage_extract_report_id(text) is
  'Extracts report_id UUID from storage path: projects/{pid}/reports/{rid}/...';
comment on function public.storage_report_is_editable(text) is
  'Returns true only if the report referenced in the path is draft/returned and not locked.';


-- =========================================================
-- SECTION 5: Improved audit log visibility
--
-- Stage 1 audit policy only allows reading logs for
-- the reports table. This section extends visibility
-- to key report detail tables without using dynamic SQL.
-- =========================================================

-- ---------------------------------------------------------
-- 5a. Helper: can current user read audit log for a record?
-- ---------------------------------------------------------
create or replace function public.can_read_audit_log(
  p_table_name text,
  p_record_id  uuid
)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_project_id uuid;
  v_report_id  uuid;
begin
  -- For the reports table: check project membership directly
  if p_table_name = 'reports' then
    select project_id into v_project_id
    from public.reports
    where id = p_record_id;

    return public.is_project_member(v_project_id);
  end if;

  -- For detail tables that have report_id:
  -- resolve parent report → project → membership

  if p_table_name = 'report_work_items' then
    select report_id into v_report_id
    from public.report_work_items
    where id = p_record_id;

  elsif p_table_name = 'report_hse' then
    select report_id into v_report_id
    from public.report_hse
    where id = p_record_id;

  elsif p_table_name = 'report_qaqc' then
    select report_id into v_report_id
    from public.report_qaqc
    where id = p_record_id;

  elsif p_table_name = 'report_issues' then
    select report_id into v_report_id
    from public.report_issues
    where id = p_record_id;

  elsif p_table_name = 'report_actions' then
    select report_id into v_report_id
    from public.report_actions
    where id = p_record_id;

  else
    -- All other tables: deny by default
    return false;
  end if;

  if v_report_id is null then
    return false;
  end if;

  return public.is_report_member(v_report_id);
end;
$$;

-- ---------------------------------------------------------
-- 5b. Replace the Stage 1 audit_logs read policy
-- ---------------------------------------------------------
drop policy if exists "Project members can read audit logs" on public.audit_logs;

create policy "Project members can read audit logs"
on public.audit_logs
for select
to authenticated
using (
  public.can_read_audit_log(table_name, record_id)
);

comment on function public.can_read_audit_log(text, uuid) is
  'Returns true if the current user is a project member for the record
   in the given table. Covers: reports, report_work_items, report_hse,
   report_qaqc, report_issues, report_actions.';


-- =========================================================
-- SECTION 6: Controlled completeness score update
--
-- Frontend calculates completeness, then calls this RPC
-- to persist it. Direct UPDATE on reports.completeness_score
-- from the client is not needed; the RLS update policy
-- covers it only for draft/returned reports, but this RPC
-- adds an explicit validation layer and audit entry.
-- =========================================================

create or replace function public.update_report_completeness(
  p_report_id uuid,
  p_score     int
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_report public.reports;
begin
  -- 1. Validate score range
  if p_score is null or p_score < 0 or p_score > 100 then
    raise exception
      'Completeness score must be between 0 and 100. Got: %', p_score
      using errcode = 'P0001';
  end if;

  -- 2. Load report
  select * into v_report
  from public.reports
  where id = p_report_id;

  if v_report.id is null then
    raise exception 'Report not found.'
      using errcode = 'P0001';
  end if;

  -- 3. Report must be draft or returned
  if v_report.status not in ('draft', 'returned') then
    raise exception
      'Completeness score can only be updated on draft or returned reports. Current status: %',
      v_report.status
      using errcode = 'P0001';
  end if;

  -- 4. Report must not be locked
  if v_report.locked = true then
    raise exception
      'Completeness score cannot be updated on a locked report.'
      using errcode = 'P0001';
  end if;

  -- 5. Caller must have edit rights on this report
  if not public.can_edit_report_detail(p_report_id) then
    raise exception
      'Access denied: caller does not have edit rights on this report.'
      using errcode = 'P0001';
  end if;

  -- 6. Perform update
  update public.reports
  set completeness_score = p_score,
      updated_by         = auth.uid(),
      updated_at         = now()
  where id = p_report_id;
end;
$$;

comment on function public.update_report_completeness(uuid, int) is
  'Safely updates completeness_score. Validates score range, report status,
   lock state, and caller edit rights. No direct client UPDATE needed.';


-- =========================================================
-- SECTION 7: Grant execute on new RPC functions
--
-- All new security-definer functions are granted to
-- authenticated role so Supabase JS client can invoke them.
-- =========================================================

grant execute on function public.add_project_member(uuid, uuid, public.user_role)
  to authenticated;

grant execute on function public.update_project_member_role(uuid, uuid, public.user_role)
  to authenticated;

grant execute on function public.deactivate_project_member(uuid, uuid)
  to authenticated;

grant execute on function public.update_report_completeness(uuid, int)
  to authenticated;

-- Storage helpers: used internally by RLS, not called directly by client.
-- Granting anyway for transparency and potential direct use.
grant execute on function public.storage_extract_project_id(text)
  to authenticated;

grant execute on function public.storage_extract_report_id(text)
  to authenticated;

grant execute on function public.storage_report_is_editable(text)
  to authenticated;

grant execute on function public.can_read_audit_log(text, uuid)
  to authenticated;

grant execute on function public.assert_project_manager_access(uuid)
  to authenticated;


-- =========================================================
-- End of Stage 1C Hardening Migration
-- =========================================================
