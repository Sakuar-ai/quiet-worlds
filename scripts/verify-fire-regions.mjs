import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
import {OfflineAudioContext} from 'node-web-audio-api';
import {FireplaceAudio,prepareFireRecording,selectFireRegion} from '../dist/fireplace-audio.js';

const out=resolve(process.argv[2]||'test-results/fire-regions');mkdirSync(out,{recursive:true});
const app=readFileSync('dist/app.js','utf8');
const SCENES=new Function(app.slice(app.indexOf('const SCENES ='),app.indexOf('const MARKS ='))+'return SCENES;')();
const mixerCode=app.slice(app.indexOf('class AudioMixer {'),app.indexOf('class IntensitySlider {'));
const manifest=JSON.parse(readFileSync('dist/audio/fireplace-visionear-regions-v2.json'));
assert.equal(manifest.regions[0].sourceStartSeconds,460);
assert.equal(manifest.regions[0].sourceEndSeconds,500);
assert.equal(manifest.regions[1].sha256,'db92c1af1a0622a081f288b587daad3e8da2ccadb6b6d142c8e8a26791d5d028','approved medium is unchanged');
const fileFetch=async url=>{const b=readFileSync(resolve('dist',url));return {ok:true,json:async()=>JSON.parse(b),arrayBuffer:async()=>b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength)};};
const timers={setTimeout(){return 1;},clearTimeout(){}};
assert.equal(selectFireRegion(.42),'medium');assert.equal(selectFireRegion(.5),'medium');
assert.equal(selectFireRegion(1),'medium');assert.equal(selectFireRegion(0),'low');
assert.equal(selectFireRegion(.31,'low'),'low');assert.equal(selectFireRegion(.29,'medium'),'medium');

function wav(buffer,path){
  const frames=buffer.length,channels=buffer.numberOfChannels,rate=buffer.sampleRate;
  const b=Buffer.alloc(44+frames*channels*3);b.write('RIFF');b.writeUInt32LE(b.length-8,4);b.write('WAVEfmt ',8);
  b.writeUInt32LE(16,16);b.writeUInt16LE(1,20);b.writeUInt16LE(channels,22);b.writeUInt32LE(rate,24);
  b.writeUInt32LE(rate*channels*3,28);b.writeUInt16LE(channels*3,32);b.writeUInt16LE(24,34);
  b.write('data',36);b.writeUInt32LE(b.length-44,40);
  const data=Array.from({length:channels},()=>new Float32Array(frames));data.forEach((a,c)=>buffer.copyFromChannel(a,c));
  let peak=0,sum=0;
  for(let n=0;n<frames;n++)for(let c=0;c<channels;c++){
    const v=data[c][n];peak=Math.max(peak,Math.abs(v));sum+=v*v;
    b.writeIntLE(Math.max(-8388608,Math.min(8388607,Math.round(v*8388608))),44+(n*channels+c)*3,3);
  }
  assert.ok(peak<.8,'no clipping or startling full-scale peaks');
  if(path)writeFileSync(path,b);
  return {seconds:frames/rate,peakDBFS:20*Math.log10(peak),rmsDBFS:10*Math.log10(sum/(frames*channels))};
}

