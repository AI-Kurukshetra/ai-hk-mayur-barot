# 07. Implementation Phases

## Phase 0: Foundation (Week 1)
- Initialize Next.js app and repo standards.
- Setup Supabase project, environments, secrets.
- Configure linting, formatting, commit hooks, CI basics.
- Deliverable: running app with auth scaffold and health checks.

## Phase 1: Core Master Data (Week 2)
- Tenant/profile/patient/test catalog schema + UI.
- RBAC baseline and protected routes.
- Deliverable: user can login and manage patients/tests by role.

## Phase 2: Order to Sample Workflow (Weeks 3-4)
- Order creation with multi-test items.
- Sample barcode generation and collection/receipt flow.
- Deliverable: full trace from order creation to sample receipt.

## Phase 3: Results and Release (Weeks 5-6)
- Result entry, validation, abnormal flagging.
- Pathologist review and report release pipeline.
- Deliverable: released report generation and downloadable artifact.

## Phase 4: Billing and Operational Dashboards (Week 7)
- Invoice summary, payments, balances.
- Dashboard KPIs for operations and finance.
- Deliverable: end-to-end transaction visibility.

## Phase 5: Hardening and Go-Live (Week 8)
- Security checks, performance tuning, UAT closure.
- Backup/restore drills and rollout checklist.
- Deliverable: production launch readiness.

## Exit Criteria (Global)
- Critical workflows pass UAT scripts.
- No P1 defects open.
- RLS and audit checks signed off.
- Rollback and incident runbook validated.
