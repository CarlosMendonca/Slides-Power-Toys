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

// SERVER-SIDE CARDSERVICE SIDEBAR (Google Workspace Add-on)
// Uses CardService exclusively (no HtmlService / script.container.ui scope required).

const UNIT_POINTS = Object.freeze({
  in: PPI,
  cm: PPI / 2.54,
  pt: 1,
});

const HUE_PRESETS = Object.freeze([
  { deg: '0',   label: '0° (Red)' },
  { deg: '30',  label: '30° (Dark Orange)' },
  { deg: '60',  label: '60° (Yellow)' },
  { deg: '90',  label: '90° (Chartreuse)' },
  { deg: '120', label: '120° (Lime)' },
  { deg: '150', label: '150° (Spring Green)' },
  { deg: '180', label: '180° (Aqua)' },
  { deg: '210', label: '210° (Sky Blue)' },
  { deg: '240', label: '240° (Blue)' },
  { deg: '270', label: '270° (Purple)' },
  { deg: '300', label: '300° (Magenta)' },
  { deg: '330', label: '330° (Deep Pink)' },
]);

function resolveUnitPoints(unitName) {
  return UNIT_POINTS[unitName] || PPI;
}

// === PURE SIDEBAR ACTION HELPERS ===

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
  const precision = clamp(typeof decimals === 'number' && isFinite(decimals) ? Math.round(decimals) : 1, 0, 3);
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
  const pct = clamp(typeof transparencyPct === 'number' && isFinite(transparencyPct) ? transparencyPct : 0, 0, 100);
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

// === CARDSERVICE FORM & RESPONSE HELPERS ===

function getCardFormValue(event, fieldName, fallback) {
  const inputs = event && event.commonEventObject && event.commonEventObject.formInputs;
  if (!inputs || !inputs[fieldName] || !inputs[fieldName].stringInputs) {
    return fallback;
  }
  const values = inputs[fieldName].stringInputs.value;
  return values && values.length > 0 ? values[0] : fallback;
}

function getCardParam(event, paramName, fallback) {
  const params = event && event.commonEventObject && event.commonEventObject.parameters;
  return params && params[paramName] !== undefined ? params[paramName] : fallback;
}

function makeCardButton(text, fnName, params, filled) {
  const action = CardService.newAction().setFunctionName(fnName);
  if (params) action.setParameters(params);
  const btn = CardService.newTextButton().setText(text).setOnClickAction(action);
  if (filled) btn.setTextButtonStyle(CardService.TextButtonStyle.FILLED);
  return btn;
}

function buildNavSection(activeView) {
  return CardService.newCardSection().addWidget(
    CardService.newButtonSet()
      .addButton(makeCardButton('Layout', 'onCardSwitchView', { view: 'layout' }, activeView === 'layout'))
      .addButton(makeCardButton('Color', 'onCardSwitchView', { view: 'color' }, activeView === 'color'))
  );
}

function buildNotificationResponse(result, updatedCard) {
  const text = result.ok ? (result.message || 'Done') : (result.error || 'Action could not be completed.');
  const builder = CardService.newActionResponseBuilder()
    .setNotification(CardService.newNotification().setText(text));
  if (updatedCard) {
    builder.setNavigation(CardService.newNavigation().updateCard(updatedCard));
  }
  return builder.build();
}

// === CARDSERVICE CARD BUILDERS ===

