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

// INTEGRATION TESTS (deployed only via `./deploy.sh test`; excluded from release)

var U1 = 72;  // 1 inch in points
var U2 = 144; // 2 inches in points

function isBlack(rgbColor) { return rgbColor.getRed() === 0   && rgbColor.getGreen() === 0   && rgbColor.getBlue() === 0;   }
function isWhite(rgbColor) { return rgbColor.getRed() === 255 && rgbColor.getGreen() === 255 && rgbColor.getBlue() === 255; }
function isRed(rgbColor)   { return rgbColor.getRed() === 255 && rgbColor.getGreen() === 0   && rgbColor.getBlue() === 0;   }
function isGreen(rgbColor) { return rgbColor.getRed() === 0   && rgbColor.getGreen() === 255 && rgbColor.getBlue() === 0;   }

/**
 * Self-contained TAP test runner (replaces remote UrlFetchApp + eval of GasT).
 */
function createTapRunner() {
  var total = 0;
  var passed = 0;
  var failed = 0;
  var lines = ['TAP version 13'];

  function record(isPass, message, details) {
    total += 1;
    if (isPass) {
      passed += 1;
      lines.push('ok ' + total + ' - ' + (message || '(unnamed assertion)'));
    } else {
      failed += 1;
      lines.push('not ok ' + total + ' - ' + (message || '(unnamed assertion)'));
      if (details) {
        lines.push('  # ' + details);
      }
    }
  }

  function test(suiteName, fn) {
    lines.push('# ' + suiteName);
    var t = {
      ok: function(value, msg) {
        record(Boolean(value), msg || suiteName, value ? '' : 'expected truthy, got ' + value);
      },
      notOk: function(value, msg) {
        record(!value, msg || suiteName, !value ? '' : 'expected falsy, got ' + value);
      },
      equal: function(actual, expected, msg) {
        var pass = actual === expected;
        record(pass, msg || suiteName, pass ? '' : 'expected ' + expected + ', got ' + actual);
      },
      approxEqual: function(actual, expected, epsilon, msg) {
        var tol = typeof epsilon === 'number' ? epsilon : 1e-4;
        var pass = Math.abs(actual - expected) <= tol;
        record(pass, msg || suiteName, pass ? '' : 'expected ' + expected + ' (±' + tol + '), got ' + actual);
      }
    };

    try {
      fn(t);
    } catch (err) {
      record(false, suiteName + ' threw unexpected error', String(err && err.stack ? err.stack : err));
    }
  }

  test.finish = function() {
    lines.push('1..' + total);
    lines.push('# tests ' + total);
    lines.push('# pass  ' + passed);
    lines.push('# fail  ' + failed);
    Logger.log(lines.join('\n'));
    return { total: total, passed: passed, failed: failed, output: lines.join('\n') };
  };

  return test;
}

/**
 * Resolves the target test presentation:
 * 1. Script Property `TEST_SLIDES_URL` (or `TEST_SLIDES_ID`) if configured.
 * 2. Otherwise `SlidesApp.getActivePresentation()` (works for container-bound test scripts).
 */
function getTestSlidesDocument() {
  var props = typeof PropertiesService !== 'undefined'
    ? PropertiesService.getScriptProperties()
    : null;

  if (props) {
    var url = props.getProperty('TEST_SLIDES_URL');
    if (url) return SlidesApp.openByUrl(url);

    var id = props.getProperty('TEST_SLIDES_ID');
    if (id) return SlidesApp.openById(id);
  }

  var active = SlidesApp.getActivePresentation();
  if (active) return active;

  throw new Error(
    'No target test presentation found. Bind this script to a test Slides deck ' +
    'or set Script Property TEST_SLIDES_URL / TEST_SLIDES_ID.'
  );
}

/**
 * Creates a temporary slide and guarantees removal even if assertions throw.
 */
function withTestSlide(slidesDocument, testFn) {
  var testSlide = slidesDocument.appendSlide();
  try {
    testFn(testSlide);
  } finally {
    testSlide.remove();
  }
}

