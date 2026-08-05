import { Enemy } from './entities.js';
export class WaveDirector {
  constructor(){this.queue=[];this.timer=0;this.done=false;}
  start(wave){this.queue=[];this.timer=0;this.done=false;const count=5+wave*3;for(let i=0;i<count;i++){let type='chaser';if(wave>=2&&i%5===0)type='shooter';if(wave>=3&&i%7===0)type='splitter';if(wave>=4&&i%6===0)type='brute';this.queue.push({type,delay:.25+(i%4)*.32});}if(wave===5||wave===6)this.queue.push({type:'boss',delay:1.5});}
  update(dt,g){if(this.queue.length){this.timer-=dt;if(this.timer<=0){const next=this.queue.shift();const side=Math.floor(Math.random()*4);let x,y;if(side===0){x=-30;y=100+Math.random()*(g.H-140);}else if(side===1){x=g.W+30;y=100+Math.random()*(g.H-140);}else if(side===2){x=Math.random()*g.W;y=70;}else{x=Math.random()*g.W;y=g.H+30;}g.enemies.push(new Enemy(next.type,x,y,g.wave));this.timer=next.delay;}}else this.done=true;}
}
export function upgradeChoices(wave){const all=[
  {name:'PRISM ARRAY',desc:'Fire one additional bolt in every volley.',apply:p=>p.multishot++},
  {name:'OVERDRIVE',desc:'Fire rate increases by 24%.',apply:p=>p.fireRate*=.76},
  {name:'RESONANT CORE',desc:'Maximum integrity +25 and restore 25.',apply:p=>{p.maxHp+=25;p.hp=Math.min(p.maxHp,p.hp+25)}},
  {name:'STAR THRUSTERS',desc:'Movement speed increases by 18%.',apply:p=>p.speed*=1.18},
  {name:'VOID LANCE',desc:'Bolt damage increases by 35%.',apply:p=>p.damage*=1.35},
  {name:'AEGIS SHARD',desc:'Absorb one collision without taking damage.',apply:p=>p.shield++}
];const shuffled=[...all].sort(()=>Math.random()-.5);return shuffled.slice(0,3);}