var data = require("sdk/self").data;
var tabs = require("sdk/tabs");
var { indexedDB } = require('sdk/indexed-db');
var { ToggleButton } = require("sdk/ui/button/toggle");

// Cribbed from http://github.com/hypothesis/h
// BSD licensed
var icons = {
  'sleeping': {
    "18": data.url('images/toolbar-inactive.png'),
    "32": data.url('images/menu-item.png'),
    "36": data.url('images/toolbar-inactive@2x.png'),
    "64": data.url('images/menu-item@2x.png')
  },
  // for all occasionas
  'active': {
    "18": data.url('images/toolbar-active.png'),
    "32": data.url('images/menu-item.png'),
    "36": data.url('images/toolbar-active@2x.png'),
    "64": data.url('images/menu-item@2x.png')
  }
};

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

// Actual Annotation Storage System
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

var button = ToggleButton({
  id: "open-annotation-sidebar",
  label: "Open Annotations Sidebar",
  icon: icons.sleeping,
  onChange: function(state) {
    if (state.checked) {
      sidebar.show();
    }
    else {
      sidebar.hide();
    }
  }
});

// Annotation Sidebar Super System
var sidebar = require("sdk/ui/sidebar").Sidebar({
  id: 'annotations-sidebar',
  title: 'Annotations',
  url: data.url("sidebar.html"),
  onReady: function(worker) {
    worker.port.on('cardClick', function(url) {
      tabs.activeTab.url = url;
    });

    function sidebarAnnotations() {
      db.query('annotator/annotations', {reduce: false, include_docs: true})
        .then(function(resp) {
          var annotations = [];
          for (var i = 0; i < resp.rows.length; i++) {
            annotations.push(resp.rows[i].doc);
          }
          sidebar.title = resp.rows.length + ' Annotations';
          worker.port.emit('listAnnotations', {
            total: resp.rows.length,
            annotations: annotations});
        });
    }

    sidebarAnnotations();

    db.changes({since: 'now', live: true})
      .on('change', function(change) {
        // ignore the actual change, but update the query
        sidebarAnnotations();
      })
      .on('error', function(err) {
        console.log(err);
      });
  }
});

// Annotate All the Tabs!
tabs.on('ready', function(tab) {
  var worker = tab.attach({
    contentScriptFile: [
      data.url('annotator.js'),
      data.url('annotator-pouchdb.js'),
      data.url('inject.js')
    ]
  });
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
});
