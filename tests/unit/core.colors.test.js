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

    it('preserves fill alpha when inverting colors', () => {
      const env = createGasEnv();
      const shape = env.createShape({ fillColor: [200, 100, 50], fillAlpha: 0.4 });

      env.ctx.invertColorsOnShape(shape);

      assert.deepEqual(getRgb(shape), [55, 155, 205]);
      assert.equal(shape.getFill().getSolidFill().getAlpha(), 0.4);
    });
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

    it('wraps Hue modulo 360° instead of clamping and preserves fill alpha', () => {
      const env = createGasEnv();
      const { HSL_COMPONENT } = env.ctx;

      // Red (0°) minus 30° should wrap to 330° (deep pink: 255, 0, 128), NOT stay Red!
      const red = env.createShape({ fillColor: [255, 0, 0], fillAlpha: 0.6 });
      env.ctx.changeHSL(red, -30 / 360, false, HSL_COMPONENT.HUE);
      assert.deepEqual(getRgb(red), [255, 0, 128]);
      assert.equal(red.getFill().getSolidFill().getAlpha(), 0.6);

      // 330° (quantized in 8-bit RGB as [255, 0, 128] ≈ 329.88°) plus 60° wraps past 360° to ~30° (orange)
      env.ctx.changeHSL(red, 60 / 360, false, HSL_COMPONENT.HUE);
      const [r, g, b] = getRgb(red);
      assert.equal(r, 255);
      assert.ok(Math.abs(g - 128) <= 1, `Expected G ≈ 128, got ${g}`);
      assert.equal(b, 0);
      assert.equal(red.getFill().getSolidFill().getAlpha(), 0.6);
    });
  });

  describe('changeHSV', () => {
    it('adjusts HSV hue, saturation, and value while preserving fill alpha', () => {
      const env = createGasEnv();
      const { HSV_COMPONENT } = env.ctx;
      const shape = env.createShape({ fillColor: [255, 0, 0], fillAlpha: 0.7 });

      // Value -> 50% gives dark red [128, 0, 0]
      env.ctx.changeHSV(shape, 0.5, true, HSV_COMPONENT.VALUE);
      assert.deepEqual(getRgb(shape), [128, 0, 0]);
      assert.equal(shape.getFill().getSolidFill().getAlpha(), 0.7);

      // Saturation -> 50% gives [128, 64, 64]
      env.ctx.changeHSV(shape, 0.5, true, HSV_COMPONENT.SATURATION);
      assert.deepEqual(getRgb(shape), [128, 64, 64]);
      assert.equal(shape.getFill().getSolidFill().getAlpha(), 0.7);

      // Hue wrap -120° from Red -> Blue-ish [64, 64, 128]
      env.ctx.changeHSV(shape, -120 / 360, false, HSV_COMPONENT.HUE);
      assert.deepEqual(getRgb(shape), [64, 64, 128]);
    });
  });

  describe('changeHWB', () => {
    it('adjusts HWB whiteness, blackness, and hue while preserving alpha and normalizing W+B>=1', () => {
      const env = createGasEnv();
      const { HWB_COMPONENT } = env.ctx;
      const shape = env.createShape({ fillColor: [255, 0, 0], fillAlpha: 0.5 });

      // Add 50% whiteness -> pink tint [255, 128, 128]
      env.ctx.changeHWB(shape, 0.5, false, HWB_COMPONENT.WHITENESS);
      assert.deepEqual(getRgb(shape), [255, 128, 128]);
      assert.equal(shape.getFill().getSolidFill().getAlpha(), 0.5);

      // Set blackness to 50% -> W=0.5, B=0.5 -> achromatic mid-gray [128, 128, 128]
      env.ctx.changeHWB(shape, 0.5, true, HWB_COMPONENT.BLACKNESS);
      assert.deepEqual(getRgb(shape), [128, 128, 128]);
      assert.equal(shape.getFill().getSolidFill().getAlpha(), 0.5);
    });
  });

  describe('changeOKLCH', () => {
    it('adjusts OKLCH lightness, chroma, and hue with wrapping, gamut mapping, and alpha preservation', () => {
      const env = createGasEnv();
      const { OKLCH_COMPONENT } = env.ctx;
      const shape = env.createShape({ fillColor: [255, 0, 0], fillAlpha: 0.8 });

      // Absolute chroma 0 -> achromatic gray preserving lightness (~0.628)
      env.ctx.changeOKLCH(shape, 0, true, OKLCH_COMPONENT.CHROMA);
      const [gr, gg, gb] = getRgb(shape);
      assert.equal(gr, gg);
      assert.equal(gg, gb);
      assert.ok(gr > 120 && gr < 155, `Expected mid-light gray for L≈0.628, got ${gr}`);
      assert.equal(shape.getFill().getSolidFill().getAlpha(), 0.8);

      // Vivid color with high chroma + hue wrap around 0°/360°
      const blue = env.createShape({ fillColor: [33, 150, 243], fillAlpha: 0.65 });
      const before = Array.from(env.ctx.convertRgbColorToOklchColorVector(blue.getFill().getSolidFill().getColor().asRgbColor()));

      // Shift hue by +15° preserving perceived lightness closely
      env.ctx.changeOKLCH(blue, 15, false, OKLCH_COMPONENT.HUE);
      const after = Array.from(env.ctx.convertRgbColorToOklchColorVector(blue.getFill().getSolidFill().getColor().asRgbColor()));
      assert.ok(Math.abs(after[0] - before[0]) < 0.02, `Expected L preserved: ${before[0]} -> ${after[0]}`);
      assert.ok(Math.abs(after[2] - (before[2] + 15)) < 2.0, `Expected H shifted +15°: ${before[2]} -> ${after[2]}`);
      assert.equal(blue.getFill().getSolidFill().getAlpha(), 0.65);

      // Push lightness up +0.20 (gamut-mapped cleanly into valid RGB)
      env.ctx.changeOKLCH(blue, 0.2, false, OKLCH_COMPONENT.LIGHTNESS);
      const rgb = getRgb(blue);
      for (const ch of rgb) {
        assert.ok(ch >= 0 && ch <= 255);
      }
      assert.equal(blue.getFill().getSolidFill().getAlpha(), 0.65);
    });
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

    it('updates all text runs, handles null/unsupported textColor, and preserves fill alpha', () => {
      const env = createGasEnv();
      const multiRun = env.createShape({
        fillColor: [10, 20, 30],
        fillAlpha: 0.75,
        runs: [
          { text: 'Hello ', color: [200, 210, 220] },
          { text: 'World', color: [50, 60, 70] },
        ],
      });

      env.ctx.swapColorsOnShape(multiRun);

      assert.deepEqual(getRgb(multiRun), [200, 210, 220]);
      assert.equal(multiRun.getFill().getSolidFill().getAlpha(), 0.75);
      for (const run of multiRun.getText().getRuns()) {
        const fg = run.getTextStyle().getForegroundColor().asRgbColor();
        assert.deepEqual([fg.getRed(), fg.getGreen(), fg.getBlue()], [10, 20, 30]);
      }

      // Null foreground color should safely no-op without throwing
      const nullFg = env.createShape({
        fillColor: [10, 20, 30],
        runs: [{ text: 'inherited', color: null }],
      });
      assert.doesNotThrow(() => env.ctx.swapColorsOnShape(nullFg));
      assert.deepEqual(getRgb(nullFg), [10, 20, 30]);
    });
  });
});
