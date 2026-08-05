import { supportAt, rampAt, wallCollision } from './world.js';
import { clamp } from './engine.js';

export class Player {
  constructor() {
    this.reset();
  }
  reset() {
    this.x = 0; this.y = 0; this.z = 0;
    this.vx = 0; this.vy = 0;
    this.onGround = true;
    this.wx = 0.32; this.wy = 0.42; this.wz = 0.33;
    this.airTime = 0;
    this.landImpulse = 0;
    this.dead = false;
    this.invuln = 0;
    this.tilt = 0;
    this.jumpSquish = 0;
    this.fallStartZ = 0;
  }

  // Returns any event: { jump, ramp, crash, fall }
  update(dt, input, world, speed) {
    this.invuln = Math.max(0, this.invuln - dt);
    // --- steering ---
    this.vx += (input.steer * 7.4 - this.vx) * Math.min(1, dt * 9);
    this.x += this.vx * dt;
    this.x = clamp(this.x, -2.72, 2.72);
    this.tilt += ((input.steer > 0 ? 0.35 : input.steer < 0 ? -0.35 : 0) - this.tilt) * Math.min(1, dt * 8);

    // --- forward motion (world approaches camera) ---
    const oldZ = this.z;
    this.z += speed * dt;

    // --- gravity & jump ---
    const G = 36;
    this.vy -= G * dt;

    const wantJump = input.consumeJump();
    if (wantJump) {
      if (this.onGround) {
        this.vy = 11.9;
        this.onGround = false;
        this.jumpSquish = 1;
        return { jump: true };
      }
    }

    this.y += this.vy * dt;

    // --- ground support ---
    const sup = supportAt(world, this.x, this.z);
    if (sup && this.vy <= 0.1 && this.y <= sup.y + 0.34 && this.y >= sup.y - 0.55) {
      const wasAir = !this.onGround;
      this.y = sup.y;
      this.vy = 0;
      this.onGround = true;
      if (wasAir && this.airTime > 0.08) this.landImpulse = clamp(this.airTime, 0, 1);
      this.airTime = 0;
    } else {
      this.onGround = false;
      this.airTime += dt;
      if (sup && this.y > sup.y + 0.34 && this.y < sup.y + 3.2) { /* flying over a block — fine */ }
    }

    // --- ramp boost ---
    if (this.onGround) {
      const rmp = rampAt(world, this.x, this.z);
      if (rmp) {
        this.onGround = false;
        this.vy = 14.2;
        this.jumpSquish = 1;
        return { ramp: true };
      }
    }

    // --- wall collision ---
    if (this.invuln <= 0) {
      const wall = wallCollision(world, this.x, this.y, oldZ, this.z, this.wx, this.wy);
      if (wall) {
        return { crash: true };
      }
    }

    // --- fell off map ---
    if (this.y < -9) {
      return { fall: true };
    }

    this.jumpSquish *= Math.max(0, 1 - dt * 5);
    return null;
  }
}