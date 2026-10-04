import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {resolve,extname} from 'node:path';
import assert from 'node:assert/strict';
import {fireParameters} from '../dist/fireplace.js';

const baseline='7132f045add8baf64e8d44b4079ca639901240e9';
const previous=name=>execFileSync('git',['show',`${baseline}:dist/${name}`],{encoding:'utf8'});
const oldApp=previous('app.js'),oldCss=previous('styles.css');
const app=readFileSync('dist/app.js','utf8');
// No behavior or audio code is changed; only the Fireplace module cache key.
assert.equal(app.replace(/fireplace\.js\?v=phase2a-\d+/,'fireplace.js?v=phase2a-10'),oldApp);
assert.equal(readFileSync('dist/styles.css','utf8'),oldCss);
const artPath='dist/art/fireplace-reference-v6.png';
assert.ok(readFileSync(artPath).equals(execFileSync('git',['show',`${baseline}:${artPath}`],{maxBuffer:8*1024*1024})), 'existing fireplace artwork must remain byte-identical');
assert.equal(readFileSync('dist/world-art.js','utf8'),previous('world-art.js'));
const oldFire=previous('fireplace.js'),fire=readFileSync('dist/fireplace.js','utf8');
const mix=source=>source.slice(source.indexOf('export function fireMix'),source.indexOf('export class FireplaceRenderer')).trim();
assert.equal(mix(fire),mix(oldFire));
const pigment=source=>source.slice(source.indexOf('function drawFirelight'),source.indexOf('export function fireParameters'));
assert.equal(pigment(fire),pigment(oldFire),'approved environment marks are not redrawn; no extra objects');
const {fireParameters:oldParameters}=await import('data:text/javascript;base64,'+Buffer.from(oldFire).toString('base64'));
const responseKeys=['flameHeight','flameWidthVariation','flameMovement','emberGlow','sparkCount','sparkDuty','lightSpread','lightOpacity','hearthLight','hearthSpreadX','hearthSpreadY'];
for(let step=0;step<=100;step++){
  const p=fireParameters(step/100),previous=fireParameters((step-1)/100);
  assert.deepEqual(p,oldParameters(step/100),'approved atmosphere, sparks and main-fire response parameters are unchanged');
  for(const key of responseKeys)assert.ok(Number.isFinite(p[key])&&p[key]>=previous[key],`${key}: finite continuous monotonic response`);
}
assert.deepEqual(fireParameters(-1),fireParameters(0));assert.deepEqual(fireParameters(2),fireParameters(1));
const sparkCode=source=>source.slice(source.indexOf('this.sparks.forEach'),source.indexOf('this.parameters=p'));
assert.equal(sparkCode(fire),sparkCode(oldFire),'spark system stays byte-identical');

