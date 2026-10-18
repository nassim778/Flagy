/**
 * PlaneFX.js
 * Travel theme animation effects:
 * 1. Paper Airplane flight along a curved Bezier flight path with trailing dashed line.
 * 2. Rubber ink Passport Stamp impact burst.
 */

export class PlaneFX {
  constructor(canvasElement) {
    this.canvas = canvasElement;
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    this.activeAnimations = [];
    this.lastFrameTime = 0;
    this.isLoopRunning = false;

    if (this.canvas) {
      this.resize();
      window.addEventListener('resize', () => this.resize());
    }
  }

  resize() {
    if (!this.canvas) return;
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;
  }

  /**
   * Animates paper airplane flight from startPoint (x, y) to endPoint (x, y).
   * @param {Object} startPoint {x, y}
   * @param {Object} endPoint {x, y}
   * @param {Function} onComplete Callback when plane lands
   */
  flyPlane(startPoint, endPoint, onComplete) {
    if (!this.canvas || !this.ctx) {
      if (onComplete) onComplete();
      return;
    }

    this.resize();

    // Compute Bezier control point with an arc perpendicular to chord
    const dx = endPoint.x - startPoint.x;
    const dy = endPoint.y - startPoint.y;
    const chordLen = Math.hypot(dx, dy);

    // Arc curvature proportional to distance, curving upward
    const arcHeight = Math.min(120, Math.max(35, chordLen * 0.22));
    const midX = (startPoint.x + endPoint.x) / 2;
    const midY = (startPoint.y + endPoint.y) / 2;

    // Normal vector perpendicular to trajectory
    const nx = -dy / (chordLen || 1);
    const ny = dx / (chordLen || 1);

    // Bias arc upward
    const cpX = midX + nx * arcHeight;
    const cpY = midY + ny * arcHeight - Math.abs(arcHeight * 0.3);

    const animation = {
      type: 'plane',
      start: startPoint,
      cp: { x: cpX, y: cpY },
      end: endPoint,
      startTime: performance.now(),
      duration: Math.min(850, Math.max(500, chordLen * 0.9)),
      onComplete
    };

    this.activeAnimations.push(animation);
    if (!this.isLoopRunning) {
      this.isLoopRunning = true;
      requestAnimationFrame((t) => this.renderLoop(t));
    }
  }

  /**
   * Spawns stamp burst animation at target coordinates.
   */
  spawnStampEffect(point, countryName) {
    if (!this.canvas || !this.ctx) return;
    this.resize();

    const stampAnim = {
      type: 'stamp',
      x: point.x,
      y: point.y,
      text: countryName || 'VISITED',
      startTime: performance.now(),
      duration: 600
    };

    this.activeAnimations.push(stampAnim);
    if (!this.isLoopRunning) {
      this.isLoopRunning = true;
      requestAnimationFrame((t) => this.renderLoop(t));
    }
  }

