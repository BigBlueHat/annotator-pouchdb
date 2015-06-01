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
  .include(function() {
    var StorageShim = function() {
      var curry = function(name) {
        return function(obj) {
          self.port.emit(name + 'Annotation', obj);
          return obj;
        }
      };
      return {
        'create': curry('create'),
        'update': curry('update'),
        'delete': curry('delete'),
        'query': curry('query')
      };
    };

    var storage = new StorageShim();
    return {
      configure: function (registry) {
        registry.registerUtility(storage, 'storage');
      }
    }
  })
.start()
  .then(function() {
    self.port.emit('queryAnnotations', {key: location.href});
  });

self.port.on('loadAnnotations', function(annotations) {
  anno.runHook('annotationsLoaded', [annotations.results]);
});
