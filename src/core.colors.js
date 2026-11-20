// Copyright 2019 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// CORE LOGIC FOR COLOR OPERATIONS

function invertColorsOnShape(shape) {
  const fill = shape.getFill();
  if (fill.getType() !== SlidesApp.FillType.SOLID) return;

  const solidFill = fill.getSolidFill();
  const rgbColor = resolveRgbColor(shape, solidFill.getColor());
  if (!rgbColor) return;

  const alpha = solidFill.getAlpha();

  fill.setSolidFill(
    255 - rgbColor.getRed(),
    255 - rgbColor.getGreen(),
    255 - rgbColor.getBlue(),
    alpha
  );
}

function applyColorVectorTransform(
  shape,
  toSpaceFn,
  fromSpaceFn,
  component,
  valueChange,
  isAbsoluteChange,
  options
) {
  const fill = shape.getFill();
  if (fill.getType() !== SlidesApp.FillType.SOLID) return;

  const solidFill = fill.getSolidFill();
  const rgbColor = resolveRgbColor(shape, solidFill.getColor());
  if (!rgbColor) return;

  const alpha = solidFill.getAlpha();
  const vec = toSpaceFn(rgbColor);
  const baseValue = isAbsoluteChange ? 0 : vec[component];

  if (options && options.wrapPeriod) {
    const period = options.wrapPeriod;
    vec[component] = (((baseValue + valueChange) % period) + period) % period;
  } else {
    const min = options && typeof options.min === 'number' ? options.min : 0;
    const max = options && typeof options.max === 'number' ? options.max : 1;
    vec[component] = clamp(baseValue + valueChange, min, max);
  }

  const rgbColorVector = fromSpaceFn(vec);

  fill.setSolidFill(
    rgbColorVector[0],
    rgbColorVector[1],
    rgbColorVector[2],
    alpha
  );
}

function changeHSL(shape, valueChange, isAbsoluteChange, hslComponent) {
  const opts = hslComponent === HSL_COMPONENT.HUE
    ? { wrapPeriod: 1 }
    : { min: 0, max: 1 };
  applyColorVectorTransform(
    shape,
    convertRgbColorToHslColorVector,
    convertHslColorVectorToRgbColorVector,
    hslComponent,
    valueChange,
    isAbsoluteChange,
    opts
  );
}

function changeHSV(shape, valueChange, isAbsoluteChange, hsvComponent) {
  const opts = hsvComponent === HSV_COMPONENT.HUE
    ? { wrapPeriod: 1 }
    : { min: 0, max: 1 };
  applyColorVectorTransform(
    shape,
    convertRgbColorToHsvColorVector,
    convertHsvColorVectorToRgbColorVector,
    hsvComponent,
    valueChange,
    isAbsoluteChange,
    opts
  );
}

function changeHWB(shape, valueChange, isAbsoluteChange, hwbComponent) {
  const opts = hwbComponent === HWB_COMPONENT.HUE
    ? { wrapPeriod: 1 }
    : { min: 0, max: 1 };
  applyColorVectorTransform(
    shape,
    convertRgbColorToHwbColorVector,
    convertHwbColorVectorToRgbColorVector,
    hwbComponent,
    valueChange,
    isAbsoluteChange,
    opts
  );
}

function changeOKLCH(shape, valueChange, isAbsoluteChange, oklchComponent) {
  let opts;
  if (oklchComponent === OKLCH_COMPONENT.HUE) {
    opts = { wrapPeriod: 360 };
  } else if (oklchComponent === OKLCH_COMPONENT.CHROMA) {
    opts = { min: 0, max: 0.4 };
  } else {
    opts = { min: 0, max: 1 };
  }
  applyColorVectorTransform(
    shape,
    convertRgbColorToOklchColorVector,
    convertOklchColorVectorToRgbColorVector,
    oklchComponent,
    valueChange,
    isAbsoluteChange,
    opts
  );
}

function setMaxContrastToTextOnShape(shape) {
  const fill = shape.getFill();
  if (fill.getType() !== SlidesApp.FillType.SOLID || !doesShapeHaveText(shape)) return;

  const rgbColor = resolveRgbColor(shape, fill.getSolidFill().getColor());
  if (!rgbColor) return;

  const fillRgbVector = convertRgbColorToRgbColorVector(rgbColor);
  const blackVsFillContrast = calculateContrastRatio(fillRgbVector, [0, 0, 0]);
  const whiteVsFillContrast = calculateContrastRatio(fillRgbVector, [255, 255, 255]);

  if (blackVsFillContrast > whiteVsFillContrast) {
    shape.getText().getTextStyle().setForegroundColor(0, 0, 0);
  } else {
    shape.getText().getTextStyle().setForegroundColor(255, 255, 255);
  }
}

function setAlphaToShape(shape, amount) {
  const fill = shape.getFill();

  if (fill.getType() === SlidesApp.FillType.SOLID) {
    fill.setSolidFill(fill.getSolidFill().getColor(), amount);
  }
}

function swapColorsOnShape(shape) {
  const fill = shape.getFill();
  if (fill.getType() !== SlidesApp.FillType.SOLID || !doesShapeHaveText(shape)) return;

  const textRange = shape.getText();
  const runs = textRange.getRuns();
  if (!runs || runs.length === 0) return;

  const textColor = runs[0].getTextStyle().getForegroundColor();
  if (!textColor || textColor.getColorType() === SlidesApp.ColorType.UNSUPPORTED) return;

  const solidFill = fill.getSolidFill();
  const fillColor = solidFill.getColor();
  if (!fillColor || fillColor.getColorType() === SlidesApp.ColorType.UNSUPPORTED) return;

  const fillAlpha = solidFill.getAlpha();

  textRange.getTextStyle().setForegroundColor(fillColor);
  fill.setSolidFill(textColor, fillAlpha);
}
