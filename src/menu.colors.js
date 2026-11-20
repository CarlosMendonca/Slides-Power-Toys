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

// COLOR SPACE MENUS & HANDLERS (OKLCH, HSL, HSV, HWB)

// === MENU BUILDERS ===

function buildRgbHueSubMenu(ui) {
  return ui.createMenu('Hue (H)')
    .addItem('-30° (towards pink)',   'menuSetColorHueMinus30')
    .addItem('-15°',                  'menuSetColorHueMinus15')
    .addSeparator()
    .addItem('+15°',                  'menuSetColorHuePlus15')
    .addItem('+30° (towards orange)', 'menuSetColorHuePlus30')
    .addSeparator()
    .addItem('0° (Red)',              'menuSetColorHue0')
    .addItem('30° (Dark Orange)',     'menuSetColorHue30')
    .addItem('60° (Yellow)',          'menuSetColorHue60')
    .addItem('90° (Chartreuse)',      'menuSetColorHue90')
    .addItem('120° (Lime)',           'menuSetColorHue120')
    .addItem('150° (Spring Green)',   'menuSetColorHue150')
    .addItem('180° (Aqua)',           'menuSetColorHue180')
    .addItem('210° (Sky Blue)',       'menuSetColorHue210')
    .addItem('240° (Blue)',           'menuSetColorHue240')
    .addItem('270° (Purple)',         'menuSetColorHue270')
    .addItem('300° (Magenta)',        'menuSetColorHue300')
    .addItem('330° (Deep Pink)',      'menuSetColorHue330');
}

function buildOklchMenu(ui) {
  return ui.createMenu('Color (OKLCH)')
    .addSubMenu(ui.createMenu('Lightness (L)')
      .addItem('-33%', 'menuSetColorOklchLightnessMinus33')
      .addItem('-10%', 'menuSetColorOklchLightnessMinus10')
      .addItem('-5%',  'menuSetColorOklchLightnessMinus5')
      .addSeparator()
      .addItem('+5%',  'menuSetColorOklchLightnessPlus5')
      .addItem('+10%', 'menuSetColorOklchLightnessPlus10')
      .addItem('+33%', 'menuSetColorOklchLightnessPlus33')
      .addSeparator()
      .addItem('10% (towards black)', 'menuSetColorOklchLightnessAbs10')
      .addItem('25%', 'menuSetColorOklchLightnessAbs25')
      .addItem('33%', 'menuSetColorOklchLightnessAbs33')
      .addItem('50%', 'menuSetColorOklchLightnessAbs50')
      .addItem('66%', 'menuSetColorOklchLightnessAbs66')
      .addItem('75%', 'menuSetColorOklchLightnessAbs75')
      .addItem('90% (towards white)', 'menuSetColorOklchLightnessAbs90'))
    .addSubMenu(ui.createMenu('Chroma (C)')
      .addItem('-0.10', 'menuSetColorOklchChromaMinus10')
      .addItem('-0.05', 'menuSetColorOklchChromaMinus5')
      .addItem('-0.02', 'menuSetColorOklchChromaMinus2')
      .addSeparator()
      .addItem('+0.02', 'menuSetColorOklchChromaPlus2')
      .addItem('+0.05', 'menuSetColorOklchChromaPlus5')
      .addItem('+0.10', 'menuSetColorOklchChromaPlus10')
      .addSeparator()
      .addItem('0.00 (greyscale)', 'menuSetColorOklchChromaAbs0')
      .addItem('0.04 (muted)',     'menuSetColorOklchChromaAbs4')
      .addItem('0.08',             'menuSetColorOklchChromaAbs8')
      .addItem('0.12',             'menuSetColorOklchChromaAbs12')
      .addItem('0.16',             'menuSetColorOklchChromaAbs16')
      .addItem('0.20',             'menuSetColorOklchChromaAbs20')
      .addItem('0.25',             'menuSetColorOklchChromaAbs25')
      .addItem('0.30 (vivid)',     'menuSetColorOklchChromaAbs30'))
    .addSubMenu(ui.createMenu('Hue (H)')
      .addItem('-30°', 'menuSetColorOklchHueMinus30')
      .addItem('-15°', 'menuSetColorOklchHueMinus15')
      .addSeparator()
      .addItem('+15°', 'menuSetColorOklchHuePlus15')
      .addItem('+30°', 'menuSetColorOklchHuePlus30')
      .addSeparator()
      .addItem('0° (Magenta-Red)',   'menuSetColorOklchHue0')
      .addItem('30° (Red)',          'menuSetColorOklchHue30')
      .addItem('60° (Orange)',       'menuSetColorOklchHue60')
      .addItem('90° (Yellow-Gold)',  'menuSetColorOklchHue90')
      .addItem('120° (Yellow-Green)','menuSetColorOklchHue120')
      .addItem('150° (Green)',       'menuSetColorOklchHue150')
      .addItem('180° (Mint/Teal)',   'menuSetColorOklchHue180')
      .addItem('210° (Cyan)',        'menuSetColorOklchHue210')
      .addItem('240° (Sky Blue)',    'menuSetColorOklchHue240')
      .addItem('270° (Blue/Indigo)', 'menuSetColorOklchHue270')
      .addItem('300° (Violet)',      'menuSetColorOklchHue300')
      .addItem('330° (Magenta)',     'menuSetColorOklchHue330'));
}

