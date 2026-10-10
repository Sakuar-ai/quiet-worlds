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
  return {intensity:i,crestHeight:.025+.975*Math.pow(i,1.18),motion:.35+1.75*i,pace:.19+.15*i,curl:.04+.66*i,foamActivity:Math.pow(i,1.25),layerPresence:.42+.58*i};
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
// The reference plate supplies the fixed sky, boat and pencil pigment only.
// Moving wave silhouettes are geometry, not scaled/bobbing bitmap bands.
export const OCEAN_ASSETS=Object.freeze({
  background:'./art/ocean-reference-v21-base.webp',
  pigment:'./art/ocean-reference-v21-waves.webp',
  sourceHorizon:853/1536,
  rows:[[0,83,1967,154],[0,256,1967,226],[0,483,1967,307]]
});
let assets;
function loadAssets(){
  if(assets)return assets;
  const make=path=>{const image=new Image();image.decoding='async';image.src=new URL(path,import.meta.url);return image;};
  const background=make(OCEAN_ASSETS.background),pigment=make(OCEAN_ASSETS.pigment);
  const ready=Promise.all([background.decode(),pigment.decode()]);
  assets={background,pigment,ready};ready.catch(()=>{});return assets;
}
export function oceanAssetsReady(){return loadAssets().ready;}
const RHYTHMS=Object.freeze([
  {wavelength:1.86,shorten:.49,amplitude:.21,base:.29,offset:.2},
  {wavelength:1.68,shorten:.44,amplitude:.29,base:.60,offset:1.7},
  {wavelength:1.48,shorten:.38,amplitude:.38,base:.90,offset:3.1}
]);
// Adjacent control points have different spatial phases. The irregular,
// asymmetric crest profile propagates rightwards; no band peaks as a unit.
export function oceanFieldPoint(p,phase,layer,x,w,h,sample){
  const r=RHYTHMS[layer],depth=h*.47,wavelength=w*(r.wavelength-r.shorten*p.intensity);
  const angle=phase-x/wavelength*Math.PI*2+r.offset;
  const u=(((-angle/(Math.PI*2))%1)+1)%1;
  const profile=sample?sample(u):(Math.sin(angle)+.22*Math.sin(2*angle-.45)+.055*Math.sin(3*angle+.9))/1.13;
  const crest=Math.pow(clamp(sample?(profile-.36)/.55:(profile+.08)/1.08),3);
  const growth=.42+.58*Math.sin(Math.PI*clamp(x/w));
  const amplitude=depth*r.amplitude*p.crestHeight*growth;
  // The forward lean belongs only to the developing crest, not the band.
  const lean=amplitude*p.curl*crest*.34;
  return {x:x+lean,y:h*.5+depth*r.base-amplitude*profile,crest,amplitude,angle,wavelength,u,profile,growth};
}
const POINT_COUNT=113;
function outline(ctx,points,start=0,end=points.length-1){
  ctx.moveTo(points[start].x,points[start].y);
  for(let n=start+1;n<=end;n++){
    const a=points[n-1],b=points[n];
    ctx.quadraticCurveTo(a.x,a.y,(a.x+b.x)/2,(a.y+b.y)/2);
  }
  const last=points[end];ctx.lineTo(last.x,last.y);
}
class OceanRenderer {
  constructor(ctx){this.motion=new OceanMotion();this.images=loadAssets();this.width=0;this.height=0;this.cache=null;this.points=Array.from({length:3},()=>Array.from({length:POINT_COUNT},()=>({x:0,y:0,crest:0,amplitude:0})));}
  prepare(ctx,w,h){
    if(this.cache&&this.width===w&&this.height===h)return;
    const dpr=Math.min(2,ctx.canvas.width/w),canvas=ctx.canvas.ownerDocument.createElement('canvas');
    canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);
    const c=canvas.getContext('2d');c.setTransform(dpr,0,0,dpr,0,0);
    const im=this.images.background,split=Math.round(im.naturalHeight*OCEAN_ASSETS.sourceHorizon),horizon=h*.50,bottom=h*.97;
    c.drawImage(im,0,0,im.naturalWidth,split,0,0,w,horizon);
    c.drawImage(im,0,split,im.naturalWidth,im.naturalHeight-split,0,horizon,w,bottom-horizon);
    this.cache=canvas;this.width=w;this.height=h;
    // Small reusable colored-pencil tiles, generated once on resize.
    // They contain pigment/water grain, not a pre-drawn moving silhouette.
    this.pigments=['#b7d9e7','#92c5df','#77b6d6'].map((color,n)=>{
      const tile=ctx.canvas.ownerDocument.createElement('canvas');tile.width=192;tile.height=96;
      const t=tile.getContext('2d');t.fillStyle=color;t.fillRect(0,0,192,96);
      t.globalAlpha=.42;t.drawImage(im,0,split+130+n*40,im.naturalWidth,160,0,0,192,96);
      return ctx.createPattern(tile,'repeat');
    });
    if(!this.surfaces)this.surfaces=OCEAN_ASSETS.rows.map((row,n)=>{
      const body=ctx.canvas.ownerDocument.createElement('canvas'),foam=ctx.canvas.ownerDocument.createElement('canvas');
      body.width=foam.width=768;body.height=foam.height=row[3];
      const b=body.getContext('2d'),f=foam.getContext('2d');b.drawImage(this.images.pigment,row[0]+20,row[1],row[2]-40,row[3],0,0,body.width,body.height);
      const original=b.getImageData(0,0,body.width,body.height),raw=new Uint8ClampedArray(original.data);
      // The pigment tile joins at equal edge values; travelling crests must
      // not reveal a rectangular wrap seam when crossing the viewport.
      for(let x=0;x<32;x++)for(let y=0;y<body.height;y++)for(let channel=0;channel<4;channel++){
        const left=(y*body.width+x)*4+channel,right=(y*body.width+body.width-1-x)*4+channel,mix=.5*(1-x/32);
        original.data[left]=raw[left]*(1-mix)+raw[right]*mix;original.data[right]=raw[right]*(1-mix)+raw[left]*mix;
      }
      b.putImageData(original,0,0);
      const paint=b.getImageData(0,0,body.width,body.height),white=f.createImageData(body.width,body.height),tops=new Float32Array(body.width);
      for(let x=0;x<body.width;x++){
        let top=body.height-1;
        for(let y=0;y<body.height-8;y++){
          let solid=0;for(let dy=0;dy<8;dy++)if(original.data[((y+dy)*body.width+x)*4+3]>100)solid++;
          if(solid>=7){top=y;break;}
        }
        tops[x]=(body.height-top)/body.height;
        for(let y=0;y<body.height;y++){
          const k=(y*body.width+x)*4,d=original.data;
          // Separate the drawn white foam so its opacity can follow crest life.
          if(d[k]>190&&d[k+1]>207&&d[k+2]>211&&d[k+3]>0){
            const amount=clamp((Math.min(d[k],d[k+1],d[k+2])-185)/45);
            white.data[k]=d[k];white.data[k+1]=d[k+1];white.data[k+2]=d[k+2];white.data[k+3]=d[k+3]*amount;
            const below=(Math.min(body.height-1,y+35)*body.width+x)*4;
            const blue=d[below+3]>100&&d[below]>20&&d[below]<180;
            paint.data[k]=blue?d[below]:103;paint.data[k+1]=blue?d[below+1]:180;paint.data[k+2]=blue?d[below+2]:219;
          }
          if(y>top+2&&paint.data[k+3]<240){
            const a=paint.data[k+3]/255;
            paint.data[k]=paint.data[k]*a+110*(1-a);paint.data[k+1]=paint.data[k+1]*a+182*(1-a);paint.data[k+2]=paint.data[k+2]*a+218*(1-a);paint.data[k+3]=255;
          }
          paint.data[k+3]*=clamp((body.height-y)/20);
        }
      }
      const smoothed=new Float32Array(tops.length);
      for(let x=0;x<tops.length;x++){let sum=0;for(let k=-6;k<=6;k++)sum+=tops[(x+k+tops.length)%tops.length];smoothed[x]=sum/13;}
      b.putImageData(paint,0,0);f.putImageData(white,0,0);
      const sample=u=>{const x=u*body.width,k=Math.floor(x)%body.width,next=(k+1)%body.width;return smoothed[k]+(smoothed[next]-smoothed[k])*(x-Math.floor(x));};
      return {body,foam,sample};
    });
    this.ripples=new Path2D();
    for(let n=0;n<22;n++){
      const x=(n*97.17)%w,y=horizon+(n+.7)/22*(bottom-horizon),length=9+n%5*5;
      this.ripples.moveTo(x,y);this.ripples.quadraticCurveTo(x+length*.45,y-.8,x+length,y+.3);
    }
    this.fade=ctx.createLinearGradient(0,h*.92,0,h*.985);this.fade.addColorStop(0,'rgba(251,251,252,0)');this.fade.addColorStop(1,'#fbfbfc');
  }
  draw(ctx,w,h,time,target,options={}){
    const p=this.motion.update(time,target),{background,pigment}=this.images;
    if(!background.complete||!background.naturalWidth||!pigment.complete||!pigment.naturalWidth)return {...p,assetsReady:false};
    this.prepare(ctx,w,h);
    if(options.silhouette){ctx.fillStyle='#fff';ctx.fillRect(0,0,w,h);}else ctx.drawImage(this.cache,0,0,w,h);
    const horizon=h*.50,depth=h*.47;
    ctx.save();ctx.beginPath();ctx.rect(0,horizon+1,w,depth);ctx.clip();
    for(let n=0;n<3;n++){
      const points=this.points[n],surface=this.surfaces[n];
      for(let k=0;k<POINT_COUNT;k++)Object.assign(points[k],oceanFieldPoint(p,this.motion.phase[n],n,(k/(POINT_COUNT-1)*1.16-.08)*w,w,h,surface.sample));
      ctx.beginPath();outline(ctx,points);ctx.lineTo(w*1.1,h);ctx.lineTo(-w*.1,h);ctx.closePath();
      ctx.fillStyle=options.silhouette?['#d3d8dc','#a3adb6','#677987'][n]:this.pigments[n];
      const presence=clamp((p.intensity-.03)/.62);
      ctx.globalAlpha=options.silhouette?1:presence*.84;ctx.fill();ctx.globalAlpha=1;
      if(options.silhouette)continue;
      // Advect the reference pigment THROUGH the control mesh. Every column
      // has its own vertical displacement and crest lean. No whole-band
      // scale, vertical lift, or bob animation exists.
      for(let k=0;k<POINT_COUNT-1;k++){
        const a=points[k],b=points[k+1],step=(b.u-a.u+1)%1;
        const sx=a.u*surface.body.width,sw=step*surface.body.width;
        const base=horizon+depth*RHYTHMS[n].base;
        const scale=(base-a.y)/(surface.body.height*a.profile);
        const height=surface.body.height*scale,x=a.x,width=Math.max(.5,b.x-a.x)+.35;
        if(height<.1)continue;
        const paint=(image,alpha)=>{
          ctx.globalAlpha=alpha;
          const first=Math.min(sw,image.width-sx),part=first/sw;
          ctx.drawImage(image,sx,0,first,image.height,x,base-height,width*part,height);
          if(part<1)ctx.drawImage(image,0,0,sw-first,image.height,x+width*part,base-height,width*(1-part),height);
        };
        paint(surface.body,presence);
        // Developing crest -> more foam. Falling crest -> broken/faded foam.
        paint(surface.foam,presence*p.foamActivity*(.28+.72*a.crest)*a.growth);
      }
      ctx.globalAlpha=1;
    }
    if(!options.silhouette){
    ctx.save();ctx.globalAlpha*=.12+.10*p.intensity;ctx.translate(Math.sin(this.motion.phase[0])*.8,Math.sin(this.motion.phase[1])*.35);
    ctx.strokeStyle='#fff';ctx.lineWidth=.85;ctx.stroke(this.ripples);ctx.restore();
    ctx.fillStyle=this.fade;ctx.fillRect(0,h*.92,w,h*.08);
    }ctx.restore();
    return {...p,assetsReady:true,horizonFraction:.50,boatFractionX:.72,activeWaveLayers:3,motionModel:'travelling-control-points',phases:[...this.motion.phase],wavelengths:RHYTHMS.map(r=>w*(r.wavelength-r.shorten*p.intensity))};
  }
}
const renderers=new WeakMap();
export function drawOceanWorld(ctx,w,h,time,intensity,options){
  let renderer=renderers.get(ctx);
  if(!renderer){renderer=new OceanRenderer(ctx);renderers.set(ctx,renderer);}
  return renderer.draw(ctx,w,h,time,intensity,options);
}
