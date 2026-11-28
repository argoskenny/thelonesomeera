// Two bands of filtered noise give the stream a low rush and a close, airy hiss.
export class GorgeAmbience {
  private context?: AudioContext;
  private water?: GainNode;
  private transformer?: GainNode;

  async toggle(){
    if(!this.context){
      const ctx=this.context=new AudioContext();
      const samples=ctx.createBuffer(2,ctx.sampleRate*6,ctx.sampleRate);
      for(let channel=0;channel<2;channel++){
        const data=samples.getChannelData(channel);
        let last=0;
        for(let i=0;i<data.length;i++){
          const noise=Math.random()*2-1;
          last=.972*last+.028*noise;
          data[i]=.27*noise+3.4*last;
        }
      }
      const source=ctx.createBufferSource();
      source.buffer=samples;source.loop=true;
      const air=ctx.createBiquadFilter();air.type='lowpass';air.frequency.value=3200;
      this.water=ctx.createGain();this.water.gain.value=.12;
      source.connect(air).connect(this.water).connect(ctx.destination);source.start();
      const hum=ctx.createOscillator();hum.type='triangle';hum.frequency.value=100;
      this.transformer=ctx.createGain();this.transformer.gain.value=.003;
      hum.connect(this.transformer).connect(ctx.destination);hum.start();
      await ctx.resume();return true;
    }
    if(this.context.state==='running'){await this.context.suspend();return false;}
    await this.context.resume();return true;
  }
  update(y:number,z:number){
    if(this.context?.state!=='running')return;
    const t=this.context.currentTime;
    this.water?.gain.setTargetAtTime(.04+.23*Math.exp(-Math.hypot(y,z+36)/39),t,.5);
    this.transformer?.gain.setTargetAtTime(.008*Math.exp(-Math.hypot(y-19,z-8)/10),t,.5);
  }
}
