/** Licensed local field recordings. Two staggered loops crossfade over the join. */
export class MarketAudio {
  context: AudioContext | null = null;
  master: GainNode | null = null;
  analyser: AnalyserNode | null = null;
  samples = new Float32Array(512);
  beds: {buffer: AudioBuffer;gain: GainNode;next: number}[] = [];
  sources = new Set<AudioBufferSourceNode>();
  loading: Promise<void> | null = null;
  timer = 0; active = false; muted = false; volume = .65; mix = .2;
  constructor(private onError: ()=>void){}
  async start(){
    this.active=true;
    if(!this.context){this.context=new AudioContext();this.master=this.context.createGain();this.analyser=this.context.createAnalyser();this.analyser.fftSize=1024;this.master.connect(this.analyser);this.analyser.connect(this.context.destination);}
    const ctx=this.context;
    // Resume synchronously inside the user's start gesture, before network awaits.
    const resume=ctx.resume();
    if(!this.loading)this.loading=this.load().catch(e=>{this.loading=null;this.onError();throw e;});
    try{await resume;await this.loading;if(!this.active)return;this.apply();if(!this.timer){this.schedule();this.timer=window.setInterval(()=>this.schedule(),1000);}}catch{ /* Walking remains available if audio is blocked/offline. */ }
  }
  private async load(){
    const ctx=this.context!;
    const buffers=await Promise.all(['hulin-market.mp3','guangzhou-night-market.mp3'].map(async p=>{const r=await fetch(`${import.meta.env.BASE_URL}audio/${p}`);if(!r.ok)throw Error(p);return ctx.decodeAudioData(await r.arrayBuffer());}));
    this.beds=buffers.map(buffer=>{const gain=ctx.createGain();gain.connect(this.master!);return{buffer,gain,next:ctx.currentTime+.1};});
  }
  private schedule(){
    if(!this.context||!this.active)return;
    const ctx=this.context;
    for(const bed of this.beds)while(bed.next<ctx.currentTime+5){
      // Skip the original tail of the Hulin walk where the recordist greets a friend.
      const duration=Math.min(bed.buffer.duration-2,bed===this.beds[0]?250:125), fade=3;
      const at=Math.max(bed.next,ctx.currentTime+.03), source=ctx.createBufferSource(), envelope=ctx.createGain();source.buffer=bed.buffer;source.connect(envelope);envelope.connect(bed.gain);
      envelope.gain.setValueAtTime(0,at);envelope.gain.linearRampToValueAtTime(1,at+fade);envelope.gain.setValueAtTime(1,at+duration-fade);envelope.gain.linearRampToValueAtTime(0,at+duration);
      source.start(at,1,duration);this.sources.add(source);source.onended=()=>{this.sources.delete(source);source.disconnect();envelope.disconnect();};bed.next=at+duration-fade;
    }
  }
  setLocation(x:number,z:number){this.mix=z<-29?.68:Math.abs(x)>39?.13:.3;this.apply();}
  apply(){if(!this.context||!this.master)return;const t=this.context.currentTime;this.master.gain.setTargetAtTime(this.muted?0:this.volume*.7,t,.15);this.beds[0]?.gain.gain.setTargetAtTime(Math.sqrt(1-this.mix),t,1.5);this.beds[1]?.gain.gain.setTargetAtTime(Math.sqrt(this.mix)*.65,t,1.5);}
  pause(){this.active=false;if(this.timer){clearInterval(this.timer);this.timer=0;}void this.context?.suspend();}
  get status(){this.analyser?.getFloatTimeDomainData(this.samples);const rms=Math.sqrt(this.samples.reduce((sum,v)=>sum+v*v,0)/this.samples.length);return{rms,state:this.context?.state??'idle',decoded:this.beds.length,playing:this.active&&!this.muted,volume:this.volume,sources:this.sources.size};}
}
