'use strict';
/* =====================================================================
   SHARDFALL - boot.js
   Loads every file listed in manifest.js, one after another, in order.
   (Browsers block ES modules on file://, so plain scripts + a manifest
   keep the game runnable by just double-clicking index.html.)
   ===================================================================== */
(function () {
  const M = SHARDFALL_MANIFEST;
  const files = [].concat(M.content, M.engine, M.ui);
  const screen = document.getElementById('screen');
  let i = 0, loaded = false;

  function fail(msg) {
    screen.style.whiteSpace = 'pre-wrap';
    screen.style.color = '#ff6b6b';
    screen.style.fontSize = '16px';
    screen.textContent = 'SHARDFALL failed to start.\n\n' + msg + '\n\nOpen the browser console (F12) for details.';
  }

  // Only report errors that happen while files are still loading.
  window.addEventListener('error', (e) => {
    if (!loaded) fail(`${files[i - 1] || 'a script'} (line ${e.lineno}):\n${e.message}`);
  });

  function next() {
    if (i >= files.length) { loaded = true; return; }
    const name = files[i++];
    SF._file(name);
    const el = document.createElement('script');
    el.src = name;
    el.onload = next;
    el.onerror = () => fail(`Could not load "${name}".\nIs it listed in manifest.js with the right path?`);
    document.body.appendChild(el);
  }
  next();
})();
