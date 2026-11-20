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

// === DEFINITIONS ===
const PPI = 72;

const POSITION_X = Object.freeze({
  NOT_SET: 0,
  LEFT: 1,
  RIGHT: 2,
  CENTER: 3,
});

const POSITION_Y = Object.freeze({
  NOT_SET: 0,
  TOP: 1,
  BOTTOM: 2,
  CENTER: 3,
});

const HSL_COMPONENT = Object.freeze({
  HUE: 0,
  SATURATION: 1,
  LUMINOSITY: 2,
});

const HSV_COMPONENT = Object.freeze({
  HUE: 0,
  SATURATION: 1,
  VALUE: 2,
});

const HWB_COMPONENT = Object.freeze({
  HUE: 0,
  WHITENESS: 1,
  BLACKNESS: 2,
});

const OKLCH_COMPONENT = Object.freeze({
  LIGHTNESS: 0,
  CHROMA: 1,
  HUE: 2,
});

const SLIDES_POWER_TOYS = 'Slides Power Toys';

// === INIT ===
function onInstall(event) { onOpen(event); }

function onOpen(event) {
  const ui = SlidesApp.getUi();
  ui.createAddonMenu()
    .addSubMenu(ui.createMenu('Precision snap')
      .addItem('Dimension', 'menuSnapDimension')
      .addItem('Position', 'menuSnapPosition')
      .addItem('Rotation', 'menuSnapRotation')
      .addItem('Straighten elements', 'menuZeroRotation'))
    .addSubMenu(ui.createMenu('Copy attributes')
      .addItem('Width', 'menuCopyWidth')
      .addItem('Height', 'menuCopyHeight')
      .addItem('Width and height', 'menuCopyWidthAndHeight')
      .addItem('Rotation', 'menuCopyRotation'))
    .addSeparator()
    .addSubMenu(ui.createMenu('Adjoin')
      .addItem('Horizontally', 'menuAdjoinH')
      .addItem('Vertically', 'menuAdjoinV'))
    .addSubMenu(ui.createMenu('Align to inner edge')
      .addItem('Left', 'menuAlignToInnerLeft')
      .addItem('Right', 'menuAlignToInnerRight')
      .addItem('Horizontal center', 'menuAlignToHorizontalCenter')
      .addSeparator()
      .addItem('Top', 'menuAlignToInnerTop')
      .addItem('Bottom', 'menuAlignToInnerBottom')
      .addItem('Vertical center', 'menuAlignToVerticalCenter'))
    .addSubMenu(ui.createMenu('Align to outer edge')
      .addItem('Left', 'menuAlignToOuterLeft')
      .addItem('Right', 'menuAlignToOuterRight')
      .addSeparator()
      .addItem('Top', 'menuAlignToOuterTop')
      .addItem('Bottom', 'menuAlignToOuterBottom'))
    .addItem('Center on page', 'menuCenterOnPage')
    .addSubMenu(ui.createMenu('Flip')
      .addItem('Horizontally', 'menuFlipH')
      .addItem('Vertically', 'menuFlipV')
      .addItem('Both', 'menuFlipHV'))
    .addSeparator()
    .addItem('Inspect shape color', 'menuInspectShapeColor')
    .addSubMenu(ui.createMenu('Modify shape color')
      .addItem('Swap text and background colors', 'menuSetColorSwap')
      .addItem('Invert background color', 'menuSetColorInverse')
      .addItem('Set text color to max contrast', 'menuSetColorMaxContrast'))
    .addSubMenu(buildOklchMenu(ui))
    .addSubMenu(buildHslMenu(ui))
    .addSubMenu(buildHsvMenu(ui))
    .addSubMenu(buildHwbMenu(ui))
    .addSubMenu(ui.createMenu('Set transparency')
      .addItem('0% (opaque)', 'menuSetTransparency100')
      .addItem('10%', 'menuSetTransparency90')
      .addItem('25%', 'menuSetTransparency75')
      .addItem('33%', 'menuSetTransparency66')
      .addItem('50%', 'menuSetTransparency50')
      .addItem('66%', 'menuSetTransparency33')
      .addItem('75%', 'menuSetTransparency25')
      .addItem('90%', 'menuSetTransparency10')
      .addItem('100% (transparent)', 'menuSetTransparency0'))
    .addSeparator()
    .addItem('About', 'menuShowAboutPrompt')
    .addToUi();
}

