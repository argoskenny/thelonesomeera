// A short original phrase for a three-string lute. Each note uses a noisy
// plectrum attack and a decaying, slightly inharmonic string resonance.
export class RyokanAudio {
  private context?:AudioContext;
  private bus?:GainNode;
  private wet?:ConvolverNode;
  private clock?:number;
  private next=0;
  private step=0;
  private on=false;
  private build(){
    const c=this.context=new AudioContext();
    this.bus=c.createGain();this.bus.gain.value=0;this.bus.connect(c.destination);
    this.wet=c.createConvolver();
    const ir=c.createBuffer(2,c.sampleRate*1.25,c.sampleRate);
    for(let ch=0;ch<2;ch++){
      const samples=ir.getChannelData(ch);
      for(let i=0;i<samples.length;i++)samples[i]=(Math.random()*2-1)*Math.pow(1-i/samples.length,4)*.19;
    }
    this.wet.buffer=ir;const distant=c.createGain();distant.gain.value=.28;
    this.wet.connect(distant).connect(this.bus);
    const water=c.createBuffer(1,c.sampleRate*3,c.sampleRate),samples=water.getChannelData(0);
    let running=0;
    for(let i=0;i<samples.length;i++){running=running*.88+.12*(Math.random()*2-1);samples[i]=running*(.8+.2*Math.sin(i/c.sampleRate*Math.PI*2/3));}
    const stream=c.createBufferSource();stream.buffer=water;stream.loop=true;
    const filter=c.createBiquadFilter();filter.type='highpass';filter.frequency.value=620;
    const gain=c.createGain();gain.gain.value=.044;stream.connect(filter).connect(gain).connect(this.bus);stream.start();
  }
  private strike(frequency:number,at:number,volume:number){
    const c=this.context!,duration=2.3,n=Math.round(c.sampleRate*duration);
    const buf=c.createBuffer(1,n,c.sampleRate),out=buf.getChannelData(0);
    for(let i=0;i<n;i++){
      const t=i/c.sampleRate,a=Math.PI*2*frequency*(t+.00038*(1-Math.exp(-50*t)));
      const ring=Math.sin(a)+.53*Math.sin(2.001*a)*Math.exp(-2*t)+.38*Math.sin(3.012*a)*Math.exp(-3.1*t)+.25*Math.sin(5.026*a)*Math.exp(-4.3*t);
      out[i]=volume*(1-Math.exp(-500*t))*Math.exp(-t*2.85)*(ring*.55+(.5-Math.random())*Math.exp(-t*93));
    }
    const note=c.createBufferSource();note.buffer=buf;note.connect(this.bus!);note.connect(this.wet!);note.start(at);
    note.onended=()=>note.disconnect();
  }
  private schedule(){
    const c=this.context;if(!c || !this.on)return;
    const phrase=[[146.83,.74],[220,.43],[233.08,.32],[220,.95],[174.61,.77],[146.83,1.65],[196,.56],[293.66,.44],[311.13,.30],[293.66,1.12],[220,.80],[146.83,2.5]];
    while(this.next<c.currentTime+.15){
      const [pitch,delay]=phrase[this.step%phrase.length];this.strike(pitch,this.next,.12+(this.step%4===0?.042:0));
      this.next+=delay;this.step++;
    }
  }
  async toggle(){
    if(!this.context)this.build();
    const c=this.context!;
    if(!this.on){
      await c.resume();this.on=true;this.next=c.currentTime+.06;this.bus!.gain.setTargetAtTime(.72,c.currentTime,.11);
      this.schedule();this.clock=window.setInterval(()=>this.schedule(),100);
    }else{
      this.on=false;clearInterval(this.clock);this.bus!.gain.setTargetAtTime(0,c.currentTime,.07);
    }
    return this.on;
  }
}