function buildHslMenu(ui) {
  return ui.createMenu('Color (HSL)')
    .addSubMenu(buildRgbHueSubMenu(ui))
    .addSubMenu(ui.createMenu('Saturation (S)')
      .addItem('-33%', 'menuSetColorSaturationMinus33')
      .addItem('-10%', 'menuSetColorSaturationMinus10')
      .addItem('-5%',  'menuSetColorSaturationMinus5')
      .addSeparator()
      .addItem('+5%',  'menuSetColorSaturationPlus5')
      .addItem('+10%', 'menuSetColorSaturationPlus10')
      .addItem('+33%', 'menuSetColorSaturationPlus33')
      .addSeparator()
      .addItem('0% (greyscale)',     'menuSetColorSaturationAbs0')
      .addItem('10%',                'menuSetColorSaturationAbs10')
      .addItem('25%',                'menuSetColorSaturationAbs25')
      .addItem('33%',                'menuSetColorSaturationAbs33')
      .addItem('50%',                'menuSetColorSaturationAbs50')
      .addItem('66%',                'menuSetColorSaturationAbs66')
      .addItem('75%',                'menuSetColorSaturationAbs75')
      .addItem('90%',                'menuSetColorSaturationAbs90')
      .addItem('100% (towards color)', 'menuSetColorSaturationAbs100'))
    .addSubMenu(ui.createMenu('Luminosity (L)')
      .addItem('-33%', 'menuSetColorLuminosityMinus33')
      .addItem('-10%', 'menuSetColorLuminosityMinus10')
      .addItem('-5%',  'menuSetColorLuminosityMinus5')
      .addSeparator()
      .addItem('+5%',  'menuSetColorLuminosityPlus5')
      .addItem('+10%', 'menuSetColorLuminosityPlus10')
      .addItem('+33%', 'menuSetColorLuminosityPlus33')
      .addSeparator()
      .addItem('10% (towards black)', 'menuSetColorLuminosityAbs10')
      .addItem('25%', 'menuSetColorLuminosityAbs25')
      .addItem('33%', 'menuSetColorLuminosityAbs33')
      .addItem('50%', 'menuSetColorLuminosityAbs50')
      .addItem('66%', 'menuSetColorLuminosityAbs66')
      .addItem('75%', 'menuSetColorLuminosityAbs75')
      .addItem('90% (towards white)', 'menuSetColorLuminosityAbs90'));
}

