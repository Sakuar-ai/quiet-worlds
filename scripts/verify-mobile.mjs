import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {resolve,extname} from 'node:path';
import assert from 'node:assert/strict';

const baseline='43dd22fdbcb7eb2e902e4a83ef56b459e8c89e22';
const previous=name=>execFileSync('git',['show',`${baseline}:dist/${name}`],{encoding:'utf8'});
const oldApp=previous('app.js'),oldCss=previous('styles.css');
const app=readFileSync('dist/app.js','utf8');
// No behavior or audio code is changed; only the Fireplace module cache key.
assert.equal(app.replace(/fireplace\.js\?v=phase2a-\d+/,'fireplace.js?v=phase2a-7'),oldApp);
assert.equal(readFileSync('dist/styles.css','utf8'),oldCss);
const artPath='dist/art/fireplace-reference-v6.png';
assert.ok(readFileSync(artPath).equals(execFileSync('git',['show',`${baseline}:${artPath}`],{maxBuffer:8*1024*1024})), 'existing fireplace artwork must remain byte-identical');
assert.equal(readFileSync('dist/world-art.js','utf8'),previous('world-art.js'));
const oldFire=previous('fireplace.js'),fire=readFileSync('dist/fireplace.js','utf8');
const mix=source=>source.slice(source.indexOf('export function fireMix'),source.indexOf('export class FireplaceRenderer')).trim();
assert.equal(mix(fire),mix(oldFire));

