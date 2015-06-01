var self = require("sdk/self");
var tabs = require("sdk/tabs");
var { indexedDB } = require('sdk/indexed-db');

var PouchDB = require('pouchdb.js');
var db = new PouchDB('annotator-offline');

// by URI filtering
var ddoc = {
  _id: '_design/annotator',
  views: {
    annotations: {
      map: function(doc) {
        if ('uri' in doc && 'ranges' in doc) {
          emit(doc.uri, 1);
        }
      }.toString()
    }
  }
};
db.put(ddoc)
  .catch(function(err) {
    if (err.status !== 409) {
      throw err;
    }
    // ignore if doc already exists
  });

var button = require("sdk/ui/button/action").ActionButton({
  id: "style-tab",
  label: "Style Tab",
  icon: "./icon-16.png",
  onClick: function() {
    var worker = tabs.activeTab.attach({
      contentScriptFile: [
        self.data.url('annotator.js'),
        self.data.url('annotator-pouchdb.js'),
        self.data.url('inject.js')
      ]
    });
    // TODO: ...kill the copy/paste...
    var storage = {
      'create': function (annotation) {
        annotation.id = PouchDB.utils.uuid();
        annotation._id = annotation.id;
        return db.post(annotation)
          .then(function(resp) {
            annotation._rev = resp.rev;
            return annotation;
          })
          .catch(console.log.bind(console));
      },

      'update': function (annotation) {
        return db.put(annotation)
          .then(function(resp) {
            annotation._rev = resp.rev;
            return annotation;
          })
          .catch(console.log.bind(console));
      },

      'delete': function (annotation) {
        return db.remove(annotation)
          .then(function(resp) {
            return annotation;
          })
          .catch(console.log.bind(console));
      },

      'query': function (queryObj) {
        queryObj.reduce = false;
        queryObj.include_docs = true;
        return db.query('annotator/annotations', queryObj)
          .then(function(resp) {
            var annotations = [];
            for (var i = 0; i < resp.rows.length; i++) {
              annotations.push(resp.rows[i].doc);
            }
            return {
              results: annotations,
              metadata: {
                total: resp.rows.length
              }
            };
          })
          .catch(console.log.bind(console));
      }
    };

    // TODO: wow! look at the pretty pattern!!1! >_<
    worker.port.on('createAnnotation', function(obj) {
      storage.create(obj);
    });
    worker.port.on('updateAnnotation', function(obj) {
      storage.update(obj);
    });
    worker.port.on('deleteAnnotation', function(obj) {
      storage['delete'](obj);
    });
    worker.port.on('queryAnnotations', function(obj) {
      var resp = storage.query(obj);
      resp.then(function(annotations) {
        worker.port.emit('loadAnnotations', annotations);
      });
    });
  }
});
