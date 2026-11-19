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

// UTILITY FUNCTIONS

function fakePageAsReferenceElement() {
  const presentation = SlidesApp.getActivePresentation();
  const pageWidth = presentation.getPageWidth();
  const pageHeight = presentation.getPageHeight();
  return {
    getLeft: () => 0,
    getTop: () => 0,
    getWidth: () => pageWidth,
    getHeight: () => pageHeight,
  };
}

function cacheElementBounds(element) {
  const left = element.getLeft();
  const top = element.getTop();
  const width = element.getWidth();
  const height = element.getHeight();
  return {
    getLeft: () => left,
    getTop: () => top,
    getWidth: () => width,
    getHeight: () => height,
  };
}

// According to WCAG 2.1 (https://www.w3.org/TR/WCAG21/#dfn-contrast-ratio)
function calculateContrastRatio(rgbColorVector1, rgbColorVector2) {
  const lin1 = linSrgb(rgbColorVector1.map((c) => c / 255));
  const lin2 = linSrgb(rgbColorVector2.map((c) => c / 255));

  const L1 = 0.2126 * lin1[0] + 0.7152 * lin1[1] + 0.0722 * lin1[2];
  const L2 = 0.2126 * lin2[0] + 0.7152 * lin2[1] + 0.0722 * lin2[2];

  return L1 > L2 ? (L1 + 0.05) / (L2 + 0.05) : (L2 + 0.05) / (L1 + 0.05);
}

// Backwards-compatible alias
function calculateRelativeLuminosity(rgbColorVector1, rgbColorVector2) {
  return calculateContrastRatio(rgbColorVector1, rgbColorVector2);
}

function convertHslColorVectorToRgbColorVector(hslColorVector) {
  const [h, s, l] = hslColorVector;
  let r;
  let g;
  let b;

  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    const hue2rgb = (p, q, t) => {
      let wrapped = t;
      if (wrapped < 0) wrapped += 1;
      if (wrapped > 1) wrapped -= 1;
      if (wrapped < 1 / 6) return p + (q - p) * 6 * wrapped;
      if (wrapped < 1 / 2) return q;
      if (wrapped < 2 / 3) return p + (q - p) * (2 / 3 - wrapped) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

function convertRgbColorToHslColorVector(rgbColor) {
  const r = rgbColor.getRed() / 255;
  const g = rgbColor.getGreen() / 255;
  const b = rgbColor.getBlue() / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h;
  let s;

  if (max === min) {
    h = 0;
    s = 0; // achromatic
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return [h, s, l];
}

function convertRgbColorToRgbColorVector(rgbColor) {
  return [rgbColor.getRed(), rgbColor.getGreen(), rgbColor.getBlue()];
}

function roundTo(number, digits) {
  const power = Math.pow(10, digits);
  return Math.round(number * power) / power;
}

function doesShapeHaveSolidFill(shape) {
  return shape.getFill().getType() === SlidesApp.FillType.SOLID;
}

// Using getLength() > 1 because Google Slides always includes a trailing newline character
// in shape text ranges (https://developers.google.com/apps-script/reference/slides/shape#gettext).
function doesShapeHaveText(shape) {
  return shape.getText().getLength() > 1;
}

function clamp(val, min, max) {
  return val > max ? max : val < min ? min : val;
}

function resolveRgbColor(shape, shapeColor) {
  if (!shapeColor) return null;

  switch (shapeColor.getColorType()) {
    case SlidesApp.ColorType.RGB:
      return shapeColor.asRgbColor();
    case SlidesApp.ColorType.THEME: {
      const parentPage = shape.getParentPage();
      if (!parentPage) return null;
      const concreteColor = parentPage
        .getColorScheme()
        .getConcreteColor(shapeColor.asThemeColor().getThemeColorType());
      return concreteColor ? concreteColor.asRgbColor() : null;
    }
    default:
      return null;
  }
}

function getRgbColorFromShapeColor(shape) {
  const solidFill = shape.getFill().getSolidFill();
  if (!solidFill) return null;

  return resolveRgbColor(shape, solidFill.getColor());
}
