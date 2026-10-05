"""Signal fidelity/loop checks. Perceived low/medium roles still need listening."""
import json,sys,hashlib
from pathlib import Path
import numpy as np
import soundfile as sf
from scipy import signal

root=Path(__file__).resolve().parents[1]
out=Path(sys.argv[1] if len(sys.argv)>1 else 'test-results/fire-regions')
m=json.loads((root/'dist/audio/fireplace-visionear-regions-v2.json').read_text())
bed_path=root/'dist/audio/fireplace-visionear-v1.flac'
bed,rate=sf.read(bed_path,dtype='float32',always_2d=True) if bed_path.exists() else (None,48000)
reports=[]
for region in m['regions']:
    x,sr=sf.read(root/'dist'/region['url'].removeprefix('./'),dtype='float32',always_2d=True)
    assert rate==sr==48000
    a=round((region['sourceStartSeconds']-20)*rate);n=len(x);fade=4*rate
    assert hashlib.sha256(x[:-fade].astype('<f4').tobytes()).hexdigest()==region['approvedInteriorFloat32LE_SHA256'],'matches approved source interior fingerprint'
    if bed is not None:assert np.array_equal(x[:-fade],bed[a:a+n-fade]),'no new EQ or gain matching'
    assert np.array_equal(x[-1],x[fade-1]),'end/head transition joins at its exact natural next sample'
    file='low-60s.wav' if region['id']=='low' else 'medium-default-60s.wav'
    rendered,rs=sf.read(out/file,dtype='float32',always_2d=True)
    assert rs==rate and len(rendered)==60*rate
    indices=np.arange(len(rendered))+round(region['cueOffsetSeconds']*rate)
    past=indices>=len(x)
    indices[past]=fade+(indices[past]-len(x))%(len(x)-fade)
    expected=x[indices];error=rendered[3*rate:]-expected[3*rate:]
    relative=float(np.mean(error**2)/np.mean(expected[3*rate:]**2))
    assert relative<1e-8,'actual production output follows only the selected region, at unity gain'
    f,p=signal.welch(x,rate,nperseg=8192,axis=0);p=p.mean(axis=1)
    reports.append(dict(id=region['id'],sourceWindow=[region['sourceStartSeconds'],region['sourceEndSeconds']],
        sourceCue=region['sourceStartSeconds']+region['cueOffsetSeconds'],durationSeconds=len(x)/rate,
        loopPeriodSeconds=(len(x)-fade)/rate,unalteredInterior=True,relativeRenderError=relative,
        bandsDB={f'{lo}-{hi}':float(10*np.log10(p[(f>=lo)&(f<hi)].sum()*(f[1]-f[0]))) for lo,hi in [(100,250),(250,500),(500,1000),(1000,3000),(3000,8000)]}))
assert reports[1]['sourceCue']==60
(out/'region-fidelity-report.json').write_text(json.dumps(dict(regions=reports,
    note='Spectral measurements are descriptive, not a subjective fire-intensity classifier.'),indent=2)+'\n')
print(json.dumps(reports,indent=2))
