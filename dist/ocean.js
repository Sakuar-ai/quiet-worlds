// Live drawn waves, not a video or a frame sequence. Shared forms tie the
// scene and descriptive picker together; the header remains a small emblem.
const BODY='M3 157C34 159 54 134 68 102C80 72 91 46 119 41C147 33 174 42 183 56C194 73 180 84 164 77C149 79 139 98 146 119C158 148 189 158 230 153C245 167 223 183 190 186C126 190 61 177 4 177Z';
const FOAM='M62 114C71 96 76 76 87 62C84 52 95 42 104 46C108 34 124 34 132 41C144 34 159 38 164 46C179 42 195 57 186 71C182 80 172 80 166 74C163 81 155 81 153 72C146 77 139 71 140 65C132 68 131 75 127 79C121 85 115 80 118 72C108 79 102 88 99 95C95 102 87 102 87 94C79 104 74 116 68 120Z';
const FLOW='M30 155C59 151 75 118 84 94M48 165C79 156 91 124 96 113M103 97C101 132 119 155 145 165M130 113C136 147 163 169 207 166';
const CONTOUR='M3 157C34 159 54 134 68 102C80 72 91 46 119 41C147 33 174 42 183 56C194 73 180 84 164 77C149 79 139 98 146 119C158 148 189 158 230 153';
const INK='#648ea9',BLUE='#94bad0',PALE='#c6dce7',FOAM_INK='#86afc6';
const svgWave=(fill=BLUE)=>`<path d="${BODY}" fill="${fill}" stroke="${INK}" stroke-width="2"/><path d="${FOAM}" fill="#fff" stroke="${FOAM_INK}" stroke-width="1.6"/><path d="${FLOW}" fill="none" stroke="${INK}" stroke-width="1.8" opacity=".65"/>`;
export const OCEAN_ICON=Object.freeze({color:'#719fbd',header:`
  <path d="M2 25C8 28 12 17 18 17C22 17 23 21 20 21C17 21 17 27 22 27C28 27 29 20 34 20C38 20 37 22 35 23C32 27 37 27 39 25" fill="none" stroke="${INK}" stroke-width="1.8"/>
`,art:`<g data-wave="rear" transform="translate(51 4) scale(.27 .25)">${svgWave(PALE)}</g><g data-wave="main" transform="translate(4 5) scale(.4 .37)">${svgWave()}</g><g data-wave="front" transform="translate(57 39) scale(.26 .23)">${svgWave('#accddd')}</g>`});

