'use strict';

define(function(require) {
  var _         = require('lodash');
  var _string   = require('underscore.string');

  _.mixin(_string.exports());

  return _;
});
