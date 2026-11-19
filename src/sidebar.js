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

// SIDEBAR UI SERVER BRIDGE

const UNIT_POINTS = Object.freeze({
  in: PPI,
  cm: PPI / 2.54,
  pt: 1,
});

function menuShowSidebar() {
  const html = HtmlService.createHtmlOutputFromFile('sidebar')
    .setTitle(SLIDES_POWER_TOYS);
  SlidesApp.getUi().showSidebar(html);
}

function resolveUnitPoints(unitName) {
  return UNIT_POINTS[unitName] || PPI;
}

function getInspectedShapeColorData() {
  const selectedShapes = getSelectedElementsOnPage(false)
    .filter((e) => e.getPageElementType() === SlidesApp.PageElementType.SHAPE)
    .map((e) => e.asShape());

  if (selectedShapes.length === 0) {
    return { ok: false, error: 'Select an individual shape to inspect its fill color.' };
  }

  const shape = selectedShapes[selectedShapes.length - 1];
  const fill = shape.getFill();
  if (fill.getType() !== SlidesApp.FillType.SOLID) {
    return { ok: false, error: 'Selected shape does not have a solid fill.' };
  }

  const solidFill = fill.getSolidFill();
  const shapeColor = solidFill.getColor();
  const colorType = shapeColor.getColorType();
  const rgbColor = resolveRgbColor(shape, shapeColor);
  if (!rgbColor) {
    return { ok: false, error: 'Shape fill color type is not supported.' };
  }

  const rgb = convertRgbColorToRgbColorVector(rgbColor);
  const hsl = convertRgbColorToHslColorVector(rgbColor);
  const lch = convertRgbColorVectorToLchColorVector(rgb);
  const alpha = solidFill.getAlpha();

  return {
    ok: true,
    data: {
      rgb,
      hex: rgbColor.asHexString(),
      hsl: [roundTo(hsl[0] * 360, 1), roundTo(hsl[1] * 100, 1), roundTo(hsl[2] * 100, 1)],
      lch: [roundTo(lch[0], 1), roundTo(lch[1], 1), roundTo(lch[2], 1)],
      alpha: roundTo(alpha, 3),
      transparencyPct: roundTo((1 - alpha) * 100, 1),
      colorType: String(colorType),
      themeColorType:
        colorType === SlidesApp.ColorType.THEME
          ? String(shapeColor.asThemeColor().getThemeColorType())
          : null,
      selectedCount: selectedShapes.length,
    },
  };
}

function sidebarInspectColor() {
  return getInspectedShapeColorData();
}

function sidebarSnap(mode, unitName, decimals) {
  const unitPts = resolveUnitPoints(unitName);
  const precision = clamp(typeof decimals === 'number' ? Math.round(decimals) : 1, 0, 3);
  const elements = getSelectedElementsOnPage(true);

  if (elements.length === 0) {
    return { ok: false, error: 'No elements found on the current slide.' };
  }

  elements.forEach((e) => {
    if (mode === 'position') {
      snapElement(e, true, false, false, unitPts, precision);
    } else if (mode === 'dimension') {
      snapElement(e, false, true, false, unitPts, precision);
    } else if (mode === 'rotation') {
      snapElement(e, false, false, true, unitPts, precision);
    } else if (mode === 'zeroRotation') {
      if (canRotateElement(e)) e.setRotation(0);
    }
  });

  return { ok: true, message: 'Updated ' + elements.length + ' element(s).' };
}

function sidebarCopyAttributes(copyWidth, copyHeight, copyRotation) {
  const elementArray = getSelectedElementsOnPage(false);
  if (elementArray.length < 2) {
    return { ok: false, error: 'Select two or more elements (last selected is the reference).' };
  }

  const referenceElement = elementArray.pop();
  const refWidth = copyWidth ? referenceElement.getWidth() : 0;
  const refHeight = copyHeight ? referenceElement.getHeight() : 0;
  const refRotation = copyRotation ? referenceElement.getRotation() : 0;

  elementArray.forEach((e) => {
    if ((copyWidth || copyHeight) && canResizeElement(e)) {
      if (copyWidth) e.setWidth(refWidth);
      if (copyHeight) e.setHeight(refHeight);
    }
    if (copyRotation && canRotateElement(e)) e.setRotation(refRotation);
  });

  return { ok: true, message: 'Copied attributes to ' + elementArray.length + ' element(s).' };
}

