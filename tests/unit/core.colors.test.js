'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { createGasEnv, ENUMS } = require('./helpers/gas-env');

function getRgb(shape) {
  const rgb = shape.getFill().getSolidFill().getColor().asRgbColor();
  return [rgb.getRed(), rgb.getGreen(), rgb.getBlue()];
}

function getTextRgb(shape) {
  const rgb = shape.getText().getTextStyle().getForegroundColor().asRgbColor();
  return [rgb.getRed(), rgb.getGreen(), rgb.getBlue()];
}

describe('core.colors.js', () => {
  describe('invertColorsOnShape', () => {
    it('inverts RGB and theme solid fills', () => {
      const env = createGasEnv();
      const rgbShape = env.createShape({ fillColor: [255, 255, 255] });
      const themeShape = env.createShape({ fillColor: ENUMS.ThemeColorType.ACCENT1 });
      const transparentShape = env.createShape({ fillType: ENUMS.FillType.NONE });

      env.ctx.invertColorsOnShape(rgbShape);
      env.ctx.invertColorsOnShape(themeShape);
      env.ctx.invertColorsOnShape(transparentShape);

      assert.deepEqual(getRgb(rgbShape), [0, 0, 0]);
      assert.deepEqual(getRgb(themeShape), [0, 255 - 171, 255 - 64]);
      assert.equal(transparentShape.getFill().getType(), ENUMS.FillType.NONE);
    });

    it.todo('Phase 3: preserves fill alpha when inverting colors');
  });

  describe('changeHSL', () => {
    it('changes hue, saturation, and luminosity', () => {
      const env = createGasEnv();
      const { HSL_COMPONENT } = env.ctx;
      const green = env.createShape({ fillColor: [0, 255, 0] });

      // Absolute hue -> 0° (Red)
      env.ctx.changeHSL(green, 0, true, HSL_COMPONENT.HUE);
      assert.deepEqual(getRgb(green), [255, 0, 0]);

      // Absolute saturation -> 0 (Grayscale at L=0.5 -> 128,128,128)
      env.ctx.changeHSL(green, 0, true, HSL_COMPONENT.SATURATION);
      assert.deepEqual(getRgb(green), [128, 128, 128]);

      // Relative luminosity +0.25 -> ~191
      env.ctx.changeHSL(green, 0.25, false, HSL_COMPONENT.LUMINOSITY);
      const [r, g, b] = getRgb(green);
      assert.equal(r, g);
      assert.equal(g, b);
      assert.ok(r > 180 && r < 200, `Expected ~191, got ${r}`);
    });

    it('clamps saturation and luminosity to [0, 1]', () => {
      const env = createGasEnv();
      const { HSL_COMPONENT } = env.ctx;
      const shape = env.createShape({ fillColor: [200, 100, 100] });

      env.ctx.changeHSL(shape, 5, false, HSL_COMPONENT.LUMINOSITY);
      assert.deepEqual(getRgb(shape), [255, 255, 255]);

      env.ctx.changeHSL(shape, -5, false, HSL_COMPONENT.LUMINOSITY);
      assert.deepEqual(getRgb(shape), [0, 0, 0]);
    });

    it.todo('Phase 3: wraps Hue modulo 360° instead of clamping and preserves fill alpha');
  });

  describe('setMaxContrastToTextOnShape', () => {
    it('chooses black or white text according to WCAG contrast ratio', () => {
      const env = createGasEnv();
      const blackBg = env.createShape({ fillColor: [0, 0, 0], text: 'abc' });
      const whiteBg = env.createShape({ fillColor: [255, 255, 255], text: 'abc' });
      const blueBg = env.createShape({ fillColor: [0, 0, 255], text: 'abc' });
      const grayBg = env.createShape({ fillColor: [127, 127, 127], text: 'abc' });
      const noFill = env.createShape({ fillType: ENUMS.FillType.NONE, text: 'abc' });
      noFill.getText().getTextStyle().setForegroundColor(255, 0, 0);

      [blackBg, whiteBg, blueBg, grayBg, noFill].forEach((s) => {
        env.ctx.setMaxContrastToTextOnShape(s);
      });

      assert.deepEqual(getTextRgb(blackBg), [255, 255, 255]);
      assert.deepEqual(getTextRgb(whiteBg), [0, 0, 0]);
      assert.deepEqual(getTextRgb(blueBg), [255, 255, 255]);
      assert.deepEqual(getTextRgb(grayBg), [0, 0, 0]);
      assert.deepEqual(getTextRgb(noFill), [255, 0, 0]);
    });
  });

  describe('setAlphaToShape', () => {
    it('updates alpha while preserving color on solid fills', () => {
      const env = createGasEnv();
      const shape = env.createShape({ fillColor: [10, 20, 30], fillAlpha: 1 });
      const empty = env.createShape({ fillType: ENUMS.FillType.NONE });

      env.ctx.setAlphaToShape(shape, 0.5);
      env.ctx.setAlphaToShape(empty, 0.5);

      assert.deepEqual(getRgb(shape), [10, 20, 30]);
      assert.equal(shape.getFill().getSolidFill().getAlpha(), 0.5);
      assert.equal(empty.getFill().getType(), ENUMS.FillType.NONE);
    });
  });

  describe('swapColorsOnShape', () => {
    it('swaps fill color with text foreground color', () => {
      const env = createGasEnv();
      const shape = env.createShape({ fillColor: [10, 20, 30], text: 'hello' });
      shape.getText().getTextStyle().setForegroundColor(200, 210, 220);

      env.ctx.swapColorsOnShape(shape);

      assert.deepEqual(getRgb(shape), [200, 210, 220]);
      assert.deepEqual(getTextRgb(shape), [10, 20, 30]);
    });

    it('skips shapes without text or solid fill', () => {
      const env = createGasEnv();
      const noText = env.createShape({ fillColor: [10, 20, 30], text: '' });
      env.ctx.swapColorsOnShape(noText);
      assert.deepEqual(getRgb(noText), [10, 20, 30]);
    });

    it.todo('Phase 3: updates all text runs, handles null/unsupported textColor, and preserves fill alpha');
  });
});
