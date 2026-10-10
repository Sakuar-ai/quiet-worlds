import { FireplaceRenderer } from './fireplace.js?v=phase2a-12';
import { FireplaceAudio, prepareFireRecording } from './fireplace-audio.js?v=fireplace-14';
import { worldIcon } from './world-icons.js?v=ocean-20';
import { drawOceanWorld } from './ocean.js?v=ocean-20';

const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const lerp = (a, b, amount) => a + (b - a) * amount;
const ease = (value) => value * value * (3 - 2 * value);
const wave = (value) => (Math.sin(value) + 1) / 2;

/** A scene is only its configuration and current intensity; it owns no UI. */
class Scene {
  constructor(config) {
    this.config = config;
    this.intensity = config.initialIntensity;
  }

  setIntensity(value) {
    this.intensity = clamp(value);
  }
}

const SCENES = {
  rain: {
    id: "rain", name: "Rain", mark: "⌇⌇", accent: "#396b9c", initialIntensity: .36,
    labels: ["Drizzle", "Downpour"], whisper: "A little rain, held softly.",
    descriptions: ["Soft rain is gathering.", "The rain is becoming steady.", "The weather is opening up."],
    aria: "Hand-drawn rain falling into circular water ripples",
    audio: [
      { label: "Witley outdoor rainfall", kind: "recording", url: "./audio/rain-witley.mp3", gain: .85 },
      { label: "Callahan outdoor rainfall", kind: "recording", url: "./audio/rain-callahan.mp3", gain: .85 }
    ]
  },
  fireplace: {
    id: "fireplace", name: "Fireplace", mark: "♨", accent: "#b65332", initialIntensity: .42,
    labels: ["Embers", "Roaring Fire"], whisper: "",
    descriptions: ["A few embers are breathing.", "The fire is gently unfolding.", "The logs are speaking brightly."],
    aria: "A simple hand-drawn brick fireplace with small moving flames",
    audio: [
      { label: "slider-selected natural fireplace regions", kind: "fireplace", manifest: "./audio/fireplace-visionear-regions-v2.json" }
    ]
  },
  forest: {
    id: "forest", name: "Forest", mark: "♧♧", accent: "#557d65", initialIntensity: .30,
    labels: ["Still", "Breeze"], whisper: "Leaves finding their own rhythm.",
    descriptions: ["The forest is almost still.", "A soft breeze is in the leaves.", "The trees are leaning together."],
    aria: "A sparse hand-drawn forest with trees and moving foliage",
    audio: [
      { label: "quiet leaves", kind: "noise", frequency: 2200, q: .5, gain: .025 },
      { label: "moving leaves", kind: "noise", frequency: 900, q: .28, gain: .036 },
      { label: "low wind", kind: "noise", frequency: 230, q: .3, gain: .030 }
    ]
  },
  ocean: {
    id: "ocean", name: "Ocean", mark: "〰〰", accent: "#5f8fab", initialIntensity: .40,
    labels: ["Calm", "Waves"], whisper: "The water keeps a rounded edge.",
    descriptions: ["The ocean is resting.", "Rounded waves are arriving.", "The water is moving in layers."],
    aria: "Rounded hand-drawn blue waves with playful white foam",
    audio: [
      { label: "shore hush", kind: "noise", frequency: 1200, q: .25, gain: .040 },
      { label: "rolling wave", kind: "noise", frequency: 520, q: .22, gain: .050 },
      { label: "deep water", kind: "noise", frequency: 180, q: .18, gain: .048 }
    ]
  },
  snow: {
    id: "snow", name: "Snow", mark: "✳", accent: "#72729f", initialIntensity: .32,
    labels: ["Light", "Heavy"], whisper: "A quiet street under falling snow.",
    descriptions: ["A few snowflakes pass by.", "The air is filling with snow.", "A gentle snowfall is surrounding you."],
    aria: "A hand-drawn street lamp and bench in a soft falling snow scene",
    audio: [
      { label: "winter air", kind: "noise", frequency: 1800, q: .5, gain: .018 },
      { label: "soft snow wind", kind: "noise", frequency: 700, q: .34, gain: .025 },
      { label: "low winter wind", kind: "noise", frequency: 190, q: .25, gain: .028 }
    ]
  }
};


class SceneRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d", { alpha: true });
    this.scene = new Scene(SCENES.rain);
    this.fireplace = new FireplaceRenderer(canvas.parentElement);
    this.reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    this.bounds = { width: 0, height: 0, dpr: 1 };
    this.start = performance.now();
    this.frame = null;
    this.resize = this.resize.bind(this);
    this.render = this.render.bind(this);
    new ResizeObserver(this.resize).observe(canvas);
    this.resize();
    this.frame = requestAnimationFrame(this.render);
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (!rect.width || !rect.height) return;
    this.bounds = { width: rect.width, height: rect.height, dpr };
    this.canvas.width = Math.round(rect.width * dpr);
    this.canvas.height = Math.round(rect.height * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  setScene(config) {
    if (this.scene.config.id !== config.id && this.bounds.width && this.bounds.height) {
      // One transient outgoing canvas, not a pre-rendered animation or frame sequence.
      const snapshot = document.createElement('canvas');
      snapshot.width = this.canvas.width; snapshot.height = this.canvas.height;
      snapshot.getContext('2d').drawImage(this.canvas, 0, 0);
      this.transition = { snapshot, start: performance.now() };
    }
    this.scene = new Scene(config);
    this.fireplace.setVisible(config.id === 'fireplace');
    this.canvas.setAttribute('aria-hidden', String(config.id === 'fireplace'));
    this.canvas.setAttribute("aria-label", config.aria);
  }

  setIntensity(value) { this.scene.setIntensity(value); }
  setReducedMotion(value) { this.reducedMotion = value; }

  render(now) {
    const { width: w, height: h } = this.bounds;
    if (!w || !h) { this.frame = requestAnimationFrame(this.render); return; }
    const ctx = this.ctx;
    ctx.clearRect(0, 0, w, h);
    const pace = this.reducedMotion ? .22 : 1;
    const t = ((now - this.start) / 1000) * pace;
    const { id } = this.scene.config;
    const fade = this.transition ? clamp((now - this.transition.start) / 450) : 1;
    ctx.save(); ctx.globalAlpha = fade;
    if (id === "rain") this.drawRain(ctx, w, h, t);
    if (id === "fireplace") this.fireplace.update(now / 1000, this.scene.intensity, this.reducedMotion);
    if (id === "forest") this.drawForest(ctx, w, h, t);
    if (id === "ocean") this.drawOcean(ctx, w, h, t);
    if (id === "snow") this.drawSnow(ctx, w, h, t);
    ctx.restore();
    if (this.transition && fade < 1) { ctx.save(); ctx.globalAlpha = 1 - fade; ctx.drawImage(this.transition.snapshot, 0, 0, w, h); ctx.restore(); }
    else this.transition = null;
    this.frame = requestAnimationFrame(this.render);
  }

  line(ctx, points, color, width = 1.3, alpha = 1) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    points.forEach(([x, y], index) => index ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
    ctx.stroke();
    ctx.restore();
  }

  curve(ctx, start, curves, color, width = 1.35, alpha = 1) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(...start);
    curves.forEach((curve) => ctx.bezierCurveTo(...curve));
    ctx.stroke();
    ctx.restore();
  }

  fillPath(ctx, points, fill, alpha = 1) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = fill;
    ctx.beginPath();
    points.forEach(([x, y], index) => index ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  drawRain(ctx, w, h, t) {
    const i=this.scene.intensity, blue="#28658e", pale="#85abc5", waterY=h*.57;
    const hash=n=>{const r=Math.sin(n*127.1+31.7)*43758.5453;return r-Math.floor(r);};
    // One cached pencil-paper water layer; every falling drop and ring is live geometry.
    if(!this.rainWater || this.rainWater.width!==Math.round(w) || this.rainWater.height!==Math.round(h)) {
      const surface=document.createElement("canvas");surface.width=Math.round(w);surface.height=Math.round(h);
      const c=surface.getContext("2d");
      c.fillStyle="rgba(126,173,204,.26)";c.beginPath();c.moveTo(0,waterY+8);
      for(let x=0;x<=w+10;x+=10)c.lineTo(x,waterY+Math.sin(x*.039)*4+hash(x)*4);
      c.lineTo(w,h*.92);
      for(let x=w;x>=0;x-=10)c.lineTo(x,h*(.95+hash(x)*.012));
      c.closePath();c.fill();
      for(let n=0;n<1900;n++){
        const x=hash(n*3)*w,y=waterY+hash(n*3+1)*h*.39;
        this.line(c,[[x,y],[x+3+hash(n+5)*12,y-1]],n%6===0?"#ffffff":"#76a3c0",.5+hash(n+6)*1.8,n%6===0?.7:.07+hash(n+8)*.18);
      }
      for(let n=0;n<45;n++){
        const x=hash(n+400)*w,y=waterY+hash(n+510)*h*.34;
        this.curve(c,[x,y],[[x-4,y+2,x-4,y+5,x+2,y+6]],"#ffffff",1.4,.7);
      }
      this.rainWater=surface;
    }
    ctx.drawImage(this.rainWater,0,0,w,h);
    this.curve(ctx,[0,waterY+4],[[w*.2,waterY-4,w*.4,waterY+8,w*.61,waterY+1],[w*.8,waterY-3,w*.9,waterY+5,w,waterY+2]],pale,1.3,.75);
    // Distant rain creates depth without obscuring the distinct foreground drops.
    for(let n=0;n<30+Math.round(i*95);n++){
      const x=hash(n+40)*w, p=(t*(.29+i*.48)*(1+hash(n)*.4)+hash(n+3))%1;
      const y=p*(h*.91+30)-30, length=9+hash(n+9)*21+i*11;
      this.line(ctx,[[x,y],[x-.7,y+length]],n%5===0?blue:pale,n%5===0?1.25:.85,.18+hash(n+1)*.4);
    }
    const anchors=[[.16,.61],[.76,.64],[.37,.68],[.9,.75],[.12,.77],[.57,.82],[.3,.9],[.79,.94],[.64,.72],[.04,.87],[.93,.91],[.49,.96],[.22,.73],[.72,.87]];
    const count=7+Math.round(i*7);
    for(let n=0;n<count;n++){
      const [nx,ny]=anchors[n],x=nx*w,y=ny*h;
      const cycle=(t*(.19+i*.16)+n*.381966)%1;
      const depth=(ny-.57)/.4;
      const radius=(17+depth*58)*(0.95+i*.35);
      const drawRing=(rx,alpha,shift=0)=>{
        for(let arc=0;arc<3;arc++){
          const start=arc*Math.PI*2/3+.09+shift,end=start+1.8;
          ctx.save();ctx.globalAlpha=alpha;ctx.lineCap="round";
          ctx.beginPath();ctx.ellipse(x,y,rx,rx*.22,.025*Math.sin(n),start,end);
          ctx.strokeStyle="#fbfbfc";ctx.lineWidth=3.8;ctx.stroke();
          ctx.beginPath();ctx.ellipse(x+.7,y+.8,rx+1,rx*.22+.4,.025*Math.sin(n),start+.05,end-.08);
          ctx.strokeStyle=blue;ctx.lineWidth=1.25+depth*.45;ctx.stroke();ctx.restore();
        }
      };
      // Rings persist gently until the next drop reaches this exact impact point.
      const ringPhase=cycle<.46?(cycle+.54):cycle-.46;
      for(let ring=0;ring<3;ring++){
        const spread=(ringPhase+ring*.23)%1;
        drawRing(5+spread*radius,(1-spread)*.72+.12,ring*.37);
      }
      if(cycle<.46){
        const p=cycle/.46,dy=-35+p*(y+35),size=4+depth*3+i*1.5;
        ctx.save();ctx.strokeStyle=blue;ctx.fillStyle="#fbfbfc";ctx.globalAlpha=.88;ctx.lineWidth=1.6;
        ctx.beginPath();ctx.moveTo(x,dy-size*2.8);ctx.bezierCurveTo(x-size,dy-size,x-size,dy+size*.8,x,dy+size);ctx.bezierCurveTo(x+size,dy+size*.8,x+size,dy-size,x,dy-size*2.8);ctx.fill();ctx.stroke();ctx.restore();
      }else if(cycle<.60){
        const height=Math.sin((cycle-.46)/.14*Math.PI)*(15+depth*22+i*12);
        ctx.save();ctx.strokeStyle=blue;ctx.fillStyle="#ffffff";ctx.lineWidth=1.5;
        ctx.beginPath();ctx.moveTo(x-3.5,y);ctx.quadraticCurveTo(x-2,y-height*.8,x,y-height);ctx.quadraticCurveTo(x+3,y-height*.5,x+3.5,y);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();
        drawRing(7+depth*6,.95);
      }
    }
  }

  drawForest(ctx, w, h, t) {
    const i = this.scene.intensity;
    const green="#557d65", light="#8baa85", trunk="#766154", ground="#7e9d7d";
    const floor=h*.84;
    this.curve(ctx,[0,floor],[[w*.17,floor-7,w*.31,floor+3,w*.5,floor-3],[w*.72,floor-9,w*.86,floor+4,w,floor-2]],ground,1.1,.46);
    const trees=[.17,.35,.65,.84];
    trees.forEach((position, index) => {
      const height=h*(index%2?.53:.61); const x=w*position; const bottom=floor+((index%3)-1)*8; const sway=Math.sin(t*(.55+i*1.3)+index)*i*7;
      this.line(ctx,[[x,bottom],[x+sway,bottom-height]],trunk,2.2,.76);
      this.line(ctx,[[x+sway,bottom-height*.58],[x+sway-w*.105,bottom-height*.76]],trunk,1.35,.62);
      this.line(ctx,[[x+sway,bottom-height*.4],[x+sway+w*.11,bottom-height*.6]],trunk,1.25,.62);
      const clusters=6+index%2;
      for(let c=0;c<clusters;c++) {
        const angle=c*1.81+index; const radius=w*(.055+(c%3)*.012); const cx=x+sway+Math.cos(angle)*radius; const cy=bottom-height*(.25+(c%4)*.11)+Math.sin(angle)*height*.09; const leafS=8+(c%3)*4;
        ctx.save();ctx.globalAlpha=.55;ctx.strokeStyle=c%2?green:light;ctx.lineWidth=2.7;ctx.lineCap="round";ctx.beginPath();ctx.moveTo(cx-leafS,cy+leafS*.3);ctx.bezierCurveTo(cx-leafS*.6,cy-leafS,cx+leafS*.6,cy-leafS,cx+leafS,cy+leafS*.3);ctx.stroke();ctx.restore();
      }
    });
    // A sparse foreground of pencil leaves, never animals or flowers.
    for(let n=0;n<15;n++) { const x=(n*47%100)/100*w; const y=floor+15+(n%4)*14; const sway=Math.sin(t*(1+i*2)+n)*i*8; this.line(ctx,[[x,y],[x+sway-3,y-14-(n%3)*5]],green,.9,.5); }
    const drifts=Math.floor(i*13);
    for(let n=0;n<drifts;n++) { const phase=(t*(.12+i*.38)+n*.37)%1; const x=((n*71)%100)/100*w+Math.sin(phase*Math.PI*2)*w*.08; const y=h*.18+phase*h*.58; this.curve(ctx,[x-3,y],[[x-6,y-5,x+1,y-8,x+5,y-1]],light,1.2,(1-phase)*.45); }
  }

  drawOcean(ctx, w, h, t) {
    this.oceanState=drawOceanWorld(ctx,w,h,t,this.scene.intensity);
  }

  drawSnow(ctx, w, h, t) {
    const i=this.scene.intensity, violet="#72729f", blue="#a9b9d3", dark="#424656"; const floor=h*.83;
    // Snowy ground stays white: only a few lavender pencil contours.
    this.curve(ctx,[0,floor],[[w*.16,floor-11,w*.35,floor+5,w*.53,floor-4],[w*.75,floor-12,w*.86,floor+3,w,floor-2]],blue,1.1,.45);
    for(let n=0;n<4;n++){ const y=floor+23+n*20; this.curve(ctx,[0,y],[[w*.2,y-5,w*.48,y+3,w*.65,y-1],[w*.8,y-4,w*.9,y+2,w,y]],blue,.7,.2); }
    // The lone lamp.
    const lx=w*.73, lampTop=h*.31, lampBottom=floor+10;
    this.line(ctx,[[lx,lampBottom],[lx,lampTop+38]],dark,2.5,.8); this.line(ctx,[[lx-6,lampBottom],[lx+6,lampBottom]],dark,1.5,.75);
    this.curve(ctx,[lx-13,lampTop+20],[[lx-14,lampTop+31,lx-9,lampTop+37,lx,lampTop+38],[lx+9,lampTop+37,lx+14,lampTop+31,lx+13,lampTop+20]],dark,1.45,.82);
    this.line(ctx,[[lx-13,lampTop+20],[lx-8,lampTop+12],[lx+8,lampTop+12],[lx+13,lampTop+20],[lx-13,lampTop+20]],dark,1.4,.82);
    ctx.save();ctx.globalAlpha=.24;ctx.fillStyle="#f5d987";ctx.fillRect(lx-9,lampTop+19,18,15);ctx.restore();
    // One simple bench, no holiday decoration.
    const bx=w*.15, by=floor-8; this.line(ctx,[[bx,by],[bx+w*.3,by+4]],"#81685e",3.5,.75);this.line(ctx,[[bx+3,by+12],[bx+w*.29,by+16]],"#81685e",3,.72);this.line(ctx,[[bx+9,by+15],[bx+6,by+36]],"#81685e",1.7,.75);this.line(ctx,[[bx+w*.25,by+18],[bx+w*.28,by+39]],"#81685e",1.7,.75);
    const snow=Math.floor(18+i*120);
    for(let n=0;n<snow;n++) { const seed=n*9.17; const phase=(t*(.1+i*.34)*(1+(n%5)*.1)+seed)%1; const x=(((Math.sin(seed*3.9)*.5+.5)*w)+(Math.sin(phase*6.28+seed)*w*.06*(.4+i)))%w; const y=phase*(h+30)-15; const r=1+(n%5)*.4+i*(n%7===0?2.1:.8);ctx.save();ctx.globalAlpha=.35+(n%6)*.08;ctx.fillStyle=n%4?"#ffffff":blue;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();ctx.restore(); }
  }
}

