import { OCEAN_ICON } from './ocean.js?v=ocean-20';
// One family per world, two intentional levels: descriptive picker / simple header.
// Keep both variants here with the same palette and gentle pencil line quality.
const pine = (x,y,scale) => `<g transform="translate(${x} ${y}) scale(${scale})"><path d="M0 57 1 7" stroke="#967c62" stroke-width="2.8"/><path d="M1 0C-1 9-5 17-10 23l7-3-12 15 10-4-13 16 12-4-10 11c7-1 12-5 17-9 5 5 10 8 16 9L8 42l9 4L7 30l8 4L5 18l6 4Z" fill="#96aa91" stroke="#607e68" stroke-width="1.4"/><path d="M1 7 0 45M-1 20l-5 5m8-7 5 9M-1 31l-7 7m10-7 7 8M-2 42l-8 6m12-6 7 6" stroke="#617e66" stroke-width="1.25"/><path d="m-4 22 3-4m5 14 4 6m-13 6-4 4" stroke="#fff" stroke-opacity=".65" stroke-width="1.3"/></g>`;

export const WORLD_ICONS = Object.freeze({
  rain: Object.freeze({color:'#6998b8',header:`
    <path d="M10 24c-7 0-8-9-2-11 2-1 4 0 5 1-1-6 3-10 8-9 5 0 8 4 8 9 6-2 10 3 8 7-1 3-5 4-9 3Z" fill="#d0e0ea" stroke="#628cac"/>
    <path d="m13 29-2 5m10-6-2 5m10-5-2 5" stroke="#6898b8"/>
  `,art:`
    <path d="M37 52C24 52 23 35 34 32c4-1 6 0 8 1-2-12 8-23 19-22 11 0 19 8 19 19 7-4 18 1 19 10 2 10-7 14-19 14Z" fill="#abc9dd" stroke="#628cac" stroke-width="2.1"/>
    <path d="M29 45c-2-6 1-10 5-11m12-8c2-7 9-12 16-11m18 19c8-3 15 3 15 9M36 50l42 1" stroke="#eaf2f6" stroke-width="1.7"/>
    <path d="m44 63-4 10m19-11-4 11m21-12-4 12m22-15-3 8m-57 10-3 9m24-7-3 10m28-14-3 10" stroke="#6898b8" stroke-width="2.35"/>
  `}),
  fireplace: Object.freeze({color:'#bb7d60',header:`
    <path d="M20 4c5 5 7 11 6 15l4-5c4 7 6 13 1 18-6 6-16 4-20-2-4-6-1-11 3-16l1 7c4-5 6-11 5-17Z" fill="#dfa082" stroke="#bd7659"/>
    <path d="M18 33c-4-3-3-6-1-9l2 4 5-10c3 6 5 12 0 15" fill="#f8deb1" stroke="none"/>
  `,art:`
    <path d="M44 65C33 54 40 42 45 32l3 10c6-11 12-23 13-32 8 8 12 22 10 32l6-12c10 14 17 29 5 39-9 7-28 5-38-4Z" fill="#e3a083" stroke="#bd7659" stroke-width="1.9"/>
    <path d="M49 65c-6-9 1-18 7-26l1 13c6-7 8-14 8-21 8 13 13 20 11 29l-5 8Z" fill="#f2c286" stroke="#d89962" stroke-width="1.15"/>
    <path d="M57 68c-6-5-2-10 2-15l1 8 6-10c4 8 6 14-1 17" fill="#fff6dc" stroke="none"/>
    <path d="m38 72 49 12 4-9-50-12Z" fill="#a08368" stroke="#795d48" stroke-width="1.8"/>
    <path d="m41 84 48-18 3 9-48 18Z" fill="#a48365" stroke="#795d48" stroke-width="1.9"/>
    <ellipse cx="43" cy="88" rx="4" ry="5.5" transform="rotate(-18 43 88)" fill="#d3ae88" stroke="#795d48" stroke-width="1.6"/>
    <path d="m45 69 33 8m-29 8 32-12m-28 14 26-10" stroke="#e4c5a2" stroke-width="1.25"/>
    <path d="m26 48 1-5 1 5-1 4Zm71-16 1-5 1 5-1 4Z" stroke="#d4a56c" stroke-width="1"/>
  `}),
  forest: Object.freeze({color:'#829b82',header:`
    <path d="M9 29C2 16 14 6 32 5c1 14-4 27-18 27Z" fill="#b7c8b2" stroke="#607e68"/>
    <path d="M6 35c7-9 13-17 22-25m-12 14 8-1m-8 1-1-7" stroke="#607e68"/>
  `,art:`${pine(36,37,.78)}${pine(63,10,1.24)}${pine(91,34,.88)}`}),
  ocean: OCEAN_ICON,
  snow: Object.freeze({color:'#a09ac3',header:`
    <path d="m20 5-.2 30M7 12l26 16M33 12 7 28" stroke="#8882b0"/>
    <path d="m16 8 4 4 4-4m-8 24 4-4 4 4M8 18l6-2-1-6m14 20-1-6 6-2M8 22l6 2-1 6m14-20-1 6 6 2" stroke="#8882b0" stroke-width="1.3"/>
  `,art:`
    <g stroke="#8882b0" stroke-width="2.9">
      <path d="m63 17-1 68M33 34l58 35M92 34 32 69"/>
      <path d="m54 25 9 9 9-10m-19 52 9-9 9 10M35 45l12-3-1-12m33 41-1-13 12-3m-56 3 13 3-2 13m33-41 1 12 12 3" stroke-width="2.1"/>
    </g>
    <g fill="#c2bcdb" stroke="#a39cc4" stroke-width=".7"><path d="m24 27 2-2 2 2-2 2Zm73 49 2-2 2 2-2 2ZM41 15l2-2 2 2-2 2Z"/><circle cx="24" cy="77" r="1.5"/><circle cx="99" cy="20" r="1.4"/></g>
  `}),
  // Reserved mark only: Cat is not a playable world or picker entry yet.
  cat: Object.freeze({color:'#777c7e',art:null,header:`
    <path d="M8 15 9 6q5 0 8 5l7-.2q4-5 8-5l1 10c5 9 2 19-12 20C7 36 2 26 8 15Z" fill="#fbfbfc" stroke="#6b7376"/>
    <path d="m9 8 1 9c-4 6-2 11 3 12 5 0 6-7 6-12l-3-5-6-4Z" fill="#676f72" stroke="none"/>
    <path d="m26 12 5-4 1 9Z" fill="#676f72" stroke="none"/>
    <circle cx="14" cy="22" r="1.25" fill="#edf0ed" stroke="none"/><circle cx="26" cy="22" r="1.25" fill="#62696c" stroke="none"/>
    <path d="m18 27 2 2 2-2m-2 2v2" stroke="#777c7e" stroke-width="1.2"/>
  `})
});

