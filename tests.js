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

    test('Test Slides document opens successfully', function(t) {    
        t.ok(slidesDocument);
    });

    test('[UNIT] function roundTo', function(t) {
        t.equal(roundTo(1.23, 1), 1.2);
        t.equal(roundTo(1.23, 0), 1.0);
        t.equal(roundTo(1.2 , 1), 1.2);
        t.equal(roundTo(1.23, 3), 1.23);
    });

    test('[INTEGRATION] Align to Inner Borders', function(t) {
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
        testSlide.remove();
    });

    test.finish();
}