// TESTS (shouldn't be accessible from production)

var URL_TO_GASTAP_LIB = 'https://raw.githubusercontent.com/zixia/gast/master/src/gas-tap-lib.js';
var URL_TO_SLIDES_DOCUMENT = 'https://docs.google.com/presentation/d/1hXuhjKz03K7Tqgr4R1J0ihASCu4Ggi_qtG28IN-DXGg/edit';

var U1 = 72;  // all unit dimensions are stored in INCHES, but commands use PIXELS as unit, so there's a loss of precision when dividing by 72
var U2 = 144;

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

    test.finish();
}