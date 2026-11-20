---
layout: default
title: Color Commands (OKLCH, HSL, HSV, HWB)
parent: User's Guide
nav_order: 6
---

# Color Commands

Slides Power Toys lets you inspect and adjust shape fill colors across four color spaces—**OKLCH**, **HSL**, **HSV**, and **HWB**—while preserving each shape's existing transparency (alpha) and supporting grouped shapes and presentation theme colors.

## Inspect Shape Color

Select one or more shapes and go to **Extensions > Slides Power Toys > Inspect shape color** to view the last selected shape's fill in all supported formats:

- **RGB** (0–255 channels + Hex)
- **HSL** (Hue °, Saturation %, Luminosity %)
- **HSV** (Hue °, Saturation %, Value %)
- **HWB** (Hue °, Whiteness %, Blackness %)
- **OKLCH** (Lightness %, Chroma, Hue °)
- **CIE LCH** (Lightness %, Chroma, Hue °)
- **Transparency** (%) and **Theme color name** (if using a deck theme color)

## Adjusting Color Components

Select shapes or groups (or select no elements to apply to every shape on the current slide), then choose a color space menu under **Extensions > Slides Power Toys**:

### Color (OKLCH) — Perceptually Uniform
Best for building harmonious palettes where changing Hue keeps perceived brightness consistent across colors (no dark-blue vs. bright-yellow jumps). Out-of-gamut edits are gamut-mapped into sRGB via CSS Color 4 chroma reduction so Lightness and Hue stay accurate.
- **Lightness (L):** `-33%`, `-10%`, `-5%` / `+5%`, `+10%`, `+33%` or absolute `10%–90%`
- **Chroma (C):** `-0.10`, `-0.05`, `-0.02` / `+0.02`, `+0.05`, `+0.10` or absolute `0.00 (greyscale)–0.30 (vivid)`
- **Hue (H):** `-30°`, `-15°` / `+15°`, `+30°` (wrapping around 360°) or `0°–330°` presets

### Color (HSL)
- **Hue (H):** `-30°`, `-15°` / `+15°`, `+30°` (wrapping around 360°) or `0°–330°` presets
- **Saturation (S):** relative steps or `0% (greyscale)–100%`
- **Luminosity (L):** relative steps or `10%–90%`

### Color (HSV)
- **Hue (H):** `-30°`, `-15°` / `+15°`, `+30°` or `0°–330°` presets
- **Saturation (S):** relative steps or `0%–100%`
- **Value (V):** relative steps or `10% (dark)–100% (bright)`

### Color (HWB)
Intuitive tint/shade mixing per CSS Color 4 (`W + B >= 1` normalizes cleanly to neutral gray):
- **Hue (H):** `-30°`, `-15°` / `+15°`, `+30°` or `0°–330°` presets
- **Whiteness (W):** relative steps or `0%–90% (tint)`
- **Blackness (B):** relative steps or `0%–90% (shade)`

## Other Color Utilities
- **Modify shape color:** Swap text and background colors (updates all text runs and preserves fill alpha), Invert background color, or Set text color to max contrast (WCAG 2.1 contrast ratio).
- **Set transparency:** Adjust fill transparency from `0% (opaque)` to `100% (transparent)` while preserving the underlying RGB or Theme color.