function buildHsvMenu(ui) {
  return ui.createMenu('Color (HSV)')
    .addSubMenu(buildRgbHueSubMenu(ui))
    .addSubMenu(ui.createMenu('Saturation (S)')
      .addItem('-33%', 'menuSetColorHsvSaturationMinus33')
      .addItem('-10%', 'menuSetColorHsvSaturationMinus10')
      .addItem('-5%',  'menuSetColorHsvSaturationMinus5')
      .addSeparator()
      .addItem('+5%',  'menuSetColorHsvSaturationPlus5')
      .addItem('+10%', 'menuSetColorHsvSaturationPlus10')
      .addItem('+33%', 'menuSetColorHsvSaturationPlus33')
      .addSeparator()
      .addItem('0% (greyscale)', 'menuSetColorHsvSaturationAbs0')
      .addItem('10%',            'menuSetColorHsvSaturationAbs10')
      .addItem('25%',            'menuSetColorHsvSaturationAbs25')
      .addItem('33%',            'menuSetColorHsvSaturationAbs33')
      .addItem('50%',            'menuSetColorHsvSaturationAbs50')
      .addItem('66%',            'menuSetColorHsvSaturationAbs66')
      .addItem('75%',            'menuSetColorHsvSaturationAbs75')
      .addItem('90%',            'menuSetColorHsvSaturationAbs90')
      .addItem('100% (vivid)',   'menuSetColorHsvSaturationAbs100'))
    .addSubMenu(ui.createMenu('Value (V)')
      .addItem('-33%', 'menuSetColorHsvValueMinus33')
      .addItem('-10%', 'menuSetColorHsvValueMinus10')
      .addItem('-5%',  'menuSetColorHsvValueMinus5')
      .addSeparator()
      .addItem('+5%',  'menuSetColorHsvValuePlus5')
      .addItem('+10%', 'menuSetColorHsvValuePlus10')
      .addItem('+33%', 'menuSetColorHsvValuePlus33')
      .addSeparator()
      .addItem('10% (dark)',   'menuSetColorHsvValueAbs10')
      .addItem('25%',          'menuSetColorHsvValueAbs25')
      .addItem('33%',          'menuSetColorHsvValueAbs33')
      .addItem('50%',          'menuSetColorHsvValueAbs50')
      .addItem('66%',          'menuSetColorHsvValueAbs66')
      .addItem('75%',          'menuSetColorHsvValueAbs75')
      .addItem('90%',          'menuSetColorHsvValueAbs90')
      .addItem('100% (bright)','menuSetColorHsvValueAbs100'));
}

function buildHwbMenu(ui) {
  return ui.createMenu('Color (HWB)')
    .addSubMenu(buildRgbHueSubMenu(ui))
    .addSubMenu(ui.createMenu('Whiteness (W)')
      .addItem('-33%', 'menuSetColorHwbWhitenessMinus33')
      .addItem('-10%', 'menuSetColorHwbWhitenessMinus10')
      .addItem('-5%',  'menuSetColorHwbWhitenessMinus5')
      .addSeparator()
      .addItem('+5%',  'menuSetColorHwbWhitenessPlus5')
      .addItem('+10%', 'menuSetColorHwbWhitenessPlus10')
      .addItem('+33%', 'menuSetColorHwbWhitenessPlus33')
      .addSeparator()
      .addItem('0% (no white)', 'menuSetColorHwbWhitenessAbs0')
      .addItem('10%',           'menuSetColorHwbWhitenessAbs10')
      .addItem('25%',           'menuSetColorHwbWhitenessAbs25')
      .addItem('33%',           'menuSetColorHwbWhitenessAbs33')
      .addItem('50%',           'menuSetColorHwbWhitenessAbs50')
      .addItem('66%',           'menuSetColorHwbWhitenessAbs66')
      .addItem('75%',           'menuSetColorHwbWhitenessAbs75')
      .addItem('90% (tint)',    'menuSetColorHwbWhitenessAbs90'))
    .addSubMenu(ui.createMenu('Blackness (B)')
      .addItem('-33%', 'menuSetColorHwbBlacknessMinus33')
      .addItem('-10%', 'menuSetColorHwbBlacknessMinus10')
      .addItem('-5%',  'menuSetColorHwbBlacknessMinus5')
      .addSeparator()
      .addItem('+5%',  'menuSetColorHwbBlacknessPlus5')
      .addItem('+10%', 'menuSetColorHwbBlacknessPlus10')
      .addItem('+33%', 'menuSetColorHwbBlacknessPlus33')
      .addSeparator()
      .addItem('0% (no black)', 'menuSetColorHwbBlacknessAbs0')
      .addItem('10%',           'menuSetColorHwbBlacknessAbs10')
      .addItem('25%',           'menuSetColorHwbBlacknessAbs25')
      .addItem('33%',           'menuSetColorHwbBlacknessAbs33')
      .addItem('50%',           'menuSetColorHwbBlacknessAbs50')
      .addItem('66%',           'menuSetColorHwbBlacknessAbs66')
      .addItem('75%',           'menuSetColorHwbBlacknessAbs75')
      .addItem('90% (shade)',   'menuSetColorHwbBlacknessAbs90'));
}