let iconSerial=0;
export function worldIcon(id, variant='picker') {
  const icon=WORLD_ICONS[id];
  if(!icon)throw new Error(`No world icon registered for ${id}`);
  // Unique paint-server IDs allow the SAME drawing in several places at once.
  const prefix=`world-icon-${id}-${++iconSerial}`,clip=`${prefix}-paper`,grain=`${prefix}-grain`;
  if(variant==='header')return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" data-world-icon="${id}" data-icon-variant="header" data-family-color="${icon.color}" aria-hidden="true" focusable="false"><defs><filter id="${grain}" x="-10%" y="-10%" width="120%" height="120%" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency=".8" numOctaves="2" seed="12" result="noise"/><feColorMatrix in="noise" type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 .35 0 0 0 .7" result="pigment"/><feComposite in="SourceGraphic" in2="pigment" operator="in" result="pencil"/><feDisplacementMap in="pencil" in2="noise" scale=".25"/></filter></defs><g filter="url(#${grain})" data-icon-art="${id}" fill="none" stroke="none" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round">${icon.header}</g></svg>`;
  if(variant!=='picker'||!icon.art)throw new Error(`No ${variant} artwork registered for ${id}`);
  let pencil='';
  for(let n=0;n<125;n++){
    const x=6+(n*47.731)%110,y=8+(n*23.719)%82;
    pencil+=`<path d="M${x.toFixed(1)} ${y.toFixed(1)}l${3+n%6} -${4+n%7}" stroke-width="${.4+n%3*.3}" opacity="${.035+n%4*.018}"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 124 98" data-world-icon="${id}" data-icon-variant="picker" data-family-color="${icon.color}" aria-hidden="true" focusable="false"><defs><clipPath id="${clip}"><path d="M7 30Q7 10 39 7L86 8Q117 9 118 33L116 74Q113 92 86 92L32 91Q5 91 6 70Z"/></clipPath><filter id="${grain}" x="-5%" y="-5%" width="110%" height="110%" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency=".62" numOctaves="3" seed="12" result="noise"/><feColorMatrix in="noise" type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 1.1 0 0 0 .1" result="pigment"/><feComposite in="SourceGraphic" in2="pigment" operator="in" result="pencil"/><feDisplacementMap in="pencil" in2="noise" scale=".5"/></filter></defs><g clip-path="url(#${clip})" stroke="${icon.color}" fill="none"><path d="M0 0h124v98H0Z" fill="${icon.color}" fill-opacity=".055" stroke="none"/>${pencil}</g><g filter="url(#${grain})"><g data-icon-art="${id}" fill="none" stroke="none" stroke-linecap="round" stroke-linejoin="round">${icon.art}</g></g></svg>`;
}
