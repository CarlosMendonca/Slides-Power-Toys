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

// ELEMENT SELECTION FUNCTIONS

function withSelectedOrAllShapes(doStuff) {
  getSelectedElementsOnPage(true)
    .filter (function(e) { return e.getPageElementType() == SlidesApp.PageElementType.SHAPE; })
    .forEach(function(e) { doStuff(e.asShape()); });
}

function withSelectedOrAllShapesOrGroupsRecursively(doStuff) {
  var selectedOrAllElementsOnPage = getSelectedElementsOnPage(true);
  
  withShapesOrGroupsRecursively(selectedOrAllElementsOnPage, doStuff);
}

function withShapesOrGroupsRecursively(pageElementArray, doStuff) {
  var groupsArray = pageElementArray
    .filter (function(e) { return e.getPageElementType() == SlidesApp.PageElementType.GROUP; });
  
  var elementsArray = pageElementArray
    .filter (function(e) { return e.getPageElementType() == SlidesApp.PageElementType.SHAPE; });
  
  // This cannot be achieved programmatically (hence, cannot be tested), but in
  //   the UI is possible to select multiple elemments inside the group. In
  //   that case, the selection array contains the individual elements *and*
  //   the parent group, so to only apply the change (doStuff) to the selected
  //   elements intead of the entire group, we need to skip the group
  //   processing. The condition below describes only one group selected and
  //   the any of the elments belong to it.
  var shouldSkipGroup = groupsArray.length == 1
    && elementsArray.length > 0
    && elementsArray[0].getParentGroup() != null
    && elementsArray[0].getParentGroup().getObjectId() == groupsArray[0].getObjectId();

  // Handle shapes
  elementsArray
    .forEach(function(e) { doStuff(e.asShape()); });
  
  if (shouldSkipGroup) return;
  
  // Handle groups, recursively
  groupsArray
    .forEach(function(e) { withShapesOrGroupsRecursively(e.asGroup().getChildren(), doStuff) });
}

function withSelectedElements(doStuff) {
  getSelectedElementsOnPage(false)
    .forEach(function (e) { doStuff(e); });
}
function withSelectedOrAllElements(doStuff) {
  getSelectedElementsOnPage(true)
    .forEach(function (e) { doStuff(e); });
}
  
// Get all selected elements on page as an array. If no elements are selected,
//   get all elements on page. If text is selected, get the parent element.
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