/** Rain uses field recordings; other scenes retain their prototype sound textures. */
class AudioMixer {
  constructor() {
    this.context = null;
    this.master = null;
    this.layers = [];
    this.isPlaying = false;
    this.buffers = new Map();
    this.recordings = new Map();
    this.request = 0;
    this.intensity = .36;
  }

  async play(scene) {
    const request=++this.request;
    if (!this.context) this.createContext();
    await this.context.resume();
    if(this.currentScene!==scene.config.id){
      const buffers=await Promise.all(scene.config.audio.map(layer=>layer.kind==="fireplace"?this.loadFireRecording(layer):layer.kind==="recording"?this.loadRecording(layer.url,layer):null));
      if(request!==this.request) return false;
      this.buildScene(scene.config,buffers);
    }
    if(request!==this.request) return false;
    this.master.gain.setTargetAtTime(.54, this.context.currentTime, .18);
    this.fireMaster.gain.setTargetAtTime(1, this.context.currentTime, .18);
    this.isPlaying = true;
    this.update(scene.intensity);
    this.fireAudio?.play();
    return true;
  }

  pause() {
    this.request++;
    this.isPlaying = false;
    this.fireAudio?.pause();
    if (!this.context) return;
    this.master.gain.setTargetAtTime(0, this.context.currentTime, .12);
    this.fireMaster.gain.setTargetAtTime(0, this.context.currentTime, .12);
  }

