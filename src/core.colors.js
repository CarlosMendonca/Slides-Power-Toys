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

// CORE LOGIC FOR COLOR OPERATIONS

function invertColorsOnShape(shape) {
    if (!doesShapeHaveSolidFill(shape)) // must have SOLID fill
        return;

    var rgbColor = getRgbColorFromShapeColor(shape);

    shape.getFill().setSolidFill(
        255 - rgbColor.getRed(),
        255 - rgbColor.getGreen(),
        255 - rgbColor.getBlue());
}

function changeHSL(shape, valueChange, isAbsoluteChange, hslComponent) {
    if (!doesShapeHaveSolidFill(shape)) // must have SOLID fill
        return;

    var rgbColor = getRgbColorFromShapeColor(shape);
    var hslColorVector = convertRgbColorToHslColorVector(rgbColor);

    hslColorVector[hslComponent] = clamp((hslColorVector[hslComponent] * !isAbsoluteChange) + valueChange, 0, 1);

    var rgbColorVector = convertHslColorVectorToRgbColorVector(hslColorVector);

    shape.getFill().setSolidFill(
        rgbColorVector[0],
        rgbColorVector[1],
        rgbColorVector[2]
    );
}
  
var setMaxContrastToTextOnShape = function(shape) { 
    if (doesShapeHaveSolidFill(shape) && doesShapeHaveText(shape)) { // must have SOLID fill and some text
      if (calculateLuminosity(getRgbColorFromShapeColor(shape)) >= 0.5)
        shape.getText().getTextStyle().setForegroundColor(0, 0, 0);
      else
        shape.getText().getTextStyle().setForegroundColor(255, 255, 255);
    }
}

function setAlphaToShape(shape, amount) {
    var fill = shape.getFill();

    if (fill.getType() == SlidesApp.FillType.SOLID)
        fill.setSolidFill(fill.getSolidFill().getColor(), amount);
}
    
function swapColorsOnShape(shape) {
    if (doesShapeHaveSolidFill(shape) && doesShapeHaveText(shape)) { // must have SOLID fill and some text
        var textStyle = shape.getText().getRuns()[0].getTextStyle();
        var textColor = textStyle.getForegroundColor();
        
        textStyle.setForegroundColor(shape.getFill().getSolidFill().getColor());
        shape.getFill().setSolidFill(textColor);
    }
}