function sidebarAdjoin(horizontal, paddingValue, unitName, centerOnAnchor) {
  let elementArray = getSelectedElementsOnPage(false);
  if (elementArray.length < 2) {
    return { ok: false, error: 'Select two or more elements to adjoin.' };
  }

  const paddingNum = typeof paddingValue === 'number' && isFinite(paddingValue) ? paddingValue : 0;
  const paddingPoints = paddingNum * resolveUnitPoints(unitName);
  const shouldCenter = centerOnAnchor !== false;

  const referenceElement = elementArray.pop();
  const keyed = elementArray.map((el) => ({
    el,
    pos: horizontal ? el.getLeft() : el.getTop(),
  }));
  keyed.sort((a, b) => a.pos - b.pos);
  elementArray = keyed.map((item) => item.el);

  elementArray.unshift(referenceElement);
  const centerRef = shouldCenter ? cacheElementBounds(referenceElement) : null;

  for (let i = 1; i < elementArray.length; i++) {
    adjoinTwoElements(elementArray[i - 1], elementArray[i], Boolean(horizontal), centerRef, paddingPoints);
  }

  return { ok: true, message: 'Adjoined ' + elementArray.length + ' elements.' };
}

function sidebarAlign(posXName, posYName, isOuterEdge) {
  const posX = POSITION_X[posXName] !== undefined ? POSITION_X[posXName] : POSITION_X.NOT_SET;
  const posY = POSITION_Y[posYName] !== undefined ? POSITION_Y[posYName] : POSITION_Y.NOT_SET;
  alignSelectOrAllElements(posX, posY, Boolean(isOuterEdge));
  return { ok: true, message: 'Aligned elements.' };
}

function sidebarCenterOnPage() {
  menuCenterOnPage();
  return { ok: true, message: 'Centered on page.' };
}

function sidebarFlip(flipH, flipV) {
  const selectedElements = getSelectedElementsOnPage(false);
  if (selectedElements.length < 2) {
    return { ok: false, error: 'Select two elements to flip their position.' };
  }

  flipTwoElements(selectedElements.pop(), selectedElements.pop(), Boolean(flipH), Boolean(flipV));
  return { ok: true, message: 'Flipped element positions.' };
}

function sidebarColorAction(action) {
  let count = 0;
  withSelectedOrAllShapesOrGroupsRecursively((s) => {
    if (action === 'swap') {
      swapColorsOnShape(s);
    } else if (action === 'invert') {
      invertColorsOnShape(s);
    } else if (action === 'maxContrast') {
      setMaxContrastToTextOnShape(s);
    }
    count += 1;
  });

  if (count === 0) {
    return { ok: false, error: 'No shapes found to update.' };
  }

  const inspected = getInspectedShapeColorData();
  return {
    ok: true,
    message: 'Updated ' + count + ' shape(s).',
    inspected: inspected.ok ? inspected.data : null,
  };
}

function sidebarAdjustHsl(componentName, value, isAbsolute) {
  const component = HSL_COMPONENT[componentName];
  if (component === undefined) {
    return { ok: false, error: 'Unknown HSL component: ' + componentName };
  }

  const normalized = component === HSL_COMPONENT.HUE ? value / 360 : value / 100;
  let count = 0;

  withSelectedOrAllShapesOrGroupsRecursively((s) => {
    changeHSL(s, normalized, Boolean(isAbsolute), component);
    count += 1;
  });

  if (count === 0) {
    return { ok: false, error: 'No shapes found to update.' };
  }

  const inspected = getInspectedShapeColorData();
  return {
    ok: true,
    message: 'Updated ' + count + ' shape(s).',
    inspected: inspected.ok ? inspected.data : null,
  };
}

function sidebarSetTransparency(transparencyPct) {
  const pct = clamp(typeof transparencyPct === 'number' ? transparencyPct : 0, 0, 100);
  const alpha = roundTo(1 - pct / 100, 4);
  let count = 0;

  withSelectedOrAllShapesOrGroupsRecursively((s) => {
    setAlphaToShape(s, alpha);
    count += 1;
  });

  if (count === 0) {
    return { ok: false, error: 'No shapes found to update.' };
  }

  const inspected = getInspectedShapeColorData();
  return {
    ok: true,
    message: 'Set transparency to ' + pct + '% on ' + count + ' shape(s).',
    inspected: inspected.ok ? inspected.data : null,
  };
}
