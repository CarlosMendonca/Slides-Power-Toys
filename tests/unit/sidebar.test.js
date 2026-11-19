'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { createGasEnv, ENUMS } = require('./helpers/gas-env');

function collectCardActionFnNames(card) {
  const fnNames = [];
  for (const section of card.sections) {
    for (const widget of section.widgets) {
      if (widget._type === 'TextButton' && widget.action && widget.action.fnName) {
        fnNames.push(widget.action.fnName);
      }
      if (widget._type === 'ButtonSet') {
        for (const btn of widget.buttons) {
          if (btn.action && btn.action.fnName) {
            fnNames.push(btn.action.fnName);
          }
        }
      }
    }
  }
  return fnNames;
}

function makeCardEvent({ params = {}, form = {} } = {}) {
  const formInputs = {};
  for (const [k, v] of Object.entries(form)) {
    formInputs[k] = { stringInputs: { value: [String(v)] } };
  }
  return {
    commonEventObject: {
      parameters: params,
      formInputs,
    },
  };
}

describe('sidebar.card.js (CardService Workspace Add-on)', () => {
  describe('Enterprise permission & Apps Script project hygiene', () => {
    it('release manifest requests ONLY presentations.currentonly (no HtmlService/script.container.ui scope)', () => {
      const manifestPath = path.resolve(__dirname, '../../src/appsscript.json.release');
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      assert.deepEqual(manifest.oauthScopes, [
        'https://www.googleapis.com/auth/presentations.currentonly',
      ]);
      assert.equal(manifest.addOns.slides.homepageTrigger.runFunction, 'onSlidesHomepage');
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
        assert.equal(
          seen.has(base),
          false,
          `Apps Script filename collision: "${file}" collides with "${seen.get(base)}" (both map to "${base}")`
        );
        seen.set(base, file);
      }
    });

    it('preserves all existing onOpen menu items without requiring HtmlService', () => {
      const env = createGasEnv();
      env.ctx.onOpen({});
      const topItems = env.ui.addonMenus[0].items;
      const subCaptions = topItems.filter((i) => i.type === 'submenu').map((i) => i.menu.caption);
      assert.ok(subCaptions.includes('Precision snap'));
      assert.ok(subCaptions.includes('Copy attributes'));
      assert.ok(subCaptions.includes('Set color hue'));
      assert.ok(subCaptions.includes('Set transparency'));
    });
  });

  describe('Card builders & action bindings', () => {
    it('onSlidesHomepage builds the Layout card with valid global action handlers', () => {
      const env = createGasEnv();
      const card = env.ctx.onSlidesHomepage({});

      assert.equal(card._type, 'Card');
      assert.equal(card.header.title, 'Slides Power Toys');
      const fnNames = collectCardActionFnNames(card);
      assert.ok(fnNames.length >= 15, `Expected >=15 button actions, got ${fnNames.length}`);
      for (const fnName of fnNames) {
        assert.equal(typeof env.ctx[fnName], 'function', `Missing CardService handler "${fnName}"`);
      }
    });

    it('onCardSwitchView builds the Color card with valid global action handlers', () => {
      const env = createGasEnv();
      const res = env.ctx.onCardSwitchView(makeCardEvent({ params: { view: 'color' } }));

      assert.equal(res._type, 'ActionResponse');
      const colorCard = res.navigation.updatedCard;
      assert.equal(colorCard.header.subtitle, 'Color Studio');

      const fnNames = collectCardActionFnNames(colorCard);
      assert.ok(fnNames.length >= 20, `Expected >=20 color actions, got ${fnNames.length}`);
      for (const fnName of fnNames) {
        assert.equal(typeof env.ctx[fnName], 'function', `Missing CardService handler "${fnName}"`);
      }
    });
  });

  describe('CardService Layout handlers', () => {
    it('onCardSnap supports inches, cm, pt and zeroRotation', () => {
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

      const posRes = env.ctx.onCardSnap(makeCardEvent({ params: { mode: 'position' }, form: { unit: 'cm', decimals: '1' } }));
      assert.match(posRes.notification.text, /Updated 1 element/);
      assert.ok(Math.abs(shape.getLeft() - 2.3 * cmPt) < 1e-6);
      assert.ok(Math.abs(shape.getTop() - 1.9 * cmPt) < 1e-6);

      env.ctx.onCardSnap(makeCardEvent({ params: { mode: 'dimension' }, form: { unit: 'pt', decimals: '0' } }));
      assert.equal(shape.getWidth(), Math.round(5.14 * cmPt));

      env.ctx.onCardSnap(makeCardEvent({ params: { mode: 'rotation' }, form: { unit: 'in', decimals: '1' } }));
      assert.equal(shape.getRotation(), 15);

      env.ctx.onCardSnap(makeCardEvent({ params: { mode: 'zeroRotation' }, form: { unit: 'in', decimals: '1' } }));
      assert.equal(shape.getRotation(), 0);
    });

    it('onCardCopy, onCardAdjoin, onCardAlign, onCardCenterOnPage, and onCardFlip execute cleanly', () => {
      const env = createGasEnv({ pageWidth: 720, pageHeight: 405 });
      const ref = env.createShape({ left: 0, top: 0, width: 100, height: 50, rotation: 30 });
      const moved = env.createShape({ left: 50, top: 200, width: 60, height: 30, rotation: 0 });

      // Copy attributes
      env.setSelection({ elements: [moved, ref] });
      const copyRes = env.ctx.onCardCopy(makeCardEvent({ params: { w: '1', h: '1', r: '1' } }));
      assert.match(copyRes.notification.text, /Copied attributes/);
      assert.equal(moved.getWidth(), 100);
      assert.equal(moved.getRotation(), 30);

      // Adjoin with custom pt padding & no centering
      env.setSelection({ elements: [moved, ref] });
      const adjRes = env.ctx.onCardAdjoin(
        makeCardEvent({ params: { horizontal: '1' }, form: { unit: 'pt', adjoinPadding: '12', adjoinCenter: '' } })
      );
      assert.match(adjRes.notification.text, /Adjoined 2/);
      assert.equal(moved.getLeft(), 112);
      assert.equal(moved.getTop(), 200);

      // Align single shape to page inner right & center on page
      env.setSelection({ elements: [moved] });
      env.ctx.onCardAlign(makeCardEvent({ params: { x: 'RIGHT', y: 'NOT_SET' }, form: { alignEdge: 'inner' } }));
      assert.equal(moved.getLeft(), 620);

      env.ctx.onCardCenterOnPage(makeCardEvent());
      assert.equal(moved.getLeft(), 310);

      // Flip positions (and graceful error notification on <2 selected)
      const flipErr = env.ctx.onCardFlip(makeCardEvent({ params: { h: '1', v: '0' } }));
      assert.match(flipErr.notification.text, /Select two elements/);

      env.setSelection({ elements: [ref, moved] });
      env.ctx.onCardFlip(makeCardEvent({ params: { h: '1', v: '0' } }));
      assert.equal(ref.getLeft(), 310);
      assert.equal(moved.getLeft(), 0);
    });
  });

  describe('CardService Color Studio handlers', () => {
    it('onCardInspectColor updates the Color card with RGB, HSL, LCH, and Theme details', () => {
      const env = createGasEnv();
      const shape = env.createShape({
        fillColor: ENUMS.ThemeColorType.ACCENT1,
        fillAlpha: 0.8,
      });
      env.setSelection({ elements: [shape] });

      const res = env.ctx.onCardInspectColor(makeCardEvent());
      assert.match(res.notification.text, /#FFAB40/);
      const updatedCard = res.navigation.updatedCard;
      const inspectorWidgets = updatedCard.sections[1].widgets;
      const decorated = inspectorWidgets.find((w) => w._type === 'DecoratedText');
      assert.ok(decorated, 'Expected DecoratedText inspector widget');
      assert.match(decorated.topLabel, /Theme: ACCENT1/);
      assert.match(decorated.text, /#FFAB40/);
      assert.match(decorated.bottomLabel, /RGB: 255, 171, 64/);
      assert.match(decorated.bottomLabel, /LCH:/);
    });

    it('onCardAdjustHsl, onCardSetTransparency, and onCardColorAction update shape & refresh card', () => {
      const env = createGasEnv();
      const shape = env.createShape({
        fillColor: [255, 0, 0],
        fillAlpha: 1,
        text: 'Hello',
      });
      env.setSelection({ elements: [shape] });

      // Relative Hue -30° wraps Red -> Deep Pink (255, 0, 128)
      const hueRes = env.ctx.onCardAdjustHsl(makeCardEvent({ params: { c: 'HUE', v: '-30', abs: '0' } }));
      assert.ok(hueRes.navigation.updatedCard);
      const rgb1 = shape.getFill().getSolidFill().getColor().asRgbColor();
      assert.deepEqual([rgb1.getRed(), rgb1.getGreen(), rgb1.getBlue()], [255, 0, 128]);

      // Exact transparency via form field
      const transRes = env.ctx.onCardSetTransparency(
        makeCardEvent({ params: { fromField: 'transValue' }, form: { transValue: '50' } })
      );
      assert.match(transRes.notification.text, /50%/);
      assert.equal(shape.getFill().getSolidFill().getAlpha(), 0.5);

      // Invert preserves 50% transparency
      env.ctx.onCardColorAction(makeCardEvent({ params: { action: 'invert' } }));
      const rgb2 = shape.getFill().getSolidFill().getColor().asRgbColor();
      assert.deepEqual([rgb2.getRed(), rgb2.getGreen(), rgb2.getBlue()], [0, 255, 127]);
      assert.equal(shape.getFill().getSolidFill().getAlpha(), 0.5);
    });
  });
});
