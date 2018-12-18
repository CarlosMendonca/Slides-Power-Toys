var PPI = 72;

function onOpen(event) {
  SlidesApp.getUi().createAddonMenu()
    .addItem('Paranoia!', 'applyParanoia')
    .addItem('Center on page', 'centerOnPage')
    .addSubMenu(SlidesApp.getUi().createMenu('Align')
      .addItem('Outer left', 'alignToOuterLeft')
      .addItem('Outer right', 'alignToOuterRight'))
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
  var elementArray = getElementArray();
  
  elementArray.forEach(function(e) {
    applyParanoiaToShape(e.asShape());
  });
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
  var elementArray = getElementArray();

  if (elementArray.length > 1) {
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
    // This will center the first element to itself if there are multiple, but 
    // who cares...
    centerShapeToCoordinates(e.asShape(), centerPointX, centerPointY);
  });
}

function isPageSelected() {
  return SlidesApp.getActivePresentation().getSelection().getSelectionType() == SlidesApp.SelectionType.CURRENT_PAGE;
}

function alignToOuterLeft() {
  align(PositionX.LEFT, PositionY.NOT_SET, true);
}

function alignToOuterRight() {
  align(PositionX.RIGHT, PositionY.NOT_SET, true);
}

function align(positionX, positionY, isOuterEdge) {
  // This behavior is fundamentally different from the native alignment tools,
  // because here order matters (instead of position of elements on page)
  if (isPageSelected())
    return; // no selection array to get

    var elementArray = getElementArray();
    if (elementArray.length <= 1)
      return; // no reference element to get

      for (var i = 1; i < elementArray.length; i++)
      {
        // This ignores the first element; consider expanding functionality to 
        // allow reference on Nth element
        alignShape(elementArray[0].asShape(), elementArray[i].asShape(), positionX, positionY, isOuterEdge);
      }
}

function alignShape(referenceShape, targetShape, positionX, positionY, isOuterEdge) {
  if (positionX == PositionX.LEFT)
    targetShape.setLeft(referenceShape.getLeft() - targetShape.getWidth());
  
  if (positionX == PositionX.RIGHT)
    targetShape.setLeft(referenceShape.getLeft() + referenceShape.getWidth());
}

var PositionX = {
  NOT_SET: 0,
  LEFT: 1,
  RIGHT: 2
}

var PositionY = {
  NOT_SET: 0,
  TOP: 1,
  BOTTOM: 2
}