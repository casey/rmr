'use strict';

window.RMR_DEBUG = true;

require.config({
  paths: {
    qunit:               'lib/qunit'
  , angular:             'lib/angular'
  , 'angular-route':     'lib/angular-route'
  , jquery:              'lib/jquery'
  , lodash:              'lib/lodash'
  , 'underscore.string': 'lib/underscore.string'
  , bootstrap:           'lib/bootstrap'
  , backbone:            'lib/backbone'
  , peg:                 'lib/peg'
  , underscore:          'lib/lodash'
  , text:                'lib/text'
  , ga:                  'lib/ga'
  , modernizr:           'lib/modernizr'
  , q:                   'lib/q'
  , machine:             'lib/state-machine'
  , goog:                'lib/goog'
  , jmb:                 'lib/jazzmidibridge'
  , dsp:                 'lib/dsp'
  , audiocontext:        'lib/audiocontext'
  , webgldebug:          'lib/webgldebug'
  }
, shim: {
    'bootstrap'     : {                             deps: ['jquery' ] }
  , 'webgldebug'    : { exports: 'WebGLDebugUtils', deps: ['_'      ] }
  , 'backbone'      : { exports: 'Backbone',        deps: ['_'      ] }
  , 'angular'       : { exports: 'angular',         deps: ['jquery' ] }
  , 'angular-route' : {                             deps: ['angular'] }
  , 'underscore'    : { exports: '_'                                  }
  , 'goog'          : { exports: 'goog'                               }
  , 'qunit'         : { exports: 'QUnit'                              }
  , 'peg'           : { exports: 'PEG'                                }
  , 'jquery'        : { exports: '$'                                  }
  }
});

require(['app']);