// === MENU HELPER WRAPPERS ===
function applyAlphaToSelection(alpha) {
  withSelectedOrAllShapesOrGroupsRecursively((s) => setAlphaToShape(s, alpha));
}

// === MENU FUNCTIONS ===
function menuSnapPosition()  { withSelectedOrAllElements((e) => snapElement(e, true,  false, false)); }
function menuSnapDimension() { withSelectedOrAllElements((e) => snapElement(e, false, true,  false)); }
function menuSnapRotation()  { withSelectedOrAllElements((e) => snapElement(e, false, false, true)); }
function menuZeroRotation()  { withSelectedOrAllElements((e) => { if (canRotateElement(e)) e.setRotation(0); }); }

function menuCopyWidth()          { resizeElementsToLastSelected(true,  false, false); }
function menuCopyHeight()         { resizeElementsToLastSelected(false, true,  false); }
function menuCopyWidthAndHeight() { resizeElementsToLastSelected(true,  true,  false); }
function menuCopyRotation()       { resizeElementsToLastSelected(false, false, true); }

function menuAdjoinH() { adjoinSelectedElements(true,  true, 0); }
function menuAdjoinV() { adjoinSelectedElements(false, true, 0); }

function menuAlignToInnerLeft()        { alignSelectOrAllElements(POSITION_X.LEFT,    POSITION_Y.NOT_SET, false); }
function menuAlignToInnerRight()       { alignSelectOrAllElements(POSITION_X.RIGHT,   POSITION_Y.NOT_SET, false); }
function menuAlignToInnerTop()         { alignSelectOrAllElements(POSITION_X.NOT_SET, POSITION_Y.TOP,     false); }
function menuAlignToInnerBottom()      { alignSelectOrAllElements(POSITION_X.NOT_SET, POSITION_Y.BOTTOM,  false); }
function menuAlignToOuterLeft()        { alignSelectOrAllElements(POSITION_X.LEFT,    POSITION_Y.NOT_SET, true); }
function menuAlignToOuterRight()       { alignSelectOrAllElements(POSITION_X.RIGHT,   POSITION_Y.NOT_SET, true); }
function menuAlignToOuterTop()         { alignSelectOrAllElements(POSITION_X.NOT_SET, POSITION_Y.TOP,     true); }
function menuAlignToOuterBottom()      { alignSelectOrAllElements(POSITION_X.NOT_SET, POSITION_Y.BOTTOM,  true); }
function menuAlignToVerticalCenter()   { alignSelectOrAllElements(POSITION_X.NOT_SET, POSITION_Y.CENTER,  false); }
function menuAlignToHorizontalCenter() { alignSelectOrAllElements(POSITION_X.CENTER,  POSITION_Y.NOT_SET, false); }

function menuInspectShapeColor() { inspectShapeColor(); }

function menuSetTransparency0()   { applyAlphaToSelection(0); }
function menuSetTransparency10()  { applyAlphaToSelection(0.1); }
function menuSetTransparency25()  { applyAlphaToSelection(0.25); }
function menuSetTransparency33()  { applyAlphaToSelection(0.33); }
function menuSetTransparency50()  { applyAlphaToSelection(0.5); }
function menuSetTransparency66()  { applyAlphaToSelection(0.66); }
function menuSetTransparency75()  { applyAlphaToSelection(0.75); }
function menuSetTransparency90()  { applyAlphaToSelection(0.9); }
function menuSetTransparency100() { applyAlphaToSelection(1); }