// === INTERNAL APPLY HELPERS ===

function applyHslToSelection(valueChange, isAbsoluteChange, component) {
  withSelectedOrAllShapesOrGroupsRecursively((s) => changeHSL(s, valueChange, isAbsoluteChange, component));
}

function applyHsvToSelection(valueChange, isAbsoluteChange, component) {
  withSelectedOrAllShapesOrGroupsRecursively((s) => changeHSV(s, valueChange, isAbsoluteChange, component));
}

function applyHwbToSelection(valueChange, isAbsoluteChange, component) {
  withSelectedOrAllShapesOrGroupsRecursively((s) => changeHWB(s, valueChange, isAbsoluteChange, component));
}

function applyOklchToSelection(valueChange, isAbsoluteChange, component) {
  withSelectedOrAllShapesOrGroupsRecursively((s) => changeOKLCH(s, valueChange, isAbsoluteChange, component));
}

// === HSL & SHARED RGB-CYLINDRICAL HUE HANDLERS ===

function menuSetColorHueMinus30() { applyHslToSelection(-30 / 360, false, HSL_COMPONENT.HUE); }
function menuSetColorHueMinus15() { applyHslToSelection(-15 / 360, false, HSL_COMPONENT.HUE); }
function menuSetColorHuePlus15()  { applyHslToSelection( 15 / 360, false, HSL_COMPONENT.HUE); }
function menuSetColorHuePlus30()  { applyHslToSelection( 30 / 360, false, HSL_COMPONENT.HUE); }

function menuSetColorHue0()   { applyHslToSelection(  0 / 360, true, HSL_COMPONENT.HUE); }
function menuSetColorHue30()  { applyHslToSelection( 30 / 360, true, HSL_COMPONENT.HUE); }
function menuSetColorHue60()  { applyHslToSelection( 60 / 360, true, HSL_COMPONENT.HUE); }
function menuSetColorHue90()  { applyHslToSelection( 90 / 360, true, HSL_COMPONENT.HUE); }
function menuSetColorHue120() { applyHslToSelection(120 / 360, true, HSL_COMPONENT.HUE); }
function menuSetColorHue150() { applyHslToSelection(150 / 360, true, HSL_COMPONENT.HUE); }
function menuSetColorHue180() { applyHslToSelection(180 / 360, true, HSL_COMPONENT.HUE); }
function menuSetColorHue210() { applyHslToSelection(210 / 360, true, HSL_COMPONENT.HUE); }
function menuSetColorHue240() { applyHslToSelection(240 / 360, true, HSL_COMPONENT.HUE); }
function menuSetColorHue270() { applyHslToSelection(270 / 360, true, HSL_COMPONENT.HUE); }
function menuSetColorHue300() { applyHslToSelection(300 / 360, true, HSL_COMPONENT.HUE); }
function menuSetColorHue330() { applyHslToSelection(330 / 360, true, HSL_COMPONENT.HUE); }

function menuSetColorSaturationMinus33() { applyHslToSelection(-0.33, false, HSL_COMPONENT.SATURATION); }
function menuSetColorSaturationMinus10() { applyHslToSelection(-0.1,  false, HSL_COMPONENT.SATURATION); }
function menuSetColorSaturationMinus5()  { applyHslToSelection(-0.05, false, HSL_COMPONENT.SATURATION); }
function menuSetColorSaturationPlus5()   { applyHslToSelection( 0.05, false, HSL_COMPONENT.SATURATION); }
function menuSetColorSaturationPlus10()  { applyHslToSelection( 0.1,  false, HSL_COMPONENT.SATURATION); }
function menuSetColorSaturationPlus33()  { applyHslToSelection( 0.33, false, HSL_COMPONENT.SATURATION); }

