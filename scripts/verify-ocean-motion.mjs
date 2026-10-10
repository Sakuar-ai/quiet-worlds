import assert from 'node:assert/strict';
import {OceanMotion,oceanFieldPoint,oceanParameters} from '../dist/ocean.js';
const motion=new OceanMotion();motion.update(36000,0);
let last=motion.parameters,phase=[...motion.phase];
for(let n=1;n<=600;n++){
  const target=n<300?1:0,p=motion.update(36000+n/60,target);
  assert.ok(Math.abs(p.intensity-last.intensity)<.027,'dragging cannot snap intensity');
  for(let k=0;k<3;k++)assert.ok(motion.phase[k]>=phase[k]&&motion.phase[k]-phase[k]<.007,'phase stays continuous, even after ten hours running');
  last=p;phase=[...motion.phase];
}
const saved=[...motion.phase];motion.update(40000,1);
for(let k=0;k<3;k++)assert.ok(motion.phase[k]-saved[k]<.019,'resume after hidden tab does not leap');
const settle=fps=>{const m=new OceanMotion();m.update(0,0);for(let n=1;n<=fps*4;n++)m.update(n/fps,1);return m;};
for(const fps of [30,120]){
  const a=settle(fps),b=settle(60);assert.ok(Math.abs(a.intensity-b.intensity)<1e-10,'frame-rate independent exponential interpolation');
  for(let k=0;k<3;k++)assert.ok(Math.abs(a.phase[k]-b.phase[k])<.003,'phase integration consistent at 30/60/120Hz');
}
// Track the SAME crest in water coordinates, not a band's screen transform.
const p=oceanParameters(.5),w=358,h=600;
for(let layer=0;layer<3;layer++){
  const phase=0,probe=oceanFieldPoint(p,phase,layer,0,w,h),shift=probe.wavelength*.22;
  let differing=0;
  for(let x=0;x<w;x+=3){
    const a=oceanFieldPoint(p,phase,layer,x,w,h);
    const b=oceanFieldPoint(p,Math.PI*2*.22,layer,x+shift,w,h);
    assert.ok(Math.abs(a.angle-b.angle)<1e-12,'crest phase travels horizontally with the swell');
    if(Math.abs(a.y-oceanFieldPoint(p,phase,layer,x+w*.18,w,h).y)>2)differing++;
  }
  assert.ok(differing>30,'neighboring regions do not rise and fall together');
  assert.ok(probe.wavelength>oceanFieldPoint(oceanParameters(1),0,layer,0,w,h).wavelength,'stronger water has shorter wavelength');
}
assert.notEqual(oceanFieldPoint(p,0,0,0,w,h).wavelength,oceanFieldPoint(p,0,1,0,w,h).wavelength);
console.log('PASS Ocean motion: spatially phase-offset travelling crests, three rhythms, eased field changes, refresh-rate independence, no background-tab leap.');
