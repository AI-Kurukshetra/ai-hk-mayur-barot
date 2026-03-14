# 08. Testing and QA Plan

## Test Pyramid
- Unit tests: domain logic, validators, formatters.
- Integration tests: server actions with test DB schema.
- E2E tests: critical lab workflows (Playwright).

## Priority E2E Scenarios
- Register patient -> create order -> collect sample -> enter result -> release report.
- Unauthorized user attempts restricted action.
- Payment partial/full and balance update.
- Report download permission and expiry checks.

## Data Integrity Tests
- Unique key conflict checks (order_no, barcode).
- Status transition invalid path tests.
- RLS isolation across tenants.

## Non-Functional Tests
- Page/API latency benchmarks on high-volume lists.
- Basic load test for order creation and listing.
- Security checks: SQL injection, auth bypass, IDOR attempts.

## UAT Checklist
- Role-wise scripts signed by business owner.
- Regulatory and audit expectations verified.
- Production smoke test script prepared.
