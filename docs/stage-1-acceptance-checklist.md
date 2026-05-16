# Stage 1 Acceptance Checklist

Stage 1 is focused on database, security, storage, audit, and approval workflow foundation.

## Repository Setup

- [x] GitHub repository created
- [x] README.md created
- [x] .env.example created
- [x] supabase/migrations folder created
- [x] Stage 1 SQL migration file created
- [ ] docs folder created

## Supabase Database

- [ ] Supabase project created
- [ ] pgcrypto extension included
- [ ] Enum types created
- [ ] Core tables created
- [ ] Detail report tables created
- [ ] Unique constraints added
- [ ] Check constraints added

## Security

- [ ] Row Level Security enabled on all required tables
- [ ] current_org_id() helper function created
- [ ] is_project_member() helper function created
- [ ] has_project_role() helper function created
- [ ] Helper functions use security definer
- [ ] Helper functions use set search_path = public

## Approval Workflow

- [ ] submit_report() RPC created
- [ ] return_report() RPC created
- [ ] approve_report_by_pm() RPC created
- [ ] approve_report_by_client() RPC created
- [ ] archive_report() RPC created
- [ ] Approval logs are insert-only
- [ ] Client approved report is locked

## Storage

- [ ] Private bucket design prepared
- [ ] daily-report-files bucket planned
- [ ] Project-based file path format defined
- [ ] Only project members can read/upload files

## Audit

- [ ] audit_logs table created
- [ ] audit trigger function created
- [ ] Audit triggers attached to key tables

## Final Validation

- [ ] Non-project member cannot view project reports
- [ ] Site engineer can create draft report
- [ ] Submitted report cannot be edited directly
- [ ] Project manager can approve or return submitted report
- [ ] Client representative can final approve PM-approved report
- [ ] Locked report cannot be edited
