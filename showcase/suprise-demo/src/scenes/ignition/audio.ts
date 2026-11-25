export class LaunchAudio{
  private ac:AudioContext|null=null;private master:GainNode|null=null;private engine:GainNode|null=null;private enabled=false;
  async toggle(){
    if(!this.ac){
      const ac=new AudioContext();this.ac=ac;this.master=ac.createGain();this.master.gain.value=0;this.master.connect(ac.destination);
      const buffer=ac.createBuffer(2,ac.sampleRate*8,ac.sampleRate);
      for(let channel=0;channel<2;channel++){const data=buffer.getChannelData(channel);let brown=0;for(let i=0;i<data.length;i++){brown=(brown+(Math.random()*2-1)*.035)/1.02;data[i]=brown;}}
      const source=ac.createBufferSource();source.buffer=buffer;source.loop=true;
      const wind=ac.createGain();wind.gain.value=.10;source.connect(wind);wind.connect(this.master);
      const filter=ac.createBiquadFilter();filter.type='lowpass';filter.frequency.value=280;source.connect(filter);
      this.engine=ac.createGain();this.engine.gain.value=0;filter.connect(this.engine);this.engine.connect(this.master);source.start();
      const oscillator=ac.createOscillator();oscillator.frequency.value=32;const sub=ac.createGain();sub.gain.value=.035;oscillator.connect(sub);sub.connect(this.engine);oscillator.start();
    }
    await this.ac.resume();this.enabled=!this.enabled;this.master!.gain.setTargetAtTime(this.enabled?.7:0,this.ac.currentTime,.35);return this.enabled;
  }
  setPageVisible(visible:boolean){if(this.ac&&this.master)this.master.gain.setTargetAtTime(visible&&this.enabled?.7:0,this.ac.currentTime,.12);}
  update(throttle:number,altitude:number){if(this.ac&&this.engine)this.engine.gain.setTargetAtTime(throttle*2.1/(1+altitude*.006),this.ac.currentTime,.15);}
}
