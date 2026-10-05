import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve,extname} from 'node:path';
import assert from 'node:assert/strict';

const root=resolve('dist'),app=readFileSync(root+'/app.js','utf8');
const server=createServer((req,res)=>{try{
  const name=new URL(req.url,'http://localhost').pathname;
  const path=resolve(root,'.'+(name==='/'?'/index.html':name));
  if(!path.startsWith(root+'/'))throw Error();
  res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.json':'application/json','.flac':'audio/flac','.css':'text/css'})[extname(path)]||'application/octet-stream');
  res.end(readFileSync(path));
}catch{res.writeHead(404);res.end();}});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const browser=await chromium.launch({headless:true,args:['--mute-audio']});
try{
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const errors=[],requests=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(r.url().includes('/audio/'))requests.push(r.url());});
  await page.addInitScript(()=>{window.requestAnimationFrame=()=>1;window.cancelAnimationFrame=()=>{};});
  await page.route('**/app.js*',r=>r.fulfill({contentType:'text/javascript',body:app+'\nwindow.__fireQA={mixer,setScene,pause};'}));
  await page.goto(`http://127.0.0.1:${server.address().port}/`);
  await page.waitForFunction(()=>window.__fireQA,null,{polling:100});
  await page.locator('#scene-trigger').click();await page.locator('[data-world="fireplace"]').click();
  await page.locator('#play-trigger').click();
  await page.waitForFunction(()=>window.__fireQA.mixer.isPlaying&&window.__fireQA.mixer.fireAudio?.active,null,{polling:100,timeout:60000});
  const state=()=>page.evaluate(()=>{const f=window.__fireQA.mixer.fireAudio;return {region:f.currentRegion,desired:f.desiredRegion,voices:[...f.voices.keys()],active:f.active,transition:!!f.transition};});
  const initial=await state();assert.equal(initial.region,'medium');assert.deepEqual(initial.voices,['medium']);
  const slider=async value=>page.locator('#intensity-slider').evaluate((e,value)=>{e.value=String(value);e.dispatchEvent(new Event('input'));},value);
  await slider(0);await page.waitForTimeout(4300);const low=await state();assert.equal(low.region,'low');assert.equal(low.voices.length,1);
  await slider(1000);await page.waitForTimeout(4300);const high=await state();assert.equal(high.region,'medium');assert.equal(high.voices.length,1);
  for(const n of [0,1000,0,1000,0]){await slider(n);assert.ok((await state()).voices.length<=2);await page.waitForTimeout(50);}
  await page.waitForTimeout(4300);const reverse=await state();assert.equal(reverse.region,'low');assert.equal(reverse.voices.length,1);
  await page.locator('#play-trigger').click();assert.equal((await state()).active,false);
  await page.locator('#play-trigger').click();await page.waitForTimeout(400);assert.equal((await state()).active,true);
  assert.deepEqual(errors,[]);assert.ok(!requests.some(r=>/kingsrow|visionear-v1\.flac/.test(r)));
  assert.equal(new Set(requests.filter(r=>r.endsWith('.flac'))).size,2);
  mkdirSync('test-results',{recursive:true});writeFileSync('test-results/browser-fire-audio.json',JSON.stringify({initial,low,high,reverse,errors,requests},null,2));
  console.log('PASS: browser decodes approved FLAC regions; default medium, low/high mapping, rapid reversals, pause/resume, no old audio loads.');
}finally{await browser.close();server.close();}
