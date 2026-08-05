const ground = (x, width) => ({ x, y: 470, w: width, h: 80 });

export const LEVELS = [
  {
    name: 'Sunbeam Alley', theme: ['#75d9d2', '#7661dc'], width: 2200, spawn: { x: 80, y: 420 }, required: 4,
    platforms: [ground(0, 2200), { x: 225, y: 385, w: 180, h: 18 }, { x: 515, y: 320, w: 210, h: 18 }, { x: 815, y: 405, w: 185, h: 18 }, { x: 1085, y: 335, w: 210, h: 18 }, { x: 1380, y: 275, w: 200, h: 18 }, { x: 1650, y: 375, w: 220, h: 18 }, { x: 1910, y: 300, w: 180, h: 18 }],
    stars: [{x:270,y:345},{x:580,y:280},{x:875,y:365},{x:1140,y:295},{x:1450,y:235},{x:1735,y:335},{x:1990,y:260}],
    enemies: [{x:390,platform:0,range:[280,570]},{x:860,platform:0,range:[760,1060]},{x:1510,platform:4,range:[1380,1550]},{x:1840,platform:0,range:[1710,2030]}], goal: { x: 2100, y: 408 }
  },
  {
    name: 'Puddle Park', theme: ['#f7b267', '#e76f9b'], width: 2350, spawn: { x: 70, y: 420 }, required: 5,
    platforms: [ground(0, 510), ground(650, 470), ground(1230, 420), ground(1800, 550), {x:180,y:370,w:170,h:18},{x:470,y:285,w:190,h:18},{x:735,y:350,w:175,h:18},{x:1010,y:265,w:190,h:18},{x:1300,y:355,w:180,h:18},{x:1530,y:280,w:205,h:18},{x:1870,y:350,w:190,h:18},{x:2110,y:260,w:170,h:18}],
    stars: [{x:230,y:330},{x:535,y:245},{x:790,y:310},{x:1060,y:225},{x:1350,y:315},{x:1590,y:240},{x:1930,y:310},{x:2160,y:220}],
    enemies: [{x:285,platform:0,range:[100,470]},{x:700,platform:1,range:[660,930]},{x:1260,platform:2,range:[1240,1550]},{x:1950,platform:3,range:[1830,2180]},{x:1580,platform:5,range:[1530,1710]}], goal: { x: 2250, y: 408 }
  },
  {
    name: 'Moonlit Market', theme: ['#5148b8', '#171737'], width: 2500, spawn: { x: 65, y: 420 }, required: 5,
    platforms: [ground(0, 2500), {x:160,y:375,w:180,h:18},{x:445,y:300,w:180,h:18},{x:720,y:380,w:180,h:18},{x:980,y:300,w:190,h:18},{x:1260,y:220,w:180,h:18},{x:1510,y:340,w:220,h:18},{x:1800,y:270,w:190,h:18},{x:2070,y:360,w:175,h:18},{x:2290,y:285,w:180,h:18}],
    stars: [{x:205,y:335},{x:490,y:260},{x:770,y:340},{x:1030,y:260},{x:1310,y:180},{x:1575,y:300},{x:1860,y:230},{x:2125,y:320},{x:2345,y:245}],
    enemies: [{x:360,platform:0,range:[40,600]},{x:1040,platform:3,range:[980,1160]},{x:1320,platform:4,range:[1260,1420]},{x:1600,platform:5,range:[1510,1720]},{x:2160,platform:0,range:[1950,2380]}], goal: { x: 2400, y: 408 }
  },
  {
    name: 'The Heartwood', theme: ['#55c7bb', '#2b387c'], width: 2700, spawn: { x: 65, y: 420 }, required: 6,
    platforms: [ground(0, 2700), {x:180,y:350,w:190,h:18},{x:470,y:260,w:190,h:18},{x:765,y:340,w:170,h:18},{x:1030,y:235,w:200,h:18},{x:1330,y:320,w:190,h:18},{x:1590,y:220,w:190,h:18},{x:1850,y:315,w:190,h:18},{x:2120,y:235,w:200,h:18},{x:2410,y:320,w:190,h:18}],
    stars: [{x:225,y:310},{x:520,y:220},{x:810,y:300},{x:1090,y:195},{x:1380,y:280},{x:1640,y:180},{x:1900,y:275},{x:2180,y:195},{x:2470,y:280}],
    enemies: [{x:320,platform:0,range:[100,600]},{x:810,platform:2,range:[765,900]},{x:1090,platform:3,range:[1030,1200]},{x:1400,platform:4,range:[1330,1500]},{x:1660,platform:5,range:[1590,1750]},{x:2210,platform:0,range:[2000,2550]}], goal: { x: 2580, y: 408 }
  }
];