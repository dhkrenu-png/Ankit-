/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Web Audio Ambient Synthesizer
class SoundSynthesizer {
  private ctx: AudioContext | null = null;
  private activeNodes: Record<string, {
    sources: AudioNode[];
    gainNode: GainNode;
  }> = {};
  private globalVolume = 0.5;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setGlobalVolume(vol: number) {
    this.globalVolume = Math.max(0, Math.min(1, vol));
    // Update active gains
    Object.keys(this.activeNodes).forEach(id => {
      this.activeNodes[id].gainNode.gain.setValueAtTime(this.globalVolume * 0.3, this.ctx?.currentTime || 0);
    });
  }

  public startSound(id: string) {
    this.initContext();
    if (!this.ctx) return;

    // If already playing, stop first
    if (this.activeNodes[id]) {
      this.stopSound(id);
    }

    const gainNode = this.ctx.createGain();
    gainNode.gain.setValueAtTime(this.globalVolume * 0.3, this.ctx.currentTime);
    gainNode.connect(this.ctx.destination);

    const sources: AudioNode[] = [];

    if (id === 'rain') {
      // White noise for rain
      const bufferSize = 2 * this.ctx.sampleRate;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(800, this.ctx.currentTime);
      filter.Q.setValueAtTime(1, this.ctx.currentTime);

      whiteNoise.connect(filter);
      filter.connect(gainNode);

      whiteNoise.start();
      sources.push(whiteNoise, filter);

    } else if (id === 'hum') {
      // Cosmic Hum: 3 low frequency sine waves
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const osc3 = this.ctx.createOscillator();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(60, this.ctx.currentTime); // 60 Hz hum

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(60.5, this.ctx.currentTime); // Slight detune for phasing

      osc3.type = 'triangle';
      osc3.frequency.setValueAtTime(120, this.ctx.currentTime); // Harmonic weight

      const subGain = this.ctx.createGain();
      subGain.gain.setValueAtTime(0.15, this.ctx.currentTime);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(150, this.ctx.currentTime);

      osc1.connect(subGain);
      osc2.connect(subGain);
      osc3.connect(subGain);
      subGain.connect(filter);
      filter.connect(gainNode);

      osc1.start();
      osc2.start();
      osc3.start();

      sources.push(osc1, osc2, osc3, subGain, filter);

    } else if (id === 'forest') {
      // Soft breathing wind synthesis
      const bufferSize = 2 * this.ctx.sampleRate;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const windNoise = this.ctx.createBufferSource();
      windNoise.buffer = noiseBuffer;
      windNoise.loop = true;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(400, this.ctx.currentTime);
      filter.Q.setValueAtTime(2.0, this.ctx.currentTime);

      // Low frequency oscillator to modulate the wind speed (swells)
      const lfo = this.ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(0.15, this.ctx.currentTime); // Very slow breathing wind

      const lfoGain = this.ctx.createGain();
      lfoGain.gain.setValueAtTime(250, this.ctx.currentTime); // Modulate width in Hz

      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);

      windNoise.connect(filter);
      filter.connect(gainNode);

      lfo.start();
      windNoise.start();

      sources.push(windNoise, filter, lfo, lfoGain);

    } else if (id === 'frequency') {
      // Theta binary beat generator (calming focus frequency: 100Hz on left, 106Hz on right for 6Hz brainwave binary)
      const oscL = this.ctx.createOscillator();
      const oscR = this.ctx.createOscillator();

      oscL.type = 'sine';
      oscL.frequency.setValueAtTime(100, this.ctx.currentTime);

      oscR.type = 'sine';
      oscR.frequency.setValueAtTime(106, this.ctx.currentTime);

      const pannerL = this.ctx.createStereoPanner ? this.ctx.createStereoPanner() : null;
      const pannerR = this.ctx.createStereoPanner ? this.ctx.createStereoPanner() : null;

      if (pannerL && pannerR) {
        pannerL.pan.setValueAtTime(-1, this.ctx.currentTime);
        pannerR.pan.setValueAtTime(1, this.ctx.currentTime);

        oscL.connect(pannerL);
        oscR.connect(pannerR);

        pannerL.connect(gainNode);
        pannerR.connect(gainNode);

        sources.push(oscL, oscR, pannerL, pannerR);
      } else {
        oscL.connect(gainNode);
        oscR.connect(gainNode);
        sources.push(oscL, oscR);
      }

      oscL.start();
      oscR.start();
    }

    this.activeNodes[id] = {
      sources,
      gainNode
    };
  }

  public stopSound(id: string) {
    const active = this.activeNodes[id];
    if (active) {
      active.sources.forEach(src => {
        try {
          if (src instanceof OscillatorNode || src instanceof AudioBufferSourceNode) {
            src.stop();
          }
        } catch (e) {
          // already stopped
        }
      });
      try {
        active.gainNode.disconnect();
      } catch (e) {}
      delete this.activeNodes[id];
    }
  }

  public stopAll() {
    Object.keys(this.activeNodes).forEach(id => {
      this.stopSound(id);
    });
  }

  public isSoundPlaying(id: string): boolean {
    return !!this.activeNodes[id];
  }
}

export const ambientSynth = new SoundSynthesizer();
