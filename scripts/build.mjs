import {readFileSync, existsSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import assert from 'node:assert/strict';
import './verify-ocean-motion.mjs';

// This app ships source modules directly; the static build validates the exact
// deployment directory without rewriting Rain, audio files or other assets.
for (const file of ['app.js','fireplace.js','fireplace-audio.js','world-art.js','world-icons.js','ocean.js']) {
  const result=spawnSync(process.execPath,['--input-type=module','--check'],{input:readFileSync('dist/'+file),encoding:'utf8'});
  assert.equal(result.status,0,`${file}: ${result.stderr}`);
}
const html=readFileSync('dist/index.html','utf8');
const settings=html.split('id="settings-sheet"')[1].split('</section>')[0];
assert.ok(!/sound-credit|freesound|creativecommons/.test(settings),'Full audio credits must never appear in Gentle settings');
assert.equal((settings.match(/id="credits-trigger"/g)||[]).length,1,'One centralized credits entry');
assert.ok(!/timer/i.test(settings),'Gentle settings must not duplicate the timer');
assert.equal((html.match(/aria-controls="timer-sheet"/g)||[]).length,1,'Top-right Timer is the only timer entry point');
assert.ok(html.includes('id="credits-sheet"'),'Dedicated sound credits surface');
for(const [,path] of html.matchAll(/(?:src|href)="\.\/([^"?]+)(?:\?[^"]*)?"/g)) {
  assert.ok(existsSync('dist/'+path),`Missing entry asset: ${path}`);
}
const app=readFileSync('dist/app.js','utf8');
assert.ok(!/const MARKS|FIRE_MARK|worldArt\(/.test(app),'Keep both icon levels in the family registry, not ad hoc screen-specific maps');
assert.equal((app.match(/worldIcon\(config.id/g)||[]).length,2,'Header and picker use the same family registry');
const {WORLD_ICONS,worldIcon}=await import('../dist/world-icons.js');
const {oceanParameters}=await import('../dist/ocean.js');
assert.ok(existsSync('dist/art/ocean-shell.svg'));
for(let n=1;n<=100;n++)for(const key of Object.keys(oceanParameters(0))){
  assert.ok(Number.isFinite(oceanParameters(n/100)[key]));
  assert.ok(oceanParameters(n/100)[key]>=oceanParameters((n-1)/100)[key]);
}
assert.deepEqual(oceanParameters(-1),oceanParameters(0));
assert.deepEqual(oceanParameters(2),oceanParameters(1));
assert.deepEqual(Object.keys(WORLD_ICONS),['rain','fireplace','forest','ocean','snow','cat']);
assert.equal((WORLD_ICONS.ocean.art.match(/data-wave=/g)||[]).length,3,'Ocean is a multi-curl wave composition');
assert.throws(()=>worldIcon('unregistered'),/No world icon/);
for(const [id,icon] of Object.entries(WORLD_ICONS)){
  assert.ok(worldIcon(id,'header').includes(`data-world-icon="${id}"`));
  if(icon.art)assert.ok(worldIcon(id).includes(`data-world-icon="${id}"`));
}
assert.throws(()=>worldIcon('cat'),/No picker artwork/,'Cat has a reserved header, not an invented playable world');
for(const [,path] of app.matchAll(/url: "\.\/([^"]+)"/g)) assert.ok(existsSync('dist/'+path),`Missing audio: ${path}`);
assert.ok(!app.includes('soft-fire')&&!app.includes('fireMix('),'retire the three normalized Fireplace excerpts');
const fireAudio=readFileSync('dist/fireplace-audio.js','utf8');
assert.equal((fireAudio.match(/\.loop=true/g)||[]).length,1,'shared region-source implementation');
assert.ok(!/CracklePlanner|setInterval|createBiquadFilter|createDynamicsCompressor/.test(fireAudio),'no extra crackles, filtering, or compressor in the Fireplace engine');
const fireManifest=JSON.parse(readFileSync('dist/audio/fireplace-visionear-regions-v2.json'));
assert.equal(fireManifest.events.length,0);assert.equal(fireManifest.deliveryGainDB,0);
assert.equal(fireManifest.transitionSeconds,4);assert.equal(fireManifest.highRegionAvailable,false);
assert.deepEqual(fireManifest.regions.map(r=>r.id),['low','medium']);
for(const r of fireManifest.regions){assert.ok(r.durationSeconds>=40);assert.ok(existsSync('dist/'+r.url.replace('./','')));}
const fire=readFileSync('dist/fireplace.js','utf8');
for(const [,path] of fire.matchAll(/href="\.\/([^"?#]+)"/g)) assert.ok(existsSync('dist/'+path),`Missing fireplace asset: ${path}`);
for(const layer of ['fire-environment','firelight-field','firelight-hearth','fire-structure','fire-glow','fire-coal-bed','fire-lower-flames','fire-flames','fire-log-interleave','fire-logs','fire-log-heat','fire-seam-embers','fire-embers','fire-sparks']) assert.ok(fire.includes(layer),`Missing independent layer: ${layer}`);
assert.ok(!readFileSync('dist/styles.css','utf8').includes('53svh'),'No Fireplace-only scene height');
for(const layer of ['fire-root-system','fire-contact-flames','fire-log-char','fire-contact-hotspots','fire-ember-falls'])assert.ok(fire.includes(layer),`Missing ambient combustion layer: ${layer}`);
console.log('Static build passed: module syntax, entry/audio/art assets, aligned static artwork and independent live fire layers. Deployment directory: dist/');