const dir=resolve('dist'),mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.wav':'audio/wav','.mp3':'audio/mpeg'};
const server=createServer((req,res)=>{try{const name=decodeURIComponent(new URL(req.url,'http://localhost').pathname),file=resolve(dir,'.'+(name==='/'?'/index.html':name));if(!file.startsWith(dir+'/'))throw Error('Invalid path');res.setHeader('Content-Type',mime[extname(file)]||'application/octet-stream');res.end(readFileSync(file));}catch{res.writeHead(404);res.end();}});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const url=`http://127.0.0.1:${server.address().port}/`;
mkdirSync('test-results',{recursive:true});
writeFileSync('test-results/intensity-response.json',JSON.stringify([0,.15,.42,.7,1].map(intensity=>({intensity,before:oldParameters(intensity),after:fireParameters(intensity)})),null,2));
const browser=await chromium.launch({headless:true});
const measurements=[];
const selectors=['.app','.top-bar','.world','#scene-canvas','.title-lockup h1','.scene-mark','.scene-mark svg','.timer-button','.timer-button svg','.intensity-area','.intensity-copy','.range-wrap','.controls','.play-button','.controls .icon-button'];
const measure=page=>page.evaluate(selectors=>Object.fromEntries(selectors.map(selector=>{const e=document.querySelector(selector),b=e.getBoundingClientRect(),s=getComputedStyle(e);return [selector,{x:b.x,y:b.y,width:b.width,height:b.height,fontSize:s.fontSize,fontWeight:s.fontWeight,padding:s.padding,strokeWidth:s.strokeWidth}];})),selectors);
const makePage=async(viewport,old=false)=>{
  const page=await browser.newPage({viewport,deviceScaleFactor:2,isMobile:true,hasTouch:true});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  // Freeze only the test animation clock, then render each scene at a known time.
  await page.addInitScript(()=>{window.requestAnimationFrame=()=>1;window.cancelAnimationFrame=()=>{};});
  await page.route('**/app.js*',r=>r.fulfill({contentType:'text/javascript',body:(old?oldApp:app)+'\nwindow.__sceneQA={renderer,setScene,slider,intensityText,pause};'}));
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
        const q=window.__sceneQA,f=q.renderer.fireplace;q.renderer.scene.setIntensity(i);q.slider.set(i);document.querySelector('#intensity-description').textContent=q.intensityText(q.renderer.scene,i);f.last=null;f.update(0,i);
        const box=f.lightField.getBoundingClientRect(),hearth=f.hearthLight.getBoundingClientRect();
        return {intensity:i,opacity:Number(f.lightField.getAttribute('opacity')),width:box.width,height:box.height,hearthOpacity:Number(f.hearthLight.getAttribute('opacity')),hearthBottom:hearth.bottom,bedOpacity:Number(f.glow.getAttribute('opacity')),logHeatOpacity:Number(f.logHeat.getAttribute('opacity')),paths:f.lightField.querySelectorAll('path').length,background:getComputedStyle(document.querySelector('.app')).backgroundColor,parameters:{...f.parameters}};
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
      assert.ok(atmosphere[n].bedOpacity>atmosphere[n-1].bedOpacity&&atmosphere[n].logHeatOpacity>atmosphere[n-1].logHeatOpacity,'ember bed and heated log edges respond together');
    }
    assert.ok(atmosphere[2].width/atmosphere[0].width>1.9,'clearly wider light spread from embers to roaring');
    assert.ok(atmosphere[0].opacity<.13&&atmosphere[2].opacity>.8&&atmosphere[2].opacity<=.85,'faint low end, bounded stronger high end');
    assert.ok(atmosphere[1].opacity>.45&&atmosphere[1].opacity<.6,'approved medium warmth remains restrained');
    assert.ok(atmosphere[2].parameters.flameHeight<=440,'fuller fire stays inside the original opening');
    const integration=await current.page.evaluate(()=>{
      const q=s=>document.querySelector(s),ordered=['.fire-rear-logs','.fire-glow','.fire-lower-flames','.fire-flames','.fire-log-interleave','.fire-logs','.fire-log-heat','.fire-seam-embers','.fire-embers','.fire-sparks'];
      return {layerOrder:ordered.every((s,n)=>!n||Boolean(q(ordered[n-1]).compareDocumentPosition(q(s))&Node.DOCUMENT_POSITION_FOLLOWING)),crossClip:q('.fire-log-interleave use').getAttribute('clip-path'),frontClip:q('.fire-logs use').getAttribute('clip-path'),heatClip:q('.fire-log-heat').getAttribute('clip-path'),seamMask:q('.fire-seam-embers').getAttribute('mask'),coals:q('.fire-coal-bed').children.length,seams:q('.fire-seam-embers').children.length,originalWeight:q('#fire-soften-hatching feComposite').getAttribute('k2'),softWeight:q('#fire-soften-hatching feComposite').getAttribute('k3')};
    });
    assert.equal(integration.layerOrder,true);assert.equal(integration.crossClip,'url(#fire-cross-log)');assert.equal(integration.frontClip,'url(#fire-front-log)');
    assert.equal(integration.heatClip,'url(#fire-all-logs)');assert.equal(integration.seamMask,'url(#fire-between-logs)');
    assert.equal(integration.coals,13);assert.equal(integration.seams,9);assert.equal(integration.originalWeight,'.82');assert.equal(integration.softWeight,'.18');
    // Hide live heat in both versions: the approved fixed wood and masonry,
    // including the existing texture attenuation and cutouts, must be identical.
    const liveLayers='.fire-environment,.fire-live-interior,.fire-log-rim,.fire-log-heat,.fire-log-char,.fire-contact-hotspots,.fire-ember-falls,.fire-seam-embers,.fire-embers,.fire-sparks';
    for(const page of [old.page,current.page])await page.locator(liveLayers).evaluateAll(nodes=>nodes.forEach(e=>e.style.display='none'));
    for(const page of [old.page,current.page])await page.evaluate(()=>{const f=window.__sceneQA.renderer.fireplace;f.time=0;f.sparkTime=0;f.last=null;f.update(0,.42);});
    const oldScene=await old.page.locator('.world').screenshot(),withoutAtmosphere=await current.page.locator('.world').screenshot();
    assert.ok(oldScene.equals(withoutAtmosphere),`${key}: static fireplace artwork and layout must be pixel-identical`);
    for(const page of [old.page,current.page])await page.locator(liveLayers).evaluateAll(nodes=>nodes.forEach(e=>e.style.display=''));
    // Re-render at one shared clock for a meaningful close-up comparison.
    if(viewport.width===390){
      for(const [name,page] of [['before',old.page],['after',current.page]]){
        await page.evaluate(()=>{const f=window.__sceneQA.renderer.fireplace;f.time=0;f.sparkTime=0;f.last=null;f.update(0,.42);});
        const clip=await page.locator('.fire-illustration').evaluate(e=>{const m=e.getScreenCTM(),a=new DOMPoint(400,420).matrixTransform(m),b=new DOMPoint(1130,824).matrixTransform(m);return {x:a.x,y:a.y,width:b.x-a.x,height:b.y-a.y};});
        await page.screenshot({path:`test-results/burning-logs-${name}.png`,clip});
      }
    }
    if(viewport.width===390){
      const combustion=await current.page.evaluate(()=>{
        const f=window.__sceneQA.renderer.fireplace,q=s=>document.querySelector(s);
        const wood=()=>['.fire-rear-logs','.fire-log-interleave','.fire-logs'].map(s=>q(s).outerHTML).join('');
        const original=wood(),count=q('.fire-illustration').querySelectorAll('*').length,samples=[];
        for(const seconds of [0,60,3600,86400,604800])for(const intensity of [0,.42,1,0]){
          f.time=seconds;f.sparkTime=seconds;f.last=null;f.update(seconds,intensity);
          samples.push({seconds,intensity,woodUnchanged:wood()===original,nodeCount:q('.fire-illustration').querySelectorAll('*').length,charOpacity:Number(f.logChar.getAttribute('opacity')),finite:!q('.fire-illustration').outerHTML.includes('NaN')});
        }
        const falls=[];
        for(const intensity of [0,.42,1]){
          f.sparkTime=0;f.time=0;f.last=null;let visibleFrames=0,maxVisible=0,minY=Infinity,maxY=-Infinity;
          for(let frame=0;frame<3600;frame++){
            f.update(frame*.05,intensity);
            const visible=f.emberFalls.filter(e=>Number(e.getAttribute('opacity'))>.1);
            if(visible.length)visibleFrames++;maxVisible=Math.max(maxVisible,visible.length);
            for(const e of visible){const y=Number(e.getAttribute('d').match(/^M[\d.\-]+ ([\d.\-]+)/)[1]);minY=Math.min(minY,y);maxY=Math.max(maxY,y);}
          }
          falls.push({intensity,maxVisible,visibleFraction:visibleFrames/3600,minY:Number.isFinite(minY)?minY:null,maxY:Number.isFinite(maxY)?maxY:null});
        }
        return {count,samples,falls,rootMask:q('.fire-root-system').getAttribute('mask'),charClip:q('.fire-log-char').getAttribute('clip-path'),hotspotClip:q('.fire-contact-hotspots').getAttribute('clip-path'),fallMask:q('.fire-ember-falls').getAttribute('mask'),contacts:f.contactFlames.length,charMarks:f.charMarks.length,hotspots:f.contactHotspots.length,fallPool:f.emberFalls.length};
      });
      assert.equal(combustion.rootMask,'url(#fire-root-occlusion)');
      assert.equal(combustion.charClip,'url(#fire-all-logs)');assert.equal(combustion.hotspotClip,'url(#fire-all-logs)');assert.equal(combustion.fallMask,'url(#fire-between-logs)');
      assert.equal(combustion.contacts,3);assert.equal(combustion.charMarks,6);assert.equal(combustion.hotspots,6);assert.equal(combustion.fallPool,3);
      for(const sample of combustion.samples){
        assert.ok(sample.woodUnchanged&&sample.finite,'wood never shrinks, moves, disappears or depletes');
        assert.equal(sample.nodeCount,combustion.count,'no accumulating ash or new particles');
        assert.ok(Math.abs(sample.charOpacity-(.09+.46*sample.intensity))<1e-8,'charring is reversible intensity response, never elapsed-time damage');
      }
      for(const fall of combustion.falls){
        assert.ok(fall.maxVisible<=2&&fall.visibleFraction<.3,'occasional cinders, not particle rain');
        if(fall.intensity===0)assert.equal(fall.maxVisible,0);
        else {assert.ok(fall.maxVisible>0);assert.ok(fall.minY>=757&&fall.maxY<=802,'short falls end inside ember bed');}
      }
      writeFileSync('test-results/ambient-combustion.json',JSON.stringify(combustion,null,2));
      console.log('PASS reversible contact heat, fixed wood at long-time phase samples, bounded cinder falls:',JSON.stringify(combustion.falls));
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
        else {assert.ok(stat.min>=7&&stat.max<=13);}
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
    if(viewport.width===390){
      // Exercise the actual input, not just renderer.update(), through a drag.
      const range=await current.page.locator('#intensity-slider').boundingBox(),samples=[];
      await current.page.mouse.move(range.x+2,range.y+range.height/2);await current.page.mouse.down();
      for(const fraction of [0,.25,.5,.75,1]){
        await current.page.mouse.move(range.x+2+(range.width-4)*fraction,range.y+range.height/2,{steps:8});
        samples.push(await current.page.evaluate(()=>{const r=window.__sceneQA.renderer;r.fireplace.last=null;r.fireplace.update(0,r.scene.intensity);return {intensity:r.scene.intensity,...r.fireplace.parameters};}));
      }
      await current.page.mouse.up();await current.page.evaluate(()=>window.__sceneQA.pause());
      assert.ok(samples[0].intensity<.02&&samples.at(-1).intensity>.98,'slider drag spans Embers to Roaring Fire');
      for(let n=1;n<samples.length;n++)assert.ok(samples[n].lightSpread>samples[n-1].lightSpread&&samples[n].hearthLight>samples[n-1].hearthLight&&samples[n].flameMovement>samples[n-1].flameMovement,'drag visibly changes the whole environment');
      writeFileSync('test-results/slider-drag.json',JSON.stringify(samples,null,2));
    }
    await current.page.locator('#scene-trigger').click();await current.page.locator('[data-world="rain"]').click();
    assert.deepEqual(await measure(current.page),rain,`${key}: round-trip switch has no layout shift`);
    assert.deepEqual(current.errors,[]);assert.deepEqual(old.errors,[]);
    measurements.push({viewport,layoutMatches:true,rainCanvasPixelsUnchanged:true,originalArtworkRecoverablePixelIdentical:true,integration,atmosphere,pixelDiff,...geometry});
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
  const intensityReport=await browser.newPage({viewport:{width:1210,height:900},deviceScaleFactor:1});
  await intensityReport.setContent(`<style>body{margin:0;background:white;display:flex;gap:20px;font:14px system-ui;color:#58616a}figure{margin:0}figcaption{text-align:center;padding:14px 0}</style>`+[0,.42,1].map((i,n)=>`<figure><figcaption>${['Embers · 0%','Gentle fire · 42%','Roaring fire · 100%'][n]}</figcaption><img width="390" height="844" src="data:image/png;base64,${readFileSync('test-results/atmosphere-'+i+'.png').toString('base64')}"/></figure>`).join(''));
  await intensityReport.screenshot({path:'test-results/intensity-comparison.png'});await intensityReport.close();
  const detailReport=await browser.newPage({viewport:{width:900,height:310},deviceScaleFactor:1});
  await detailReport.setContent(`<style>body{margin:0;background:white;display:flex;gap:20px;font:14px system-ui;color:#58616a}figure{margin:0;width:440px}figcaption{text-align:center;padding:14px 0}img{width:440px}</style>`+['before','after'].map(name=>`<figure><figcaption>${name==='before'?'Before · 42% intensity':'After · interwoven roots, embers and warm log edges'}</figcaption><img src="data:image/png;base64,${readFileSync('test-results/burning-logs-'+name+'.png').toString('base64')}"/></figure>`).join(''));
  await detailReport.screenshot({path:'test-results/burning-logs-comparison.png'});await detailReport.close();
} finally {await browser.close();await new Promise(done=>server.close(done));}
