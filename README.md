# Annotator PouchDB Storage Plugin

[![npm version](https://img.shields.io/npm/v/annotator-pouchdb.svg)](https://www.npmjs.com/package/annotator-pouchdb)
[![license](https://img.shields.io/github/license/bigbluehat/annotator-pouchdb.svg)](http://www.apache.org/licenses/LICENSE-2.0)

[PouchDB](http://pouchdb.com/) provides a fabulous offline-first storage option
with the power to replicate between [Apache CouchDB](http://couchdb.apache.org)
, [IBM Cloudant](http://cloudant.com/), and others.

## [Annotator](http://annotatorjs.org/) + PouchDB

Annotations are often personal things that you *may* want to share later. This
plugin allows you to add offline-first storage into your Annotator-based
extension, app, or UI.

## Usage

```
$ npm install
$ npm run anno # builds annotator.js
$ npm run dev # builds annotator-pouchdb.js
```

You can then open the included `index.html` file and annotate it, or run it
inside a local web server (try `python -m SimpleHTTPServer` if you have python
handy and are in a hurry).

Use `index.html` as a reference for your project.

## Firefox Extension

There are bundled assets in the `firefox/data` and `firefox/lib` folders that
you will need to update if you change anything, but...if you haven't...

```
$ cd firefox
$ mkdir temp-profile # so you can see annotations post-reload
$ cfx run --profile# rashly assuming you have the Mozilla Add-on SDK installed
```

Then, visit a web page, and Annotate!!!

Close the browser, follow those steps again, annotate some more!! :smiley_cat:

## Replication

Obviously, there comes a time where you might want these annotations to live
in at least one other place. PouchDB supports the Apache CouchDB Replication
Protocol and you can use the [`.sync()`](http://pouchdb.com/api.html#sync)
method to keep your offline-first copy in sync with a remote Apache CouchDB
or IBM Cloudant database.

## License
Apache 2.0
