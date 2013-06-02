var ws  = require('ws');
var s = new ws.Server({port: 1337});

var open = [];

// okay, need to server html as well as websocket

console.log('starting server on port 1337');

s.on('connection', function (c) {
  console.log('connection');

  open.push(c);

  c.on('close', function () {
    var i = open.indexOf(this);
    console.log('closing connection:', i);
    if (i >= 0) { open.splice(i, 1); }
  });

  c.on('message', function (message) {
    console.log('got message:', message);
    console.log('sending to clients:', open.length);
    for (var i = 0; i < open.length; i++) {
      open[i].send(message);
    }
  });
});