function menuSetColorSaturationAbs0()   { applyHslToSelection(0,    true, HSL_COMPONENT.SATURATION); }
function menuSetColorSaturationAbs10()  { applyHslToSelection(0.1,  true, HSL_COMPONENT.SATURATION); }
function menuSetColorSaturationAbs25()  { applyHslToSelection(0.25, true, HSL_COMPONENT.SATURATION); }
function menuSetColorSaturationAbs33()  { applyHslToSelection(0.33, true, HSL_COMPONENT.SATURATION); }
function menuSetColorSaturationAbs50()  { applyHslToSelection(0.5,  true, HSL_COMPONENT.SATURATION); }
function menuSetColorSaturationAbs66()  { applyHslToSelection(0.66, true, HSL_COMPONENT.SATURATION); }
function menuSetColorSaturationAbs75()  { applyHslToSelection(0.75, true, HSL_COMPONENT.SATURATION); }
function menuSetColorSaturationAbs90()  { applyHslToSelection(0.9,  true, HSL_COMPONENT.SATURATION); }
function menuSetColorSaturationAbs100() { applyHslToSelection(1.0,  true, HSL_COMPONENT.SATURATION); }

function menuSetColorLuminosityMinus33() { applyHslToSelection(-0.33, false, HSL_COMPONENT.LUMINOSITY); }
function menuSetColorLuminosityMinus10() { applyHslToSelection(-0.1,  false, HSL_COMPONENT.LUMINOSITY); }
function menuSetColorLuminosityMinus5()  { applyHslToSelection(-0.05, false, HSL_COMPONENT.LUMINOSITY); }
function menuSetColorLuminosityPlus5()   { applyHslToSelection( 0.05, false, HSL_COMPONENT.LUMINOSITY); }
function menuSetColorLuminosityPlus10()  { applyHslToSelection( 0.1,  false, HSL_COMPONENT.LUMINOSITY); }
function menuSetColorLuminosityPlus33()  { applyHslToSelection( 0.33, false, HSL_COMPONENT.LUMINOSITY); }

function menuSetColorLuminosityAbs10() { applyHslToSelection(0.1,  true, HSL_COMPONENT.LUMINOSITY); }
function menuSetColorLuminosityAbs25() { applyHslToSelection(0.25, true, HSL_COMPONENT.LUMINOSITY); }
function menuSetColorLuminosityAbs33() { applyHslToSelection(0.33, true, HSL_COMPONENT.LUMINOSITY); }
function menuSetColorLuminosityAbs50() { applyHslToSelection(0.5,  true, HSL_COMPONENT.LUMINOSITY); }
function menuSetColorLuminosityAbs66() { applyHslToSelection(0.66, true, HSL_COMPONENT.LUMINOSITY); }
function menuSetColorLuminosityAbs75() { applyHslToSelection(0.75, true, HSL_COMPONENT.LUMINOSITY); }
function menuSetColorLuminosityAbs90() { applyHslToSelection(0.9,  true, HSL_COMPONENT.LUMINOSITY); }

// === OKLCH HANDLERS ===

function menuSetColorOklchLightnessMinus33() { applyOklchToSelection(-0.33, false, OKLCH_COMPONENT.LIGHTNESS); }
function menuSetColorOklchLightnessMinus10() { applyOklchToSelection(-0.1,  false, OKLCH_COMPONENT.LIGHTNESS); }
function menuSetColorOklchLightnessMinus5()  { applyOklchToSelection(-0.05, false, OKLCH_COMPONENT.LIGHTNESS); }
function menuSetColorOklchLightnessPlus5()   { applyOklchToSelection( 0.05, false, OKLCH_COMPONENT.LIGHTNESS); }
function menuSetColorOklchLightnessPlus10()  { applyOklchToSelection( 0.1,  false, OKLCH_COMPONENT.LIGHTNESS); }
function menuSetColorOklchLightnessPlus33()  { applyOklchToSelection( 0.33, false, OKLCH_COMPONENT.LIGHTNESS); }

function menuSetColorOklchLightnessAbs10() { applyOklchToSelection(0.1,  true, OKLCH_COMPONENT.LIGHTNESS); }
function menuSetColorOklchLightnessAbs25() { applyOklchToSelection(0.25, true, OKLCH_COMPONENT.LIGHTNESS); }
function menuSetColorOklchLightnessAbs33() { applyOklchToSelection(0.33, true, OKLCH_COMPONENT.LIGHTNESS); }
function menuSetColorOklchLightnessAbs50() { applyOklchToSelection(0.5,  true, OKLCH_COMPONENT.LIGHTNESS); }
function menuSetColorOklchLightnessAbs66() { applyOklchToSelection(0.66, true, OKLCH_COMPONENT.LIGHTNESS); }
function menuSetColorOklchLightnessAbs75() { applyOklchToSelection(0.75, true, OKLCH_COMPONENT.LIGHTNESS); }
function menuSetColorOklchLightnessAbs90() { applyOklchToSelection(0.9,  true, OKLCH_COMPONENT.LIGHTNESS); }

