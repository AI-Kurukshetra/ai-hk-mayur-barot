# PathologyLab Pro Planning Pack

This planning pack converts the available NovoPath-style project intent into an implementation-ready plan using only:
- Next.js (App Router)
- Supabase (Postgres, Auth, Storage, Realtime, Edge Functions where needed)
- Vercel (hosting, preview deployments, environment management)

## Planning Files
- `01-product-scope.md`: business goals, users, modules, boundaries
- `02-system-architecture.md`: target architecture and request/data flow
- `03-data-model-supabase.md`: schema, relationships, indexing, RLS strategy
- `04-auth-rbac.md`: auth flows, role model, permission matrix
- `05-api-and-server-actions.md`: API/server action contracts and validation patterns
- `06-frontend-app-router.md`: route map, UI modules, state/data patterns
- `07-implementation-phases.md`: milestone plan with deliverables and exit criteria
- `08-testing-qa.md`: test strategy, acceptance gates, non-functional checks
- `09-devops-vercel.md`: environments, CI/CD, deployment and rollback runbook
- `10-security-compliance.md`: security baseline for healthcare-style data
- `11-open-questions.md`: assumptions, unresolved decisions, product clarifications

## Note
The file `novopath_blueprint_20260309_192424.pdf` currently contains plain text and not a valid PDF binary. Plans here are built from available project notes and a practical LIS baseline.
