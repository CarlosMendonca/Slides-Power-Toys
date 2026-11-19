'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { createGasEnv } = require('./helpers/gas-env');

describe('core.js', () => {
  describe('snapElement', () => {
    it('snaps position, dimension, and rotation independently', () => {
      const env = createGasEnv();
      const PPI = env.ctx.PPI;
      const shape = env.createShape({
        left: 1.24 * PPI,
        top: 2.36 * PPI,
        width: 3.14 * PPI,
        height: 4.56 * PPI,
        rotation: 12.6,
      });

      env.ctx.snapElement(shape, true, false, false);
      assert.ok(Math.abs(shape.getLeft() - 1.2 * PPI) < 1e-6);
      assert.ok(Math.abs(shape.getTop() - 2.4 * PPI) < 1e-6);
      assert.equal(shape.getWidth(), 3.14 * PPI);
      assert.equal(shape.getRotation(), 12.6);

      env.ctx.snapElement(shape, false, true, false);
      assert.ok(Math.abs(shape.getWidth() - 3.1 * PPI) < 1e-6);
      assert.ok(Math.abs(shape.getHeight() - 4.6 * PPI) < 1e-6);
      assert.equal(shape.getRotation(), 12.6);

      env.ctx.snapElement(shape, false, false, true);
      assert.equal(shape.getRotation(), 13);
    });

    it.todo('Phase 3: does not collapse thin elements (< 0.05 in) to zero dimension and guards non-rotatable tables');
  });

  describe('alignShape', () => {
    it('aligns to inner edges and centers', () => {
      const env = createGasEnv();
      const { POSITION_X, POSITION_Y } = env.ctx;
      const ref = env.createShape({ left: 100, top: 200, width: 80, height: 60 });
      const target = env.createShape({ left: 0, top: 0, width: 20, height: 10 });

      env.ctx.alignShape(ref, target, POSITION_X.LEFT, POSITION_Y.TOP, false);
      assert.equal(target.getLeft(), 100);
      assert.equal(target.getTop(), 200);

      env.ctx.alignShape(ref, target, POSITION_X.RIGHT, POSITION_Y.BOTTOM, false);
      assert.equal(target.getLeft(), 160);
      assert.equal(target.getTop(), 250);

      env.ctx.alignShape(ref, target, POSITION_X.CENTER, POSITION_Y.CENTER, false);
      assert.equal(target.getLeft(), 130);
      assert.equal(target.getTop(), 225);
    });

    it('aligns to outer edges', () => {
      const env = createGasEnv();
      const { POSITION_X, POSITION_Y } = env.ctx;
      const ref = env.createShape({ left: 100, top: 200, width: 80, height: 60 });
      const target = env.createShape({ left: 0, top: 0, width: 20, height: 10 });

      env.ctx.alignShape(ref, target, POSITION_X.LEFT, POSITION_Y.TOP, true);
      assert.equal(target.getLeft(), 80);
      assert.equal(target.getTop(), 190);

      env.ctx.alignShape(ref, target, POSITION_X.RIGHT, POSITION_Y.BOTTOM, true);
      assert.equal(target.getLeft(), 180);
      assert.equal(target.getTop(), 260);
    });
  });

  describe('flipTwoElements', () => {
    it('swaps horizontal, vertical, or both coordinates', () => {
      const env = createGasEnv();
      const a = env.createShape({ left: 10, top: 20 });
      const b = env.createShape({ left: 100, top: 200 });

      env.ctx.flipTwoElements(a, b, true, false);
      assert.equal(a.getLeft(), 100);
      assert.equal(a.getTop(), 20);
      assert.equal(b.getLeft(), 10);
      assert.equal(b.getTop(), 200);

      env.ctx.flipTwoElements(a, b, false, true);
      assert.equal(a.getLeft(), 100);
      assert.equal(a.getTop(), 200);
      assert.equal(b.getLeft(), 10);
      assert.equal(b.getTop(), 20);

      env.ctx.flipTwoElements(a, b, true, true);
      assert.equal(a.getLeft(), 10);
      assert.equal(a.getTop(), 20);
      assert.equal(b.getLeft(), 100);
      assert.equal(b.getTop(), 200);
    });
  });

  describe('adjoinTwoElements', () => {
    it('adjoins horizontally with centering and padding', () => {
      const env = createGasEnv();
      const a = env.createShape({ left: 0, top: 0, width: 72, height: 72 });
      const b = env.createShape({ left: 144, top: 144, width: 144, height: 144 });

      env.ctx.adjoinTwoElements(a, b, true, a, 72);
      assert.equal(a.getLeft(), 0);
      assert.equal(a.getTop(), 0);
      assert.equal(b.getLeft(), 144);
      assert.equal(b.getTop(), -36);
    });

    it('adjoins vertically with centering and padding', () => {
      const env = createGasEnv();
      const a = env.createShape({ left: 0, top: 0, width: 72, height: 72 });
      const b = env.createShape({ left: 144, top: 144, width: 144, height: 144 });

      env.ctx.adjoinTwoElements(a, b, false, a, 72);
      assert.equal(b.getLeft(), -36);
      assert.equal(b.getTop(), 144);
    });

    it('preserves perpendicular coordinate when elementToCenterOn is null', () => {
      const env = createGasEnv();
      const a = env.createShape({ left: 0, top: 0, width: 72, height: 72 });
      const b = env.createShape({ left: 200, top: 144, width: 144, height: 144 });

      env.ctx.adjoinTwoElements(a, b, true, null, 0);
      assert.equal(b.getLeft(), 72);
      assert.equal(b.getTop(), 144);
    });
  });
});
