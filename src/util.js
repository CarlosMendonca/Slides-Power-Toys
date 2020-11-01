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
  return {
    getLeft:   function() { return 0; },
    getTop:    function() { return 0; },
    getWidth:  function() { return SlidesApp.getActivePresentation().getPageWidth(); },
    getHeight: function() { return SlidesApp.getActivePresentation().getPageHeight(); }};
}

function calculateLuminosity(color) {
  var r = color.getRed()   / 255;
  var g = color.getGreen() / 255;
  var b = color.getBlue()  / 255;
  
  var max = Math.max(r, g, b), min = Math.min(r, g, b);
  return (max + min) / 2;
}

// According to WCAG 2.0 (https://www.w3.org/TR/WCAG20-TECHS/G17.html)
function calculateRelativeLuminosity(rgbColorVector1, rgbColorVector2) {
  var sRgbColorVector1 = rgbColorVector1.map((e) => { return e / 255; });
  var sRgbColorVector2 = rgbColorVector2.map((e) => { return e / 255; });
  
  sRgbColorVector1.forEach((e, index, array) => { (e < 0.03928) ? array[index] = e/12.92 : array[index] = Math.pow(((e+0.055)/1.055),2.4); });
  sRgbColorVector2.forEach((e, index, array) => { (e < 0.03928) ? array[index] = e/12.92 : array[index] = Math.pow(((e+0.055)/1.055),2.4); });

  var L1 = 0.2126 * sRgbColorVector1[0] + 0.7152 * sRgbColorVector1[1] + 0.0722 * sRgbColorVector1[2];
  var L2 = 0.2126 * sRgbColorVector2[0] + 0.7152 * sRgbColorVector2[1] + 0.0722 * sRgbColorVector2[2];
  
  return L1 > L2 ? (L1+0.05)/(L2+0.05) : (L2+0.05)/(L1+0.05);
}

function convertHslColorVectorToRgbColorVector(hslColorVector) {
  var r, g, b;
  var h = hslColorVector[0];
  var s = hslColorVector[1];
  var l = hslColorVector[2];

  if(s == 0) {
    r = g = b = l; // achromatic
  } else {
    var hue2rgb = function hue2rgb(p, q, t){
        if(t < 0) t += 1;
        if(t > 1) t -= 1;
        if(t < 1/6) return p + (q - p) * 6 * t;
        if(t < 1/2) return q;
        if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
    }

    var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    var p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)]; // would use a Javascript class, but Apps Script doesn't support ES6 (ECMAScript2015), as far as I know
}

function convertRgbColorToHslColorVector(rgbColor) {
  var r = rgbColor.getRed();
  var g = rgbColor.getGreen();
  var b = rgbColor.getBlue();

  r /= 255, g /= 255, b /= 255;
  var max = Math.max(r, g, b), min = Math.min(r, g, b);
  var h, s, l = (max + min) / 2;

  if(max == min){
      h = s = 0; // achromatic
  } else {
      var d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch(max){
          case r: h = (g - b) / d + (g < b ? 6 : 0); break;
          case g: h = (b - r) / d + 2; break;
          case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
  }

  return [h, s, l];
}

function convertRgbColorToRgbColorVector(rgbColor) {
  return [rgbColor.getRed(), rgbColor.getGreen(), rgbColor.getBlue()];
}

function roundTo(number, digits) {
  var power = Math.pow(10, digits);
  return Math.round(number * power) / power;
}

function doesShapeHaveSolidFill(shape) { return shape.getFill().getType() == SlidesApp.FillType.SOLID; }

// Using getLength() > 1 because isEmpty() is broken; it's probably counting the new line character
//   that documentation (https://developers.google.com/apps-script/reference/slides/shape#gettext) 
//   says always exists, which is a non-sensical behavior. I can see this breaking some day.
function doesShapeHaveText(shape) { return shape.getText().getLength() > 1; }

function clamp(val, min, max) {
  return val > max ? max : val < min ? min : val;
}

function getRgbColorFromShapeColor(shape) {
  var shapeColor = shape.getFill().getSolidFill().getColor();
  
  switch(shapeColor.getColorType()) {
    case(SlidesApp.ColorType.RGB):
      return rgbColor = shapeColor.asRgbColor();
    case(SlidesApp.ColorType.THEME):
      return rgbColor = shape.getParentPage().asSlide().getColorScheme().getConcreteColor(shapeColor.asThemeColor().getThemeColorType()).asRgbColor();
  }
}
