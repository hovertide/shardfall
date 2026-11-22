'use strict';
/* Loads the game's content + engine into Node (no browser needed).
   Used by tools/check.js and tools/sim.js.
     const { SF, Engine } = require('./load.js')(); */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

module.exports = function load() {
  const root = path.join(__dirname, '..');
  const ctx = vm.createContext({ console });
  const run = (file) => vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), ctx, { filename: file });
  run('manifest.js');
  run('src/registry.js');
  const M = ctx.SHARDFALL_MANIFEST;
  for (const f of [].concat(M.content, M.engine)) {
    ctx.SF._file(f);
    run(f);
  }
  return { SF: ctx.SF, Engine: ctx.Engine, manifest: M, root };
};