// Three continuous water bands, driven by the app's one existing RAF.
const clamp=v=>Math.max(0,Math.min(1,Number.isFinite(v)?v:0));
export function oceanParameters(value){
  const i=clamp(value);
  return {intensity:i,crestHeight:.08+.92*Math.pow(i,1.35),motion:.35+1.75*i,pace:.19+.15*i,curl:.22+.78*i,foamActivity:.06+.94*Math.sqrt(i),layerPresence:.42+.58*i};
}
export class OceanMotion {
  constructor(){this.last=null;this.intensity=null;this.phase=[.4,2.7,4.5];this.parameters=oceanParameters(0);}
  update(time,target){
    target=clamp(target);
    const dt=this.last===null?0:Math.max(0,Math.min(.05,time-this.last));this.last=time;
    if(this.intensity===null)this.intensity=target;
    else this.intensity+=(target-this.intensity)*-Math.expm1(-dt/.62);
    const p=oceanParameters(this.intensity);
    // Integrate speed; slider changes never rewrite elapsed phase.
    for(let n=0;n<3;n++)this.phase[n]+=dt*p.pace*[.73,.84,1.03][n];
    this.parameters=p;return p;
  }
}
// One persistent calm plate and three depth strips, never five state images.
// The alpha atlas is a hand-drawn layer sheet, not an animation frame sequence.
export const OCEAN_ASSETS=Object.freeze({
  background:'./art/ocean-reference-v21-base.webp',
  waves:'./art/ocean-reference-v21-waves.webp',
  sourceHorizon:853/1536,
  rows:[[0,83,1967,154],[0,256,1967,226],[0,483,1967,307]]
});
let assets;
function loadAssets(){
  if(assets)return assets;
  const make=path=>{const image=new Image();image.decoding='async';image.src=new URL(path,import.meta.url);return image;};
  const background=make(OCEAN_ASSETS.background),waves=make(OCEAN_ASSETS.waves);
  const ready=Promise.all([background.decode(),waves.decode()]);
  assets={background,waves,ready};ready.catch(()=>{});return assets;
}
export function oceanAssetsReady(){return loadAssets().ready;}
class OceanRenderer {
  constructor(ctx){this.motion=new OceanMotion();this.images=loadAssets();this.width=0;this.height=0;this.cache=null;}
  prepare(ctx,w,h){
    if(this.cache&&this.width===w&&this.height===h)return;
    const dpr=Math.min(2,ctx.canvas.width/w),canvas=ctx.canvas.ownerDocument.createElement('canvas');
    canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);
    const c=canvas.getContext('2d');c.setTransform(dpr,0,0,dpr,0,0);
    const im=this.images.background,split=Math.round(im.naturalHeight*OCEAN_ASSETS.sourceHorizon),horizon=h*.50,bottom=h*.97;
    c.drawImage(im,0,0,im.naturalWidth,split,0,0,w,horizon);
    c.drawImage(im,0,split,im.naturalWidth,im.naturalHeight-split,0,horizon,w,bottom-horizon);
    this.cache=canvas;this.width=w;this.height=h;
    this.ripples=new Path2D();
    for(let n=0;n<22;n++){
      const x=(n*97.17)%w,y=horizon+(n+.7)/22*(bottom-horizon),length=9+n%5*5;
      this.ripples.moveTo(x,y);this.ripples.quadraticCurveTo(x+length*.45,y-.8,x+length,y+.3);
    }
    this.fade=ctx.createLinearGradient(0,h*.92,0,h*.985);this.fade.addColorStop(0,'rgba(251,251,252,0)');this.fade.addColorStop(1,'#fbfbfc');
  }
  draw(ctx,w,h,time,target){
    const p=this.motion.update(time,target),{background,waves}=this.images;
    if(!background.complete||!background.naturalWidth||!waves.complete||!waves.naturalWidth)return {...p,assetsReady:false};
    this.prepare(ctx,w,h);ctx.drawImage(this.cache,0,0,w,h);
    const horizon=h*.50,depth=h*.47;
    const reveal=Math.max(0,Math.min(1,(p.intensity-.06)/.64)),presence=reveal*reveal*(3-2*reveal);
    ctx.save();ctx.beginPath();ctx.rect(0,horizon+1,w,depth);ctx.clip();
    for(let n=0;n<3;n++){
      const phase=this.motion.phase[n],row=OCEAN_ASSETS.rows[n];
      const width=w*[1.17,1.22,1.25][n],height=depth*[.26,.34,.40][n]*p.crestHeight*(1+.025*Math.sin(phase*1.11+n));
      const base=horizon+depth*[.29,.60,.90][n];
      const dx=Math.sin(phase*.67+n)*p.motion,dy=Math.sin(phase*.89+n)*p.motion*.42;
      ctx.save();ctx.globalAlpha*=presence*[.72,.89,1][n];
      ctx.drawImage(waves,...row,(w-width)/2+dx,base-height+dy,width,height);
      ctx.restore();
    }
    ctx.save();ctx.globalAlpha*=.12+.10*p.intensity;ctx.translate(Math.sin(this.motion.phase[0])*.8,Math.sin(this.motion.phase[1])*.35);
    ctx.strokeStyle='#fff';ctx.lineWidth=.85;ctx.stroke(this.ripples);ctx.restore();
    ctx.fillStyle=this.fade;ctx.fillRect(0,h*.92,w,h*.08);ctx.restore();
    return {...p,assetsReady:true,horizonFraction:.50,boatFractionX:.72,activeWaveLayers:3};
  }
}
const renderers=new WeakMap();
export function drawOceanWorld(ctx,w,h,time,intensity){
  let renderer=renderers.get(ctx);
  if(!renderer){renderer=new OceanRenderer(ctx);renderers.set(ctx,renderer);}
  return renderer.draw(ctx,w,h,time,intensity);
}
