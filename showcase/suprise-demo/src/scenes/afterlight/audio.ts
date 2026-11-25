/** Lightweight procedural coastal soundscape, started only by a user gesture. */
export class Soundscape {
  private ctx:AudioContext|null=null;
  private master:GainNode|null=null;
  private active=false;
  async toggle(){
    if(!this.ctx){
      const ctx=new AudioContext();this.ctx=ctx;
      this.master=ctx.createGain();this.master.gain.value=0;this.master.connect(ctx.destination);
      const buffer=ctx.createBuffer(2,ctx.sampleRate*12,ctx.sampleRate);
      for(let c=0;c<2;c++){
        const data=buffer.getChannelData(c);let last=0;
        for(let i=0;i<data.length;i++){const white=Math.random()*2-1;last=(last+.025*white)/1.025;data[i]=last*3.5;}
      }
      const source=ctx.createBufferSource();source.buffer=buffer;source.loop=true;
      const filter=ctx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=900;
      const waves=ctx.createGain();waves.gain.value=.35;
      const lfo=ctx.createOscillator();lfo.frequency.value=.095;
      const lfoGain=ctx.createGain();lfoGain.gain.value=.16;
      lfo.connect(lfoGain);lfoGain.connect(waves.gain);
      source.connect(filter);filter.connect(waves);waves.connect(this.master);
      source.start();lfo.start();
      // A barely audible low, airy harmonic under the surf.
      for(const f of[110,164.81,220.12]){
        const osc=ctx.createOscillator();osc.type='sine';osc.frequency.value=f;
        const g=ctx.createGain();g.gain.value=.004;osc.connect(g);g.connect(this.master);osc.start();
      }
    }
    await this.ctx.resume();this.active=!this.active;
    this.master!.gain.setTargetAtTime(this.active?.52:0,this.ctx.currentTime,.65);
    return this.active;
  }
}
