# Role Permission Matrix

This document defines user roles and permissions for the Construction Daily Report & Site Control Platform.

## Roles

| Role | Description |
|---|---|
| admin | Full system administrator |
| project_manager | Project manager responsible for review and approval |
| site_engineer | Site engineer preparing daily reports |
| hse_engineer | HSE engineer responsible for safety records |
| qaqc_engineer | QA/QC engineer responsible for inspection records |
| client_representative | Client or consultant representative for final approval |
| viewer | Read-only user |

## Permission Matrix

| Function | Admin | Project Manager | Site Engineer | HSE Engineer | QA/QC Engineer | Client Representative | Viewer |
|---|---:|---:|---:|---:|---:|---:|---:|
| View project | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| Create draft report | Yes | Yes | Yes | Limited | Limited | No | No |
| Edit own draft | Yes | Yes | Yes | Limited | Limited | No | No |
| Submit report | Yes | Yes | Yes | Yes | Yes | No | No |
| Return report | Yes | Yes | No | No | No | No | No |
| Approve by PM | Yes | Yes | No | No | No | No | No |
| Approve by Client | Yes | No | No | No | No | Yes | No |
| Archive report | Yes | Yes | No | No | No | No | No |
| Upload photos | Yes | Yes | Yes | Yes | Yes | No | No |
| Sign report | Yes | Yes | Yes | Yes | Yes | Yes | No |
| Export Excel/PDF | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| Manage users | Yes | No | No | No | No | No | No |

## Approval Rule

Reports must follow this workflow:

Draft → Submitted → Returned or Approved by PM → Approved by Client → Archived

Approved or archived reports must be locked and read-only.
