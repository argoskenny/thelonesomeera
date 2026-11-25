/** Quiet wind and distant tuned bells, activated only by the sound button. */
export class AerieAudio{
  private ctx:AudioContext|null=null;private master:GainNode|null=null;private enabled=false;
  async toggle(){
    if(!this.ctx){const ctx=this.ctx=new AudioContext(),master=this.master=ctx.createGain();master.gain.value=0;master.connect(ctx.destination);
      const buffer=ctx.createBuffer(1,ctx.sampleRate*10,ctx.sampleRate),data=buffer.getChannelData(0);let last=0;
      for(let i=0;i<data.length;i++){last=(last+.035*(Math.random()*2-1))/1.035;data[i]=last*2;}
      const wind=ctx.createBufferSource();wind.buffer=buffer;wind.loop=true;const filter=ctx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=650;wind.connect(filter);filter.connect(master);wind.start();
      for(const [i,f]of[261.63,392,523.25].entries()){const tone=ctx.createOscillator(),gain=ctx.createGain(),lfo=ctx.createOscillator(),lfoGain=ctx.createGain();tone.frequency.value=f;gain.gain.value=.004;lfo.frequency.value=.045+i*.017;lfoGain.gain.value=.003;lfo.connect(lfoGain);lfoGain.connect(gain.gain);tone.connect(gain);gain.connect(master);tone.start();lfo.start();}
    }
    await this.ctx.resume();this.enabled=!this.enabled;this.apply();return this.enabled;
  }
  setPageVisible(){this.apply();}
  private apply(){if(this.ctx&&this.master)this.master.gain.setTargetAtTime(this.enabled&&!document.hidden?.6:0,this.ctx.currentTime,.7);}
}
