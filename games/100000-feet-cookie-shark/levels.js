const themes = [
  ['COOKIE REEF','#063348','#116a77',['shark','jelly']],
  ['SODA TRENCH','#101f46','#204a80',['shark','mine','jelly']],
  ['SPRINKLE VENTS','#301d4e','#743f79',['mine','jelly','shark']],
  ['CARAMEL CANYON','#401c35','#8c454d',['shark','mine']],
  ['COLD BREW ABYSS','#071e3d','#185a80',['jelly','shark','mine']],
  ['MELTED CLOCKWORK','#172849','#496087',['mine','shark','jelly']],
  ['VANILLA VOID','#18203b','#634f7e',['shark','mine']],
  ['THE SUGAR SHELF','#3b213c','#a05d76',['jelly','mine','shark']],
  ['BLACK COOKIE SEA','#050d25','#1e2655',['shark','mine','jelly']],
  ['THE LAST SCOOP','#080c1c','#49355b',['shark','mine','jelly']]
];
export function zoneConfig(zone) {
  const z = Math.max(0, Math.min(9, zone));
  const t = themes[z];
  return { index: z, name: t[0], colorA: t[1], colorB: t[2], hazards: t[3], scrollSpeed: 78 + z * 6, interval: Math.max(.38, .88 - z * .052), hp: 2 + Math.floor(z / 3) };
}
export function depthZone(depth) { return Math.min(9, Math.floor(depth / 10000)); }
export function zoneProgress(depth) { return (depth % 10000) / 10000; }