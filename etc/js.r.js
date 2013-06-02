({
  optimize:                "uglify2"
, mainConfigFile:          "../www/boot.js"
, preserveLicenseComments: false
, name:                    "boot"
, out:                     "../dist/index.js"
, paths:                   { requireLib: 'lib/require' }
, include:                 'requireLib'
, uglify2:                 { 
    mangle: false
  , compress: {
      global_defs: {
        RMR_DEBUG:     false 
      }
    }
  }
})