  createContext() {
    this.context = new (window.AudioContext || window.webkitAudioContext)();
    this.master = this.context.createGain();
    this.master.gain.value = 0;
    const limiter=this.context.createDynamicsCompressor();
    limiter.threshold.value=-6;limiter.knee.value=6;limiter.ratio.value=8;limiter.attack.value=.015;limiter.release.value=.25;
    this.master.connect(limiter).connect(this.context.destination);
    // Fireplace reference path: unity playback, no compressor or tonal processing.
    // Other scenes retain their existing master and safety limiter unchanged.
    this.fireMaster=this.context.createGain();this.fireMaster.gain.value=0;
    this.fireMaster.connect(this.context.destination);
  }

  buildScene(config, buffers=[]) {
    if (!this.context) return;
    const oldBus = this.sceneBus;
    if (oldBus) { oldBus.gain.setTargetAtTime(0, this.context.currentTime, .12); setTimeout(() => oldBus.disconnect(), 2200); }
    this.fireAudio?.dispose();this.fireAudio=null;
    this.layers.filter(layer=>!layer.fireBed).forEach(({ source }) => source.stop(this.context.currentTime + 2));
    this.sceneBus = this.context.createGain(); this.sceneBus.gain.value = 0;
    this.sceneBus.connect(config.id==='fireplace'?this.fireMaster:this.master);
    this.layers = config.audio.map((layer,index) => {
      if(layer.kind==='fireplace'){
        this.fireAudio=new FireplaceAudio(this.context,this.sceneBus,buffers[index]);
        return {gain:this.fireAudio.gain,fireBed:true};
      }
      return layer.kind==="recording"?this.createRecordingLayer(layer,buffers[index]):this.createNoiseLayer(layer);
    });
    this.sceneBus.gain.setTargetAtTime(1, this.context.currentTime, .2);
    this.currentScene = config.id;
  }

