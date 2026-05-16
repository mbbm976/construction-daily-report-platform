-- Stage 1 Migration
-- Construction Daily Report & Site Control Platform
-- Database + Security + Storage Foundation
-- File: supabase/migrations/20260516000000_schema_security_storage.sql

-- IMPORTANT:
-- This migration is designed as the Stage 1 production foundation.
-- Review carefully before running in Supabase SQL Editor.

-- =========================================================
-- 1. PostgreSQL Extension
-- =========================================================

create extension if not exists "pgcrypto";

-- =========================================================
-- 2. Enum Types
-- =========================================================

do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type public.user_role as enum (
      'admin',
      'project_manager',
      'site_engineer',
      'hse_engineer',
      'qaqc_engineer',
      'client_representative',
      'viewer'
    );
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'report_status') then
    create type public.report_status as enum (
      'draft',
      'submitted',
      'returned',
      'approved_by_pm',
      'approved_by_client',
      'archived'
    );
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'severity_level') then
    create type public.severity_level as enum (
      'low',
      'medium',
      'high',
      'critical'
    );
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'action_status') then
    create type public.action_status as enum (
      'open',
      'in_progress',
      'closed',
      'overdue'
    );
  end if;
end $$;

-- =========================================================
-- 3. Core Tables
-- =========================================================

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  registration_no text,
  address text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  organization_id uuid references public.organizations(id) on delete set null,
  full_name text not null,
  role public.user_role not null default 'site_engineer',
  position text,
  company text,
  phone text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  project_name text not null,
  contract_no text,
  client_name text,
  contractor_name text,
  location text,
  start_date date,
  end_date date,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, project_name)
);

create table if not exists public.project_members (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role public.user_role not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (project_id, profile_id)
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,

  report_number text not null,
  report_date date not null,
  shift text not null default 'day',

  weather text,
  temperature numeric(5,2),
  location text,
  zone text,
  level_no text,
  gridline text,

  prepared_by uuid references public.profiles(id),
  created_by uuid references public.profiles(id),
  updated_by uuid references public.profiles(id),

  status public.report_status not null default 'draft',
  completeness_score int not null default 0,
  overall_progress numeric(5,2) not null default 0,

  locked boolean not null default false,

  submitted_at timestamptz,
  approved_pm_at timestamptz,
  approved_client_at timestamptz,
  archived_at timestamptz,

  general_notes text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint reports_completeness_score_check
    check (completeness_score >= 0 and completeness_score <= 100),

  constraint reports_overall_progress_check
    check (overall_progress >= 0 and overall_progress <= 100),

  unique (project_id, report_date, shift),
  unique (project_id, report_number)
);

create table if not exists public.approval_logs (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports(id) on delete cascade,
  action_by uuid references public.profiles(id),
  from_status public.report_status,
  to_status public.report_status,
  action text not null,
  comments text,
  created_at timestamptz not null default now()
);

-- =========================================================
-- 4. Detail Report Tables
-- =========================================================

create table if not exists public.report_work_items (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports(id) on delete cascade,
  team_name text not null,
  wbs_code text,
  activity_code text,
  location_zone text,
  level_no text,
  gridline text,
  work_description text not null,
  unit text,
  planned_qty numeric(14,2) not null default 0,
  actual_qty numeric(14,2) not null default 0,
  cumulative_planned_qty numeric(14,2) not null default 0,
  cumulative_actual_qty numeric(14,2) not null default 0,
  completion_percent numeric(5,2) not null default 0,
  delay_reason text,
  remarks text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint report_work_items_completion_check
    check (completion_percent >= 0 and completion_percent <= 100)
);

