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
  return {intensity:i,crestHeight:.075+.925*i,motion:.35+1.75*i,pace:.19+.15*i,curl:.22+.78*i,foamActivity:.06+.94*i,layerPresence:.42+.58*i};
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
// Three different asymmetrical drawings, not a repeated wave stamp. Parse once.
const DRAWINGS=[
  {
    base:168,scale:.60,color:'#c2dce9',center:151,
    edge:'M-18 183C17 185 45 174 74 153C96 138 111 108 138 102C158 96 177 104 178 116C179 125 168 129 158 125C149 124 150 137 164 147C188 165 212 176 239 171C263 167 282 148 301 146C322 142 333 158 348 168C360 176 374 176 384 171',
    foam:'M91 141C105 124 120 108 138 103C156 97 178 104 179 116C180 125 167 131 159 125C154 122 158 118 165 119C166 114 156 111 151 114C145 118 143 112 138 116C132 121 128 116 123 121C116 120 115 132 109 130C103 129 101 141 91 141Z',
    flow:'M51 171C81 158 101 134 115 124M150 140C169 159 190 166 207 169'
  },
  {
    base:240,scale:.78,color:'#9ec9de',center:250,
    edge:'M-18 176C12 179 32 164 49 152C69 139 91 142 106 157C123 175 161 183 188 165C212 148 228 130 226 111C225 95 218 89 220 81C212 85 204 83 211 75C216 61 232 51 248 51C268 50 282 65 294 86C307 111 310 133 332 150C349 164 365 170 384 170',
    foam:'M203 96C202 78 217 58 235 52C259 41 280 59 291 78C301 97 307 121 315 131C306 131 303 116 297 116C290 116 294 102 287 99C280 99 281 88 275 88C268 90 267 77 261 79C253 82 253 72 246 76C239 72 234 80 229 79C221 79 222 89 215 87C211 89 211 96 203 96Z',
    flow:'M139 178C178 174 206 156 216 138M277 112C288 143 312 164 338 169'
  },
  {
    base:318,scale:1,color:'#80b5d1',center:143,
    edge:'M-18 183C18 182 40 158 60 129C79 102 92 73 119 58C142 45 170 50 182 66C195 85 177 98 161 91C153 88 150 83 153 80C137 78 125 94 129 115C136 151 172 176 213 177C243 177 266 156 283 144C302 130 324 131 338 144C349 155 342 164 332 160C325 157 319 162 325 168C343 181 365 177 384 171',
    foam:'M49 147C69 119 89 77 116 59C140 43 170 48 184 66C194 79 186 94 175 97C165 100 151 92 151 84C153 80 159 83 164 85C172 88 178 80 171 75C166 72 162 78 156 72C150 77 144 68 139 75C132 70 127 82 121 78C115 78 114 91 108 88C101 90 103 102 96 102C89 102 90 114 84 116C77 118 78 128 71 130C64 133 58 147 49 147Z',
    flow:'M13 175C44 161 65 128 82 109M121 134C134 158 160 174 184 177M258 173C280 156 297 145 312 147'
  }
];
function compile(d){
  const tokens=d.match(/[MCZ]|-?[0-9]*[.]?[0-9]+/g),out=[];
  for(let i=0;i<tokens.length;){
    const op=tokens[i++],count=op==='C'?6:op==='M'?2:0,values=tokens.slice(i,i+count).map(Number);
    if(!['M','C','Z'].includes(op)||values.length!==count||values.some(v=>!Number.isFinite(v)))throw new Error('Invalid Ocean curve');
    out.push([op,...values]);i+=count;
  }
  return out;
}
for(const d of DRAWINGS)for(const key of ['edge','foam','flow'])d[key]=compile(d[key]);
const patterns=new WeakMap();
function pencil(ctx){
  if(patterns.has(ctx))return patterns.get(ctx);
  const tile=ctx.canvas.ownerDocument.createElement('canvas');tile.width=128;tile.height=128;
  const p=tile.getContext('2d');p.lineCap='round';
  for(let n=0;n<270;n++){
    const x=n*37.713%128,y=n*23.173%128;
    p.strokeStyle=n%5?'rgba(255,255,255,.12)':'rgba(66,126,161,.07)';p.lineWidth=.35+n%3*.35;
    p.beginPath();p.moveTo(x,y);p.lineTo(x+1+n%5,y-1-n%4);p.stroke();
  }
  const pattern=ctx.createPattern(tile,'repeat');patterns.set(ctx,pattern);return pattern;
}
function trace(ctx,commands,center,curl,crest){
  // Subtle crest deformation; wave feet stay joined to the water band.
  const x=(a,b)=>a+(a-center)*(.16*(curl-1))*Math.max(0,1-b/155);
  const y=(a,b)=>b+crest*Math.max(0,1-b/175)*(1+.15*Math.sin(a*.045));
  ctx.beginPath();
  for(const c of commands){
    if(c[0]==='M')ctx.moveTo(x(c[1],c[2]),y(c[1],c[2]));
    else if(c[0]==='C')ctx.bezierCurveTo(x(c[1],c[2]),y(c[1],c[2]),x(c[3],c[4]),y(c[3],c[4]),x(c[5],c[6]),y(c[5],c[6]));
    else ctx.closePath();
  }
}
function ink(ctx,color,width,alpha){ctx.save();ctx.globalAlpha*=alpha;ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();ctx.restore();}
class OceanRenderer {
  constructor(ctx){
    this.motion=new OceanMotion();this.grain=pencil(ctx);
    this.mask=new Path2D('M-16 -10H376V343C326 352 283 344 239 351S140 346 102 351S29 345 -16 349Z');
    this.ripples=new Path2D('M5 199q17 -3 31 0M66 211q13 2 23 -1M260 207q22 -3 45 -1M320 193q18 3 29 0M22 262q15 -2 25 0M143 255q19 -3 33 -1M304 269q20 -2 32 1M56 329q18 3 34 0M214 334q16 -2 30 0');
    this.foam=new Path2D('M35 226q5 -3 10 0M143 224q3 -3 6 0M286 229q4 -2 8 0M87 293q5 -3 9 0M271 307q4 -2 7 0M187 328q4 -2 8 0');
    this.fade=ctx.createLinearGradient(0,328,0,354);this.fade.addColorStop(0,'rgba(251,251,252,0)');this.fade.addColorStop(1,'#fbfbfc');
  }
  draw(ctx,w,h,time,target){
    const p=this.motion.update(time,target),s=Math.min(w/360,h*.88/370);
    ctx.save();ctx.translate((w-360*s)/2,(h-370*s)*.5);ctx.scale(s,s);ctx.clip(this.mask);
    ctx.lineCap='round';ctx.lineJoin='round';
    for(let n=0;n<3;n++){
      const d=DRAWINGS[n],phase=this.motion.phase[n];
      const sy=d.scale*p.crestHeight*(1+.035*Math.sin(phase*1.17+.8*n));
      const lift=Math.sin(phase*.83+n)*p.motion,drift=Math.sin(phase*.61+n)*p.motion*.6;
      const crest=Math.sin(phase*1.29+n)*(.7+2*p.intensity);
      ctx.save();if(n>0)ctx.globalAlpha*=p.layerPresence;ctx.translate(drift,d.base+lift);ctx.scale(1,sy);ctx.translate(0,-190);
      trace(ctx,d.edge,d.center,p.curl,crest);
      ctx.lineTo(390,190+(365-d.base)/sy);ctx.lineTo(-30,190+(365-d.base)/sy);ctx.closePath();
      ctx.fillStyle=d.color;ctx.fill();ctx.fillStyle=this.grain;ctx.fill();
      trace(ctx,d.edge,d.center,p.curl,crest);ink(ctx,'#5a94b2',1.2,.7);
      // Foam follows the curling lip, never a disconnected cloud-like cap.
      trace(ctx,d.foam,d.center,p.curl,crest);
      ctx.save();ctx.globalAlpha*=p.foamActivity;ctx.fillStyle='#fff';ctx.fill();ctx.fillStyle=this.grain;ctx.fill();ctx.restore();
      trace(ctx,d.flow,d.center,p.curl,crest);ink(ctx,'#4e91b4',1,.35+.15*p.intensity);
      ctx.translate(.45,-.8);trace(ctx,d.edge,d.center,p.curl,crest);ink(ctx,'#609ab7',.7,.22);
      ctx.restore();
    }
    ctx.save();ctx.translate(Math.sin(this.motion.phase[1]*.63)*.8,Math.sin(this.motion.phase[0])*.5);
    ctx.strokeStyle='#f8fcfd';ctx.lineWidth=1.25;ctx.globalAlpha*=.62;ctx.stroke(this.ripples);
    ctx.globalAlpha*=p.foamActivity;ctx.lineWidth=1.65;ctx.stroke(this.foam);ctx.restore();
    ctx.fillStyle=this.fade;ctx.fillRect(-16,328,392,30);
    ctx.restore();return p;
  }
}
const renderers=new WeakMap();
export function drawOceanWorld(ctx,w,h,time,intensity){
  let renderer=renderers.get(ctx);
  if(!renderer){renderer=new OceanRenderer(ctx);renderers.set(ctx,renderer);}
  return renderer.draw(ctx,w,h,time,intensity);
}
