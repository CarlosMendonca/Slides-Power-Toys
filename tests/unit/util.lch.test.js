'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { createGasEnv } = require('./helpers/gas-env');

describe('util.lch.js', () => {
  describe('convertRgbColorVectorToLchColorVector', () => {
    it('converts black and white to L=0 and L=100 with ~0 chroma', () => {
      const { ctx } = createGasEnv();
      const black = ctx.convertRgbColorVectorToLchColorVector([0, 0, 0]);
      assert.ok(Math.abs(black[0] - 0) < 0.01);
      assert.ok(Math.abs(black[1] - 0) < 0.01);

      const white = ctx.convertRgbColorVectorToLchColorVector([255, 255, 255]);
      assert.ok(Math.abs(white[0] - 100) < 0.1);
      assert.ok(Math.abs(white[1] - 0) < 0.1);
    });

    it('converts sRGB red to expected CIE LCH values', () => {
      const { ctx } = createGasEnv();
      const red = ctx.convertRgbColorVectorToLchColorVector([255, 0, 0]);
      // Standard CIE LCH for sRGB #ff0000 is approximately L=54.29, C=106.84, H=40.85°
      assert.ok(Math.abs(red[0] - 54.29) < 0.5, `Expected L~54.29, got ${red[0]}`);
      assert.ok(Math.abs(red[1] - 106.84) < 0.5, `Expected C~106.84, got ${red[1]}`);
      assert.ok(Math.abs(red[2] - 40.85) < 0.5, `Expected H~40.85, got ${red[2]}`);
    });

    it('keeps hue angle in [0, 360)', () => {
      const { ctx } = createGasEnv();
      const samples = [
        [255, 0, 0],
        [0, 255, 0],
        [0, 0, 255],
        [255, 0, 255],
        [0, 255, 255],
        [255, 255, 0],
      ];
      for (const rgb of samples) {
        const [, , h] = ctx.convertRgbColorVectorToLchColorVector(rgb);
        assert.ok(h >= 0 && h < 360, `Expected hue in [0, 360), got ${h} for ${rgb}`);
      }
    });
  });

  describe('multiplyMatrices', () => {
    it('multiplies a 3x3 matrix by a 3-element vector', () => {
      const { ctx } = createGasEnv();
      const identity = [
        [1, 0, 0],
        [0, 1, 0],
        [0, 0, 1],
      ];
      assert.deepEqual(ctx.multiplyMatrices(identity, [3, 4, 5]), [3, 4, 5]);
    });

    it('multiplies two 2x2 matrices', () => {
      const { ctx } = createGasEnv();
      const A = [[1, 2], [3, 4]];
      const B = [[5, 6], [7, 8]];
      assert.deepEqual(ctx.multiplyMatrices(A, B), [[19, 22], [43, 50]]);
    });
  });
});
