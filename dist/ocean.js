// Live drawn waves, not a video or a frame sequence. Shared forms tie the
// scene and descriptive picker together; the header remains a small emblem.
const BODY='M3 157C34 159 54 134 68 102C80 72 91 46 119 41C147 33 174 42 183 56C194 73 180 84 164 77C149 79 139 98 146 119C158 148 189 158 230 153C245 167 223 183 190 186C126 190 61 177 4 177Z';
const FOAM='M62 114C71 96 76 76 87 62C84 52 95 42 104 46C108 34 124 34 132 41C144 34 159 38 164 46C179 42 195 57 186 71C182 80 172 80 166 74C163 81 155 81 153 72C146 77 139 71 140 65C132 68 131 75 127 79C121 85 115 80 118 72C108 79 102 88 99 95C95 102 87 102 87 94C79 104 74 116 68 120Z';
const FLOW='M30 155C59 151 75 118 84 94M48 165C79 156 91 124 96 113M103 97C101 132 119 155 145 165M130 113C136 147 163 169 207 166';
const INK='#648ea9',BLUE='#94bad0',PALE='#c6dce7',FOAM_INK='#86afc6';
const svgWave=(fill=BLUE)=>`<path d="${BODY}" fill="${fill}" stroke="${INK}" stroke-width="2"/><path d="${FOAM}" fill="#fff" stroke="${FOAM_INK}" stroke-width="1.6"/><path d="${FLOW}" fill="none" stroke="${INK}" stroke-width="1.8" opacity=".65"/>`;
export const OCEAN_ICON=Object.freeze({color:'#719fbd',header:`
  <path d="M2 25C8 28 12 17 18 17C22 17 23 21 20 21C17 21 17 27 22 27C28 27 29 20 34 20C38 20 37 22 35 23C32 27 37 27 39 25" fill="none" stroke="${INK}" stroke-width="1.8"/>
`,art:`<g data-wave="rear" transform="translate(51 4) scale(.27 .25)">${svgWave(PALE)}</g><g data-wave="main" transform="translate(4 5) scale(.4 .37)">${svgWave()}</g><g data-wave="front" transform="translate(57 39) scale(.26 .23)">${svgWave('#accddd')}</g>`});

