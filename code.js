// === DEFINITIONS ===
var PPI = 72;

var POSITION_X = {
  NOT_SET: 0,
  LEFT: 1,
  RIGHT: 2,
  CENTER: 3
}

var POSITION_Y = {
  NOT_SET: 0,
  TOP: 1,
  BOTTOM: 2,
  CENTER: 3
}

// === INIT ===
function onInstall(e) { onOpen(e); }

function onOpen(event) {
  SlidesApp.getUi().createAddonMenu()
    .addSubMenu(SlidesApp.getUi().createMenu('Precision snap')
      .addItem('To dimension', 'menuSnapDimension')
      .addItem('To position', 'menuSnapPosition')
      .addItem('To rotation', 'menuSnapRotation')
      .addItem('Straighten elements', 'menuZeroRotation'))
    .addSubMenu(SlidesApp.getUi().createMenu('Copy attributes')
      .addItem('Width', 'menuCopyWidth')
      .addItem('Height', 'menyCopyHeight')
      .addItem('Width and height', 'menuCopyWidthAndHeight')
      .addItem('Rotation', 'menuCopyRotation'))
    .addSeparator()
    .addSubMenu(SlidesApp.getUi().createMenu('Adjoin')
      .addItem('Horizontally', 'menuAdjoinH')
      .addItem('Vertically', 'menuAdjoinV'))
    .addSubMenu(SlidesApp.getUi().createMenu('Align to inner edge')
      .addItem('Left', 'menuAlignToInnerLeft')
      .addItem('Right', 'menuAlignToInnerRight')
      .addItem('Horizontal center', 'menuAlignToHorizontalCenter')
      .addSeparator()
      .addItem('Top', 'menuAlignToInnerTop')
      .addItem('Bottom', 'menuAlignToInnerBottom')
      .addItem('Vertical center', 'menuAlignToVerticalCenter'))
    .addSubMenu(SlidesApp.getUi().createMenu('Align to outer edge')
      .addItem('Left', 'menuAlignToOuterLeft')
      .addItem('Right', 'menuAlignToOuterRight')
      .addSeparator()
      .addItem('Top', 'menuAlignToOuterTop')
      .addItem('Bottom', 'menuAlignToOuterBottom'))
    .addItem('Center on page', 'menuCenterOnPage')
    .addSubMenu(SlidesApp.getUi().createMenu('Flip')
      .addItem('Horizontally', 'menuFlipH')
      .addItem('Vertically', 'menuFlipV')
      .addItem('Both', 'menuFlipHV'))
    .addSeparator()
    .addSubMenu(SlidesApp.getUi().createMenu('Set transparency')
      .addItem('100% (transparent)', 'menuSetTransparency0')
      .addItem('90%', 'menuSetTransparency10')
      .addItem('75%', 'menuSetTransparency25')
      .addItem('66%', 'menuSetTransparency33')
      .addItem('50%', 'menuSetTransparency50')
      .addItem('33%', 'menuSetTransparency66')
      .addItem('25%', 'menuSetTransparency75')              
      .addItem('10%', 'menuSetTransparency90')              
      .addItem('0% (opaque)', 'menuSetTransparency100'))
    .addSubMenu(SlidesApp.getUi().createMenu('Set color')
      .addItem('Swap text with background', 'menuSetColorSwap')
      .addItem('Invert background colors', 'menuSetColorInverse')
      .addItem('Max text contrast', 'menuSetColorMaxContrast'))
    .addSeparator()
    .addItem('About', 'menuShowAboutSidebar')
    .addToUi();
}

// === MENU CALLS ===
function menuSnapPosition()  { getSelectedElementsOnPageOrFallback().forEach(function(e) { snapElement(e, true, false, false); }); }
function menuSnapDimension() { getSelectedElementsOnPageOrFallback().forEach(function(e) { snapElement(e, false, true, false); }); }
function menuSnapRotation()  { getSelectedElementsOnPageOrFallback().forEach(function(e) { snapElement(e, false, false, true); }); }
function menuZeroRotation()  { getSelectedElementsOnPageOrFallback().forEach(function(e) { e.setRotation(0); }); }

function menuCopyWidth() { copySelectedElementDimensions(true, false, false); }
function menuCopyHeight() { copySelectedElementDimensions(false, true, false); }
function menuCopyWidthAndHeight() { copySelectedElementDimensions(true, true, false); } 
function menuCopyRotation() { copySelectedElementDimensions(false, false, true); } 

//function menuAdjoinH() { adjoinSelectedElements(0*PPI, true, true); }
//function menuAdjoinV() { adjoinSelectedElements(0*PPI, false, true); }

