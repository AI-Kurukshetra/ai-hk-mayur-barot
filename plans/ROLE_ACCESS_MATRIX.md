# Role Access Matrix (Novopath)

Updated: 2026-03-14

This matrix is aligned to standard laboratory workflow segmentation: pre-analytical, analytical, and post-analytical operations, plus billing and administration controls.

## Roles in App

- Admin -> `tenant_admin`
- Receptionist -> `receptionist`
- Sample Collection Staff -> `phlebotomist`
- Lab Technician -> `technician`
- Pathologist / Doctor -> `pathologist`
- Billing / Accounts -> `finance`

## Module Permissions

| Module | Admin | Receptionist | Sample Collection | Lab Technician | Pathologist/Doctor | Billing/Accounts |
|---|---|---|---|---|---|---|
| Overview Dashboard | Full | View | View | View | View | View |
| Patients | Full | Create/Update/View | No | No | No | No |
| Orders / Registration | Full | Create/Update/View | No | No | No | No |
| Sample Desk | Full | No | Collect/Update Status | Process/Update Status | No | No |
| Tests Catalog | Full | No | No | Manage/View | View | No |
| Results Entry | Full | No | No | Enter/Update | Review/View | No |
| Reports | Full | No | No | No | Release/View | View (read-only) |
| Billing | Full | Create/Collect/View | No | No | No | Manage/View |
| Admin / Settings | Full | No | No | No | No | No |
| Seed / System APIs | Full | No | No | No | No | No |

## Current Code Mapping

- Page guards: `lib/auth/permissions.ts` + `requirePageRoles(...)`
- API guards: `lib/auth/permissions.ts` + `requireApiRoles(...)`
- Role-filtered sidebar: `components/layout/dashboard-shell.tsx`
- Provisioning users: `scripts/provision-role-users.mjs`

## Rationale References

- WHO LQMS workflow model (pre-examination, examination, post-examination):
  - https://www.who.int/publications/i/item/9789241548274
- CDC/CLSI-aligned laboratory quality process emphasis across the full testing cycle:
  - https://www.cdc.gov/labquality/
- CAP role of pathologist in diagnostic interpretation and report authorization context:
  - https://www.cap.org/

## Seeded Test Users

All seeded users currently use password: `Test@123`

- `admin@pathologylabpro.com` -> `tenant_admin`
- `reception@pathologylabpro.com` -> `receptionist`
- `collector@pathologylabpro.com` -> `phlebotomist`
- `technician@pathologylabpro.com` -> `technician`
- `pathologist@pathologylabpro.com` -> `pathologist`
- `billing@pathologylabpro.com` -> `finance`