function buildLayoutCard(state) {
  const opts = state || {};
  const unit = opts.unit || 'in';
  const decimals = opts.decimals !== undefined ? String(opts.decimals) : '1';
  const padding = opts.padding !== undefined ? String(opts.padding) : '0';
  const centerOnAnchor = opts.centerOnAnchor !== false;
  const edgeMode = opts.edgeMode || 'inner';

  const unitInput = CardService.newSelectionInput()
    .setType(CardService.SelectionInputType.DROPDOWN)
    .setTitle('Unit (Snap & Adjoin)')
    .setFieldName('unit')
    .addItem('Inches (in)', 'in', unit === 'in')
    .addItem('Centimeters (cm)', 'cm', unit === 'cm')
    .addItem('Points (pt)', 'pt', unit === 'pt');

  const decimalsInput = CardService.newSelectionInput()
    .setType(CardService.SelectionInputType.DROPDOWN)
    .setTitle('Snap decimals')
    .setFieldName('decimals')
    .addItem('0 decimals', '0', decimals === '0')
    .addItem('1 decimal', '1', decimals === '1')
    .addItem('2 decimals', '2', decimals === '2');

  const snapSection = CardService.newCardSection()
    .setHeader('Precision Snap (selected or all)')
    .addWidget(unitInput)
    .addWidget(decimalsInput)
    .addWidget(
      CardService.newButtonSet()
        .addButton(makeCardButton('Position', 'onCardSnap', { mode: 'position' }, false))
        .addButton(makeCardButton('Dimension', 'onCardSnap', { mode: 'dimension' }, false))
    )
    .addWidget(
      CardService.newButtonSet()
        .addButton(makeCardButton('Rotation', 'onCardSnap', { mode: 'rotation' }, false))
        .addButton(makeCardButton('Straighten 0°', 'onCardSnap', { mode: 'zeroRotation' }, false))
    );

  const copySection = CardService.newCardSection()
    .setHeader('Copy Attributes (from last selected)')
    .addWidget(
      CardService.newButtonSet()
        .addButton(makeCardButton('Width', 'onCardCopy', { w: '1', h: '0', r: '0' }, false))
        .addButton(makeCardButton('Height', 'onCardCopy', { w: '0', h: '1', r: '0' }, false))
    )
    .addWidget(
      CardService.newButtonSet()
        .addButton(makeCardButton('W & H', 'onCardCopy', { w: '1', h: '1', r: '0' }, false))
        .addButton(makeCardButton('Rotation', 'onCardCopy', { w: '0', h: '0', r: '1' }, false))
    );

  const adjoinSection = CardService.newCardSection()
    .setHeader('Adjoin (anchor = last selected)')
    .addWidget(
      CardService.newTextInput()
        .setFieldName('adjoinPadding')
        .setTitle('Gap / Padding (in selected unit)')
        .setValue(padding)
    )
    .addWidget(
      CardService.newSelectionInput()
        .setType(CardService.SelectionInputType.CHECK_BOX)
        .setFieldName('adjoinCenter')
        .addItem('Center on anchor element', 'yes', centerOnAnchor)
    )
    .addWidget(
      CardService.newButtonSet()
        .addButton(makeCardButton('Horizontally', 'onCardAdjoin', { horizontal: '1' }, false))
        .addButton(makeCardButton('Vertically', 'onCardAdjoin', { horizontal: '0' }, false))
    );

  const alignEdgeInput = CardService.newSelectionInput()
    .setType(CardService.SelectionInputType.DROPDOWN)
    .setTitle('Alignment edge')
    .setFieldName('alignEdge')
    .addItem('Inner edge', 'inner', edgeMode === 'inner')
    .addItem('Outer edge', 'outer', edgeMode === 'outer');

  const alignSection = CardService.newCardSection()
    .setHeader('Align (to last selected / page)')
    .addWidget(alignEdgeInput)
    .addWidget(
      CardService.newButtonSet()
        .addButton(makeCardButton('Left', 'onCardAlign', { x: 'LEFT', y: 'NOT_SET' }, false))
        .addButton(makeCardButton('H-Center', 'onCardAlign', { x: 'CENTER', y: 'NOT_SET' }, false))
        .addButton(makeCardButton('Right', 'onCardAlign', { x: 'RIGHT', y: 'NOT_SET' }, false))
    )
    .addWidget(
      CardService.newButtonSet()
        .addButton(makeCardButton('Top', 'onCardAlign', { x: 'NOT_SET', y: 'TOP' }, false))
        .addButton(makeCardButton('V-Center', 'onCardAlign', { x: 'NOT_SET', y: 'CENTER' }, false))
        .addButton(makeCardButton('Bottom', 'onCardAlign', { x: 'NOT_SET', y: 'BOTTOM' }, false))
    )
    .addWidget(makeCardButton('Center on Page', 'onCardCenterOnPage', null, false));

  const flipSection = CardService.newCardSection()
    .setHeader('Flip Positions (last 2 selected)')
    .addWidget(
      CardService.newButtonSet()
        .addButton(makeCardButton('Horizontal', 'onCardFlip', { h: '1', v: '0' }, false))
        .addButton(makeCardButton('Vertical', 'onCardFlip', { h: '0', v: '1' }, false))
        .addButton(makeCardButton('Both', 'onCardFlip', { h: '1', v: '1' }, false))
    );

  return CardService.newCardBuilder()
    .setHeader(CardService.newCardHeader().setTitle(SLIDES_POWER_TOYS).setSubtitle('Layout & Arrange'))
    .addSection(buildNavSection('layout'))
    .addSection(snapSection)
    .addSection(copySection)
    .addSection(adjoinSection)
    .addSection(alignSection)
    .addSection(flipSection)
    .build();
}

