"use strict";

var PouchDB = require('pouchdb');
window.PouchDB = PouchDB;

// PouchDBStorage is a storage component that uses PouchDB to store annotations
// in the browser and synchronize them to a remote CouchDB instance.
function PouchDBStorage (options) {
  // db is now a string; upgrade it to a PouchDB
  var db = PouchDB(options);
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

  return {
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
}

// `options` are straight-up PouchDB options at this point
exports.pouch = function pouch(options) {
  var storage = new PouchDBStorage(options);
  return {
    configure: function (registry) {
      registry.registerUtility(storage, 'storage');
    }
  };
};
