(function () {
  function load(srcs) {
    var head   = document.getElementsByTagName('head')[0];
    var script = document.createElement('script');
    var src = srcs.shift();
    if (srcs.length > 0) {
      script.onload = load.bind(undefined, srcs);
    }
    script.type = 'text/javascript';
    script.src  = src;
    head.appendChild(script);
  }

  load(['lib/require.js', 'boot.js']);
})();
