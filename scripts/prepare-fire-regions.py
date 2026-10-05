"""Prepare independent stable-region candidates from the approved natural bed.

The user identifies original ~60 s as the medium-fire sonic reference.
The user identifies original ~460 s as the low-fire sonic reference.
No EQ, normalization, added crackles, gain matching or stitched linear sequence.
"""
import json,hashlib
from pathlib import Path
import numpy as np
import soundfile as sf

root=Path(__file__).resolve().parents[1]
audio=root/'dist/audio'
prior=json.loads((audio/'fireplace-visionear-v1.json').read_text())
source=audio/'fireplace-visionear-v1.flac'
assert hashlib.sha256(source.read_bytes()).hexdigest()==prior['outputSHA256']
definitions=[('low',460,500,0),('medium',40,120,20)]
regions=[]
for name,start,end,cue in definitions:
    with sf.SoundFile(source) as f:
        rate=f.samplerate;f.seek(round((start-20)*rate))
        bed=f.read(round((end-start)*rate),dtype='float32',always_2d=True)
    # This source portion is before the old long-bed crossfade at 510 s.
    assert end<=510
    n=round(4*rate)
    interior_sha=hashlib.sha256(bed[:-n].astype('<f4').tobytes()).hexdigest()
    blend=(.5-.5*np.cos(np.linspace(0,np.pi,n))).astype(np.float32)
    bed[-n:]=bed[-n:]*(1-blend[:,None])+bed[:n]*blend[:,None]
    version=2 if name=='low' else 1
    path=audio/f'fireplace-visionear-{name}-v{version}.flac'
    sf.write(path,bed,rate,subtype='PCM_24')
    regions.append(dict(id=name,url='./audio/'+path.name,sourceStartSeconds=start,sourceEndSeconds=end,
        durationSeconds=end-start,loopStartSeconds=4,loopEndSeconds=end-start,cueOffsetSeconds=cue,
        loopCrossfadeSeconds=4,gain=1,sha256=hashlib.sha256(path.read_bytes()).hexdigest(),
        approvedInteriorFloat32LE_SHA256=interior_sha,
        selectionBasis='User identified original ~60 s as preferred medium' if name=='medium' else
            'User identified original 7:40 as low-fire reference; bounded to 7:40–8:20, new loop pending listening'))
manifest=dict(version='visionear-regions-2-preview',reviewStatus='REGION_LISTENING_APPROVAL_REQUIRED',
    originalSourceSHA256=prior['sourceSHA256'],approvedBedSHA256=prior['outputSHA256'],
    sourceSonicApproval=True,sourceURL=prior['sourceURL'],author='visionear',license='CC0-1.0',
    transitionSeconds=4,initialFadeSeconds=.35,regionBoundary=.30,hysteresis=.02,
    highRegionAvailable=False,highRangeBehavior='Use medium; no verified clean stronger region',
    regions=regions,deliveryGainDB=0,events=[],
    pending='Confirm narrowed low-region loop by ear; do not claim the reported sizzling is removed; medium unchanged')
(audio/'fireplace-visionear-regions-v2.json').write_text(json.dumps(manifest,indent=2)+'\n')
print(json.dumps(manifest,indent=2))
