# 06. Frontend Plan (Next.js App Router)

## App Structure
- `app/(auth)/login`
- `app/(dashboard)/overview`
- `app/(dashboard)/patients`
- `app/(dashboard)/orders`
- `app/(dashboard)/samples`
- `app/(dashboard)/results`
- `app/(dashboard)/reports`
- `app/(dashboard)/billing`
- `app/(dashboard)/admin`

## UI Modules
- Shared layout: tenant switch context, top nav, quick actions.
- Data tables: server-side pagination, filters, status chips.
- Forms: schema-driven validation, optimistic UX where safe.
- Workflow timeline: order lifecycle progression view.

## State and Data Fetching
- Server Components for initial page data.
- Server Actions for mutations.
- Client components only for interactive controls/charts.
- Cache invalidation via `revalidatePath` and tag strategy.

## UX Guardrails
- No direct mutation from client without server validation.
- Confirmation dialog for irreversible actions (release report, delete draft order).
- Color-safe status indicators for accessibility.

## MVP Screens
- Login
- Dashboard (TAT, pending reviews, daily revenue)
- Patient list + create/edit
- Order create + item add/remove
- Sample collection queue
- Result entry + abnormal flag highlights
- Pathologist review + release
- Billing and payment receipt
- Report viewer/download
