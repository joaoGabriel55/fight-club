---
name: code-quality
description: Enforce test coverage, lint, and typecheck for all changes. Automatically runs appropriate tests and quality checks when implementing fixes or new features.
metadata:
  author: user
  version: "1.0.0"
---

# Code Quality Enforcement

Ensure all changes (fixes and new features) have appropriate test coverage and pass lint/typecheck before completion.

## Triggers

This skill activates when the user:
- Implements a bug fix
- Adds a new feature
- Makes changes to backend or frontend code

## Workflow

### Step 1: Analyze the Change

1. Identify the affected service(s): `backend/` or `frontend/` or both
2. Determine the type of change:
   - **Backend change**: Likely needs unit/functional tests using Japa
   - **Frontend change**: Likely needs unit tests using Vitest
   - **Database migration**: Consider if migration test is needed
   - **API endpoint**: Needs functional/API tests
   - **UI component**: Needs unit/component tests

### Step 2: Check for Existing Tests

1. Look for existing test files related to the changed code:
   - Backend: `tests/unit/`, `tests/functional/`
   - Frontend: `src/**/*.test.tsx`, `src/**/*.test.ts`
2. If tests exist, verify they still pass after changes

### Step 3: Create/Update Tests if Appropriate

**When to write tests:**
- New endpoint/controller → add functional test
- New service/model → add unit test
- New React component → add component test
- Bug fix → add regression test
- Business logic change → add unit test

**When tests may be skipped:**
- Simple UI styling changes (no logic)
- Documentation-only changes
- Minor config changes
- Already well-tested existing code being refactored without behavior change

### Step 4: Run Quality Checks

**Backend commands** (run from `backend/`):
```bash
npm run lint     # ESLint
npm run typecheck # TypeScript
npm run test     # Japa tests
```

**Frontend commands** (run from `frontend/`):
```bash
npm run lint     # tsc --noEmit
npm test         # Vitest
```

### Step 5: Report Results

Output results in format:
```
Tests: <passed>/<total> passed
Lint: <pass|fail>
Typecheck: <pass|fail>
```

If any checks fail, report which ones and why.

## Usage

This skill runs automatically when implementing changes. No explicit invocation needed.

If user explicitly asks to "run tests", "check lint", "run typecheck", or similar, also use this skill.

## Notes

- Tests should be idempotent and not depend on external state
- Use existing test patterns from the codebase
- Prefer functional tests for API endpoints
- Prefer unit tests for services/models
- Prefer component tests for React components