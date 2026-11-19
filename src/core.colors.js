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
    var fill = shape.getFill();
    if (fill.getType() !== SlidesApp.FillType.SOLID) // must have SOLID fill
        return;

    var solidFill = fill.getSolidFill();
    var rgbColor = resolveRgbColor(shape, solidFill.getColor());
    if (!rgbColor)
        return;

    var alpha = solidFill.getAlpha();

    fill.setSolidFill(
        255 - rgbColor.getRed(),
        255 - rgbColor.getGreen(),
        255 - rgbColor.getBlue(),
        alpha);
}

function changeHSL(shape, valueChange, isAbsoluteChange, hslComponent) {
    var fill = shape.getFill();
    if (fill.getType() !== SlidesApp.FillType.SOLID) // must have SOLID fill
        return;

    var solidFill = fill.getSolidFill();
    var rgbColor = resolveRgbColor(shape, solidFill.getColor());
    if (!rgbColor)
        return;

    var alpha = solidFill.getAlpha();
    var hslColorVector = convertRgbColorToHslColorVector(rgbColor);

    var baseValue = isAbsoluteChange ? 0 : hslColorVector[hslComponent];
    if (hslComponent === HSL_COMPONENT.HUE) {
        hslColorVector[hslComponent] = (((baseValue + valueChange) % 1) + 1) % 1;
    } else {
        hslColorVector[hslComponent] = clamp(baseValue + valueChange, 0, 1);
    }

    var rgbColorVector = convertHslColorVectorToRgbColorVector(hslColorVector);

    fill.setSolidFill(
        rgbColorVector[0],
        rgbColorVector[1],
        rgbColorVector[2],
        alpha
    );
}
  
var setMaxContrastToTextOnShape = function(shape) { 
    var fill = shape.getFill();
    if (fill.getType() === SlidesApp.FillType.SOLID && doesShapeHaveText(shape)) { // must have SOLID fill and some text
        var rgbColor = resolveRgbColor(shape, fill.getSolidFill().getColor());
        if (!rgbColor)
            return;

        var fillRgbVector = convertRgbColorToRgbColorVector(rgbColor);
        var blackVsFillContrast = calculateContrastRatio(fillRgbVector, [0, 0, 0]);
        var whiteVsFillContrast = calculateContrastRatio(fillRgbVector, [255, 255, 255]);
        
        if (blackVsFillContrast > whiteVsFillContrast)
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
    var fill = shape.getFill();
    if (fill.getType() === SlidesApp.FillType.SOLID && doesShapeHaveText(shape)) { // must have SOLID fill and some text
        var textRange = shape.getText();
        var runs = textRange.getRuns();
        if (!runs || runs.length === 0)
            return;

        var textColor = runs[0].getTextStyle().getForegroundColor();
        if (!textColor || textColor.getColorType() === SlidesApp.ColorType.UNSUPPORTED)
            return;

        var solidFill = fill.getSolidFill();
        var fillColor = solidFill.getColor();
        if (!fillColor || fillColor.getColorType() === SlidesApp.ColorType.UNSUPPORTED)
            return;

        var fillAlpha = solidFill.getAlpha();

        textRange.getTextStyle().setForegroundColor(fillColor);
        fill.setSolidFill(textColor, fillAlpha);
    }
}