export class AudioEngine {
  constructor(){this.ctx=null;this.master=null;this.musicTimer=null;this.step=0}
  resume(){
    if(!this.ctx){this.ctx=new (window.AudioContext||window.webkitAudioContext)();this.master=this.ctx.createGain();this.master.gain.value=.18;this.master.connect(this.ctx.destination);this.startMusic();}
    if(this.ctx.state==='suspended')this.ctx.resume();
  }
  tone(freq,dur=.1,type='sine',vol=.12){
    if(!this.ctx)return; const o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type=type;o.frequency.value=freq;g.gain.setValueAtTime(vol,this.ctx.currentTime);g.gain.exponentialRampToValueAtTime(.001,this.ctx.currentTime+dur);o.connect(g);g.connect(this.master);o.start();o.stop(this.ctx.currentTime+dur+.02);
  }
  click(){this.tone(420,.055,'square',.07)}
  collect(){this.tone(660,.08,'sine',.12);setTimeout(()=>this.tone(990,.12,'sine',.09),45)}
  hit(){this.tone(90,.18,'sawtooth',.16);this.tone(180,.08,'square',.08)}
  pulse(){this.tone(170,.22,'sine',.14);setTimeout(()=>this.tone(510,.18,'triangle',.1),40)}
  dash(){this.tone(260,.1,'sawtooth',.1)}
  startMusic(){
    const notes=[110,138.59,164.81,123.47,146.83,184.99,130.81,164.81];
    this.musicTimer=setInterval(()=>{if(this.ctx&&this.ctx.state==='running'){this.tone(notes[this.step%notes.length],.28,'triangle',.025);if(this.step%4===0)this.tone(notes[(this.step+2)%notes.length]*2,.11,'sine',.018);this.step++;}},360);
  }
}