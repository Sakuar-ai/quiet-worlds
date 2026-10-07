// One identity per world. Header, picker and future navigation all call worldIcon.
// No alternate artwork by context: only the container's CSS may scale it.
const pine = (x,y,scale) => `<g transform="translate(${x} ${y}) scale(${scale})"><path d="M0 57 1 7" stroke="#967c62" stroke-width="2.8"/><path d="M1 0C-1 9-5 17-10 23l7-3-12 15 10-4-13 16 12-4-10 11c7-1 12-5 17-9 5 5 10 8 16 9L8 42l9 4L7 30l8 4L5 18l6 4Z" fill="#96aa91" stroke="#607e68" stroke-width="1.4"/><path d="M1 7 0 45M-1 20l-5 5m8-7 5 9M-1 31l-7 7m10-7 7 8M-2 42l-8 6m12-6 7 6" stroke="#617e66" stroke-width="1.25"/><path d="m-4 22 3-4m5 14 4 6m-13 6-4 4" stroke="#fff" stroke-opacity=".65" stroke-width="1.3"/></g>`;

export const WORLD_ICONS = Object.freeze({
  rain: Object.freeze({color:'#6998b8',art:`
    <path d="M37 52C24 52 23 35 34 32c4-1 6 0 8 1-2-12 8-23 19-22 11 0 19 8 19 19 7-4 18 1 19 10 2 10-7 14-19 14Z" fill="#abc9dd" stroke="#628cac" stroke-width="2.1"/>
    <path d="M29 45c-2-6 1-10 5-11m12-8c2-7 9-12 16-11m18 19c8-3 15 3 15 9M36 50l42 1" stroke="#eaf2f6" stroke-width="1.7"/>
    <path d="m44 63-4 10m19-11-4 11m21-12-4 12m22-15-3 8m-57 10-3 9m24-7-3 10m28-14-3 10" stroke="#6898b8" stroke-width="2.35"/>
  `}),
  fireplace: Object.freeze({color:'#bb7d60',art:`
    <path d="M44 65C33 54 40 42 45 32l3 10c6-11 12-23 13-32 8 8 12 22 10 32l6-12c10 14 17 29 5 39-9 7-28 5-38-4Z" fill="#e3a083" stroke="#bd7659" stroke-width="1.9"/>
    <path d="M49 65c-6-9 1-18 7-26l1 13c6-7 8-14 8-21 8 13 13 20 11 29l-5 8Z" fill="#f2c286" stroke="#d89962" stroke-width="1.15"/>
    <path d="M57 68c-6-5-2-10 2-15l1 8 6-10c4 8 6 14-1 17" fill="#fff6dc" stroke="none"/>
    <path d="m38 72 49 12 4-9-50-12Z" fill="#a08368" stroke="#795d48" stroke-width="1.8"/>
    <path d="m41 84 48-18 3 9-48 18Z" fill="#a48365" stroke="#795d48" stroke-width="1.9"/>
    <ellipse cx="43" cy="88" rx="4" ry="5.5" transform="rotate(-18 43 88)" fill="#d3ae88" stroke="#795d48" stroke-width="1.6"/>
    <path d="m45 69 33 8m-29 8 32-12m-28 14 26-10" stroke="#e4c5a2" stroke-width="1.25"/>
    <path d="m26 48 1-5 1 5-1 4Zm71-16 1-5 1 5-1 4Z" stroke="#d4a56c" stroke-width="1"/>
  `}),
  forest: Object.freeze({color:'#829b82',art:`${pine(36,37,.78)}${pine(63,10,1.24)}${pine(91,34,.88)}`}),
  ocean: Object.freeze({color:'#719fbd',art:`
    <g data-wave="crest">
      <path d="M12 63C28 60 39 37 54 26c12-10 29-10 34 0 5 9-1 20-9 17-5-2-6-8-2-10 3-2 6 1 4 3-2-2-4 0-2 2 4 3 8-5 3-10-9-8-18 5-22 17-7 18-27 26-48 23Z" fill="#b1d0e1" stroke="#608fac" stroke-width="1.75"/>
      <path d="M15 61c20-7 29-34 47-37 11-3 20 1 21 8M15 66c21-3 33-20 40-29" stroke="#709fbe" stroke-width="2"/>
      <path d="M18 69c21-3 35-15 41-29 1 16 12 27 27 23" stroke="#fff" stroke-width="2.5"/>
    </g>
    <g data-wave="right-curl">
      <path d="M49 72c18-3 22-20 33-25 10-5 19 0 17 7-1 6-8 9-12 4-3-4 2-8 4-5-3 0-2 4 0 3 4-1 4-6 0-7-7-3-11 5-10 11 2 13 15 20 25 12 7-6 3-14-2-13-4 1-3 6 0 5-2-2 2-3 3-1 4 7-10 15-16 15-13 6-30 3-42-1Z" fill="#a2c5dc" stroke="#6797b6" stroke-width="1.65"/>
      <path d="M54 73c12-3 18-14 22-18m-3 9c6 13 21 20 34 9" stroke="#f9fcfd" stroke-width="2.2"/>
    </g>
    <g data-wave="front-curl">
      <path d="M14 82c18 2 28-14 40-12 12 0 15 13 7 20-6 6-17 4-17-3 0-5 6-8 9-4 2 3-2 6-4 3 0 4 7 3 9-1 4-8-7-11-15-6-12 8-21 9-29 7" fill="#a9cbdc" stroke="#608fae" stroke-width="1.8"/>
      <path d="M16 83c16 0 27-11 37-9m12 13c11 7 25 3 33 0" stroke="#f8fcfe" stroke-width="1.8"/>
    </g>
  `}),
  snow: Object.freeze({color:'#a09ac3',art:`
    <g stroke="#8882b0" stroke-width="2.9">
      <path d="m63 17-1 68M33 34l58 35M92 34 32 69"/>
      <path d="m54 25 9 9 9-10m-19 52 9-9 9 10M35 45l12-3-1-12m33 41-1-13 12-3m-56 3 13 3-2 13m33-41 1 12 12 3" stroke-width="2.1"/>
    </g>
    <g fill="#c2bcdb" stroke="#a39cc4" stroke-width=".7"><path d="m24 27 2-2 2 2-2 2Zm73 49 2-2 2 2-2 2ZM41 15l2-2 2 2-2 2Z"/><circle cx="24" cy="77" r="1.5"/><circle cx="99" cy="20" r="1.4"/></g>
  `})
});