function menuSetColorSwap()        { withSelectedOrAllShapesOrGroupsRecursively((s) => swapColorsOnShape(s)); }
function menuSetColorInverse()     { withSelectedOrAllShapesOrGroupsRecursively((s) => invertColorsOnShape(s)); }
function menuSetColorMaxContrast() { withSelectedOrAllShapesOrGroupsRecursively((s) => setMaxContrastToTextOnShape(s)); }

function menuCenterOnPage() {
  const pageRef = fakePageAsReferenceElement();
  withSelectedOrAllElements((e) => alignShape(pageRef, e, POSITION_X.CENTER, POSITION_Y.CENTER, false));
}

function menuFlipH()  { flipLastTwoSelectedElements(true,  false); }
function menuFlipV()  { flipLastTwoSelectedElements(false, true); }
function menuFlipHV() { flipLastTwoSelectedElements(true,  true); }

function menuShowAboutPrompt() {
  const message =
    SLIDES_POWER_TOYS +
    ' is a simple, free and open source extension that adds some handy functions to Google Slides and makes it behave like Microsoft PowerPoint.\n\n' +
    'THESE CAPABILITIES ARE PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND. Use them at your own risk as they are NOT endorsed nor supported by Google.\n\n' +
    "For user's guide, license and to report an issue, refer to the website at https://carlosmendonca.github.io/Slides-Power-Toys.";
  const ui = SlidesApp.getUi();
  ui.alert(SLIDES_POWER_TOYS + ' v' + VERSION, message, ui.ButtonSet.OK);
}

// === MENU AUX FUNCTIONS ===
function flipLastTwoSelectedElements(shouldFlipH, shouldFlipV) {
  const selectedElements = getSelectedElementsOnPage(false);

  if (selectedElements.length < 2) {
    const ui = SlidesApp.getUi();
    ui.alert(
      SLIDES_POWER_TOYS,
      'Select two elements to flip their position.',
      ui.ButtonSet.OK
    );
    return;
  }

  flipTwoElements(selectedElements.pop(), selectedElements.pop(), shouldFlipH, shouldFlipV);
}

function adjoinSelectedElements(shouldAdjoinInHorizontalDirection, shouldCenterOnFirst, paddingPoints) {
  let elementArray = getSelectedElementsOnPage(false);

  if (elementArray.length < 2) {
    const ui = SlidesApp.getUi();
    ui.alert(
      SLIDES_POWER_TOYS,
      'Select two or more elements to adjoin (combine by bringing together).',
      ui.ButtonSet.OK
    );
    return;
  }

  const referenceElement = elementArray.pop();

  // Pre-fetch sort keys (Schwartzian transform) to avoid O(N log N) RPC calls inside .sort().
  // Sorting by leftmost or topmost preserves on-screen order since Google Slides does not guarantee selection order.
  const keyed = elementArray.map((el) => ({
    el,
    pos: shouldAdjoinInHorizontalDirection ? el.getLeft() : el.getTop(),
  }));
  keyed.sort((a, b) => a.pos - b.pos);
  elementArray = keyed.map((item) => item.el);

  elementArray.unshift(referenceElement);
  const centerRef = shouldCenterOnFirst ? cacheElementBounds(referenceElement) : null;

  for (let i = 1; i < elementArray.length; i++) {
    adjoinTwoElements(
      elementArray[i - 1],
      elementArray[i],
      shouldAdjoinInHorizontalDirection,
      centerRef,
      paddingPoints
    );
  }
}

