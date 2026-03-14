# 11. Open Questions and Assumptions

## Current Assumptions
- Single-tenant onboarding first, but schema is tenant-ready.
- Internal users are managed centrally by tenant admins.
- Report format v1 is PDF only.
- Payment gateway integration is post-MVP.

## Open Product Questions
- Should patients have direct portal access in MVP?
- Is doctor/referrer portal required in phase 1 or phase 2?
- What is mandatory for barcode format (Code128/QR/custom)?
- Which abnormal result rules are fixed vs configurable?
- Need partial report release per test, or only per order?

## Open Technical Questions
- Use Supabase Edge Functions for report generation or keep in Next.js server route?
- Which email/SMS provider will be used for notifications?
- Required data import from legacy LIS?

## Decision Log Template
- Decision:
- Date:
- Owner:
- Options considered:
- Final choice:
- Impact:
