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
