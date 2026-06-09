---
name: review-ticket
description: Review a ticket for clarity. Checks that it has a clear goal, acceptance criteria, and a verification section. Use when asked to review a ticket, check a ticket, or audit a ticket.
---

You are reviewing a ticket for implementation readiness. A ticket is ready when a developer can pick it up cold and know exactly what to build, how to verify it works, and how to test it.

## Step 1 — Read the ticket

Ask the user to paste the ticket content, or read it from the path they provide (e.g. `docs/tickets.md`). Identify the ticket by name/number.

## Step 2 — Check the three required sections

Evaluate each section against the criteria below. Be specific: quote the ticket text when something is unclear or missing.

### Goal
- Is there a single, concrete problem statement or user need?
- Could a new developer understand *why* this ticket exists without reading other docs?
- Flag: vague verbs ("improve," "handle," "support") without a defined boundary.

### Acceptance Criteria
- Is each criterion independently verifiable? (Can someone check it as pass/fail?)
- Do the criteria fully cover the goal — no gaps?
- Are edge cases and error paths included, not just the happy path?
- Flag: criteria that describe implementation ("use X library") instead of behavior ("user sees Y").

### Verification
- Does the ticket have a test strategy section?
- If not, **write one now** (see format below). If one exists, check it against the format.

## Step 3 — Write or fix the Verification section

The verification section is a **test strategy proposal** — not tests, just the plan. Format:

```
## Verification

**Behaviors to cover**
- [list the observable behaviors that acceptance criteria map to]

**Test types needed**
- [unit / integration / E2E — one line per type, with rationale]

**Mocks to avoid**
- [list what must NOT be mocked — real DB, real auth, real external calls — and why]

**Edge cases**
- [inputs, states, or sequences that could break the feature]

**Commands to run**
- [exact npm/vitest/playwright commands for this ticket's tests]

**How we'll know the tests are meaningful**
- [what a passing suite actually proves; what it would miss]
```

Keep each bullet concrete and short. If the ticket is about a server action, note that Vitest integration tests should use the real test DB (`prisma/test.db`), not mocks — per project convention.

## Step 4 — Output your review

Structure your response as:

**Goal** — clear / needs work + one-line note  
**Acceptance Criteria** — clear / needs work + specific gaps  
**Verification** — present / missing, then the full proposed verification block  

End with a one-sentence verdict: ready to implement, or what must be fixed first.