create table if not exists public.report_manhours (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports(id) on delete cascade,
  team_name text not null,
  planned_workers int not null default 0,
  actual_workers int not null default 0,
  planned_hours numeric(14,2) not null default 0,
  actual_hours numeric(14,2) not null default 0,
  overtime_hours numeric(14,2) not null default 0,
  idle_hours numeric(14,2) not null default 0,
  work_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.report_hse (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports(id) on delete cascade,
  toolbox_talk_done boolean not null default false,
  toolbox_topic text,
  toolbox_attendance int not null default 0,
  lti int not null default 0,
  mtc int not null default 0,
  fac int not null default 0,
  near_miss int not null default 0,
  unsafe_act int not null default 0,
  unsafe_condition int not null default 0,
  stop_work_count int not null default 0,
  ppe_compliance_percent numeric(5,2) default 100,
  inspection_count int not null default 0,
  open_hse_actions int not null default 0,
  hse_summary text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint report_hse_ppe_check
    check (ppe_compliance_percent >= 0 and ppe_compliance_percent <= 100)
);

create table if not exists public.report_qaqc (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports(id) on delete cascade,
  irn_no text,
  itp_reference text,
  hold_point text,
  witness_point text,
  inspection_result text,
  ncr_no text,
  rfi_no text,
  drawing_reference text,
  drawing_revision text,
  checklist_reference text,
  remarks text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.report_equipment (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports(id) on delete cascade,
  equipment_name text not null,
  equipment_id text,
  status text,
  operator_name text,
  planned_hours numeric(14,2) not null default 0,
  working_hours numeric(14,2) not null default 0,
  idle_hours numeric(14,2) not null default 0,
  breakdown_hours numeric(14,2) not null default 0,
  remarks text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.report_materials (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports(id) on delete cascade,
  material_name text not null,
  unit text,
  planned_qty numeric(14,2) not null default 0,
  actual_qty numeric(14,2) not null default 0,
  received_qty numeric(14,2) not null default 0,
  remaining_qty numeric(14,2) not null default 0,
  variance_qty numeric(14,2) generated always as (actual_qty - planned_qty) stored,
  remarks text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.report_costs (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports(id) on delete cascade,
  planned_total numeric(14,2) not null default 0,
  labor_cost numeric(14,2) not null default 0,
  equipment_cost numeric(14,2) not null default 0,
  material_cost numeric(14,2) not null default 0,
  transport_cost numeric(14,2) not null default 0,
  other_cost numeric(14,2) not null default 0,
  actual_total numeric(14,2) generated always as (
    labor_cost + equipment_cost + material_cost + transport_cost + other_cost
  ) stored,
  remarks text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.report_issues (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports(id) on delete cascade,
  issue_description text not null,
  impact_level public.severity_level not null default 'medium',
  affected_area text,
  delay_hours numeric(14,2) not null default 0,
  responsible_party text,
  recovery_plan text,
  contractual_evidence text,
  status public.action_status not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.report_actions (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports(id) on delete cascade,
  action_no text not null,
  source text,
  action_description text not null,
  responsible_person text,
  due_date date,
  priority public.severity_level not null default 'medium',
  status public.action_status not null default 'open',
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (report_id, action_no)
);

create table if not exists public.report_photos (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports(id) on delete cascade,
  section_name text,
  file_path text not null,
  caption text,
  uploaded_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists public.report_signatures (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports(id) on delete cascade,
  signed_by uuid references public.profiles(id),
  signer_role public.user_role,
  signature_path text,
  meaning text,
  signed_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  table_name text not null,
  record_id uuid,
  actor_id uuid references public.profiles(id),
  action text not null,
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz not null default now()
);

-- =========================================================
-- 5. Updated_at Trigger Helper
-- =========================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_organizations_updated_at on public.organizations;
create trigger trg_organizations_updated_at
before update on public.organizations
for each row execute function public.set_updated_at();

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists trg_projects_updated_at on public.projects;
create trigger trg_projects_updated_at
before update on public.projects
for each row execute function public.set_updated_at();

drop trigger if exists trg_reports_updated_at on public.reports;
create trigger trg_reports_updated_at
before update on public.reports
for each row execute function public.set_updated_at();

-- =========================================================
-- 6. RLS Helper Functions
-- =========================================================

create or replace function public.current_org_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select organization_id
  from public.profiles
  where id = auth.uid()
    and is_active = true
  limit 1;
$$;

create or replace function public.is_project_member(p_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.project_members pm
    where pm.project_id = p_project_id
      and pm.profile_id = auth.uid()
      and pm.is_active = true
  );
$$;

create or replace function public.has_project_role(
  p_project_id uuid,
  allowed_roles public.user_role[]
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.project_members pm
    where pm.project_id = p_project_id
      and pm.profile_id = auth.uid()
      and pm.role = any(allowed_roles)
      and pm.is_active = true
  );
$$;

create or replace function public.is_report_member(p_report_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.reports r
    where r.id = p_report_id
      and public.is_project_member(r.project_id)
  );
$$;

create or replace function public.can_edit_report_detail(p_report_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.reports r
    where r.id = p_report_id
      and r.status in ('draft', 'returned')
      and r.locked = false
      and public.has_project_role(
        r.project_id,
        array[
          'admin',
          'project_manager',
          'site_engineer',
          'hse_engineer',
          'qaqc_engineer'
        ]::public.user_role[]
      )
  );
$$;

create or replace function public.storage_project_id(p_name text)
returns uuid
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_project_id text;
begin
  if split_part(p_name, '/', 1) <> 'projects' then
    return null;
  end if;

  v_project_id := split_part(p_name, '/', 2);

  if v_project_id is null or v_project_id = '' then
    return null;
  end if;

  return v_project_id::uuid;

exception
  when invalid_text_representation then
    return null;
end;
$$;

-- =========================================================
-- 7. Enable Row Level Security
-- =========================================================

alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.project_members enable row level security;
alter table public.reports enable row level security;
alter table public.approval_logs enable row level security;

alter table public.report_work_items enable row level security;
alter table public.report_manhours enable row level security;
alter table public.report_hse enable row level security;
alter table public.report_qaqc enable row level security;
alter table public.report_equipment enable row level security;
alter table public.report_materials enable row level security;
alter table public.report_costs enable row level security;
alter table public.report_issues enable row level security;
alter table public.report_actions enable row level security;
alter table public.report_photos enable row level security;
alter table public.report_signatures enable row level security;
alter table public.audit_logs enable row level security;

-- =========================================================
-- 8. Core RLS Policies
-- =========================================================

drop policy if exists "Organizations are visible to own users" on public.organizations;
create policy "Organizations are visible to own users"
on public.organizations
for select
to authenticated
using (id = public.current_org_id());

drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile"
on public.profiles
for select
to authenticated
using (id = auth.uid());

drop policy if exists "Users can read profiles in own organization" on public.profiles;
create policy "Users can read profiles in own organization"
on public.profiles
for select
to authenticated
using (organization_id = public.current_org_id());

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
on public.profiles
for insert
to authenticated
with check (id = auth.uid());

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "Project members can read projects" on public.projects;
create policy "Project members can read projects"
on public.projects
for select
to authenticated
using (public.is_project_member(id));

drop policy if exists "Project members can read project members" on public.project_members;
create policy "Project members can read project members"
on public.project_members
for select
to authenticated
using (public.is_project_member(project_id));

drop policy if exists "Project members can read reports" on public.reports;
create policy "Project members can read reports"
on public.reports
for select
to authenticated
using (public.is_project_member(project_id));

drop policy if exists "Authorized users can create draft reports" on public.reports;
create policy "Authorized users can create draft reports"
on public.reports
for insert
to authenticated
with check (
  public.has_project_role(
    project_id,
    array[
      'admin',
      'project_manager',
      'site_engineer',
      'hse_engineer',
      'qaqc_engineer'
    ]::public.user_role[]
  )
  and prepared_by = auth.uid()
  and created_by = auth.uid()
  and status = 'draft'
  and locked = false
);

drop policy if exists "Prepared user can update own draft or returned reports" on public.reports;
create policy "Prepared user can update own draft or returned reports"
on public.reports
for update
to authenticated
using (
  prepared_by = auth.uid()
  and status in ('draft', 'returned')
  and locked = false
  and public.is_project_member(project_id)
)
with check (
  prepared_by = auth.uid()
  and status in ('draft', 'returned')
  and locked = false
);

drop policy if exists "Project members can read approval logs" on public.approval_logs;
create policy "Project members can read approval logs"
on public.approval_logs
for select
to authenticated
using (public.is_report_member(report_id));

drop policy if exists "Authenticated users can insert approval logs through controlled functions" on public.approval_logs;
create policy "Authenticated users can insert approval logs through controlled functions"
on public.approval_logs
for insert
to authenticated
with check (action_by = auth.uid());

-- No update/delete policies for approval_logs.
-- Approval logs are intentionally immutable.

-- =========================================================
-- 9. Detail Table RLS Policies
-- =========================================================

drop policy if exists "Members can read work items" on public.report_work_items;
create policy "Members can read work items"
on public.report_work_items
for select
to authenticated
using (public.is_report_member(report_id));

drop policy if exists "Editors can insert work items" on public.report_work_items;
create policy "Editors can insert work items"
on public.report_work_items
for insert
to authenticated
with check (public.can_edit_report_detail(report_id));

drop policy if exists "Editors can update work items" on public.report_work_items;
create policy "Editors can update work items"
on public.report_work_items
for update
to authenticated
using (public.can_edit_report_detail(report_id))
with check (public.can_edit_report_detail(report_id));

drop policy if exists "Members can read manhours" on public.report_manhours;
create policy "Members can read manhours"
on public.report_manhours
for select
to authenticated
using (public.is_report_member(report_id));

drop policy if exists "Editors can insert manhours" on public.report_manhours;
create policy "Editors can insert manhours"
on public.report_manhours
for insert
to authenticated
with check (public.can_edit_report_detail(report_id));

drop policy if exists "Editors can update manhours" on public.report_manhours;
create policy "Editors can update manhours"
on public.report_manhours
for update
to authenticated
using (public.can_edit_report_detail(report_id))
with check (public.can_edit_report_detail(report_id));

drop policy if exists "Members can read hse" on public.report_hse;
create policy "Members can read hse"
on public.report_hse
for select
to authenticated
using (public.is_report_member(report_id));

drop policy if exists "Editors can insert hse" on public.report_hse;
create policy "Editors can insert hse"
on public.report_hse
for insert
to authenticated
with check (public.can_edit_report_detail(report_id));

drop policy if exists "Editors can update hse" on public.report_hse;
create policy "Editors can update hse"
on public.report_hse
for update
to authenticated
using (public.can_edit_report_detail(report_id))
with check (public.can_edit_report_detail(report_id));

drop policy if exists "Members can read qaqc" on public.report_qaqc;
create policy "Members can read qaqc"
on public.report_qaqc
for select
to authenticated
using (public.is_report_member(report_id));

drop policy if exists "Editors can insert qaqc" on public.report_qaqc;
create policy "Editors can insert qaqc"
on public.report_qaqc
for insert
to authenticated
with check (public.can_edit_report_detail(report_id));

drop policy if exists "Editors can update qaqc" on public.report_qaqc;
create policy "Editors can update qaqc"
on public.report_qaqc
for update
to authenticated
using (public.can_edit_report_detail(report_id))
with check (public.can_edit_report_detail(report_id));

drop policy if exists "Members can read equipment" on public.report_equipment;
create policy "Members can read equipment"
on public.report_equipment
for select
to authenticated
using (public.is_report_member(report_id));

drop policy if exists "Editors can insert equipment" on public.report_equipment;
create policy "Editors can insert equipment"
on public.report_equipment
for insert
to authenticated
with check (public.can_edit_report_detail(report_id));

drop policy if exists "Editors can update equipment" on public.report_equipment;
create policy "Editors can update equipment"
on public.report_equipment
for update
to authenticated
using (public.can_edit_report_detail(report_id))
with check (public.can_edit_report_detail(report_id));

drop policy if exists "Members can read materials" on public.report_materials;
create policy "Members can read materials"
on public.report_materials
for select
to authenticated
using (public.is_report_member(report_id));

drop policy if exists "Editors can insert materials" on public.report_materials;
create policy "Editors can insert materials"
on public.report_materials
for insert
to authenticated
with check (public.can_edit_report_detail(report_id));

drop policy if exists "Editors can update materials" on public.report_materials;
create policy "Editors can update materials"
on public.report_materials
for update
to authenticated
using (public.can_edit_report_detail(report_id))
with check (public.can_edit_report_detail(report_id));

drop policy if exists "Members can read costs" on public.report_costs;
create policy "Members can read costs"
on public.report_costs
for select
to authenticated
using (public.is_report_member(report_id));

drop policy if exists "Editors can insert costs" on public.report_costs;
create policy "Editors can insert costs"
on public.report_costs
for insert
to authenticated
with check (public.can_edit_report_detail(report_id));

drop policy if exists "Editors can update costs" on public.report_costs;
create policy "Editors can update costs"
on public.report_costs
for update
to authenticated
using (public.can_edit_report_detail(report_id))
with check (public.can_edit_report_detail(report_id));

drop policy if exists "Members can read issues" on public.report_issues;
create policy "Members can read issues"
on public.report_issues
for select
to authenticated
using (public.is_report_member(report_id));

drop policy if exists "Editors can insert issues" on public.report_issues;
create policy "Editors can insert issues"
on public.report_issues
for insert
to authenticated
with check (public.can_edit_report_detail(report_id));

drop policy if exists "Editors can update issues" on public.report_issues;
create policy "Editors can update issues"
on public.report_issues
for update
to authenticated
using (public.can_edit_report_detail(report_id))
with check (public.can_edit_report_detail(report_id));

drop policy if exists "Members can read actions" on public.report_actions;
create policy "Members can read actions"
on public.report_actions
for select
to authenticated
using (public.is_report_member(report_id));

drop policy if exists "Editors can insert actions" on public.report_actions;
create policy "Editors can insert actions"
on public.report_actions
for insert
to authenticated
with check (public.can_edit_report_detail(report_id));

drop policy if exists "Editors can update actions" on public.report_actions;
create policy "Editors can update actions"
on public.report_actions
for update
to authenticated
using (public.can_edit_report_detail(report_id))
with check (public.can_edit_report_detail(report_id));

drop policy if exists "Members can read photos" on public.report_photos;
create policy "Members can read photos"
on public.report_photos
for select
to authenticated
using (public.is_report_member(report_id));

drop policy if exists "Editors can insert photos" on public.report_photos;
create policy "Editors can insert photos"
on public.report_photos
for insert
to authenticated
with check (
  public.can_edit_report_detail(report_id)
  and uploaded_by = auth.uid()
);

drop policy if exists "Members can read signatures" on public.report_signatures;
create policy "Members can read signatures"
on public.report_signatures
for select
to authenticated
using (public.is_report_member(report_id));

drop policy if exists "Members can insert signatures" on public.report_signatures;
create policy "Members can insert signatures"
on public.report_signatures
for insert
to authenticated
with check (
  public.is_report_member(report_id)
  and signed_by = auth.uid()
);

drop policy if exists "Project members can read audit logs" on public.audit_logs;
create policy "Project members can read audit logs"
on public.audit_logs
for select
to authenticated
using (
  case
    when table_name = 'reports' then
      exists (
        select 1
        from public.reports r
        where r.id = record_id
          and public.is_project_member(r.project_id)
      )
    else false
  end
);

-- No public insert/update/delete policies for audit_logs.
-- Audit logs are written by triggers only.

-- =========================================================
-- 10. Approval Workflow RPC Functions
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

  update public.reports
  set status = 'submitted',
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

  if v_report.status = 'submitted' and not public.has_project_role(
    v_report.project_id,
    array['admin', 'project_manager']::public.user_role[]
  ) then
    raise exception 'Only project manager can return submitted reports';
  end if;

  if v_report.status = 'approved_by_pm' and not public.has_project_role(
    v_report.project_id,
    array['admin', 'client_representative']::public.user_role[]
  ) then
    raise exception 'Only client representative can return PM-approved reports';
  end if;

  update public.reports
  set status = 'returned',
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
  ) then
    raise exception 'Only project manager can approve this report';
  end if;

  if v_report.status <> 'submitted' then
    raise exception 'Only submitted reports can be approved by PM';
  end if;

  update public.reports
  set status = 'approved_by_pm',
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
  ) then
    raise exception 'Only client representative can approve this report';
  end if;

  if v_report.status <> 'approved_by_pm' then
    raise exception 'Only PM-approved reports can be approved by client';
  end if;

  update public.reports
  set status = 'approved_by_client',
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
  ) then
    raise exception 'Only admin or project manager can archive reports';
  end if;

  if v_report.status <> 'approved_by_client' then
    raise exception 'Only client-approved reports can be archived';
  end if;

  update public.reports
  set status = 'archived',
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
-- 11. Audit Trigger
-- =========================================================

create or replace function public.audit_changes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_record_id uuid;
begin
  v_record_id := coalesce(new.id, old.id);

  insert into public.audit_logs (
    table_name,
    record_id,
    actor_id,
    action,
    old_data,
    new_data
  )
  values (
    tg_table_name,
    v_record_id,
    auth.uid(),
    tg_op,
    to_jsonb(old),
    to_jsonb(new)
  );

  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_audit_reports on public.reports;
create trigger trg_audit_reports
after insert or update or delete on public.reports
for each row execute function public.audit_changes();

drop trigger if exists trg_audit_report_work_items on public.report_work_items;
create trigger trg_audit_report_work_items
after insert or update or delete on public.report_work_items
for each row execute function public.audit_changes();

drop trigger if exists trg_audit_report_hse on public.report_hse;
create trigger trg_audit_report_hse
after insert or update or delete on public.report_hse
for each row execute function public.audit_changes();

drop trigger if exists trg_audit_report_qaqc on public.report_qaqc;
create trigger trg_audit_report_qaqc
after insert or update or delete on public.report_qaqc
for each row execute function public.audit_changes();

drop trigger if exists trg_audit_report_issues on public.report_issues;
create trigger trg_audit_report_issues
after insert or update or delete on public.report_issues
for each row execute function public.audit_changes();

drop trigger if exists trg_audit_report_actions on public.report_actions;
create trigger trg_audit_report_actions
after insert or update or delete on public.report_actions
for each row execute function public.audit_changes();

-- =========================================================
-- 12. Supabase Storage Bucket and Policies
-- =========================================================

insert into storage.buckets (
  id,
  name,
  public
)
values (
  'daily-report-files',
  'daily-report-files',
  false
)
on conflict (id) do update
set public = false;

drop policy if exists "Project members can read report files" on storage.objects;
create policy "Project members can read report files"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'daily-report-files'
  and public.is_project_member(public.storage_project_id(name))
);

drop policy if exists "Project members can upload report files" on storage.objects;
create policy "Project members can upload report files"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'daily-report-files'
  and public.is_project_member(public.storage_project_id(name))
);

-- Required storage path format:
-- projects/{project_id}/reports/{report_id}/photos/{file_name}
-- projects/{project_id}/reports/{report_id}/signatures/{file_name}
-- projects/{project_id}/reports/{report_id}/exports/{file_name}

-- =========================================================
-- 13. Demo Organization and Project
-- =========================================================

insert into public.organizations (
  name,
  registration_no,
  address
)
values (
  'Demo Organization',
  'DEMO-001',
  'Ulaanbaatar, Mongolia'
)
on conflict (name) do nothing;

insert into public.projects (
  organization_id,
  project_name,
  contract_no,
  client_name,
  contractor_name,
  location
)
select
  o.id,
  'Demo Construction Project',
  'DEMO-CONTRACT-001',
  'Demo Client',
  'Demo Contractor',
  'Darkhan, Mongolia'
from public.organizations o
where o.name = 'Demo Organization'
on conflict (organization_id, project_name) do nothing;

-- =========================================================
-- End of Stage 1 Migration
-- =========================================================
