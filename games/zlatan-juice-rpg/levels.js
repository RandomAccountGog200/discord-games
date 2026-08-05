export const MAX_LEVEL=5;
export function makeWave(level){
  const enemies=[];
  const add=(type,x,y)=>enemies.push({type,x,y});
  const cols=level+2;
  for(let i=0;i<cols;i++) add(level>=3&&i%3===0?'keeper':'blocker',110+i*(740/Math.max(1,cols-1)),105+((i%2)*45));
  if(level>=2){add('bruiser',260,190);add('bruiser',700,190);}
  if(level>=3){add('keeper',480,95);add('blocker',350,145);}
  if(level>=4){add('bruiser',160,250);add('bruiser',800,250);}
  if(level===5){add('king',480,135);add('keeper',300,100);add('keeper',660,100);}
  return enemies;
}
export function waveName(level){return ['Rookie Pitches','Street League','National Juice Cup','Champions’ Gauntlet','The Final Pour'][level-1]||'Unknown Arena';}