const dir=resolve('dist'),mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.wav':'audio/wav','.mp3':'audio/mpeg'};
const server=createServer((req,res)=>{try{const name=decodeURIComponent(new URL(req.url,'http://localhost').pathname),file=resolve(dir,'.'+(name==='/'?'/index.html':name));if(!file.startsWith(dir+'/'))throw Error('Invalid path');res.setHeader('Content-Type',mime[extname(file)]||'application/octet-stream');res.end(readFileSync(file));}catch{res.writeHead(404);res.end();}});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const url=`http://127.0.0.1:${server.address().port}/`;
mkdirSync('test-results',{recursive:true});
const browser=await chromium.launch({headless:true});
const measurements=[];
const selectors=['.app','.top-bar','.world','#scene-canvas','.title-lockup h1','.scene-mark','.scene-mark svg','.timer-button','.timer-button svg','.intensity-area','.intensity-copy','.range-wrap','.controls','.play-button','.controls .icon-button'];
const measure=page=>page.evaluate(selectors=>Object.fromEntries(selectors.map(selector=>{const e=document.querySelector(selector),b=e.getBoundingClientRect(),s=getComputedStyle(e);return [selector,{x:b.x,y:b.y,width:b.width,height:b.height,fontSize:s.fontSize,fontWeight:s.fontWeight,padding:s.padding,strokeWidth:s.strokeWidth}];})),selectors);
const makePage=async(viewport,old=false)=>{
  const page=await browser.newPage({viewport,deviceScaleFactor:2,isMobile:true,hasTouch:true});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  // Freeze only the test animation clock, then render each scene at a known time.
  await page.addInitScript(()=>{window.requestAnimationFrame=()=>1;window.cancelAnimationFrame=()=>{};});
  await page.route('**/app.js*',r=>r.fulfill({contentType:'text/javascript',body:(old?oldApp:app)+'\nwindow.__sceneQA={renderer,setScene};'}));
  if(old)await page.route('**/styles.css*',r=>r.fulfill({contentType:'text/css',body:oldCss}));
  if(old)await page.route('**/fireplace.js*',r=>r.fulfill({contentType:'text/javascript',body:oldFire}));
  await page.goto(url);await page.waitForFunction(()=>window.__sceneQA);
  await page.addStyleTag({content:'*,*::before,*::after{transition:none!important;animation:none!important}'});
  // Let the initial ResizeObserver and fonts settle before drawing the frozen frame.
  await page.evaluate(()=>document.fonts.ready);
  await page.waitForTimeout(150);
  await page.evaluate(()=>{const r=window.__sceneQA.renderer;r.resize();r.render(r.start+3000);});
  return {page,errors};
};
try {
  for(const viewport of [{width:390,height:844},{width:393,height:852},{width:375,height:812},{width:430,height:932},{width:375,height:667}]){
    const key=`${viewport.width}x${viewport.height}`,old=await makePage(viewport,true),current=await makePage(viewport);
    const before=await measure(old.page),rain=await measure(current.page);
    assert.deepEqual(rain,before,`${key}: approved Rain layout must remain identical`);
    for(const page of [old.page,current.page])await page.evaluate(()=>{const r=window.__sceneQA.renderer;r.render(r.start+3000);});
    const oldPng=await old.page.screenshot({path:`test-results/${key}-rain-baseline.png`}),rainPng=await current.page.screenshot({path:`test-results/${key}-rain.png`});
    const canvasPixels=page=>page.locator('#scene-canvas').evaluate(e=>e.toDataURL());
    assert.equal(await canvasPixels(current.page),await canvasPixels(old.page),`${key}: Rain drawing must remain pixel-identical`);
    // Chromium may composite the thin rounded slider rail with slightly different
    // antialiasing when the hidden SVG layer changes. Everything outside the rail
    // area must remain byte-identical; inside it require identical computed CSS
    // (including both pseudo-elements) and less than 0.1% differing screen pixels.
    const railStyles=page=>page.locator('#range-ink').evaluate(e=>['','::before','::after'].map(pseudo=>{const s=getComputedStyle(e,pseudo||null);return Object.fromEntries([...s].map(key=>[key,s.getPropertyValue(key)]));}));
    assert.deepEqual(await railStyles(current.page),await railStyles(old.page),`${key}: Rain slider CSS must remain identical`);
    const pixelDiff=await current.page.evaluate(async([a,b])=>{
      const pixels=async base64=>{const image=new Image();image.src='data:image/png;base64,'+base64;await image.decode();const c=document.createElement('canvas');c.width=image.width;c.height=image.height;const ctx=c.getContext('2d');ctx.drawImage(image,0,0);return {data:ctx.getImageData(0,0,c.width,c.height).data,width:c.width,height:c.height};};
      const p=await pixels(a),q=await pixels(b),r=document.querySelector('.range-wrap').getBoundingClientRect(),scale=devicePixelRatio;
      let changed=0,outsideRail=0,maxDifference=0;
      for(let n=0;n<p.data.length;n+=4){let difference=0;for(let ch=0;ch<4;ch++)difference=Math.max(difference,Math.abs(p.data[n+ch]-q.data[n+ch]));if(difference){changed++;maxDifference=Math.max(maxDifference,difference);const x=n/4%p.width,y=Math.floor(n/4/p.width);if(x<r.left*scale||x>r.right*scale||y<r.top*scale||y>r.bottom*scale)outsideRail++;}}
      return {changed,outsideRail,maxDifference,total:p.width*p.height};
    },[oldPng.toString('base64'),rainPng.toString('base64')]);
    assert.equal(pixelDiff.outsideRail,0,`${key}: Rain UI changed outside slider antialiasing`);
    assert.ok(pixelDiff.changed/pixelDiff.total<.001,`${key}: rail rendering changed: ${JSON.stringify(pixelDiff)}`);
    await current.page.locator('#scene-trigger').click();
    await current.page.locator('[data-world="fireplace"]').click();
    await current.page.evaluate(()=>{const r=window.__sceneQA.renderer;r.transition=null;r.render(r.start+3000);});
    // Wait for the shared static PNG used by the rear scene and front-log cutout.
    await current.page.evaluate(async()=>{const image=new Image();image.src='./art/fireplace-reference-v6.png';await image.decode();});
    const fireplace=await measure(current.page);
    assert.deepEqual(fireplace,rain,`${key}: Fireplace must inherit Rain geometry and control hierarchy`);
    const geometry=await current.page.evaluate(()=>{
      const q=selector=>document.querySelector(selector),rect=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height};};
      const r=window.__sceneQA.renderer,world=rect(q('#scene-canvas')),subject=rect(q('.fire-masonry-bounds'));
      const data=r.rainWater.getContext('2d').getImageData(0,0,r.rainWater.width,r.rainWater.height).data;
      let waterInk=0;for(let n=3;n<data.length;n+=4)waterInk+=data[n]/255;
      return {world,svg:rect(q('.fireplace-world')),subject,subjectWidthRatio:subject.width/world.width,subjectHeightRatio:subject.height/world.height,waterInkFraction:waterInk/(data.length/4),paper:getComputedStyle(q('.app')).backgroundColor,overflow:document.documentElement.scrollWidth>innerWidth};
    });
    assert.deepEqual(geometry.svg,geometry.world,`${key}: SVG and Rain canvas boxes match`);
    assert.ok(geometry.subjectWidthRatio>=.68&&geometry.subjectWidthRatio<=.72,`${key}: target 68–72% masonry width`);
    assert.ok(geometry.subjectHeightRatio>.2&&geometry.subjectHeightRatio<.4,`${key}: natural artwork proportions and white negative space`);
    assert.ok(geometry.subject.y>rain['.top-bar'].y+rain['.top-bar'].height,`${key}: white space below header`);
    assert.ok(geometry.subject.y+geometry.subject.height<rain['.intensity-area'].y,`${key}: hearth must not overlap slider`);
    assert.equal(geometry.paper,'rgb(251, 251, 252)');assert.equal(geometry.overflow,false);
    await current.page.screenshot({path:`test-results/${key}-fireplace.png`});
    // The environment is an independent underlay, never a resized fireplace.
    await old.page.locator('#scene-trigger').click();await old.page.locator('[data-world="fireplace"]').click();
    await old.page.evaluate(()=>{const r=window.__sceneQA.renderer;r.transition=null;r.render(r.start+3000);});
    await old.page.evaluate(async()=>{const image=new Image();image.src='./art/fireplace-reference-v6.png';await image.decode();});
    const masonry=page=>page.locator('.fire-masonry-bounds').boundingBox();
    assert.deepEqual(await masonry(current.page),await masonry(old.page),`${key}: approved fireplace size and placement unchanged`);
    if(viewport.width===390)await old.page.screenshot({path:'test-results/fireplace-before-atmosphere.png'});
    const atmosphere=[];
    for(const intensity of [0,.42,1]){
      const state=await current.page.evaluate(i=>{
        const f=window.__sceneQA.renderer.fireplace;f.last=null;f.update(0,i);
        const box=f.lightField.getBoundingClientRect(),hearth=f.hearthLight.getBoundingClientRect();
        return {intensity:i,opacity:Number(f.lightField.getAttribute('opacity')),width:box.width,height:box.height,hearthOpacity:Number(f.hearthLight.getAttribute('opacity')),hearthBottom:hearth.bottom,paths:f.lightField.querySelectorAll('path').length,background:getComputedStyle(document.querySelector('.app')).backgroundColor};
      },intensity);
      atmosphere.push(state);
      assert.equal(state.background,'rgb(251, 251, 252)');
      assert.ok(state.paths>=20,'layered pencil pigment, not a single digital spotlight');
      assert.ok(state.hearthBottom<rain['.intensity-area'].y,'local hearth warmth never reaches the controls');
      if(viewport.width===390)await current.page.screenshot({path:`test-results/atmosphere-${intensity}.png`});
    }
    for(let n=1;n<atmosphere.length;n++){
      assert.ok(atmosphere[n].opacity>atmosphere[n-1].opacity&&atmosphere[n].width>atmosphere[n-1].width,'firelight expands and strengthens continuously');
      assert.ok(atmosphere[n].hearthOpacity>atmosphere[n-1].hearthOpacity,'reflected hearth warmth follows intensity');
    }
    // Removing the atmosphere must restore the exact approved Fireplace pixels:
    // no changes to the source illustration, live flames, logs, sparks or UI.
    await current.page.locator('.fire-environment').evaluate(e=>e.style.display='none');
    for(const page of [old.page,current.page])await page.evaluate(()=>{const f=window.__sceneQA.renderer.fireplace;f.time=0;f.sparkTime=0;f.last=null;f.update(0,.42);});
    const oldScene=await old.page.locator('.world').screenshot(),withoutAtmosphere=await current.page.locator('.world').screenshot();
    assert.ok(oldScene.equals(withoutAtmosphere),`${key}: atmosphere-only change; underlying fireplace must be pixel-identical`);
    await current.page.locator('.fire-environment').evaluate(e=>e.style.display='');
    if(viewport.width===390){
      const sparkStats=await current.page.evaluate(()=>{
        const fire=window.__sceneQA.renderer.fireplace,stats=[];
        for(const intensity of [.05,.15,.42,1]){
          fire.sparkTime=0;fire.last=null;
          const counts=[],positions=new Set(),shapes=new Set();
          for(let frame=0;frame<3600;frame++){
            fire.update(frame*.05,intensity);
            if(frame%5===0){
              counts.push(fire.sparks.filter(node=>Number(node.getAttribute('opacity'))>=.15).length);
              fire.sparks.forEach(node=>{const d=node.getAttribute('d');positions.add(d);shapes.add(d.replace(/[\d.\- ]/g,''));});
            }
          }
          stats.push({intensity,pool:fire.sparks.length,min:Math.min(...counts),max:Math.max(...counts),mean:counts.reduce((a,b)=>a+b)/counts.length,distinctPositions:positions.size,shapes:shapes.size});
        }
        return stats;
      });
      for(const stat of sparkStats){
        assert.ok(stat.pool>=12&&stat.pool<=16,'12–16 staggered spark particles');
        assert.ok(stat.distinctPositions>1000&&stat.shapes>=3,'independent moving pencil marks');
        if(stat.intensity<=.15){assert.equal(stat.min,0);assert.equal(stat.max,1);}
        else if(stat.intensity===.42){assert.ok(stat.min>=3&&stat.max<=5);}
        else {assert.ok(stat.min>=7&&stat.max<=12);}
      }
      writeFileSync('test-results/spark-measurements.json',JSON.stringify(sparkStats,null,2));
      console.log('PASS staggered spark density over 180 simulated seconds:',JSON.stringify(sparkStats));
      // Sample the default-intensity motion across several genuinely different times.
      for(const seconds of [0,3,6,9]){
        await current.page.evaluate(seconds=>{const fire=window.__sceneQA.renderer.fireplace;fire.sparkTime=seconds;fire.last=null;fire.update(seconds,.42);},seconds);
        await current.page.screenshot({path:`test-results/default-sparks-${seconds}s.png`});
      }
    }
    const captures={};
    const staticArtwork=await current.page.locator('.fire-structure').innerHTML(),frontLog=await current.page.locator('.fire-logs').innerHTML();
    for(const intensity of [0,.5,1]){
      await current.page.evaluate(i=>{const r=window.__sceneQA.renderer;r.scene.setIntensity(i);for(let n=0;n<90;n++)r.fireplace.update(n/60,i);},intensity);
      captures[intensity]=await current.page.locator('.fire-flames').innerHTML();
      assert.ok(!captures[intensity].includes('NaN'));
      assert.equal(await current.page.locator('.fire-structure').innerHTML(),staticArtwork,`${key}: masonry and rear logs remain static`);
      assert.equal(await current.page.locator('.fire-logs').innerHTML(),frontLog,`${key}: front log remains static`);
      const occlusion=await current.page.locator('.fire-logs use').getAttribute('clip-path');assert.equal(occlusion,'url(#fire-front-log)');
      if(viewport.width===390)await current.page.screenshot({path:`test-results/fire-${intensity}.png`});
    }
    assert.notEqual(captures[0],captures[1]);
    await current.page.locator('#scene-trigger').click();await current.page.locator('[data-world="rain"]').click();
    assert.deepEqual(await measure(current.page),rain,`${key}: round-trip switch has no layout shift`);
    assert.deepEqual(current.errors,[]);assert.deepEqual(old.errors,[]);
    measurements.push({viewport,layoutMatches:true,rainCanvasPixelsUnchanged:true,underlyingFireplacePixelsUnchanged:true,atmosphere,pixelDiff,...geometry});
    console.log(`PASS ${key}: Rain canvas pixel-identical; shared scene/header/slider/control geometry; calm live 0/50/100 fire; no overflow or JS errors. Subject ${(geometry.subjectWidthRatio*100).toFixed(1)}% scene width / ${(geometry.subjectHeightRatio*100).toFixed(1)}% height. UI edge differences: ${JSON.stringify(pixelDiff)}`);
    await old.page.close();await current.page.close();
  }
  writeFileSync('test-results/mobile-measurements.json',JSON.stringify(measurements,null,2));
  // Actual browser screenshots are shown together without resizing either scene.
  const report=await browser.newPage({viewport:{width:800,height:900},deviceScaleFactor:1});
  const images=['390x844-rain','390x844-fireplace'].map(name=>`<figure><figcaption>${name.endsWith('rain')?'Approved Rain':'Same artwork · 69.9% masonry width'}</figcaption><img width="390" height="844" src="data:image/png;base64,${readFileSync('test-results/'+name+'.png').toString('base64')}"/></figure>`).join('');
  await report.setContent(`<style>body{margin:0;background:white;display:flex;gap:20px;font:14px system-ui;color:#58616a}figure{margin:0}figcaption{text-align:center;padding:14px 0}</style>${images}`);
  await report.screenshot({path:'test-results/iphone-side-by-side.png'});await report.close();
  const comparison=await browser.newPage({viewport:{width:800,height:900},deviceScaleFactor:1});
  await comparison.setContent(`<style>body{margin:0;background:white;display:flex;gap:20px;font:14px system-ui;color:#58616a}figure{margin:0}figcaption{text-align:center;padding:14px 0}</style>`+['fireplace-before-atmosphere','390x844-fireplace'].map((name,n)=>`<figure><figcaption>${n?'Local pencil firelight · default intensity':'Before · same fireplace and size'}</figcaption><img width="390" height="844" src="data:image/png;base64,${readFileSync('test-results/'+name+'.png').toString('base64')}"/></figure>`).join(''));
  await comparison.screenshot({path:'test-results/firelight-before-after.png'});await comparison.close();
} finally {await browser.close();await new Promise(done=>server.close(done));}
