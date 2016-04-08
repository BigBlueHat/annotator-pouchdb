require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"annotator-pouchdb":[function(require,module,exports){
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

},{"./annotator-to-web-annotation.js":1}],1:[function(require,module,exports){
'use strict';

function toWebAnnotation(annotation) {
  return {
    "@type": "oa:Annotation",
    "body": annotation.text,
    "target": {
      "@id": "#resource",
      "@type": "oa:SpecificResource",
      "source": annotation.uri,
      "selector": {
        "@id": "#selectors",
        "@type": "oa:Choice",
        "members": [
          {
            "@id": "#quote",
            "@type": "oa:TextQuoteSelector",
            "exact": annotation.quote
          },
          {
            "@id": "#position",
            "@type": "oa:TextPositionSelector",
            // TODO: handle multiple ranges
            "start": annotation.ranges[0].startOffset,
            "end": annotation.ranges[0].endOffset
          }
        ]
      }
    },
    // TODO: where should we keep the xpath stuff in Web Annotation?
    // ...this key is ugly on purpose...
    "-from-annotator-": annotation
  };
}

function fromWebAnnotation(annotation) {
  if (undefined === annotation['@type']
      || annotation['@type'] !== 'oa:Annotation'
      // TODO: maybe check the @context to be sure we mean `oa:Annotation`?
      || annotation['@type'] !== 'Annotation') {
    // if it's not a Web Annotation, don't change it
    return annotation;
  }
  var rv = {
    "uri": annotation.target.source,
    "quote": "",
    "text": annotation.body,
    "ranges": [{}]
  };

  var selectors = annotation.target.selector.members;
  for (var i = 0; i < selectors.length; i++) {
    if (selectors[i]['@type'] === 'oa:TextQuoteSelector') {
      rv.quote = selectors[i].exact;
    } else if (selectors[i]['@type'] === 'oa:TextPositionSelector') {
      rv.ranges[0].startOffset = selectors[i].start;
      rv.ranges[0].endOffset = selectors[i].end;
    }
  }

  // TODO: handle multiple ranges
  rv.ranges[0].start = annotation['-from-annotator-'].ranges[0].start;
  rv.ranges[0].end = annotation['-from-annotator-'].ranges[0].end;

  return rv;
}

exports.toWebAnnotation = toWebAnnotation;
exports.fromWebAnnotation = fromWebAnnotation;

},{}]},{},[]);
