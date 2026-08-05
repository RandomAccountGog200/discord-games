export class AudioManager {
  constructor(){this.ctx=null;this.master=null;this.muted=localStorage.getItem('polarMuted')==='1';this.musicTimer=null;this.note=0}
  unlock(){if(this.ctx)return;const C=window.AudioContext||window.webkitAudioContext;if(!C)return;this.ctx=new C();this.master=this.ctx.createGain();this.master.gain.value=this.muted?0:.16;this.master.connect(this.ctx.destination);this.startMusic()}
  tone(freq,duration,type='sine',volume=.18,delay=0){if(!this.ctx||this.muted)return;const o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type=type;o.frequency.setValueAtTime(freq,this.ctx.currentTime+delay);g.gain.setValueAtTime(.001,this.ctx.currentTime+delay);g.gain.exponentialRampToValueAtTime(volume,this.ctx.currentTime+delay+.012);g.gain.exponentialRampToValueAtTime(.001,this.ctx.currentTime+delay+duration);o.connect(g);g.connect(this.master);o.start(this.ctx.currentTime+delay);o.stop(this.ctx.currentTime+delay+duration+.03)}
  noise(duration=.1,volume=.12){if(!this.ctx||this.muted)return;const n=this.ctx.createBufferSource(),b=this.ctx.createBuffer(1,this.ctx.sampleRate*duration,this.ctx.sampleRate),a=b.getChannelData(0);for(let i=0;i<a.length;i++)a[i]=Math.random()*2-1;n.buffer=b;const g=this.ctx.createGain();g.gain.setValueAtTime(volume,this.ctx.currentTime);g.gain.exponentialRampToValueAtTime(.001,this.ctx.currentTime+duration);n.connect(g);g.connect(this.master);n.start()}
  startMusic(){if(this.musicTimer||!this.ctx)return;const scale=[220,262,330,392,330,294,247,294];this.musicTimer=setInterval(()=>{if(!this.muted){this.tone(scale[this.note%scale.length],.28,'triangle',.025);if(this.note%4===0)this.tone(scale[(this.note+3)%scale.length]/2,.5,'sine',.018)}this.note++},360)}
  snap(){this.tone(125,.08,'sawtooth',.18);this.tone(620,.18,'triangle',.1,.025);this.noise(.06,.07)}
  hit(){this.tone(90,.12,'square',.13);this.noise(.07,.08)}
  pickup(){this.tone(650,.1,'sine',.1);this.tone(980,.18,'sine',.07,.07)}
  hurt(){this.tone(72,.24,'sawtooth',.2);this.noise(.12,.12)}
  clear(){this.tone(440,.14,'triangle',.12);this.tone(660,.22,'triangle',.1,.13);this.tone(880,.3,'sine',.08,.26)}
  click(){this.tone(420,.07,'square',.07)}
  toggle(){this.muted=!this.muted;localStorage.setItem('polarMuted',this.muted?'1':'0');if(this.master)this.master.gain.value=this.muted?0:.16;return this.muted}
}