// levels.js - Definition of all 8 girlfriends to destroy

export const LEVELS = [
    {
        name: "Bubbly",
        desc: "She never stops talking about whales.",
        color: '#ff6b6b',
        hp: 30,
        speed: 1.0,
        pattern: 'sine',
        fireRate: 4.0,
        score: 100
    },
    {
        name: "Stalker",
        desc: "She always knows where you are.",
        color: '#c44569',
        hp: 45,
        speed: 1.2,
        pattern: 'chase',
        fireRate: 2.5,
        score: 200
    },
    {
        name: "Drama Queen",
        desc: "Everything is a crisis.",
        color: '#f3a683',
        hp: 60,
        speed: 1.5,
        pattern: 'dash',
        fireRate: 3.0,
        score: 350
    },
    {
        name: "Tech Savvy",
        desc: "Her tick tock is always trending.",
        color: '#1e90ff',
        hp: 80,
        speed: 1.3,
        pattern: 'circle',
        fireRate: 1.8,
        score: 500
    },
    {
        name: "Fitness Guru",
        desc: "She's a certified yoga instructor.",
        color: '#3cb371',
        hp: 100,
        speed: 1.8,
        pattern: 'sine',
        fireRate: 1.5,
        score: 700
    },
    {
        name: "Shopaholic",
        desc: "Her credit cards are maxed.",
        color: '#fea47f',
        hp: 120,
        speed: 1.6,
        pattern: 'chase',
        fireRate: 1.2,
        score: 1000
    },
    {
        name: "Party Girl",
        desc: "She drinks too many energy drinks.",
        color: '#f5cd79',
        hp: 150,
        speed: 2.0,
        pattern: 'random',
        fireRate: 0.8,
        score: 1500
    },
    {
        name: "The Perfect One",
        desc: "She can cook, clean, and pays taxes.",
        color: '#f8c471',
        hp: 200,
        speed: 2.2,
        pattern: 'chase',
        fireRate: 0.5,
        score: 2000
    }
];

// Helper to get a pattern movement function (returns void, updates enemy object)
export function getPattern(pat) {
    switch(pat) {
        case 'sine': {
            return (enemy, dt, time) => {
                enemy.x = enemy.baseX + Math.sin(time * 2) * 200;
                enemy.y += enemy.vy * dt;
            };
        }
        case 'chase': {
            return (enemy, dt, time) => {
                const dx = enemy.targetX - enemy.x;
                enemy.x += dx * enemy.speed * dt;
                enemy.y += enemy.vy * dt;
            };
        }
        case 'dash': {
            return (enemy, dt, time) => {
                enemy.x += enemy.vx * dt;
                if (Math.sin(time * 3) > 0.97) {
                    enemy.vy = 200;
                }
                enemy.y += enemy.vy * dt;
            };
        }
        case 'circle': {
            return (enemy, dt, time) => {
                const cx = enemy.baseX;
                const cy = enemy.y + Math.sin(time * 2) * 150;
                enemy.x = cx + Math.cos(time * 1.5) * 200;
                enemy.y = cy + Math.sin(time * 1.2) * 100;
            };
        }
        case 'random': {
            return (enemy, dt, time) => {
                if (enemy.changeT <= 0) {
                    enemy.changeT = 1;
                    enemy.vx = (Math.random() - 0.5) * 200;
                    enemy.vy = (Math.random() * 0.3 + 0.2) * 100;
                }
                enemy.x += enemy.vx * dt;
                enemy.y += enemy.vy * dt;
                if (enemy.x < 0 || enemy.x > 960) enemy.vx *= -1;
            };
        }
        default: return (enemy, dt, time) => {};
    }
}