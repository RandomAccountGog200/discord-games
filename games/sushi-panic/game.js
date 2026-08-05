import { W, H, SUSHI, UPGRADES, dayConfig } from './levels.js';
import { Button, roundRect, drawBG, drawSushiIcon } from './ui.js';
import { Customer, Plate, Rat, Fire } from './entities.js';
import { Particles } from './particles.js';
import { sfx, startMusic, toggleMute, isMuted } from './audio.js';

const BEST_KEY = 'sushiPanicBest';
const BELT_Y = 415;

export class Game {
  constructor() {
    this.particles = new Particles();
    this.pointer = { x: W / 2, y: H / 2 };
    this.texts = [];
    this.ui = [];
    this.best = +(localStorage.getItem(BEST_KEY) || 0);
    this.state = 'menu';
    this.shake = 0;
    this.flash = 0;
    this.beltOff = 0;
    this.time = 0;
    this.day = 1;
    this.money = 0;
    this.rep = 100;
    this.totalEarned = 0;
    this.upgrades = {};
    this.cfg = dayConfig(1);
    this.customers = [];
    this.plates = [];
    this.rats = [];
    this.fires = [];
    this.picked = null;
    this.served = 0;
    this.seats = [120, 300, 480, 660, 840].map(x => ({ x, y: 195, busy: false }));
    this.buildMenu();
  }

  lvl(id) { return this.upgrades[id] || 0; }
  plateCost() { return this.lvl('rice') > 0 ? 1 : 2; }

  addText(x, y, txt, color = '#fff') {
    this.texts.push({ x, y, txt, color, t: 0, life: 1.2 });
  }

  // ---------- state builders ----------
  buildMenu() {
    this.state = 'menu';
    this.ui = [
      new Button(W / 2 - 110, 380, 220, 60, 'OPEN SHOP', () => { sfx('click'); this.startRun(); }, { color: '#c2452d', glow: '#ff9a6a', fontSize: 22 }),
      this.muteButton(560),
    ];
  }

  muteButton(y) {
    return new Button(W / 2 - 110, y, 220, 44, isMuted() ? 'SOUND: OFF' : 'SOUND: ON', (g) => { toggleMute(); g.rebuildCurrent(); }, { color: '#2a3560' });
  }

  rebuildCurrent() {
    if (this.state === 'menu') this.buildMenu();
    else if (this.state === 'shop') this.buildShop();
    else if (this.state === 'gameover') this.buildGameOver();
    else if (this.state === 'paused') this.buildPaused();
    else if (this.state === 'playing') this.buildPlayingUI();
  }

  buildPlayingUI() {
    this.ui = [];
    for (let i = 0; i < 4; i++) {
      const t = i;
      this.ui.push(new Button(170 + i * 150, 548, 130, 78, SUSHI[t].name, (g) => g.buyPlate(t), {
        color: '#233a5c',
        sub: `$${this.plateCost()}  [${t + 1}]`,
        sushi: t,
        disabled: (g) => g.money < g.plateCost(),
      }));
    }
    this.ui.push(new Button(872, 10, 36, 36, 'II', (g) => g.pause(), { color: '#2a3560', fontSize: 14 }));
    this.ui.push(new Button(914, 10, 36, 36, isMuted() ? 'X' : 'M', (g) => { toggleMute(); g.rebuildCurrent(); }, { color: '#2a3560', fontSize: 14 }));
  }

  buildPaused() {
    this.state = 'paused';
    this.ui = [
      new Button(W / 2 - 100, 300, 200, 54, 'RESUME', () => { sfx('click'); this.state = 'playing'; this.buildPlayingUI(); }, { color: '#2d7a4f' }),
      new Button(W / 2 - 100, 368, 200, 54, 'QUIT TO MENU', () => { sfx('click'); this.buildMenu(); }, { color: '#7a2d2d' }),
      this.muteButton(440),
    ];
  }

