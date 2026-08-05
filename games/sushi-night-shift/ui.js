export class UI {
  constructor() {
    this.highScore = parseInt(localStorage.getItem('sushi-night-shift-highscore') || '0', 10) || 0;
    this.buttons = [];
    this.time = 0;
  }

  saveHighScore(score) {
    if (score > this.highScore) {
      this.highScore = score;
      localStorage.setItem('sushi-night-shift-highscore', String(this.highScore));
    }
  }

  renderTitle(ctx) {
    const w = 960, h = 640;
    // Background
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#1a0a12');
    grad.addColorStop(0.6, '#2d1b15');
    grad.addColorStop(1, '#0d0a14');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Decorative sushi floating
    ctx.save();
    for (let i = 0; i < 8; i++) {
      const t = this.time * 0.3 + i * 0.7;
      const x = 80 + i * 105 + Math.sin(t) * 20;
      const y = 300 + Math.sin(t * 1.3) * 30 + (i % 3) * 80;
      const alpha = 0.15 + Math.sin(t * 2) * 0.08;
      ctx.globalAlpha = Math.max(0.02, alpha);
      ctx.fillStyle = ['#ff7a6b', '#d94343', '#f2d63c'][i % 3];
      ctx.beginPath();
      ctx.ellipse(x, y, 25, 16, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // Title
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ff6b6b';
    ctx.font = 'bold 64px Courier New, monospace';
    ctx.shadowColor = '#ff0000';
    ctx.shadowBlur = 20;
    ctx.fillText('SUSHI', w / 2, 170);
    ctx.fillStyle = '#f2d63c';
    ctx.shadowColor = '#f2a000';
    ctx.font = 'bold 72px Courier New, monospace';
    ctx.fillText('NIGHT SHIFT', w / 2, 250);
    ctx.shadowBlur = 0;

    // Subtitle
    ctx.fillStyle = '#aaa';
    ctx.font = '18px Courier New, monospace';
    ctx.fillText('Serve sushi. Survive the shift.', w / 2, 300);

    // High score
    ctx.fillStyle = '#f2d63c';
    ctx.font = 'bold 20px Courier New, monospace';
    ctx.fillText(`HIGH SCORE: ${this.highScore}`, w / 2, 350);

    // Buttons
    this.buttons = [];
    const btn1 = { x: w / 2 - 120, y: 390, w: 240, h: 52, text: 'START SHIFT', action: 'start', colors: ['#d94343', '#a03030'] };
    const btn2 = { x: w / 2 - 120, y: 460, w: 240, h: 40, text: 'HOW TO PLAY', action: 'howto', colors: ['#666', '#444'] };
    this.buttons.push(btn1, btn2);

    for (const btn of this.buttons) {
      this.renderButton(ctx, btn);
    }
  }

  renderHowTo(ctx) {
    const w = 960, h = 640;
    ctx.fillStyle = 'rgba(0,0,0,0.88)';
    ctx.fillRect(0, 0, w, h);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#f2d63c';
    ctx.font = 'bold 36px Courier New, monospace';
    ctx.fillText('HOW TO PLAY', w / 2, 80);

    ctx.fillStyle = '#fff';
    ctx.font = '16px Courier New, monospace';
    const lines = [
      '1. Customers arrive at your sushi bar with an order.',
      '2. Click/Tap a sushi from your tray to select it.',
      '3. Click/Tap the customer to serve them.',
      '4. Serve the RIGHT sushi to the RIGHT customer!',
      '',
      'As the night progresses,'
    ];
    for (let i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], w / 2, 120 + i * 22);
    }

    // Back button
    this.buttons = [];
    const backBtn = { x: w / 2 - 60, y: 560, w: 120, h: 40, text: 'BACK', action: 'title', colors: ['#888', '#666'] };
    this.buttons.push(backBtn);
    for (const btn of this.buttons) {
      this.renderButton(ctx, btn);
    }
  }

  renderButton(ctx, btn) {
    const x = btn.x, y = btn.y, w = btn.w, h = btn.h;
    const grad = ctx.createLinearGradient(x, y, x, y + h);
    grad.addColorStop(0, btn.colors[0]);
    grad.addColorStop(1, btn.colors[1]);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 8);
    ctx.fill();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px Courier New, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(btn.text, x + w / 2, y + h / 2 + 1);
  }
}