'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { createGasEnv, createRgbColor } = require('./helpers/gas-env');

const SAMPLE_RGBS = [
  [0, 0, 0],
  [255, 255, 255],
  [128, 128, 128],
  [255, 0, 0],
  [0, 255, 0],
  [0, 0, 255],
  [255, 255, 0],
  [0, 255, 255],
  [255, 0, 255],
  [255, 171, 64],
  [33, 150, 243],
  [128, 64, 192],
  [18, 52, 86],
];

describe('util.colors.js', () => {
  describe('HSV conversions', () => {
    it('matches known HSV values for primaries and achromatic colors', () => {
      const { ctx } = createGasEnv();
      assert.deepEqual(Array.from(ctx.convertRgbColorVectorToHsvColorVector([255, 0, 0])), [0, 1, 1]);
      assert.deepEqual(Array.from(ctx.convertRgbColorVectorToHsvColorVector([0, 255, 0])), [1 / 3, 1, 1]);
      assert.deepEqual(Array.from(ctx.convertRgbColorVectorToHsvColorVector([0, 0, 255])), [2 / 3, 1, 1]);
      assert.deepEqual(Array.from(ctx.convertRgbColorVectorToHsvColorVector([0, 0, 0])), [0, 0, 0]);
      assert.deepEqual(Array.from(ctx.convertRgbColorVectorToHsvColorVector([255, 255, 255])), [0, 0, 1]);
      assert.deepEqual(Array.from(ctx.convertRgbColorVectorToHsvColorVector([128, 64, 64])), [0, 0.5, 128 / 255]);
    });

    it('round-trips arbitrary RGB colors through HSV', () => {
      const { ctx } = createGasEnv();
      for (const rgb of SAMPLE_RGBS) {
        const hsv = ctx.convertRgbColorToHsvColorVector(createRgbColor(...rgb));
        const back = Array.from(ctx.convertHsvColorVectorToRgbColorVector(hsv));
        assert.deepEqual(back, rgb);
      }
    });
  });

  describe('HWB conversions', () => {
    it('matches known CSS Color 4 HWB values', () => {
      const { ctx } = createGasEnv();
      assert.deepEqual(Array.from(ctx.convertRgbColorVectorToHwbColorVector([255, 0, 0])), [0, 0, 0]);
      assert.deepEqual(Array.from(ctx.convertRgbColorVectorToHwbColorVector([0, 0, 0])), [0, 0, 1]);
      assert.deepEqual(Array.from(ctx.convertRgbColorVectorToHwbColorVector([255, 255, 255])), [0, 1, 0]);
      // 50% white + 0% black on Red -> [255, 128, 128]
      assert.deepEqual(Array.from(ctx.convertHwbColorVectorToRgbColorVector([0, 0.5, 0])), [255, 128, 128]);
      // 0% white + 50% black on Red -> [128, 0, 0]
      assert.deepEqual(Array.from(ctx.convertHwbColorVectorToRgbColorVector([0, 0, 0.5])), [128, 0, 0]);
    });

    it('normalizes W + B >= 1 to achromatic gray per CSS Color 4', () => {
      const { ctx } = createGasEnv();
      // W = 0.6, B = 0.6 -> gray = 0.6 / 1.2 = 0.5 -> [128, 128, 128]
      assert.deepEqual(Array.from(ctx.convertHwbColorVectorToRgbColorVector([0.2, 0.6, 0.6])), [128, 128, 128]);
      // W = 0.8, B = 0.4 -> gray = 0.8 / 1.2 = 2/3 -> [170, 170, 170]
      assert.deepEqual(Array.from(ctx.convertHwbColorVectorToRgbColorVector([0.5, 0.8, 0.4])), [170, 170, 170]);
    });

    it('round-trips arbitrary RGB colors through HWB', () => {
      const { ctx } = createGasEnv();
      for (const rgb of SAMPLE_RGBS) {
        const hwb = ctx.convertRgbColorToHwbColorVector(createRgbColor(...rgb));
        const back = Array.from(ctx.convertHwbColorVectorToRgbColorVector(hwb));
        assert.deepEqual(back, rgb);
      }
    });
  });

  describe('OKLCH conversions', () => {
    it('matches Björn Ottosson / CSS Color 4 reference values for sRGB primaries and grays', () => {
      const { ctx } = createGasEnv();

      const black = Array.from(ctx.convertRgbColorVectorToOklchColorVector([0, 0, 0]));
      assert.deepEqual(black, [0, 0, 0]);

      const white = Array.from(ctx.convertRgbColorVectorToOklchColorVector([255, 255, 255]));
      assert.ok(Math.abs(white[0] - 1) < 1e-4);
      assert.equal(white[1], 0);

      // sRGB Red (#ff0000): L ≈ 0.62796, C ≈ 0.25768, H ≈ 29.23°
      const red = Array.from(ctx.convertRgbColorVectorToOklchColorVector([255, 0, 0]));
      assert.ok(Math.abs(red[0] - 0.628) < 0.002, `Red L=${red[0]}`);
      assert.ok(Math.abs(red[1] - 0.2577) < 0.002, `Red C=${red[1]}`);
      assert.ok(Math.abs(red[2] - 29.23) < 0.2, `Red H=${red[2]}`);

      // sRGB Green (#00ff00): L ≈ 0.86644, C ≈ 0.29483, H ≈ 142.50°
      const green = Array.from(ctx.convertRgbColorVectorToOklchColorVector([0, 255, 0]));
      assert.ok(Math.abs(green[0] - 0.8664) < 0.002, `Green L=${green[0]}`);
      assert.ok(Math.abs(green[1] - 0.2948) < 0.002, `Green C=${green[1]}`);
      assert.ok(Math.abs(green[2] - 142.5) < 0.2, `Green H=${green[2]}`);

      // sRGB Blue (#0000ff): L ≈ 0.45201, C ≈ 0.31321, H ≈ 264.05°
      const blue = Array.from(ctx.convertRgbColorVectorToOklchColorVector([0, 0, 255]));
      assert.ok(Math.abs(blue[0] - 0.452) < 0.002, `Blue L=${blue[0]}`);
      assert.ok(Math.abs(blue[1] - 0.3132) < 0.002, `Blue C=${blue[1]}`);
      assert.ok(Math.abs(blue[2] - 264.05) < 0.2, `Blue H=${blue[2]}`);
    });

    it('round-trips arbitrary sRGB colors through OKLCH within ±1 quantization', () => {
      const { ctx } = createGasEnv();
      for (const rgb of SAMPLE_RGBS) {
        const oklch = ctx.convertRgbColorToOklchColorVector(createRgbColor(...rgb));
        const back = Array.from(ctx.convertOklchColorVectorToRgbColorVector(oklch));
        for (let i = 0; i < 3; i++) {
          assert.ok(
            Math.abs(back[i] - rgb[i]) <= 1,
            `Mismatch for ${rgb} -> ${oklch} -> ${back}`
          );
        }
      }
    });

    it('gamut-maps out-of-gamut OKLCH colors into valid [0, 255] sRGB while preserving L and H', () => {
      const { ctx } = createGasEnv();
      // Very high chroma (0.40) at L=0.70, H=260° (blue) is far outside sRGB gamut
      const mappedRgb = Array.from(ctx.convertOklchColorVectorToRgbColorVector([0.7, 0.4, 260]));
      for (const ch of mappedRgb) {
        assert.ok(Number.isInteger(ch) && ch >= 0 && ch <= 255, `Invalid channel: ${ch}`);
      }
      // Converting back should preserve lightness (~0.70) and hue (~260°) closely
      const mappedOklch = Array.from(ctx.convertRgbColorVectorToOklchColorVector(mappedRgb));
      assert.ok(Math.abs(mappedOklch[0] - 0.7) < 0.02, `Lightness drifted: ${mappedOklch[0]}`);
      assert.ok(Math.abs(mappedOklch[2] - 260) < 2.0, `Hue drifted: ${mappedOklch[2]}`);
      assert.ok(mappedOklch[1] > 0.05 && mappedOklch[1] < 0.4, `Unexpected mapped chroma: ${mappedOklch[1]}`);
    });

    it('wraps negative and >=360° OKLCH hues cleanly', () => {
      const { ctx } = createGasEnv();
      const a = Array.from(ctx.convertOklchColorVectorToRgbColorVector([0.65, 0.12, 30]));
      const b = Array.from(ctx.convertOklchColorVectorToRgbColorVector([0.65, 0.12, 390]));
      const c = Array.from(ctx.convertOklchColorVectorToRgbColorVector([0.65, 0.12, -330]));
      assert.deepEqual(a, b);
      assert.deepEqual(a, c);
    });
  });
});
