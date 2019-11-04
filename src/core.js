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