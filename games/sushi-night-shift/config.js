export const CANVAS_WIDTH = 960;
export const CANVAS_HEIGHT = 640;

export const CUSTOMER_SLOTS = [110, 280, 450, 620, 790];
export const CUSTOMER_Y = 300;
export const CUSTOMER_PATIENCE_BASE = 12;

export const SUSHI_TRAY_Y = 480;
export const SUSHI_TRAY_X = 480;
export const SUSHI_SPACING = 72;
export const SUSHI_RADIUS = 32;

export const DAY_BG = ['#2d1b15', '#3d251a', '#4a2d20'];
export const NIGHT_BG = ['#0d0a14', '#150f24', '#1a1228'];

export const SUSHI_TYPES = {
  salmon:  { name: 'Salmon Roll', color: '#ff7a6b', dark: '#8c4638', cursedColor: '#7a2a2d' },
  tuna:    { name: 'Tuna Roll',   color: '#d94343', dark: '#7a2222', cursedColor: '#5c1010' },
  egg:     { name: 'Egg Roll',    color: '#f2d63c', dark: '#b09a26', cursedColor: '#8a7a1c' },
  shrimp:  { name: 'Shrimp Roll', color: '#f28d4c', dark: '#b35d26', cursedColor: '#9c3a1a' },
  cucumber:{ name: 'Cucumber Roll', color: '#4dc76a', dark: '#2a7a3e', cursedColor: '#1a5c26' },
};

export const CUSTOMER_COLORS = ['#e74c3c', '#3498db', '#2ecc71', '#e67e22', '#9b59b6', '#16a085', '#e84393', '#f39c12'];

export const NIGHT_CONFIG = [
  { night: 1, customerCount: 6,  ghostChance: 0.0, sushiTypes: ['salmon', 'tuna', 'egg'], cursedTypes: [],                patienceMult: 1.0, title: 'The Restaurant Opens' },
  { night: 2, customerCount: 10, ghostChance: 0.3, sushiTypes: ['salmon', 'tuna', 'egg'], cursedTypes: ['salmon'],         patienceMult: 0.9, title: 'The Bad Things Begin...' },
  { night: 3, customerCount: 14, ghostChance: 0.4, sushiTypes: ['salmon', 'tuna', 'egg', 'shrimp'], cursedTypes: ['salmon','tuna'], patienceMult: 0.85, title: 'They Are Here' },
  { night: 4, customerCount: 20, ghostChance: 0.5, sushiTypes: ['salmon', 'tuna', 'egg', 'shrimp', 'cucumber'], cursedTypes: ['salmon','tuna','egg'], patienceMult: 0.8, title: 'The Sushi Master\'s Revenge' },
];

export const KEYBOARD_MAP = { '1': 0, '2': 1, '3': 2, '4': 3, '5': 4, '6': 5, '7': 6, '8': 7 };

export const STORAGE_KEY = 'sushi-night-shift-highscore';