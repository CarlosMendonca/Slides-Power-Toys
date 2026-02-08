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

// TESTS (shouldn't be accessible from production)

// TO-DO: should refactor this to make it more consistent and repeatable; will probably
//   want to test from the menu functions to maximize coverage
var URL_TO_GASTAP_LIB = 'https://raw.githubusercontent.com/zixia/gast/master/src/gas-tap-lib.js';
var URL_TO_SLIDES_DOCUMENT = 'https://docs.google.com/presentation/d/1yOnf-ng1xTD7ohRv7cBcI7GTuTnwokr-Lde5GtOvDYU/edit';

var U1 = 72;  // all unit dimensions are stored in INCHES, but commands use PIXELS as unit, so there's a loss of precision when dividing by 72
var U2 = 144;

function isBlack(rgbColor) { return rgbColor.getRed() == 0   && rgbColor.getGreen() == 0   && rgbColor.getBlue() == 0;   }
function isWhite(rgbColor) { return rgbColor.getRed() == 255 && rgbColor.getGreen() == 255 && rgbColor.getBlue() == 255; }
function isRed(rgbColor)   { return rgbColor.getRed() == 255 && rgbColor.getGreen() == 0   && rgbColor.getBlue() == 0;   }
function isGreen(rgbColor) { return rgbColor.getRed() == 0   && rgbColor.getGreen() == 255 && rgbColor.getBlue() == 0;   }

if ((typeof GasTap)==='undefined') { // GasT initialization; using Google's best practice of caching libraries
    var cs = CacheService.getScriptCache().get('gast');
    if(!cs) {
      cs = UrlFetchApp.fetch(URL_TO_GASTAP_LIB).getContentText();
      CacheService.getScriptCache().put('gast', cs, 21600);
    }
    eval(cs);
}

var test = new GasTap();

