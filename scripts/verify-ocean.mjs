import {chromium,webkit} from 'playwright';
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

const engine=process.env.OCEAN_BROWSER||'chromium';
const root=resolve('dist'),out=engine==='webkit'?'test-results/ocean-webkit':'test-results/ocean';mkdirSync(out,{recursive:true});
const server=createServer((req,res)=>{try{const file=resolve(root,'.'+new URL(req.url,'http://localhost').pathname.replace(/\/$/,'/index.html'));if(!file.startsWith(root+'/'))throw Error();res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png'})[extname(file)]||'application/octet-stream');res.end(readFileSync(file));}catch{res.writeHead(404).end();}});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const browser=await ({chromium,webkit})[engine].launch({headless:true}),report=[],shots=[];
const rects=page=>page.evaluate(()=>Object.fromEntries(['.world','#scene-canvas','.top-bar','.scene-mark','.timer-button','.intensity-area','.controls','.play-button'].map(selector=>{const r=document.querySelector(selector).getBoundingClientRect();return[selector,{x:r.x,y:r.y,width:r.width,height:r.height}];})));
const draw=async(page,intensity)=>page.evaluate(intensity=>{const input=document.querySelector('#intensity-slider');input.value=intensity*1000;input.dispatchEvent(new Event('input',{bubbles:true}));const r=window.__oceanQA.renderer;r.transition=null;window.__oceanTime??=1000;for(let n=0;n<300;n++){window.__oceanTime+=1000/60;r.render(r.start+window.__oceanTime);}return{parameters:r.oceanState,pixels:r.canvas.toDataURL()};},intensity);
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
      assert.ok(Math.abs(state.parameters.intensity-intensity)<.001,'smoothly settles at target, not an instant state swap');
      if(previous)assert.notEqual(state.pixels,previous,'every intensity stop visibly changes the water');previous=state.pixels;
      const rail=await page.locator('#range-ink').evaluate(e=>{const b=e.getBoundingClientRect(),s=p=>getComputedStyle(e,p);return {width:b.width,before:parseFloat(s('::before').width),after:parseFloat(s('::after').left)};});
      const center=intensity*(rail.width-25)+12.5;
      assert.ok(Math.abs(rail.before-Math.max(0,center-14))<.1,'rail stops before shell');
      assert.ok(Math.abs(rail.after-(center+14))<.1,'rail resumes after shell');
      const png=await page.screenshot({path:`${out}/${name}`});
      if(viewport.width===390)shots.push({intensity,png:png.toString('base64')});
      report.push({viewport,intensity,parameters:state.parameters,railGap:28,layoutMatchesRain:true});
    }
    const a=await draw(page,.5),b=await draw(page,.5);assert.notEqual(a.pixels,b.pixels,'live gentle movement');
    const performanceReport=await page.evaluate(()=>{
      const r=window.__oceanQA.renderer,NativePath=window.Path2D,rect=Element.prototype.getBoundingClientRect;
      let paths=0,reads=0;const durations=[],steps=[];
      window.Path2D=new Proxy(NativePath,{construct(target,args){paths++;return Reflect.construct(target,args);}});
      Element.prototype.getBoundingClientRect=function(){reads++;return rect.call(this);};
      try{for(let n=0;n<360;n++){
        const before=r.oceanState.intensity;r.setIntensity((Math.sin(n/37)+1)/2);window.__oceanTime+=1000/60;
        const start=performance.now();r.render(r.start+window.__oceanTime);durations.push(performance.now()-start);steps.push(Math.abs(r.oceanState.intensity-before));
      }}finally{window.Path2D=NativePath;Element.prototype.getBoundingClientRect=rect;}
      durations.sort((a,b)=>a-b);
      return {engine:navigator.userAgent,medianDrawMs:durations[180],p95DrawMs:durations[342],maxIntensityStep:Math.max(...steps),newPathsDuring360Frames:paths,layoutReadsDuring360Frames:reads};
    });
    assert.equal(performanceReport.newPathsDuring360Frames,0,'paths are cached, not allocated in animation');
    assert.equal(performanceReport.layoutReadsDuring360Frames,0,'no frame-loop layout reads');
    assert.ok(performanceReport.maxIntensityStep<.027,'rapid drag remains continuous');
    assert.ok(performanceReport.p95DrawMs<16.7,'Ocean draw work fits a 60Hz frame budget in this test browser');
    report.push({viewport,performanceReport});
    await draw(page,.5);
    await page.locator('#intensity-slider').focus();await page.keyboard.press('ArrowRight');
    assert.ok(Number(await page.locator('#intensity-slider').inputValue())>500,'native keyboard range control');
    const range=await page.locator('#intensity-slider').boundingBox();await page.mouse.click(range.x+range.width*.2,range.y+range.height/2);
    assert.ok(Number(await page.locator('#intensity-slider').inputValue())<350,'pointer range control');
    await page.locator('#scene-trigger').click();await page.screenshot({path:`${out}/${viewport.width}-picker.png`});await page.keyboard.press('Escape');
    assert.deepEqual(errors,[]);await page.close();
  }
  // Actual RAF / slider-drag recording, not a montage of still screenshots.
  const live=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true,recordVideo:{dir:out+'/motion',size:{width:390,height:844}}});
  await live.goto(`http://127.0.0.1:${server.address().port}/`);
  await live.locator('#scene-trigger').click();await live.locator('[data-world="ocean"]').click();
  const cadence=await live.evaluate(async()=>{
    const frames=[],start=performance.now(),input=document.querySelector('#intensity-slider');let last;
    await new Promise(done=>{function watch(now){if(last)frames.push(now-last);last=now;const t=(now-start)/1000;input.value=t<2?0:t<5?(t-2)/3*1000:t<7?1000:(1-(t-7)/3)*1000;input.dispatchEvent(new Event('input',{bubbles:true}));if(t<10)requestAnimationFrame(watch);else done();}requestAnimationFrame(watch);});
    frames.sort((a,b)=>a-b);return{frameCount:frames.length,medianIntervalMs:frames[Math.floor(frames.length*.5)],p95IntervalMs:frames[Math.floor(frames.length*.95)],over50ms:frames.filter(v=>v>50).length};
  });
  report.push({actualRAF:cadence,engine,scope:'Browser emulation on CI, not physical iPhone certification'});await live.close();
  const review=await browser.newPage({viewport:{width:1250,height:590},deviceScaleFactor:1});
  await review.setContent('<style>body{margin:0;padding:15px;display:flex;gap:12px;background:#fbfbfc;font:14px system-ui;color:#648ea9}figure{margin:0;width:234px;text-align:center}img{width:234px;border:1px solid #e3e9ed;border-radius:16px}figcaption{margin:10px}</style>'+shots.map(({intensity,png},n)=>`<figure><img src="data:image/png;base64,${png}"><figcaption>${['Calm','Light ripple','Gentle waves','Rolling waves','Lively waves'][n]} · ${intensity*100}%</figcaption></figure>`).join(''));
  await review.screenshot({path:`${out}/five-stages.png`});await review.close();
  writeFileSync(`${out}/report.json`,JSON.stringify(report,null,2));
  console.log('PASS Ocean: 5 continuous stages, 3 portrait sizes, Rain geometry, live motion, shell rail gap, keyboard/pointer control, unchanged audio.');
}finally{await browser.close();await new Promise(done=>server.close(done));}