  buildShop() {
    this.state = 'shop';
    this.ui = [];
    UPGRADES.forEach((u, i) => {
      this.ui.push(new Button(180 + (i % 3) * 210, 250 + Math.floor(i / 3) * 110, 190, 90, u.name, (g) => g.buyUpgrade(u), {
        color: '#2a3560',
        sub: '',
        fontSize: 15,
        upgrade: u,
        disabled: (g) => g.lvl(u.id) >= u.max || g.money < u.cost(g.lvl(u.id)),
      }));
    });
    this.ui.push(new Button(W / 2 - 120, 500, 240, 60, `START DAY ${this.day}`, () => { sfx('click'); this.startDay(); }, { color: '#c2452d', glow: '#ff9a6a', fontSize: 20 }));
    this.ui.push(this.muteButton(576));
  }

  buildGameOver() {
    this.state = 'gameover';
    this.ui = [
      new Button(W / 2 - 110, 400, 220, 56, 'TRY AGAIN', () => { sfx('click'); this.startRun(); }, { color: '#c2452d', glow: '#ff9a6a' }),
      new Button(W / 2 - 110, 468, 220, 50, 'MENU', () => { sfx('click'); this.buildMenu(); }, { color: '#2a3560' }),
      this.muteButton(534),
    ];
  }

  // ---------- run / day ----------
  startRun() {
    this.day = 1;
    this.money = 20;
    this.rep = 100;
    this.totalEarned = 0;
    this.upgrades = {};
    startMusic();
    this.startDay();
  }

  startDay() {
    this.cfg = dayConfig(this.day);
    this.customers = [];
    this.plates = [];
    this.rats = [];
    this.fires = [];
    this.picked = null;
    this.served = 0;
    this.seats.forEach(s => s.busy = false);
    this.spawnT = 1.2;
    this.ratT = this.cfg.ratEvery * (0.6 + Math.random() * 0.6);
    this.fireT = this.cfg.fireEvery * (0.6 + Math.random() * 0.6);
    this.roachT = this.cfg.roachEvery * (0.6 + Math.random() * 0.6);
    this.dayEndT = null;
    this.state = 'playing';
    this.buildPlayingUI();
  }

  pause() {
    if (this.state !== 'playing') return;
    sfx('click');
    this.buildPaused();
  }

  finishDay() {
    const bonus = 10 + this.day * 5;
    this.money += bonus;
    this.totalEarned += bonus;
    this.shopBonus = bonus;
    this.day++;
    this.buildShop();
  }

  gameOver() {
    this.rep = 0;
    this.best = Math.max(this.best, this.totalEarned);
    localStorage.setItem(BEST_KEY, String(this.best));
    sfx('gameover');
    this.buildGameOver();
  }

  // ---------- economy / events ----------
  buyPlate(type) {
    if (this.state !== 'playing') return;
    const cost = this.plateCost();
    if (this.money < cost) { sfx('bad'); return; }
    this.money -= cost;
    const p = new Plate(type, 50, BELT_Y);
    p.pop = 0.25;
    this.plates.push(p);
    this.particles.burst(50, BELT_Y, SUSHI[type].color, 8, 90, 0.4, 3);
    sfx('buy');
  }

  buyUpgrade(u) {
    const l = this.lvl(u.id);
    if (l >= u.max) { sfx('bad'); return; }
    const cost = u.cost(l);
    if (this.money < cost) { sfx('bad'); return; }
    this.money -= cost;
    this.upgrades[u.id] = l + 1;
    sfx('coin');
    this.buildShop();
  }

