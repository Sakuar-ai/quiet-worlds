import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve,extname} from 'node:path';
import assert from 'node:assert/strict';
import {CracklePlanner,fireAudioParameters,FireplaceAudio} from '../dist/fireplace-audio.js';

mkdirSync('test-results',{recursive:true});
const manifest=JSON.parse(readFileSync('dist/audio/fireplace-kingsrow-v1.json'));
const seeded=seed=>()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
const events=manifest.events.map((e,id)=>({...e,id,buffer:{duration:e.duration}}));
const plans=[];
for(const intensity of [0,.5,1]){
  const planner=new CracklePlanner(seeded(9341)),schedule=[];let time=0;
  while(time<3600){const n=planner.next(intensity,events);time+=n.wait;if(time>=3600)break;schedule.push({at:time,id:n.event.id,size:n.event.size,gain:n.gain,duration:n.event.duration,wait:n.wait});time+=n.event.duration;}
  const waits=schedule.map(e=>e.wait),mean=waits.reduce((a,b)=>a+b)/waits.length,cv=Math.sqrt(waits.reduce((s,n)=>s+(n-mean)**2,0)/waits.length)/mean;
  assert.ok(cv>.5,'irregular timing, not rhythmic');
  schedule.forEach((e,n)=>{assert.ok(!schedule.slice(Math.max(0,n-3),n).some(p=>p.id===e.id),'no recent event repetition');if(n)assert.ok(e.at>schedule[n-1].at+schedule[n-1].duration+.8,'at most one event at a time');});
  if(intensity<.65)assert.ok(schedule.every(e=>e.size==='small'));
  else assert.ok(schedule.some(e=>e.size==='medium'));
  plans.push({intensity,count:schedule.length,meanWait:mean,waitCV:cv,schedule});
}
assert.ok(plans[0].count<plans[1].count&&plans[1].count<plans[2].count);
assert.ok(20*Math.log10(fireAudioParameters(1).bedGain/fireAudioParameters(0).bedGain)<2,'restrained bed volume range');

// Real scheduling lifecycle on a deterministic clock; no wall-clock sleeps.
const param=()=>({value:0,setTargetAtTime(v){this.value=v;}});
const sources=[],ctx={currentTime:0,createBufferSource(){const s={loop:false,connect(n){return n;},disconnect(){},start(at=0,offset=0){this.at=at;this.offset=offset;},stop(at=ctx.currentTime){this.stopAt=at;}};sources.push(s);return s;},createGain(){return{gain:param(),connect(n){return n;},disconnect(){}};},createBiquadFilter(){return{frequency:param(),Q:param(),connect(n){return n;},disconnect(){}};}};
const timers={setInterval(){return 1;},clearInterval(){}};
const engine=new FireplaceAudio(ctx,ctx.createGain(),{bed:{duration:31.81084},events},{random:seeded(91),timers});
engine.update(0);engine.play();
for(let t=0;t<600;t++){ctx.currentTime=t;engine.pump();for(const v of [...engine.voices])if(v.end<t)v.source.onended();}
assert.equal(sources.filter(s=>s.loop).length,1);
const lowScheduled=sources.length-1;assert.ok(lowScheduled>5&&lowScheduled<40,'quiet spaces persist across scheduler ticks');
engine.update(1);const afterHigh=sources.length;engine.update(.01);
for(const v of engine.voices)if(v.at>ctx.currentTime+.02)assert.ok(events[v.id].size==='small');
engine.pause();const paused=sources.length;ctx.currentTime+=300;engine.pump();assert.equal(sources.length,paused);assert.equal(engine.voices.size,0);
engine.play();assert.equal(sources.filter(s=>s.loop).length,1,'resume reuses sole bed');
ctx.currentTime+=200;engine.pump();assert.ok([...engine.voices].every(v=>v.at>=ctx.currentTime),'no catch-up burst');
engine.dispose();assert.ok(sources[0].stopAt>=ctx.currentTime);assert.equal(engine.active,false);

