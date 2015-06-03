function card(annotation) {

  // TODO: ...no "semantic" id as these are local only...interesting problem
  var template = ' \
<blockquote>' + annotation.quote + '</blockquote>\n\
<section>' + annotation.text + '</section>\n\
';
  var aside = document.createElement('aside');
  aside.innerHTML = template;
  return aside;
}

addon.port.on('listAnnotations', function(list) {
  var div = document.getElementById('annotation-list');
  // TODO: I'm confident this is bad for one's health...
  div.innerHTML = '';
  list.annotations.forEach(function(annotation) {
    div.appendChild(card(annotation));
  });
});
