'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { createGasEnv, ENUMS } = require('./helpers/gas-env');

describe('main.js', () => {
  describe('onOpen', () => {
    it('builds the Slides Power Toys add-on menu with valid handler functions', () => {
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

      const fnNames = collectFnNames(env.ui.addonMenus[0]);
      assert.ok(fnNames.length > 50, `Expected >50 menu items, got ${fnNames.length}`);

      for (const fnName of fnNames) {
        assert.equal(
          typeof env.ctx[fnName],
          'function',
          `Menu item handler "${fnName}" is not a global function`
        );
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
    it('shows RGB, HSL, transparency, and theme info in an alert', () => {
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

    it.todo('Phase 3: labels LCH output as "LCH:" instead of "HCL:"');
  });
});
