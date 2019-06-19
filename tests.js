var URL_TO_GASTAP_LIB = 'https://raw.githubusercontent.com/zixia/gast/master/src/gas-tap-lib.js';
var URL_TO_SLIDES_DOCUMENT = 'https://docs.google.com/presentation/d/1hXuhjKz03K7Tqgr4R1J0ihASCu4Ggi_qtG28IN-DXGg/edit';

if ((typeof GasTap)==='undefined') { // GasT initialization; using Google's best practices
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

    // === function rountTo ===
    test('roundTo exexutes happy path as expected', function(t) {
        t.equal(roundTo(1.23, 1), 1.2);
        t.equal(roundTo(1.23, 0), 1.0);
        t.equal(roundTo(1.2 , 1), 1.2);
        t.equal(roundTo(1.23, 3), 1.23);
    });

    test.finish();
}