function buildColorCard(inspectedData, state) {
  const opts = state || {};
  const huePreset = opts.huePreset || '0';
  const satValue = opts.satValue !== undefined ? String(opts.satValue) : '50';
  const lumValue = opts.lumValue !== undefined ? String(opts.lumValue) : '50';
  const transValue = opts.transValue !== undefined ? String(opts.transValue) : '0';

  const inspectorSection = CardService.newCardSection()
    .setHeader('Color Inspector')
    .addWidget(makeCardButton('Inspect Selected Shape', 'onCardInspectColor', null, true));

  if (inspectedData) {
    const hexText = inspectedData.hex.toUpperCase() + ' (' + inspectedData.transparencyPct + '% transparent)';
    const details =
      'RGB: ' + inspectedData.rgb.join(', ') +
      '\nHSL: ' + inspectedData.hsl[0] + '°, ' + inspectedData.hsl[1] + '%, ' + inspectedData.hsl[2] + '%' +
      '\nLCH: ' + inspectedData.lch[0] + '%, ' + inspectedData.lch[1] + ', ' + inspectedData.lch[2] + '°';
    const widget = CardService.newDecoratedText()
      .setTopLabel(inspectedData.themeColorType ? 'Theme: ' + inspectedData.themeColorType : 'Solid RGB Fill')
      .setText(hexText)
      .setBottomLabel(details)
      .setWrapText(true);
    inspectorSection.addWidget(widget);
  } else {
    inspectorSection.addWidget(
      CardService.newTextParagraph().setText('Select a shape with a solid fill and click Inspect.')
    );
  }

  const quickSection = CardService.newCardSection()
    .setHeader('Modify Shape Color')
    .addWidget(
      CardService.newButtonSet()
        .addButton(makeCardButton('Swap', 'onCardColorAction', { action: 'swap' }, false))
        .addButton(makeCardButton('Invert', 'onCardColorAction', { action: 'invert' }, false))
        .addButton(makeCardButton('Max Contrast', 'onCardColorAction', { action: 'maxContrast' }, false))
    );

  const hueDropdown = CardService.newSelectionInput()
    .setType(CardService.SelectionInputType.DROPDOWN)
    .setTitle('Set exact hue')
    .setFieldName('huePreset');
  HUE_PRESETS.forEach((p) => hueDropdown.addItem(p.label, p.deg, p.deg === huePreset));

  const hueSection = CardService.newCardSection()
    .setHeader('Hue')
    .addWidget(
      CardService.newButtonSet()
        .addButton(makeCardButton('-30°', 'onCardAdjustHsl', { c: 'HUE', v: '-30', abs: '0' }, false))
        .addButton(makeCardButton('-15°', 'onCardAdjustHsl', { c: 'HUE', v: '-15', abs: '0' }, false))
        .addButton(makeCardButton('+15°', 'onCardAdjustHsl', { c: 'HUE', v: '15', abs: '0' }, false))
        .addButton(makeCardButton('+30°', 'onCardAdjustHsl', { c: 'HUE', v: '30', abs: '0' }, false))
    )
    .addWidget(hueDropdown)
    .addWidget(makeCardButton('Apply Hue', 'onCardAdjustHsl', { c: 'HUE', abs: '1', fromField: 'huePreset' }, false));

  const satSection = CardService.newCardSection()
    .setHeader('Saturation')
    .addWidget(
      CardService.newButtonSet()
        .addButton(makeCardButton('-33%', 'onCardAdjustHsl', { c: 'SATURATION', v: '-33', abs: '0' }, false))
        .addButton(makeCardButton('-10%', 'onCardAdjustHsl', { c: 'SATURATION', v: '-10', abs: '0' }, false))
        .addButton(makeCardButton('-5%', 'onCardAdjustHsl', { c: 'SATURATION', v: '-5', abs: '0' }, false))
    )
    .addWidget(
      CardService.newButtonSet()
        .addButton(makeCardButton('+5%', 'onCardAdjustHsl', { c: 'SATURATION', v: '5', abs: '0' }, false))
        .addButton(makeCardButton('+10%', 'onCardAdjustHsl', { c: 'SATURATION', v: '10', abs: '0' }, false))
        .addButton(makeCardButton('+33%', 'onCardAdjustHsl', { c: 'SATURATION', v: '33', abs: '0' }, false))
    )
    .addWidget(
      CardService.newTextInput()
        .setFieldName('satValue')
        .setTitle('Set exact saturation (0-100%)')
        .setValue(satValue)
    )
    .addWidget(
      makeCardButton('Apply Saturation', 'onCardAdjustHsl', { c: 'SATURATION', abs: '1', fromField: 'satValue' }, false)
    );

  const lumSection = CardService.newCardSection()
    .setHeader('Luminosity')
    .addWidget(
      CardService.newButtonSet()
        .addButton(makeCardButton('-33%', 'onCardAdjustHsl', { c: 'LUMINOSITY', v: '-33', abs: '0' }, false))
        .addButton(makeCardButton('-10%', 'onCardAdjustHsl', { c: 'LUMINOSITY', v: '-10', abs: '0' }, false))
        .addButton(makeCardButton('-5%', 'onCardAdjustHsl', { c: 'LUMINOSITY', v: '-5', abs: '0' }, false))
    )
    .addWidget(
      CardService.newButtonSet()
        .addButton(makeCardButton('+5%', 'onCardAdjustHsl', { c: 'LUMINOSITY', v: '5', abs: '0' }, false))
        .addButton(makeCardButton('+10%', 'onCardAdjustHsl', { c: 'LUMINOSITY', v: '10', abs: '0' }, false))
        .addButton(makeCardButton('+33%', 'onCardAdjustHsl', { c: 'LUMINOSITY', v: '33', abs: '0' }, false))
    )
    .addWidget(
      CardService.newTextInput()
        .setFieldName('lumValue')
        .setTitle('Set exact luminosity (0-100%)')
        .setValue(lumValue)
    )
    .addWidget(
      makeCardButton('Apply Luminosity', 'onCardAdjustHsl', { c: 'LUMINOSITY', abs: '1', fromField: 'lumValue' }, false)
    );

  const transSection = CardService.newCardSection()
    .setHeader('Transparency')
    .addWidget(
      CardService.newButtonSet()
        .addButton(makeCardButton('0%', 'onCardSetTransparency', { pct: '0' }, false))
        .addButton(makeCardButton('25%', 'onCardSetTransparency', { pct: '25' }, false))
        .addButton(makeCardButton('50%', 'onCardSetTransparency', { pct: '50' }, false))
        .addButton(makeCardButton('75%', 'onCardSetTransparency', { pct: '75' }, false))
    )
    .addWidget(
      CardService.newTextInput()
        .setFieldName('transValue')
        .setTitle('Set exact transparency (0-100%)')
        .setValue(transValue)
    )
    .addWidget(makeCardButton('Apply Transparency', 'onCardSetTransparency', { fromField: 'transValue' }, false));

  return CardService.newCardBuilder()
    .setHeader(CardService.newCardHeader().setTitle(SLIDES_POWER_TOYS).setSubtitle('Color Studio'))
    .addSection(buildNavSection('color'))
    .addSection(inspectorSection)
    .addSection(quickSection)
    .addSection(hueSection)
    .addSection(satSection)
    .addSection(lumSection)
    .addSection(transSection)
    .build();
}