  renderLoop(timestamp) {
    if (!this.ctx || !this.canvas) return;

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    const remaining = [];

    for (const anim of this.activeAnimations) {
      const elapsed = timestamp - anim.startTime;
      const progress = Math.min(1, elapsed / anim.duration);

      if (anim.type === 'plane') {
        this.renderFlight(anim, progress);
      } else if (anim.type === 'stamp') {
        this.renderStampBurst(anim, progress);
      }

      if (progress < 1) {
        remaining.push(anim);
      } else {
        if (typeof anim.onComplete === 'function') {
          anim.onComplete();
        }
      }
    }

    this.activeAnimations = remaining;

    if (this.activeAnimations.length > 0) {
      requestAnimationFrame((t) => this.renderLoop(t));
    } else {
      this.isLoopRunning = false;
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  /**
   * Quadratic Bezier point calculation: B(t) = (1-t)^2 P0 + 2(1-t)t P1 + t^2 P2
   */
  getBezierPoint(p0, p1, p2, t) {
    const inv = 1 - t;
    return {
      x: inv * inv * p0.x + 2 * inv * t * p1.x + t * t * p2.x,
      y: inv * inv * p0.y + 2 * inv * t * p1.y + t * t * p2.y
    };
  }

  /**
   * Tangent angle of Quadratic Bezier at t: B'(t) = 2(1-t)(P1 - P0) + 2t(P2 - P1)
   */
  getBezierTangent(p0, p1, p2, t) {
    const inv = 1 - t;
    const dx = 2 * inv * (p1.x - p0.x) + 2 * t * (p2.x - p1.x);
    const dy = 2 * inv * (p1.y - p0.y) + 2 * t * (p2.y - p1.y);
    return Math.atan2(dy, dx);
  }

  renderFlight(anim, progress) {
    const ctx = this.ctx;
    const { start, cp, end } = anim;

    // 1. Draw dashed flight trail up to current progress
    ctx.save();
    ctx.beginPath();
    ctx.setLineDash([5, 5]);
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#d97706'; // Warm golden trail
    ctx.lineCap = 'round';

    const steps = Math.floor(progress * 40);
    for (let i = 0; i <= steps; i++) {
      const t = (i / 40) * progress;
      const pt = this.getBezierPoint(start, cp, end, t);
      if (i === 0) ctx.moveTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);
    }
    ctx.stroke();
    ctx.restore();

    // 2. Draw Paper Airplane at current position
    const currentPt = this.getBezierPoint(start, cp, end, progress);
    const angle = this.getBezierTangent(start, cp, end, progress);

    ctx.save();
    ctx.translate(currentPt.x, currentPt.y);
    ctx.rotate(angle);

    // Subtle altitude shadow
    const altitude = Math.sin(progress * Math.PI) * 12;
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.translate(0, altitude);
    this.drawPaperPlanePath(ctx, 16);
    ctx.fill();
    ctx.restore();

    // Paper airplane body
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#2c3e50';
    ctx.lineWidth = 1.2;
    this.drawPaperPlanePath(ctx, 16);
    ctx.fill();
    ctx.stroke();

    // Center fold crease
    ctx.beginPath();
    ctx.moveTo(16, 0);
    ctx.lineTo(-12, 0);
    ctx.strokeStyle = '#bdc3c7';
    ctx.stroke();

    ctx.restore();
  }

  drawPaperPlanePath(ctx, size) {
    ctx.beginPath();
    ctx.moveTo(size, 0);                 // Nose
    ctx.lineTo(-size * 0.75, -size * 0.6); // Top wing tip
    ctx.lineTo(-size * 0.4, 0);          // Inner fold
    ctx.lineTo(-size * 0.75, size * 0.6);  // Bottom wing tip
    ctx.closePath();
  }

  renderStampBurst(anim, progress) {
    const ctx = this.ctx;
    const { x, y, text } = anim;

    // Scale bounce: 2.2 -> 1.0
    const scale = progress < 0.3
      ? 2.2 - (progress / 0.3) * 1.2
      : 1.0 + Math.sin((progress - 0.3) * Math.PI * 2) * 0.1;
    const alpha = progress > 0.7 ? 1.0 - (progress - 0.7) / 0.3 : 1.0;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-0.15); // Authentic tilted passport stamp
    ctx.scale(scale, scale);
    ctx.globalAlpha = alpha;

    // Stamp oval border
    ctx.beginPath();
    ctx.ellipse(0, 0, 52, 28, 0, 0, Math.PI * 2);
    ctx.strokeStyle = '#1565c0'; // Deep blue passport ink
    ctx.lineWidth = 2.5;
    ctx.setLineDash([4, 2]);
    ctx.stroke();

    // Inner text
    ctx.fillStyle = '#1565c0';
    ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('PASSPORT', 0, -8);
    ctx.font = 'bold 10px monospace';
    ctx.fillText(text.slice(0, 14).toUpperCase(), 0, 7);

    ctx.restore();
  }
}
