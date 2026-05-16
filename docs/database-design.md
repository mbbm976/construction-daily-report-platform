# Database Design

This document describes the production-oriented database structure for the Construction Daily Report & Site Control Platform.

## Design Principle

The system will use normalized PostgreSQL tables instead of storing all report data in one JSONB payload.

This improves:

- Data integrity
- Security
- Dashboard analytics
- Excel export
- Audit trail
- Role-based access control
- Future scalability

## Main Table Groups

### Organization and User Management

- organizations
- profiles
- projects
- project_members

### Daily Reports

- reports
- report_work_items
- report_manhours

### HSE and QA/QC

- report_hse
- report_qaqc

### Resources

- report_equipment
- report_materials
- report_costs

### Issues and Actions

- report_issues
- report_actions

### Evidence and Approval

- report_photos
- report_signatures
- approval_logs
- audit_logs

## Report Status

The report workflow uses the following statuses:

- draft
- submitted
- returned
- approved_by_pm
- approved_by_client
- archived

## Security Principle

All important tables must have Row Level Security enabled.

Users can only access data from projects where they are registered as project members.

Approval actions must be performed through RPC functions, not by directly updating report status from the frontend.
