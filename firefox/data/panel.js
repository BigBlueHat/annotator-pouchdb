addon.port.on('listResources', function(list) {
  var ul = document.getElementById('resource-list');
  // TODO: I'm confident this is bad for one's health...
  ul.innerHTML = '';
  list.resources.forEach(function(resource) {
    var item = document.createElement('li');
    item.innerHTML = '<a target="_blank" href="' + resource.url + '">' + resource.url + '</a>';
    item.innerHTML += ' (' + resource.count + ')';
    ul.appendChild(item);
  });
});

