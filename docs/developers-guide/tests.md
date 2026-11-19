---
layout: default
title: Tests
parent: Developer's Guide
nav_order: 2
---

# Testing

Slides Power Toys has two complementary test layers: fast local unit tests and live Google Slides integration tests.

## Local Unit Tests & Type Checking

Run locally in milliseconds with zero external dependencies (Node's built-in `node:test` runner):

```bash
npm test
npm run typecheck
```

The harness in `tests/unit/helpers/gas-env.js` evaluates `src/*.js` inside a shared Node `vm` context (matching Google Apps Script's shared global namespace) against lightweight `SlidesApp` mocks, including RPC call-count assertions.

## Live Google Slides Integration Tests

The integration suite lives in `src/tests/tests.js` and includes a self-contained TAP runner (no external network fetch or `eval`).

1. Deploy to your test project:

   ```bash
   ./src/deploy.sh test
   ```

2. Open the Apps Script editor (`cd src && clasp open`), select `tests.gs`, choose `gastTestRunner` in the toolbar dropdown, and click **Run**.
   - If the test script is **bound to a test Google Slides deck**, `SlidesApp.getActivePresentation()` is used automatically.
   - If it is a **standalone** script, set Script Property `TEST_SLIDES_URL` (or `TEST_SLIDES_ID`) in **Project Settings**.
3. Check the **Execution log** for the TAP summary (`# fail 0`). Every test uses `withTestSlide` (`try / finally`) so temporary slides are always cleaned up.
4. Clean up generated deployment files:

   ```bash
   ./src/deploy.sh clean
   ```