  async loadRecording(url, options = {}) {
    const key = `${url}:${options.start ?? 8}:${options.duration ?? 36}:${options.profile ?? 'rain'}`;
    if(!this.buffers.has(key)) {
      const loading=(async()=>{
        if (!this.recordings.has(url)) {
          const decoded = fetch(url).then(response => { if (!response.ok) throw new Error('Recording could not be loaded'); return response.arrayBuffer(); }).then(bytes => this.context.decodeAudioData(bytes));
          this.recordings.set(url, decoded);
          decoded.catch(() => this.recordings.delete(url));
        }
        const original=await this.recordings.get(url);
        const rate=original.sampleRate, fade=Math.round(rate*1.8);
        const start=Math.round(rate*(options.start ?? 8)), length=Math.min(Math.round(rate*(options.duration ?? 36)),original.length-start-fade);
        if(length<fade*2)throw new Error("Recording is too short");
        const loop=this.context.createBuffer(original.numberOfChannels,length,rate);
        let power=0;
        for(let ch=0;ch<original.numberOfChannels;ch++){
          const input=original.getChannelData(ch),output=loop.getChannelData(ch);
          for(let n=0;n<length;n++){
            let value=input[start+fade+n];
            if(n>=length-fade){const p=(n-length+fade)/fade;value=value*Math.cos(p*Math.PI/2)+input[start+n-length+fade]*Math.sin(p*Math.PI/2);}
            output[n]=value;power+=value*value;
          }
        }
        const rms=Math.sqrt(power/(length*original.numberOfChannels));
        const gain=.13/Math.max(rms,.0001);
        const ceiling=.72;
        // Soften isolated close-mic impacts without turning the entire rain bed down.
        for(let ch=0;ch<loop.numberOfChannels;ch++){
          const samples=loop.getChannelData(ch);
          for(let n=0;n<samples.length;n++)samples[n]=ceiling*Math.tanh(samples[n]*gain/ceiling);
          const bridge=Math.round(rate*.002);
          for(let n=0;n<bridge;n++){const p=n/(bridge-1),blend=p*p*(3-2*p),index=samples.length-bridge+n;samples[index]=samples[index]*(1-blend)+samples[0]*blend;}
        }
        return loop;
      })();
      this.buffers.set(key,loading);
      loading.catch(()=>this.buffers.delete(key));
    }
    return this.buffers.get(key);
  }

