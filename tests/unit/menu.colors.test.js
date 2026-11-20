'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { createGasEnv } = require('./helpers/gas-env');

function getRgb(shape) {
  const rgb = shape.getFill().getSolidFill().getColor().asRgbColor();
  return [rgb.getRed(), rgb.getGreen(), rgb.getBlue()];
}

describe('menu.colors.js', () => {
  it('executes OKLCH Lightness, Chroma, and Hue menu commands preserving alpha and groups', () => {
    const env = createGasEnv();
    const s1 = env.createShape({ fillColor: [255, 0, 0], fillAlpha: 0.7, addToPage: false });
    const s2 = env.createShape({ fillColor: [33, 150, 243], fillAlpha: 0.9, addToPage: false });
    const group = env.createGroup([s1, s2]);
    env.setSelection({ elements: [group] });

    // Desaturate via OKLCH Chroma = 0
    env.ctx.menuSetColorOklchChromaAbs0();
    const [r1, g1, b1] = getRgb(s1);
    assert.equal(r1, g1);
    assert.equal(g1, b1);
    assert.equal(s1.getFill().getSolidFill().getAlpha(), 0.7);
    assert.equal(s2.getFill().getSolidFill().getAlpha(), 0.9);

    // Raise OKLCH Lightness to 90%
    env.ctx.menuSetColorOklchLightnessAbs90();
    assert.ok(getRgb(s1)[0] > 210, `Expected light gray at L=90%, got ${getRgb(s1)}`);

    // Set OKLCH Chroma 0.20 + Hue 150° (Green)
    env.ctx.menuSetColorOklchLightnessAbs66();
    env.ctx.menuSetColorOklchChromaAbs20();
    env.ctx.menuSetColorOklchHue150();
    const [gr, gg, gb] = getRgb(s1);
    assert.ok(gg > gr && gg > gb, `Expected green-dominant RGB at OKLCH H=150°, got [${gr},${gg},${gb}]`);
  });

  it('executes HSV Saturation and Value menu commands', () => {
    const env = createGasEnv();
    const shape = env.createShape({ fillColor: [255, 0, 0], fillAlpha: 0.5 });
    env.setSelection({ elements: [shape] });

    env.ctx.menuSetColorHsvValueAbs50();
    assert.deepEqual(getRgb(shape), [128, 0, 0]);
    assert.equal(shape.getFill().getSolidFill().getAlpha(), 0.5);

    env.ctx.menuSetColorHsvSaturationAbs50();
    assert.deepEqual(getRgb(shape), [128, 64, 64]);
  });

  it('executes HWB Whiteness and Blackness menu commands', () => {
    const env = createGasEnv();
    const shape = env.createShape({ fillColor: [255, 0, 0], fillAlpha: 0.4 });
    env.setSelection({ elements: [shape] });

    env.ctx.menuSetColorHwbWhitenessAbs50();
    assert.deepEqual(getRgb(shape), [255, 128, 128]);
    assert.equal(shape.getFill().getSolidFill().getAlpha(), 0.4);

    env.ctx.menuSetColorHwbWhitenessAbs0();
    env.ctx.menuSetColorHwbBlacknessAbs50();
    assert.deepEqual(getRgb(shape), [128, 0, 0]);
    assert.equal(shape.getFill().getSolidFill().getAlpha(), 0.4);
  });

  it('preserves backwards-compatible HSL menu handlers', () => {
    const env = createGasEnv();
    const shape = env.createShape({ fillColor: [0, 255, 0] });
    env.setSelection({ elements: [shape] });

    env.ctx.menuSetColorHue0();
    assert.deepEqual(getRgb(shape), [255, 0, 0]);

    env.ctx.menuSetColorSaturationAbs0();
    assert.deepEqual(getRgb(shape), [128, 128, 128]);
  });
});
