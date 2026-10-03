// One SVG world, driven by the same normalized intensity as its audio mix.
const clampFire = n => Math.max(0, Math.min(1, n));
const smoothFire = n => { const p = clampFire(n); return p * p * (3 - 2 * p); };

export function fireParameters(intensity) {
  const i = clampFire(intensity);
  return {
    flameHeight: 4 + 129 * Math.pow(i, .85),
    flameWidthVariation: 1 + i * 6,
    flameMovement: .24 + i * .83,
    flameCount: 1 + i * 6,
    emberGlow: .22 + i * .63,
    sparkFrequency: .015 + i * i * .62
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
    this.element.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="44 170 312 300" role="img" aria-label="Hand-drawn open brick fireplace">
      <defs>
        <filter id="fire-pencil" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency=".12" numOctaves="2" seed="14" result="grain"/><feDisplacementMap in="SourceGraphic" in2="grain" scale=".8"/></filter>
        <radialGradient id="ember-light"><stop stop-color="#d58c54" stop-opacity=".45"/><stop offset="1" stop-color="#d58c54" stop-opacity="0"/></radialGradient>
        <clipPath id="fire-cavity"><path d="M112 421 113 292Q114 252 148 246Q200 234 251 247Q283 253 286 291L287 421Z"/></clipPath>
        <pattern id="fire-hatch" patternUnits="userSpaceOnUse" width="7" height="11"><path d="m1 9 3-6m1 8 1-2" stroke="#fff" stroke-width=".65" opacity=".2"/></pattern>
        <clipPath id="fire-bricks"><path d="M77 220 321 218 324 414 287 414 286 291Q283 253 251 247Q200 234 148 246Q114 252 113 292L112 414 76 414Z"/></clipPath>
      </defs>
      <g class="fire-structure" stroke-linecap="round" stroke-linejoin="round" filter="url(#fire-pencil)">
        <path d="M79 218 320 220 324 414 76 414Z" fill="#be8067" fill-opacity=".07"/>
        <path d="M112 413 113 292Q114 252 148 246Q200 234 251 247Q283 253 286 291L287 415Z" fill="#79665b" fill-opacity=".18"/>
        <g clip-path="url(#fire-cavity)" stroke="#8e7d72" stroke-width=".65" opacity=".13">
          <path d="m103 305 189-39m-190 60 193-39m-191 61 190-39m-192 60 193-38m-192 60 190-39m-174 55 171-33"/>
        </g>
        <g fill="none" stroke="#ac745d" stroke-width="1.6">
          <path d="M77 412 78 221 143 219 220 220 320 218 323 413"/>
          <path d="M112 408 113 292Q114 252 148 246Q200 234 251 247Q283 253 286 291L287 408"/>
          <path d="m71 209 85-2 97 2 76-2 1 13-94 1-88-2-78 2Z" fill="#c39077" fill-opacity=".1"/>
          <path d="m67 413 74-2 105 2 85-1 4 12-74 1-116-1-80 2Z" fill="#bc8b72" fill-opacity=".12"/>
        </g>
        <g clip-path="url(#fire-bricks)" fill="none" stroke="#bc8a72" stroke-width="1.1" opacity=".76">
          <path d="m77 247 53-1 68 1 64-2 60 2m-245 28 57 1 55-2 77 1 56 1m-245 28 79-1 75 2 93-2m-247 29 70 1 95-2 81 2m-246 27 77 1 91-2 79 1m-247 28 89 1 69-2 88 1"/>
          <path d="m124 221 1 26m63-26-1 24m62-25 1 26m42-27 1 27m-197 2 1 26m47-27-1 29m126-29 1 28m-158 30-17-1m0-28 1 27m-16 28 31 1m-16 1-1 27m0 29 1 26m-16-26 34 1m196-112 1 27m-21 27 35 1m-17 1 1 27m-20 28 36-1m-18 1-1 28"/>
        </g>
        <g clip-path="url(#fire-bricks)" class="brick-grain" stroke="#b97b61" stroke-linecap="round"></g>
        <path d="m82 225-1 76m238 17 2 88m-244 13 53-1m112 2 83-1" fill="none" stroke="#925e4d" stroke-width=".65" opacity=".36"/>
      </g>
      <g clip-path="url(#fire-cavity)">
        <ellipse class="fire-glow" cx="200" cy="388" rx="92" ry="68" fill="url(#ember-light)"/>
        <g class="fire-flames" stroke-linejoin="round" filter="url(#fire-pencil)"></g>
        <g class="fire-flame-grain"></g>
        <g class="fire-logs" stroke-linecap="round" stroke-linejoin="round" filter="url(#fire-pencil)">
          <path d="m143 387 89-18 12 7-5 12-89 14-9-6Z" fill="#8c7260" stroke="#71594d" stroke-width="1.5"/>
          <path d="m129 389 12-5 109 17 6 10-12 7-109-17Z" fill="#9d8067" stroke="#755c4b" stroke-width="1.6"/>
          <path d="m176 404 80-19 11 5-3 10-79 19-10-5Z" fill="#826852" stroke="#6e5548" stroke-width="1.4"/>
          <path d="m150 390 76-14m-84 18 93 14m-83-10 27 4m16 2 41 7m-45-3 61-16m-55 21 58-15" fill="none" stroke="#594c42" stroke-width=".8" opacity=".58"/>
          <path d="m140 388-4 5 3 5m104 6-3 4 5 5 5-4-3-4m-65 2-4 5 4 3m73-28 5 4-2 5" fill="none" stroke="#c6a386" stroke-width="1.2"/>
        </g>
        <g class="fire-embers" stroke-linecap="round"></g>
        <g class="fire-sparks" fill="none" stroke-linecap="round"></g>
      </g>
    </svg>`;
    parent.append(this.element);
    const ns = 'http://www.w3.org/2000/svg';
    const add = (group, tag, attrs) => {
      const node = document.createElementNS(ns, tag);
      Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, value));
      this.element.querySelector(group).append(node);
      return node;
    };
    // Seeded paper marks never move with the fire.
    for (let n = 0; n < 220; n++) {
      const x = 76 + ((n * 83.71) % 247), y = 221 + ((n * 47.31) % 192);
      add('.brick-grain', 'path', {d:`M${x} ${y}l${3 + n % 8} -1.4`, opacity:.07 + (n % 5) * .025, 'stroke-width':.5 + (n % 3) * .3});
    }
    const colors = ['#ce6644','#df8150','#d36b43','#e79b5e','#dc8351','#efb06b','#f1cea0'];
    this.flames = colors.map((color, n) => add('.fire-flames', 'path', {fill:color, stroke:n % 2 ? '#c78152' : '#b86f4c', 'stroke-width':.75}));
    this.flameGrain = colors.map(() => add('.fire-flame-grain', 'path', {fill:'url(#fire-hatch)'}));
    this.embers = Array.from({length:16}, (_, n) => add('.fire-embers', 'path', {d:`M${142 + (n * 37 % 112)} ${394 + (n * 13 % 20)}l${2 + n % 4} ${n % 2 ? -1 : 1}`, stroke:n % 3 ? '#cc754c' : '#e2ac72', 'stroke-width':1.2 + n % 3 * .3}));
    this.sparks = Array.from({length:8}, () => add('.fire-sparks', 'path', {stroke:'#c98858','stroke-width':1.1}));
    this.glow = this.element.querySelector('.fire-glow');
    this.time = 0;
    this.last = null;
    this.visible = false;
    this.update(0, 0, true);
  }

  setVisible(visible) {
    this.visible = visible;
    this.element.classList.toggle('is-active', visible);
    this.element.setAttribute('aria-hidden', String(!visible));
  }

  update(now, intensity, slow = false) {
    const p = fireParameters(intensity);
    const delta = this.last === null ? 0 : Math.max(0, Math.min(.06, now - this.last));
    this.last = now;
    // Integrating time avoids a flame jump when intensity changes.
    this.time += delta * p.flameMovement * (slow ? .23 : 1);
    const t = this.time;
    const x = [193,171,223,195,242,180,208];
    this.flames.forEach((node, n) => {
      const presence = n === 0 ? 1 : smoothFire((intensity - (n - 1) * .105) / .22);
      const sway = Math.sin(t * (1.31 + n * .17) + n * 2.7) * p.flameWidthVariation + Math.sin(t * .73 + n) * intensity * 2;
      const pulse = 1 + .055 * Math.sin(t * (2.1 + n * .13) + n) + .04 * Math.sin(t * 1.17 + n * 2);
      const height = p.flameHeight * [1,.67,.82,.83,.53,.53,.58][n] * pulse;
      const width = (3 + intensity * [20,19,18,14,13,11,9][n]) * (1 + .06 * Math.sin(t * 1.8 + n));
      const bottom = 401 - n % 3 * 3, tip = x[n] + sway;
      const d = `M${x[n]-width} ${bottom}C${x[n]-width*1.5} ${bottom-height*.18} ${x[n]-width*.55} ${bottom-height*.42} ${tip-width*.27} ${bottom-height*.62}C${tip+width*.22} ${bottom-height*.8} ${tip+width*.26} ${bottom-height*.85} ${tip} ${bottom-height}C${tip+width*.98} ${bottom-height*.74} ${x[n]+width*.12} ${bottom-height*.56} ${x[n]+width*.7} ${bottom-height*.4}C${x[n]+width*1.7} ${bottom-height*.16} ${x[n]+width*1.06} ${bottom+4} ${x[n]} ${bottom+3}Q${x[n]-width*.65} ${bottom+5} ${x[n]-width} ${bottom}Z`;
      node.setAttribute('d', d);
      this.flameGrain[n].setAttribute('d', d);
      this.flameGrain[n].setAttribute('opacity', presence * .5);
      node.setAttribute('opacity', (.58 + n * .025) * presence);
    });
    this.glow.setAttribute('opacity', p.emberGlow * (.94 + .06 * Math.sin(t * .79)));
    this.embers.forEach((node,n) => node.setAttribute('opacity', p.emberGlow * (.65 + .35 * Math.sin(t * (1.2+n*.11)+n*3.7)**2)));
    this.sparks.forEach((node,n) => {
      const phase = (t * (.11 + n * .006) + n * .618034) % 1;
      const presence = smoothFire((intensity - .12 - n * .075) / .22);
      const life = Math.min(1, p.sparkFrequency * 1.2), progress = phase / Math.max(.001, life);
      const sx = 157 + n * 12 + Math.sin(t * .7 + n) * 4;
      const sy = 389 - Math.min(1, progress) * (32 + intensity * 81);
      node.setAttribute('d', `M${sx} ${sy}l${Math.sin(n+t)*1.2} -2.1`);
      node.setAttribute('opacity', progress < 1 ? Math.sin(progress*Math.PI) * presence * .62 : 0);
    });
    this.parameters = p;
  }
}