  async loadFireRecording(layer) {
    const key=layer.manifest;
    if(!this.buffers.has(key)){
      const loading=(async()=>{
        const response=await fetch(key);if(!response.ok)throw Error('Fire region metadata could not load');
        const manifest=await response.json();
        const buffers=await Promise.all(manifest.regions.map(async region=>{
          const response=await fetch(region.url);if(!response.ok)throw Error('Fire region could not load');
          return this.context.decodeAudioData(await response.arrayBuffer());
        }));
        return prepareFireRecording(this.context,buffers,manifest);
      })();
      this.buffers.set(key,loading);loading.catch(()=>this.buffers.delete(key));
    }
    return this.buffers.get(key);
  }

  createRecordingLayer(layer,buffer) {
    const source=this.context.createBufferSource();source.buffer=buffer;source.loop=true;
    const lowCut=this.context.createBiquadFilter();lowCut.type="highpass";lowCut.frequency.value=layer.lowCut ?? 75;lowCut.Q.value=.707;
    const highCut=this.context.createBiquadFilter();highCut.type="lowpass";highCut.frequency.value=layer.highCut ?? 8500;highCut.Q.value=.707;
    const gain=this.context.createGain();gain.gain.value=0;
    source.connect(lowCut).connect(highCut).connect(gain).connect(this.sceneBus);source.start();
    source.onended=()=>{source.disconnect();lowCut.disconnect();highCut.disconnect();gain.disconnect();};
    return {source,gain,maxGain:layer.gain};
  }

  createNoiseLayer(layer) {
    const buffer = this.context.createBuffer(1, this.context.sampleRate * 2, this.context.sampleRate);
    const data = buffer.getChannelData(0);
    let previous = 0;
    for (let n = 0; n < data.length; n++) { const white = Math.random() * 2 - 1; previous = previous * .92 + white * .08; data[n] = previous; }
    const source = this.context.createBufferSource(); source.buffer = buffer; source.loop = true;
    const filter = this.context.createBiquadFilter(); filter.type = "bandpass"; filter.frequency.value = layer.frequency; filter.Q.value = layer.q;
    const gain = this.context.createGain(); gain.gain.value = 0;
    source.connect(filter).connect(gain).connect(this.sceneBus); source.start();
    source.onended=()=>{source.disconnect();filter.disconnect();gain.disconnect();};
    return { source, gain, maxGain: layer.gain };
  }

  update(intensity) {
    if (!this.context || !this.layers.length) return;
    this.intensity = intensity;
    if(this.currentScene === 'fireplace') {
      this.fireAudio.update(intensity);
      return;
    }
    if(this.currentScene==="rain"){
      const p=ease(intensity);
      const mixes=[Math.cos(p*Math.PI/2),Math.sin(p*Math.PI/2)];
      mixes.forEach((mix,index)=>this.layers[index].gain.gain.setTargetAtTime(mix*this.layers[index].maxGain,this.context.currentTime,.4));
      return;
    }
    const low = 1 - ease(clamp((intensity - .18) / .46));
    const mid = Math.sin(clamp((intensity + .12) / 1.22) * Math.PI) * .9;
    const high = ease(clamp((intensity - .38) / .58));
    [low, mid, high].forEach((mix, index) => this.layers[index]?.gain.gain.setTargetAtTime(mix * this.layers[index].maxGain, this.context.currentTime, .18));
  }

}

class IntensitySlider {
  constructor(input, onChange) {
    this.input = input; this.onChange = onChange;
    input.addEventListener("input", () => { this.paintTrack(); onChange(Number(input.value) / 1000); });
    this.paintTrack();
  }
  paintTrack() { const fraction=Number(this.input.value)/1000; this.input.parentElement.style.setProperty("--thumb-center",`calc(${fraction*100}% + ${12.5-fraction*25}px)`); }
  set(value) { this.input.value = Math.round(value * 1000); this.paintTrack(); }
}

class Timer {
  constructor(label, onFinish) { this.label=label; this.onFinish=onFinish; this.duration=30*60; this.remaining=this.duration; this.active=false; this.last=null; this.frame=null; this.tick=this.tick.bind(this); }
  setDuration(minutes) { this.duration=Math.max(0, Math.round(minutes*60)); this.remaining=this.duration; this.last=performance.now(); this.paint(); return this.duration; }
  setActive(active) { if(this.active===active) return; cancelAnimationFrame(this.frame); this.active=active; this.last=performance.now(); if(active) { if(this.duration && this.remaining===0) this.remaining=this.duration; this.frame=requestAnimationFrame(this.tick); } }
  tick(now) { if(!this.active) return; if(this.duration) { this.remaining=Math.max(0,this.remaining-(now-this.last)/1000); if(this.remaining===0){this.active=false; this.paint(); this.onFinish(); return;} } this.last=now; this.paint(); this.frame=requestAnimationFrame(this.tick); }
  paint() {
    const seconds=Math.ceil(this.remaining);
    this.label.textContent=!this.duration ? "no timer" : this.remaining===this.duration ? `${Math.round(this.duration/60)} min` : `${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,"0")}`;
    this.label.closest("button").setAttribute("aria-label", `Change timer; ${this.duration ? this.label.textContent + " remaining" : "timer off"}`);
  }
}

