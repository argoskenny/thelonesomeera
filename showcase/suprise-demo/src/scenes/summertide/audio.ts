/** Layered surf and wind. Created only after an explicit sound-button gesture. */
export class SummerAudio{
  private ctx:AudioContext|null=null;private master:GainNode|null=null;private enabled=false;
  async toggle(){
    if(!this.ctx){const ctx=this.ctx=new AudioContext(),master=this.master=ctx.createGain();master.gain.value=0;master.connect(ctx.destination);
      for(let layer=0;layer<3;layer++){
        const buffer=ctx.createBuffer(1,ctx.sampleRate*12,ctx.sampleRate),data=buffer.getChannelData(0);let last=0;
        for(let i=0;i<data.length;i++){last=(last+(Math.random()*2-1)*.05)/1.05;data[i]=last*2;}
        const source=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),gain=ctx.createGain(),lfo=ctx.createOscillator(),depth=ctx.createGain();source.buffer=buffer;source.loop=true;source.playbackRate.value=.85+layer*.16;filter.type='lowpass';filter.frequency.value=[580,1700,3200][layer];gain.gain.value=.12;lfo.frequency.value=.12+layer*.025;depth.gain.value=.09;lfo.connect(depth);depth.connect(gain.gain);source.connect(filter);filter.connect(gain);gain.connect(master);source.start();lfo.start();
      }
    }
    await this.ctx.resume();this.enabled=!this.enabled;this.apply();return this.enabled;
  }
  setPageVisible(){this.apply();}
  private apply(){if(this.ctx&&this.master)this.master.gain.setTargetAtTime(this.enabled&&!document.hidden?.85:0,this.ctx.currentTime,.4);}
}
