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

function withSelectedOrAllShapesOrGroupsRecursively(doStuff) {
  const selectedOrAllElementsOnPage = getSelectedElementsOnPage(true);

  withShapesOrGroupsRecursively(selectedOrAllElementsOnPage, doStuff);
}

function withShapesOrGroupsRecursively(pageElementArray, doStuff) {
  const groupsArray = [];
  const elementsArray = [];
  const ancestorGroupIds = new Set();

  // Single pass to partition shapes/groups and collect ancestor group IDs.
  // In the Slides UI, selecting individual elements inside a group returns both
  // the selected children and their ancestor group(s).
  pageElementArray.forEach((e) => {
    const elementType = e.getPageElementType();
    if (elementType === SlidesApp.PageElementType.GROUP) {
      groupsArray.push(e);
    } else if (elementType === SlidesApp.PageElementType.SHAPE) {
      elementsArray.push(e);
    }

    let parent = e.getParentGroup();
    while (parent != null) {
      ancestorGroupIds.add(parent.getObjectId());
      parent = parent.getParentGroup();
    }
  });

  // Handle shapes
  elementsArray.forEach((e) => doStuff(e.asShape()));

  // Handle groups, recursively (skipping ancestor groups of explicitly selected children)
  groupsArray.forEach((g) => {
    if (!ancestorGroupIds.has(g.getObjectId())) {
      withShapesOrGroupsRecursively(g.asGroup().getChildren(), doStuff);
    }
  });
}

function withSelectedOrAllElements(doStuff) {
  getSelectedElementsOnPage(true).forEach((e) => doStuff(e));
}

// Get all selected elements on page as an array. If no elements are selected,
// optionally fall back to all elements on page. If text is selected, get the parent element.
function getSelectedElementsOnPage(shouldFallbackToGetAllElementsOnPage) {
  const selection = SlidesApp.getActivePresentation().getSelection();

  switch (selection.getSelectionType()) {
    case SlidesApp.SelectionType.PAGE_ELEMENT:
    case SlidesApp.SelectionType.TEXT:
      return selection.getPageElementRange().getPageElements();

    case SlidesApp.SelectionType.CURRENT_PAGE:
      return shouldFallbackToGetAllElementsOnPage
        ? selection.getCurrentPage().getPageElements()
        : [];

    default: // deal with remaining SlidesApp.SelectionType cases
      return [];
  }
}
