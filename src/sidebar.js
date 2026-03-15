// Copyright 2025 Google LLC
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

// CardService side panel entry point for the Add-on framework.
// The existing onOpen() / menu system in main.js is unaffected.

function onHomepage(event) {
  return buildSidebarCard();
}

function buildSidebarCard() {
  return CardService.newCardBuilder()
    .setName('slides_power_toys_sidebar')
    .setHeader(CardService.newCardHeader().setTitle('Slides Power Toys'))
    .addCardAction(
      CardService.newCardAction()
        .setText('About')
        .setOnClickAction(CardService.newAction().setFunctionName('menuShowAboutPrompt'))
    )
    .addSection(buildAlignmentSection())
    .addSection(buildSnapAndCopySection())
    .addSection(buildColorsSection())
    .build();
}

// === HELPERS ===

function btn(label, fnName) {
  return CardService.newTextButton()
    .setText(label)
    .setOnClickAction(CardService.newAction().setFunctionName(fnName));
}

function btnRow() {
  var set = CardService.newButtonSet();
  for (var i = 0; i < arguments.length; i++) set.addButton(arguments[i]);
  return set;
}

function subheader(text) {
  return CardService.newDecoratedText().setText(text).setWrapText(false);
}

// === SECTIONS ===

function buildAlignmentSection() {
  return CardService.newCardSection()
    .setHeader('Alignment')
    .addWidget(btn('Center on Page', 'menuCenterOnPage'))
    .addWidget(subheader('Inner edge'))
    .addWidget(btnRow(btn('Left', 'menuAlignToInnerLeft'), btn('Right', 'menuAlignToInnerRight'), btn('H. Center', 'menuAlignToHorizontalCenter')))
    .addWidget(btnRow(btn('Top', 'menuAlignToInnerTop'), btn('Bottom', 'menuAlignToInnerBottom'), btn('V. Center', 'menuAlignToVerticalCenter')))
    .addWidget(subheader('Outer edge'))
    .addWidget(btnRow(btn('Left', 'menuAlignToOuterLeft'), btn('Right', 'menuAlignToOuterRight'), btn('Top', 'menuAlignToOuterTop'), btn('Bottom', 'menuAlignToOuterBottom')))
    .addWidget(subheader('Adjoin'))
    .addWidget(btnRow(btn('Horizontally', 'menuAdjoinH'), btn('Vertically', 'menuAdjoinV')))
    .addWidget(subheader('Flip'))
    .addWidget(btnRow(btn('Horizontally', 'menuFlipH'), btn('Vertically', 'menuFlipV'), btn('Both', 'menuFlipHV')));
}

function buildSnapAndCopySection() {
  return CardService.newCardSection()
    .setHeader('Snap & Copy')
    .addWidget(subheader('Precision snap'))
    .addWidget(btnRow(btn('Dimension', 'menuSnapDimension'), btn('Position', 'menuSnapPosition')))
    .addWidget(btnRow(btn('Rotation', 'menuSnapRotation'), btn('Straighten', 'menuZeroRotation')))
    .addWidget(subheader('Copy attribute'))
    .addWidget(btnRow(btn('Width', 'menuCopyWidth'), btn('Height', 'menuCopyHeight')))
    .addWidget(btnRow(btn('W+H', 'menuCopyWidthAndHeight'), btn('Rotation', 'menuCopyRotation')));
}