function menuAlignToInnerLeft()        { align(POSITION_X.LEFT, POSITION_Y.NOT_SET, false); }
function menuAlignToInnerRight()       { align(POSITION_X.RIGHT, POSITION_Y.NOT_SET, false); }
function menuAlignToInnerTop()         { align(POSITION_X.NOT_SET, POSITION_Y.TOP, false); }
function menuAlignToInnerBottom()      { align(POSITION_X.NOT_SET, POSITION_Y.BOTTOM, false); }
function menuAlignToOuterLeft()        { align(POSITION_X.LEFT, POSITION_Y.NOT_SET, true); }
function menuAlignToOuterRight()       { align(POSITION_X.RIGHT, POSITION_Y.NOT_SET, true); }
function menuAlignToOuterTop()         { align(POSITION_X.NOT_SET, POSITION_Y.TOP, true); }
function menuAlignToOuterBottom()      { align(POSITION_X.NOT_SET, POSITION_Y.BOTTOM, true); }
function menuAlignToVerticalCenter()   { align(POSITION_X.NOT_SET, POSITION_Y.CENTER, false); }
function menuAlignToHorizontalCenter() { align(POSITION_X.CENTER, POSITION_Y.NOT_SET, false); }

//function menuFlipH() { flipSelectedElements(true, false); }
//function menuFlipV() { flipSelectedElements(false, true); }
//function menuFlipHV() { flipSelectedElements(true, true); }

function menuSetTransparency0()   { withSelectedOrAllShapesOnPage(doSetAlpha, { amount: 0 }); }
function menuSetTransparency10()  { withSelectedOrAllShapesOnPage(doSetAlpha, { amount: 0.1 }); }
function menuSetTransparency25()  { withSelectedOrAllShapesOnPage(doSetAlpha, { amount: 0.25 }); }
function menuSetTransparency33()  { withSelectedOrAllShapesOnPage(doSetAlpha, { amount: 0.33 }); }
function menuSetTransparency50()  { withSelectedOrAllShapesOnPage(doSetAlpha, { amount: 0.5 }); }
function menuSetTransparency66()  { withSelectedOrAllShapesOnPage(doSetAlpha, { amount: 0.67 }); }
function menuSetTransparency75()  { withSelectedOrAllShapesOnPage(doSetAlpha, { amount: 0.75 }); }
function menuSetTransparency90()  { withSelectedOrAllShapesOnPage(doSetAlpha, { amount: 0.9 }); }
function menuSetTransparency100() { withSelectedOrAllShapesOnPage(doSetAlpha, { amount: 1 }); }

function menuSetColorSwap() { withSelectedOrAllShapesOnPage(doColorSwap); }
function menuSetColorInverse() { withSelectedOrAllShapesOnPage(doColorInversion); }
function menuSetColorMaxContrast() { withSelectedOrAllShapesOnPage(doMaxTextContrast); }

function menuShowAboutSidebar() {
  var ui = HtmlService
    .createHtmlOutputFromFile('about')
    .setTitle('Slides Power Toys');
  SlidesApp.getUi().showSidebar(ui);
}

// must have elements selected; do something to all in ref to last
function menuCenterOnPage() {
  var elementArray = getSelectedElementsOnPageOrFallback();
  
  // In this case, reference is always the page
  elementArray.push(fakePageAsReferenceElement());

  var n = elementArray.length-1;
  
  for (var i = 0; i < n; i++) {
    alignShape(elementArray[n], elementArray[i], POSITION_X.CENTER, POSITION_Y.CENTER, false);
  }
}

