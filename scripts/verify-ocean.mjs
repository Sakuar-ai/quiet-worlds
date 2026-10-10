import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {resolve,extname} from 'node:path';
import assert from 'node:assert/strict';

const app=readFileSync('dist/app.js','utf8');
const baseline='3ee427eaf37f762b9f35a8550bf81836ccb1ef20';
const before=execFileSync('git',['show',`${baseline}:dist/app.js`],{encoding:'utf8'});
const audio=s=>s.slice(s.indexOf('class AudioMixer'),s.indexOf('class IntensitySlider'));
assert.equal(audio(app),audio(before),'Every world retains its audio behavior');
const config=s=>Function(s.slice(s.indexOf('const SCENES'),s.indexOf('class SceneRenderer'))+';return SCENES;')();
for(const id of Object.keys(config(before)))assert.deepEqual(config(app)[id].audio,config(before)[id].audio,`${id}: audio configuration unchanged`);
for(const file of ['fireplace.js','fireplace-audio.js'])assert.equal(readFileSync('dist/'+file,'utf8'),execFileSync('git',['show',`${baseline}:dist/${file}`],{encoding:'utf8'}));

const root=resolve('dist'),out='test-results/ocean';mkdirSync(out,{recursive:true});
const server=createServer((req,res)=>{try{const file=resolve(root,'.'+new URL(req.url,'http://localhost').pathname.replace(/\/$/,'/index.html'));if(!file.startsWith(root+'/'))throw Error();res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png'})[extname(file)]||'application/octet-stream');res.end(readFileSync(file));}catch{res.writeHead(404).end();}});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const browser=await chromium.launch({headless:true}),report=[],shots=[];
const rects=page=>page.evaluate(()=>Object.fromEntries(['.world','#scene-canvas','.top-bar','.scene-mark','.timer-button','.intensity-area','.controls','.play-button'].map(selector=>{const r=document.querySelector(selector).getBoundingClientRect();return[selector,{x:r.x,y:r.y,width:r.width,height:r.height}];})));
const draw=async(page,intensity,time=5000)=>page.evaluate(({intensity,time})=>{const input=document.querySelector('#intensity-slider');input.value=intensity*1000;input.dispatchEvent(new Event('input',{bubbles:true}));const r=window.__oceanQA.renderer;r.transition=null;r.render(r.start+time);return{parameters:r.oceanState,pixels:r.canvas.toDataURL()};},{intensity,time});
try{
  for(const viewport of [{width:390,height:844},{width:375,height:667},{width:430,height:932}]){
    const page=await browser.newPage({viewport,deviceScaleFactor:2,isMobile:true,hasTouch:true}),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.addInitScript(()=>{requestAnimationFrame=()=>1;cancelAnimationFrame=()=>{};});
    await page.route('**/app.js*',r=>r.fulfill({contentType:'text/javascript',body:app+'\nwindow.__oceanQA={renderer,setScene,slider,pause};'}));
    await page.goto(`http://127.0.0.1:${server.address().port}/`);await page.waitForFunction(()=>window.__oceanQA);
    await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(150);
    const rain=await rects(page);
    await page.locator('#scene-trigger').click();await page.locator('[data-world="ocean"]').click();
    await page.addStyleTag({content:'*,*::before,*::after{transition:none!important;animation:none!important}'});
    await page.waitForTimeout(150);
    assert.deepEqual(await rects(page),rain,'Ocean inherits Rain scene area, spacing and control hierarchy');
    assert.equal(await page.locator('#scene-mark svg').getAttribute('data-world-icon'),'ocean');
    assert.equal(await page.locator('#scene-mark [data-icon-art] path').count(),1,'header is one small wave-line emblem');
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'no horizontal overflow');
    let previous;
    for(const intensity of [0,.25,.5,.75,1]){
      const state=await draw(page,intensity),name=`${viewport.width}x${viewport.height}-${intensity*100}.png`;
      assert.equal(state.parameters.intensity,intensity);
      if(previous)assert.notEqual(state.pixels,previous,'every intensity stop visibly changes the water');previous=state.pixels;
      const rail=await page.locator('#range-ink').evaluate(e=>{const b=e.getBoundingClientRect(),s=p=>getComputedStyle(e,p);return {width:b.width,before:parseFloat(s('::before').width),after:parseFloat(s('::after').left)};});
      const center=intensity*(rail.width-25)+12.5;
      assert.ok(Math.abs(rail.before-Math.max(0,center-14))<.1,'rail stops before shell');
      assert.ok(Math.abs(rail.after-(center+14))<.1,'rail resumes after shell');
      const png=await page.screenshot({path:`${out}/${name}`});
      if(viewport.width===390)shots.push({intensity,png:png.toString('base64')});
      report.push({viewport,intensity,parameters:state.parameters,railGap:28,layoutMatchesRain:true});
    }
    const a=await draw(page,.5,5000),b=await draw(page,.5,8000);assert.notEqual(a.pixels,b.pixels,'live gentle movement');
    await page.locator('#intensity-slider').focus();await page.keyboard.press('ArrowRight');
    assert.ok(Number(await page.locator('#intensity-slider').inputValue())>500,'native keyboard range control');
    const range=await page.locator('#intensity-slider').boundingBox();await page.mouse.click(range.x+range.width*.2,range.y+range.height/2);
    assert.ok(Number(await page.locator('#intensity-slider').inputValue())<350,'pointer range control');
    await page.locator('#scene-trigger').click();await page.screenshot({path:`${out}/${viewport.width}-picker.png`});await page.keyboard.press('Escape');
    assert.deepEqual(errors,[]);await page.close();
  }
  const review=await browser.newPage({viewport:{width:1250,height:590},deviceScaleFactor:1});
  await review.setContent('<style>body{margin:0;padding:15px;display:flex;gap:12px;background:#fbfbfc;font:14px system-ui;color:#648ea9}figure{margin:0;width:234px;text-align:center}img{width:234px;border:1px solid #e3e9ed;border-radius:16px}figcaption{margin:10px}</style>'+shots.map(({intensity,png},n)=>`<figure><img src="data:image/png;base64,${png}"><figcaption>${['Calm','Light ripple','Gentle waves','Rolling waves','Lively waves'][n]} · ${intensity*100}%</figcaption></figure>`).join(''));
  await review.screenshot({path:`${out}/five-stages.png`});await review.close();
  writeFileSync(`${out}/report.json`,JSON.stringify(report,null,2));
  console.log('PASS Ocean: 5 continuous stages, 3 portrait sizes, Rain geometry, live motion, shell rail gap, keyboard/pointer control, unchanged audio.');
}finally{await browser.close();await new Promise(done=>server.close(done));}