let iconSerial=0;
export function worldIcon(id) {
  const icon=WORLD_ICONS[id];
  if(!icon)throw new Error(`No world icon registered for ${id}`);
  // Unique paint-server IDs allow the SAME drawing in several places at once.
  const prefix=`world-icon-${id}-${++iconSerial}`,clip=`${prefix}-paper`,grain=`${prefix}-grain`;
  let pencil='';
  for(let n=0;n<125;n++){
    const x=6+(n*47.731)%110,y=8+(n*23.719)%82;
    pencil+=`<path d="M${x.toFixed(1)} ${y.toFixed(1)}l${3+n%6} -${4+n%7}" stroke-width="${.4+n%3*.3}" opacity="${.035+n%4*.018}"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 124 98" data-world-icon="${id}" aria-hidden="true" focusable="false"><defs><clipPath id="${clip}"><path d="M7 30Q7 10 39 7L86 8Q117 9 118 33L116 74Q113 92 86 92L32 91Q5 91 6 70Z"/></clipPath><filter id="${grain}" x="-5%" y="-5%" width="110%" height="110%" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency=".62" numOctaves="3" seed="12" result="noise"/><feColorMatrix in="noise" type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 1.1 0 0 0 .1" result="pigment"/><feComposite in="SourceGraphic" in2="pigment" operator="in" result="pencil"/><feDisplacementMap in="pencil" in2="noise" scale=".5"/></filter></defs><g clip-path="url(#${clip})" stroke="${icon.color}" fill="none"><path d="M0 0h124v98H0Z" fill="${icon.color}" fill-opacity=".055" stroke="none"/>${pencil}</g><g filter="url(#${grain})"><g data-icon-art="${id}" fill="none" stroke="none" stroke-linecap="round" stroke-linejoin="round">${icon.art}</g></g></svg>`;
}
