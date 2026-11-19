# Slides Power Toys — Improvement Plan

This plan breaks down all planned improvements into sequential, self-contained phases. Each phase gets its own `staging-*` branch so changes can be reviewed, tested (locally and via `clasp push`), and merged incrementally.

> **Branching workflow:** Create each `staging-*` branch sequentially from the tip of the previous phase (or from `master` after merging the previous phase) so every phase inherits the test suite and fixes from earlier phases.

---

## Status Overview

| Phase | Branch | Goal | Status |
| :---: | --- | --- | :---: |
| 1 | `staging-tests` | Local unit test suite + hardened GasT integration tests | [x] Complete (45 local + 95 Slides pass) |
| 2 | `staging-devex` | Fix `deploy.sh`, config hygiene, manifest cleanup, JS type checking | [x] Complete |
| 3 | `staging-bugfixes` | Core bug fixes & edge-case hardening | [x] Complete |
| 4 | `staging-performance` | Apps Script RPC reduction & loop optimizations | [x] Complete |
| 5 | `staging-modernize` | V8 modernization, dead code removal, typos & developer docs | [x] Complete |
| 6 | `staging-sidebar` | Native CardService Sidebar UI (keeping all existing Menu items) | [x] Complete |

---

## Phase 1 — `staging-tests`: Testing Foundation

**Why first:** Establishes a fast local test harness and safe integration test runner before changing any production behavior, enabling test-first regression coverage for Phase 3.

### Tasks
- [x] **Local unit test suite (`tests/unit/`)**
  - Add root `package.json` (kept outside `src/` so `clasp` never pushes it) with `npm test` running Node's built-in `node:test` runner (zero runtime test dependencies).
  - Add `pkgs.nodejs` to `src/devenv.nix` so Nix/devenv users have Node available automatically.
  - Build a lightweight `vm`-based loader + `SlidesApp` mock (`tests/unit/helpers/gas-env.js`) that evaluates `src/*.js` in a shared global context—matching Apps Script's execution model without requiring a bundler.
  - Write unit tests covering:
    - `util.js` (`roundTo`, `clamp`, RGB↔HSL, contrast ratio, `getRgbColorFromShapeColor`, `fakePageAsReferenceElement`)
    - `util.lch.js` (RGB→LCH conversion & `multiplyMatrices`)
    - `core.js` (`snapElement`, `alignShape`, `flipTwoElements`, `adjoinTwoElements`)
    - `core.colors.js` (`invertColorsOnShape`, `changeHSL`, `setMaxContrastToTextOnShape`, `setAlphaToShape`, `swapColorsOnShape`)
    - `selection.js` (`getSelectedElementsOnPage`, `withShapesOrGroupsRecursively`)
- [x] **Harden GasT integration tests (`src/tests/tests.js`)**
  - Wrap slide setup/teardown in a `withTestSlide(doc, fn)` helper using `try { ... } finally { slide.remove(); }` so failing assertions never leave orphan slides behind.
  - Remove hardcoded `ACCENT1` RGB expectations (`255, 171, 64`) by reading the slide's concrete theme color dynamically.
  - Replace unpinned `master` `UrlFetchApp` + `eval` for GasT with a self-contained embedded TAP runner (`createTapRunner`).
  - Read the test deck URL from `PropertiesService.getScriptProperties()` with fallback to `SlidesApp.getActivePresentation()` instead of hardcoding a personal presentation URL in git.
  - Add integration tests for Precision Snap, Copy Attributes, Transparency, and Color Swap.

### Verification
- Run `npm test` locally (all unit tests pass).
- Run `./deploy.sh test` and execute `gastTestRunner()` in the Apps Script editor against a test Slides deck.

---

## Phase 2 — `staging-devex`: Deploy Script, Config Hygiene & Type Checking

**Why second:** Ensures `clasp push` works reliably from any directory before pushing subsequent branches, and adds static type checking (`@types/google-apps-script`) to catch nullability and API misuse early.

### Tasks
- [x] **Fix `src/deploy.sh`**
  - Move `#!/bin/bash` to line 1 (currently on line 15, causing the shebang to be ignored).
  - Add `set -euo pipefail`.
  - Resolve script directory (`cd "$(dirname "$0")"`) so it works whether invoked from repo root or `src/`.
  - Use `rm -f` in `clean` so missing files don't cause errors.
- [x] **Config & manifest hygiene**
  - Replace personal script IDs in `src/.clasp.json.release` and `src/.clasp.json.test` with `.example` templates (and gitignore the real files, updating `README.md` / `deploy.sh` error messages accordingly).
  - Remove unused `"webapp"` block from `src/appsscript.json.release` and `src/appsscript.json.test`.
  - Tighten `src/.claspignore` to explicitly exclude `deploy.sh`, `devenv.*`, `*.release`, `*.test`, `*.example`, and `tests/**`.