  onServed(plate, customer) {
    const idx = this.plates.indexOf(plate);
    if (idx >= 0) this.plates.splice(idx, 1);
    if (!customer || customer.state !== 'waiting') return;
    const base = SUSHI[plate.type].price;
    const tipMult = (customer.p / customer.maxP) * (0.5 + 0.3 * this.lvl('lucky'));
    const tip = Math.round(base * tipMult);
    const total = base + tip;
    this.money += total;
    this.totalEarned += total;
    this.served++;
    customer.state = 'happy';
    customer.t = 0;
    this.particles.burst(customer.x, customer.y - 40, '#ffd23f', 16, 140, 0.7, 4);
    this.particles.burst(customer.x, customer.y - 40, SUSHI[plate.type].color, 10, 110, 0.5, 3);
    this.addText(customer.x, customer.y - 100, `+$${total}`, '#ffd23f');
    sfx('serve');
    sfx('coin');
  }

  onAngry(c) {
    this.rep -= 12;
    this.flash = 1;
    this.shake = 9;
    this.addText(c.x, c.y - 100, 'ANGRY! -12 REP', '#ff5a5a');
    sfx('angry');
    if (this.rep <= 0) this.gameOver();
  }

  drainRep(n) {
    if (this.state !== 'playing') return;
    this.rep -= n;
    this.flash = Math.max(this.flash, 0.25);
    if (this.rep <= 0) this.gameOver();
  }

  removePlate(plate, stolen) {
    const idx = this.plates.indexOf(plate);
    if (idx >= 0) this.plates.splice(idx, 1);
    if (plate === this.picked) this.picked = null;
    if (stolen) {
      this.rep -= 6;
      this.flash = Math.max(this.flash, 0.5);
      this.addText(plate.x, plate.y - 40, 'RAT! -6 REP', '#ff9a5a');
      sfx('rat');
      if (this.rep <= 0) this.gameOver();
    }
  }

  removeRat(rat) {
    const idx = this.rats.indexOf(rat);
    if (idx >= 0) this.rats.splice(idx, 1);
  }

  // ---------- input ----------
  press(x, y) {
    for (const b of this.ui) {
      if (b.contains(x, y) && !b.isDisabled(this)) { b.action(this); return; }
    }
    if (this.state !== 'playing') return;

    // fires first
    for (let i = this.fires.length - 1; i >= 0; i--) {
      const f = this.fires[i];
      if (Math.hypot(x - f.x, y - f.y + 15) < 44) {
        f.hp -= this.lvl('ext') > 0 ? 99 : 1;
        sfx('ext');
        this.particles.burst(f.x, f.y - 15, '#cfe8ff', 14, 130, 0.5, 4);
        if (f.hp <= 0) {
          this.fires.splice(i, 1);
          this.addText(f.x, f.y - 60, 'OUT!', '#9fe6ff');
          this.money += 3;
          this.totalEarned += 3;
        }
        return;
      }
    }
    // rats
    for (let i = this.rats.length - 1; i >= 0; i--) {
      const r = this.rats[i];
      if (Math.hypot(x - r.x, y - r.y) < 30) {
        this.rats.splice(i, 1);
        this.particles.burst(r.x, r.y, '#b0b6c8', 18, 150, 0.6, 4);
        this.money += 5;
        this.totalEarned += 5;
        this.addText(r.x, r.y - 30, '+$5', '#ffd23f');
        sfx('squash');
        return;
      }
    }
    // customers (serve)
    if (this.picked) {
      for (const c of this.customers) {
        if (c.state === 'waiting' && Math.hypot(x - c.x, y - (c.y - 20)) < 55) {
          if (c.type === this.picked.type) {
            this.picked.picked = false;
            this.picked.fly = { fx: this.picked.x, fy: this.picked.y, tx: c.x, ty: c.y - 10, t: 0, dur: 0.35, target: c };
            this.picked = null;
          } else {
            c.p = Math.max(0.5, c.p - 2);
            c.wrongFlash = 0.4;
            this.addText(c.x, c.y - 100, 'WRONG ORDER!', '#ff9a5a');
            sfx('bad');
          }
          return;
        }
      }
    }
    // plates
    for (let i = this.plates.length - 1; i >= 0; i--) {
      const p = this.plates[i];
      if (p.contains(x, y) && !p.fly) {
        if (p.contam) {
          p.contam = false;
          this.particles.burst(p.x, p.y - 14, '#8a5a2a', 12, 120, 0.5, 3);
          this.addText(p.x, p.y - 40, 'CLEANED!', '#a4f0c4');
          sfx('clean');
          return;
        }
        if (this.picked) {
          // swap: put old one back on belt
          this.picked.picked = false;
          this.picked.y = BELT_Y;
          this.picked.x = Math.max(40, Math.min(W - 50, x));
        }
        this.picked = p;
        p.picked = true;
        sfx('pick');
        return;
      }
    }
    // trash can
    if (this.picked && x > 855 && x < 950 && y > 460 && y < 540) {
      const p = this.picked;
      this.removePlate(p, false);
      this.money += 1;
      this.addText(900, 460, '+$1', '#ffd23f');
      this.particles.burst(902, 500, '#8a90a0', 8, 80, 0.4, 3);
      sfx('click');
      return;
    }
    // drop back on belt
    if (this.picked && y > BELT_Y - 50 && y < BELT_Y + 50) {
      this.picked.picked = false;
      this.picked.y = BELT_Y;
      this.picked.x = Math.max(40, Math.min(W - 60, x));
      this.picked = null;
      sfx('click');
      return;
    }
    // cancel pick on empty click
    if (this.picked) {
      this.picked.picked = false;
      this.picked.y = BELT_Y;
      this.picked.x = Math.max(40, Math.min(W - 60, this.picked.x));
      this.picked = null;
    }
  }

