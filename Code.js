var PPI = 72;

function onOpen(event) {
  SlidesApp.getUi().createAddonMenu()
    .addSubMenu(SlidesApp.getUi().createMenu('Paranoia!')
      .addItem('To dimension', 'applyParanoiaToDimension')
      .addItem('To position', 'applyParanoiaToPosition')
      .addItem('To rotation', 'applyParanoiaToRotation')
      .addItem('Straighten elements', 'applyZeroRotation'))
      //.addSeparator()
      //.addItem('[ß] Distribute table columns', 'distributeTableColumns'))
    .addSubMenu(SlidesApp.getUi().createMenu('Copy')
      .addItem('Width', 'copyWidth')
      .addItem('Height', 'copyHeight')
      .addItem('Width and height', 'copyWidthAndHeight')
      .addItem('Rotation', 'copyRotation'))
    .addSeparator()
    .addSubMenu(SlidesApp.getUi().createMenu('Adjoin')
      .addItem('Horizontally', 'adjoinH')
      .addItem('Vertically', 'adjoinV'))
    .addSubMenu(SlidesApp.getUi().createMenu('Align to inner edge')
      .addItem('Left', 'alignToInnerLeft')
      .addItem('Right', 'alignToInnerRight')
      .addItem('Horizontal center', 'alignToHorizontalCenter')
      .addSeparator()
      .addItem('Top', 'alignToInnerTop')
      .addItem('Bottom', 'alignToInnerBottom')
      .addItem('Vertical center', 'alignToVerticalCenter'))
    .addSubMenu(SlidesApp.getUi().createMenu('Align to outer edge')
      .addItem('Left', 'alignToOuterLeft')
      .addItem('Right', 'alignToOuterRight')
      .addSeparator()
      .addItem('Top', 'alignToOuterTop')
      .addItem('Bottom', 'alignToOuterBottom'))
    .addItem('Center on page', 'centerOnPage')
    .addSubMenu(SlidesApp.getUi().createMenu('Flip')
      .addItem('Horizontally', 'flipH')
      .addItem('Vertically', 'flipV')
      .addItem('Both', 'flipHandV'))
    .addSeparator()
    .addItem('About', 'showAboutSidebar')
    .addToUi();
}

function tableDebug() {
  var elements = getElementArray();
  SlidesApp.getUi().alert(elements[0].asTable().getObjectId() + ";" + elements[0].asTable().getWidth());
  elements[0].asTable().setColumnWidth(0, 200);
}

function showAboutSidebar() {
  var ui = HtmlService
    .createHtmlOutputFromFile('about')
    .setTitle('Slides Power Toys');
  SlidesApp.getUi().showSidebar(ui);
}

function roundTo(number, digits) {
  var power = Math.pow(10, digits);
  return Math.round(number * power) / power;
}

function getSelectionType() {
  return SlidesApp.getActivePresentation().getSelection().getSelectionType();
}

function distributeTableColumns() {
  /*
  var tableArray = getElementArray()
    .filter(function(e) { return e.getPageElementType() == PageElementType.TABLE; })
    .map(function(e) { return e.asTable(); });
  
  if (tableArray.lenght == 0)
    return;
  
  tableArray.foreach(function(t) {
    var numColumns = t.getNumColumns();
    var columnArray = Array.from({length: t.getNumColumns()}, function(_, i) { return t.getColumn(i)});
    var totalWidth = columnArray.reduce(function(acc, el) { return acc + el.getWidth(); });
    
    var equalColumnWidth = totalWidth / numColumns;
    for (var i = 0; i < numColumns; i++) {
      t.setColumnWidth(i, equalColumnWidth);
    }
  });
  */
  SlidesApp.getUi().alert("If only Google Apps Script supported either a setColumn method on the TableColumn class or a setColumnWidth method on the Table class like DocumentApp classes do, this operation would work great. Maybe open a feature suggestion to the Slides team to get this prioritized? :)");
}

function applyParanoiaToPosition() {
  getElementArray().forEach(function(e) {
    applyParanoiaToElement(e, true, false, false);
  });
}

function applyParanoiaToDimension() {
  getElementArray().forEach(function(e) {
    applyParanoiaToElement(e, false, true, false);
  });
}

function applyParanoiaToRotation() {
  getElementArray().forEach(function(e) {
    applyParanoiaToElement(e, false, false, true);
  });
}

