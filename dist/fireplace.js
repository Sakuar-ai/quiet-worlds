// Reference-matched static pencil artwork with independently animated fire.
const clampFire = n => Math.max(0, Math.min(1, n));
const smoothFire = n => { const p = clampFire(n); return p * p * (3 - 2 * p); };

export function fireParameters(intensity) {
  const i = clampFire(intensity);
  return {
    flameHeight: 14 + 400 * Math.pow(i, .78),
    flameWidthVariation: 2 + i * 13,
    flameMovement: .2 + i * .48,
    flameCount: 1 + i * 6,
    emberGlow: .2 + i * .45,
    sparkFrequency: .004 + i * i * .33
  };
}

export function fireMix(intensity) {
  const i = clampFire(intensity);
  // A remains present throughout; B and then C enter continuously.
  const weights = [1 - .28 * i, .95 * smoothFire(i / .65), .95 * smoothFire((i - .42) / .58)];
  const power = Math.hypot(...weights);
  return weights.map(value => value / power);
}

export class FireplaceRenderer {
  constructor(parent) {
    this.element = document.createElement('div');
    this.element.className = 'fireplace-world';
    this.element.setAttribute('aria-hidden', 'true');
    // The masonry spans x=136..1414 in the asset. 51.08% * 1278/1536
    // gives 42.5% of Rain's usable scene width, as explicitly chosen by the user.
    // A nested SVG preserves the artwork's aspect ratio without a new canvas layout.
    this.element.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Colored-pencil arched brick fireplace with fire emerging between stacked logs">
      <svg class="fire-illustration" x="24.46%" y="0" width="51.08%" height="100%" viewBox="0 0 1536 1024" preserveAspectRatio="xMidYMid meet">
        <defs>
          <image id="fire-pencil-art" href="./art/fireplace-reference-v6.png" width="1536" height="1024"/>
          <path id="fire-front-log-shape" d="M607 712Q762 663 947 614Q965 617 976 648L978 677Q822 727 627 770Q603 767 601 741Q600 723 607 712Z"/>
          <clipPath id="fire-front-log"><use href="#fire-front-log-shape"/></clipPath>
          <mask id="fire-behind-front-log" maskUnits="userSpaceOnUse" x="0" y="0" width="1536" height="1024"><rect width="1536" height="1024" fill="white"/><use href="#fire-front-log-shape" fill="black"/></mask>
          <clipPath id="fire-cavity"><path d="M365 798 366 386Q580 253 776 260Q980 254 1208 384L1208 799Z"/></clipPath>
          <filter id="fire-pencil" x="-4%" y="-4%" width="108%" height="108%"><feTurbulence type="fractalNoise" baseFrequency=".14" numOctaves="3" seed="14" result="grain"/><feDisplacementMap in="SourceGraphic" in2="grain" scale="3.2" result="rough"/><feColorMatrix in="grain" type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 .333 .333 .334 0 0"/><feComponentTransfer><feFuncA type="table" tableValues=".45 .85 1 1 1"/></feComponentTransfer><feComposite in="rough" operator="in"/></filter>
          <pattern id="fire-hatch" patternUnits="userSpaceOnUse" width="29" height="33" patternTransform="rotate(-12)"><path d="m2 23 7-12m9 21 8-16m-9-9 3-4" stroke="#fff2c8" stroke-width="2.4" stroke-linecap="round" opacity=".66"/><path d="m4 29 3-5m12-10 2-4" stroke="#ca6a36" stroke-width="1.4" opacity=".38"/></pattern>
          <pattern id="ember-hatch" patternUnits="userSpaceOnUse" width="23" height="19"><path d="m2 8 12-2m-5 9 9-2" stroke="#ed9b50" stroke-width="3" stroke-linecap="round"/><path d="m4 9 4-1" stroke="#ffda87" stroke-width="2"/></pattern>
        </defs>
        <g class="fire-structure fire-rear-logs"><use href="#fire-pencil-art" mask="url(#fire-behind-front-log)"/></g>
        <rect class="fire-masonry-bounds" x="136" y="84" width="1278" height="858" fill="none" pointer-events="none"/>
        <g class="fire-live-interior" clip-path="url(#fire-cavity)">
          <g class="fire-glow" filter="url(#fire-pencil)">
            <path d="M482 779Q533 732 655 731Q764 692 895 732Q1019 730 1083 781Q955 808 801 802Q600 810 482 779Z" fill="#d96b32" opacity=".52"/>
            <path d="M558 784Q645 758 715 761Q849 729 994 784Q837 802 558 784Z" fill="url(#ember-hatch)"/>
            <path d="m588 618 80 26m-131 48 88 14m229 24 108 24" fill="none" stroke="#ec9850" stroke-width="7" opacity=".44" stroke-linecap="round"/>
          </g>
          <g class="fire-lower-flames" stroke-linejoin="round" filter="url(#fire-pencil)"></g>
          <g class="fire-flames" stroke-linejoin="round" filter="url(#fire-pencil)"></g>
          <g class="fire-flame-grain"></g>
        </g>
        <g class="fire-logs"><use href="#fire-pencil-art" clip-path="url(#fire-front-log)"/></g>
        <path class="fire-log-rim" d="M626 716Q787 665 945 627" fill="none" stroke="#f7ad61" stroke-width="5" stroke-linecap="round" stroke-dasharray="23 14 6 11 37 17"/>
        <g class="fire-embers" stroke-linecap="round" filter="url(#fire-pencil)"></g>
        <g class="fire-sparks" fill="none" stroke-linecap="round" filter="url(#fire-pencil)"></g>
      </svg>
    </svg>`;
    parent.append(this.element);
    const add = (group, tag, attrs) => {
      const node = document.createElementNS('http://www.w3.org/2000/svg', tag);
      Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, value));
      this.element.querySelector(group).append(node);
      return node;
    };
    const colors = ['#d95f35','#e78342','#e96d38','#f1a54f','#ee9145','#ffd47e','#fff0b9'];
    this.flames = colors.map((color,n) => add('.fire-flames','path',{fill:color,stroke:n<3?'#df7142':'#f6c46d','stroke-width':2.5}));
    this.flameGrain = colors.map(() => add('.fire-flame-grain','path',{fill:'url(#fire-hatch)'}));
    this.lowerFlames = Array.from({length:4},(_,n)=>add('.fire-lower-flames','path',{fill:n%2?'#f8bc68':'#df793d',stroke:'#eb994e','stroke-width':1.8}));
    this.embers = Array.from({length:16},(_,n)=>add('.fire-embers','path',{d:`M${535+(n*79%466)} ${768+(n*13%32)}l${5+n%4*2} ${n%2?-3:2}`,stroke:n%3?'#ec9850':'#f9d082','stroke-width':3+n%3}));
    this.sparks = Array.from({length:7},()=>add('.fire-sparks','path',{stroke:'#e99654','stroke-width':2.5}));
    this.glow = this.element.querySelector('.fire-glow');
    this.logRim = this.element.querySelector('.fire-log-rim');
    this.time=0;this.last=null;this.visible=false;
    this.update(0,0,true);
  }

  setVisible(visible) {
    this.visible=visible;
    this.element.classList.toggle('is-active',visible);
    this.element.setAttribute('aria-hidden',String(!visible));
  }

  update(now,intensity,slow=false) {
    const i=clampFire(intensity),p=fireParameters(i);
    const delta=this.last===null?0:Math.max(0,Math.min(.06,now-this.last));
    this.last=now;this.time+=delta*p.flameMovement*(slow?.23:1);
    const t=this.time,x=[769,673,871,747,846,787,757];
    this.flames.forEach((node,n)=>{
      const presence=n===0?1:smoothFire((i-(n-1)*.085)/.24);
      const sway=Math.sin(t*(1.1+n*.11)+n*2.7)*p.flameWidthVariation;
      const pulse=1+.045*Math.sin(t*(1.8+n*.13)+n)+.02*Math.sin(t*.71+n);
      const h=p.flameHeight*[1,.61,.72,.81,.49,.59,.35][n]*pulse;
      const w=10+i*[68,43,49,43,37,37,24][n],b=752-n%3*5,tip=x[n]+sway;
      const d=`M${x[n]-w} ${b}C${x[n]-w*1.35} ${b-h*.13} ${x[n]-w*.82} ${b-h*.34} ${x[n]-w*.55} ${b-h*.45}Q${x[n]-w*.48} ${b-h*.29} ${x[n]-w*.19} ${b-h*.35}C${tip+w*.13} ${b-h*.57} ${tip+w*.33} ${b-h*.83} ${tip} ${b-h}Q${tip+w*.8} ${b-h*.83} ${x[n]+w*.53} ${b-h*.53}Q${x[n]+w*.72} ${b-h*.62} ${x[n]+w*.87} ${b-h*.69}C${x[n]+w*.62} ${b-h*.4} ${x[n]+w*1.38} ${b-h*.16} ${x[n]+w*.82} ${b}Q${x[n]} ${b+13} ${x[n]-w} ${b}Z`;
      node.setAttribute('d',d);node.setAttribute('opacity',presence*.94);
      this.flameGrain[n].setAttribute('d',d);this.flameGrain[n].setAttribute('opacity',presence*.7);
    });
    this.lowerFlames.forEach((node,n)=>{
      const x=588+n*116,b=782-(n%2)*13,h=(9+i*68)*(1+.09*Math.sin(t*1.8+n)),w=7+i*15;
      node.setAttribute('d',`M${x-w} ${b}Q${x-w*1.5} ${b-h*.4} ${x} ${b-h}Q${x+w*.2} ${b-h*.38} ${x+w} ${b-h*.5}Q${x+w*1.8} ${b} ${x-w} ${b}Z`);
      node.setAttribute('opacity',(.38+i*.45)*(n%2?.8:1));
    });
    this.glow.setAttribute('opacity',p.emberGlow*(.95+.05*Math.sin(t*.7)));
    this.logRim.setAttribute('opacity',.1+i*.35);
    this.embers.forEach((node,n)=>node.setAttribute('opacity',p.emberGlow*(.75+.25*Math.sin(t*(.9+n*.03)+n*2)**2)));
    this.sparks.forEach((node,n)=>{
      const phase=(t*(.09+n*.004)+n*.618034)%1;
      const presence=smoothFire((i-.2-n*.075)/.3),progress=phase/Math.max(.001,p.sparkFrequency);
      const x=632+n*43+Math.sin(t*.6+n)*8,y=735-Math.min(1,progress)*(140+i*275);
      node.setAttribute('d',`M${x} ${y}l${Math.sin(n+t)*2} -6`);
      node.setAttribute('opacity',progress<1?Math.sin(progress*Math.PI)*presence*.65:0);
    });
    this.parameters=p;
  }
}
