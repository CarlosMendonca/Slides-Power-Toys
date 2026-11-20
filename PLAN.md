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
| 6 | `staging-sidebar` | Native CardService Sidebar UI (keeping all existing Menu items) | [~] Deferred exploration on `staging-sidebar` |

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

## Phase 6 — `staging-sidebar`: Sidebar UI (Alongside Existing Menus)

**Why last:** Builds on the tested, optimized core logic to add a rich interactive UI while preserving 100% of the existing top-level add-on menus.

### Tasks
- [ ] **Keep all existing Menu items** in `onOpen` (`src/main.js`), and add an `"Open sidebar"` item at the top of the `Slides Power Toys` menu (plus a separator).
- [ ] **Manifest scope update**
  - Add `"https://www.googleapis.com/auth/script.container.ui"` to `oauthScopes` in `src/appsscript.json.release` (required by `SlidesApp.getUi().showSidebar()`).
- [ ] **Server bridge (`src/sidebar.js`)**
  - `menuShowSidebar()` opening `HtmlService.createHtmlOutputFromFile('sidebar').setTitle('Slides Power Toys')`.
  - Clean server-side callable functions returning structured JSON (status, error messages, inspected color data) for `google.script.run`.
- [ ] **Sidebar frontend (`src/sidebar.html`)**
  - Clean, lightweight Google Slides-styled panel (no external CDN dependencies) with collapsible sections:
    - **Precision Snap**: Dimension / Position / Rotation / Straighten + unit selector (`in`, `cm`, `pt`) and decimal precision.
    - **Arrange & Size**: Copy Width / Height / Both / Rotation, Adjoin H/V with custom padding input, Align Inner/Outer grid, Center on Page, Flip H/V/Both.
    - **Color Studio**: Live Color Inspector (swatch + RGB/Hex/HSL/LCH/Alpha/Theme), Swap / Invert / Max Contrast buttons, and Hue / Saturation / Luminosity / Transparency sliders & step buttons.
  - Inline status/toast feedback inside the sidebar (avoiding modal `ui.alert` interruptions when triggered from the sidebar).
- [ ] **Docs & version**
  - Document the Sidebar in `README.md` and `docs/users-guide/`.

### Verification
- Unit test server bridge functions (`src/sidebar.js`) locally via `npm test`.
- Push with `./deploy.sh test` and manually verify both the Sidebar and all legacy Menu items in Google Slides.

---

# v8 Roadmap — Multi-Color-Space Control (OKLCH, HWB, HSL, HSV)

Adds full color inspection and incremental editing across **OKLCH**, **HSL**, **HSV**, and **HWB** (keeping CIE LCH in the inspector and placing all 4 color spaces at the top menu level to minimize nesting).

## Status Overview (v8)

| Phase | Branch | Goal | Status |
| :---: | --- | --- | :---: |
| 1 | `staging-colors-math` | Bidirectional HSV, HWB, OKLCH conversions + gamut mapping + unit tests | [x] Complete |
| 2 | `staging-colors-core` | Unified color-component transform engine + upgraded Inspector + tests | [x] Complete |
| 3 | `staging-colors-menus` | 4 top-level color space menus (`src/menu.colors.js`) + handler & Slides tests | [~] Ready for manual `clasp push` verification |
| 4 | `staging-colors-docs` | User guide, README, and developer docs | [ ] Not started |

---

## v8 Phase 1 — `staging-colors-math`: Color Space Conversions & Unit Tests

### Tasks
- [x] Create `src/util.colors.js` with pure bidirectional sRGB ↔ **HSV**, **HWB** (CSS Color 4 `W + B >= 1` normalization), and **OKLCH** (Björn Ottosson OKLab matrices + binary-search chroma-reduction gamut mapping).
- [x] Wire `src/util.colors.js` into `tests/unit/helpers/gas-env.js`.
- [x] Add comprehensive local unit tests in `tests/unit/util.colors.test.js` verifying reference values, round-trips, achromatic cases, HWB normalization, and out-of-gamut OKLCH preservation of L and H.

---

## v8 Phase 2 — `staging-colors-core`: Unified Transform Engine & Upgraded Inspector

### Tasks
- [x] Add `HSV_COMPONENT`, `HWB_COMPONENT`, `OKLCH_COMPONENT` enums and unified `applyColorVectorTransform` in `src/core.colors.js` (with `changeHSL`, `changeHSV`, `changeHWB`, `changeOKLCH` wrappers preserving alpha and using a single `getFill()` RPC).
- [x] Update `inspectShapeColor()` in `src/main.js` to display **RGB (Hex), HSL, HSV, HWB, OKLCH, CIE LCH, Transparency, and Theme**.
- [x] Add unit tests, RPC-count tests, and Slides integration tests in `src/tests/tests.js`.

---

## v8 Phase 3 — `staging-colors-menus`: 4 Top-Level Color Menus (`src/menu.colors.js`)

### Tasks
- [x] Create `src/menu.colors.js` with menu builders and global `menuSetColor*` handlers for **OKLCH**, **HSL**, **HSV**, and **HWB** (flattening Decrease/Increase with separators so nesting stays ≤ 2 submenu levels; sharing RGB-cylindrical Hue handlers across HSL/HSV/HWB; accurate OKLCH hue color names).
- [x] Wire the 4 top-level menus (`Color (OKLCH)`, `Color (HSL)`, `Color (HSV)`, `Color (HWB)`) into `onOpen()` in `src/main.js`.
- [x] Add unit tests (verifying every menu item resolves to a global function, `onOpen` still uses 1 `getUi()` RPC, and zero Apps Script filename collisions) + live Slides integration tests.

---

## v8 Phase 4 — `staging-colors-docs`: Documentation

### Tasks
- [ ] Document OKLCH, HWB, HSL, and HSV inspection & editing in `README.md` and `docs/users-guide/`.
- [ ] Update `PLAN.md` statuses.
