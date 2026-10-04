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
const fire=readFileSync('dist/fireplace.js','utf8');
for(const [,path] of fire.matchAll(/href="\.\/([^"?#]+)"/g)) assert.ok(existsSync('dist/'+path),`Missing fireplace asset: ${path}`);
for(const layer of ['fire-environment','firelight-field','firelight-hearth','fire-structure','fire-glow','fire-coal-bed','fire-lower-flames','fire-flames','fire-log-interleave','fire-logs','fire-log-heat','fire-seam-embers','fire-embers','fire-sparks']) assert.ok(fire.includes(layer),`Missing independent layer: ${layer}`);
assert.ok(!readFileSync('dist/styles.css','utf8').includes('53svh'),'No Fireplace-only scene height');
for(const layer of ['fire-root-system','fire-contact-flames','fire-log-char','fire-contact-hotspots','fire-ember-falls'])assert.ok(fire.includes(layer),`Missing ambient combustion layer: ${layer}`);
console.log('Static build passed: module syntax, entry/audio/art assets, aligned static artwork and independent live fire layers. Deployment directory: dist/');
