'use strict';

var express     = require('express');
var connect     = require('connect');
var less        = require('less-middleware');
var path        = require('path');
var compression = require('compression');

function start(pub, port) {
  var app = express();

  app.use(compression());
  app.use(express.static(pub));
  app.get('*', function(req, res) {
    res.sendFile(pub + '/index.html', 404);
  });

  app.listen(port, '127.0.0.2');

  console.log('serving ' + pub + ' at http://localhost:' + port);
};

start(path.resolve(__dirname + '/../www' ), 80  );
start(path.resolve(__dirname + '/../dist'), 8000);
start(path.resolve(__dirname + '/../s3'),   9000);