- [x] **Static type checking (no build step)**
  - Add `@types/google-apps-script` and `typescript` as devDependencies in root `package.json`.
  - Add `tsconfig.json` with `checkJs: true`, `noEmit: true`, `allowJs: true` targeting `src/*.js`.
  - Add `npm run typecheck` (`tsc --noEmit`) and resolve the 5 initial type errors (implicit global `rgbColor`, boolean arithmetic in `core.js` / `core.colors.js`).

### Verification
- Run `bash -n src/deploy.sh` and test `./src/deploy.sh clean` from repo root.
- Run `npm run typecheck` and `npm test`.

---

## Phase 3 — `staging-bugfixes`: Core Bug Fixes & Edge-Case Hardening

**Why third:** With local tests and type checking in place, fix all identified functional bugs and add regression tests for each.

### Tasks
- [x] **Hue wrapping & menu labels (`src/core.colors.js`, `src/main.js`)**
  - Wrap `HSL_COMPONENT.HUE` modulo `1` instead of clamping to `[0, 1]` in `changeHSL`.
  - Fix swapped submenu labels `'Decrease (towards orange)'` / `'Increase (towards pink)'` in `onOpen`.
- [x] **Preserve fill transparency (`src/core.colors.js`)**
  - Read existing `alpha` from `fill.getSolidFill().getAlpha()` and pass it to `setSolidFill(..., alpha)` in `invertColorsOnShape`, `changeHSL`, and `swapColorsOnShape`.
- [x] **Fix `swapColorsOnShape` (`src/core.colors.js`)**
  - Apply the new foreground color across the entire shape text (`shape.getText().getTextStyle().setForegroundColor(...)`) rather than only `getRuns()[0]`.
  - Guard against `null` or `UNSUPPORTED` foreground colors before calling `setSolidFill`.
- [x] **Fix `getRgbColorFromShapeColor` (`src/util.js`)**
  - Remove implicit global assignment (`return rgbColor = ...`).
  - Support `SLIDE`, `LAYOUT`, and `MASTER` parent pages via `parentPage.getColorScheme()` instead of calling `.asSlide()`.
  - Return `null` cleanly for `UNSUPPORTED` colors or missing theme mappings, and guard all callers (`invertColorsOnShape`, `changeHSL`, `setMaxContrastToTextOnShape`, `inspectShapeColor`).
- [x] **Fix `inspectShapeColor` (`src/main.js`)**
  - Change `"HCL: "` label to `"LCH: "` to match `[L, C, H]` output order.
  - Handle unsupported color types gracefully with a clear user alert.
- [x] **Fix `snapElement` & `menuZeroRotation` (`src/core.js`, `src/main.js`)**
  - Avoid setting width/height to `0` on thin elements (`< 0.05"`), clamping to a safe minimum or skipping zero-length line dimensions.
  - Guard `setRotation` against non-rotatable element types (such as `SlidesApp.PageElementType.TABLE`).
- [x] **Fix partial group selection (`src/selection.js`)**
  - Replace the single-group `shouldSkipGroup` heuristic in `withShapesOrGroupsRecursively` with ancestor-group ID tracking (`Set`) so selecting children inside nested or multiple groups only modifies the intended shapes.
- [x] **Fix WCAG 2.1 contrast calculation (`src/util.js`, `src/util.lch.js`)**
  - Update linearization threshold from `0.03928` (`<`) to `0.04045` (`<=`), reusing `linSrgb` from `util.lch.js` to eliminate duplication.
  - Rename `calculateRelativeLuminosity` → `calculateContrastRatio` (keeping a thin alias for compatibility).

### Verification
- All new regression unit tests pass via `npm test`.
- `npm run typecheck` passes cleanly.
- Manual verification in Google Slides via `./deploy.sh test` + `gastTestRunner()`.

---

## Phase 4 — `staging-performance`: Apps Script RPC & Loop Optimizations

**Why fourth:** Optimizes execution speed on slides with many elements while protected by the full test suite.

### Tasks
- [x] Cache `SlidesApp.getUi()` once in `onOpen` (`src/main.js`) instead of calling it 15 times.
- [x] Cache `pageWidth` and `pageHeight` inside `fakePageAsReferenceElement()` (`src/util.js`) and hoist it out of the loop in `menuCenterOnPage` (`src/main.js`).
- [x] Hoist `referenceElement.getWidth()`, `getHeight()`, and `getRotation()` out of `elementArray.forEach(...)` in `resizeElementsToLastSelected` (`src/main.js`).
- [x] Cache reference bounds once before iterating in `alignSelectOrAllElements` / `adjoinSelectedElements` (`src/main.js`, `src/util.js`).
- [x] Use a Schwartzian transform (pre-fetch `left`/`top` once per element) in `adjoinSelectedElements` (`src/main.js`) instead of calling RPC getters inside `.sort()`.
- [x] Eliminate redundant `getFill()` and `getRgbColorFromShapeColor(shape)` calls in `src/core.colors.js` and `inspectShapeColor` (`src/main.js`).
- [x] Partition shapes and groups in a single pass in `withShapesOrGroupsRecursively` (`src/selection.js`).

