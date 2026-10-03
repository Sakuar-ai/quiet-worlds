import {readFileSync, existsSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import assert from 'node:assert/strict';

// This app ships source modules directly; the static build validates the exact
// deployment directory without rewriting Rain, audio files or other assets.
for (const file of ['app.js','fireplace.js','world-art.js']) {
  const result=spawnSync(process.execPath,['--input-type=module','--check'],{input:readFileSync('dist/'+file),encoding:'utf8'});
  assert.equal(result.status,0,`${file}: ${result.stderr}`);
}
const html=readFileSync('dist/index.html','utf8');
for(const [,path] of html.matchAll(/(?:src|href)="\.\/([^"?]+)(?:\?[^"]*)?"/g)) {
  assert.ok(existsSync('dist/'+path),`Missing entry asset: ${path}`);
}
const app=readFileSync('dist/app.js','utf8');
for(const [,path] of app.matchAll(/url: "\.\/([^"]+)"/g)) assert.ok(existsSync('dist/'+path),`Missing audio: ${path}`);
assert.ok(!readFileSync('dist/fireplace.js','utf8').includes('<image'),'Fireplace must remain a minimal live SVG, not a raster illustration');
assert.ok(!readFileSync('dist/styles.css','utf8').includes('53svh'),'No Fireplace-only scene height');
console.log('Static build passed: module syntax, entry assets, audio assets, minimal live SVG. Deployment directory: dist/');
