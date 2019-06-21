// ELEMENT SELECTION FUNCTIONS

function withSelectedOrAllShapes(doStuff) {
    getSelectedElementsOnPage(true)
      .filter (function(e) { return e.getPageElementType() == SlidesApp.PageElementType.SHAPE; })
      .forEach(function(e) { doStuff(e.asShape()); });
  }
  function withSelectedElements(doStuff) {
    getSelectedElementsOnPage(false)
      .forEach(function (e) { doStuff(e); });
  }
  function withSelectedOrAllElements(doStuff) {
    getSelectedElementsOnPage(true)
      .forEach(function (e) { doStuff(e); });
  }
  
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