  key(k) {
    if (k === 'm') { toggleMute(); this.rebuildCurrent(); return; }
    if (this.state === 'playing') {
      if (k >= '1' && k <= '4') { this.buyPlate(+k - 1); return; }
      if (k === 'p') { this.pause(); return; }
      if (k === 'escape') {
        if (this.picked) { this.picked.picked = false; this.picked.y = BELT_Y; this.picked = null; }
        else this.pause();
        return;
      }
    } else if (this.state === 'paused' && (k === 'p' || k === 'escape')) {
      this.state = 'playing';
      this.buildPlayingUI();
    }
  }

  // ---------- update ----------
  update(dt) {
    this.time += dt;
    this.particles.update(dt);
    for (let i = this.texts.length - 1; i >= 0; i--) {
      const t = this.texts[i];
      t.t += dt;
      t.y -= 30 * dt;
      if (t.t > t.life) this.texts.splice(i, 1);
    }
    this.shake = Math.max(0, this.shake - dt * 30);
    this.flash = Math.max(0, this.flash - dt * 2);
    if (this.state !== 'playing') return;

    this.beltOff = (this.beltOff + this.cfg.beltSpeed * dt) % 40;

    // day end
    if (this.dayEndT !== null) {
      this.dayEndT -= dt;
      if (this.dayEndT <= 0) { sfx('dayend'); this.finishDay(); }
      return;
    }

    // spawn customers
    if (this.served + this.customers.filter(c => c.state === 'waiting').length < this.cfg.goal) {
      this.spawnT -= dt;
      if (this.spawnT <= 0) {
        const free = this.seats.filter(s => !s.busy);
        if (free.length) {
          const seat = free[Math.floor(Math.random() * free.length)];
          seat.busy = true;
          const pat = this.cfg.patience * (1 + 0.25 * this.lvl('patience'));
          this.customers.push(new Customer(seat, Math.floor(Math.random() * 4), pat));
          this.spawnT = this.cfg.custInterval * (0.7 + Math.random() * 0.6);
        } else {
          this.spawnT = 0.5;
        }
      }
    }

    // hazards
    if (this.cfg.rats && this.rats.length < 2) {
      this.ratT -= dt;
      if (this.ratT <= 0) {
        const sp = (70 + this.day * 6) * (this.lvl('trap') > 0 ? 0.45 : 1);
        this.rats.push(new Rat(BELT_Y + 12, Math.random() < 0.5 ? 1 : -1, sp));
        sfx('rat');
        this.ratT = this.cfg.ratEvery * (0.7 + Math.random() * 0.7);
      }
    }
    if (this.cfg.fires && this.fires.length < (this.day >= 6 ? 2 : 1)) {
      this.fireT -= dt;
      if (this.fireT <= 0) {
        this.fires.push(new Fire(150 + Math.random() * 660, BELT_Y + 8, this.lvl('ext') > 0 ? 1 : 3));
        sfx('alarm');
        sfx('fire');
        this.shake = Math.max(this.shake, 5);
        this.fireT = this.cfg.fireEvery * (0.7 + Math.random() * 0.7);
      }
    }
    if (this.cfg.roaches) {
      this.roachT -= dt;
      if (this.roachT <= 0) {
        const clean = this.plates.filter(p => !p.contam && !p.fly && !p.picked);
        if (clean.length) {
          const p = clean[Math.floor(Math.random() * clean.length)];
          p.contam = true;
          this.addText(p.x, p.y - 40, 'ROACH!', '#c4e35a');
          sfx('bad');
        }
        this.roachT = this.cfg.roachEvery * (0.7 + Math.random() * 0.7);
      }
    }

    // update entities
    for (const c of this.customers) c.update(dt, this);
    for (const p of [...this.plates]) {
      p.update(dt, this);
      if (!p.picked && !p.fly && p.x > W - 35) {
        this.removePlate(p, false);
        this.particles.burst(W - 35, BELT_Y, '#8a90a0', 6, 70, 0.4, 3);
      }
    }
    for (const r of [...this.rats]) r.update(dt, this);
    for (const f of this.fires) {
      f.update(dt, this);
      // burn plates passing through
      for (const p of [...this.plates]) {
        if (!p.picked && !p.fly && Math.abs(p.x - f.x) < 32) {
          this.particles.burst(p.x, p.y, '#ff7a00', 14, 120, 0.5, 4);
          this.removePlate(p, false);
          sfx('fire');
        }
      }
    }
    // remove finished customers
    for (let i = this.customers.length - 1; i >= 0; i--) {
      const c = this.customers[i];
      if (c.state !== 'waiting' && c.t > 0.8) {
        c.seat.busy = false;
        this.customers.splice(i, 1);
      }
    }
    // day complete?
    if (this.served >= this.cfg.goal) {
      this.dayEndT = 1.6;
      // clear remaining hazards gently
      this.rats = [];
      this.fires = [];
      for (const c of this.customers) {
        if (c.state === 'waiting') { c.state = 'happy'; c.t = 0; }
      }
    }
  }