function menuSetColorOklchChromaMinus10() { applyOklchToSelection(-0.1,  false, OKLCH_COMPONENT.CHROMA); }
function menuSetColorOklchChromaMinus5()  { applyOklchToSelection(-0.05, false, OKLCH_COMPONENT.CHROMA); }
function menuSetColorOklchChromaMinus2()  { applyOklchToSelection(-0.02, false, OKLCH_COMPONENT.CHROMA); }
function menuSetColorOklchChromaPlus2()   { applyOklchToSelection( 0.02, false, OKLCH_COMPONENT.CHROMA); }
function menuSetColorOklchChromaPlus5()   { applyOklchToSelection( 0.05, false, OKLCH_COMPONENT.CHROMA); }
function menuSetColorOklchChromaPlus10()  { applyOklchToSelection( 0.1,  false, OKLCH_COMPONENT.CHROMA); }

function menuSetColorOklchChromaAbs0()  { applyOklchToSelection(0,    true, OKLCH_COMPONENT.CHROMA); }
function menuSetColorOklchChromaAbs4()  { applyOklchToSelection(0.04, true, OKLCH_COMPONENT.CHROMA); }
function menuSetColorOklchChromaAbs8()  { applyOklchToSelection(0.08, true, OKLCH_COMPONENT.CHROMA); }
function menuSetColorOklchChromaAbs12() { applyOklchToSelection(0.12, true, OKLCH_COMPONENT.CHROMA); }
function menuSetColorOklchChromaAbs16() { applyOklchToSelection(0.16, true, OKLCH_COMPONENT.CHROMA); }
function menuSetColorOklchChromaAbs20() { applyOklchToSelection(0.2,  true, OKLCH_COMPONENT.CHROMA); }
function menuSetColorOklchChromaAbs25() { applyOklchToSelection(0.25, true, OKLCH_COMPONENT.CHROMA); }
function menuSetColorOklchChromaAbs30() { applyOklchToSelection(0.3,  true, OKLCH_COMPONENT.CHROMA); }

function menuSetColorOklchHueMinus30() { applyOklchToSelection(-30, false, OKLCH_COMPONENT.HUE); }
function menuSetColorOklchHueMinus15() { applyOklchToSelection(-15, false, OKLCH_COMPONENT.HUE); }
function menuSetColorOklchHuePlus15()  { applyOklchToSelection( 15, false, OKLCH_COMPONENT.HUE); }
function menuSetColorOklchHuePlus30()  { applyOklchToSelection( 30, false, OKLCH_COMPONENT.HUE); }

function menuSetColorOklchHue0()   { applyOklchToSelection(  0, true, OKLCH_COMPONENT.HUE); }
function menuSetColorOklchHue30()  { applyOklchToSelection( 30, true, OKLCH_COMPONENT.HUE); }
function menuSetColorOklchHue60()  { applyOklchToSelection( 60, true, OKLCH_COMPONENT.HUE); }
function menuSetColorOklchHue90()  { applyOklchToSelection( 90, true, OKLCH_COMPONENT.HUE); }
function menuSetColorOklchHue120() { applyOklchToSelection(120, true, OKLCH_COMPONENT.HUE); }
function menuSetColorOklchHue150() { applyOklchToSelection(150, true, OKLCH_COMPONENT.HUE); }
function menuSetColorOklchHue180() { applyOklchToSelection(180, true, OKLCH_COMPONENT.HUE); }
function menuSetColorOklchHue210() { applyOklchToSelection(210, true, OKLCH_COMPONENT.HUE); }
function menuSetColorOklchHue240() { applyOklchToSelection(240, true, OKLCH_COMPONENT.HUE); }
function menuSetColorOklchHue270() { applyOklchToSelection(270, true, OKLCH_COMPONENT.HUE); }
function menuSetColorOklchHue300() { applyOklchToSelection(300, true, OKLCH_COMPONENT.HUE); }
function menuSetColorOklchHue330() { applyOklchToSelection(330, true, OKLCH_COMPONENT.HUE); }