// === CORE LOGIC ===
function snapElement(element, shouldApplyToPosition, shouldApplyToDimension, shouldApplyToRotation) {
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

// This behavior is fundamentally different from the native alignment tools,
//   because here order matters (instead of position of elements on page)

// must have elements selected; do something to all in ref to last or to page
function align(positionX, positionY, isOuterEdge) {
  var elementArray = getSelectedElementsOnPageOrFallback();

  // If no elements were selected or only 1 element was selected, reference element becomes the page itself. Wish G Apps Script would support lambdas for a cleaner syntax...
  if (isPageSelected() || elementArray.length == 1)
    elementArray.push(fakePageAsReferenceElement());

  // Reference is always the last element. This is the only consistent way of selecting a reference element on G Apps since the selection array's order is not preserved
  var n = elementArray.length-1;
  
  for (var i = 0; i < n; i++) {
    alignShape(elementArray[n], elementArray[i], positionX, positionY, isOuterEdge);
  }
}

function alignShape(referenceShape, targetShape, positionX, positionY, isOuterEdge) {  
  if (positionX == POSITION_X.LEFT)
    targetShape.setLeft(referenceShape.getLeft() - targetShape.getWidth()*isOuterEdge);
  
  if (positionX == POSITION_X.RIGHT)
    targetShape.setLeft(referenceShape.getLeft() + referenceShape.getWidth() - targetShape.getWidth()*(!isOuterEdge));

  if (positionX == POSITION_X.CENTER)
    targetShape.setLeft(referenceShape.getLeft() + referenceShape.getWidth()/2 - targetShape.getWidth()/2);
  
  if (positionY == POSITION_Y.TOP)
    targetShape.setTop(referenceShape.getTop() - targetShape.getHeight()*isOuterEdge);
  
  if (positionY == POSITION_Y.BOTTOM)
    targetShape.setTop(referenceShape.getTop() + referenceShape.getHeight() - targetShape.getHeight()*(!isOuterEdge));
  
  if (positionY == POSITION_Y.CENTER)
    targetShape.setTop(referenceShape.getTop() + referenceShape.getHeight()/2 - targetShape.getHeight()/2);
}

// must have elements selected; do something to all in ref to last
function copySelectedElementDimensions(copyWidth, copyHeight, copyRotation) {
  if (isPageSelected())
    return; // no selection array to get, so won't be able to get a reference element

  var elementArray = getSelectedElementsOnPageOrFallback();
  var n = elementArray.length-1;
  
  if (n == 0)
    return; // just one element in selection, so no point in continuing
  
  for (var i = 0; i < n; i++) {
    if (copyWidth) elementArray[i].setWidth(elementArray[n].getWidth());
    if (copyHeight) elementArray[i].setHeight(elementArray[n].getHeight());
    if (copyRotation) elementArray[i].setRotation(elementArray[n].getRotation());
  }
}

// must have elements selected; do something to all in ref to last
function withSelectedOrAllShapesOnPage(doStuff) { withSelectedOrAllShapesOnPage(doStuff, {}); }
function withSelectedOrAllShapesOnPage(doStuff, attributes) {
  // Like on other functions, this only applies to SHAPE. Also, this function will ignore transparency,
  //   will only consider the color of the first text element and will will NOT consider background
  //   text color.
  getSelectedElementsOnPage(true)
    .filter (function(e) { return e.getPageElementType() == SlidesApp.PageElementType.SHAPE; })
    .forEach(function(e) { doStuff(e.asShape(), attributes)});
}

function doSetAlpha(shape, attributes) {
  var fill = shape.getFill();
  
  if (fill.getType() == SlidesApp.FillType.SOLID)
    fill.setSolidFill(fill.getSolidFill().getColor(), attributes.amount);
}

function doColorSwap(shape, attributes) {
  if (doesShapeHaveSolidFill(shape) && doesShapeHaveText(shape)) { // must have SOLID fill and some text
    var textStyle = shape.getText().getRuns()[0].getTextStyle();
    var textColor = textStyle.getForegroundColor();
    
    textStyle.setForegroundColor(shape.getFill().getSolidFill().getColor());
    shape.getFill().setSolidFill(textColor);
  }
}

function doColorInversion(shape, attributes) { 
  if (doesShapeHaveSolidFill(shape)) { // must have SOLID fill
    var rgbColor = shape.getFill().getSolidFill().getColor().asRgbColor();
    shape.getFill().setSolidFill(
      255 - rgbColor.getRed(),
      255 - rgbColor.getGreen(),
      255 - rgbColor.getBlue());
  }
}

var doMaxTextContrast = function(shape, attributes) { 
  if (doesShapeHaveSolidFill(shape) && doesShapeHaveText(shape)) { // must have SOLID fill and some text
    if (calculateLuminosity(shape.getFill().getSolidFill().getColor()) >= 0.5)
      shape.getText().getTextStyle().setForegroundColor(0, 0, 0);
    else
      shape.getText().getTextStyle().setForegroundColor(255, 255, 255);
  }
}

// === SHORTCUT FUNCTIONS ===
function getSelectionType() { return SlidesApp.getActivePresentation().getSelection().getSelectionType(); }

function isPageSelected() { return SlidesApp.getActivePresentation().getSelection().getSelectionType() == SlidesApp.SelectionType.CURRENT_PAGE; }
function doesShapeHaveSolidFill(shape) { return shape.getFill().getType() == SlidesApp.FillType.SOLID; }

// Using getLength() > 1 because isEmpty() is broken; it's probably counting the new line character
//   that documentation (https://developers.google.com/apps-script/reference/slides/shape#gettext) 
//   says always exists, which is a non-sensical behavior. I can see this breaking some day.
function doesShapeHaveText(shape) { return shape.getText().getLength() > 1; }

function getSelectedElementsOnPageOrFallback() { return getSelectedElementsOnPage(true); }

// Get all selected elements on page as an array. If no elements are selected, get all elements on page.
//   If text is selected, get the parent element.
function getSelectedElementsOnPage(shouldFallbackToGetAllElementsOnPage) {
  var selection = SlidesApp.getActivePresentation().getSelection();

  switch (selection.getSelectionType()) {
    case SlidesApp.SelectionType.PAGE_ELEMENT:
    case SlidesApp.SelectionType.TEXT:
      return selection.getPageElementRange().getPageElements();

    case SlidesApp.SelectionType.CURRENT_PAGE:
      return shouldFallbackToGetAllElementsOnPage
        ? selection.getCurrentPage().getPageElements()
        : [];

    default: // deal with the corner cases on enum SlidesApp.SelectionType
      return [];
  }
}

function fakePageAsReferenceElement() {
  return {
    getLeft:   function() { return 0; },
    getTop:    function() { return 0; },
    getWidth:  function() { return SlidesApp.getActivePresentation().getPageWidth(); },
    getHeight: function() { return SlidesApp.getActivePresentation().getPageHeight(); }};
}

// === UTILITY FUNCTIONS ===
function calculateLuminosity(color) {
  var r = color.asRgbColor().getRed()   / 255;
  var g = color.asRgbColor().getGreen() / 255;
  var b = color.asRgbColor().getBlue()  / 255;
  
  var max = Math.max(r, g, b), min = Math.min(r, g, b);
  return (max + min) / 2;
}

function roundTo(number, digits) {
  var power = Math.pow(10, digits);
  return Math.round(number * power) / power;
}

// === NEW ADJOIN CODE ===
function menuAdjoinH() { adjoinSelectedElements(true,  true, 0*PPI); }
function menuAdjoinV() { adjoinSelectedElements(false, true, 0*PPI); }

function adjoinSelectedElements(shouldAdjoinInHorizontalDirection, shouldCenterOnFirst, paddingPoints) {
  var elementArray = getSelectedElementsOnPage(false); // will not fallback to all elements on page, but maybe revist this later...

  if (elementArray.lenght < 2) // will only adjoin multiple elements
    return;
  
  if (shouldAdjoinInHorizontalDirection)
    elementArray.sort(function(a,b) { return a.getLeft() - b.getLeft(); }); // sort array by leftmost element
  else
    elementArray.sort(function(a,b) { return a.getTop() - b.getTop(); }); // sort array by topmost element
  
  for (var i = 1; i < elementArray.length; i++) {
    adjoinTwoElements(
      elementArray[i],
      elementArray[i-1],
      shouldAdjoinInHorizontalDirection,
      shouldCenterOnFirst ? elementArray[0] : null,
      paddingPoints);
  }
}

function adjoinTwoElements(elementA, elementB, shouldAdjoinInHorizontalDirection, elementToCenterOn, paddingPoints) {
  if (shouldAdjoinInHorizontalDirection) {
    elementB.setLeft(elementA.getLeft() + elementA.getWidth() + paddingPoints);
    if (elementToCenterOn)
      elementB.setTop(elementToCenterOn.getTop() + elementToCenterOn.getHeight()/2 - elementB.getHeight()/2);
  }
  else {
    elementB.setTop(elementA.getTop() + elementA.getHeight() + paddingPoints);
    if (elementToCenterOn)
      elementB.setLeft(elementToCenterOn.getLeft() + elementToCenterOn.getWidth()/2 - elementB.getWidth()/2);
  }
}

// === FLIP CODE ===
function menuFlipH()  { flipLastTwoSelectedElements(true,  false); }
function menuFlipV()  { flipLastTwoSelectedElements(false, true);  }
function menuFlipHV() { flipLastTwoSelectedElements(true,  true);  }

function flipLastTwoSelectedElements(shouldFlipH, shouldFlipV) {
  var selectedElements = getSelectedElementsOnPage(false);

  if (selectedElements.length < 2) // need two or more elements to flip
    return;
  
  flipTwoElements(selectedElements.pop(), selectedElements.pop(), shouldFlipH, shouldFlipV); // order of elements does not matter
}

function flipTwoElements(elementA, elementB, shouldFlipH, shouldFlipV) {
  if (shouldFlipH) {
    var x = elementB.getLeft();
    elementB.setLeft(elementA.getLeft());
    elementA.setLeft(x);
  }

  if (shouldFlipV) {
    var y = elementB.getTop();
    elementB.setTop(elementA.getTop());
    elementA.setTop(y);
  }
}