export type LaunchPhase='standby'|'countdown'|'ignition'|'ascent'|'complete';
/** An authored visual sequence; elapsed time advances only while the scene is visible. */
export class LaunchSequence{
  phase:LaunchPhase='standby';elapsed=0;altitude=0;throttle=0;arm=0;
  start(){if(this.phase!=='standby')return false;this.phase='countdown';this.elapsed=0;return true;}
  cancel(){if(this.phase!=='countdown')return false;this.reset();return true;}
  reset(){this.phase='standby';this.elapsed=0;this.altitude=0;this.throttle=0;this.arm=0;}
  get countdown(){return Math.max(0,Math.ceil(10-this.elapsed));}
  update(dt:number){
    if(this.phase==='standby'||this.phase==='complete'||!Number.isFinite(dt)||dt<=0)return;
    this.elapsed+=dt;
    this.arm=Math.min(1,Math.max(0,(this.elapsed-3)/6));
    if(this.elapsed<10){this.phase='countdown';return;}
    this.throttle=Math.min(1,(this.elapsed-10)/2);
    if(this.elapsed<13){this.phase='ignition';return;}
    this.phase='ascent';const t=this.elapsed-13;this.altitude=.46*t*t+.008*t*t*t;
    if(t>=48){this.phase='complete';this.throttle=0;}
  }
}
