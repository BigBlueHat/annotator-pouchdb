require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"annotator-pouchdb":[function(require,module,exports){
"use strict";

// PouchDBStorage is a storage component that uses PouchDB to store annotations
// in the browser and synchronize them to a remote CouchDB instance.
function PouchDBStorage (db) {
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

// `db` is a PouchDB database
exports.pouch = function pouch(db) {
  var storage = new PouchDBStorage(db);
  return {
    configure: function (registry) {
      registry.registerUtility(storage, 'storage');
    }
  };
};

},{}]},{},[]);
