let ctx = null;
let musicTimer = null;
const notes = [196,247,294,330,392,330,294,247];
function ensure() { if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)(); if (ctx.state === 'suspended') ctx.resume(); return ctx; }
export function initAudio() { ensure(); }
export function tone(freq=440, duration=.08, type='square', volume=.035, slide=0) {
  const c=ensure(), now=c.currentTime, osc=c.createOscillator(), gain=c.createGain();
  osc.type=type; osc.frequency.setValueAtTime(freq,now); osc.frequency.exponentialRampToValueAtTime(Math.max(40,freq+slide),now+duration);
  gain.gain.setValueAtTime(volume,now); gain.gain.exponentialRampToValueAtTime(.001,now+duration);
  osc.connect(gain).connect(c.destination); osc.start(now); osc.stop(now+duration+.02);
}
export function clickSound() { tone(420,.055,'square',.04,100); }
export function kickSound() { tone(130,.12,'sawtooth',.055,-70); tone(560,.055,'square',.025,-170); }
export function hitSound(heavy=false) { tone(heavy?85:190,heavy?.18:.075,'sawtooth',heavy?.06:.035,-60); }
export function pickupSound() { tone(620,.08,'sine',.04,180); tone(930,.12,'sine',.025,0); }
export function hurtSound() { tone(90,.16,'sawtooth',.05,-35); }
export function startMusic() {
  ensure(); stopMusic(); let i=0;
  musicTimer=setInterval(()=>{ tone(notes[i++%notes.length],.18,'triangle',.012); },260);
}
export function stopMusic() { if (musicTimer) { clearInterval(musicTimer); musicTimer=null; } }