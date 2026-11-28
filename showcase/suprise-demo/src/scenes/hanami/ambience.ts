export class RiverAmbience {
  private ctx?: AudioContext;
  private master?: GainNode;
  private enabled = false;
  private chirpTimer = 0;

  async toggle() {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0;
      this.master.connect(this.ctx.destination);
      const audio = this.ctx;
      const noise = audio.createBuffer(1, audio.sampleRate * 5, audio.sampleRate);
      const samples = noise.getChannelData(0);
      let last = 0;
      for (let i=0; i<samples.length; i++) {
        last = (last + (Math.random()*2-1)*.05)/1.05;
        samples[i] = last*1.6 + (Math.random()-.5)*.035;
      }
      const flow = audio.createBufferSource();
      flow.buffer = noise;
      flow.loop = true;
      const filter = audio.createBiquadFilter();
      filter.type = 'lowpass'; filter.frequency.value = 3300;
      const pan = audio.createStereoPanner(); pan.pan.value = -.46;
      flow.connect(filter).connect(pan).connect(this.master);
      flow.start();
    }
    await this.ctx.resume();
    this.enabled = !this.enabled;
    this.update();
    return this.enabled;
  }

  update() {
    clearTimeout(this.chirpTimer);
    if (!this.ctx || !this.master) return;
    const audible = this.enabled && !document.hidden;
    this.master.gain.setTargetAtTime(audible ? .54 : 0,this.ctx.currentTime,.28);
    if (audible) this.chirpTimer = window.setTimeout(()=>this.birds(), 2000+Math.random()*2800);
  }

  private birds() {
    const audio = this.ctx!;
    const now = audio.currentTime + .1;
    const pitch = 2100 + Math.random()*1150;
    for (let note=0; note<3; note++) {
      const start = now+note*.19;
      const voice = audio.createOscillator();
      const envelope = audio.createGain();
      voice.frequency.setValueAtTime(pitch*(note===1?1.22:1),start);
      voice.frequency.exponentialRampToValueAtTime(pitch*1.38,start+.065);
      voice.frequency.exponentialRampToValueAtTime(pitch*.91,start+.12);
      envelope.gain.setValueAtTime(.0001,start);
      envelope.gain.exponentialRampToValueAtTime(.027,start+.035);
      envelope.gain.exponentialRampToValueAtTime(.0001,start+.13);
      voice.connect(envelope).connect(this.master!);
      voice.start(start); voice.stop(start+.14);
      voice.onended = ()=>{voice.disconnect();envelope.disconnect();};
    }
    this.chirpTimer=window.setTimeout(()=>this.birds(),5800+Math.random()*5900);
  }
}
