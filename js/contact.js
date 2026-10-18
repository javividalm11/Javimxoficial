(() => {
  'use strict';
  const form = document.getElementById('proposalForm');
  if (form) {
    const message = document.getElementById('proposalMessage');
    const name = document.getElementById('proposalName');
    const counter = document.getElementById('proposalCounter');
    const status = document.getElementById('proposalStatus');
    message.addEventListener('input', () => {
      counter.textContent = `${message.value.length}/500`;
    });
    form.addEventListener('input', (event) => {
      if (typeof event.target.setCustomValidity === 'function') event.target.setCustomValidity('');
    });
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const translate = (text) => window.PortfolioI18n?.t(text) || text;
      name.setCustomValidity(name.value.trim().length < 2 ? translate('Escribe tu nombre.') : '');
      message.setCustomValidity(
        message.value.trim().length < 10
          ? translate('Cuéntame un poco más sobre tu proyecto (al menos 10 caracteres).')
          : ''
      );
      if (!form.reportValidity()) return;
      const values = new FormData(form);
      const proposal = [
        translate('Hola Javi, me gustaría trabajar contigo en un proyecto.'),
        '',
        `${translate('Nombre')}: ${String(values.get('name')).trim()}`,
        `Email: ${String(values.get('email')).trim()}`,
        `${translate('Tipo de proyecto')}: ${translate(values.get('project'))}`,
        `${translate('Presupuesto')}: ${translate(values.get('budget'))}`,
        '',
        translate('Sobre mi proyecto:'),
        String(values.get('message')).trim(),
      ].join('\n');
      const url = new URL(window.SITE.whatsappUrl());
      url.searchParams.set('text', proposal);
      window.open(url.href, '_blank', 'noopener,noreferrer');
      status.textContent = 'Propuesta preparada. Revísala y envíala en WhatsApp. ';
      const link = document.createElement('a');
      link.href = url.href;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = 'Abrir propuesta';
      link.style.textDecoration = 'underline';
      status.append(link);
    });
  }

  const canvas = document.getElementById('contactParticles');
  const scene = document.getElementById('contactScene');
  if (!canvas || !scene) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let width = 0,
    height = 0,
    dpr = 1,
    particles = [],
    raf = 0,
    last = 0,
    time = 0,
    visible = false;
  function resize() {
    width = scene.clientWidth;
    height = scene.clientHeight;
    dpr = Math.min(devicePixelRatio || 1, 1.75);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    const count = Math.min(150, Math.max(65, Math.round((width * height) / 11000)));
    particles = Array.from({ length: count }, () => ({
      x: Math.random(),
      y: Math.random(),
      vx: (Math.random() - 0.5) * 0.000007,
      vy: -(0.000003 + Math.random() * 0.000005),
      size: 0.4 + Math.random() * 1.3,
      phase: Math.random() * Math.PI * 2,
      bright: Math.random() > 0.86,
    }));
    draw(0);
  }
  function draw(dt) {
    if (!width || !height) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    const light = document.documentElement.dataset.theme === 'light';
    for (const p of particles) {
      if (dt) {
        p.x = (p.x + p.vx * dt + 1) % 1;
        p.y = (p.y + p.vy * dt + 1) % 1;
      }
      const x = p.x * width,
        y = p.y * height,
        alpha = 0.24 + 0.44 * (0.5 + 0.5 * Math.sin(time * 0.001 + p.phase));
      ctx.beginPath();
      ctx.arc(x, y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = light
        ? p.bright
          ? `rgba(185,126,35,${alpha})`
          : `rgba(131,71,166,${alpha * 0.65})`
        : p.bright
          ? `rgba(220,226,255,${alpha})`
          : `rgba(119,133,255,${alpha * 0.75})`;
      if (p.bright) {
        ctx.shadowColor = light ? '#e5b85d' : '#a0a8ff';
        ctx.shadowBlur = 8;
      }
      ctx.fill();
      ctx.shadowBlur = 0;
      if (p.bright && p.size > 1.2) {
        ctx.strokeStyle = `rgba(190,195,255,${alpha * 0.3})`;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(x - 3, y);
        ctx.lineTo(x + 3, y);
        ctx.moveTo(x, y - 3);
        ctx.lineTo(x, y + 3);
        ctx.stroke();
      }
    }
  }
  function frame(now) {
    raf = 0;
    if (!visible || document.hidden || reducedMotion.matches) return;
    const dt = last ? Math.min(now - last, 60) : 0;
    last = now;
    time += dt;
    draw(dt);
    raf = requestAnimationFrame(frame);
  }
  function sync() {
    cancelAnimationFrame(raf);
    raf = 0;
    last = 0;
    if (visible && !document.hidden && !reducedMotion.matches) raf = requestAnimationFrame(frame);
    else draw(0);
  }
  new ResizeObserver(resize).observe(scene);
  new IntersectionObserver(
    ([entry]) => {
      visible = entry.isIntersecting;
      sync();
    },
    { rootMargin: '100px' }
  ).observe(scene);
  document.addEventListener('visibilitychange', sync);
  reducedMotion.addEventListener('change', sync);
  resize();
})();