function gastTestRunner() {
    var slidesDocument = SlidesApp.openByUrl(URL_TO_SLIDES_DOCUMENT);

    test('TEST RUNNER FINDS TARGET DOCUMENT', function(t) {    
        t.ok(slidesDocument);
    });

    test('FUNCTION roundTo', function(t) {
        t.equal(roundTo(1.23, 1), 1.2);
        t.equal(roundTo(1.23, 0), 1.0);
        t.equal(roundTo(1.2 , 1), 1.2);
        t.equal(roundTo(1.23, 3), 1.23);
    });

    test('FUNCTION getSelectedElementsOnPage', function(t) {
        var testSlide1 = slidesDocument.appendSlide();

        var testShape1 = testSlide1.insertShape(SlidesApp.ShapeType.RECTANGLE, 0, 0, U1, U1); // create test shape
        var testShape2 = testSlide1.insertShape(SlidesApp.ShapeType.RECTANGLE, 0, 0, U1, U1); // create test shape

        testShape1.select();
        testShape2.select(false);

        t.equal(getSelectedElementsOnPage(false).length, 2, '[1] Two shapes selected');

        testSlide1.selectAsCurrentPage();
        t.equal(getSelectedElementsOnPage(true).length,  2, '[2] Fallback to unselected shapes on slide');
        t.equal(getSelectedElementsOnPage(false).length, 0, '[3] NO fallback to unselected shapes on slide');

        // It doesn't seem to be possible to programatically select multiple slides, so will test this manually
        /*
        var testSlide2 = slidesDocument.appendSlide();
        testSlide1.select();
        testSlide2.select(false);
        t.equal(getSelectedElementsOnPage(true).lenght,  0, '[4] DO NOT try to handle multiple selected slides');
        t.equal(getSelectedElementsOnPage(false).lenght, 0, '[5] DO NOT try to handle multiple selected slides');
        testSlide2.remove();
        */

        testSlide1.remove();
    });

    test('ADJOIN ELEMENTS', function(t) {
        var testSlide = slidesDocument.appendSlide();
        var refShape = testSlide.insertShape(SlidesApp.ShapeType.RECTANGLE, 0, 0, U1, U1); // create test shape
        var targetShape = testSlide.insertShape(SlidesApp.ShapeType.RECTANGLE, U2, U2, U2, U2); // create test shape

        var resetPositions = function() { refShape.setLeft(0); refShape.setTop(0); targetShape.setLeft(U2); targetShape.setTop(U2); };

        // First, test that elements adjoin horizontally, with centering and with padding
        adjoinTwoElements(refShape, targetShape, true, refShape, U1);

        t.equal(refShape.getLeft(), 0, '[1] Element should NOT move');
        t.equal(refShape.getTop(),  0, '[2] Element should NOT move');
        t.equal(targetShape.getLeft(),  U1*2, '[3] Element should be at X=U1 + U1 (for padding)');
        t.equal(targetShape.getTop(),  -U1/2, '[4] Element should be centered with reference');

        resetPositions();

        // Then, test that elements adjoin vertically, with centering and with padding
        adjoinTwoElements(refShape, targetShape, false, refShape, U1);

        t.equal(refShape.getLeft(), 0,     '[5] Element should NOT move');
        t.equal(refShape.getTop(),  0,     '[6] Element should NOT move');
        t.equal(targetShape.getLeft(), -U1/2, '[7] Element should be at X=U1 + U1 (for padding)');
        t.equal(targetShape.getTop(),   U1*2, '[8] Element should be centered with reference');

        resetPositions();

        // Then, test that elements adjoin horizontally correctly, without centering and without padding
        adjoinTwoElements(refShape, targetShape, true, null, 0);

        t.equal(targetShape.getLeft(), U1, '[9] Element should be at X=U1 + 0 (for padding)');
        t.equal(targetShape.getTop(),  U2, '[10] Element should NOT move');

        testSlide.remove();
    });

    test('FLIP ELEMENTS', function(t) {
        var testSlide = slidesDocument.appendSlide();
        var testShape1 = testSlide.insertShape(SlidesApp.ShapeType.RECTANGLE, 0, 0, U1, U1); // create test shape
        var testShape2 = testSlide.insertShape(SlidesApp.ShapeType.RECTANGLE, U2, U2, U1, U1); // create test shape

        var resetPositions = function() { testShape1.setLeft(0); testShape1.setTop(0); testShape2.setLeft(U2); testShape2.setTop(U2); };

        // First, test that elements don't move
        flipTwoElements(testShape1, testShape2, false, false);

        t.equal(testShape1.getLeft(), 0,  'Element should NOT move');
        t.equal(testShape1.getTop(), 0,   'Element should NOT move'); 
        t.equal(testShape2.getLeft(), U2, 'Element should NOT move');
        t.equal(testShape2.getTop(), U2,  'Element should NOT move'); 

        resetPositions();

        // Then test that elements only move horizontally
        flipTwoElements(testShape1, testShape2, true, false);

        t.equal(testShape1.getLeft(), U2, 'Element should move');
        t.equal(testShape1.getTop(), 0,   'Element should NOT move'); 
        t.equal(testShape2.getLeft(), 0,  'Element should move');
        t.equal(testShape2.getTop(), U2,  'Element should NOT move');        
        
        resetPositions();

        // Then test that elements only move vertically
        flipTwoElements(testShape1, testShape2, false, true);

        t.equal(testShape1.getLeft(), 0,  'Element should NOT move');
        t.equal(testShape1.getTop(), U2,  'Element should move'); 
        t.equal(testShape2.getLeft(), U2, 'Element should NOT move');
        t.equal(testShape2.getTop(), 0,   'Element should move'); 
        
        resetPositions();

        // Then test that elements only move on both directions
        flipTwoElements(testShape1, testShape2, true, true);

        t.equal(testShape1.getLeft(), U2, 'Element should move');
        t.equal(testShape1.getTop(), U2,  'Element should move'); 
        t.equal(testShape2.getLeft(), 0,  'Element should move');
        t.equal(testShape2.getTop(), 0,   'Element should move'); 
        
        testSlide.remove();
    });

    test('ALIGN TO INNER BORDERS', function(t) {
        // === SETUP ===
        var testSlide = slidesDocument.appendSlide();
        var anchorShape = testSlide.insertShape(SlidesApp.ShapeType.RECTANGLE, 0, 0, U1, U1); // create the anchor shape
        var testShape1 = testSlide.insertShape(SlidesApp.ShapeType.RECTANGLE, U1, U1, U1, U1); // create test shape
        var testShape2 = testSlide.insertShape(SlidesApp.ShapeType.RECTANGLE, U2, U2, U1, U1); // create test shape

        // === TEST ===
        testShape1.select(); // selecting elements in the correct order
        testShape2.select(false);
        anchorShape.select(false);

        menuAlignToInnerLeft();

        t.equal(anchorShape.getTop(), 0, 'Anchor shape didn\'t move');
        t.equal(anchorShape.getLeft(), 0, 'Anchor shape didn\'t move');

        t.equal(testShape1.getTop(), U1, 'Test shape 1 didn\'t move vertically');
        t.equal(testShape1.getLeft(), 0, 'Test shape 1 got horizontally aligned to anchor shape');

        t.equal(testShape2.getTop(), U2, 'Test shape 2 didn\'t move vertically');
        t.equal(testShape2.getLeft(), 0, 'Test shape 2 got horizontally aligned to anchor shape');

        testShape1.select();
        testShape2.select(false);
        anchorShape.select(false);

        menuAlignToOuterRight();

        t.equal(anchorShape.getTop(), 0, 'Anchor shape didn\'t move');
        t.equal(anchorShape.getLeft(), 0, 'Anchor shape didn\'t move');

        t.equal(testShape1.getTop(), U1, 'Test shape 1 didn\'t move vertically');
        t.equal(testShape1.getLeft(), U1, 'Test shape 1 got horizontally aligned to anchor shape');

        t.equal(testShape2.getTop(), U2, 'Test shape 2 didn\'t move vertically');
        t.equal(testShape2.getLeft(), U1, 'Test shape 2 got horizontally aligned to anchor shape');

        // === TEAR DOWN ===
        testSlide.remove(); // this is a lousy tear down because it's not guaranteed to execute, but I'm too lazy and too bad at JS to improve this now
    });

    test('CENTER ON PAGE', function(t) {
        var testSlide = slidesDocument.appendSlide();
        var testShape1 = testSlide.insertShape(SlidesApp.ShapeType.RECTANGLE, 0, 0, U1, U1); // create test shape
        var testShape2 = testSlide.insertShape(SlidesApp.ShapeType.RECTANGLE, U2, U2, U2, U2); // create test shape

        var center_x = slidesDocument.getPageWidth()  / 2;
        var center_y = slidesDocument.getPageHeight() / 2;

        testShape1.select();
        testShape2.select(false);

        menuCenterOnPage();

        t.equal(testShape1.getLeft() + U1/2, center_x, '[1] Shape is at horizontal center');
        t.equal(testShape1.getTop()  + U1/2, center_y, '[2] Shape is at vertical center');

        t.equal(testShape2.getLeft() + U2/2, center_x, '[3] Shape is at horizontal center');
        t.equal(testShape2.getTop()  + U2/2, center_y, '[4] Shape is at vertical center');

        testSlide.remove();
    });

    test('from ISSUE #5: invert colors of a shape', function(t) {
        var testSlide = slidesDocument.appendSlide();
        var testShape1 = testSlide.insertShape(SlidesApp.ShapeType.RECTANGLE, 0, 0, U1, U1); // create test shape
        var testShape2 = testSlide.insertShape(SlidesApp.ShapeType.RECTANGLE, U2, U2, U1, U1); // create test shape

        testShape1.getFill().setSolidFill(SlidesApp.ThemeColorType.ACCENT1); // set background to ACCENT1
        testShape2.getFill().setSolidFill(255, 255, 255); // set background to WHITE

        testShape1.select();
        testShape2.select(false);

        menuSetColorInverse();

        // This is a fragile test, because it will fail if the default theme of the new slide changes. Keep that in mind.
        var invertedColorOnShape1 = testShape1.getFill().getSolidFill().getColor().asRgbColor();
        t.equal(invertedColorOnShape1.getRed(),   255 - 255);
        t.equal(invertedColorOnShape1.getGreen(), 255 - 171);
        t.equal(invertedColorOnShape1.getBlue(),  255 - 64);

        var invertedColorOnShape2 = testShape2.getFill().getSolidFill().getColor().asRgbColor();
        t.equal(invertedColorOnShape2.getRed(),   0);
        t.equal(invertedColorOnShape2.getGreen(), 0);
        t.equal(invertedColorOnShape2.getBlue(),  0);

        testSlide.remove();
    });

    test('from ISSUE #11: adjoin elements', function(t) {
        var testSlide = slidesDocument.appendSlide();
        var referenceShape = testSlide.insertShape(SlidesApp.ShapeType.RECTANGLE,  0,  0, U1, U1); // create test shape
        var testShape1     = testSlide.insertShape(SlidesApp.ShapeType.RECTANGLE,  0, U2, U2, U2); // create test shape
        var testShape2     = testSlide.insertShape(SlidesApp.ShapeType.RECTANGLE, U2, U2, U1, U1); // create test shape

        testShape1.select();
        testShape2.select(false);
        referenceShape.select(false);

        menuAdjoinH();

        t.equal(referenceShape.getLeft(), 0, '[1] Reference shape didn\'t move');
        t.equal(referenceShape.getTop(),  0, '[2] Reference shape didn\'t move');

        t.equal(testShape1.getLeft(),    U1, '[1] First shape from left-to-right is now next to ref shape');
        t.equal(testShape1.getTop(),  -U1/2, '[1] First shape from left-to-right is horizontally centered relative ref shape');

        t.equal(testShape2.getLeft(), U1+U2, '[1] Second shape from left-to-right is now next to first shape');
        t.equal(testShape2.getTop(),      0, '[1] Second shape from left-to-right is horizontally centered relative ref shape');

        testSlide.remove();
    });

    test('from ISSUE #13: set text color to max contrast', function(t) {
        var testSlide = slidesDocument.appendSlide();
        var testShape1 = testSlide.insertShape(SlidesApp.ShapeType.RECTANGLE, U1*0, U1*0, U1, U1); // create test shape
        var testShape2 = testSlide.insertShape(SlidesApp.ShapeType.RECTANGLE, U1*1, U1*1, U1, U1); // create test shape
        var testShape3 = testSlide.insertShape(SlidesApp.ShapeType.RECTANGLE, U1*2, U1*2, U1, U1); // create test shape
        var testShape4 = testSlide.insertShape(SlidesApp.ShapeType.RECTANGLE, U1*3, U1*3, U1, U1); // create test shape
    
        testShape1.getFill().setSolidFill(SlidesApp.ThemeColorType.ACCENT1); // set background to ACCENT1
        testShape2.getFill().setSolidFill(255, 255, 255); // set background to WHITE
        testShape3.getFill().setSolidFill(0, 0, 0); // set background to BLACK
        testShape4.getFill().setTransparent(); // set background to TRANSPARENT 
    
        testShape1.getText().setText('abc');
        testShape2.getText().setText('abc');
        testShape3.getText().setText('abc');
        testShape4.getText().setText('abc');
        testShape4.getText().getTextStyle().setForegroundColor(255, 0, 0); // set text foreground to RED and see that it stays unchanged
    
        testShape1.select();
        testShape2.select(false);
        testShape3.select(false);
        testShape4.select(false);
    
        // This is a fragile test, because it will fail if the default theme of the new slide changes. Keep that in mind.
        menuSetColorMaxContrast();

        t.ok(isBlack(testShape1.getText().getTextStyle().getForegroundColor().asRgbColor()));
        t.ok(isBlack(testShape2.getText().getTextStyle().getForegroundColor().asRgbColor()));
        t.ok(isWhite(testShape3.getText().getTextStyle().getForegroundColor().asRgbColor()));
        t.ok(isRed  (testShape4.getText().getTextStyle().getForegroundColor().asRgbColor()));
        
        testSlide.remove();
    });

    test('from ISSUE #17: set text color to max contrast should implement WCAG 2.0 rules', function(t) {
        var testSlide = slidesDocument.appendSlide();
        var testShape1 = testSlide.insertShape(SlidesApp.ShapeType.RECTANGLE, U1*0, U1*0, U1, U1); // create test shape
        var testShape2 = testSlide.insertShape(SlidesApp.ShapeType.RECTANGLE, U1*1, U1*1, U1, U1); // create test shape
        var testShape3 = testSlide.insertShape(SlidesApp.ShapeType.RECTANGLE, U1*2, U1*2, U1, U1); // create test shape
        var testShape4 = testSlide.insertShape(SlidesApp.ShapeType.RECTANGLE, U1*3, U1*3, U1, U1); // create test shape
    
        testShape1.getFill().setSolidFill(0, 0, 0); // set background to BLACK
        testShape2.getFill().setSolidFill(255, 255, 255); // set background to WHITE
        testShape3.getFill().setSolidFill(0, 0, 255); // set background to BLUE
        testShape4.getFill().setSolidFill(127, 127, 127); // set background to GRAY
        
        var shapeArray = [testShape1, testShape2, testShape3, testShape4];
      
        shapeArray.forEach(function(e) { e.getText().setText('abc'); });        
        shapeArray.forEach(function(e) { e.getText().getTextStyle().setForegroundColor(255, 0, 0); }); // set text to red
        shapeArray.forEach(function(e) { setMaxContrastToTextOnShape(e); });

        t.ok(isWhite(testShape1.getText().getTextStyle().getForegroundColor().asRgbColor()));
        t.ok(isBlack(testShape2.getText().getTextStyle().getForegroundColor().asRgbColor()));
        t.ok(isWhite(testShape3.getText().getTextStyle().getForegroundColor().asRgbColor()));
        t.ok(isBlack(testShape4.getText().getTextStyle().getForegroundColor().asRgbColor()));

        testSlide.remove();
    });

    test('from ISSUE #17: calculate relative luminosity', function(t) {
        t.equal(calculateRelativeLuminosity([255,255,255], [255,  0,  0]), 3.9984767707539985);
        t.equal(calculateRelativeLuminosity([  0,  0,  0], [255,  0,  0]), 5.252);

        t.equal(calculateRelativeLuminosity([255,255,255], [  0,255,  0]), 1.3721902770517513);
        t.equal(calculateRelativeLuminosity([  0,  0,  0], [  0,255,  0]), 15.303999999999998);

        t.equal(calculateRelativeLuminosity([255,255,255], [  0,  0,255]), 8.592471358428805);
        t.equal(calculateRelativeLuminosity([  0,  0,  0], [  0,  0,255]), 2.444);

        t.equal(calculateRelativeLuminosity([255,255,255], [127,127,127]), 4.0041069566148515);
        t.equal(calculateRelativeLuminosity([  0,  0,  0], [127,127,127]), 5.244615148281104);
    });

    test('from ISSUE #10: color commands not working on element groups', function(t) {
        var testSlide = slidesDocument.appendSlide();
        var testShape1 = testSlide.insertShape(SlidesApp.ShapeType.RECTANGLE, U1 * 0, U1 * 0, U1, U1); // create test shape
        var testShape2 = testSlide.insertShape(SlidesApp.ShapeType.RECTANGLE, U1 * 1, U1 * 1, U1, U1); // create test shape
        var testShape3 = testSlide.insertShape(SlidesApp.ShapeType.RECTANGLE, U1 * 2, U1 * 2, U1, U1); // create test shape
        var testShape4 = testSlide.insertShape(SlidesApp.ShapeType.RECTANGLE, U1 * 3, U1 * 3, U1, U1); // create test shape
        var testShape5 = testSlide.insertShape(SlidesApp.ShapeType.RECTANGLE, U1 * 4, U1 * 4, U1, U1); // create test shape
        var testShape6 = testSlide.insertShape(SlidesApp.ShapeType.RECTANGLE, U1 * 5, U1 * 5, U1, U1); // create test shape

        testShape1.getFill().setSolidFill(0, 255, 0); // green
        testShape2.getFill().setSolidFill(0, 255, 0); // green
        testShape3.getFill().setSolidFill(0, 255, 0); // green
        testShape4.getFill().setSolidFill(0, 255, 0); // green
        testShape5.getFill().setSolidFill(0, 255, 0); // green
        testShape6.getFill().setSolidFill(0, 255, 0); // green

        var shapeArray1 = [testShape1, testShape2];
        var shapeArray2 = [testShape3, testShape4];

        var group1 = testSlide.group(shapeArray1);
        var group2 = testSlide.group(shapeArray2);

        group1.select();

        // It's currently not possible to programatically select an individual shape inside of a group
        /*
        group2.select(false);
        testShape3.select(false);
        */

        testShape5.select(false);

        menuSetColorHue0(); // red (255, 0, 0)

        // Test that both shapes on group changed their background color to red (hue = 0)
        t.ok(isRed(testShape1.getFill().getSolidFill().getColor().asRgbColor())); // it's okay to assume the color is a RgbColor here, because that's what we used on the test setup (instead of ThemeColor)
        t.ok(isRed(testShape2.getFill().getSolidFill().getColor().asRgbColor()));

        /*
        t.ok(isRed(testShape3.getFill().getSolidFill().getColor().asRgbColor())); // not tested because of the problem above
        */
        t.ok(isGreen(testShape4.getFill().getSolidFill().getColor().asRgbColor())); // not selected, so it shouldn't change color

        t.ok(isRed(testShape5.getFill().getSolidFill().getColor().asRgbColor()));
        t.ok(isGreen(testShape6.getFill().getSolidFill().getColor().asRgbColor())); // not selected, so it shouldn't change color

        testSlide.remove();
    });

    test.finish();
}

function debugPrompt(message) {
    SlidesApp.getUi().alert("Test Debug", message, SlidesApp.getUi().ButtonSet.OK);
  }