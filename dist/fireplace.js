// One SVG world, driven by the same normalized intensity as its audio mix.
const clampFire = n => Math.max(0, Math.min(1, n));
const smoothFire = n => { const p = clampFire(n); return p * p * (3 - 2 * p); };

export function fireParameters(intensity) {
  const i = clampFire(intensity);
  return {
    flameHeight: 8 + 112 * Math.pow(i, .85),
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
    this.element.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="24 80 352 236" role="img" aria-label="Crayon-drawn brick fireplace on white paper">
      <defs>
        <filter id="fire-pencil" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency=".36" numOctaves="3" seed="14" result="grain"/><feDisplacementMap in="SourceGraphic" in2="grain" scale="1.25"/></filter>
        <radialGradient id="ember-light"><stop stop-color="#ffb34e" stop-opacity=".9"/><stop offset=".5" stop-color="#e7602d" stop-opacity=".55"/><stop offset="1" stop-color="#e7602d" stop-opacity="0"/></radialGradient>
        <clipPath id="fire-cavity"><path d="M102 410 104 323Q107 298 151 289Q205 274 254 292Q287 302 296 324L296 410Z"/></clipPath>
        <pattern id="fire-hatch" patternUnits="userSpaceOnUse" width="5" height="7"><path d="m.5 6 3-4m1 5 1-2" stroke="#fff9db" stroke-width=".75" opacity=".6"/></pattern>
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
    // Replace the old pale vector masonry with a single static crayon texture.
    // There is no flame or glow baked into this image: every fire state remains live.
    const structure = this.element.querySelector('.fire-structure');
    structure.removeAttribute('filter');
    structure.innerHTML = '<image href="./art/fireplace-paper-v3.png" x="0" y="55" width="400" height="266.6667"/>';
    const fireLayer = this.element.querySelector('.fire-glow').parentElement;
    fireLayer.setAttribute('transform', 'translate(0 -147)');
    const logs = this.element.querySelector('.fire-logs');
    // Keep the low front log outside the opening clip; rear logs sit behind fire.
    fireLayer.after(logs);
    logs.setAttribute('transform', 'translate(0 -147)');
    logs.innerHTML = '';
    for (const [index, angle, x, y] of [[0, 12, 191, 403], [1, -13, 209, 401], [2, -4, 201, 412]]) {
      let grain = '';
      for (let n=0;n<60;n++) {
        const gx=-62+(n*23.7)%124, gy=-7+(n*3.73)%14;
        grain += `<path d="M${gx} ${gy}l${4+n%11} ${n%2?.8:-.7}" stroke="${n%3?'#c79c70':'#f1dbc1'}" stroke-width="${.45+n%3*.3}" opacity="${.32+n%4*.1}"/>`;
      }
      logs.innerHTML += `<g data-log-depth="${index < 2 ? 'rear' : 'front'}" transform="translate(${x} ${y}) rotate(${angle}) scale(.85 .68)"><path d="M-65-8Q-6-11 61-8L66-3 65 7Q4 10-64 8Z" fill="#815032" stroke="#75462d" stroke-width="1.6"/>${grain}<ellipse cx="-64" cy="0" rx="6" ry="9" fill="#c88d60" stroke="#784a31" stroke-width="1.4"/><ellipse cx="-64" cy="0" rx="3.5" ry="6" fill="none" stroke="#8f5737" stroke-width=".7"/><path d="M61-7Q68 0 62 8" fill="none" stroke="#dda376" stroke-width="1.1"/></g>`;
    }
    const rearLogs = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    rearLogs.setAttribute('class', 'fire-rear-logs');
    rearLogs.setAttribute('filter', 'url(#fire-pencil)');
    logs.querySelectorAll('[data-log-depth="rear"]').forEach(log => rearLogs.append(log));
    fireLayer.insertBefore(rearLogs, this.element.querySelector('.fire-flames'));
    const embers = this.element.querySelector('.fire-embers');
    logs.after(embers); embers.setAttribute('transform', 'translate(0 -147)');
    const sparks = this.element.querySelector('.fire-sparks');
    embers.after(sparks); sparks.setAttribute('transform', 'translate(0 -147)');
    parent.append(this.element);
    const ns = 'http://www.w3.org/2000/svg';
    const add = (group, tag, attrs) => {
      const node = document.createElementNS(ns, tag);
      Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, value));
      this.element.querySelector(group).append(node);
      return node;
    };
    // Seeded paper marks never move with the fire.
    const colors = ['#e96534','#ef8742','#ed6333','#ffa744','#f78d36','#ffd465','#fff3ce'];
    this.flames = colors.map((color, n) => add('.fire-flames', 'path', {fill:color, stroke:n % 2 ? '#c78152' : '#b86f4c', 'stroke-width':.75}));
    this.flameGrain = colors.map(() => add('.fire-flame-grain', 'path', {fill:'url(#fire-hatch)'}));
    this.embers = Array.from({length:16}, (_, n) => add('.fire-embers', 'path', {d:`M${142 + (n * 37 % 112)} ${394 + (n * 13 % 20)}l${2 + n % 4} ${n % 2 ? -1 : 1}`, stroke:n % 3 ? '#cc754c' : '#e2ac72', 'stroke-width':1.2 + n % 3 * .3}));
    this.sparks = Array.from({length:12}, () => add('.fire-sparks', 'path', {stroke:'#ed8440','stroke-width':1.1}));
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
      this.flameGrain[n].setAttribute('opacity', presence * .85);
      node.setAttribute('opacity', (.84 + n * .022) * presence);
    });
    this.glow.setAttribute('opacity', p.emberGlow * (.94 + .06 * Math.sin(t * .79)));
    this.embers.forEach((node,n) => node.setAttribute('opacity', p.emberGlow * (.65 + .35 * Math.sin(t * (1.2+n*.11)+n*3.7)**2)));
    this.sparks.forEach((node,n) => {
      const phase = (t * (.11 + n * .006) + n * .618034) % 1;
      const presence = smoothFire((intensity - .12 - n * .047) / .22);
      const life = Math.min(1, p.sparkFrequency * 1.2), progress = phase / Math.max(.001, life);
      const sx = n < 8 ? 145 + n * 15 + Math.sin(t * .7 + n) * 5 : 67 + (n-8) * 87 + Math.sin(t+n)*3;
      const sy = 389 - Math.min(1, progress) * (42 + intensity * (n<8?134:164));
      node.setAttribute('d', `M${sx} ${sy}l${Math.sin(n+t)*1.2} -2.1`);
      node.setAttribute('opacity', progress < 1 ? Math.sin(progress*Math.PI) * presence * .62 : 0);
    });
    this.parameters = p;
  }
}