// === HSV HANDLERS ===

function menuSetColorHsvSaturationMinus33() { applyHsvToSelection(-0.33, false, HSV_COMPONENT.SATURATION); }
function menuSetColorHsvSaturationMinus10() { applyHsvToSelection(-0.1,  false, HSV_COMPONENT.SATURATION); }
function menuSetColorHsvSaturationMinus5()  { applyHsvToSelection(-0.05, false, HSV_COMPONENT.SATURATION); }
function menuSetColorHsvSaturationPlus5()   { applyHsvToSelection( 0.05, false, HSV_COMPONENT.SATURATION); }
function menuSetColorHsvSaturationPlus10()  { applyHsvToSelection( 0.1,  false, HSV_COMPONENT.SATURATION); }
function menuSetColorHsvSaturationPlus33()  { applyHsvToSelection( 0.33, false, HSV_COMPONENT.SATURATION); }

function menuSetColorHsvSaturationAbs0()   { applyHsvToSelection(0,    true, HSV_COMPONENT.SATURATION); }
function menuSetColorHsvSaturationAbs10()  { applyHsvToSelection(0.1,  true, HSV_COMPONENT.SATURATION); }
function menuSetColorHsvSaturationAbs25()  { applyHsvToSelection(0.25, true, HSV_COMPONENT.SATURATION); }
function menuSetColorHsvSaturationAbs33()  { applyHsvToSelection(0.33, true, HSV_COMPONENT.SATURATION); }
function menuSetColorHsvSaturationAbs50()  { applyHsvToSelection(0.5,  true, HSV_COMPONENT.SATURATION); }
function menuSetColorHsvSaturationAbs66()  { applyHsvToSelection(0.66, true, HSV_COMPONENT.SATURATION); }
function menuSetColorHsvSaturationAbs75()  { applyHsvToSelection(0.75, true, HSV_COMPONENT.SATURATION); }
function menuSetColorHsvSaturationAbs90()  { applyHsvToSelection(0.9,  true, HSV_COMPONENT.SATURATION); }
function menuSetColorHsvSaturationAbs100() { applyHsvToSelection(1.0,  true, HSV_COMPONENT.SATURATION); }

function menuSetColorHsvValueMinus33() { applyHsvToSelection(-0.33, false, HSV_COMPONENT.VALUE); }
function menuSetColorHsvValueMinus10() { applyHsvToSelection(-0.1,  false, HSV_COMPONENT.VALUE); }
function menuSetColorHsvValueMinus5()  { applyHsvToSelection(-0.05, false, HSV_COMPONENT.VALUE); }
function menuSetColorHsvValuePlus5()   { applyHsvToSelection( 0.05, false, HSV_COMPONENT.VALUE); }
function menuSetColorHsvValuePlus10()  { applyHsvToSelection( 0.1,  false, HSV_COMPONENT.VALUE); }
function menuSetColorHsvValuePlus33()  { applyHsvToSelection( 0.33, false, HSV_COMPONENT.VALUE); }

function menuSetColorHsvValueAbs10()  { applyHsvToSelection(0.1,  true, HSV_COMPONENT.VALUE); }
function menuSetColorHsvValueAbs25()  { applyHsvToSelection(0.25, true, HSV_COMPONENT.VALUE); }
function menuSetColorHsvValueAbs33()  { applyHsvToSelection(0.33, true, HSV_COMPONENT.VALUE); }
function menuSetColorHsvValueAbs50()  { applyHsvToSelection(0.5,  true, HSV_COMPONENT.VALUE); }
function menuSetColorHsvValueAbs66()  { applyHsvToSelection(0.66, true, HSV_COMPONENT.VALUE); }
function menuSetColorHsvValueAbs75()  { applyHsvToSelection(0.75, true, HSV_COMPONENT.VALUE); }
function menuSetColorHsvValueAbs90()  { applyHsvToSelection(0.9,  true, HSV_COMPONENT.VALUE); }
function menuSetColorHsvValueAbs100() { applyHsvToSelection(1.0,  true, HSV_COMPONENT.VALUE); }

