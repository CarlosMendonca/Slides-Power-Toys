// CORE LOGIC

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
  
  function setAlphaToShape(shape, amount) {
    var fill = shape.getFill();
    
    if (fill.getType() == SlidesApp.FillType.SOLID)
      fill.setSolidFill(fill.getSolidFill().getColor(), amount);
  }
  
  function swapColorsOnShape(shape) {
    if (doesShapeHaveSolidFill(shape) && doesShapeHaveText(shape)) { // must have SOLID fill and some text
      var textStyle = shape.getText().getRuns()[0].getTextStyle();
      var textColor = textStyle.getForegroundColor();
      
      textStyle.setForegroundColor(shape.getFill().getSolidFill().getColor());
      shape.getFill().setSolidFill(textColor);
    }
  }
  
  function invertColorsOnShape(shape) { 
    if (doesShapeHaveSolidFill(shape)) { // must have SOLID fill
      var color = shape.getFill().getSolidFill().getColor();
      var rgbColor;

      switch(color.getColorType()) {
        case(SlidesApp.ColorType.RGB):
          rgbColor = color.asRgbColor();
          break;
        case(SlidesApp.ColorType.THEME):
          rgbColor = shape.getParentPage().asSlide().getColorScheme().getConcreteColor(color.asThemeColor().getThemeColorType()).asRgbColor();
          break;
        default:
          
          return;
      }

      shape.getFill().setSolidFill(
        255 - rgbColor.getRed(),
        255 - rgbColor.getGreen(),
        255 - rgbColor.getBlue());
    }
  }
  
  var setMaxContrastToTextOnShape = function(shape) { 
    if (doesShapeHaveSolidFill(shape) && doesShapeHaveText(shape)) { // must have SOLID fill and some text
      if (calculateLuminosity(shape.getFill().getSolidFill().getColor()) >= 0.5)
        shape.getText().getTextStyle().setForegroundColor(0, 0, 0);
      else
        shape.getText().getTextStyle().setForegroundColor(255, 255, 255);
    }
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