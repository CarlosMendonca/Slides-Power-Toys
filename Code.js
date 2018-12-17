function myFunction() {
  
}

function applyParanoia() {
  var presentation = SlidesApp.getActivePresentation();
  var selection = presentation.getSelection();
  
  var i = 0;
  selection.getCurrentPage().getPageElements().forEach(function(e) {
    applyParanoiaToShape(e.asShape());
    i++;
  });
  
  Logger.log("Applied paranoia to " + i + " shape(s).");
}