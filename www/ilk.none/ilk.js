'use strict';

define(function(require) {
var rmr = require('rmr');

var none = rmr.ilk('none');

none.node.void  = function () { rmr.die('none.node.void: cannot void a none node'); };
none.node.basic = function () { return this.ilk('basic');                           };
none.node.flat  = function () { return this.ilk('flat');                            };

Object.seal(none);

});
