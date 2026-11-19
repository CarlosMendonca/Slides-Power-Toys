'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { createGasEnv, createRgbColor, ENUMS } = require('./helpers/gas-env');

describe('util.js', () => {
  describe('roundTo', () => {
    it('rounds numbers to the requested decimal precision', () => {
      const { ctx } = createGasEnv();
      assert.equal(ctx.roundTo(1.23, 1), 1.2);
      assert.equal(ctx.roundTo(1.26, 1), 1.3);
      assert.equal(ctx.roundTo(1.23, 0), 1);
      assert.equal(ctx.roundTo(1.2, 1), 1.2);
      assert.equal(ctx.roundTo(1.2345, 3), 1.235);
      assert.equal(ctx.roundTo(-1.26, 1), -1.3);
    });
  });

  describe('clamp', () => {
    it('clamps values within [min, max]', () => {
      const { ctx } = createGasEnv();
      assert.equal(ctx.clamp(0.5, 0, 1), 0.5);
      assert.equal(ctx.clamp(-0.2, 0, 1), 0);
      assert.equal(ctx.clamp(1.5, 0, 1), 1);
      assert.equal(ctx.clamp(0, 0, 1), 0);
      assert.equal(ctx.clamp(1, 0, 1), 1);
    });
  });

  describe('fakePageAsReferenceElement', () => {
    it('returns page bounds starting at (0, 0)', () => {
      const { ctx } = createGasEnv({ pageWidth: 960, pageHeight: 540 });
      const pageRef = ctx.fakePageAsReferenceElement();
      assert.equal(pageRef.getLeft(), 0);
      assert.equal(pageRef.getTop(), 0);
      assert.equal(pageRef.getWidth(), 960);
      assert.equal(pageRef.getHeight(), 540);
    });
  });

  describe('RGB <-> HSL conversions', () => {
    it('converts primary and achromatic RGB colors to HSL', () => {
      const { ctx } = createGasEnv();
      assert.deepEqual(Array.from(ctx.convertRgbColorToHslColorVector(createRgbColor(255, 0, 0))), [0, 1, 0.5]);
      assert.deepEqual(Array.from(ctx.convertRgbColorToHslColorVector(createRgbColor(0, 255, 0))), [1 / 3, 1, 0.5]);
      assert.deepEqual(Array.from(ctx.convertRgbColorToHslColorVector(createRgbColor(0, 0, 255))), [2 / 3, 1, 0.5]);
      assert.deepEqual(Array.from(ctx.convertRgbColorToHslColorVector(createRgbColor(0, 0, 0))), [0, 0, 0]);
      assert.deepEqual(Array.from(ctx.convertRgbColorToHslColorVector(createRgbColor(255, 255, 255))), [0, 0, 1]);
      assert.deepEqual(Array.from(ctx.convertRgbColorToHslColorVector(createRgbColor(128, 128, 128))), [0, 0, 128 / 255]);
    });

    it('round-trips arbitrary RGB colors through HSL', () => {
      const { ctx } = createGasEnv();
      const samples = [
        [255, 0, 0],
        [0, 255, 0],
        [0, 0, 255],
        [255, 171, 64],
        [33, 150, 243],
        [128, 64, 192],
        [0, 0, 0],
        [255, 255, 255],
        [127, 127, 127],
      ];
      for (const rgb of samples) {
        const hsl = ctx.convertRgbColorToHslColorVector(createRgbColor(...rgb));
        const back = Array.from(ctx.convertHslColorVectorToRgbColorVector(hsl));
        assert.deepEqual(back, rgb);
      }
    });
  });

  describe('calculateRelativeLuminosity (WCAG contrast ratio)', () => {
    it('matches expected WCAG contrast ratios for standard colors', () => {
      const { ctx } = createGasEnv();
      assert.equal(ctx.calculateRelativeLuminosity([255, 255, 255], [0, 0, 0]), 21);
      assert.equal(ctx.calculateRelativeLuminosity([127, 127, 127], [127, 127, 127]), 1);
      assert.ok(Math.abs(ctx.calculateRelativeLuminosity([255, 255, 255], [255, 0, 0]) - 3.998) < 0.01);
      assert.ok(Math.abs(ctx.calculateRelativeLuminosity([0, 0, 0], [255, 0, 0]) - 5.252) < 0.01);
      assert.ok(Math.abs(ctx.calculateRelativeLuminosity([255, 255, 255], [0, 0, 255]) - 8.592) < 0.01);
      assert.ok(Math.abs(ctx.calculateRelativeLuminosity([0, 0, 0], [0, 0, 255]) - 2.444) < 0.01);
    });

    it('is symmetric with respect to argument order', () => {
      const { ctx } = createGasEnv();
      const a = ctx.calculateRelativeLuminosity([255, 171, 64], [0, 0, 0]);
      const b = ctx.calculateRelativeLuminosity([0, 0, 0], [255, 171, 64]);
      assert.equal(a, b);
    });
  });

  describe('shape helpers', () => {
    it('detects solid fill and non-empty text', () => {
      const env = createGasEnv();
      const emptyShape = env.createShape({ fillType: ENUMS.FillType.NONE, text: '' });
      const filledTextShape = env.createShape({ fillColor: [10, 20, 30], text: 'Hello' });

      assert.equal(env.ctx.doesShapeHaveSolidFill(emptyShape), false);
      assert.equal(env.ctx.doesShapeHaveText(emptyShape), false);
      assert.equal(env.ctx.doesShapeHaveSolidFill(filledTextShape), true);
      assert.equal(env.ctx.doesShapeHaveText(filledTextShape), true);
    });

    it('resolves RGB and THEME colors via getRgbColorFromShapeColor', () => {
      const env = createGasEnv();
      const rgbShape = env.createShape({ fillColor: [12, 34, 56] });
      const themeShape = env.createShape({ fillColor: ENUMS.ThemeColorType.ACCENT1 });

      const rgb1 = env.ctx.getRgbColorFromShapeColor(rgbShape);
      assert.deepEqual([rgb1.getRed(), rgb1.getGreen(), rgb1.getBlue()], [12, 34, 56]);

      const rgb2 = env.ctx.getRgbColorFromShapeColor(themeShape);
      assert.deepEqual([rgb2.getRed(), rgb2.getGreen(), rgb2.getBlue()], [255, 171, 64]);
    });

    it.todo('Phase 3: getRgbColorFromShapeColor supports LAYOUT/MASTER pages and returns null on UNSUPPORTED colors without leaking globals');
  });
});