  // ---------- draw ----------
  draw(ctx) {
    drawBG(ctx, this.day);
    if (this.state === 'menu') { this.drawMenu(ctx); return; }
    if (this.state === 'gameover') { this.drawGameOver(ctx); return; }
    if (this.state === 'shop') { this.drawShop(ctx); return; }

    ctx.save();
    if (this.shake > 0) ctx.translate((Math.random() - 0.5) * this.shake, (Math.random() - 0.5) * this.shake);
    this.drawScene(ctx);
    ctx.restore();

    // red damage flash
    if (this.flash > 0) {
      const g = ctx.createRadialGradient(W / 2, H / 2, H / 3, W / 2, H / 2, H);
      g.addColorStop(0, 'rgba(255,0,0,0)');
      g.addColorStop(1, `rgba(255,30,30,${0.35 * this.flash})`);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    }

    if (this.state === 'paused') {
      ctx.fillStyle = 'rgba(5,8,18,0.7)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 44px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('PAUSED', W / 2, 240);
    }

    for (const b of this.ui) b.draw(ctx, b.contains(this.pointer.x, this.pointer.y), this);

    // floating texts
    for (const t of this.texts) {
      ctx.globalAlpha = Math.max(0, 1 - t.t / t.life);
      ctx.fillStyle = t.color;
      ctx.font = 'bold 17px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(t.txt, t.x, t.y);
      ctx.globalAlpha = 1;
    }
    this.particles.draw(ctx);

    if (this.dayEndT !== null) {
      ctx.fillStyle = '#ffd23f';
      ctx.font = 'bold 52px system-ui';
      ctx.textAlign = 'center';
      ctx.shadowColor = '#ff9a00'; ctx.shadowBlur = 24;
      ctx.fillText(`DAY ${this.day} COMPLETE!`, W / 2, H / 2);
      ctx.shadowBlur = 0;
    }
  }

