// A small pencil-drawn object inside the same responsive scene area as Rain.
const clampFire = n => Math.max(0, Math.min(1, n));
const smoothFire = n => { const p = clampFire(n); return p * p * (3 - 2 * p); };

export function fireParameters(intensity) {
  const i = clampFire(intensity);
  return {
    flameHeight: 5 + 91 * Math.pow(i, .85),
    flameWidthVariation: .6 + i * 2.3,
    flameMovement: .18 + i * .4,
    flameCount: 1 + i * 4,
    emberGlow: .12 + i * .25,
    sparkFrequency: .005 + i * i * .24
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
    this.element.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 600" role="img" aria-label="A simple pencil-drawn brick fireplace, three logs and a small central fire on white paper">
      <defs>
        <filter id="fire-pencil" x="-3%" y="-3%" width="106%" height="106%"><feTurbulence type="fractalNoise" baseFrequency=".2" numOctaves="2" seed="14" result="grain"/><feDisplacementMap in="SourceGraphic" in2="grain" scale=".65"/></filter>
        <clipPath id="fire-cavity"><path d="M112 423 113 309Q112 279 148 269Q202 253 250 269Q286 279 286 309L287 423Z"/></clipPath>
        <clipPath id="fire-bricks"><path clip-rule="evenodd" d="M78 238 320 237 322 425 77 425ZM112 423 113 309Q112 279 148 269Q202 253 250 269Q286 279 286 309L287 423Z"/></clipPath>
        <pattern id="fire-hatch" patternUnits="userSpaceOnUse" width="8" height="9"><path d="m1 7 3-5" stroke="#fff7df" stroke-width=".65" opacity=".32"/></pattern>
      </defs>
      <g class="fire-structure" stroke-linecap="round" stroke-linejoin="round" filter="url(#fire-pencil)">
        <path d="M78 238 320 237 322 425 77 425Z" fill="#b47f69" fill-opacity=".045"/>
        <path d="M112 423 113 309Q112 279 148 269Q202 253 250 269Q286 279 286 309L287 423Z" fill="#69635e" fill-opacity=".48"/>
        <g clip-path="url(#fire-cavity)" fill="none" stroke="#665c54" stroke-width=".9" opacity=".19">
          <path d="m112 310 24-31m-18 63 45-67m-42 89 66-99m-66 121 83-124m-65 128 81-119m-68 137 89-133m-65 139 86-130m-57 133 71-110m-45 110 45-71m-21 73 23-36"/>
        </g>
        <g fill="none" stroke="#ae7b64" stroke-width="1.4">
          <path d="M77 424 79 239 142 238 220 239 320 237 322 424"/>
          <path d="M112 422 113 309Q112 279 148 269Q202 253 250 269Q286 279 286 309L287 422"/>
          <path d="m73 226 83-1 94 1 76-1 1 13-94 1-86-1-74 1Z" fill="#ba8c73" fill-opacity=".07"/>
          <path d="m70 425 76-1 98 1 84-1 3 9-80 1-104-1-78 1Z" fill="#b68b73" fill-opacity=".05"/>
        </g>
        <g clip-path="url(#fire-bricks)" fill="none" stroke="#b68b75" stroke-width="1" opacity=".7">
          <path d="m79 267 63-1 58 1 61-1 60 1m-243 32 57 1 62-2 68 1 57 1m-244 31 79-1 75 1 91-1m-246 32 78 1 87-2 81 1m-246 31 76 1 91-1 80 1"/>
          <path d="m127 239 1 27m61-27-1 27m61-28 1 28m-153 3 1 29m-1 33 1 30m-1 33 1 30m205-155 1 29m-1 33 1 30m-1 33 1 30"/>
          <path d="m84 246 14-4m41 3 17-3m40 3 13-3m53 3 14-3m-190 44 10-8m-10 42 12-9m-12 41 10-7m-10 39 11-7m203-98 9-7m-9 39 10-7m-10 39 9-7m-9 39 11-6" stroke-width=".65" opacity=".42"/>
        </g>
        <path d="m63 439 64-2m31 4 96-1m23-2 58 1" fill="none" stroke="#bfa28b" stroke-width="1" opacity=".45"/>
      </g>
      <g clip-path="url(#fire-cavity)">
        <ellipse class="fire-glow" cx="200" cy="413" rx="41" ry="8" fill="#dba56c"/>
        <g class="fire-rear-logs" fill="#947660" stroke="#785f4e" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" filter="url(#fire-pencil)">
          <path data-log-depth="rear" d="m148 405 8-7 86 12-2 10-86-9Z"/>
          <path data-log-depth="rear" d="m159 414 80-18 7 5-2 7-80 16Z"/>
          <path d="m159 404 61 9m-48 3 60-14" fill="none" stroke="#c5a184" stroke-width=".8"/>
        </g>
        <g class="fire-flames" stroke-linejoin="round" filter="url(#fire-pencil)"></g>
        <g class="fire-flame-grain"></g>
      </g>
      <g class="fire-logs" stroke-linecap="round" stroke-linejoin="round" filter="url(#fire-pencil)">
        <path data-log-depth="front" d="m158 419 89-2 5 5-4 7-90 1Z" fill="#9a7a60" stroke="#7d624e" stroke-width="1.3"/>
        <ellipse cx="159" cy="424" rx="4.5" ry="6" fill="#c7a181" stroke="#876951" stroke-width="1.1"/>
        <path d="m171 423 57-2m-48 5 32-1" fill="none" stroke="#c7a181" stroke-width=".8"/>
      </g>
      <g class="fire-embers" stroke-linecap="round"></g>
      <g class="fire-sparks" fill="none" stroke-linecap="round"></g>
    </svg>`;
    parent.append(this.element);
    const ns = 'http://www.w3.org/2000/svg';
    const add = (group, tag, attrs) => {
      const node = document.createElementNS(ns, tag);
      Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, value));
      this.element.querySelector(group).append(node);
      return node;
    };
    const colors = ['#cf8856','#d99b60','#dea567','#edc47e','#f5ddb0'];
    this.flames = colors.map((color, n) => add('.fire-flames', 'path', {fill:color, stroke:n < 3 ? '#bc865d' : '#d5b47e', 'stroke-width':.8}));
    this.flameGrain = colors.map(() => add('.fire-flame-grain', 'path', {fill:'url(#fire-hatch)'}));
    this.embers = Array.from({length:5}, (_, n) => add('.fire-embers', 'path', {d:`M${169+n*14} ${416+n%2*2}l2 -.5`, stroke:'#cd9560', 'stroke-width':1}));
    this.sparks = Array.from({length:4}, () => add('.fire-sparks', 'path', {stroke:'#d3a16c','stroke-width':.9}));
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
    const i = clampFire(intensity), p = fireParameters(i);
    const delta = this.last === null ? 0 : Math.max(0, Math.min(.06, now - this.last));
    this.last = now;
    this.time += delta * p.flameMovement * (slow ? .23 : 1);
    const t = this.time, x = [199,184,213,199,202];
    this.flames.forEach((node, n) => {
      const presence = n === 0 ? 1 : smoothFire((i - (n - 1) * .1) / .25);
      const sway = Math.sin(t * (1.15 + n * .12) + n * 2.7) * p.flameWidthVariation;
      const pulse = 1 + .035 * Math.sin(t * (1.7 + n * .13) + n);
      const height = p.flameHeight * [1,.64,.71,.61,.38][n] * pulse;
      const width = 2.5 + i * [17,12,12,10,6][n];
      const bottom = 416 - n % 2 * 2, tip = x[n] + sway;
      const d = `M${x[n]-width} ${bottom}C${x[n]-width*1.4} ${bottom-height*.2} ${x[n]-width*.5} ${bottom-height*.44} ${tip-width*.24} ${bottom-height*.65}Q${tip+width*.28} ${bottom-height*.83} ${tip} ${bottom-height}C${tip+width*.92} ${bottom-height*.74} ${x[n]+width*.1} ${bottom-height*.54} ${x[n]+width*.66} ${bottom-height*.38}C${x[n]+width*1.5} ${bottom-height*.14} ${x[n]+width} ${bottom+2} ${x[n]} ${bottom+3}Q${x[n]-width*.65} ${bottom+4} ${x[n]-width} ${bottom}Z`;
      node.setAttribute('d', d);
      node.setAttribute('opacity', .88 * presence);
      this.flameGrain[n].setAttribute('d', d);
      this.flameGrain[n].setAttribute('opacity', presence * .55);
    });
    this.glow.setAttribute('opacity', p.emberGlow * (.96 + .04 * Math.sin(t * .7)));
    this.embers.forEach((node,n) => node.setAttribute('opacity', p.emberGlow * (.75 + .25 * Math.sin(t+n*2)**2)));
    this.sparks.forEach((node,n) => {
      const phase = (t * (.12 + n * .008) + n * .618034) % 1;
      const presence = smoothFire((i - .28 - n * .14) / .26);
      const progress = phase / Math.max(.001, p.sparkFrequency);
      const sx = 184 + n * 11 + Math.sin(t * .6 + n) * 2;
      const sy = 402 - Math.min(1, progress) * (35 + i * 75);
      node.setAttribute('d', `M${sx} ${sy}l.4 -1.5`);
      node.setAttribute('opacity', progress < 1 ? Math.sin(progress*Math.PI) * presence * .48 : 0);
    });
    this.parameters = p;
  }
}
