// Copyright 2019 Google LLC
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the GNU General Public License
// version 2 as published by the Free Software Foundation.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
// GNU General Public License for more details.

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