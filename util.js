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
  
  function roundTo(number, digits) {
    var power = Math.pow(10, digits);
    return Math.round(number * power) / power;
  }
  
  function doesShapeHaveSolidFill(shape) { return shape.getFill().getType() == SlidesApp.FillType.SOLID; }
  
  // Using getLength() > 1 because isEmpty() is broken; it's probably counting the new line character
  //   that documentation (https://developers.google.com/apps-script/reference/slides/shape#gettext) 
  //   says always exists, which is a non-sensical behavior. I can see this breaking some day.
  function doesShapeHaveText(shape) { return shape.getText().getLength() > 1; }