var ws = require('ws');

var s;

var reset = function () { s = null; throw 'exception'; };

function connect() {
  if (s) return;

  s = new ws('ws://ws.blockchain.info/inv');

  s.on('open', function () {
    s.send('{"op":"unconfirmed_sub"}');
    s.send('{"op":"blocks_sub"}'     );
  });

  s.on('message', function (msg) {
    console.log(msg);
  });

  s.on('close', reset);
  s.on('error', reset);
};

process.on('uncaughtException', function() {
  connect();
});

reset();