// === HWB HANDLERS ===

function menuSetColorHwbWhitenessMinus33() { applyHwbToSelection(-0.33, false, HWB_COMPONENT.WHITENESS); }
function menuSetColorHwbWhitenessMinus10() { applyHwbToSelection(-0.1,  false, HWB_COMPONENT.WHITENESS); }
function menuSetColorHwbWhitenessMinus5()  { applyHwbToSelection(-0.05, false, HWB_COMPONENT.WHITENESS); }
function menuSetColorHwbWhitenessPlus5()   { applyHwbToSelection( 0.05, false, HWB_COMPONENT.WHITENESS); }
function menuSetColorHwbWhitenessPlus10()  { applyHwbToSelection( 0.1,  false, HWB_COMPONENT.WHITENESS); }
function menuSetColorHwbWhitenessPlus33()  { applyHwbToSelection( 0.33, false, HWB_COMPONENT.WHITENESS); }

function menuSetColorHwbWhitenessAbs0()  { applyHwbToSelection(0,    true, HWB_COMPONENT.WHITENESS); }
function menuSetColorHwbWhitenessAbs10() { applyHwbToSelection(0.1,  true, HWB_COMPONENT.WHITENESS); }
function menuSetColorHwbWhitenessAbs25() { applyHwbToSelection(0.25, true, HWB_COMPONENT.WHITENESS); }
function menuSetColorHwbWhitenessAbs33() { applyHwbToSelection(0.33, true, HWB_COMPONENT.WHITENESS); }
function menuSetColorHwbWhitenessAbs50() { applyHwbToSelection(0.5,  true, HWB_COMPONENT.WHITENESS); }
function menuSetColorHwbWhitenessAbs66() { applyHwbToSelection(0.66, true, HWB_COMPONENT.WHITENESS); }
function menuSetColorHwbWhitenessAbs75() { applyHwbToSelection(0.75, true, HWB_COMPONENT.WHITENESS); }
function menuSetColorHwbWhitenessAbs90() { applyHwbToSelection(0.9,  true, HWB_COMPONENT.WHITENESS); }

function menuSetColorHwbBlacknessMinus33() { applyHwbToSelection(-0.33, false, HWB_COMPONENT.BLACKNESS); }
function menuSetColorHwbBlacknessMinus10() { applyHwbToSelection(-0.1,  false, HWB_COMPONENT.BLACKNESS); }
function menuSetColorHwbBlacknessMinus5()  { applyHwbToSelection(-0.05, false, HWB_COMPONENT.BLACKNESS); }
function menuSetColorHwbBlacknessPlus5()   { applyHwbToSelection( 0.05, false, HWB_COMPONENT.BLACKNESS); }
function menuSetColorHwbBlacknessPlus10()  { applyHwbToSelection( 0.1,  false, HWB_COMPONENT.BLACKNESS); }
function menuSetColorHwbBlacknessPlus33()  { applyHwbToSelection( 0.33, false, HWB_COMPONENT.BLACKNESS); }

function menuSetColorHwbBlacknessAbs0()  { applyHwbToSelection(0,    true, HWB_COMPONENT.BLACKNESS); }
function menuSetColorHwbBlacknessAbs10() { applyHwbToSelection(0.1,  true, HWB_COMPONENT.BLACKNESS); }
function menuSetColorHwbBlacknessAbs25() { applyHwbToSelection(0.25, true, HWB_COMPONENT.BLACKNESS); }
function menuSetColorHwbBlacknessAbs33() { applyHwbToSelection(0.33, true, HWB_COMPONENT.BLACKNESS); }
function menuSetColorHwbBlacknessAbs50() { applyHwbToSelection(0.5,  true, HWB_COMPONENT.BLACKNESS); }
function menuSetColorHwbBlacknessAbs66() { applyHwbToSelection(0.66, true, HWB_COMPONENT.BLACKNESS); }
function menuSetColorHwbBlacknessAbs75() { applyHwbToSelection(0.75, true, HWB_COMPONENT.BLACKNESS); }
function menuSetColorHwbBlacknessAbs90() { applyHwbToSelection(0.9,  true, HWB_COMPONENT.BLACKNESS); }