export function oceanParameters(intensity){
  const i=Math.max(0,Math.min(1,Number.isFinite(intensity)?intensity:0));
  return {intensity:i,crestHeight:.025+.83*i*i,motion:.4+3.8*i,pace:.28+.25*i,rearOpacity:.25+.55*i,foamActivity:Math.max(0,(i-.18)/.82)};
}
let shapes;
function geometry(){return shapes??=Object.fromEntries(Object.entries({body:BODY,foam:FOAM,flow:FLOW}).map(([k,d])=>[k,new Path2D(d)]));}
const patterns=new WeakMap();
function pigment(ctx){
  if(patterns.has(ctx))return patterns.get(ctx);
  const tile=ctx.canvas.ownerDocument.createElement('canvas');tile.width=72;tile.height=72;
  const p=tile.getContext('2d');p.lineCap='round';
  for(let n=0;n<180;n++){
    const x=(n*17.173)%72,y=(n*31.719)%72;
    p.strokeStyle=n%3?'rgba(255,255,255,.24)':'rgba(93,140,169,.09)';p.lineWidth=.35+n%3*.23;
    p.beginPath();p.moveTo(x,y);p.lineTo(x+1+n%4,y-1-n%3);p.stroke();
  }
  const pattern=ctx.createPattern(tile,'repeat');patterns.set(ctx,pattern);return pattern;
}
function stroke(ctx,path,color,width=1.4,alpha=1){ctx.save();ctx.globalAlpha*=alpha;ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke(path);ctx.restore();}
function wave(ctx,x,base,sx,sy,fill,alpha,grain){
  const g=geometry();ctx.save();ctx.translate(x,base);ctx.scale(sx,sy);ctx.translate(0,-190);ctx.globalAlpha*=alpha;
  ctx.fillStyle=fill;ctx.fill(g.body);ctx.fillStyle=grain;ctx.fill(g.body);
  stroke(ctx,g.body,INK,1.65,.8);
  ctx.fillStyle='#ffffff';ctx.fill(g.foam);stroke(ctx,g.foam,FOAM_INK,1.45,.85);
  stroke(ctx,g.flow,INK,1.4,.53);
  // A sparse second pencil trace keeps the contour human, never a thick outline.
  ctx.translate(.65,-.45);stroke(ctx,g.body,INK,.6,.2);ctx.restore();
}
export function drawOceanWorld(ctx,w,h,t,intensity){
  const p=oceanParameters(intensity),s=w/360,H=h/s,grain=pigment(ctx);
  const horizon=H*.45,bottom=H*.97,depth=bottom-horizon;
  ctx.save();ctx.scale(s,s);ctx.lineCap='round';ctx.lineJoin='round';
  // White sky; just three pale pencil clouds and three small birds, as in the guide.
  const cloud=new Path2D('M0 28Q4 18 12 22Q9 8 24 9Q30 -2 39 8Q52 6 52 20Q63 15 65 28Q73 23 80 30L0 30');
  for(const [x,y,k] of [[-7,horizon*.28,.93],[286,horizon*.5,.94],[9,horizon*.79,.66]]){
    ctx.save();ctx.translate(x+Math.sin(t*.08)*1.3,y);ctx.scale(k,k);
    ctx.fillStyle='#eef5f8';ctx.fill(cloud);stroke(ctx,cloud,'#b5d4e3',1.3,.85);
    ctx.clip(cloud);ctx.fillStyle=grain;ctx.fillRect(0,0,80,33);
    for(let n=0;n<13;n++)stroke(ctx,new Path2D(`M${n*6-2} 30l14 -19`),'#bfdce9',.8,.55);
    ctx.restore();
  }
  for(const [x,y,k] of [[278,horizon*.22,1],[173,horizon*.55,.82],[104,horizon*.79,.7]]){
    const wing=Math.sin(t*.55+x)*.6;
    stroke(ctx,new Path2D(`M${x-7*k} ${y}q${5*k} ${-4*k+wing} ${8*k} ${2*k}q${3*k} ${-8*k} ${9*k} ${-8*k}`),INK,1.4,.85);
  }
  // One continuous sea field, not isolated stickers. Ragged pencil edge fades to paper.
  const sea=new Path2D(`M-2 ${horizon}Q100 ${horizon-1} 180 ${horizon}T362 ${horizon}L362 ${bottom-3}Q300 ${bottom+4} 243 ${bottom-1}T120 ${bottom}T-2 ${bottom-2}Z`);
  ctx.save();ctx.clip(sea);ctx.fillStyle='#c5deea';ctx.fill(sea);ctx.fillStyle=grain;ctx.fill(sea);
  // Small broken ripples remain visible at every intensity, with a light reflection lane.
  for(let n=0;n<66;n++){
    const d=(n+.5)/66,y=horizon+d*depth,x=(n*83.71)%388-22;
    const length=13+(n%5)*6,dy=Math.sin(t*p.pace+n*.8)*(1+4*p.intensity)*d;
    stroke(ctx,new Path2D(`M${x} ${y}q${length*.4} ${-2-dy} ${length} ${-.4+dy}`),n%4===0?'#fff':'#7facbf',n%4===0?2:1,.45);
    if(n%3===0)stroke(ctx,new Path2D(`M${117+Math.sin(n*3)*20-d*16} ${y+2}q12 -2 ${12+d*36} 0`),'#fff',1.5,.64*(1-p.intensity*.5));
  }
  // Back-to-front rows grow continuously: flat water → ripples → rounded foamy waves.
  // Each row has its own gentle phase; no discrete state swaps or pre-rendered frames.
  for(let row=0;row<3;row++){
    const base=horizon+depth*(.28+row*.28),size=.53+row*.22;
    const height=p.crestHeight*(.4+row*.22)*Math.min(1,depth/225);
    const alpha=Math.min(1,Math.max(0,(p.intensity-.12)*2.5));
    for(let col=0;col<3;col++){
      const phase=t*p.pace+row*1.9+col*2.5;
      const x=-52+col*150+(row%2)*-52+Math.sin(phase)*p.motion;
      wave(ctx,x,base+Math.sin(phase*.8)*p.motion*.43,size,height*(.93+Math.sin(phase)*.07),[PALE,'#a3c9dc','#92bdd4'][row],alpha,grain);
    }
    const y=base+4;
    stroke(ctx,new Path2D(`M-8 ${y}C36 ${y+5} 66 ${y-10} 106 ${y-1}S182 ${y+8} 226 ${y-2}S309 ${y-7} 368 ${y}`),'#fff',1.1+p.foamActivity*2.2,.45+.25*p.intensity);
  }
  // Sparse hand-drawn foam flecks; never a spray or storm particle system.
  for(let n=0;n<22;n++){
    const x=(n*73.713)%360,y=horizon+depth*(.23+(n*13.71%70)/100);
    stroke(ctx,new Path2D(`M${x} ${y}q2 -1.2 4 0`),'#fff',1.2,p.foamActivity*.65);
  }
  const edge=ctx.createLinearGradient(0,bottom-10,0,bottom+1);edge.addColorStop(0,'rgba(251,251,252,0)');edge.addColorStop(1,'#fbfbfc');
  ctx.fillStyle=edge;ctx.fillRect(0,bottom-10,360,12);ctx.restore();
  // A tiny boat anchors the scale, but never moves into the controls or becomes a focal illustration.
  ctx.save();ctx.translate(257,horizon-2+Math.sin(t*.55)*(.6+p.intensity));ctx.rotate(Math.sin(t*.5)*(.015+.02*p.intensity));
  const sail=new Path2D('M0 -34L-12 -5L-1 -6ZM3 -30L12 -5L3 -6Z');
  ctx.fillStyle='#fff';ctx.fill(sail);stroke(ctx,sail,'#70838d',1.1);
  stroke(ctx,new Path2D('M1 -35L1 0'),'#70838d',1.1);
  const hull=new Path2D('M-15 -2Q0 1 15 -2L10 4L-10 4Z');ctx.fillStyle='#bc9b7c';ctx.fill(hull);stroke(ctx,hull,'#927f70',1);
  ctx.restore();
  ctx.restore();return p;
}
