// Reference-matched static pencil artwork with independently animated fire.
const clampFire = n => Math.max(0, Math.min(1, n));
const smoothFire = n => { const p = clampFire(n); return p * p * (3 - 2 * p); };

// Seeded pigment is drawn once. Only the enclosing light field changes with
// intensity: no new image, frame sequence, full-page tint or moving texture.
function drawFirelight(add) {
  let seed=7419;
  const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  const f=n=>n.toFixed(2);
  for(let layer=0;layer<12;layer++){
    const spread=1-layer*.037,points=[];
    for(let n=0;n<28;n++){
      const angle=n/28*Math.PI*2,edge=1+.05*Math.sin(angle*3+layer*.28)+.035*Math.sin(angle*7+1);
      points.push([750+Math.cos(angle)*850*spread*edge,430+Math.sin(angle)*930*spread*edge]);
    }
    const middle=(a,b)=>`${f((a[0]+b[0])/2)} ${f((a[1]+b[1])/2)}`;
    let d=`M${middle(points.at(-1),points[0])}`;
    points.forEach((p,n)=>d+=`Q${f(p[0])} ${f(p[1])} ${middle(p,points[(n+1)%points.length])}`);
    add('.firelight-haze','path',{d:d+'Z',fill:['#edbd9a','#efc895','#eab38e'][layer%3],opacity:.045+layer*.002});
  }
  // Short broken diagonal marks: pressure and density thin towards the edge.
  const strokes=Array.from({length:12},()=>[]);
  for(let n=0;n<1500;n++){
    const x=-140+random()*1820,y=-540+random()*1960;
    const radius=Math.hypot((x-750)/875,(y-440)/955);
    const falloff=Math.max(0,1-radius*radius);
    if(random()>falloff*.85)continue;
    const length=13+random()*49,tilt=.5+random()*.8;
    const pressure=Math.min(3,Math.floor(falloff*4)),color=n%3;
    strokes[color*4+pressure].push(`M${f(x)} ${f(y)}q${f(length*.38)} ${f(-length*tilt*.6)} ${f(length)} ${f(-length*tilt)}`);
  }
  strokes.forEach((paths,n)=>add('.firelight-pencil','path',{d:paths.join(''),fill:'none',stroke:['#d99b78','#e6b082','#edc291'][Math.floor(n/4)],'stroke-width':3+n%3,opacity:.09+(n%4)*.055,'stroke-linecap':'round','stroke-dasharray':n%2?'9 3 14 2':'17 2 8 4'}));
  // Loose reflected warmth, not a room floor or a horizontal boundary.
  for(let n=0;n<30;n++){
    const x=80+random()*1050,y=886+random()*270,length=80+random()*330;
    const pressure=Math.max(.08,1-(y-886)/300);
    add('.firelight-hearth','path',{d:`M${f(x)} ${f(y)}q${f(length*.5)} ${f(random()*17-8)} ${f(length)} ${f(random()*11-5)}`,fill:'none',stroke:n%3?'#dda478':'#ecc08f','stroke-width':2+random()*5,opacity:pressure*.25,'stroke-linecap':'round','stroke-dasharray':`${f(16+random()*23)} ${f(6+random()*9)}`});
  }
}

export function fireParameters(intensity) {
  const i = clampFire(intensity);
  return {
    flameHeight: 12 + 426 * Math.pow(i, .8),
    flameWidthVariation: 2 + i * 16,
    flameMovement: .17 + .66 * Math.pow(i, .85),
    flameCount: 1 + i * 6,
    emberGlow: .14 + i * .61,
    sparkCount: i <= .15 ? .65 + .35 * smoothFire(i / .15)
      : i <= .42 ? 1 + 4 * smoothFire((i - .15) / .27)
      : 5 + 8 * smoothFire((i - .42) / .58),
    sparkDuty: .11 + .89 * smoothFire(i / .32),
    // Keep the approved middle warmth; reserve more spread/strength for the top
    // half of the slider instead of reaching almost full warmth at mid intensity.
    lightSpread: .62 + .6 * Math.pow(i, .65),
    lightOpacity: .12 + .72 * Math.pow(i, .65),
    hearthLight: .09 + .8 * Math.pow(i, .72),
    hearthSpreadX: .74 + i * .43,
    hearthSpreadY: .58 + i * .77
  };
}