function resizeElementsToLastSelected(copyWidth, copyHeight, copyRotation) {
  const elementArray = getSelectedElementsOnPage(false);

  if (elementArray.length < 2) {
    const ui = SlidesApp.getUi();
    ui.alert(
      SLIDES_POWER_TOYS,
      'Select two or more elements to resize or rotate based on attributes of the last selected element.',
      ui.ButtonSet.OK
    );
    return;
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
}

function alignSelectOrAllElements(positionX, positionY, isOuterEdge) {
  let elementArray = getSelectedElementsOnPage(false);
  let referenceElement;

  switch (elementArray.length) {
    case 0: // fallback to all elements on page, aligned relative to page
      elementArray = getSelectedElementsOnPage(true);
      referenceElement = fakePageAsReferenceElement();
      break;
    case 1: // single element aligned relative to page
      referenceElement = fakePageAsReferenceElement();
      break;
    default: // multiple elements aligned relative to last selected element
      referenceElement = cacheElementBounds(elementArray.pop());
      break;
  }

  elementArray.forEach((e) => alignShape(referenceElement, e, positionX, positionY, isOuterEdge));
}

function inspectShapeColor() {
  const ui = SlidesApp.getUi();
  const selectedShapes = getSelectedElementsOnPage(false)
    .filter((e) => e.getPageElementType() === SlidesApp.PageElementType.SHAPE)
    .map((e) => e.asShape());

  if (selectedShapes.length === 0) {
    ui.alert(SLIDES_POWER_TOYS, 'No individual shapes selected.', ui.ButtonSet.OK);
    return;
  }

  const shape = selectedShapes[selectedShapes.length - 1];
  const fill = shape.getFill();
  if (fill.getType() !== SlidesApp.FillType.SOLID) {
    ui.alert(SLIDES_POWER_TOYS, 'Shape does not have a solid fill.', ui.ButtonSet.OK);
    return;
  }

  const solidFill = fill.getSolidFill();
  const shapeColor = solidFill.getColor();
  const colorType = shapeColor.getColorType();
  const rgbColor = resolveRgbColor(shape, shapeColor);
  if (!rgbColor) {
    ui.alert(SLIDES_POWER_TOYS, 'Shape fill color type is not supported.', ui.ButtonSet.OK);
    return;
  }

  const rgbVector = convertRgbColorToRgbColorVector(rgbColor);
  const hslColorVector = convertRgbColorToHslColorVector(rgbColor);
  const hsvColorVector = convertRgbColorVectorToHsvColorVector(rgbVector);
  const hwbColorVector = convertRgbColorVectorToHwbColorVector(rgbVector);
  const oklchColorVector = convertRgbColorVectorToOklchColorVector(rgbVector);
  const lchColorVector = convertRgbColorVectorToLchColorVector(rgbVector);

  let message =
    'RGB: ' + rgbColor.getRed() + ', ' + rgbColor.getGreen() + ', ' + rgbColor.getBlue() + ' (' + rgbColor.asHexString() + ')';
  message +=
    '\nHSL: ' + (hslColorVector[0] * 360).toFixed(1) + '°, ' + (hslColorVector[1] * 100).toFixed(1) + '%, ' + (hslColorVector[2] * 100).toFixed(1) + '%';
  message +=
    '\nHSV: ' + (hsvColorVector[0] * 360).toFixed(1) + '°, ' + (hsvColorVector[1] * 100).toFixed(1) + '%, ' + (hsvColorVector[2] * 100).toFixed(1) + '%';
  message +=
    '\nHWB: ' + (hwbColorVector[0] * 360).toFixed(1) + '°, ' + (hwbColorVector[1] * 100).toFixed(1) + '%, ' + (hwbColorVector[2] * 100).toFixed(1) + '%';
  message +=
    '\nOKLCH: ' + (oklchColorVector[0] * 100).toFixed(1) + '%, ' + oklchColorVector[1].toFixed(3) + ', ' + oklchColorVector[2].toFixed(1) + '°';
  message +=
    '\nCIE LCH: ' + lchColorVector[0].toFixed(1) + '%, ' + lchColorVector[1].toFixed(1) + ', ' + lchColorVector[2].toFixed(1) + '°';
  message += '\nTransparency: ' + ((1 - solidFill.getAlpha()) * 100).toFixed(1) + '%';

  if (colorType === SlidesApp.ColorType.THEME) {
    message += "\n\nThis is one of the deck's theme colors: '" + shapeColor.asThemeColor().getThemeColorType() + "'.";
  }

  if (selectedShapes.length > 1) {
    message += '\n\nMore than one shape was selected. Showing the color information of the last one.';
  }

  ui.alert(SLIDES_POWER_TOYS, message, ui.ButtonSet.OK);
}
