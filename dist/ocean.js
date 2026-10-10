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
    for(let n=0;n<3;n++)this.phase[n]+=dt*p.pace*[.79,1.07,.91][n];
    this.parameters=p;return p;
  }
}
// Three different asymmetrical drawings, not a repeated wave stamp. Parse once.
const DRAWINGS=[
  {
    base:166,scale:.66,color:'#c2dce9',center:151,
    edge:'M-18 183C19 181 48 169 77 138C96 117 105 86 130 77C153 65 177 71 182 87C188 103 174 113 163 108C157 106 157 100 162 97C153 90 142 102 146 121C152 149 177 171 209 175C245 181 262 163 279 146C294 132 309 126 325 132C340 138 342 150 333 155C324 158 318 152 322 146C310 149 313 165 332 173C350 181 364 177 384 170',
    foam:'M66 150C88 128 102 91 125 80C149 65 177 67 184 84C191 98 179 113 167 109C159 107 159 101 164 98C171 98 176 94 172 90C168 88 164 93 160 88C156 92 150 83 146 89C139 86 132 91 130 97C126 103 121 103 119 100C111 106 109 117 103 119C98 122 99 115 95 122C89 136 82 134 79 143C75 150 69 155 66 150Z',
    flow:'M42 167C77 154 98 117 112 103M108 131C110 151 124 169 147 178M149 129C162 158 185 170 209 171M251 173C270 166 281 148 297 140'
  },
  {
    base:237,scale:.85,color:'#9ec9de',center:259,
    edge:'M-18 176C12 179 36 163 52 147C68 132 84 130 96 140C107 150 99 161 89 159C84 158 84 152 88 150C78 147 74 164 91 173C123 186 153 168 176 131C195 102 207 56 238 44C266 32 295 47 293 67C292 87 271 96 259 85C250 75 257 67 264 68C269 69 270 75 266 78C280 75 276 58 261 61C242 64 239 92 248 119C261 159 307 179 384 165',
    foam:'M167 145C193 114 201 65 231 47C255 31 285 39 293 55C304 72 287 94 271 90C260 90 251 83 255 75C257 71 263 69 266 73C261 76 266 81 271 79C283 76 284 60 274 57C269 54 268 60 263 56C256 61 253 52 247 58C240 54 237 65 231 64C224 63 223 78 218 76C211 75 213 89 205 91C199 95 201 104 195 107C189 110 192 119 184 124C179 130 173 145 167 145Z',
    flow:'M120 180C168 174 190 125 203 104M214 112C213 144 237 171 259 179M242 120C258 158 288 169 319 173M12 174C37 170 51 150 66 144'
  },
  {
    base:315,scale:1,color:'#80b5d1',center:136,
    edge:'M-18 183C17 184 39 162 56 132C72 104 83 62 112 48C137 35 164 48 166 68C168 88 147 98 134 87C126 79 130 70 138 70C146 71 146 79 140 80C154 85 158 65 144 61C127 54 115 76 116 97C120 135 151 170 199 176C233 181 260 158 278 136C294 114 314 105 332 115C347 124 343 141 330 141C321 140 321 134 326 129C311 128 312 149 329 160C344 172 365 175 384 171',
    foam:'M47 148C66 119 81 65 109 49C135 33 162 43 169 61C179 83 158 103 141 94C132 91 125 83 131 77C134 75 137 76 138 79C134 84 141 89 147 87C159 84 163 66 153 61C149 57 145 61 141 58C135 62 131 53 125 60C119 57 115 67 110 66C104 64 102 78 97 77C91 76 92 91 86 94C81 97 83 107 76 110C70 114 72 123 67 126C60 133 56 146 47 148Z',
    flow:'M7 177C47 164 65 123 80 98M91 117C93 146 116 169 139 178M117 122C135 152 164 169 196 169M246 175C267 166 283 137 302 126M312 147C320 165 344 177 365 177'
  }
];
function compile(d){
  const tokens=d.match(/[MCZ]|-?\\d*\\.?\\d+/g),out=[];
  for(let i=0;i<tokens.length;){const op=tokens[i++],count=op==='C'?6:op==='M'?2:0;out.push([op,...tokens.slice(i,i+count).map(Number)]);i+=count;}
  return out;
}
for(const d of DRAWINGS)for(const key of ['edge','foam','flow'])d[key]=compile(d[key]);
const patterns=new WeakMap();
function pencil(ctx){
  if(patterns.has(ctx))return patterns.get(ctx);
  const tile=ctx.canvas.ownerDocument.createElement('canvas');tile.width=128;tile.height=128;
  const p=tile.getContext('2d');p.lineCap='round';
  for(let n=0;n<620;n++){
    const x=n*37.713%128,y=n*23.173%128;
    p.strokeStyle=n%5?'rgba(255,255,255,.25)':'rgba(66,126,161,.11)';p.lineWidth=.35+n%3*.35;
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