// === CARDSERVICE ENTRYPOINTS & ACTION HANDLERS ===

function onSlidesHomepage(event) {
  return buildLayoutCard();
}

function onCardSwitchView(event) {
  const view = getCardParam(event, 'view', 'layout');
  const card = view === 'color' ? buildColorCard(null) : buildLayoutCard();
  return CardService.newActionResponseBuilder()
    .setNavigation(CardService.newNavigation().updateCard(card))
    .build();
}

function onCardSnap(event) {
  const mode = getCardParam(event, 'mode', 'position');
  const unit = getCardFormValue(event, 'unit', 'in');
  const decimals = parseInt(getCardFormValue(event, 'decimals', '1'), 10);
  return buildNotificationResponse(sidebarSnap(mode, unit, decimals));
}

function onCardCopy(event) {
  const copyWidth = getCardParam(event, 'w', '0') === '1';
  const copyHeight = getCardParam(event, 'h', '0') === '1';
  const copyRotation = getCardParam(event, 'r', '0') === '1';
  return buildNotificationResponse(sidebarCopyAttributes(copyWidth, copyHeight, copyRotation));
}

function onCardAdjoin(event) {
  const horizontal = getCardParam(event, 'horizontal', '1') === '1';
  const unit = getCardFormValue(event, 'unit', 'in');
  const padding = parseFloat(getCardFormValue(event, 'adjoinPadding', '0'));
  const centerChecked = getCardFormValue(event, 'adjoinCenter', '') === 'yes';
  return buildNotificationResponse(sidebarAdjoin(horizontal, isNaN(padding) ? 0 : padding, unit, centerChecked));
}

