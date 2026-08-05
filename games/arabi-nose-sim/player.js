// ===== player.js =====

export class Player {
    constructor(x, y, input, audio, particles) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.width = 34;
        this.height = 48;
        this.facing = 1;
        this.onGround = false;
        this.dashTimer = 0;
        this.dashCooldown = 0;
        this.sneezeCooldown = 0;
        this.sneezeActive = false;
        this.sneezeRadius = 160;
        this.alive = true;
        this.invincibleTimer = 0;
        this.hp = 5;
        this.maxHp = 5;
        this.respawns = 2;
        this.dashDamage = 1;
        this.input = input;
        this.audio = audio;
        this.particles = particles;

        // Physics
        this.moveSpeed = 220;
        this.jumpForce = -420;
        this.gravity = 600;
        this.maxFallSpeed = 500;
        this.friction = 0.85;
        this.dashSpeed = 650;
        this.dashDuration = 0.18;

        // Anim state
        this.animTime = 0;
        this.wasOnGround = false;
        this.isDashing = false;
        this.prevX = x;
    }

    update(dt) {
        if (!this.alive) return;

        this.animTime += dt;
        const input = this.input;

        // Cooldowns
        if (this.dashCooldown > 0) this.dashCooldown -= dt;
        if (this.sneezeCooldown > 0) this.sneezeCooldown -= dt;
        if (this.invincibleTimer > 0) this.invincibleTimer -= dt;

        // Input
        let moveLeft = input.isDown('left');
        let moveRight = input.isDown('right');

        // Dash
        if (input.justPressed('dash') && this.dashCooldown <= 0 && this.dashTimer <= 0) {
            this.dashTimer = this.dashDuration;
            this.dashCooldown = 1.0;
            this.vx = this.facing * this.dashSpeed;
            this.isDashing = true;
            this.audio.playDash();
            this.particles.burst(this.x, this.y, 8, '#ffcc44');
        }

        // Jump
        if (input.justPressed('jump') && this.onGround) {
            this.vy = this.jumpForce;
            this.onGround = false;
            this.audio.playJump();
            this.particles.burst(this.x, this.y + 20, 6, '#e8d5a8');
        }

        // Sneeze
        if (input.justPressed('sneeze') && this.sneezeCooldown <= 0) {
            this.sneezeActive = true;
            this.sneezeCooldown = 5.0;
            this.audio.playSneeze();
            this.particles.burst(this.x, this.y, 30, '#a8e878');
        }

        // Movement
        if (this.dashTimer > 0) {
            this.dashTimer -= dt;
            // Dash continues
            if (this.dashTimer <= 0) {
                this.isDashing = false;
                this.vx *= 0.5;
            }
        } else {
            if (moveLeft) {
                this.vx = -this.moveSpeed;
                this.facing = -1;
            } else if (moveRight) {
                this.vx = this.moveSpeed;
                this.facing = 1;
            } else {
                this.vx *= this.friction;
                if (Math.abs(this.vx) < 5) this.vx = 0;
            }
        }

        // Gravity
        this.vy += this.gravity * dt;
        if (this.vy > this.maxFallSpeed) this.vy = this.maxFallSpeed;

        // Move X
        this.x += this.vx * dt;

        // Collision X
        if (this.level) {
            for (const plat of this.level.platforms) {
                if (overlap(this.x - this.width/2 + 2, this.y - this.height/2, this.width - 4, this.height - 2, plat.x, plat.y, plat.w, plat.h)) {
                    if (this.vx > 0) {
                        this.x = plat.x - this.width/2 - 0.1;
                    } else if (this.vx < 0) {
                        this.x = plat.x + plat.w + this.width/2 + 0.1;
                    }
                    this.vx = 0;
                }
            }
        }

        // Move Y
        this.y += this.vy * dt;
        this.onGround = false;

        if (this.level) {
            for (const plat of this.level.platforms) {
                if (overlap(this.x - this.width/2 + 2, this.y - this.height/2, this.width - 4, this.height - 2, plat.x, plat.y, plat.w, plat.h)) {
                    if (this.vy > 0) {
                        this.y = plat.y - this.height/2 - 0.1;
                        this.vy = 0;
                        this.onGround = true;
                    } else if (this.vy < 0) {
                        this.y = plat.y + plat.h + this.height/2 + 0.1;
                        this.vy = 0;
                    }
                }
            }
        }

        // Sneeze pop
        if (this.sneezeActive) {
            this.sneezeActive = false;
        }
    }

    takeDamage(amount) {
        if (this.invincibleTimer > 0 || !this.alive) return;
        this.hp -= amount;
        this.invincibleTimer = 1.0;
        this.sneezeCooldown = Math.max(this.sneezeCooldown, 2);
        if (this.hp <= 0) {
            this.alive = false;
        }
    }

    setLevel(level) {
        this.level = level;
    }

    render(ctx, time) {
        if (!this.alive && this.invincibleTimer <= 0) return;

        // Flash when invincible
        if (this.invincibleTimer > 0 && Math.sin(time * 20) > 0.3) {
            ctx.globalAlpha = 0.5;
        }

        const px = this.x;
        const py = this.y;

        // Shadow
        if (this.onGround) {
            ctx.fillStyle = 'rgba(0,0,0,0.2)';
            ctx.beginPath();
            ctx.ellipse(px, py + this.height / 2 + 2, 25, 5, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        // Body (robe)
        const robeGrad = ctx.createLinearGradient(px - 15, py - 10, px + 15, py + 25);
        robeGrad.addColorStop(0, '#f0e6d3');
        robeGrad.addColorStop(1, '#c8b89a');
        ctx.fillStyle = robeGrad;
        ctx.beginPath();
        ctx.moveTo(px - 12, py - 5);
        ctx.lineTo(px + 12, py - 5);
        ctx.lineTo(px + 17, py + 24);
        ctx.lineTo(px - 17, py + 24);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.15)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Belt
        ctx.fillStyle = '#d4a13a';
        ctx.fillRect(px - 15, py + 2, 30, 5);

        // Head
        ctx.fillStyle = '#e8c8a0';
        ctx.beginPath();
        ctx.arc(px, py - 14, 13, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.1)';
        ctx.stroke();

        // Turban
        ctx.fillStyle = '#c0392b';
        ctx.beginPath();
        ctx.ellipse(px, py - 23, 14, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#e8d5a8';
        ctx.beginPath();
        ctx.ellipse(px + 8, py - 24, 4, 2, 0.5, 0, Math.PI * 2);
        ctx.fill();

        // NOSE - the big feature
        const noseDir = this.facing;
        const noseBaseX = px + noseDir * 8;
        const noseBaseY = py - 12;

        ctx.fillStyle = '#d4a070';
        ctx.beginPath();
        // Big bulbous nose shape
        ctx.moveTo(noseBaseX, noseBaseY - 5);
        ctx.quadraticCurveTo(
            noseBaseX + noseDir * 25, noseBaseY - 8,
            noseBaseX + noseDir * 38, noseBaseY + 2
        );
        ctx.quadraticCurveTo(
            noseBaseX + noseDir * 34, noseBaseY + 8,
            noseBaseX + noseDir * 22, noseBaseY + 7
        );
        ctx.quadraticCurveTo(
            noseBaseX + noseDir * 12, noseBaseY + 10,
            noseBaseX + noseDir * 4, noseBaseY + 5
        );
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.1)';
        ctx.stroke();

        // Nose highlight
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.beginPath();
        ctx.ellipse(noseBaseX + noseDir * 20, noseBaseY - 2, 8, 3, noseDir * 0.3, 0, Math.PI * 2);
        ctx.fill();

        // Nostrils
        ctx.fillStyle = 'rgba(80,40,0,0.4)';
        ctx.beginPath();
        ctx.ellipse(noseBaseX + noseDir * 32, noseBaseY + 2, 4, 2.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Eyes
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(px - np(2, this.facing), py - 16, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#2c3e50';
        ctx.beginPath();
        ctx.arc(px - np(2, this.facing), py - 16, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Dash effect
        if (this.dashTimer > 0) {
            ctx.fillStyle = 'rgba(255,200,80,0.4)';
            ctx.beginPath();
            ctx.ellipse(px - this.facing * 10, this.y, 15, 12, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.globalAlpha = 1;
    }
}

function np(val, facing) { return val * facing; }

function overlap(ax, ay, aw, ah, bx, by, bw, bh) {
    return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}