async function setup(intensity,seconds){
  const ctx=new OfflineAudioContext(2,seconds*48000,48000);
  Object.defineProperty(ctx,'resume',{value:async()=>{}});
  const sources=[],edges=[];
  for(const method of ['createGain','createBufferSource','createDynamicsCompressor']){
    const create=ctx[method].bind(ctx);
    ctx[method]=(...args)=>{
      const node=create(...args),connect=node.connect.bind(node);
      node.connect=(dest,...rest)=>{edges.push([node,dest]);return connect(dest,...rest);};
      if(method==='createBufferSource'){
        const entry={node,start:null,stop:Infinity};sources.push(entry);
        const start=node.start.bind(node),stop=node.stop.bind(node);
        node.start=(at=0,offset=0)=>{entry.start=at;entry.offset=offset;return start(at,offset);};
        node.stop=(at=0)=>{entry.stop=at;return stop(at);};
      }
      return node;
    };
  }
  const Mixer=new Function('window','FireplaceAudio','prepareFireRecording','fetch','setTimeout',mixerCode+'return AudioMixer;')(
    {AudioContext:class{constructor(){return ctx;}}},FireplaceAudio,prepareFireRecording,fileFetch,()=>0);
  const mixer=new Mixer();await mixer.play({config:SCENES.fireplace,intensity});
  mixer.fireAudio.timers=timers;
  assert.equal(mixer.fireAudio.currentRegion,selectFireRegion(intensity));
  assert.equal(sources.length,1,'default starts ONLY the selected region');
  assert.equal(sources[0].offset,selectFireRegion(intensity)==='medium'?20:0);
  assert.ok(edges.some(([a,b])=>a===mixer.sceneBus&&b===mixer.fireMaster));
  assert.ok(!edges.some(([a,b])=>a===mixer.sceneBus&&b===mixer.master));
  return {ctx,mixer,sources};
}
const reports=[];
for(const [name,intensity] of [['medium-default',.42],['low',.15]]){
  const {ctx,mixer,sources}=await setup(intensity,60);
  const rendered=await ctx.startRendering();
  assert.equal(sources.length,1);assert.equal(mixer.fireAudio.voices.size,1);
  reports.push({name,intensity,region:mixer.fireAudio.currentRegion,...wav(rendered,out+'/'+name+'-60s.wav')});
  mixer.fireAudio.dispose();
}
// Honest no-high fallback: 100% selects exactly the same natural region and gain.
const fallback=await setup(1,2);await fallback.ctx.startRendering();
assert.equal(fallback.mixer.fireAudio.currentRegion,'medium');fallback.mixer.fireAudio.dispose();
// More than two default-region cycles: it must never wander into the full file.
const long=await setup(.5,160),longAudio=await long.ctx.startRendering();
assert.equal(long.sources.length,1);assert.equal(long.mixer.fireAudio.currentRegion,'medium');
const medium=long.mixer.fireAudio.recording.regions.get('medium').buffer;
for(const t of [61,100,137,155]){
  const offset=4+(20+t-80)%76;
  const actual=new Float32Array(4800),expected=new Float32Array(4800);
  longAudio.copyFromChannel(actual,0,t*48000);medium.copyFromChannel(expected,0,offset*48000);
  let error=0,power=0;for(let n=0;n<actual.length;n++){error+=(actual[n]-expected[n])**2;power+=expected[n]**2;}
  assert.ok(error/power<1e-8,'long playback stays within the same selected natural region');
}
long.mixer.fireAudio.dispose();

async function journey(name,events,seconds){
  const {ctx,mixer,sources}=await setup(.5,seconds),engine=mixer.fireAudio;
  const waits=events.map(([t])=>ctx.suspend(t));
  const rendering=ctx.startRendering(),snapshots=[];
  for(let index=0;index<events.length;index++){
    await waits[index];const [requested,action,value]=events[index];
    const beforeAngle=engine.angleAt(),beforeRegion=engine.currentRegion;
    if(action==='slider')mixer.update(value);
    if(action==='settle')engine.settle();
    if(action==='pause')mixer.pause();
    if(action==='play')await mixer.play({config:SCENES.fireplace,intensity:value});
    if(action==='dispose')engine.dispose();
    if(action==='slider'){
      assert.ok(Math.abs(engine.angleAt()-beforeAngle)<1e-8,'rapid retarget is continuous at current angle');
      if(engine.transition)for(let n=0;n<=100;n++){
        const t=engine.transition.start+n/100*4,a=engine.angleAt(t);
        assert.ok(Math.abs(Math.cos(a)**2+Math.sin(a)**2-1)<1e-12,'equal power throughout crossfade');
      }
    }
    assert.ok(engine.voices.size<=2);
    if(action==='settle')assert.equal(engine.voices.size,1,'retire outgoing source at transition completion');
    snapshots.push({requested,actual:ctx.currentTime,action,value,previous:beforeRegion,
      region:engine.currentRegion,target:engine.desiredRegion,voices:[...engine.voices.keys()],transition:engine.transition});
    await OfflineAudioContext.prototype.resume.call(ctx);
  }
  const rendered=await rendering;
  for(let t=0;t<seconds;t+=.01){
    assert.ok(sources.filter(s=>s.start!==null&&s.start<=t&&s.stop>t).length<=2,'never three active sources');
  }
  const stats=wav(rendered,name==='transition'?out+'/medium-low-medium-60s.wav':null);
  engine.dispose();
  return {name,...stats,snapshots,sourceCount:sources.length};
}
reports.push(await journey('transition',[[10,'slider',.1],[14.1,'settle'],[30,'slider',.5],[34.1,'settle'],[45,'slider',1]],60));
reports.push(await journey('stress',[
  [2,'slider',.1],[2.5,'slider',.5],[2.8,'slider',.1],[3,'slider',1],
  [3.5,'pause'],[3.6,'slider',.1],[3.7,'play',.1],[7.8,'settle'],
  [8,'slider',.30],[8.5,'slider',.31],[9,'slider',.8],[13.1,'settle'],
  [14,'slider',.29],[15,'slider',1],[16,'dispose']],18));
const report={status:manifest.reviewStatus,engine:'production AudioMixer + FireplaceAudio, native OfflineAudioContext',
  defaultSourceSeconds:60,highRegionAvailable:false,transitionSeconds:4,maximumOverlappingSources:2,
  independentRegionLoops:true,noSpectralProcessing:true,noEventOverlays:true,manifest,reports};
writeFileSync(out+'/region-playback-report.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(reports.map(({snapshots,...r})=>r),null,2));
