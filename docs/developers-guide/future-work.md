---
layout: default
title: Future Work
parent: Developer's Guide
nav_order: 3
---

# Future Work

Planned and potential enhancements for Slides Power Toys:

- **Interactive Sidebar UI**: A persistent sidebar panel alongside the existing menu bar with live color inspection, continuous HSL/transparency sliders, configurable Adjoin padding, and metric/imperial Precision Snap units.
- **LCH / OKLCH Color Adjustments**: Perceptually uniform lightness and chroma adjustments building on `src/util.lch.js`.
- **Advanced Slides API Batching**: Optional `Slides.Presentations.batchUpdate` path for very large slides where single-request batching outperforms sequential `SlidesApp` calls.
- **Multi-slide & Master/Layout Bulk Actions**: Additional utilities for standardizing formatting across an entire presentation.

See [PLAN.md](https://github.com/carlosmendonca/Slides-Power-Toys/blob/master/PLAN.md) or the GitHub issue tracker for active roadmap items.