class PlaybackControls {
  constructor(button, onToggle) { this.button=button; this.onToggle=onToggle; this.playing=false; button.addEventListener("click",()=>onToggle()); }
  setPlaying(playing, name) { this.playing=playing; this.button.dataset.playing=String(playing); this.button.setAttribute("aria-label", `${playing ? "Pause" : "Play"} ${name}`); this.button.querySelector("path").setAttribute("d", playing ? "M8 6v12M16 6v12" : "m9 6 9 6-9 6Z"); }
}

const $ = (selector) => document.querySelector(selector);
const app = $(".app"), renderer = new SceneRenderer($("#scene-canvas")), mixer = new AudioMixer();
let current = renderer.scene;
let wakeLock = null;
let toastTimeout = null;
let playbackRequest = 0;

const showToast = (message) => { const toast=$("#toast"); toast.textContent=message; toast.classList.add("show"); clearTimeout(toastTimeout); toastTimeout=setTimeout(()=>toast.classList.remove("show"),2400); };
const intensityText = (scene, value) => scene.config.descriptions[value < .34 ? 0 : value < .7 ? 1 : 2];

const timer = new Timer($("#timer-label"), () => { pause(); showToast("The timer has finished. This world is resting."); });
const controls = new PlaybackControls($("#play-trigger"), () => current && (controls.playing ? pause() : play()));
const slider = new IntensitySlider($("#intensity-slider"), (value) => {
  current.setIntensity(value); renderer.setIntensity(value); mixer.update(value);
  $("#intensity-description").textContent = intensityText(current, value);
  if (!controls.playing) play();
});

async function play() {
  const request=++playbackRequest;
  controls.setPlaying(true,current.config.name);
  $("#play-trigger").setAttribute("aria-busy","true");
  $("#intensity-description").textContent="Loading this world’s sound…";
  try {
    const started=await mixer.play(current);
    if(request!==playbackRequest || started===false) return;
    timer.setActive(true);
    $("#intensity-description").textContent=intensityText(current,current.intensity);
    if($("#keep-awake-toggle").checked) requestWakeLock();
  } catch {
    if(request!==playbackRequest)return;
    controls.setPlaying(false,current.config.name);mixer.pause();timer.setActive(false);releaseWakeLock();
    $("#intensity-description").textContent="Sound could not load. Tap play to retry.";
    showToast("Could not load the sound. Check your connection and tap play again.");
  } finally { if(request===playbackRequest)$("#play-trigger").removeAttribute("aria-busy"); }
}
function pause() { playbackRequest++; mixer.pause(); controls.setPlaying(false,current.config.name); $("#play-trigger").removeAttribute("aria-busy"); $("#intensity-description").textContent=intensityText(current,current.intensity); timer.setActive(false); releaseWakeLock(); }

function setScene(id) {
  const config=SCENES[id]; if(!config) return;
  const wasPlaying=controls.playing;
  playbackRequest++;
  current=new Scene(config); renderer.setScene(config); renderer.setIntensity(current.intensity); slider.set(current.intensity);
  app.dataset.scene=config.id; app.style.setProperty("--accent",config.accent);
  $("#scene-name").textContent=config.name; $("#scene-mark").innerHTML=worldIcon(config.id,'header');
  $("#intensity-low").textContent=config.labels[0]; $("#intensity-high").textContent=config.labels[1]; $("#world-whisper").textContent=config.whisper; $("#intensity-description").textContent=intensityText(current,current.intensity);
  controls.setPlaying(wasPlaying,config.name);
  if (!wasPlaying) mixer.pause();
  if(wasPlaying) play();
  renderSceneList(); closeSheets();
}

function renderSceneList() {
  const list=$("#scene-list"); list.innerHTML="";
  Object.values(SCENES).forEach((config)=>{
    const button=document.createElement('button');
    button.className='scene-option'; button.type='button'; button.dataset.world=config.id;
    button.style.setProperty('--scene-accent',config.accent);
    button.setAttribute('aria-current',String(config.id===current.config.id));
    button.setAttribute('aria-label',`${config.name}: ${config.labels[0]} to ${config.labels[1]}`);
    button.innerHTML=`<span class="world-art">${worldIcon(config.id)}</span><span class="option-label"><strong>${config.name}</strong><small>${config.labels[0]} — ${config.labels[1]}</small></span>`;
    button.addEventListener('click',()=>setScene(config.id));list.append(button);
  });
}

