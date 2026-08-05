import { TAU, angleTo, dist2, rand } from './utils.js';
import { playPlayerHit, playExplosion } from './audio.js';

export class EnemyManager {
  constructor(canvas, particles, player) {
    this.canvas = canvas;
    this.particles = particles;
    this.player = player;
    this.enemies = [];
    this.bullets = [];
    this.enemyBullets = [];
    this.score = 0;
  }

  reset() {
    this.enemies = [];
    this.enemyBullets = [];
    this.score = 0;
  }

  spawnWave(wave) {
    const count = Math.min(5 + wave * 2, 25);
    for (let i = 0; i < count; i++) {
      this.spawnEnemy(wave);
    }
  }

  spawnEnemy(wave) {
    const type = this.getRandomType(wave);
    const x = rand(50, this.canvas.width - 50);
    const y = rand(50, this.canvas.height - 50);
    const enemy = {
      type,
      x,
      y,
      radius: type === 'large' ? 18 : (type === 'fast' ? 10 : 12),
      hp: type === 'large' ? 30 : 10,
      speed: type === 'fast' ? 200 : 80 + wave * 5,
      angle: angleTo(x, y, this.player.x, this.player.y),
      pointValue: type === 'large' ? 20 : 10,
      color: type === 'large' ? '#ff4444' : (type === 'fast' ? '#ff8800' : '#ffaa00')
    };
    this.enemies.push(enemy);
  }

  getRandomType(wave) {
    const r = Math.random();
    if (wave >= 3 && r < 0.2) return 'large';
    if (wave >= 2 && r < 0.5) return 'fast';
    return 'normal';
  }

  update(dt) {
    // Update enemies
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      // Move toward player
      const dx = this.player.x - e.x;
      const dy = this.player.y - e.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 50) {
        e.x += (dx / dist) * e.speed * dt;
        e.y += (dy / dist) * e.speed * dt;
      }

      // Collision with player
      if (dist < e.radius + this.player.radius) {
        this.particles.createExplosion(this.player.x, this.player.y);
        const hit = this.player.takeDamage(20);
        if (hit) {
          playPlayerHit();
          this.particles.createDamageFlash(this.player.x, this.player.y);
        }
        // Remove enemy on collision? Maybe bounce but for simplicity destroy enemy
        this.enemies.splice(i, 1);
        this.particles.createExplosion(e.x, e.y);
        playExplosion();
        this.score += e.pointValue;
      }
    }

    // Update enemy bullets
    for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
      const b = this.enemyBullets[i];
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      if (b.x < 0 || b.x > this.canvas.width || b.y < 0 || b.y > this.canvas.height) {
        this.enemyBullets.splice(i, 1);
        continue;
      }
      if (dist2(b.x, b.y, this.player.x, this.player.y) < (b.radius + this.player.radius)**2) {
        const hit = this.player.takeDamage(10);
        if (hit) {
          playPlayerHit();
          this.particles.createDamageFlash(this.player.x, this.player.y);
        }
        this.enemyBullets.splice(i, 1);
      }
    }
  }

  handleBulletCollisions(bullets, onKill) {
    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i];
      if (!b) continue;
      for (let j = this.enemies.length - 1; j >= 0; j--) {
        const e = this.enemies[j];
        if (dist2(b.x, b.y, e.x, e.y) < (b.radius + e.radius)**2) {
          e.hp -= 10;
          this.particles.createExplosion(b.x, b.y);
          if (e.hp <= 0) {
            this.particles.createExplosion(e.x, e.y, 2);
            playExplosion();
            this.score += e.pointValue;
            onKill(e);
            this.enemies.splice(j, 1);
          }
          bullets.splice(i, 1);
          break;
        }
      }
    }
  }

  draw(ctx) {
    for (const e of this.enemies) {
      ctx.save();
      ctx.translate(e.x, e.y);
      ctx.beginPath();
      ctx.arc(0, 0, e.radius, 0, TAU);
      ctx.fillStyle = e.color;
      ctx.shadowColor = e.color;
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.restore();
    }
    for (const b of this.enemyBullets) {
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, TAU);
      ctx.fillStyle = '#ff0000';
      ctx.fill();
    }
  }
}