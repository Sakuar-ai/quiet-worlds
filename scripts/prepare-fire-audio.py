"""Reproducible, restrained preparation of the user-approved kingsrow source.
Usage: python prepare-fire-audio.py source.wav [dist/audio]
Requires numpy, scipy and soundfile. Never modifies the supplied source.
"""
import sys, json, hashlib
from pathlib import Path
import numpy as np
import soundfile as sf
from scipy import signal

source=Path(sys.argv[1]); destination=Path(sys.argv[2] if len(sys.argv)>2 else 'dist/audio')
destination.mkdir(parents=True,exist_ok=True)
x,sr=sf.read(source,always_2d=True)
assert sr==44100 and x.shape[1]==2 and 34<len(x)/sr<35
t=np.arange(len(x))/sr
def window(a,b,c,d):
    u=np.clip((t-a)/(b-a),0,1); v=np.clip((d-t)/(d-c),0,1)
    return (u*u*(3-2*u)*v*v*(3-2*v))[:,None]
def db(a): return float(20*np.log10(max(float(a),1e-12)))
def measure(a):
    low=signal.sosfilt(signal.butter(2,150,fs=sr,output='sos'),a,axis=0)
    return dict(peakDBFS=db(np.max(np.abs(a))),rmsDBFS=db(np.sqrt(np.mean(a*a))),low150RMSDBFS=db(np.sqrt(np.mean(low*low))))

# One gentle rumble filter, no spectral denoiser, gate, compressor or RMS matching.
y=signal.sosfilt(signal.butter(2,100,'highpass',fs=sr,output='sos'),x,axis=0)
local=signal.sosfilt(signal.butter(2,320,'highpass',fs=sr,output='sos'),y,axis=0)
w=window(28.55,29.0,32.4,33.05)
y=y*(1-w)+local*w
y*=1-.40*w
# Hand-drawn gain envelope over the exceptional pop and its immediate aftershock.
y*=1-.84*window(5.70,5.78,6.08,6.22)
# Only a handful of remaining isolated peaks receive slow-sided clip gain edits.
# No sample waveshaping or real-time pumping; most samples remain untouched.
peaks,_=signal.find_peaks(np.max(np.abs(y),axis=1),height=.105,distance=int(.15*sr))
edits=[]; envelope=np.ones((len(y),1))
for n in peaks:
    at=float(n/sr); gain=.105/float(np.max(np.abs(y[n])))
    envelope=np.minimum(envelope,1-(1-gain)*window(at-.018,at-.003,at+.008,at+.10))
    edits.append(dict(time=at,gainDB=db(gain)))
y*=envelope
# A single fixed +8 dB delivery gain for the whole recording, not normalization.
delivery_gain=10**(8/20)
clean=y*delivery_gain
assert np.max(np.abs(clean))<.5
sf.write(destination/'fireplace-kingsrow-v1.flac',clean,sr,subtype='PCM_16')

# Original timeline positions; excluded 5.7–6.22s and the noisy 28.55s+ tail.
# No individual gain normalization. The pool retains genuine event differences.
events=[(.56,.26,'small'),(2.08,.24,'small'),(3.32,.29,'small'),(8.40,.25,'small'),
        (9.14,.29,'small'),(15.66,.27,'small'),(17.87,.25,'small'),(23.34,.26,'small'),
        (10.44,.28,'medium'),(11.61,.29,'medium'),(18.68,.28,'medium'),(26.77,.29,'medium')]
manifest=dict(source='181563__kingsrow__fire-crackling-01.wav',sourceSHA256=hashlib.sha256(source.read_bytes()).hexdigest(),
    url='./audio/fireplace-kingsrow-v1.flac',sampleRate=sr,channels=2,duration=len(x)/sr,
    crossfadeSeconds=2.4,deliveryGainDB=8,
    events=[dict(start=start,duration=duration,size=size) for start,duration,size in events],
    processing=dict(globalHighPassHz=100,localHighPassHz=320,localWindow=[28.55,29,32.4,33.05],localGainDB=db(.6),
       exceptionalPopWindow=[5.70,5.78,6.08,6.22],exceptionalPopGainDB=db(.16),isolatedPeakEdits=edits,
       denoise=False,RMSNormalization=False,compression=False),
    analysis=dict(source=measure(x),cleanBeforeDeliveryGain=measure(y),delivered=measure(clean),
      popBefore=measure(x[int(5.7*sr):int(6.22*sr)]),popAfter=measure(y[int(5.7*sr):int(6.22*sr)]),
      tailBefore=measure(x[29*sr:32*sr]),tailAfter=measure(y[29*sr:32*sr])))
(destination/'fireplace-kingsrow-v1.json').write_text(json.dumps(manifest,indent=2)+'\n')
print(json.dumps(manifest,indent=2))