function gastTestRunner() {
  var test = createTapRunner();
  var slidesDocument = getTestSlidesDocument();

  test('TEST RUNNER FINDS TARGET DOCUMENT', function(t) {
    t.ok(slidesDocument, 'Target presentation opened');
  });

  test('FUNCTION roundTo', function(t) {
    t.equal(roundTo(1.23, 1), 1.2);
    t.equal(roundTo(1.23, 0), 1.0);
    t.equal(roundTo(1.2, 1), 1.2);
    t.equal(roundTo(1.23, 3), 1.23);
  });

  test('FUNCTION getSelectedElementsOnPage', function(t) {
    withTestSlide(slidesDocument, function(testSlide1) {
      var testShape1 = testSlide1.insertShape(SlidesApp.ShapeType.RECTANGLE, 0, 0, U1, U1);
      var testShape2 = testSlide1.insertShape(SlidesApp.ShapeType.RECTANGLE, 0, 0, U1, U1);

      testShape1.select();
      testShape2.select(false);

      t.equal(getSelectedElementsOnPage(false).length, 2, '[1] Two shapes selected');

      testSlide1.selectAsCurrentPage();
      t.equal(getSelectedElementsOnPage(true).length, 2, '[2] Fallback to unselected shapes on slide');
      t.equal(getSelectedElementsOnPage(false).length, 0, '[3] NO fallback to unselected shapes on slide');
    });
  });

  test('PRECISION SNAP', function(t) {
    withTestSlide(slidesDocument, function(testSlide) {
      var shape = testSlide.insertShape(
        SlidesApp.ShapeType.RECTANGLE,
        1.24 * U1,
        2.36 * U1,
        3.14 * U1,
        4.56 * U1
      );
      shape.setRotation(12.6);
      shape.select();

      menuSnapPosition();
      t.approxEqual(shape.getLeft(), 1.2 * U1, 0.1, 'Position X snapped to 1.2 in');
      t.approxEqual(shape.getTop(), 2.4 * U1, 0.1, 'Position Y snapped to 2.4 in');

      menuSnapDimension();
      t.approxEqual(shape.getWidth(), 3.1 * U1, 0.1, 'Width snapped to 3.1 in');
      t.approxEqual(shape.getHeight(), 4.6 * U1, 0.1, 'Height snapped to 4.6 in');

      menuSnapRotation();
      t.approxEqual(shape.getRotation(), 13, 0.01, 'Rotation snapped to nearest degree');

      menuZeroRotation();
      t.approxEqual(shape.getRotation(), 0, 0.01, 'Rotation straightened to 0');
    });
  });

  test('COPY ATTRIBUTES', function(t) {
    withTestSlide(slidesDocument, function(testSlide) {
      var target = testSlide.insertShape(SlidesApp.ShapeType.RECTANGLE, 0, 0, U1, U1);
      var reference = testSlide.insertShape(SlidesApp.ShapeType.RECTANGLE, U2, U2, U2, U1 * 3);
      reference.setRotation(45);

      target.select();
      reference.select(false);
      menuCopyWidthAndHeight();

      t.approxEqual(target.getWidth(), U2, 0.1, 'Copied width');
      t.approxEqual(target.getHeight(), U1 * 3, 0.1, 'Copied height');

      target.select();
      reference.select(false);
      menuCopyRotation();

      t.approxEqual(target.getRotation(), 45, 0.01, 'Copied rotation');
    });
  });

  test('ADJOIN ELEMENTS', function(t) {
    withTestSlide(slidesDocument, function(testSlide) {
      var refShape = testSlide.insertShape(SlidesApp.ShapeType.RECTANGLE, 0, 0, U1, U1);
      var targetShape = testSlide.insertShape(SlidesApp.ShapeType.RECTANGLE, U2, U2, U2, U2);

      var resetPositions = function() {
        refShape.setLeft(0);
        refShape.setTop(0);
        targetShape.setLeft(U2);
        targetShape.setTop(U2);
      };

      // Horizontal with centering and padding
      adjoinTwoElements(refShape, targetShape, true, refShape, U1);
      t.equal(refShape.getLeft(), 0, '[1] Reference should NOT move');
      t.equal(refShape.getTop(), 0, '[2] Reference should NOT move');
      t.equal(targetShape.getLeft(), U1 * 2, '[3] Target X = U1 + U1 padding');
      t.equal(targetShape.getTop(), -U1 / 2, '[4] Target vertically centered with reference');

      resetPositions();

      // Vertical with centering and padding
      adjoinTwoElements(refShape, targetShape, false, refShape, U1);
      t.equal(refShape.getLeft(), 0, '[5] Reference should NOT move');
      t.equal(refShape.getTop(), 0, '[6] Reference should NOT move');
      t.equal(targetShape.getLeft(), -U1 / 2, '[7] Target horizontally centered with reference');
      t.equal(targetShape.getTop(), U1 * 2, '[8] Target Y = U1 + U1 padding');

      resetPositions();

      // Horizontal without centering and without padding
      adjoinTwoElements(refShape, targetShape, true, null, 0);
      t.equal(targetShape.getLeft(), U1, '[9] Target X = U1 + 0 padding');
      t.equal(targetShape.getTop(), U2, '[10] Target Y should NOT move');
    });
  });

  test('FLIP ELEMENTS', function(t) {
    withTestSlide(slidesDocument, function(testSlide) {
      var testShape1 = testSlide.insertShape(SlidesApp.ShapeType.RECTANGLE, 0, 0, U1, U1);
      var testShape2 = testSlide.insertShape(SlidesApp.ShapeType.RECTANGLE, U2, U2, U1, U1);

      var resetPositions = function() {
        testShape1.setLeft(0);
        testShape1.setTop(0);
        testShape2.setLeft(U2);
        testShape2.setTop(U2);
      };

      flipTwoElements(testShape1, testShape2, false, false);
      t.equal(testShape1.getLeft(), 0, 'No-op flip keeps shape1 X');
      t.equal(testShape1.getTop(), 0, 'No-op flip keeps shape1 Y');
      t.equal(testShape2.getLeft(), U2, 'No-op flip keeps shape2 X');
      t.equal(testShape2.getTop(), U2, 'No-op flip keeps shape2 Y');

      resetPositions();

      flipTwoElements(testShape1, testShape2, true, false);
      t.equal(testShape1.getLeft(), U2, 'H-flip swaps shape1 X');
      t.equal(testShape1.getTop(), 0, 'H-flip keeps shape1 Y');
      t.equal(testShape2.getLeft(), 0, 'H-flip swaps shape2 X');
      t.equal(testShape2.getTop(), U2, 'H-flip keeps shape2 Y');

      resetPositions();

      flipTwoElements(testShape1, testShape2, false, true);
      t.equal(testShape1.getLeft(), 0, 'V-flip keeps shape1 X');
      t.equal(testShape1.getTop(), U2, 'V-flip swaps shape1 Y');
      t.equal(testShape2.getLeft(), U2, 'V-flip keeps shape2 X');
      t.equal(testShape2.getTop(), 0, 'V-flip swaps shape2 Y');

      resetPositions();

      flipTwoElements(testShape1, testShape2, true, true);
      t.equal(testShape1.getLeft(), U2, 'HV-flip swaps shape1 X');
      t.equal(testShape1.getTop(), U2, 'HV-flip swaps shape1 Y');
      t.equal(testShape2.getLeft(), 0, 'HV-flip swaps shape2 X');
      t.equal(testShape2.getTop(), 0, 'HV-flip swaps shape2 Y');
    });
  });

  test('ALIGN TO INNER AND OUTER BORDERS', function(t) {
    withTestSlide(slidesDocument, function(testSlide) {
      var anchorShape = testSlide.insertShape(SlidesApp.ShapeType.RECTANGLE, 0, 0, U1, U1);
      var testShape1 = testSlide.insertShape(SlidesApp.ShapeType.RECTANGLE, U1, U1, U1, U1);
      var testShape2 = testSlide.insertShape(SlidesApp.ShapeType.RECTANGLE, U2, U2, U1, U1);

      testShape1.select();
      testShape2.select(false);
      anchorShape.select(false);

      menuAlignToInnerLeft();

      t.equal(anchorShape.getTop(), 0, 'Anchor Y unchanged');
      t.equal(anchorShape.getLeft(), 0, 'Anchor X unchanged');
      t.equal(testShape1.getTop(), U1, 'Shape 1 Y unchanged');
      t.equal(testShape1.getLeft(), 0, 'Shape 1 aligned to inner left');
      t.equal(testShape2.getTop(), U2, 'Shape 2 Y unchanged');
      t.equal(testShape2.getLeft(), 0, 'Shape 2 aligned to inner left');

      testShape1.select();
      testShape2.select(false);
      anchorShape.select(false);

      menuAlignToOuterRight();

      t.equal(anchorShape.getTop(), 0, 'Anchor Y unchanged');
      t.equal(anchorShape.getLeft(), 0, 'Anchor X unchanged');
      t.equal(testShape1.getTop(), U1, 'Shape 1 Y unchanged');
      t.equal(testShape1.getLeft(), U1, 'Shape 1 aligned to outer right');
      t.equal(testShape2.getTop(), U2, 'Shape 2 Y unchanged');
      t.equal(testShape2.getLeft(), U1, 'Shape 2 aligned to outer right');
    });
  });

  test('CENTER ON PAGE', function(t) {
    withTestSlide(slidesDocument, function(testSlide) {
      var testShape1 = testSlide.insertShape(SlidesApp.ShapeType.RECTANGLE, 0, 0, U1, U1);
      var testShape2 = testSlide.insertShape(SlidesApp.ShapeType.RECTANGLE, U2, U2, U2, U2);

      var centerX = slidesDocument.getPageWidth() / 2;
      var centerY = slidesDocument.getPageHeight() / 2;

      testShape1.select();
      testShape2.select(false);

      menuCenterOnPage();

      t.equal(testShape1.getLeft() + U1 / 2, centerX, '[1] Shape 1 horizontally centered');
      t.equal(testShape1.getTop() + U1 / 2, centerY, '[2] Shape 1 vertically centered');
      t.equal(testShape2.getLeft() + U2 / 2, centerX, '[3] Shape 2 horizontally centered');
      t.equal(testShape2.getTop() + U2 / 2, centerY, '[4] Shape 2 vertically centered');
    });
  });

  test('from ISSUE #5: invert colors of a shape', function(t) {
    withTestSlide(slidesDocument, function(testSlide) {
      var testShape1 = testSlide.insertShape(SlidesApp.ShapeType.RECTANGLE, 0, 0, U1, U1);
      var testShape2 = testSlide.insertShape(SlidesApp.ShapeType.RECTANGLE, U2, U2, U1, U1);

      testShape1.getFill().setSolidFill(SlidesApp.ThemeColorType.ACCENT1);
      testShape2.getFill().setSolidFill(255, 255, 255);

      var accent1Rgb = testSlide.getColorScheme()
        .getConcreteColor(SlidesApp.ThemeColorType.ACCENT1)
        .asRgbColor();

      testShape1.select();
      testShape2.select(false);

      menuSetColorInverse();

      var invertedColorOnShape1 = testShape1.getFill().getSolidFill().getColor().asRgbColor();
      t.equal(invertedColorOnShape1.getRed(), 255 - accent1Rgb.getRed(), 'Inverted ACCENT1 R');
      t.equal(invertedColorOnShape1.getGreen(), 255 - accent1Rgb.getGreen(), 'Inverted ACCENT1 G');
      t.equal(invertedColorOnShape1.getBlue(), 255 - accent1Rgb.getBlue(), 'Inverted ACCENT1 B');

      var invertedColorOnShape2 = testShape2.getFill().getSolidFill().getColor().asRgbColor();
      t.equal(invertedColorOnShape2.getRed(), 0, 'Inverted white R');
      t.equal(invertedColorOnShape2.getGreen(), 0, 'Inverted white G');
      t.equal(invertedColorOnShape2.getBlue(), 0, 'Inverted white B');
    });
  });

  test('from ISSUE #11: adjoin elements', function(t) {
    withTestSlide(slidesDocument, function(testSlide) {
      var referenceShape = testSlide.insertShape(SlidesApp.ShapeType.RECTANGLE, 0, 0, U1, U1);
      var testShape1 = testSlide.insertShape(SlidesApp.ShapeType.RECTANGLE, 0, U2, U2, U2);
      var testShape2 = testSlide.insertShape(SlidesApp.ShapeType.RECTANGLE, U2, U2, U1, U1);

      testShape1.select();
      testShape2.select(false);
      referenceShape.select(false);

      menuAdjoinH();

      t.equal(referenceShape.getLeft(), 0, '[1] Reference shape X unchanged');
      t.equal(referenceShape.getTop(), 0, '[2] Reference shape Y unchanged');
      t.equal(testShape1.getLeft(), U1, '[3] First shape adjoined to reference');
      t.equal(testShape1.getTop(), -U1 / 2, '[4] First shape vertically centered on reference');
      t.equal(testShape2.getLeft(), U1 + U2, '[5] Second shape adjoined to first');
      t.equal(testShape2.getTop(), 0, '[6] Second shape vertically centered on reference');
    });
  });

  test('from ISSUE #13: set text color to max contrast', function(t) {
    withTestSlide(slidesDocument, function(testSlide) {
      var testShape1 = testSlide.insertShape(SlidesApp.ShapeType.RECTANGLE, U1 * 0, U1 * 0, U1, U1);
      var testShape2 = testSlide.insertShape(SlidesApp.ShapeType.RECTANGLE, U1 * 1, U1 * 1, U1, U1);
      var testShape3 = testSlide.insertShape(SlidesApp.ShapeType.RECTANGLE, U1 * 2, U1 * 2, U1, U1);
      var testShape4 = testSlide.insertShape(SlidesApp.ShapeType.RECTANGLE, U1 * 3, U1 * 3, U1, U1);

      testShape1.getFill().setSolidFill(SlidesApp.ThemeColorType.ACCENT1);
      testShape2.getFill().setSolidFill(255, 255, 255);
      testShape3.getFill().setSolidFill(0, 0, 0);
      testShape4.getFill().setTransparent();

      testShape1.getText().setText('abc');
      testShape2.getText().setText('abc');
      testShape3.getText().setText('abc');
      testShape4.getText().setText('abc');
      testShape4.getText().getTextStyle().setForegroundColor(255, 0, 0);

      var accent1Rgb = testSlide.getColorScheme()
        .getConcreteColor(SlidesApp.ThemeColorType.ACCENT1)
        .asRgbColor();
      var accentVec = [accent1Rgb.getRed(), accent1Rgb.getGreen(), accent1Rgb.getBlue()];
      var expectBlackOnAccent =
        calculateRelativeLuminosity(accentVec, [0, 0, 0]) >
        calculateRelativeLuminosity(accentVec, [255, 255, 255]);

      testShape1.select();
      testShape2.select(false);
      testShape3.select(false);
      testShape4.select(false);

      menuSetColorMaxContrast();

      var fg1 = testShape1.getText().getTextStyle().getForegroundColor().asRgbColor();
      t.ok(expectBlackOnAccent ? isBlack(fg1) : isWhite(fg1), 'ACCENT1 uses max-contrast foreground');
      t.ok(isBlack(testShape2.getText().getTextStyle().getForegroundColor().asRgbColor()), 'White bg -> black text');
      t.ok(isWhite(testShape3.getText().getTextStyle().getForegroundColor().asRgbColor()), 'Black bg -> white text');
      t.ok(isRed(testShape4.getText().getTextStyle().getForegroundColor().asRgbColor()), 'Transparent bg unchanged');
    });
  });

  test('from ISSUE #17: set text color to max contrast implements WCAG rules', function(t) {
    withTestSlide(slidesDocument, function(testSlide) {
      var testShape1 = testSlide.insertShape(SlidesApp.ShapeType.RECTANGLE, U1 * 0, U1 * 0, U1, U1);
      var testShape2 = testSlide.insertShape(SlidesApp.ShapeType.RECTANGLE, U1 * 1, U1 * 1, U1, U1);
      var testShape3 = testSlide.insertShape(SlidesApp.ShapeType.RECTANGLE, U1 * 2, U1 * 2, U1, U1);
      var testShape4 = testSlide.insertShape(SlidesApp.ShapeType.RECTANGLE, U1 * 3, U1 * 3, U1, U1);

      testShape1.getFill().setSolidFill(0, 0, 0);
      testShape2.getFill().setSolidFill(255, 255, 255);
      testShape3.getFill().setSolidFill(0, 0, 255);
      testShape4.getFill().setSolidFill(127, 127, 127);

      var shapeArray = [testShape1, testShape2, testShape3, testShape4];
      shapeArray.forEach(function(e) { e.getText().setText('abc'); });
      shapeArray.forEach(function(e) { e.getText().getTextStyle().setForegroundColor(255, 0, 0); });
      shapeArray.forEach(function(e) { setMaxContrastToTextOnShape(e); });

      t.ok(isWhite(testShape1.getText().getTextStyle().getForegroundColor().asRgbColor()), 'Black -> white');
      t.ok(isBlack(testShape2.getText().getTextStyle().getForegroundColor().asRgbColor()), 'White -> black');
      t.ok(isWhite(testShape3.getText().getTextStyle().getForegroundColor().asRgbColor()), 'Blue -> white');
      t.ok(isBlack(testShape4.getText().getTextStyle().getForegroundColor().asRgbColor()), 'Gray -> black');
    });
  });

  test('from ISSUE #17: calculate relative luminosity', function(t) {
    t.approxEqual(calculateRelativeLuminosity([255, 255, 255], [255, 0, 0]), 3.9985, 0.001);
    t.approxEqual(calculateRelativeLuminosity([0, 0, 0], [255, 0, 0]), 5.252, 0.001);
    t.approxEqual(calculateRelativeLuminosity([255, 255, 255], [0, 255, 0]), 1.3722, 0.001);
    t.approxEqual(calculateRelativeLuminosity([0, 0, 0], [0, 255, 0]), 15.304, 0.001);
    t.approxEqual(calculateRelativeLuminosity([255, 255, 255], [0, 0, 255]), 8.5925, 0.001);
    t.approxEqual(calculateRelativeLuminosity([0, 0, 0], [0, 0, 255]), 2.444, 0.001);
    t.approxEqual(calculateRelativeLuminosity([255, 255, 255], [127, 127, 127]), 4.0041, 0.001);
    t.approxEqual(calculateRelativeLuminosity([0, 0, 0], [127, 127, 127]), 5.2446, 0.001);
  });

  test('SET TRANSPARENCY AND SWAP COLORS (PRESERVING ALPHA & MULTI-RUN)', function(t) {
    withTestSlide(slidesDocument, function(testSlide) {
      var shape = testSlide.insertShape(SlidesApp.ShapeType.RECTANGLE, 0, 0, U1, U1);
      shape.getFill().setSolidFill(255, 0, 0);
      shape.getText().setText('hello world');
      shape.getText().getRange(0, 5).getTextStyle().setForegroundColor(0, 255, 0);
      shape.getText().getRange(6, 11).getTextStyle().setBold(true);

      shape.select();
      menuSetTransparency50();
      t.approxEqual(shape.getFill().getSolidFill().getAlpha(), 0.5, 0.01, 'Alpha set to 0.5');

      menuSetColorSwap();
      t.ok(isGreen(shape.getFill().getSolidFill().getColor().asRgbColor()), 'Fill swapped to green');
      t.approxEqual(shape.getFill().getSolidFill().getAlpha(), 0.5, 0.01, 'Swap preserves fill alpha');

      var runs = shape.getText().getRuns();
      for (var i = 0; i < runs.length; i++) {
        if (runs[i].asString().trim().length > 0) {
          t.ok(isRed(runs[i].getTextStyle().getForegroundColor().asRgbColor()), 'Run ' + i + ' swapped to red');
        }
      }
    });
  });

  test('HUE WRAPPING AND ALPHA PRESERVATION ON COLOR TRANSFORMS', function(t) {
    withTestSlide(slidesDocument, function(testSlide) {
      var shape = testSlide.insertShape(SlidesApp.ShapeType.RECTANGLE, 0, 0, U1, U1);
      shape.getFill().setSolidFill(255, 0, 0, 0.6); // Red at 0° with 0.6 alpha

      shape.select();
      menuSetColorHueMinus30(); // Should wrap to 330° (255, 0, 128), NOT clamp at 0°

      var wrappedRgb = shape.getFill().getSolidFill().getColor().asRgbColor();
      t.equal(wrappedRgb.getRed(), 255, 'Wrapped hue -30° R');
      t.equal(wrappedRgb.getGreen(), 0, 'Wrapped hue -30° G');
      t.approxEqual(wrappedRgb.getBlue(), 128, 2, 'Wrapped hue -30° B');
      t.approxEqual(shape.getFill().getSolidFill().getAlpha(), 0.6, 0.01, 'Hue shift preserves alpha');

      menuSetColorInverse();
      t.approxEqual(shape.getFill().getSolidFill().getAlpha(), 0.6, 0.01, 'Invert preserves alpha');
    });
  });

  test('SNAP EDGE CASES: THIN SHAPE AND TABLE', function(t) {
    withTestSlide(slidesDocument, function(testSlide) {
      var thin = testSlide.insertShape(SlidesApp.ShapeType.RECTANGLE, 0, 0, 0.02 * U1, 0.02 * U1);
      var table = testSlide.insertTable(2, 2);

      thin.select();
      table.select(false);

      menuSnapDimension();
      t.ok(thin.getWidth() >= 0.09 * U1, 'Thin shape width clamped to positive minimum');
      t.ok(thin.getHeight() >= 0.09 * U1, 'Thin shape height clamped to positive minimum');

      menuZeroRotation();
      t.ok(true, 'Straightening selection containing a table does not throw');
    });
  });

  test('from ISSUE #10: color commands on element groups', function(t) {
    withTestSlide(slidesDocument, function(testSlide) {
      var testShape1 = testSlide.insertShape(SlidesApp.ShapeType.RECTANGLE, U1 * 0, U1 * 0, U1, U1);
      var testShape2 = testSlide.insertShape(SlidesApp.ShapeType.RECTANGLE, U1 * 1, U1 * 1, U1, U1);
      var testShape3 = testSlide.insertShape(SlidesApp.ShapeType.RECTANGLE, U1 * 2, U1 * 2, U1, U1);
      var testShape4 = testSlide.insertShape(SlidesApp.ShapeType.RECTANGLE, U1 * 3, U1 * 3, U1, U1);
      var testShape5 = testSlide.insertShape(SlidesApp.ShapeType.RECTANGLE, U1 * 4, U1 * 4, U1, U1);
      var testShape6 = testSlide.insertShape(SlidesApp.ShapeType.RECTANGLE, U1 * 5, U1 * 5, U1, U1);

      [testShape1, testShape2, testShape3, testShape4, testShape5, testShape6].forEach(function(s) {
        s.getFill().setSolidFill(0, 255, 0);
      });

      var group1 = testSlide.group([testShape1, testShape2]);
      testSlide.group([testShape3, testShape4]);

      group1.select();
      testShape5.select(false);

      menuSetColorHue0(); // red (255, 0, 0)

      t.ok(isRed(testShape1.getFill().getSolidFill().getColor().asRgbColor()), 'Group1 shape1 -> red');
      t.ok(isRed(testShape2.getFill().getSolidFill().getColor().asRgbColor()), 'Group1 shape2 -> red');
      t.ok(isGreen(testShape4.getFill().getSolidFill().getColor().asRgbColor()), 'Unselected group2 shape4 unchanged');
      t.ok(isRed(testShape5.getFill().getSolidFill().getColor().asRgbColor()), 'Selected shape5 -> red');
      t.ok(isGreen(testShape6.getFill().getSolidFill().getColor().asRgbColor()), 'Unselected shape6 unchanged');
    });
  });

  test('SIDEBAR BRIDGE FUNCTIONS', function(t) {
    withTestSlide(slidesDocument, function(testSlide) {
      var shape1 = testSlide.insertShape(SlidesApp.ShapeType.RECTANGLE, 0, 0, U1, U1);
      var shape2 = testSlide.insertShape(SlidesApp.ShapeType.RECTANGLE, U2, U2, U1, U1);
      shape1.getFill().setSolidFill(255, 0, 0);

      shape1.select();
      var inspectRes = sidebarInspectColor();
      t.ok(inspectRes.ok, 'sidebarInspectColor succeeds on solid shape');
      t.equal(inspectRes.data.hex.toLowerCase(), '#ff0000', 'Inspected hex matches #ff0000');

      var transRes = sidebarSetTransparency(40);
      t.ok(transRes.ok, 'sidebarSetTransparency succeeds');
      t.approxEqual(transRes.inspected.transparencyPct, 40, 0.5, 'Inspector reflects 40% transparency');

      shape2.select();
      shape1.select(false);
      var adjoinRes = sidebarAdjoin(true, 10, 'pt', false);
      t.ok(adjoinRes.ok, 'sidebarAdjoin with custom pt padding succeeds');
      t.approxEqual(shape2.getLeft(), U1 + 10, 0.1, 'Adjoined shape offset by 10pt gap');
    });
  });

  return test.finish();
}

function debugPrompt(message) {
  SlidesApp.getUi().alert('Test Debug', message, SlidesApp.getUi().ButtonSet.OK);
}
