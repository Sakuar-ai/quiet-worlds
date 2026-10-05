// Slider-selected natural regions. One steady bed, two ONLY during a transition.
// No filters, event scheduling, normalization, synthesis or timeline-led intensity.
const HALF_PI=Math.PI/2;
const clamp=n=>Math.max(0,Math.min(1,n));

export function selectFireRegion(intensity,previous=null) {
  const i=clamp(intensity);
  // Small hysteresis prevents chatter at 30%; 70–100% stays medium until a
  // genuinely clean stronger source region has been approved by ear.
  if(previous==='low')return i>.32?'medium':'low';
  if(previous==='medium')return i<.28?'low':'medium';
  return i<=.30?'low':'medium';
}
export function fireAudioParameters(intensity) {
  return {region:selectFireRegion(intensity),bedGain:1,transitionSeconds:4};
}
export function prepareFireRecording(context,buffers,manifest) {
  if(manifest.regions?.length!==2 || manifest.transitionSeconds!==4)
    throw Error('Expected two approved-reference fire regions');
  const regions=new Map();
  manifest.regions.forEach((region,index)=>{
    const buffer=buffers[index];
    const values=[region.loopStartSeconds,region.loopEndSeconds,region.cueOffsetSeconds];
    if(!buffer || buffer.duration<40 || values.some(v=>!Number.isFinite(v)) ||
      region.loopStartSeconds<0 || region.loopEndSeconds<=region.loopStartSeconds ||
      region.loopEndSeconds>buffer.duration+.01 || region.cueOffsetSeconds<0 ||
      region.cueOffsetSeconds>=region.loopEndSeconds)throw Error('Invalid Fireplace region');
    regions.set(region.id,{...region,buffer});
  });
  if(!regions.has('low')||!regions.has('medium'))throw Error('Missing Fireplace region');
  return {regions,transitionSeconds:4,initialFadeSeconds:manifest.initialFadeSeconds};
}

export class FireplaceAudio {
  constructor(context,bus,recording,{timers=globalThis}={}) {
    this.context=context;this.recording=recording;this.timers=timers;
    this.voices=new Map();this.offsets=new Map();this.intensity=.5;
    this.desiredRegion=null;this.currentRegion=null;this.transition=null;
    this.active=false;this.disposed=false;
    this.gain=context.createGain();this.gain.gain.value=0;this.gain.connect(bus);
  }
  createVoice(id,level) {
    if(this.voices.has(id))return this.voices.get(id);
    if(this.voices.size>=2)throw Error('Fireplace overlap limit exceeded');
    const region=this.recording.regions.get(id),now=this.context.currentTime;
    const source=this.context.createBufferSource(),gain=this.context.createGain();
    source.buffer=region.buffer;source.loop=true;
    source.loopStart=region.loopStartSeconds;source.loopEnd=region.loopEndSeconds;
    gain.gain.value=level;source.connect(gain).connect(this.gain);
    const offset=this.offsets.get(id)??region.cueOffsetSeconds;
    const voice={id,source,gain,region,startedAt:now,offset};
    source.onended=()=>{source.disconnect();gain.disconnect();};
    source.start(now,offset);this.voices.set(id,voice);return voice;
  }
  retire(id,when=this.context.currentTime) {
    const voice=this.voices.get(id);if(!voice)return;
    const {region,offset,startedAt}=voice;
    let position=offset+Math.max(0,when-startedAt);
    if(position>=region.loopEndSeconds)position=region.loopStartSeconds+
      (position-region.loopEndSeconds)%(region.loopEndSeconds-region.loopStartSeconds);
    this.offsets.set(id,position);this.voices.delete(id);voice.source.stop(when);
  }
  angleAt(now=this.context.currentTime) {
    if(!this.transition)return this.currentRegion==='medium'?HALF_PI:0;
    const t=this.transition,p=clamp((now-t.start)/(t.end-t.start));
    return t.from+(t.to-t.from)*p;
  }
  settle() {
    const t=this.transition,now=this.context.currentTime;
    if(!t||now<t.end-1e-6)return;
    this.timers.clearTimeout(this.timer);this.currentRegion=t.target;this.transition=null;
    const outgoing=t.target==='low'?'medium':'low';this.retire(outgoing);
    this.voices.get(t.target)?.gain.gain.setValueAtTime(1,now);
  }
  scheduleSettlement() {
    this.timers.clearTimeout(this.timer);
    if(!this.transition||this.disposed)return;
    const wait=Math.max(20,(this.transition.end-this.context.currentTime)*1000+8);
    this.timer=this.timers.setTimeout(()=>{
      if(this.disposed)return;
      this.settle();
      // Wall-clock timers can fire while AudioContext is suspended. Never retire
      // a source before its AUDIO-clock gain ramp actually finishes.
      if(this.transition)this.scheduleSettlement();
    },wait);
  }
  transitionTo(target) {
    this.settle();
    if(!this.transition&&this.currentRegion===target)return;
    const now=this.context.currentTime,from=this.angleAt(now),to=target==='medium'?HALF_PI:0;
    const duration=this.recording.transitionSeconds;
    // A rapid reversal retargets the SAME adjacent pair at its current angle.
    // It cannot start a third source or queue a later unwanted region change.
    for(const id of ['low','medium']){
      const isLow=id==='low',voice=this.createVoice(id,isLow?Math.cos(from):Math.sin(from));
      const curve=new Float32Array(257);
      for(let n=0;n<curve.length;n++){
        const angle=from+(to-from)*n/(curve.length-1);
        curve[n]=isLow?Math.cos(angle):Math.sin(angle);
      }
      const param=voice.gain.gain;
      param.cancelAndHoldAtTime(now);
      param.setValueCurveAtTime(curve,now,duration);
    }
    this.transition={from,to,start:now,end:now+duration,target};this.scheduleSettlement();
  }
  update(intensity) {
    this.intensity=clamp(intensity);this.settle();
    const desired=selectFireRegion(this.intensity,this.desiredRegion);
    if(desired===this.desiredRegion)return;
    this.desiredRegion=desired;
    if(this.active)this.transitionTo(desired);
  }
  play() {
    if(this.disposed||this.active)return;
    this.settle();this.active=true;
    this.desiredRegion=selectFireRegion(this.intensity,this.desiredRegion);
    if(!this.voices.size){
      this.currentRegion=this.desiredRegion;this.createVoice(this.currentRegion,1);
    }else if(this.transition?.target!==this.desiredRegion&&this.currentRegion!==this.desiredRegion){
      this.transitionTo(this.desiredRegion);
    }else if(this.transition&&this.transition.target!==this.desiredRegion){
      this.transitionTo(this.desiredRegion);
    }
    const now=this.context.currentTime;
    this.gain.gain.cancelAndHoldAtTime(now);
    this.gain.gain.linearRampToValueAtTime(1,now+this.recording.initialFadeSeconds);
  }
  pause() {
    if(this.disposed)return;
    this.active=false;const now=this.context.currentTime;
    this.gain.gain.cancelAndHoldAtTime(now);this.gain.gain.linearRampToValueAtTime(0,now+.15);
    // Keep at most the existing pair until its scheduled transition settles.
    // Rapid pause/resume never starts additional copies or restarts the clip.
  }
  dispose() {
    if(this.disposed)return;
    this.pause();this.disposed=true;this.timers.clearTimeout(this.timer);this.transition=null;
    for(const id of [...this.voices.keys()])this.retire(id,this.context.currentTime+.2);
    this.timers.setTimeout(()=>this.gain.disconnect(),250);
  }
}
