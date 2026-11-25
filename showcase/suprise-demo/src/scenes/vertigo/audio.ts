export class CityAudio {
  private context:AudioContext|null=null;private gain:GainNode|null=null;private enabled=false;
  async toggle(){
    if(!this.context){
      const ac=new AudioContext();this.context=ac;const gain=ac.createGain();gain.gain.value=0;gain.connect(ac.destination);this.gain=gain;
      const duration=12,buffer=ac.createBuffer(2,ac.sampleRate*duration,ac.sampleRate);
      for(let channel=0;channel<2;channel++){
        const data=buffer.getChannelData(channel);let brown=0;
        for(let i=0;i<data.length;i++){brown=(brown+(Math.random()*2-1)*.023)/1.018;const t=i/ac.sampleRate;data[i]=brown*(.40+Math.sin(t*Math.PI*2/duration)*.16+Math.sin(t*Math.PI*6/duration)*.06);}
      }
      const wind=ac.createBufferSource();wind.buffer=buffer;wind.loop=true;const filter=ac.createBiquadFilter();filter.type='lowpass';filter.frequency.value=930;wind.connect(filter);filter.connect(gain);wind.start();
      const distant=ac.createOscillator(),hum=ac.createGain();distant.type='sine';distant.frequency.value=73;hum.gain.value=.006;distant.connect(hum);hum.connect(gain);distant.start();
    }
    await this.context.resume();this.enabled=!this.enabled;this.gain!.gain.setTargetAtTime(this.enabled?.65:0,this.context.currentTime,.8);return this.enabled;
  }
}