### Verification
- Add unit tests that count mock getter invocations to confirm RPC reduction.
- Run `npm test`, `npm run typecheck`, and GasT integration tests in Slides.

---

## Phase 5 — `staging-modernize`: V8 Modernization, Cleanup & Documentation

**Why fifth:** Cleans up legacy ES5 patterns, dead code, and docs so the codebase is clean before introducing the Sidebar UI.

### Tasks
- [x] **V8 modernization**
  - Consistently use `const`/`let`, `===`/`!==`, `Object.freeze()` for enums (`POSITION_X`, `POSITION_Y`, `HSL_COMPONENT`), and consistent function declarations across `src/*.js`.
  - Replace implicit boolean-to-number arithmetic (`*isOuterEdge`, `*!isAbsoluteChange`) with explicit conditionals.
  - Remove outdated ES5 comment in `src/util.js` and Unicode variable names (`ε`, `κ`) in `src/util.lch.js`.
  - Refactor repetitive menu handlers in `src/main.js` to call concise internal helpers (keeping every top-level `menu*` entrypoint intact for Apps Script).
- [x] **Dead code & hygiene**
  - Remove unused functions: `withSelectedOrAllShapes`, `withSelectedElements` (`src/selection.js`), and `calculateLuminosity` (`src/util.js`).
  - Remove duplicate `LICENSE.txt` (keep `LICENSE`).
  - Fix typos (`Acqua` → `Aqua`, `Luminosty` → `Luminosity`, `oficially` → `officially`, `http://` → `https://` in About prompt).
- [x] **Documentation**
  - Update `docs/users-guide/command-adjoin.md` to match actual spatial sorting behavior.
  - Complete `docs/developers-guide/getting-started.md`, `tests.md`, and `future-work.md` (currently `WIP`).

### Verification
- `npm test`, `npm run typecheck`, and GasT integration tests pass with zero regressions.

---

## Phase 6 — `staging-sidebar`: Native CardService Sidebar UI (Alongside Existing Menus)

**Why last:** Builds on the tested, optimized core logic to add a server-side Google Workspace Add-on side panel using `CardService`—avoiding `HtmlService` / `script.container.ui` so enterprise users need **zero net-new OAuth scopes**—while preserving 100% of the existing top-level add-on menus.

### Tasks
- [x] **Keep all existing Menu items** untouched in `onOpen` (`src/main.js`).
- [x] **Preserve single enterprise-safe OAuth scope**
  - Keep `oauthScopes` in `src/appsscript.json.release` strictly at `["https://www.googleapis.com/auth/presentations.currentonly"]` (add a unit test guard preventing scope creep).
  - Add `addOns.common` and `addOns.slides.homepageTrigger` (`onSlidesHomepage`) to `src/appsscript.json.release` and `src/appsscript.json.test`.
- [x] **CardService Sidebar (`src/sidebar.card.js`)**
  - Native server-side `CardService` cards with **Layout & Arrange** and **Color Studio** views:
    - **Precision Snap**: Position / Dimension / Rotation / Straighten + unit dropdown (`in`, `cm`, `pt`) and decimals (`0`–`2`).
    - **Arrange & Size**: Copy Width / Height / Both / Rotation, Adjoin H/V with custom gap input & anchor-center checkbox, Align Inner/Outer edge selector + Center on Page, Flip H/V/Both.
    - **Color Studio**: Color Inspector (`DecoratedText` with Hex, transparency, RGB/HSL/LCH, Theme badge), Swap / Invert / Max Contrast, Hue step buttons & presets dropdown, Saturation / Luminosity / Transparency step buttons & exact inputs.
  - Non-blocking toast notifications (`CardService.newNotification()`) and automatic Color card refresh after color edits.
- [x] **Docs & tests**
  - Document the CardService Sidebar in `README.md` and `docs/users-guide/sidebar.md`, and add unit + Slides integration tests.

### Verification
- Unit test `CardService` builders, handlers, and OAuth scope guard locally via `npm test` and `npm run typecheck`.
- Push with `./src/deploy.sh test`, run `gastTestRunner()`, and test the side panel via **Deploy → Test deployments → Install** in the Apps Script Editor alongside the **Extensions → Slides Power Toys** menu.