function onCardAlign(event) {
  const posX = getCardParam(event, 'x', 'NOT_SET');
  const posY = getCardParam(event, 'y', 'NOT_SET');
  const isOuter = getCardFormValue(event, 'alignEdge', 'inner') === 'outer';
  return buildNotificationResponse(sidebarAlign(posX, posY, isOuter));
}

function onCardCenterOnPage(event) {
  return buildNotificationResponse(sidebarCenterOnPage());
}

function onCardFlip(event) {
  const flipH = getCardParam(event, 'h', '0') === '1';
  const flipV = getCardParam(event, 'v', '0') === '1';
  return buildNotificationResponse(sidebarFlip(flipH, flipV));
}

function onCardInspectColor(event) {
  const res = sidebarInspectColor();
  if (!res.ok) {
    return buildNotificationResponse(res);
  }
  const state = {
    huePreset: getCardFormValue(event, 'huePreset', '0'),
    satValue: Math.round(res.data.hsl[1]),
    lumValue: Math.round(res.data.hsl[2]),
    transValue: Math.round(res.data.transparencyPct),
  };
  const msg =
    res.data.selectedCount > 1
      ? 'Inspected last of ' + res.data.selectedCount + ' selected shapes.'
      : 'Inspected ' + res.data.hex.toUpperCase() + '.';
  return buildNotificationResponse({ ok: true, message: msg }, buildColorCard(res.data, state));
}

function onCardColorAction(event) {
  const action = getCardParam(event, 'action', '');
  const res = sidebarColorAction(action);
  const updatedCard = res.ok && res.inspected ? buildColorCard(res.inspected) : null;
  return buildNotificationResponse(res, updatedCard);
}

function onCardAdjustHsl(event) {
  const component = getCardParam(event, 'c', '');
  const isAbsolute = getCardParam(event, 'abs', '0') === '1';
  const fromField = getCardParam(event, 'fromField', '');
  const rawVal = fromField
    ? getCardFormValue(event, fromField, '0')
    : getCardParam(event, 'v', '0');
  const numVal = parseFloat(rawVal);

  if (isNaN(numVal)) {
    return buildNotificationResponse({ ok: false, error: 'Please enter a valid number.' });
  }

  const res = sidebarAdjustHsl(component, numVal, isAbsolute);
  const updatedCard = res.ok && res.inspected ? buildColorCard(res.inspected) : null;
  return buildNotificationResponse(res, updatedCard);
}

function onCardSetTransparency(event) {
  const fromField = getCardParam(event, 'fromField', '');
  const rawVal = fromField
    ? getCardFormValue(event, fromField, '0')
    : getCardParam(event, 'pct', '0');
  const numVal = parseFloat(rawVal);

  if (isNaN(numVal)) {
    return buildNotificationResponse({ ok: false, error: 'Please enter a valid transparency percentage (0-100).' });
  }

  const res = sidebarSetTransparency(numVal);
  const updatedCard = res.ok && res.inspected ? buildColorCard(res.inspected) : null;
  return buildNotificationResponse(res, updatedCard);
}
