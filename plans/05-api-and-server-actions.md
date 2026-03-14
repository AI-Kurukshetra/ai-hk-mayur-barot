# 05. API and Server Actions

## Approach
- Prefer Next.js Server Actions for form-driven workflows.
- Use Route Handlers for webhook/integration/public endpoints.
- Validate all input with `zod`.

## Module Contract Examples
- `createPatient(input)` -> `{ patientId }`
- `createOrder(input)` -> `{ orderId, orderNo }`
- `collectSample(input)` -> `{ sampleId, barcode }`
- `saveResult(input)` -> `{ resultId, flags[] }`
- `reviewAndReleaseOrder(input)` -> `{ reportId, releasedAt }`
- `recordPayment(input)` -> `{ paymentId, balance }`

## Route Handler Set (Initial)
- `POST /api/reports/:orderId/generate`
- `GET /api/reports/:reportId/download`
- `POST /api/hooks/payment` (if gateway used later)
- `GET /api/health`

## Error Contract
- Standard response shape:
- `{ code: string, message: string, details?: any }`

- Domain codes examples:
- `ORDER_NOT_FOUND`
- `INVALID_STATUS_TRANSITION`
- `RESULT_LOCKED_AFTER_RELEASE`
- `UNAUTHORIZED_ROLE`

## Status Transition Rules
- Enforce via server action + DB constraint function.
- Invalid transitions fail atomically.

## Concurrency Handling
- Optimistic locking via `updated_at` checks on critical entities.
- Transaction wrapper for multi-table writes (order + items + samples).