function applyParanoiaToElement(element, shouldApplyToPosition, shouldApplyToDimension, shouldApplyToRotation) {
  if (shouldApplyToPosition) {
    element.setLeft(roundTo(element.getLeft()/PPI, 1)*PPI);
    element.setTop(roundTo(element.getTop()/PPI, 1)*PPI);
  }
  
  if (shouldApplyToDimension) {
    element.setWidth(roundTo(element.getWidth()/PPI, 1)*PPI);
    element.setHeight(roundTo(element.getHeight()/PPI, 1)*PPI);
  }
  
  if (shouldApplyToRotation)
    element.setRotation(roundTo(element.getRotation(), 0));
}

function flipH() {
  flip(true, false);
}

function flipV() {
  flip(false, true);
}

function flipHandV() {
  flip(true, true);
}
  
function flip(shouldFlipH, shouldFlipV) {
  var elementArray = getElementArray();
  
  if (elementArray.length < 2)
    return; // Nothing to do here
  
  var n = elementArray.length - 1;
  
  // Only applies to N-1th and Nth elements. Perhaps reconsider this later
  if (shouldFlipH) {
    var left = elementArray[n].getLeft();
    elementArray[n].setLeft(elementArray[n-1].getLeft());
    elementArray[n-1].setLeft(left);
  }
  
  if (shouldFlipV) {
    var top = elementArray[n].getTop();
    elementArray[n].setTop(elementArray[n-1].getTop());
    elementArray[n-1].setTop(top);
  }
}   

function adjoinH() {
  adjoin(0*PPI, true, true);
}

function adjoinV() {
  adjoin(0*PPI, false, true);  
}

function adjoin(paddingPoints, shouldAdjoinH, shouldCenterOnFirst) {
  var elementArray = getElementArray();
  
  // Can only adjoin multiple elements. Also, skip if no elements were selected, but maybe revist this later...
  if (isPageSelected() || elementArray.length == 1)
    return;
  
  if (shouldAdjoinH) elementArray.sort(function(a,b) { return a.getLeft() - b.getLeft(); });
  else elementArray.sort(function(a,b) { return a.getTop() - b.getTop(); });
  
  for (var i = 1; i < elementArray.length; i++) {
    if (shouldAdjoinH) {
      elementArray[i].setLeft(elementArray[i-1].getLeft() + elementArray[i-1].getWidth() + paddingPoints);
      if (shouldCenterOnFirst) elementArray[i].setTop(elementArray[0].getTop() + elementArray[0].getHeight()/2 - elementArray[i].getHeight()/2);
    }
    else {
      elementArray[i].setTop(elementArray[i-1].getTop() + elementArray[i-1].getHeight() + paddingPoints);
      if (shouldCenterOnFirst) elementArray[i].setLeft(elementArray[0].getLeft() + elementArray[0].getWidth()/2 - elementArray[i].getWidth()/2);
    }
  }
}

function applyZeroRotation() {
  getElementArray().forEach(function(e) { e.setRotation(0); });
}

function getElementArray() {
  var selection = SlidesApp.getActivePresentation().getSelection();
  var elementArray = [];
  
  switch (selection.getSelectionType()) {
    case (SlidesApp.SelectionType.CURRENT_PAGE):
      // Page is selected, so fallback to all elements in page
      elementArray = selection.getCurrentPage().getPageElements();
      //Logger.log("Applying to all elements on page.");
      break;
    case (SlidesApp.SelectionType.TEXT):
      // Text is selected, so fallback to parent container
      elementArray = selection.getPageElementRange().getPageElements();
      //Logger.log("Applying to container of selected text.");
      break;
    case (SlidesApp.SelectionType.PAGE_ELEMENT || SlidesApp.SelectionType.TEXT):
      // Elements are selected, so apply only to them
      elementArray = selection.getPageElementRange().getPageElements();
      //Logger.log("Applying to selected shapes on page.");
      break;
    }

    return elementArray;
}

function isPageSelected() {
  return SlidesApp.getActivePresentation().getSelection().getSelectionType() == SlidesApp.SelectionType.CURRENT_PAGE;
}

function alignToInnerLeft() {
  align(PositionX.LEFT, PositionY.NOT_SET, false);
}

function alignToInnerRight() {
  align(PositionX.RIGHT, PositionY.NOT_SET, false);
}

function alignToInnerTop() {
  align(PositionX.NOT_SET, PositionY.TOP, false);
}

function alignToInnerBottom() {
  align(PositionX.NOT_SET, PositionY.BOTTOM, false);  
}

function alignToOuterLeft() {
  align(PositionX.LEFT, PositionY.NOT_SET, true);
}

function alignToOuterRight() {
  align(PositionX.RIGHT, PositionY.NOT_SET, true);
}

