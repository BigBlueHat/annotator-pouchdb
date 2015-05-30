document.body.style.border = "5px solid red";

var annotator = require('annotator');
var anno = new annotator.App();
anno
  .include(annotator.ui.main,
    {element: document.getElementById('airlock')})
  .include(function() {
    return {
      beforeAnnotationCreated: function(annotation) {
        annotation.uri = window.location.href;
      }
    }
  })
  .include(require('annotator-pouchdb').pouch,
    {name: 'annotator-offline'})
.start()
  .then(function() {
    anno.annotations.load({key: location.href});
  });
