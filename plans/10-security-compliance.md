# 10. Security and Compliance Baseline

## Data Protection
- Encrypt data in transit (TLS) and at rest (managed by Supabase).
- Avoid storing unnecessary PHI/PII fields.
- Redact sensitive values in logs.

## Access Control
- Principle of least privilege for all roles.
- Service role key restricted to server-side environment only.
- Admin actions require explicit role checks and audit writes.

## Auditability
- Immutable audit log entries for clinical and financial actions.
- Capture actor, timestamp, entity, and before/after state where relevant.

## Application Security
- Input validation at all boundaries.
- Output encoding in UI rendering contexts.
- CSRF-safe patterns for authenticated mutations.

## Compliance Readiness (Practical)
- Data retention policy documented per entity type.
- Consent and privacy notice workflow for patient data.
- Access review cadence and user de-provisioning process.