function buildColorsSection() {
  return CardService.newCardSection()
    .setHeader('Colors')
    .setCollapsible(true)
    // Inspect & modify
    .addWidget(btn('Inspect Shape Color', 'menuInspectShapeColor'))
    .addWidget(btnRow(btn('Swap', 'menuSetColorSwap'), btn('Invert', 'menuSetColorInverse'), btn('Max Contrast', 'menuSetColorMaxContrast')))
    // Hue
    .addWidget(subheader('Hue adjust'))
    .addWidget(
      CardService.newSelectionInput()
        .setType(CardService.SelectionInputType.DROPDOWN)
        .setFieldName('hue_adjust_value')
        .addItem('15°', '15', true)
        .addItem('30°', '30', false)
    )
    .addWidget(btnRow(
      CardService.newTextButton().setText('\u2212').setOnClickAction(CardService.newAction().setFunctionName('applyHueAdjust').setParameters({sign: '-1'})),
      CardService.newTextButton().setText('+').setOnClickAction(CardService.newAction().setFunctionName('applyHueAdjust').setParameters({sign: '1'}))
    ))
    .addWidget(subheader('Hue set'))
    .addWidget(btnRow(
      CardService.newTextButton().setText('0°')  .setBackgroundColor('#FF0000').setOnClickAction(CardService.newAction().setFunctionName('menuSetColorHue0')),
      CardService.newTextButton().setText('30°') .setBackgroundColor('#FF8000').setOnClickAction(CardService.newAction().setFunctionName('menuSetColorHue30')),
      CardService.newTextButton().setText('60°') .setBackgroundColor('#FFFF00').setOnClickAction(CardService.newAction().setFunctionName('menuSetColorHue60'))
    ))
    .addWidget(btnRow(
      CardService.newTextButton().setText('90°') .setBackgroundColor('#80FF00').setOnClickAction(CardService.newAction().setFunctionName('menuSetColorHue90')),
      CardService.newTextButton().setText('120°').setBackgroundColor('#00FF00').setOnClickAction(CardService.newAction().setFunctionName('menuSetColorHue120')),
      CardService.newTextButton().setText('150°').setBackgroundColor('#00FF80').setOnClickAction(CardService.newAction().setFunctionName('menuSetColorHue150'))
    ))
    .addWidget(btnRow(
      CardService.newTextButton().setText('180°').setBackgroundColor('#00FFFF').setOnClickAction(CardService.newAction().setFunctionName('menuSetColorHue180')),
      CardService.newTextButton().setText('210°').setBackgroundColor('#0080FF').setOnClickAction(CardService.newAction().setFunctionName('menuSetColorHue210')),
      CardService.newTextButton().setText('240°').setBackgroundColor('#0000FF').setOnClickAction(CardService.newAction().setFunctionName('menuSetColorHue240'))
    ))
    .addWidget(btnRow(
      CardService.newTextButton().setText('270°').setBackgroundColor('#8000FF').setOnClickAction(CardService.newAction().setFunctionName('menuSetColorHue270')),
      CardService.newTextButton().setText('300°').setBackgroundColor('#FF00FF').setOnClickAction(CardService.newAction().setFunctionName('menuSetColorHue300')),
      CardService.newTextButton().setText('330°').setBackgroundColor('#FF0080').setOnClickAction(CardService.newAction().setFunctionName('menuSetColorHue330'))
    ))
    // Saturation adjust — dropdown + ±
    .addWidget(subheader('Saturation adjust'))
    .addWidget(
      CardService.newSelectionInput()
        .setType(CardService.SelectionInputType.DROPDOWN)
        .setFieldName('saturation_adjust_value')
        .addItem('5%',  '0.05', true)
        .addItem('10%', '0.10', false)
        .addItem('33%', '0.33', false)
    )
    .addWidget(btnRow(
      CardService.newTextButton().setText('\u2212').setOnClickAction(CardService.newAction().setFunctionName('applySaturationAdjust').setParameters({sign: '-1'})),
      CardService.newTextButton().setText('+').setOnClickAction(CardService.newAction().setFunctionName('applySaturationAdjust').setParameters({sign: '1'}))
    ))
    // Saturation set
    .addWidget(subheader('Saturation set'))
    .addWidget(btnRow(btn('0% Grey', 'menuSetColorSaturationAbs0'),  btn('10%', 'menuSetColorSaturationAbs10'), btn('25%', 'menuSetColorSaturationAbs25')))
    .addWidget(btnRow(btn('33%',     'menuSetColorSaturationAbs33'), btn('50%', 'menuSetColorSaturationAbs50'), btn('66%', 'menuSetColorSaturationAbs66')))
    .addWidget(btnRow(btn('75%',     'menuSetColorSaturationAbs75'), btn('90%', 'menuSetColorSaturationAbs90'), btn('100%', 'menuSetColorSaturationAbs100')))
    // Luminosity adjust — dropdown + ±
    .addWidget(subheader('Luminosity adjust'))
    .addWidget(
      CardService.newSelectionInput()
        .setType(CardService.SelectionInputType.DROPDOWN)
        .setFieldName('luminosity_adjust_value')
        .addItem('5%',  '0.05', true)
        .addItem('10%', '0.10', false)
        .addItem('33%', '0.33', false)
    )
    .addWidget(btnRow(
      CardService.newTextButton().setText('\u2212').setOnClickAction(CardService.newAction().setFunctionName('applyLuminosityAdjust').setParameters({sign: '-1'})),
      CardService.newTextButton().setText('+').setOnClickAction(CardService.newAction().setFunctionName('applyLuminosityAdjust').setParameters({sign: '1'}))
    ))
    // Luminosity set
    .addWidget(subheader('Luminosity set'))
    .addWidget(btnRow(btn('10%', 'menuSetColorLuminosityAbs10'), btn('25%', 'menuSetColorLuminosityAbs25'), btn('33%', 'menuSetColorLuminosityAbs33')))
    .addWidget(btnRow(btn('50%', 'menuSetColorLuminosityAbs50'), btn('66%', 'menuSetColorLuminosityAbs66'), btn('75%', 'menuSetColorLuminosityAbs75')))
    .addWidget(btnRow(btn('90%', 'menuSetColorLuminosityAbs90')))
    // Transparency
    .addWidget(subheader('Transparency'))
    .addWidget(btnRow(btn('0% Opaque',   'menuSetTransparency100'), btn('10%', 'menuSetTransparency90'), btn('25%', 'menuSetTransparency75')))
    .addWidget(btnRow(btn('33%',         'menuSetTransparency66'),  btn('50%', 'menuSetTransparency50'), btn('66%', 'menuSetTransparency33')))
    .addWidget(btnRow(btn('75%',         'menuSetTransparency25'),  btn('90%', 'menuSetTransparency10'), btn('100% Clear', 'menuSetTransparency0')));
}

// === ACTION HANDLERS FOR ADJUST DROPDOWNS ===

function applyHueAdjust(event) {
  var degrees = parseFloat(event.formInput.hue_adjust_value);
  var sign    = parseFloat(event.parameters.sign);
  withSelectedOrAllShapesOrGroupsRecursively(function(s) {
    changeHSL(s, sign * (degrees / 360), false, HSL_COMPONENT.HUE);
  });
}


function applySaturationAdjust(event) {
  var value = parseFloat(event.formInput.saturation_adjust_value);
  var sign  = parseFloat(event.parameters.sign);
  withSelectedOrAllShapesOrGroupsRecursively(function(s) {
    changeHSL(s, sign * value, false, HSL_COMPONENT.SATURATION);
  });
}

function applyLuminosityAdjust(event) {
  var value = parseFloat(event.formInput.luminosity_adjust_value);
  var sign  = parseFloat(event.parameters.sign);
  withSelectedOrAllShapesOrGroupsRecursively(function(s) {
    changeHSL(s, sign * value, false, HSL_COMPONENT.LUMINOSITY);
  });
}
