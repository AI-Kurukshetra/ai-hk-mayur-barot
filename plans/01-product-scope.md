# 01. Product Scope

## Product Definition
- Product name: `PathologyLab Pro`
- Domain: `Healthcare`
- Category: `Laboratory Information System (LIS)`
- Goal: Manage end-to-end pathology workflow from test booking to validated report delivery.

## Primary User Personas
- `Lab Admin`: master data, users, pricing, billing rules, dashboards.
- `Receptionist`: patient registration, order intake, payment collection.
- `Phlebotomist`: sample collection tracking, barcode labeling, handoff.
- `Technician`: sample processing, result entry, rerun flags.
- `Pathologist`: review/authorize results, sign-off, critical value handling.
- `Account/Finance`: invoices, refunds, reconciliation, receivables.
- `Patient/Referrer`: report access and status tracking (controlled scope).

## Core Modules (MVP)
- Patient management
- Test catalog and profiles/panels
- Order lifecycle and sample tracking
- Result entry and validation workflow
- Report generation and distribution
- Billing and payment tracking
- Audit logs and operational dashboards

## Out of Scope (Phase 1)
- Complex instrument middleware integrations
- AI diagnosis engines
- Multi-country tax engine
- Native mobile apps

## Functional Requirements (High-Level)
- Create and maintain patient demographics and identifiers.
- Register orders with one or many tests.
- Generate unique accession/order IDs and sample barcodes.
- Track status transitions: `ordered -> collected -> processing -> reviewed -> released`.
- Record test result values with reference range checks.
- Require pathologist authorization before release.
- Produce downloadable report PDFs (versioned).
- Maintain immutable audit trail for critical events.

## Non-Functional Requirements
- Availability target: `99.9%` for production.
- Median page load under `2s` for core workflows.
- Strong access control (role and tenant aware).
- Full traceability for order/result edits.

## Success Metrics
- TAT improvement by >= `20%` in 3 months.
- Report release error rate < `1%`.
- Billing leakage reduction by >= `15%`.
- User adoption: > `80%` of lab operations through system within 30 days go-live.
