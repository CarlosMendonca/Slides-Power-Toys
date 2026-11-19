'use strict';

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { createGasEnv, ENUMS } = require('./helpers/gas-env');

describe('sidebar.js and sidebar.html', () => {
  describe('menuShowSidebar & sidebar.html validity', () => {
    it('opens the sidebar HTML with the add-on title while keeping all existing menu items', () => {
      const env = createGasEnv();
      env.ctx.onOpen({});

      const topItems = env.ui.addonMenus[0].items;
      assert.equal(topItems[0].label, 'Open sidebar');
      assert.equal(topItems[0].fnName, 'menuShowSidebar');
      // Existing submenus remain intact
      const subCaptions = topItems.filter((i) => i.type === 'submenu').map((i) => i.menu.caption);
      assert.ok(subCaptions.includes('Precision snap'));
      assert.ok(subCaptions.includes('Copy attributes'));
      assert.ok(subCaptions.includes('Set color hue'));
      assert.ok(subCaptions.includes('Set transparency'));

      env.ctx.menuShowSidebar();
      assert.equal(env.ui.sidebars.length, 1);
      assert.equal(env.ui.sidebars[0].filename, 'sidebar');
      assert.equal(env.ui.sidebars[0].getTitle(), 'Slides Power Toys');
    });

    it('sidebar.html inline script compiles with zero syntax errors and references valid server handlers', () => {
      const env = createGasEnv();
      const html = fs.readFileSync(path.resolve(__dirname, '../../src/sidebar.html'), 'utf8');
      const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);
      assert.ok(scriptMatch, 'sidebar.html must contain an inline <script> block');

      // Compile script to ensure zero JS syntax errors
      assert.doesNotThrow(() => new vm.Script(scriptMatch[1], { filename: 'sidebar.html' }));

      // Verify every server function name passed to runAction exists as a global function
      const fnRefs = [...html.matchAll(/runAction\('(\w+)'/g)].map((m) => m[1]);
      assert.ok(fnRefs.length >= 9, `Expected >=9 server actions, found ${fnRefs.length}`);
      for (const fnName of fnRefs) {
        assert.equal(typeof env.ctx[fnName], 'function', `Missing server handler "${fnName}"`);
      }
    });
  });

  describe('sidebarSnap', () => {
    it('supports inches, cm, and pt units and configurable decimals', () => {
      const env = createGasEnv();
      const cmPt = env.ctx.PPI / 2.54;
      const shape = env.createShape({
        left: 2.34 * cmPt,
        top: 1.86 * cmPt,
        width: 5.14 * cmPt,
        height: 3.26 * cmPt,
        rotation: 14.7,
      });
      env.setSelection({ elements: [shape] });

      const posRes = env.ctx.sidebarSnap('position', 'cm', 1);
      assert.equal(posRes.ok, true);
      assert.ok(Math.abs(shape.getLeft() - 2.3 * cmPt) < 1e-6);
      assert.ok(Math.abs(shape.getTop() - 1.9 * cmPt) < 1e-6);

      const dimRes = env.ctx.sidebarSnap('dimension', 'pt', 0);
      assert.equal(dimRes.ok, true);
      assert.equal(shape.getWidth(), Math.round(5.14 * cmPt));

      const rotRes = env.ctx.sidebarSnap('rotation', 'in', 1);
      assert.equal(rotRes.ok, true);
      assert.equal(shape.getRotation(), 15);

      const zeroRes = env.ctx.sidebarSnap('zeroRotation', 'in', 1);
      assert.equal(zeroRes.ok, true);
      assert.equal(shape.getRotation(), 0);
    });
  });

  describe('sidebarCopyAttributes, sidebarAdjoin, sidebarAlign, sidebarFlip', () => {
    it('copies attributes and returns structured error when < 2 selected', () => {
      const env = createGasEnv();
      const a = env.createShape({ width: 50, height: 60, rotation: 0 });
      const ref = env.createShape({ width: 120, height: 80, rotation: 30 });

      env.setSelection({ elements: [a] });
      assert.equal(env.ctx.sidebarCopyAttributes(true, false, false).ok, false);

      env.setSelection({ elements: [a, ref] });
      assert.equal(env.ctx.sidebarCopyAttributes(true, true, true).ok, true);
      assert.equal(a.getWidth(), 120);
      assert.equal(a.getHeight(), 80);
      assert.equal(a.getRotation(), 30);
    });

    it('adjoins with custom padding in pt and optional centering', () => {
      const env = createGasEnv();
      const ref = env.createShape({ left: 0, top: 0, width: 100, height: 50 });
      const moved = env.createShape({ left: 50, top: 200, width: 60, height: 30 });

      env.setSelection({ elements: [moved, ref] });
      const res = env.ctx.sidebarAdjoin(true, 12, 'pt', false);
      assert.equal(res.ok, true);
      assert.equal(moved.getLeft(), 112);
      assert.equal(moved.getTop(), 200); // not centered
    });

    it('aligns elements and centers on page', () => {
      const env = createGasEnv({ pageWidth: 720, pageHeight: 405 });
      const s = env.createShape({ left: 0, top: 0, width: 100, height: 50 });
      env.setSelection({ elements: [s] });

      assert.equal(env.ctx.sidebarAlign('RIGHT', 'NOT_SET', false).ok, true);
      assert.equal(s.getLeft(), 620);

      assert.equal(env.ctx.sidebarCenterOnPage().ok, true);
      assert.equal(s.getLeft(), 310);
      assert.equal(s.getTop(), 177.5);
    });

    it('flips positions of last two elements without modal alerts', () => {
      const env = createGasEnv();
      const a = env.createShape({ left: 10, top: 20 });
      const b = env.createShape({ left: 100, top: 200 });

      env.setSelection({ elements: [a] });
      assert.equal(env.ctx.sidebarFlip(true, true).ok, false);
      assert.equal(env.ui.alerts.length, 0);

      env.setSelection({ elements: [a, b] });
      assert.equal(env.ctx.sidebarFlip(true, false).ok, true);
      assert.equal(a.getLeft(), 100);
      assert.equal(b.getLeft(), 10);
    });
  });

  describe('sidebarInspectColor, sidebarColorAction, sidebarAdjustHsl, sidebarSetTransparency', () => {
    it('inspects RGB and Theme shape colors cleanly', () => {
      const env = createGasEnv();
      const shape = env.createShape({
        fillColor: ENUMS.ThemeColorType.ACCENT1,
        fillAlpha: 0.8,
      });
      env.setSelection({ elements: [shape] });

      const res = env.ctx.sidebarInspectColor();
      assert.equal(res.ok, true);
      assert.deepEqual(Array.from(res.data.rgb), [255, 171, 64]);
      assert.equal(res.data.hex, '#ffab40');
      assert.equal(res.data.transparencyPct, 20);
      assert.equal(res.data.themeColorType, 'ACCENT1');
    });

    it('adjusts HSL, transparency, and color actions returning refreshed inspector data', () => {
      const env = createGasEnv();
      const shape = env.createShape({
        fillColor: [255, 0, 0],
        fillAlpha: 1,
        text: 'Hello',
      });
      env.setSelection({ elements: [shape] });

      // Relative Hue -30° wraps Red -> Deep Pink (255, 0, 128)
      const hueRes = env.ctx.sidebarAdjustHsl('HUE', -30, false);
      assert.equal(hueRes.ok, true);
      assert.deepEqual(Array.from(hueRes.inspected.rgb), [255, 0, 128]);

      // Transparency -> 50%
      const transRes = env.ctx.sidebarSetTransparency(50);
      assert.equal(transRes.ok, true);
      assert.equal(transRes.inspected.transparencyPct, 50);

      // Invert preserves 50% transparency
      const invRes = env.ctx.sidebarColorAction('invert');
      assert.equal(invRes.ok, true);
      assert.deepEqual(Array.from(invRes.inspected.rgb), [0, 255, 127]);
      assert.equal(invRes.inspected.transparencyPct, 50);
    });
  });
});
