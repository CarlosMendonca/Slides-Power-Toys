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

const MIN_SNAP_DIMENSION_INCHES = 0.1;

function canRotateElement(element) {
  return element.getPageElementType() !== SlidesApp.PageElementType.TABLE;
}

function canResizeElement(element) {
  return element.getPageElementType() !== SlidesApp.PageElementType.TABLE;
}

function snapDimensionPoints(points, isLine, unitPoints, decimals) {
  const unit = unitPoints || PPI;
  const precision = typeof decimals === 'number' ? decimals : 1;
  if (isLine && points === 0) return 0;
  let snapped = roundTo(points / unit, precision);
  const minUnit = precision > 0 ? Math.pow(10, -precision) : MIN_SNAP_DIMENSION_INCHES;
  if (snapped <= 0) snapped = minUnit;
  return snapped * unit;
}

function snapElement(
  element,
  shouldApplyToPosition,
  shouldApplyToDimension,
  shouldApplyToRotation,
  unitPoints,
  decimals
) {
  const unit = unitPoints || PPI;
  const precision = typeof decimals === 'number' ? decimals : 1;

  if (shouldApplyToPosition) {
    element.setLeft(roundTo(element.getLeft() / unit, precision) * unit);
    element.setTop(roundTo(element.getTop() / unit, precision) * unit);
  }

  if (shouldApplyToDimension && canResizeElement(element)) {
    const isLine = element.getPageElementType() === SlidesApp.PageElementType.LINE;
    const width = element.getWidth();
    const height = element.getHeight();
    if (!(isLine && width === 0)) {
      element.setWidth(snapDimensionPoints(width, isLine, unit, precision));
    }
    if (!(isLine && height === 0)) {
      element.setHeight(snapDimensionPoints(height, isLine, unit, precision));
    }
  }

  if (shouldApplyToRotation && canRotateElement(element)) {
    element.setRotation(roundTo(element.getRotation(), 0));
  }
}

// This behavior is fundamentally different from the native alignment tools,
// because here selection order matters (relative to the last selected element).
function alignShape(referenceShape, targetShape, positionX, positionY, isOuterEdge) {
  if (positionX === POSITION_X.LEFT) {
    targetShape.setLeft(referenceShape.getLeft() - (isOuterEdge ? targetShape.getWidth() : 0));
  } else if (positionX === POSITION_X.RIGHT) {
    targetShape.setLeft(
      referenceShape.getLeft() + referenceShape.getWidth() - (isOuterEdge ? 0 : targetShape.getWidth())
    );
  } else if (positionX === POSITION_X.CENTER) {
    targetShape.setLeft(referenceShape.getLeft() + referenceShape.getWidth() / 2 - targetShape.getWidth() / 2);
  }

  if (positionY === POSITION_Y.TOP) {
    targetShape.setTop(referenceShape.getTop() - (isOuterEdge ? targetShape.getHeight() : 0));
  } else if (positionY === POSITION_Y.BOTTOM) {
    targetShape.setTop(
      referenceShape.getTop() + referenceShape.getHeight() - (isOuterEdge ? 0 : targetShape.getHeight())
    );
  } else if (positionY === POSITION_Y.CENTER) {
    targetShape.setTop(referenceShape.getTop() + referenceShape.getHeight() / 2 - targetShape.getHeight() / 2);
  }
}

function flipTwoElements(elementA, elementB, shouldFlipH, shouldFlipV) {
  if (shouldFlipH) {
    const x = elementB.getLeft();
    elementB.setLeft(elementA.getLeft());
    elementA.setLeft(x);
  }

  if (shouldFlipV) {
    const y = elementB.getTop();
    elementB.setTop(elementA.getTop());
    elementA.setTop(y);
  }
}

function adjoinTwoElements(elementA, elementB, shouldAdjoinInHorizontalDirection, elementToCenterOn, paddingPoints) {
  if (shouldAdjoinInHorizontalDirection) {
    elementB.setLeft(elementA.getLeft() + elementA.getWidth() + paddingPoints);
    if (elementToCenterOn) {
      elementB.setTop(elementToCenterOn.getTop() + elementToCenterOn.getHeight() / 2 - elementB.getHeight() / 2);
    }
  } else {
    elementB.setTop(elementA.getTop() + elementA.getHeight() + paddingPoints);
    if (elementToCenterOn) {
      elementB.setLeft(elementToCenterOn.getLeft() + elementToCenterOn.getWidth() / 2 - elementB.getWidth() / 2);
    }
  }
}