  drawScene(ctx) {
    // counter
    const cg = ctx.createLinearGradient(0, 240, 0, 300);
    cg.addColorStop(0, '#8a5a30');
    cg.addColorStop(1, '#5e3a1c');
    ctx.fillStyle = cg;
    ctx.fillRect(0, 240, W, 60);
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.fillRect(0, 240, W, 6);

    // conveyor belt
    ctx.fillStyle = '#2b3040';
    roundRect(ctx, 20, BELT_Y - 32, W - 40, 70, 14);
    ctx.fill();
    ctx.fillStyle = '#3a4157';
    roundRect(ctx, 28, BELT_Y - 24, W - 56, 54, 10);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 3;
    for (let x = 28 - this.beltOff; x < W - 28; x += 40) {
      ctx.beginPath(); ctx.moveTo(x, BELT_Y - 22); ctx.lineTo(x, BELT_Y + 28); ctx.stroke();
    }

    // trash can
    ctx.fillStyle = '#4a5064';
    roundRect(ctx, 862, 468, 76, 66, 8);
    ctx.fill();
    ctx.fillStyle = '#2c3140';
    roundRect(ctx, 858, 462, 84, 12, 6);
    ctx.fill();
    ctx.fillStyle = '#aab2c8';
    ctx.font = 'bold 11px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('TRASH', 900, 505);

    // entities
    for (const c of this.customers) c.draw(ctx);
    for (const p of this.plates) if (!p.picked) p.draw(ctx);
    for (const r of this.rats) r.draw(ctx);
    for (const f of this.fires) f.draw(ctx);
    if (this.picked) {
      ctx.save();
      ctx.shadowColor = '#7fd4ff'; ctx.shadowBlur = 20;
      this.picked.draw(ctx);
      ctx.restore();
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.font = '12px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('click a customer to serve', this.picked.x, this.picked.y + 42);
    }

    this.drawHUD(ctx);
  }

  drawHUD(ctx) {
    // top bar
    ctx.fillStyle = 'rgba(8,10,22,0.75)';
    roundRect(ctx, 8, 8, 700, 38, 10);
    ctx.fill();
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffd23f';
    ctx.font = 'bold 20px system-ui';
    ctx.fillText(`$${this.money}`, 22, 28);
    // rep bar
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    roundRect(ctx, 130, 18, 180, 18, 9); ctx.fill();
    const rk = Math.max(0, this.rep) / 100;
    ctx.fillStyle = rk > 0.5 ? '#6fe388' : rk > 0.25 ? '#ffc44d' : '#ff5a5a';
    roundRect(ctx, 130, 18, 180 * rk, 18, 9); ctx.fill();
    ctx.fillStyle = '#0b0e1a';
    ctx.font = 'bold 12px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText(`REP ${Math.ceil(Math.max(0, this.rep))}`, 220, 28);
    ctx.fillStyle = '#9fe6ff';
    ctx.font = 'bold 16px system-ui';
    ctx.textAlign = 'left';
    ctx.fillText(`DAY ${this.day}`, 340, 28);
    ctx.fillStyle = '#fff';
    ctx.fillText(`SERVED ${this.served}/${this.cfg.goal}`, 430, 28);
    // hazard warnings legend
    ctx.font = '11px system-ui';
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    let legend = '';
    if (this.cfg.rats) legend += 'RATS ';
    if (this.cfg.fires) legend += 'FIRE ';
    if (this.cfg.roaches) legend += 'ROACHES';
    if (legend) ctx.fillText('TONIGHT: ' + legend, 570, 28);
  }

