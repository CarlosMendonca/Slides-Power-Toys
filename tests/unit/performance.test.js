'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { createGasEnv, ENUMS } = require('./helpers/gas-env');

describe('performance (RPC call counts)', () => {
  it('onOpen calls SlidesApp.getUi() only once', () => {
    const env = createGasEnv();
    env.resetRpcCounts();
    env.ctx.onOpen({});
    assert.equal(env.rpcCounts.getUi, 1);
  });

  it('menuCenterOnPage fetches page dimensions only once for N shapes', () => {
    const env = createGasEnv({ pageWidth: 720, pageHeight: 405 });
    const shapes = Array.from({ length: 10 }, (_, i) => env.createShape({ left: i * 10, top: i * 10 }));
    env.setSelection({ elements: shapes });
    env.resetRpcCounts();

    env.ctx.menuCenterOnPage();
    assert.equal(env.rpcCounts.getPageWidth, 1);
    assert.equal(env.rpcCounts.getPageHeight, 1);
  });

  it('resizeElementsToLastSelected reads reference dimensions only once for N shapes', () => {
    const env = createGasEnv();
    const shapes = Array.from({ length: 10 }, () => env.createShape({ width: 50, height: 50 }));
    const ref = env.createShape({ width: 120, height: 80 });
    env.setSelection({ elements: [...shapes, ref] });
    env.resetRpcCounts();

    env.ctx.menuCopyWidthAndHeight();
    assert.equal(env.rpcCounts.getWidth, 1);
    assert.equal(env.rpcCounts.getHeight, 1);
    assert.equal(env.rpcCounts.getPageElementType, 10); // once per target, not twice
  });

  it('alignSelectOrAllElements caches reference bounds once for N shapes', () => {
    const env = createGasEnv();
    const shapes = Array.from({ length: 10 }, (_, i) => env.createShape({ left: i * 10, width: 40 }));
    const ref = env.createShape({ left: 200, top: 100, width: 80, height: 60 });
    env.setSelection({ elements: [...shapes, ref] });
    env.resetRpcCounts();

    env.ctx.menuAlignToInnerRight();
    // Only 1 read of ref.getLeft() (targets never call getLeft in alignToInnerRight)
    assert.equal(env.rpcCounts.getLeft, 1);
    // 1 read of ref.getWidth() + 10 reads of target.getWidth() = 11 (instead of 20)
    assert.equal(env.rpcCounts.getWidth, 11);
  });

  it('adjoinSelectedElements pre-fetches sort keys instead of calling getLeft inside .sort()', () => {
    const env = createGasEnv();
    const shapes = Array.from({ length: 10 }, (_, i) =>
      env.createShape({ left: (10 - i) * 50, top: 0, width: 30, height: 30 })
    );
    const ref = env.createShape({ left: 0, top: 0, width: 30, height: 30 });
    env.setSelection({ elements: [...shapes, ref] });
    env.resetRpcCounts();

    env.ctx.menuAdjoinH();
    // 10 sort-key reads + 1 cacheElementBounds(ref) + 10 adjoinTwoElements(prev.getLeft()) = 21
    // (Without Schwartzian transform, 10 elements in reverse order triggers ~45+ sort comparisons = 90+ reads)
    assert.ok(env.rpcCounts.getLeft <= 22, `Expected <=22 getLeft RPCs, got ${env.rpcCounts.getLeft}`);
  });

  it('withShapesOrGroupsRecursively checks getPageElementType only once per element', () => {
    const env = createGasEnv();
    const shapes = Array.from({ length: 8 }, () => env.createShape({ fillColor: [10, 20, 30] }));
    env.resetRpcCounts();

    env.ctx.withShapesOrGroupsRecursively(shapes, () => {});
    assert.equal(env.rpcCounts.getPageElementType, 8);
  });

  it('color operations call shape.getFill() only once per shape', () => {
    const env = createGasEnv();
    const shape = env.createShape({
      fillColor: ENUMS.ThemeColorType.ACCENT1,
      fillAlpha: 0.8,
      text: 'Hello',
    });

    env.resetRpcCounts();
    env.ctx.invertColorsOnShape(shape);
    assert.equal(env.rpcCounts.getFill, 1);

    env.resetRpcCounts();
    env.ctx.changeHSL(shape, 0.1, false, env.ctx.HSL_COMPONENT.HUE);
    assert.equal(env.rpcCounts.getFill, 1);

    env.resetRpcCounts();
    env.ctx.changeHSV(shape, 0.1, false, env.ctx.HSV_COMPONENT.VALUE);
    assert.equal(env.rpcCounts.getFill, 1);

    env.resetRpcCounts();
    env.ctx.changeHWB(shape, 0.1, false, env.ctx.HWB_COMPONENT.WHITENESS);
    assert.equal(env.rpcCounts.getFill, 1);

    env.resetRpcCounts();
    env.ctx.changeOKLCH(shape, 15, false, env.ctx.OKLCH_COMPONENT.HUE);
    assert.equal(env.rpcCounts.getFill, 1);

    env.resetRpcCounts();
    env.ctx.setMaxContrastToTextOnShape(shape);
    assert.equal(env.rpcCounts.getFill, 1);

    env.resetRpcCounts();
    env.ctx.swapColorsOnShape(shape);
    assert.equal(env.rpcCounts.getFill, 1);
  });
});
