# 04. Auth and RBAC

## Authentication
- Supabase email/password for internal users.
- Optional magic link for patient/report portal.
- Session handled server-side in Next.js with secure cookie strategy.

## Role Model
- `super_admin`: all tenants (restricted to platform ops)
- `tenant_admin`: full access within one tenant
- `receptionist`
- `phlebotomist`
- `technician`
- `pathologist`
- `finance`
- `patient_portal` (limited self-access)

## Permission Matrix (Summary)
- Patient CRUD: admin, receptionist
- Order create/update: receptionist, admin
- Sample collect/receive: phlebotomist, technician
- Result entry/edit pre-review: technician
- Result review/release: pathologist
- Billing/payment actions: receptionist, finance, admin
- User/role management: tenant_admin

## Enforcement Layers
- UI guard: hide non-permitted routes/actions.
- Server guard: role checks in every server action/route handler.
- DB guard: RLS as final enforcement.

## Identity Claims
- JWT custom claims include `tenant_id`, `role`, `profile_id`.
- Refresh claim sync on role/tenant change.

## Audit Requirements
- Log auth events: login success/failure, password reset, forced logout.
- Log authorization-sensitive actions: result release, payment edits, role changes.