  drawMenu(ctx) {
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ff7a59';
    ctx.font = 'bold 64px system-ui';
    ctx.shadowColor = '#ff9a4d'; ctx.shadowBlur = 30;
    ctx.fillText('SUSHI PANIC!', W / 2, 150);
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#9fe6ff';
    ctx.font = 'italic 20px system-ui';
    ctx.fillText('serve the sushi... then the bad things happen', W / 2, 195);
    // decorative sushi
    for (let i = 0; i < 4; i++) drawSushiIcon(ctx, i, W / 2 - 120 + i * 80, 255, 1.6);
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.font = '15px system-ui';
    ctx.fillText('Make sushi with the buttons (or keys 1-4). Click a plate, then click the matching customer.', W / 2, 305);
    ctx.fillText('Squash rats, douse fires, clean roaches — before your reputation hits zero!', W / 2, 330);
    ctx.fillStyle = '#ffd23f';
    ctx.font = 'bold 18px system-ui';
    ctx.fillText(`BEST EARNINGS: $${this.best}`, W / 2, 480);
    for (const b of this.ui) b.draw(ctx, b.contains(this.pointer.x, this.pointer.y), this);
    this.particles.draw(ctx);
  }

  drawShop(ctx) {
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd23f';
    ctx.font = 'bold 40px system-ui';
    ctx.fillText(`DAY ${this.day - 1} SURVIVED!`, W / 2, 110);
    ctx.fillStyle = '#6fe388';
    ctx.font = 'bold 20px system-ui';
    ctx.fillText(`Day bonus: +$${this.shopBonus}    Money: $${this.money}`, W / 2, 155);
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.font = '16px system-ui';
    ctx.fillText(`Prepare for Day ${this.day} — it will be worse.`, W / 2, 195);

    for (const b of this.ui) {
      b.draw(ctx, b.contains(this.pointer.x, this.pointer.y), this);
      if (b.opts.upgrade) {
        const u = b.opts.upgrade;
        const l = this.lvl(u.id);
        ctx.textAlign = 'center';
        ctx.font = '12px system-ui';
        if (l >= u.max) {
          ctx.fillStyle = '#6fe388';
          ctx.fillText('MAXED OUT', b.x + b.w / 2, b.y + b.h - 14);
        } else {
          ctx.fillStyle = this.money >= u.cost(l) ? '#ffd23f' : '#8a5060';
          ctx.fillText(`$${u.cost(l)}  (owned ${l}/${u.max})`, b.x + b.w / 2, b.y + b.h - 14);
        }
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.font = '12px system-ui';
        ctx.fillText(u.desc, b.x + b.w / 2, b.y + b.h + 14);
      }
    }
    this.particles.draw(ctx);
  }

  drawGameOver(ctx) {
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ff5a5a';
    ctx.font = 'bold 54px system-ui';
    ctx.shadowColor = '#ff2020'; ctx.shadowBlur = 26;
    ctx.fillText('RESTAURANT CLOSED!', W / 2, 170);
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.font = '19px system-ui';
    ctx.fillText('The health inspector finally shut you down.', W / 2, 220);
    ctx.fillStyle = '#9fe6ff';
    ctx.font = 'bold 22px system-ui';
    ctx.fillText(`Survived to Day ${this.day}   ·   Total earned: $${this.totalEarned}`, W / 2, 280);
    ctx.fillStyle = '#ffd23f';
    ctx.fillText(`BEST: $${this.best}`, W / 2, 320);
    for (const b of this.ui) b.draw(ctx, b.contains(this.pointer.x, this.pointer.y), this);
    this.particles.draw(ctx);
  }
}