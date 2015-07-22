"use strict";

var toWebAnnotation = require('./annotator-to-web-annotation.js').toWebAnnotation;
var fromWebAnnotation = require('./annotator-to-web-annotation.js').fromWebAnnotation;

// PouchDBStorage is a storage component that uses PouchDB to store annotations
// in the browser and synchronize them to a remote CouchDB instance.
function PouchDBStorage (db) {
  // by URI filtering
  var ddoc = {
    _id: '_design/annotator',
    views: {
      annotations: {
        map: function(doc) {
          if (undefined !== doc.uri && undefined !== doc.ranges) {
            emit(doc.uri, 1);
          } else if (undefined !== doc['@type']
              && doc['@type'] === 'oa:Annotation') {
            emit(doc.target.source, 1);
          }
        }.toString()
      }
    }
  };
  // update the ddoc
  db.get(ddoc._id).then(function(stored_doc) {
    ddoc._rev = stored_doc._rev;
    return db.put(ddoc);
  }).then(function(resp) {
    // TODO: maybe do something to confirm it's been stored
  }).catch(function(err) {
    // store the ddoc for the first time; if it's missing
    if (err.status === 404) {
      db.put(ddoc).catch(console.log.bind(console));
    }
  });

  return {
    'create': function (annotation) {
      annotation = toWebAnnotation(annotation);
      annotation.id = PouchDB.utils.uuid();
      annotation._id = annotation.id;
      return db.post(annotation)
        .then(function(resp) {
          annotation._rev = resp.rev;
          return annotation;
        })
        .catch(console.log.bind(console));
    },

    'update': function (original) {
      var annotation = toWebAnnotation(original);
      annotation._id = _id;
      annotation._rev = _rev;
      return db.put(annotation)
        .then(function(resp) {
          original._rev = resp.rev;
          // send the original, Annotator friendly thing, back to Annotator
          return original;
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
            var annotation = fromWebAnnotation(resp.rows[i].doc);
            annotations.push(annotation);
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
}

// `db` is a PouchDB database
exports.pouch = function pouch(db) {
  var storage = new PouchDBStorage(db);
  return {
    configure: function (registry) {
      registry.registerUtility(storage, 'storage');
    }
  };
};
