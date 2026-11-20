'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { createGasEnv, ENUMS } = require('./helpers/gas-env');

describe('main.js', () => {
  describe('onOpen', () => {
    it('builds the Slides Power Toys add-on menu with 4 top-level color spaces, bounded nesting, and valid handlers', () => {
      const env = createGasEnv();
      env.ctx.onOpen({});

      assert.equal(env.ui.addonMenus.length, 1);

      const collectFnNames = (menu) => {
        const names = [];
        for (const item of menu.items) {
          if (item.type === 'item') names.push(item.fnName);
          if (item.type === 'submenu') names.push(...collectFnNames(item.menu));
        }
        return names;
      };

      const maxSubMenuDepth = (menu, depth = 0) => {
        let max = depth;
        for (const item of menu.items) {
          if (item.type === 'submenu') {
            max = Math.max(max, maxSubMenuDepth(item.menu, depth + 1));
          }
        }
        return max;
      };

      const rootMenu = env.ui.addonMenus[0];
      const fnNames = collectFnNames(rootMenu);
      assert.ok(fnNames.length > 150, `Expected >150 menu items across 4 color spaces, got ${fnNames.length}`);

      for (const fnName of fnNames) {
        assert.equal(
          typeof env.ctx[fnName],
          'function',
          `Menu item handler "${fnName}" is not a global function`
        );
      }

      // Verify all 4 color space submenus exist at top level with max depth 2 (Color (X) -> Component -> Item)
      const topSubMenus = rootMenu.items.filter((i) => i.type === 'submenu').map((i) => i.menu.caption);
      for (const expected of ['Color (OKLCH)', 'Color (HSL)', 'Color (HSV)', 'Color (HWB)']) {
        assert.ok(topSubMenus.includes(expected), `Missing top-level submenu "${expected}"`);
      }
      assert.ok(maxSubMenuDepth(rootMenu) <= 2, `Expected max submenu depth <= 2, got ${maxSubMenuDepth(rootMenu)}`);
    });

    it('ensures no two .js/.html files in src/ share the same extensionless Apps Script name', () => {
      const srcDir = path.resolve(__dirname, '../../src');
      const entries = fs
        .readdirSync(srcDir)
        .filter((f) => f.endsWith('.js') || f.endsWith('.html'))
        .filter((f) => f !== 'tests.js');
      const seen = new Map();
      for (const file of entries) {
        const base = file.replace(/\.(js|html)$/, '');
        assert.equal(seen.has(base), false, `Apps Script filename collision: ${file} vs ${seen.get(base)}`);
        seen.set(base, file);
      }
    });
  });

  describe('menu alignment, resize, flip, adjoin, and center commands', () => {
    it('aligns selected elements relative to the last selected element', () => {
      const env = createGasEnv();
      const s1 = env.createShape({ left: 72, top: 72, width: 72, height: 72 });
      const s2 = env.createShape({ left: 144, top: 144, width: 72, height: 72 });
      const anchor = env.createShape({ left: 0, top: 0, width: 72, height: 72 });

      env.setSelection({ elements: [s1, s2, anchor] });
      env.ctx.menuAlignToInnerLeft();
      assert.equal(s1.getLeft(), 0);
      assert.equal(s2.getLeft(), 0);
      assert.equal(anchor.getLeft(), 0);

      env.setSelection({ elements: [s1, s2, anchor] });
      env.ctx.menuAlignToOuterRight();
      assert.equal(s1.getLeft(), 72);
      assert.equal(s2.getLeft(), 72);
      assert.equal(anchor.getLeft(), 0);
    });

    it('aligns a single selected element relative to the page', () => {
      const env = createGasEnv({ pageWidth: 720, pageHeight: 405 });
      const s1 = env.createShape({ left: 10, top: 10, width: 100, height: 50 });

      env.setSelection({ elements: [s1] });
      env.ctx.menuAlignToInnerRight();
      assert.equal(s1.getLeft(), 620);
    });

    it('centers elements on the page', () => {
      const env = createGasEnv({ pageWidth: 720, pageHeight: 405 });
      const s1 = env.createShape({ left: 0, top: 0, width: 100, height: 50 });

      env.setSelection({ elements: [s1] });
      env.ctx.menuCenterOnPage();
      assert.equal(s1.getLeft(), 310);
      assert.equal(s1.getTop(), 177.5);
    });

    it('copies width, height, and rotation from the last selected element', () => {
      const env = createGasEnv();
      const s1 = env.createShape({ width: 50, height: 60, rotation: 10 });
      const ref = env.createShape({ width: 120, height: 80, rotation: 45 });

      env.setSelection({ elements: [s1, ref] });
      env.ctx.menuCopyWidthAndHeight();
      assert.equal(s1.getWidth(), 120);
      assert.equal(s1.getHeight(), 80);
      assert.equal(s1.getRotation(), 10);

      env.setSelection({ elements: [s1, ref] });
      env.ctx.menuCopyRotation();
      assert.equal(s1.getRotation(), 45);
    });

    it('alerts when fewer than 2 elements are selected for flip, adjoin, or copy', () => {
      const env = createGasEnv();
      const s1 = env.createShape();
      env.setSelection({ elements: [s1] });

      env.ctx.menuFlipH();
      env.ctx.menuAdjoinH();
      env.ctx.menuCopyWidth();
      assert.equal(env.ui.alerts.length, 3);
    });

    it('adjoins multiple elements horizontally sorted by left position anchored on last selected', () => {
      const env = createGasEnv();
      const ref = env.createShape({ left: 0, top: 0, width: 72, height: 72 });
      const s1 = env.createShape({ left: 0, top: 144, width: 144, height: 144 });
      const s2 = env.createShape({ left: 144, top: 144, width: 72, height: 72 });

      env.setSelection({ elements: [s2, s1, ref] }); // out of order; should sort by left
      env.ctx.menuAdjoinH();

      assert.equal(ref.getLeft(), 0);
      assert.equal(s1.getLeft(), 72);
      assert.equal(s1.getTop(), -36);
      assert.equal(s2.getLeft(), 216);
      assert.equal(s2.getTop(), 0);
    });
  });

  describe('inspectShapeColor', () => {
    it('shows RGB, HSL, HSV, HWB, OKLCH, CIE LCH, transparency, and theme info in an alert', () => {
      const env = createGasEnv();
      const shape = env.createShape({
        fillColor: ENUMS.ThemeColorType.ACCENT1,
        fillAlpha: 0.75,
      });

      env.setSelection({ elements: [shape] });
      env.ctx.menuInspectShapeColor();

      assert.equal(env.ui.alerts.length, 1);
      const { prompt } = env.ui.alerts[0];
      assert.match(prompt, /RGB: 255, 171, 64 \(#ffab40\)/);
      assert.match(prompt, /\nHSL: /);
      assert.match(prompt, /\nHSV: /);
      assert.match(prompt, /\nHWB: /);
      assert.match(prompt, /\nOKLCH: /);
      assert.match(prompt, /\nCIE LCH: /);
      assert.match(prompt, /Transparency: 25\.0%/);
      assert.match(prompt, /ACCENT1/);
    });

    it('alerts when no shapes or no solid fill is selected', () => {
      const env = createGasEnv();
      env.setSelection({ elements: [] });
      env.ctx.menuInspectShapeColor();
      assert.match(env.ui.alerts[0].prompt, /No individual shapes selected/);

      const empty = env.createShape({ fillType: ENUMS.FillType.NONE });
      env.setSelection({ elements: [empty] });
      env.ctx.menuInspectShapeColor();
      assert.match(env.ui.alerts[1].prompt, /does not have a solid fill/);
    });

    it('labels OKLCH and CIE LCH cleanly (no HCL typo) and handles unsupported fill color', () => {
      const env = createGasEnv();
      const shape = env.createShape({ fillColor: [255, 0, 0] });

      env.setSelection({ elements: [shape] });
      env.ctx.menuInspectShapeColor();
      assert.match(env.ui.alerts[0].prompt, /\nOKLCH: 62\.8%, 0\.258, 29\.2°/);
      assert.match(env.ui.alerts[0].prompt, /\nCIE LCH: /);
      assert.doesNotMatch(env.ui.alerts[0].prompt, /\nHCL: /);

      const unsupported = env.createShape({ fillColor: { type: ENUMS.ColorType.UNSUPPORTED } });
      env.setSelection({ elements: [unsupported] });
      env.ctx.menuInspectShapeColor();
      assert.match(env.ui.alerts[1].prompt, /not supported/);
    });
  });
});
