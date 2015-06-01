function card(annotation) {

  // TODO: ...no "semantic" id as these are local only...interesting problem
  var template = ' \
<blockquote>' + annotation.quote + '</blockquote>\n\
<section>' + annotation.text + '</section>\n\
<footer>On\n\
  <a href="' + annotation.uri + '">' + annotation.uri + '\n\
</a></footer>\n\
';
  var aside = document.createElement('aside');
  aside.onclick = function() {
    addon.port.emit('cardClick',
      aside.querySelector('footer a').href);
  };
  aside.innerHTML = template;
  return aside;
}

addon.port.on('listAnnotations', function(list) {
  var div = document.getElementById('annotation-list');
  list.annotations.forEach(function(annotation) {
    div.appendChild(card(annotation));
  });
});