export class FireplaceRenderer {
  constructor(parent) {
    this.element = document.createElement('div');
    this.element.className = 'fireplace-world';
    this.element.setAttribute('aria-hidden', 'true');
    // Scale the existing artwork and all live layers together: masonry spans
    // x=136..1414, so 84% * 1278/1536 = 69.9% of Rain's usable scene width.
    // A nested SVG preserves the artwork's aspect ratio without a new canvas layout.
    this.element.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Colored-pencil arched brick fireplace with fire emerging between stacked logs">
      <svg class="fire-environment" x="8%" y="0" width="84%" height="100%" viewBox="0 0 1536 1024" preserveAspectRatio="xMidYMid meet" overflow="visible" style="display:none">
        <defs>
          <filter id="firelight-soft-edge" x="-8%" y="-8%" width="116%" height="116%"><feGaussianBlur stdDeviation="14"/></filter>
        </defs>
        <g class="firelight-field">
          <g class="firelight-haze" filter="url(#firelight-soft-edge)"></g>
          <g class="firelight-pencil"></g>
        </g>
        <g class="firelight-hearth"></g>
      </svg>
      <svg class="fire-illustration" x="8%" y="0" width="84%" height="100%" viewBox="0 0 1536 1024" preserveAspectRatio="xMidYMid meet">
        <defs>
          <image id="fire-pencil-art" href="./art/fireplace-reference-v6.png" width="1536" height="1024"/>
          <path id="fire-front-log-shape" d="M607 712Q762 663 947 614Q965 617 976 648L978 677Q822 727 627 770Q603 767 601 741Q600 723 607 712Z"/>
          <path id="fire-rear-log-shape" d="M590 615Q674 647 787 662L730 691Q651 693 573 670Q570 646 590 615Z"/>
          <path id="fire-cross-log-shape" d="M547 689Q620 684 690 701L753 714Q861 694 986 704Q1006 695 1025 706Q1042 723 1043 743Q1041 765 1025 773Q1009 779 993 769Q875 752 757 738L627 748Q580 774 541 773Q517 766 514 741Q514 709 547 689Z"/>
          <clipPath id="fire-front-log"><use href="#fire-front-log-shape"/></clipPath>
          <clipPath id="fire-rear-log"><use href="#fire-rear-log-shape"/></clipPath>
          <clipPath id="fire-cross-log"><use href="#fire-cross-log-shape"/></clipPath>
          <clipPath id="fire-all-logs"><use href="#fire-rear-log-shape"/><use href="#fire-cross-log-shape"/><use href="#fire-front-log-shape"/></clipPath>
          <mask id="fire-behind-front-log" maskUnits="userSpaceOnUse" x="0" y="0" width="1536" height="1024"><rect width="1536" height="1024" fill="white"/><use href="#fire-front-log-shape" fill="black"/></mask>
          <mask id="fire-between-logs" maskUnits="userSpaceOnUse" x="400" y="570" width="720" height="250"><rect x="400" y="570" width="720" height="250" fill="white"/><g fill="black"><use href="#fire-rear-log-shape"/><use href="#fire-cross-log-shape"/><use href="#fire-front-log-shape"/></g></mask>
          <mask id="fire-root-occlusion" maskUnits="userSpaceOnUse" x="350" y="250" width="860" height="560"><rect x="350" y="250" width="860" height="560" fill="white"/><use href="#fire-rear-log-shape" fill="black"/></mask>
          <filter id="fire-soften-hatching" color-interpolation-filters="sRGB" x="-1%" y="-1%" width="102%" height="102%"><feGaussianBlur in="SourceGraphic" stdDeviation="4" result="pigment"/><feComposite in="SourceGraphic" in2="pigment" operator="arithmetic" k2=".82" k3=".18" result="softened"/><feComposite in="softened" in2="SourceGraphic" operator="atop"/></filter>
          <clipPath id="fire-cavity"><path d="M365 798 366 386Q580 253 776 260Q980 254 1208 384L1208 799Z"/></clipPath>
          <filter id="fire-pencil" x="-4%" y="-4%" width="108%" height="108%"><feTurbulence type="fractalNoise" baseFrequency=".14" numOctaves="3" seed="14" result="grain"/><feDisplacementMap in="SourceGraphic" in2="grain" scale="3.2" result="rough"/><feColorMatrix in="grain" type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 .333 .333 .334 0 0"/><feComponentTransfer><feFuncA type="table" tableValues=".45 .85 1 1 1"/></feComponentTransfer><feComposite in="rough" operator="in"/></filter>
          <pattern id="fire-hatch" patternUnits="userSpaceOnUse" width="29" height="33" patternTransform="rotate(-12)"><path d="m2 23 7-12m9 21 8-16m-9-9 3-4" stroke="#fff2c8" stroke-width="2.4" stroke-linecap="round" opacity=".66"/><path d="m4 29 3-5m12-10 2-4" stroke="#ca6a36" stroke-width="1.4" opacity=".38"/></pattern>
          <pattern id="ember-hatch" patternUnits="userSpaceOnUse" width="23" height="19"><path d="m2 8 12-2m-5 9 9-2" stroke="#ed9b50" stroke-width="3" stroke-linecap="round"/><path d="m4 9 4-1" stroke="#ffda87" stroke-width="2"/></pattern>
        </defs>
        <g class="fire-structure"><use href="#fire-pencil-art" mask="url(#fire-behind-front-log)"/></g>
        <g class="fire-rear-logs"><use href="#fire-pencil-art" clip-path="url(#fire-rear-log)"/></g>
        <rect class="fire-masonry-bounds" x="136" y="84" width="1278" height="858" fill="none" pointer-events="none"/>
        <g class="fire-live-interior" clip-path="url(#fire-cavity)">
          <g class="fire-glow" filter="url(#fire-pencil)">
            <path d="M542 776Q558 754 606 758L646 769 635 785 598 781 573 790Z M682 774L706 751 746 746 774 767 756 790 727 783 704 797Z M796 766Q822 742 858 755L886 778 864 791 830 783 810 790Z M935 773L953 755 989 764 1022 780 994 788 968 782 944 791Z" fill="#923e29" opacity=".82"/>
            <path d="M561 775L588 764 617 772 604 783 579 780Z M702 771Q726 750 750 767L740 782 719 778Z M815 762L843 757 864 770 847 779 825 775Z M955 774L974 766 997 778 979 782Z" fill="#df7d3b" opacity=".78"/>
            <path d="M574 772L600 767 617 777 587 781Z M713 769L737 759 751 771 729 780Z M826 762L845 759 858 772 833 778Z M963 774L980 770 992 779 973 781Z" fill="url(#ember-hatch)"/>
            <path d="M645 704L681 689 710 704 724 726 697 749 675 738 664 752Z M769 712L798 692 825 704 814 736 793 747 782 732Z M851 701L886 691 905 711 893 738 871 752 858 729Z" fill="#d66b32" opacity=".5"/>
            <g class="fire-coal-bed"></g>
          </g>
          <g class="fire-root-system" mask="url(#fire-root-occlusion)">
            <g class="fire-lower-flames" stroke-linejoin="round" filter="url(#fire-pencil)"></g>
            <g class="fire-contact-flames" stroke-linejoin="round" filter="url(#fire-pencil)"></g>
            <g class="fire-flames" stroke-linejoin="round" filter="url(#fire-pencil)"></g>
            <g class="fire-flame-grain"></g>
          </g>
        </g>
        <g class="fire-log-interleave"><use href="#fire-pencil-art" clip-path="url(#fire-cross-log)"/></g>
        <g class="fire-logs"><use href="#fire-pencil-art" clip-path="url(#fire-front-log)"/></g>
        <g class="fire-log-char" clip-path="url(#fire-all-logs)" stroke-linecap="round" stroke-linejoin="round" filter="url(#fire-pencil)"></g>
        <g class="fire-log-heat" clip-path="url(#fire-all-logs)" fill="none" stroke-linecap="round" filter="url(#fire-pencil)">
          <path d="M584 659Q659 688 716 690M554 751Q613 744 670 735M791 739Q907 756 983 763M632 758Q782 719 959 667" stroke="#763c29" stroke-width="14" opacity=".66"/>
          <path d="M590 623Q659 650 754 671M552 695Q610 694 658 707M824 711Q902 704 981 714M627 718Q777 671 946 629" stroke="#d87638" stroke-width="15" opacity=".7" stroke-dasharray="43 8 29 12 17 7"/>
          <path class="fire-log-rim" d="M597 628Q661 652 744 673M568 698L621 702M841 713Q912 709 973 717M637 720Q793 669 941 634" stroke="#f6b965" stroke-width="6" stroke-dasharray="27 9 8 13 35 11"/>
        </g>
        <g class="fire-contact-hotspots" clip-path="url(#fire-all-logs)" fill="none" stroke-linecap="round"></g>
        <g class="fire-seam-embers" mask="url(#fire-between-logs)" stroke-linecap="round" filter="url(#fire-pencil)"></g>
        <g class="fire-ember-falls" mask="url(#fire-between-logs)" fill="none" stroke-linecap="round"></g>
        <g class="fire-embers" stroke-linecap="round" filter="url(#fire-pencil)"></g>
        <g class="fire-sparks" fill="none" stroke-linecap="round" stroke-linejoin="round"></g>
      </svg>
    </svg>`;
    parent.append(this.element);
    const add = (group, tag, attrs) => {
      const node = document.createElementNS('http://www.w3.org/2000/svg', tag);
      Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, value));
      this.element.querySelector(group).append(node);
      return node;
    };
    drawFirelight(add);
    this.environment=this.element.querySelector('.fire-environment');
    this.lightField=this.element.querySelector('.firelight-field');
    this.hearthLight=this.element.querySelector('.firelight-hearth');
    const colors = ['#d95f35','#e78342','#e96d38','#f1a54f','#ee9145','#ffd47e','#fff0b9'];
    this.flames = colors.map((color,n) => add('.fire-flames','path',{fill:color,stroke:n<3?'#df7142':'#f6c46d','stroke-width':2.5}));
    this.flameGrain = colors.map(() => add('.fire-flame-grain','path',{fill:'url(#fire-hatch)'}));
    this.lowerFlames = Array.from({length:4},(_,n)=>add('.fire-lower-flames','path',{fill:n%2?'#f8bc68':'#df793d',stroke:'#eb994e','stroke-width':1.8}));
    this.contactFlames = Array.from({length:3},(_,n)=>add('.fire-contact-flames','path',{fill:n%2?'#e49b4a':'#f2b663',stroke:'#e28e44','stroke-width':1.8}));
    // Contact marks never grow with elapsed time. Their fixed silhouettes only
    // deepen with the slider; returning to Embers restores the normal wood tone.
    const contacts=[[666,655],[711,701],[778,679],[862,653],[898,715],[939,718]];
    this.charMarks=contacts.map(([x,y],n)=>add('.fire-log-char','path',{
      d:`M${x-12} ${y+5}l7 -9 11 2 7 -4 10 5 -6 5 3 5 -13 -2 -8 4Z M${x-17} ${y+9}l9 -3m17 -9 7 -3`,
      fill:n%2?'#694334':'#76503c',stroke:'#694333','stroke-width':2.5
    }));
    this.contactHotspots=contacts.map(([x,y],n)=>add('.fire-contact-hotspots','path',{
      d:`M${x-3} ${y-4}q3 -3 ${7+n%2*3} -2`,stroke:n%2?'#f4bd71':'#e9944d','stroke-width':3+n%3*.6
    }));
    this.emberFalls=Array.from({length:3},(_,n)=>add('.fire-ember-falls','path',{stroke:n%2?'#e99c50':'#f3bb68','stroke-width':3.5}));
    this.coals = Array.from({length:13},(_,n)=>{
      const x=[570,598,620,706,726,746,813,829,852,949,969,990,734][n],y=762+(n*11%25),w=5+n%4*2;
      return add('.fire-coal-bed','path',{d:`M${x-w} ${y}l${w*.7} -4 ${w*1.1} 1 ${w*.6} 5 -${w} 3 -${w*.8} -1Z`,fill:n%3?'#e57b37':'#873923',stroke:n%3?'#f4b458':'#c9612d','stroke-width':2});
    });
    this.seamEmbers = Array.from({length:9},(_,n)=>{
      const x=638+n*35,y=714+(n*19%54);
      return add('.fire-seam-embers','path',{d:`M${x} ${y}q5 -4 ${9+n%3*2} -${2+n%2*3}`,fill:'none',stroke:n%2?'#f3b15b':'#dd6e32','stroke-width':4+n%3});
    });
    this.embers = Array.from({length:16},(_,n)=>add('.fire-embers','path',{d:`M${535+(n*79%466)} ${768+(n*13%32)}l${5+n%4*2} ${n%2?-3:2}`,stroke:n%3?'#ec9850':'#f9d082','stroke-width':3+n%3}));
    this.sparks = Array.from({length:16},(_,n)=>add('.fire-sparks','path',{
      stroke:['#ffc56d','#f9aa55','#ffdc91'][n%3],'stroke-width':6+n%3*.5
    }));
    this.glow = this.element.querySelector('.fire-glow');
    this.structureArt = this.element.querySelector('.fire-structure use');
    this.logHeat = this.element.querySelector('.fire-log-heat');
    this.logChar = this.element.querySelector('.fire-log-char');
    this.logRim = this.element.querySelector('.fire-log-rim');
    this.time=0;this.sparkTime=0;this.last=null;this.visible=false;
    this.update(0,0,true);
  }

  setVisible(visible) {
    this.visible=visible;
    // Do not composite a filtered light field underneath unrelated worlds.
    this.environment.style.display=visible?'':'none';
    this.structureArt.setAttribute('filter',visible?'url(#fire-soften-hatching)':'none');
    this.element.classList.toggle('is-active',visible);
    this.element.setAttribute('aria-hidden',String(!visible));
  }

  update(now,intensity,slow=false) {
    const i=clampFire(intensity),p=fireParameters(i);
    const delta=this.last===null?0:Math.max(0,Math.min(.06,now-this.last));
    this.last=now;this.time+=delta*p.flameMovement*(slow?.23:1);
    this.sparkTime+=delta*(slow?.23:1);
    const t=this.time,x=[779,662,894,733,855,788,770];
    // Redistribute the same flame paths, especially through the mid-range.
    // Broader shared shoulders and staggered roots replace thin upright icons;
    // the maximum height, surrounding firelight and fixed log pile stay intact.
    const burning=smoothFire((i-.08)/.55);
    // A slow, almost imperceptible breath of warmth. The masonry never scales.
    const lightBreath=.985+.015*Math.sin(t*.43);
    this.lightField.setAttribute('transform',`translate(768 690) scale(${p.lightSpread}) translate(-768 -690)`);
    this.lightField.setAttribute('opacity',p.lightOpacity*lightBreath);
    this.hearthLight.setAttribute('transform',`translate(768 905) scale(${p.hearthSpreadX} ${p.hearthSpreadY}) translate(-768 -905)`);
    this.hearthLight.setAttribute('opacity',p.hearthLight*lightBreath);
    this.flames.forEach((node,n)=>{
      const presence=n===0?1:smoothFire((i-(n-1)*.055)/.25);
      const sway=Math.sin(t*(1.1+n*.11)+n*2.7)*p.flameWidthVariation;
      const pulse=1+(.025+i*.045)*Math.sin(t*(1.8+n*.13)+n)+(.012+i*.01)*Math.sin(t*.71+n);
      const h=p.flameHeight*[1,.54,.64,.76,.53,.55,.36][n]*pulse;
      const w=(8+i*[60,42,45,42,35,35,23][n]+burning*[26,18,19,16,16,11,8][n])*(1+.04*i);
      const b=[752,723,727,722,713,704,716][n],tip=x[n]+sway+(n%2?-1:1)*w*.23;
      const d=`M${x[n]-w} ${b}Q${x[n]-w*1.16} ${b-h*.19} ${x[n]-w*.79} ${b-h*.4}L${x[n]-w*.64} ${b-h*.61}Q${x[n]-w*.4} ${b-h*.5} ${x[n]-w*.26} ${b-h*.36}C${x[n]+w*.05} ${b-h*.59} ${tip+w*.35} ${b-h*.75} ${tip} ${b-h}Q${tip+w*.74} ${b-h*.82} ${x[n]+w*.43} ${b-h*.5}Q${x[n]+w*.64} ${b-h*.44} ${x[n]+w*.91} ${b-h*.66}Q${x[n]+w*.82} ${b-h*.36} ${x[n]+w*1.03} ${b-h*.2}L${x[n]+w*.79} ${b-3} ${x[n]+w*.35} ${b-12} ${x[n]+w*.12} ${b+2} ${x[n]-w*.3} ${b-9}Z`;
      node.setAttribute('d',d);node.setAttribute('opacity',presence*.94);
      this.flameGrain[n].setAttribute('d',d);this.flameGrain[n].setAttribute('opacity',presence*.7);
    });
    this.lowerFlames.forEach((node,n)=>{
      // Uneven roots sit in different clefts; the cross/front log cutouts break
      // their silhouettes into visible tongues rather than four floating flames.
      const x=[555,688,855,1025][n],b=[770,744,750,768][n];
      const h=(5+i*[45,68,66,50][n]+burning*[80,65,59,84][n])*(1+.08*Math.sin(t*1.8+n)),w=5+i*13+burning*12;
      const bend=Math.sin(t*1.2+n*2)*7+(n%2?-7:6);
      node.setAttribute('d',`M${x-w} ${b}Q${x-w*1.3} ${b-h*.37} ${x+bend} ${b-h}Q${x+bend+w*.4} ${b-h*.59} ${x-w*.1} ${b-h*.36}L${x+w*.87} ${b-h*.56}Q${x+w*.5} ${b-h*.2} ${x+w} ${b-3}L${x+w*.2} ${b-8}Z`);
      node.setAttribute('opacity',(.12+burning*.7)*(n%2?.85:1));
    });
    this.contactFlames.forEach((node,n)=>{
      const x=[686,799,934][n],b=[670,702,664][n],h=(3+i*29+burning*[52,65,47][n])*(1+.07*Math.sin(t*1.3+n*2)),w=3+i*7+burning*10;
      const lean=Math.sin(t+n*2)*5+(n-1)*6;
      node.setAttribute('d',`M${x-w} ${b}Q${x-w*1.2} ${b-h*.35} ${x+lean} ${b-h}Q${x+w*.75} ${b-h*.67} ${x+w*.12} ${b-h*.38}L${x+w} ${b-h*.47}Q${x+w*.55} ${b-h*.19} ${x+w*.8} ${b-4}L${x-w*.2} ${b-9}Z`);
      node.setAttribute('opacity',smoothFire((i-.07)/.4)*(.79+n*.05));
    });
    const combustion=(.27+i*.59)*(.95+.05*Math.sin(t*.7));
    this.glow.setAttribute('opacity',combustion);
    this.logHeat.setAttribute('opacity',.13+i*.62);
    this.logRim.setAttribute('opacity',.4+i*.42);
    this.logChar.setAttribute('opacity',.09+i*.46);
    this.contactHotspots.forEach((node,n)=>node.setAttribute('opacity',smoothFire((i-.09-n*.05)/.45)*(.3+.45*Math.sin(t*.67+n*1.7)**2)));
    this.coals.forEach((node,n)=>node.setAttribute('opacity',.62+.25*Math.sin(t*.7+n*1.9)**2));
    this.seamEmbers.forEach((node,n)=>node.setAttribute('opacity',combustion*(.68+.23*Math.sin(t*.7+n*1.9)**2)));
    // Reusable short-lived cinders, not fragments removed from a log. No fuel,
    // age, ash counter, shape mutation or accumulated burn-down state exists.
    this.emberFalls.forEach((node,n)=>{
      const phase=(this.sparkTime*.055+.31+n*.271)%1;
      const progress=phase/(.075+i*.025),fall=Math.min(1,progress)**1.35;
      const x=[676,811,947][n]+Math.sin(progress*2+n)*2,y=[760,757,767][n]+fall*[30,35,25][n];
      node.setAttribute('d',`M${x} ${y}l${n%2?-1:1} 2.5`);
      node.setAttribute('opacity',progress<1?smoothFire((i-.12-n*.24)/.32)*Math.sin(progress*Math.PI)*.78:0);
    });
    this.embers.forEach((node,n)=>node.setAttribute('opacity',p.emberGlow*(.75+.25*Math.sin(t*(.9+n*.03)+n*2)**2)));
    this.sparks.forEach((node,n)=>{
      // Broad, overlapping lifetimes prevent empty medium-intensity frames.
      // Fixed per-particle seeds keep position, speed and pencil marks stable.
      const seed=(n*.618034)%1,phase=(this.sparkTime*(.045+i*.075)*(.82+seed*.48)+.11+seed)%1;
      const progress=phase/p.sparkDuty,presence=smoothFire(p.sparkCount-n);
      const rise=Math.min(1,progress),originX=622+(n*97%309),originY=739+n%3*9;
      const travel=(230+seed*330)*(.7+i*.65);
      const drift=(Math.sin(rise*3+n*1.7)-Math.sin(n*1.7))*(9+seed*14)+rise*(seed-.5)*22;
      const x=originX+drift,y=originY-rise*travel,size=(10+n%4*2)*(.75+.45*i);
      const envelope=smoothFire(progress/.1)*smoothFire((1-progress)/.2);
      const d=n%3===0?`M${x} ${y}l1 -${size*.4}`
        :n%3===1?`M${x-1} ${y+size*.3}q${2+seed*2} -${size*.45} 1 -${size}`
        :`M${x} ${y}l-2 -${size*.42} 3 -${size*.58} 1 ${size*.53}Z`;
      node.setAttribute('d',d);
      node.setAttribute('stroke-width',(6+n%3*.5)*(.8+.35*i));
      node.setAttribute('opacity',presence*envelope*(.82+seed*.14)*(.42+.58*smoothFire(i/.5)));
    });
    this.parameters=p;
  }
}