function alignToOuterTop() {
  align(PositionX.NOT_SET, PositionY.TOP, true);
}

function alignToOuterBottom() {
  align(PositionX.NOT_SET, PositionY.BOTTOM, true);  
}

function alignToVerticalCenter() {
  align(PositionX.NOT_SET, PositionY.CENTER, false);
}

function alignToHorizontalCenter() {
  align(PositionX.CENTER, PositionY.NOT_SET, false);
}

function getPageAsFakeElement() {
  return { getLeft: function() { return 0; },
          getTop: function() { return 0; },
          getWidth: function() { return SlidesApp.getActivePresentation().getPageWidth(); },
          getHeight: function() { return SlidesApp.getActivePresentation().getPageHeight(); }};
}

function centerOnPage() {
  var elementArray = getElementArray();
  
  // In this case, reference is always the page
  elementArray.push(getPageAsFakeElement());

  var n = elementArray.length-1;
  
  for (var i = 0; i < n; i++) {
    alignShape(elementArray[n], elementArray[i], PositionX.CENTER, PositionY.CENTER, false);
  }
}

function align(positionX, positionY, isOuterEdge) {
  // This behavior is fundamentally different from the native alignment tools,
  // because here order matters (instead of position of elements on page)

  var elementArray = getElementArray();

  // If no elements were selected or only 1 element was selected, reference element becomes the page itself. Wish G Apps Script would support lambdas for a cleaner syntax...
  if (isPageSelected() || elementArray.length == 1)
    elementArray.push(getPageAsFakeElement());

  // Reference is always the last element. This is the only consistent way of selecting a reference element on G Apps since the selection array's order is not preserved
  var n = elementArray.length-1;
  
  for (var i = 0; i < n; i++) {
    alignShape(elementArray[n], elementArray[i], positionX, positionY, isOuterEdge);
  }
}

function alignShape(referenceShape, targetShape, positionX, positionY, isOuterEdge) {  
  //Array.from({length: 5}, (_, i) => i);
  //Logger.log(Array.from({length: table.getNumColumns()}, (_, i) => i).reduce((acc, index) => acc + table.getColumn(index).getWidth()),0);
  //Logger.log(targetShape.asTable().getColumn().reduce(function(acc, column) { return acc + column.getWidth(); }, 0));
  
  if (positionX == PositionX.LEFT)
    targetShape.setLeft(referenceShape.getLeft() - targetShape.getWidth()*isOuterEdge);
  
  if (positionX == PositionX.RIGHT)
    targetShape.setLeft(referenceShape.getLeft() + referenceShape.getWidth() - targetShape.getWidth()*(!isOuterEdge));
  
  if (positionX == PositionX.CENTER)
    targetShape.setLeft(referenceShape.getLeft() + referenceShape.getWidth()/2 - targetShape.getWidth()/2);
  
  if (positionY == PositionY.TOP)
    targetShape.setTop(referenceShape.getTop() - targetShape.getHeight()*isOuterEdge);
  
  if (positionY == PositionY.BOTTOM)
    targetShape.setTop(referenceShape.getTop() + referenceShape.getHeight() - targetShape.getHeight()*(!isOuterEdge));
  
  if (positionY == PositionY.CENTER)
    targetShape.setTop(referenceShape.getTop() + referenceShape.getHeight()/2 - targetShape.getHeight()/2);
}

function copyWidth() {
  copyDimensions(true, false, false);
}

function copyHeight() {
  copyDimensions(false, true, false);
}

function copyWidthAndHeight() {
  copyDimensions(true, true, false);
} 

function copyRotation() {
  copyDimensions(false, false, true);
} 

function copyDimensions(copyWidth, copyHeight, copyRotation) {
  if (isPageSelected())
    return; // no selection array to get, so won't be able to get a reference element

  var elementArray = getElementArray();
  var n = elementArray.length-1;
  
  if (n == 0)
    return; // just one element in selection, so no point in continuing
  
  for (var i = 0; i < n; i++) {
    if (copyWidth) elementArray[i].setWidth(elementArray[n].getWidth());
    if (copyHeight) elementArray[i].setHeight(elementArray[n].getHeight());
    if (copyRotation) elementArray[i].setRotation(elementArray[n].getRotation());
  }
}

var PositionX = {
  NOT_SET: 0,
  LEFT: 1,
  RIGHT: 2,
  CENTER: 3
}

var PositionY = {
  NOT_SET: 0,
  TOP: 1,
  BOTTOM: 2,
  CENTER: 3
}
