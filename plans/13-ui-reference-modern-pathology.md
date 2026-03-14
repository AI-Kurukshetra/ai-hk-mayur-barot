# 13. UI Reference and Direction (Pathology)

## Live Reference Websites
- Quest Diagnostics: https://www.questdiagnostics.com/
- Labcorp: https://www.labcorp.com/
- Unilabs: https://unilabs.com/
- Dr Lal PathLabs: https://www.lalpathlabs.com/
- Aster Labs: https://www.asterlabs.in/

## What to Borrow (Not Copy)
- Fast trust signaling above the fold (accreditation, coverage, reliability numbers).
- Clear split for user intents: `Book Test`, `Find Lab`, `Get Report`, `For Doctors`.
- Strong service cards with short turnaround and sample-type labels.
- Frictionless report access entry point visible in header.
- Operational credibility section: quality certifications + processing SLAs.

## Product UI Style Direction
- Tone: clinical, calm, modern, high confidence.
- Palette: teal + cyan + slate neutrals (already started in `app/globals.css`).
- Layout: compact dashboards, strong table readability, explicit status chips.
- Typography: humanist sans, medium contrast, data-dense but breathable spacing.

## LIS Screen Patterns to Implement
- Queue-first views for `samples`, `results`, `reviews`.
- Sticky action bars in data-heavy workflows.
- Timeline panel for order lifecycle with timestamped events.
- Critical value flags with clear escalation UX and audit requirement.
- Printable/report-friendly surfaces for clinician-facing output.

## Immediate UI Execution Plan
1. Build reusable dashboard shell (header, side nav, tenant/user badge).
2. Build base data table component with filter chips and status pills.
3. Design `Orders` and `Results` pages first; these are the highest-frequency screens.
4. Add consistent empty/loading/error states for all data grids.

## References
- https://www.questdiagnostics.com/
- https://www.labcorp.com/
- https://unilabs.com/
- https://www.lalpathlabs.com/
- https://www.asterlabs.in/
