<img width="1880" height="952" alt="image" src="https://github.com/user-attachments/assets/498eb089-3014-4589-b7ce-473a57b531f7" /># Stage 1 Acceptance Checklist

Stage 1 is focused on database, security, storage, audit, and approval workflow foundation.

## Repository Setup

- [x] GitHub repository created
- [x] README.md created
- [x] .env.example created
- [x] supabase/migrations folder created
- [x] Stage 1 SQL migration file created
- [x] docs folder created

## Supabase Database

- [x] Supabase project created
- [x] pgcrypto extension included
- [x] Enum types created
- [x] Core tables created
- [x] Detail report tables created
- [x] Unique constraints added
- [x] Check constraints added
- [x] Demo organization inserted
- [x] Demo project inserted

## Security

- [x] Row Level Security enabled on all required tables
- [x] current_org_id() helper function created
- [x] is_project_member() helper function created
- [x] has_project_role() helper function created
- [x] is_report_member() helper function created
- [x] can_edit_report_detail() helper function created
- [x] Helper functions use security definer
- [x] Helper functions use set search_path = public

## Approval Workflow

- [x] submit_report() RPC created
- [x] return_report() RPC created
- [x] approve_report_by_pm() RPC created
- [x] approve_report_by_client() RPC created
- [x] archive_report() RPC created
- [x] Approval logs are insert-only
- [x] Client approved report is locked

## Storage

- [x] Private bucket design prepared
- [x] daily-report-files bucket created
- [x] Storage bucket confirmed as private
- [x] Project-based file path format defined
- [x] Only project members can read/upload files
- [x] Storage read policy created
- [x] Storage upload policy created

## Audit

- [x] audit_logs table created
- [x] audit trigger function created
- [x] Audit triggers attached to key tables

## Verification Completed

- [x] Public tables verified in Table Editor
- [x] RLS verified as true on public tables
- [x] Storage bucket verified with public = false
- [x] Approval RPC functions verified
- [x] Storage policies verified
- [x] Demo organization verified
- [x] Demo project verified

## Remaining Stage 1 Hardening Tests

- [x] Create real test users
- [x] Insert test profiles
- [x] Assign users to project_members
- [x] Test RLS with site engineer user
- [x] Test RLS with project manager user
- [x] Test RLS with client representative user
- [x] Test report submit → PM approval → client approval workflow
- [x] Test locked report cannot be edited
- [x] Test storage upload with project-based folder path
## Stage 1 Verification Result

Stage 1 backend foundation has been tested successfully.

Verified results:

- Supabase project was created successfully.
- Public database tables were created successfully.
- Row Level Security was enabled on all public tables.
- Private storage bucket was confirmed with `public = false`.
- Storage read and upload policies were verified.
- Demo organization and demo project were created successfully.
- Test users were created for Site Engineer, Project Manager, and Client Representative roles.
- Test user profiles were inserted successfully.
- Users were assigned to the project through `project_members`.
- Draft daily report was created successfully.
- Completeness score validation was tested and confirmed.
- Report submission workflow was tested successfully.
- Project Manager approval workflow was tested successfully.
- Client Representative final approval workflow was tested successfully.
- Approval history was recorded correctly in `approval_logs`.

Stage 1 is accepted as the backend foundation for the Construction Daily Report & Site Control Platform.
