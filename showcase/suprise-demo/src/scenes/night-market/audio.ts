/** An empty market: rain dripping off awnings, ventilation and a quiet electrical hum. */
export class NightAudio {
  private ctx:AudioContext|null=null;private master:GainNode|null=null;private active=false;
  async toggle(){
    if(!this.ctx){
      const c=new AudioContext();this.ctx=c;const master=c.createGain();master.gain.value=0;master.connect(c.destination);this.master=master;
      const buffer=c.createBuffer(2,c.sampleRate*10,c.sampleRate);
      for(let channel=0;channel<2;channel++){const d=buffer.getChannelData(channel);let v=0;for(let i=0;i<d.length;i++){v=(v+(Math.random()*2-1)*.024)/1.024;d[i]=v*2.2;}}
      const source=c.createBufferSource();source.buffer=buffer;source.loop=true;
      const low=c.createBiquadFilter();low.type='lowpass';low.frequency.value=1200;source.connect(low);low.connect(master);source.start();
      for(const frequency of[60,120,180]){const o=c.createOscillator();o.type='sine';o.frequency.value=frequency;const g=c.createGain();g.gain.value=.003;o.connect(g);g.connect(master);o.start();}
      // Sparse, irregular droplets are synthesized inside the loop, without crowd voices.
      const drops=c.createBuffer(2,c.sampleRate*18,c.sampleRate);
      for(let channel=0;channel<2;channel++){
        const d=drops.getChannelData(channel);
        for(let j=0;j<37;j++){const start=Math.floor(Math.random()*(d.length-12000)),f=1200+Math.random()*1900;for(let i=0;i<7000;i++){const t=i/c.sampleRate;d[start+i]+=.028*Math.sin(t*f*Math.PI*2)*Math.exp(-t*65);}}
      }
      const drip=c.createBufferSource();drip.buffer=drops;drip.loop=true;drip.connect(master);drip.start();
    }
    await this.ctx.resume();this.active=!this.active;this.master!.gain.setTargetAtTime(this.active?.65:0,this.ctx.currentTime,.5);return this.active;
  }
}
