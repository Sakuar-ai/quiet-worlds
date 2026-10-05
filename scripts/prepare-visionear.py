"""Source-preserving long-bed edit. No EQ, denoise, normalization or compressor."""
import argparse, hashlib, json
from pathlib import Path
import numpy as np
import soundfile as sf

parser=argparse.ArgumentParser()
parser.add_argument('source',type=Path)
args=parser.parse_args()
root=Path(__file__).resolve().parents[1]
source_hash=hashlib.sha256(args.source.read_bytes()).hexdigest()
assert source_hash=='3cd3ff55829222efc4d15096309afa1ea4412ad5c9fa518909bc1b3ca8af4c59', 'Wrong approved source'
rows=[]
with sf.SoundFile(args.source) as f:
    rate=f.samplerate; duration=len(f)/rate
    for second in range(int(np.ceil(duration))):
        block=f.read(rate,dtype='float32',always_2d=True)
        envelope=np.max(np.abs(block),axis=1); peak_at=int(np.argmax(envelope))
        rows.append(dict(second=second,peakAt=second+peak_at/rate,
            peakDB=float(20*np.log10(max(float(envelope[peak_at]),1e-12)))))
scan=dict(sha256=source_hash,duration=duration,seconds=rows)
start,end,fade=20.,516.,6.
with sf.SoundFile(args.source) as f:
    rate=f.samplerate; f.seek(round(start*rate))
    original=f.read(round((end-start)*rate),dtype='float32',always_2d=True)
bed=original.copy()
edits=[]
# Explicit, inspectable clip-gain edits at eleven measured isolated outliers.
# Not a running compressor: unaffected samples remain bit-identical.
for row in scan['seconds']:
    if not(start<=row['second']<end and row['peakDB']>-8): continue
    t=row['peakAt']; center=round((t-start)*rate)
    a,b,c,d=[center+round(s*rate) for s in [-.065,-.012,.04,.24]]
    peak=float(np.max(np.abs(original[b:c])))
    gain=min(1.,10**(-12/20)/peak)
    env=np.ones(d-a,dtype=np.float32)
    smooth=lambda count:.5-.5*np.cos(np.linspace(0,np.pi,count))
    env[:b-a]=1-(1-gain)*smooth(b-a)
    env[b-a:c-a]=gain
    env[c-a:]=gain+(1-gain)*smooth(d-c)
    bed[a:d]*=env[:,None]
    edits.append(dict(sourcePeakSeconds=t,sourceWindowSeconds=[start+a/rate,start+d/rate],
        originalPeakDB=row['peakDB'],gainDB=float(20*np.log10(gain)),
        reason='Isolated measured peak above -8 dBFS; physical sound identity unconfirmed'))
# Encode one loop-ready buffer. Initial playback starts at source 20 s.
# Only its final six seconds contain an edit crossfade to the first six seconds.
# On repeat jump to buffer 6 s (source 26 s), NOT the beginning of the blend.
n=round(fade*rate); w=(.5-.5*np.cos(np.linspace(0,np.pi,n))).astype(np.float32)
bed[-n:]=bed[-n:]*(1-w[:,None])+bed[:n]*w[:,None]
out=root/'dist/audio/fireplace-visionear-v1.flac'
sf.write(out,bed,rate,subtype='PCM_24')
manifest=dict(version='visionear-1-preview',reviewStatus='LISTENING_APPROVAL_REQUIRED',
    url='./audio/fireplace-visionear-v1.flac',author='visionear',license='CC0-1.0',
    sourceURL='https://freesound.org/people/visionear/sounds/501417/',sourceSHA256=scan['sha256'],
    sourceDurationSeconds=scan['duration'],sourceStartSeconds=start,sourceEndSeconds=end,
    sampleRate=rate,channels=2,durationSeconds=len(bed)/rate,loopStartSeconds=fade,
    loopEndSeconds=len(bed)/rate,crossfadeSeconds=fade,initialFadeSeconds=.35,
    deliveryGainDB=0,processing=['local cosine clip-gain edits','six-second end/head cosine edit crossfade'],
    localEdits=edits,events=[],subjectiveReview='Pending; signal scan does not identify scraping/tools or certify absence of noise.',
    excluded=[dict(start=0,end=20,reason='User-identified scraping at approximately 13–14 seconds and safety tail'),
              dict(start=end,end=scan['duration'],reason='Long enough section selected; closer spectral match at 516 s; later loud peaks omitted')],
    outputSHA256=hashlib.sha256(out.read_bytes()).hexdigest())
(out.with_suffix('.json')).write_text(json.dumps(manifest,indent=2)+'\n')
print(json.dumps(dict(duration=manifest['durationSeconds'],loopPeriod=manifest['loopEndSeconds']-fade,
    edits=len(edits),peakDB=float(20*np.log10(np.max(np.abs(bed)))),bytes=out.stat().st_size),indent=2))
