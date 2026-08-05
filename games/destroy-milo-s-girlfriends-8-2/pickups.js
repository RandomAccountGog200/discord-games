import { dist, drawHeart } from './utils.js';

export const Pickups = {
  list: [],

  spawnHeart(x, y) {
    this.list.push({ x, y, r: 11, kind: 'heart', bob: Math.random() * Math.PI * 2, life: 14 });
  },

  spawnCandy(x, y) {
    this.list.push({ x, y, r: 10, kind: 'candy', bob: Math.random() * Math.PI * 2, life: 14 });
  },

  update(dt, player, FX, AudioSys, onScore) {
    for (let i = this.list.length - 1; i >= 0; i--) {
      const p = this.list[i];
      p.life -= dt;
      p.bob += dt * 4;
      if (p.life <= 0) { this.list.splice(i, 1); continue; }
      const d = dist(p.x, p.y, player.x, player.y);
      if (d < player.magnet) {
        // magnet pull
        const pull = 340;
        p.x += (player.x - p.x) / d * pull * dt;
        p.y += (player.y - p.y) / d * pull * dt;
      }
      if (d < p.r + player.r) {
        if (p.kind === 'heart') {
          player.hp = Math.min(player.maxhp, player.hp + 12);
          FX.addText(player.x, player.y - 24, '+12 HP', '#6dffb8', 15);
          FX.hearts(p.x, p.y, 4);
        } else {
          onScore(150);
          FX.addText(player.x, player.y - 24, '+150', '#ffd23d', 15);
          FX.burst(p.x, p.y, '#ffd23d', 10, 140, 4);
        }
        AudioSys.pickup();
        this.list.splice(i, 1);
      }
    }
  },

  draw(ctx, time) {
    for (const p of this.list) {
      const yo = Math.sin(p.bob) * 3;
      const fade = p.life < 3 ? (Math.floor(time * 6) % 2 === 0 ? 0.35 : 1) : 1;
      ctx.globalAlpha = fade;
      // glow
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = p.kind === 'heart' ? 'rgba(109,255,184,0.18)' : 'rgba(255,210,61,0.18)';
      ctx.beginPath(); ctx.arc(p.x, p.y + yo, p.r * 2, 0, Math.PI * 2); ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
      if (p.kind === 'heart') {
        drawHeart(ctx, p.x, p.y + yo, p.r, '#6dffb8');
      } else {
        ctx.save();
        ctx.translate(p.x, p.y + yo);
        ctx.rotate(time * 2);
        ctx.fillStyle = '#ffd23d';
        ctx.beginPath();
        for (let k = 0; k < 4; k++) {
          ctx.rotate(Math.PI / 2);
          ctx.lineTo(0, -p.r);
          ctx.lineTo(3, -3);
        }
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
      ctx.globalAlpha = 1;
    }
  },

  clear() { this.list.length = 0; }
};