const dir=resolve('dist'),server=createServer((req,res)=>{try{const path=resolve(dir,'.'+new URL(req.url,'http://localhost').pathname);if(!path.startsWith(dir+'/'))throw Error();res.setHeader('Content-Type',({'.js':'text/javascript','.json':'application/json','.flac':'audio/flac','.html':'text/html'})[extname(path)]||'application/octet-stream');res.end(readFileSync(path));}catch{res.writeHead(404);res.end();}});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const browser=await chromium.launch({headless:true});
try{
  const page=await browser.newPage();
  await page.addInitScript(()=>{window.requestAnimationFrame=()=>1;window.cancelAnimationFrame=()=>{};});
  await page.route('**/app.js*',r=>r.fulfill({contentType:'text/javascript',body:readFileSync('dist/app.js','utf8')+'\nwindow.__audioQA={mixer,setScene,pause,timer};'}));
  await page.goto(`http://127.0.0.1:${server.address().port}/index.html`);
  await page.waitForFunction(()=>window.__audioQA);
  await page.locator('#scene-trigger').click();await page.locator('[data-world="fireplace"]').click();
  await page.locator('#play-trigger').click();
  await page.waitForFunction(()=>window.__audioQA.mixer.isPlaying&&window.__audioQA.mixer.fireAudio);
  const integration=await page.evaluate(()=>{
    const q=window.__audioQA,m=q.mixer,bed=m.fireAudio.source,slider=document.querySelector('#intensity-slider'),samples=[];
    for(const i of [0,.5,1,0]){slider.value=String(i*1000);slider.dispatchEvent(new Event('input'));samples.push({intensity:m.fireAudio.intensity,layers:m.layers.length,sameBed:m.fireAudio.source===bed,loop:m.fireAudio.source.loop,nonLoopEvents:[...m.fireAudio.voices].every(v=>!v.source.loop)});}
    q.pause();const stopped=!m.fireAudio.active&&m.fireAudio.voices.size===0;
    return {samples,stopped,bedSeconds:bed.buffer.duration};
  });
  assert.ok(integration.stopped);assert.ok(integration.samples.every(s=>s.layers===1&&s.sameBed&&s.loop&&s.nonLoopEvents));
  assert.deepEqual(integration.samples.map(s=>s.intensity),[0,.5,1,0]);
  const report=await page.evaluate(async plans=>{
    const {prepareFireRecording,fireAudioParameters,FireplaceAudio}=await import('./fireplace-audio.js');
    const manifest=await(await fetch('./audio/fireplace-kingsrow-v1.json')).json();
    const bytes=await(await fetch(manifest.url)).arrayBuffer(),decoder=new OfflineAudioContext(2,1,44100);
    const source=await decoder.decodeAudioData(bytes),recording=prepareFireRecording(decoder,source,manifest);
    const energy=a=>{let p=0;for(const v of a)p+=v*v;return p/a.length;};
    const edge=recording.bed.getChannelData(0),seam=Math.abs(edge.at(-1)-edge[0]);
    let sumDiff=0;for(let n=1;n<edge.length;n++)sumDiff+=(edge[n]-edge[n-1])**2;
    const seamRelative=seam/Math.sqrt(sumDiff/(edge.length-1));
    const renders=[];
    for(const plan of plans){
      // Includes nearly three complete bed loops, with actual production samples,
      // filters, master gain and the planner's non-overlapping event schedule.
      const seconds=96,ctx=new OfflineAudioContext(2,seconds*44100,44100),p=fireAudioParameters(plan.intensity);
      const master=ctx.createGain();master.gain.value=.54;master.connect(ctx.destination);
      const bed=ctx.createBufferSource();bed.buffer=recording.bed;bed.loop=true;
      const filter=ctx.createBiquadFilter();filter.type='lowpass';filter.Q.value=.5;filter.frequency.value=p.highCut;
      const gain=ctx.createGain();gain.gain.value=p.bedGain;bed.connect(filter).connect(gain).connect(master);bed.start();
      for(const e of plan.schedule.filter(e=>e.at+e.duration<seconds)){
        const s=ctx.createBufferSource(),g=ctx.createGain();s.buffer=recording.events[e.id].buffer;s.loop=false;g.gain.value=e.gain;s.connect(g).connect(master);s.start(e.at);
      }
      const rendered=await ctx.startRendering();let power=0,peak=0;
      for(let c=0;c<2;c++){const a=rendered.getChannelData(c);power+=energy(a);for(const v of a)peak=Math.max(peak,Math.abs(v));}
      // Portable PCM listening sample: the first 45 seconds includes a loop seam.
      const frames=45*44100,b=new ArrayBuffer(44+frames*4),d=new DataView(b),str=(at,s)=>[...s].forEach((c,n)=>d.setUint8(at+n,c.charCodeAt(0)));
      str(0,'RIFF');d.setUint32(4,b.byteLength-8,true);str(8,'WAVEfmt ');d.setUint32(16,16,true);d.setUint16(20,1,true);d.setUint16(22,2,true);d.setUint32(24,44100,true);d.setUint32(28,176400,true);d.setUint16(32,4,true);d.setUint16(34,16,true);str(36,'data');d.setUint32(40,frames*4,true);
      for(let n=0;n<frames;n++)for(let c=0;c<2;c++)d.setInt16(44+n*4+c*2,Math.round(Math.max(-1,Math.min(1,rendered.getChannelData(c)[n]))*32767),true);
      let binary='';const u=new Uint8Array(b);for(let n=0;n<u.length;n+=8192)binary+=String.fromCharCode(...u.subarray(n,n+8192));
      renders.push({intensity:plan.intensity,rmsDBFS:10*Math.log10(power/2),peakDBFS:20*Math.log10(peak),wav:btoa(binary)});
    }
    const live=new AudioContext(),bus=live.createGain();bus.gain.value=0;bus.connect(live.destination);
    const fire=new FireplaceAudio(live,bus,recording);fire.play();const single=fire.source.loop===true&&[...fire.voices].every(v=>!v.source.loop);fire.pause();fire.dispose();await live.close();
    return {sourceDuration:source.duration,bedDuration:recording.bed.duration,events:recording.events.length,seamRelative,single,renders};
  },plans);
  assert.equal(report.single,true);assert.equal(report.events,12);assert.ok(report.bedDuration>31&&report.bedDuration<32);
  assert.ok(report.seamRelative<4,'loop boundary comparable to an ordinary adjacent sample');
  assert.ok(report.renders.every(r=>r.peakDBFS<-12),'comfortable headroom; safety compressor stays inactive');
  assert.ok(report.renders[2].rmsDBFS-report.renders[0].rmsDBFS<5,'restrained low-to-high master loudness change');
  for(const r of report.renders){writeFileSync(`test-results/fire-audio-${r.intensity}.wav`,Buffer.from(r.wav,'base64'));delete r.wav;}
  writeFileSync('test-results/fire-audio-analysis.json',JSON.stringify({...report,integration,scheduler:{lowScheduled,afterHigh},plans:plans.map(({schedule,...p})=>p)},null,2));
  writeFileSync('test-results/fire-event-schedules.json',JSON.stringify(plans,null,2));
  console.log('PASS one continuous bed; non-rhythmic non-overlapping crackles; pause/resume/disposal; native FLAC decode; three 96-second offline renders:',JSON.stringify(report));
}finally{await browser.close();server.close();}
