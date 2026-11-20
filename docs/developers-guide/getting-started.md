---
layout: default
title: Getting Started
parent: Developer's Guide
nav_order: 1
---

# Getting Started

## Prerequisites

- **Node.js 20+** (for local unit tests and type checking; e.g., via `mise` or Nix `src/devenv.nix`)
- **[clasp](https://github.com/google/clasp)** (`npm install -g @google/clasp` or `mise use -g npm:@google/clasp`)
- Google Apps Script API enabled at <https://script.google.com/home/usersettings>

## Local Setup

1. Install dev dependencies (TypeScript & `@types/google-apps-script` for static checks):

   ```bash
   npm install
   ```

2. Authenticate `clasp`:

   ```bash
   clasp login
   ```

3. Configure your target Apps Script project IDs by copying the example templates:

   ```bash
   cp src/.clasp.json.test.example src/.clasp.json.test
   cp src/.clasp.json.release.example src/.clasp.json.release
   ```

   Edit each file to set `"scriptId"` to Google Slides Apps Script projects you own.

## Deploying

Use `src/deploy.sh` from either the repo root or `src/`:

```bash
./src/deploy.sh test     # pushes src/*.js + integration tests to your test project
./src/deploy.sh release  # pushes production files (no tests) to your release project
./src/deploy.sh clean    # removes generated .clasp.json, appsscript.json, tests.js
```

## Project Structure

- `src/main.js` — Add-on menu setup, command entrypoints, and UI prompts
- `src/menu.colors.js` — OKLCH, HSL, HSV, and HWB menu builders and handlers
- `src/core.js` — Geometry & alignment operations (snap, align, flip, adjoin)
- `src/core.colors.js` — Color transformations (OKLCH, HSL, HSV, HWB, invert, WCAG 2.1 contrast, alpha, swap)
- `src/selection.js` — Selection traversal & recursive group handling
- `src/util.js`, `src/util.colors.js`, & `src/util.lch.js` — Color space conversions (HSL, HSV, HWB, OKLCH, CIE LCH) and shared helpers
- `src/tests/tests.js` — Apps Script integration tests (pushed only via `deploy.sh test`)
- `tests/unit/` — Fast local Node.js unit test suite
