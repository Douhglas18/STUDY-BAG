// Web Audio API ambient sound generator and timer chimes
let audioCtx: AudioContext | null = null;
let activeSourceNode: AudioNode | null = null;
let activeGainNode: GainNode | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    audioCtx = new AudioCtx();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function playCompletionChime() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    
    // Play warm dual-tone bell (E5 & B5 harmonics)
    const freqs = [659.25, 987.77, 1318.51];
    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);
      
      gain.gain.setValueAtTime(0, now + idx * 0.08);
      gain.gain.linearRampToValueAtTime(0.18 / (idx + 1), now + idx * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 1.6);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 1.8);
    });
  } catch (e) {
    console.warn('Audio chime could not play:', e);
  }
}

export function stopAmbientSound() {
  if (activeGainNode && audioCtx) {
    try {
      activeGainNode.gain.linearRampToValueAtTime(0.0001, audioCtx.currentTime + 0.3);
      setTimeout(() => {
        if (activeSourceNode) {
          (activeSourceNode as any).stop?.();
          activeSourceNode.disconnect();
          activeSourceNode = null;
        }
        activeGainNode = null;
      }, 350);
    } catch (e) {
      // ignore
    }
  }
}

export function startAmbientSound(type: 'none' | 'whitenoise' | 'rain' | 'cafe' | 'binaural', volume = 0.3) {
  stopAmbientSound();
  if (type === 'none') return;

  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.0001, now);
    masterGain.gain.linearRampToValueAtTime(volume, now + 0.5);
    masterGain.connect(ctx.destination);
    activeGainNode = masterGain;

    if (type === 'binaural') {
      // 10Hz Alpha wave binaural beat: Left ear 432Hz, Right ear 442Hz
      const oscL = ctx.createOscillator();
      const oscR = ctx.createOscillator();
      const panL = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
      const panR = ctx.createStereoPanner ? ctx.createStereoPanner() : null;

      oscL.type = 'sine';
      oscL.frequency.setValueAtTime(432, now);
      oscR.type = 'sine';
      oscR.frequency.setValueAtTime(442, now);

      if (panL && panR) {
        panL.pan.setValueAtTime(-1, now);
        panR.pan.setValueAtTime(1, now);
        oscL.connect(panL);
        panL.connect(masterGain);
        oscR.connect(panR);
        panR.connect(masterGain);
      } else {
        oscL.connect(masterGain);
        oscR.connect(masterGain);
      }

      oscL.start();
      oscR.start();

      activeSourceNode = {
        stop: () => {
          oscL.stop();
          oscR.stop();
        },
        disconnect: () => {
          oscL.disconnect();
          oscR.disconnect();
        }
      } as any;
      return;
    }

    // Generate 5-second loopable noise buffer
    const bufferSize = ctx.sampleRate * 4;
    const buffer = ctx.createBuffer(2, bufferSize, ctx.sampleRate);
    const dataL = buffer.getChannelData(0);
    const dataR = buffer.getChannelData(1);

    let lastOutL = 0.0;
    let lastOutR = 0.0;

    for (let i = 0; i < bufferSize; i++) {
      const whiteL = Math.random() * 2 - 1;
      const whiteR = Math.random() * 2 - 1;

      if (type === 'rain') {
        // Brown noise + filtered droplet resonance
        lastOutL = (lastOutL + 0.02 * whiteL) / 1.02;
        lastOutR = (lastOutR + 0.02 * whiteR) / 1.02;
        dataL[i] = lastOutL * 3.5;
        dataR[i] = lastOutR * 3.5;
      } else if (type === 'cafe') {
        // Warm pinkish rumble
        lastOutL = (lastOutL + 0.06 * whiteL) / 1.05;
        lastOutR = (lastOutR + 0.06 * whiteR) / 1.05;
        dataL[i] = lastOutL * 2.2;
        dataR[i] = lastOutR * 2.2;
      } else {
        // White noise smoothed
        dataL[i] = whiteL * 0.6;
        dataR[i] = whiteR * 0.6;
      }
    }

    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = buffer;
    noiseSource.loop = true;

    // Filter shaping
    const filter = ctx.createBiquadFilter();
    if (type === 'rain') {
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1400, now);
    } else if (type === 'cafe') {
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(650, now);
      filter.Q.setValueAtTime(1.2, now);
    } else {
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(3200, now);
    }

    noiseSource.connect(filter);
    filter.connect(masterGain);
    noiseSource.start();
    activeSourceNode = noiseSource;
  } catch (e) {
    console.warn('Failed to start ambient sound:', e);
  }
}
