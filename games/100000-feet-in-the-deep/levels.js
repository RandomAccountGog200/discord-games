export const ZONE_LENGTH = 20000;
export const TARGET_DEPTH = 100000;
export const ZONES = [
  {name:'SUNLIT TRENCH', colors:['#12628b','#071c4e'], accent:'#62e7df'},
  {name:'CORAL CATHEDRAL', colors:['#703f8d','#101b53'], accent:'#ff9fc3'},
  {name:'MIDNIGHT KELP', colors:['#165b68','#061b37'], accent:'#8be9a8'},
  {name:'ABYSSAL FROST', colors:['#315d92','#0b1742'], accent:'#b6deff'},
  {name:'THE COOKIE VOID', colors:['#552d75','#100b30'], accent:'#ffc578'}
];
export function zoneFor(index) { return ZONES[Math.max(0, Math.min(ZONES.length-1,index))]; }
export function upgradeOptions() {
  return [
    {id:'armor', icon:'♥', title:'WHIPPED CREAM ARMOR', desc:'+1 hull and repair one hit.'},
    {id:'fins', icon:'≋', title:'ESPRESSO FINS', desc:'Swim 20% faster. Your dash recharges quicker.'},
    {id:'bite', icon:'✦', title:'COOKIE CANNON', desc:'Dash damage to bosses is doubled.'}
  ];
}