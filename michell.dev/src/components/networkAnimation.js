export function initNetworkAnimation() {
  const canvas = document.getElementById("networkCanvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  let width = 0;
  let height = 0;
  let centerX = 0;
  let centerY = 0;
  let animationFrameId;

  const rings = [];
  const bgStars = [];

  let mouseOffset = { x: 0, y: 0 };
  let hoverAmount = 0;     // 0 = asleep, 1 = fully active
  let hoverTarget = 0;     // where we want to go, eased toward

  function resize() {
    const rect = canvas.parentElement.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    canvas.width = width;
    canvas.height = height;

    centerX = width / 2;
    centerY = height / 2;

    setupRings();
    initStars();
  }

  function setupRings() {
    rings.length = 0;

    const minDim = Math.min(width, height);
    const baseRadius = minDim * 0.28;

    // orbit configs: baseSpeed (when active), boost (extra speed on hover)
    rings.push(
      createRing(baseRadius * 0.7, 0.012, 0.006, 0.30),
      createRing(baseRadius * 1.05, -0.009, -0.005, 0.23),
      createRing(baseRadius * 1.45, 0.007, 0.004, 0.17)
    );
  }

  function createRing(radius, baseSpeed, boost, opacity) {
    const nodes = [];
    const count = Math.round(radius / 22); // a few more nodes on bigger rings

    for (let i = 0; i < count; i++) {
      const startAngle = (i / count) * Math.PI * 2;
      nodes.push({
        angle: startAngle,
        radius,
      });
    }

    return {
      radius,
      baseSpeed,
      boost,
      nodes,
      opacity,
    };
  }

  function initStars() {
    bgStars.length = 0;
    const count = 22;
    for (let i = 0; i < count; i++) {
      bgStars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        alpha: 0.08 + Math.random() * 0.12,
        radius: 0.5 + Math.random() * 1.0,
        pulse: Math.random() * Math.PI * 2,
        speed: 0.003 + Math.random() * 0.006,
      });
    }
  }

  function easeInOut(t) {
    // smooth curve, stays very small near 0 and 1
    return t < 0.5
      ? 2 * t * t
      : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }

  function drawCore() {
    const minDim = Math.min(width, height);
    const visibility = easeInOut(hoverAmount); // 0 → minimal, 1 → full
    const coreRadius = minDim * (0.02 + 0.06 * visibility);

    // core glow
    const gradient = ctx.createRadialGradient(
      centerX,
      centerY,
      0,
      centerX,
      centerY,
      coreRadius * 3.4
    );
    const coreAlpha = 0.2 + 0.6 * visibility;

    gradient.addColorStop(0, `rgba(59, 130, 246, ${coreAlpha})`);
    gradient.addColorStop(0.4, `rgba(59, 130, 246, ${0.3 * visibility})`);
    gradient.addColorStop(1, "rgba(15, 23, 42, 0)");

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, coreRadius * (2.0 + visibility), 0, Math.PI * 2);
    ctx.fill();

    // inner core
    ctx.fillStyle = "#020617";
    ctx.beginPath();
    ctx.arc(centerX, centerY, coreRadius * (0.9 + 0.4 * visibility), 0, Math.PI * 2);
    ctx.fill();

    // core outline
    ctx.strokeStyle = `rgba(148, 163, 184, ${0.4 + 0.4 * visibility})`;
    ctx.lineWidth = 1 + visibility * 0.8;
    ctx.beginPath();
    ctx.arc(centerX, centerY, coreRadius * (0.9 + 0.4 * visibility), 0, Math.PI * 2);
    ctx.stroke();

    // vertical beam only when really hovered
    if (visibility > 0.5) {
      const beamStrength = (visibility - 0.5) * 2; // 0 → 1 from 0.5 to 1
      const beamAlpha = 0.06 + 0.18 * beamStrength;
      const beamWidth = coreRadius * (0.5 + 0.6 * beamStrength);

      const beamGradient = ctx.createLinearGradient(
        centerX - beamWidth,
        0,
        centerX + beamWidth,
        0
      );
      beamGradient.addColorStop(0, "rgba(37, 99, 235, 0)");
      beamGradient.addColorStop(0.5, `rgba(59, 130, 246, ${beamAlpha})`);
      beamGradient.addColorStop(1, "rgba(37, 99, 235, 0)");

      ctx.fillStyle = beamGradient;
      ctx.fillRect(centerX - beamWidth, 0, beamWidth * 2, height);
    }
  }

  function drawStars() {
    const visibility = easeInOut(hoverAmount);
    bgStars.forEach((star) => {
      star.pulse += star.speed;
      const twinkle = Math.sin(star.pulse) * 0.06;
      const extra = visibility * 0.25;
      const alpha = star.alpha + twinkle + extra;

      ctx.fillStyle = `rgba(148, 163, 184, ${alpha})`;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function draw() {
    // background wipe (darker when idle, brighter when active)
    const visibility = easeInOut(hoverAmount);
    const bgAlpha = 0.96 - visibility * 0.05;
    ctx.fillStyle = `rgba(5, 7, 18, ${bgAlpha})`;
    ctx.fillRect(0, 0, width, height);

    drawStars();
    drawCore();

    // when idle, we still show a hint of rings but tiny/faint
    const offsetX = mouseOffset.x * (0.06 + visibility * 0.08);
    const offsetY = mouseOffset.y * (0.06 + visibility * 0.08);

    rings.forEach((ring) => {
      const visibleRadius = ring.radius * (0.25 + 0.75 * visibility);

      // orbit path
      const orbitAlpha = ring.opacity * (visibility * 1.1);
      if (orbitAlpha > 0.02) {
        ctx.strokeStyle = `rgba(30, 64, 175, ${orbitAlpha})`;
        ctx.lineWidth = 0.5 + visibility * 0.8;
        ctx.setLineDash([4, 7]);
        ctx.beginPath();
        ctx.arc(centerX + offsetX, centerY + offsetY, visibleRadius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // node positions
      const coords = ring.nodes.map((node) => {
        const x = centerX + offsetX + Math.cos(node.angle) * visibleRadius;
        const y = centerY + offsetY + Math.sin(node.angle) * visibleRadius;
        return { x, y };
      });

      // only connect nodes once we have some visibility
      if (visibility > 0.15) {
        ctx.lineWidth = 0.4 + visibility * 0.6;
        ctx.strokeStyle = `rgba(59, 130, 246, ${
          ring.opacity * (0.4 + 0.7 * visibility)
        })`;
        ctx.beginPath();
        coords.forEach((p, idx) => {
          const next = coords[(idx + 1) % coords.length];
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(next.x, next.y);
        });
        ctx.stroke();
      }

      // draw nodes: essentially invisible when idle, full when hovered
      coords.forEach((p, idx) => {
        const t = idx / coords.length;
        const baseRadius = 1.2 + t * 1.3;
        const nodeRadius = baseRadius * (0.4 + 1.6 * visibility);

        if (nodeRadius < 0.2) return;

        const g = ctx.createRadialGradient(
          p.x,
          p.y,
          0,
          p.x,
          p.y,
          nodeRadius * 4
        );
        const innerAlpha = (0.3 + 0.7 * visibility);
        const midAlpha = (0.15 + 0.55 * visibility);

        g.addColorStop(0, `rgba(59, 130, 246, ${innerAlpha})`);
        g.addColorStop(0.5, `rgba(59, 130, 246, ${midAlpha})`);
        g.addColorStop(1, "rgba(59, 130, 246, 0)");

        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(p.x, p.y, nodeRadius * 1.8, 0, Math.PI * 2);
        ctx.fill();
      });
    });
  }

  function update() {
    // Ease hoverAmount toward hoverTarget
    hoverAmount += (hoverTarget - hoverAmount) * 0.08;

    const visibility = easeInOut(hoverAmount);

    // When basically idle, hardly rotate; when hovered, animate more
    rings.forEach((ring) => {
      const spinFactor = visibility; // 0 = frozen, 1 = full motion
      const speed = ring.baseSpeed * spinFactor + hoverAmount * ring.boost * 3;
      ring.nodes.forEach((node) => {
        node.angle += speed;
      });
    });
  }

  function loop() {
    update();
    draw();
    animationFrameId = requestAnimationFrame(loop);
  }

  function handleResize() {
    resize();
  }

  function handleMouseMove(e) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;

    mouseOffset.x = (x / rect.width) * 24;
    mouseOffset.y = (y / rect.height) * 24;
  }

  function handlePointerEnter() {
    hoverTarget = 1; // fully "on"
  }

  function handlePointerLeave() {
    hoverTarget = 0; // go back to sleep
    mouseOffset.x = 0;
    mouseOffset.y = 0;
  }

  window.addEventListener("resize", handleResize);
  canvas.addEventListener("pointermove", handleMouseMove);
  canvas.addEventListener("pointerenter", handlePointerEnter);
  canvas.addEventListener("pointerleave", handlePointerLeave);

  // init
  handleResize();
  loop();

  // If you ever need to stop:
  // return () => cancelAnimationFrame(animationFrameId);
}