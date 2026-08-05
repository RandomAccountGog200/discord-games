// brainrot.js - Collectible item

export function createBrainrot(pos, level) {
    return {
        x: pos.x,
        y: pos.y,
        radius: 8,
        collected: false,
        pulse: Math.random() * 2 * Math.PI,
        color: '#7fff00'
    };
}

export function updateBrainrot(b, dt) {
    b.pulse += dt * 3;
}

export function drawBrainrot(ctx, b) {
    const scale = 1 + Math.sin(b.pulse) * 0.2;
    const radius = b.radius * scale;
    
    // Glow
    ctx.shadowBlur = 15;
    ctx.shadowColor = b.color;
    
    // Draw a brain-like shape using overlapping circles
    ctx.fillStyle = b.color;
    ctx.beginPath();
    ctx.arc(b.x, b.y, radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Add wrinkles
    ctx.strokeStyle = '#4cc300';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(b.x, b.y, radius * 0.7, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(b.x - radius*0.2, b.y - radius*0.2, radius*0.4, 0, Math.PI*2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(b.x + radius*0.2, b.y + radius*0.2, radius*0.4, 0, Math.PI*2);
    ctx.stroke();
    
    ctx.shadowBlur = 0;
    
    // Little eyes
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(b.x - 2, b.y - 2, 1.5, 0, Math.PI * 2);
    ctx.arc(b.x + 2, b.y + 2, 1.5, 0, Math.PI * 2);
    ctx.fill();
}