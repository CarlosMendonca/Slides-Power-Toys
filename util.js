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
  var r = color.asRgbColor().getRed()   / 255;
  var g = color.asRgbColor().getGreen() / 255;
  var b = color.asRgbColor().getBlue()  / 255;
  
  var max = Math.max(r, g, b), min = Math.min(r, g, b);
  return (max + min) / 2;
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