let sheetTrigger = null;
function openSheet(id, trigger) {
  const sheet=document.getElementById(id);
  if(!sheet) return;
  closeSheets();
  sheetTrigger=trigger;
  sheet.hidden=false;
  trigger?.setAttribute("aria-expanded","true");
  if(id==="timer-sheet") document.querySelectorAll("[data-minutes]").forEach(button=>button.setAttribute("aria-pressed",String(Number(button.dataset.minutes)*60===timer.duration)));
  sheet.querySelector(".sheet-panel button, .sheet-panel input")?.focus();
}
function closeSheets() { document.querySelectorAll(".sheet").forEach((sheet)=>sheet.hidden=true); document.querySelectorAll("[aria-expanded='true']").forEach((button)=>button.setAttribute("aria-expanded","false")); sheetTrigger?.focus(); sheetTrigger=null; }

async function requestWakeLock(){ try { if("wakeLock" in navigator) wakeLock=await navigator.wakeLock.request("screen"); } catch { /* Device policy can decline this quietly. */ } }
async function releaseWakeLock(){ if(wakeLock){ await wakeLock.release(); wakeLock=null; } }

$("#scene-trigger").addEventListener("click",()=>openSheet("scene-sheet",$("#scene-trigger")));
$("#settings-trigger").addEventListener("click",()=>openSheet("settings-sheet",$("#settings-trigger")));
$("#credits-trigger").addEventListener("click",()=>{
  openSheet("credits-sheet",$("#settings-trigger"));
  $("#credits-trigger").setAttribute("aria-expanded","true");
  $(".credits-worlds").scrollTop=0;
});
function backToSettings(){openSheet("settings-sheet",$("#settings-trigger"));$("#credits-trigger").focus();}
$("#credits-back").addEventListener("click",backToSettings);
document.querySelectorAll("[data-close-sheet]").forEach((button)=>button.addEventListener("click",closeSheets));
$("#timer-trigger").addEventListener("click",()=>openSheet("timer-sheet",$("#timer-trigger")));
document.querySelectorAll("[data-minutes]").forEach((button)=>button.addEventListener("click",()=>{ const minutes=Number(button.dataset.minutes); timer.setDuration(minutes); closeSheets(); showToast(`Timer set for ${minutes} minutes.`); }));
$("#custom-timer-form").addEventListener("submit",(event)=>{ event.preventDefault(); const input=$("#custom-minutes"); const minutes=Number(input.value); if(!Number.isInteger(minutes)||minutes<1||minutes>360){input.reportValidity();return;} timer.setDuration(minutes); input.value=""; closeSheets(); showToast(`Timer set for ${minutes} minutes.`); });
$("#timer-off").addEventListener("click",()=>{timer.setDuration(0);closeSheets();showToast("The timer is off.");});
$("#favorite-trigger").addEventListener("click",(event)=>{ const next=event.currentTarget.getAttribute("aria-pressed")!=="true";event.currentTarget.setAttribute("aria-pressed",String(next));event.currentTarget.setAttribute("aria-label",`${next?"Remove":"Add"} ${current.config.name} ${next?"from":"to"} favorites`);showToast(next?`${current.config.name} is saved for later.`:`${current.config.name} is no longer saved.`); });
$("#motion-toggle").addEventListener("change",(event)=>{ renderer.setReducedMotion(event.target.checked); showToast(event.target.checked?"Movement has slowed down.":"Movement is back to its natural pace."); });
$("#keep-awake-toggle").addEventListener("change",(event)=>{ if(event.target.checked&&controls.playing) requestWakeLock(); if(!event.target.checked) releaseWakeLock(); });
document.addEventListener("visibilitychange",()=>{ if(document.visibilityState==="visible"&&controls.playing&&$("#keep-awake-toggle").checked) requestWakeLock(); });
document.addEventListener("keydown",(event)=>{
  if(event.key==="Escape") { if(!$("#credits-sheet").hidden) backToSettings(); else closeSheets(); }
  const sheet=document.querySelector(".sheet:not([hidden])");
  if(sheet && event.key==="Tab") {
    const focusable=[...sheet.querySelectorAll("button, input, a[href]")]; const first=focusable[0], last=focusable.at(-1);
    if(event.shiftKey && document.activeElement===first){event.preventDefault();last.focus();}
    else if(!event.shiftKey && document.activeElement===last){event.preventDefault();first.focus();}
  }
  if(event.code==="Space"&&!sheet&&!event.target.closest("input, button, textarea, select, [contenteditable]")){event.preventDefault();controls.playing?pause():play();}
});

setScene("rain");
renderSceneList();
