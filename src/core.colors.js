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

function changeHSL(shape, valueChange, isAbsoluteChange, hslComponent) {
  const fill = shape.getFill();
  if (fill.getType() !== SlidesApp.FillType.SOLID) return;

  const solidFill = fill.getSolidFill();
  const rgbColor = resolveRgbColor(shape, solidFill.getColor());
  if (!rgbColor) return;

  const alpha = solidFill.getAlpha();
  const hslColorVector = convertRgbColorToHslColorVector(rgbColor);

  const baseValue = isAbsoluteChange ? 0 : hslColorVector[hslComponent];
  if (hslComponent === HSL_COMPONENT.HUE) {
    hslColorVector[hslComponent] = (((baseValue + valueChange) % 1) + 1) % 1;
  } else {
    hslColorVector[hslComponent] = clamp(baseValue + valueChange, 0, 1);
  }

  const rgbColorVector = convertHslColorVectorToRgbColorVector(hslColorVector);

  fill.setSolidFill(
    rgbColorVector[0],
    rgbColorVector[1],
    rgbColorVector[2],
    alpha
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
