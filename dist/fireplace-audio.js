// One long, pre-crossfaded bed + short non-looping events from the same source.
// No normalized excerpts, stacked continuous layers, synthesis or time stretching.
const clamp = n => Math.max(0, Math.min(1, n));

export function fireAudioParameters(intensity) {
  const i=clamp(intensity),p=i*i*(3-2*i);
  return {bedGain:.62+.12*p, highCut:2300+4000*p,
    eventGain:.18+.20*p, minimumGap:2.8-1.95*p,
    meanExtraGap:24*(1-p)**3+1.7,
    mediumProbability:i<.65?0:.18*((i-.65)/.35)};
}

export function prepareFireRecording(context,original,manifest) {
  const rate=original.sampleRate,fade=Math.round(manifest.crossfadeSeconds*rate),length=original.length-fade;
  if(length<rate*28||fade<rate)throw Error('Fire recording is too short');
  const bed=context.createBuffer(original.numberOfChannels,length,rate);
  for(let ch=0;ch<bed.numberOfChannels;ch++){
    const input=original.getChannelData(ch),out=bed.getChannelData(ch);
    out.set(input.subarray(fade));
    for(let n=0;n<fade;n++){
      const blend=.5-.5*Math.cos(Math.PI*n/(fade-1)),at=length-fade+n;
      out[at]=out[at]*(1-blend)+input[n]*blend;
    }
  }
  const events=manifest.events.map((entry,id)=>{
    const start=Math.round(entry.start*rate),length=Math.round(entry.duration*rate);
    if(start<0||start+length>original.length)throw Error('Invalid fire event');
    const buffer=context.createBuffer(original.numberOfChannels,length,rate);
    for(let ch=0;ch<buffer.numberOfChannels;ch++){
      const input=original.getChannelData(ch),out=buffer.getChannelData(ch);
      for(let n=0;n<length;n++){
        const attack=Math.min(1,n/(rate*.008)),release=Math.min(1,(length-1-n)/(rate*.07));
        out[n]=input[start+n]*attack*release;
      }
    }
    return {...entry,id,buffer};
  });
  return {bed,events};
}

// Audio-clock renewal process: non-periodic exponential waits, a hard quiet gap,
// no immediate/recent repeat, and no medium pops below 65%. No catch-up bursts.
export class CracklePlanner {
  constructor(random=Math.random){this.random=random;this.recent=[];}
  next(intensity,events){
    const p=fireAudioParameters(intensity),medium=this.random()<p.mediumProbability;
    let choices=events.filter(e=>e.size===(medium?'medium':'small')&&!this.recent.includes(e.id));
    if(!choices.length)choices=events.filter(e=>e.size===(medium?'medium':'small'));
    const event=choices[Math.min(choices.length-1,Math.floor(this.random()*choices.length))];
    this.recent=[...this.recent,event.id].slice(-3);
    return {event,wait:p.minimumGap+Math.min(75,-Math.log(Math.max(.000001,1-this.random()))*p.meanExtraGap),
      gain:p.eventGain*(.86+.28*this.random())};
  }
}

export class FireplaceAudio {
  constructor(context,bus,recording,{random=Math.random,timers=globalThis}={}){
    this.context=context;this.bus=bus;this.recording=recording;this.random=random;this.timers=timers;
    this.planner=new CracklePlanner(random);this.voices=new Set();this.intensity=.42;this.plannedIntensity=.42;this.active=false;this.disposed=false;
    this.source=context.createBufferSource();this.source.buffer=recording.bed;this.source.loop=true;
    this.filter=context.createBiquadFilter();this.filter.type='lowpass';this.filter.Q.value=.5;
    this.gain=context.createGain();this.gain.gain.value=0;
    this.source.connect(this.filter).connect(this.gain).connect(bus);
    this.source.start(0,random()*recording.bed.duration);
    this.source.onended=()=>{this.source.disconnect();this.filter.disconnect();this.gain.disconnect();};
    this.update(this.intensity);
  }
  update(intensity){
    this.intensity=clamp(intensity);const p=fireAudioParameters(this.intensity),now=this.context.currentTime;
    this.filter.frequency.setTargetAtTime(p.highCut,now,.65);
    this.gain.gain.setTargetAtTime(p.bedGain,now,.65);
    if(this.active&&Math.abs(this.plannedIntensity-this.intensity)>.025){
      this.plannedIntensity=this.intensity;
      // Re-plan future events when moving the slider; do not leave loud pops
      // queued after returning to Embers. Never interrupt a currently sounding event.
      for(const voice of [...this.voices])if(voice.at>now+.02){voice.source.stop();voice.source.disconnect();voice.gain.disconnect();this.voices.delete(voice);}
      this.nextAt=Math.max(now+.15,...[...this.voices].map(v=>v.end));this.pending=null;
      this.pump();
    }
  }
  play(){
    if(this.disposed||this.active)return;
    this.active=true;this.plannedIntensity=this.intensity;this.nextAt=this.context.currentTime+.15;this.pending=null;
    this.pump();this.timer=this.timers.setInterval(()=>this.pump(),1000);
  }
  pump(){
    if(!this.active||this.disposed)return;
    const now=this.context.currentTime,horizon=now+8;
    // A suspended context/tab can resume much later: skip missed events entirely.
    if((this.pending?.at??this.nextAt)<now){this.nextAt=now+.15;this.pending=null;}
    for(let n=0;n<12;n++){
      if(!this.pending){const choice=this.planner.next(this.intensity,this.recording.events);this.pending={...choice,at:this.nextAt+choice.wait};}
      if(this.pending.at>horizon)break;
      const {event,at,gain:level}=this.pending,source=this.context.createBufferSource(),gain=this.context.createGain();
      source.buffer=event.buffer;source.loop=false;gain.gain.value=level;
      source.connect(gain).connect(this.bus);
      const voice={source,gain,at,end:at+event.buffer.duration,id:event.id};this.voices.add(voice);
      source.onended=()=>{source.disconnect();gain.disconnect();this.voices.delete(voice);};
      source.start(at);source.stop(voice.end+.005);
      this.nextAt=voice.end;this.pending=null;
    }
  }
  pause(){
    this.active=false;this.timers.clearInterval(this.timer);this.pending=null;
    for(const voice of [...this.voices]){
      voice.gain.gain.setTargetAtTime(0,this.context.currentTime,.02);
      voice.source.stop(this.context.currentTime+.1);
    }
    this.voices.clear();
  }
  dispose(){
    if(this.disposed)return;this.pause();this.disposed=true;this.source.stop(this.context.currentTime+.2);
  }
}
