var PPI = 72;

function onOpen(event) {
  SlidesApp.getUi().createAddonMenu()
    .addItem('Paranoia!', 'applyParanoia')
    .addSeparator()
    .addItem('Preferences', 'showPreferencesSidebar')
    .addToUi();
}

function roundTo(number, digits) {
  var power = Math.pow(10, digits);
  return Math.round(number * power) / power;
}

function getSelectionType() {
  return SlidesApp.getActivePresentation().getSelection().getSelectionType();
}

function applyParanoiaToShape(shape) {
  var left = shape.getLeft();
  var top = shape.getTop();
  
  // Align to closest 0.1 inch
  left = roundTo(left/PPI, 1)*PPI;
  top = roundTo(top/PPI, 1)*PPI;
  
  shape.setLeft(roundTo(left, 1));
  shape.setTop(roundTo(top, 1));
}

function applyParanoia() {
  var presentation = SlidesApp.getActivePresentation();
  var selection = presentation.getSelection();
  var elementArray;
  
  switch (getSelectionType()) {
    case (SlidesApp.SelectionType.CURRENT_PAGE):
      // Page is selected, so apply to all elements in page
      elementArray = selection.getCurrentPage().getPageElements();
      Logger.log("Applying paranoia to all elements on page.");
      break;
    case (SlidesApp.SelectionType.PAGE_ELEMENT):
      // Elements are selected, so apply only to them
      elementArray = selection.getPageElementRange().getPageElements();
      Logger.log("Applying paranoia to selection.");
      break;
    default:
      return;
  }

  var i = 0;
  elementArray.forEach(function(e) {
    applyParanoiaToShape(e.asShape());
    i++;
  });
  
  Logger.log("Applied paranoia to " + i + " shape(s).");
}

function showPreferencesSidebar() {
  var ui = HtmlService
    .createHtmlOutputFromFile('sidebar')
    .setTitle('slidesKFA Preferences');
  SlidesApp.getUi().showSidebar(ui);
}

function centerShapeToCoordinates(shape, x, y) {
  shape.setLeft(x - shape.getWidth()/2);
  shape.setTop(y - shape.getHeight()/2);
}

function getElementArray() {
  var selection = SlidesApp.getActivePresentation().getSelection();
  var elementArray = [];
  
  switch (selection.getSelectionType()) {
    case (SlidesApp.SelectionType.CURRENT_PAGE):
      // Page is selected, so apply to all elements in page
      elementArray = selection.getCurrentPage().getPageElements();
      Logger.log("Applying to all elements on page.");
      break;
    case (SlidesApp.SelectionType.PAGE_ELEMENT):
      // Elements are selected, so apply only to them
      elementArray = selection.getPageElementRange().getPageElements();
      Logger.log("Applying to selected shapes on page.");
      break;
    }

    return elementArray;
}

function centerOnPage() {
  var centerPointX, centerPointY;
  var elementArray;

  if (elementArray.lenght > 1) {
    // Then center (x,y) is at first element; consider expanding functionality 
    // to allow reference on Nth element
    centerPointX = elementArray[0].getLeft() + elementArray[0].getWidth() / 2;
    centerPointY = elementArray[0].getTop() + elementArray[0].getHeight() / 2;
  }
  else {
    // Then center (x,y) is at center of page
    centerPointX = SlidesApp.getActivePresentation().getPageWidth() / 2;
    centerPointY = SlidesApp.getActivePresentation().getPageHeight() / 2;
  }

  elementArray.forEach(function(e) {
    // This will center the first element to itself if there are multiple, but who cares...
    centerShapeToCoordinates(e.asShape(), centerPointX, centerPointY);
  });
}