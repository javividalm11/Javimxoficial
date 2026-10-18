/* Firma en WebGL desde la imagen original. */
(function () {
  'use strict';
  const journey = document.getElementById('signatureJourney');
  const signature = document.getElementById('javiJourney');
  const visual = document.getElementById('javiIdentity');
  const canvas = document.getElementById('javiParticles');
  const waves = document.getElementById('javiWaves');
  if (!journey || !signature || !visual || !canvas || !waves) return;
  const motion = matchMedia('(prefers-reduced-motion:reduce)');
  const ctx = waves.getContext('2d');
  let gl,
    program,
    uniforms,
    points,
    count = 0,
    ready = false,
    visible = false;
  let width = 1,
    height = 1,
    dpr = 1,
    cx = 0,
    cy = 0,
    size = 1,
    time = 0,
    last = 0,
    frame = 0;
  let pointerX = 0,
    pointerY = 0,
    rotationX = 0,
    rotationY = 0,
    formation = 0,
    formationTarget = 0,
    sourceHeight = 1,
    helixRadius = 80;
  const random = (n) => {
    const x = Math.sin(n * 127.1 + 31.7) * 43758.5453;
    return x - Math.floor(x);
  };
  function shader(type, source) {
    const s = gl.createShader(type);
    gl.shaderSource(s, source);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw Error('WebGL no disponible');
    return s;
  }
  function initialize() {
    gl = canvas.getContext('webgl', {
      alpha: true,
      antialias: false,
      premultipliedAlpha: true,
      depth: false,
    });
    if (!gl) return;
    program = gl.createProgram();
    gl.attachShader(
      program,
      shader(
        gl.VERTEX_SHADER,
        `
      const float TURNS=5.0;
      attribute vec3 aPosition,aColor;attribute float aSeed,aKind;
      uniform vec2 uResolution,uCenter,uPointer;uniform float uSize,uDpr,uTime,uFormation,uSourceHeight,uHelixRadius;
      uniform mediump float uLight;
      varying vec3 vColor;varying float vAlpha;
      void main(){
        float seed=aSeed,kind=aKind;
        vec3 p=aPosition;
        float intro=smoothstep(seed*.08,1.0,uFormation);
        float yaw=sin(uTime*.23)*.08+uPointer.x*.20;
        float pitch=cos(uTime*.19)*.04+uPointer.y*.14;
        if(kind>.5){yaw=uTime*.10+uPointer.x*.25;pitch=.23+uPointer.y*.1;}
        p=vec3(p.x*cos(yaw)+p.z*sin(yaw),p.y,-p.x*sin(yaw)+p.z*cos(yaw));
        p=vec3(p.x,p.y*cos(pitch)-p.z*sin(pitch),p.y*sin(pitch)+p.z*cos(pitch));
        float perspective=1.7/(1.7-p.z);
        vec2 target=uCenter+p.xy*uSize*perspective;
        vec2 scatter=vec2(fract(sin(seed*117.2)*43758.54)*uResolution.x,
          fract(sin(seed*313.7)*96321.91)*uSourceHeight);
        scatter+=vec2(sin(uTime*.32+seed*51.0)*24.0,cos(uTime*.23+seed*37.0)*30.0);
        scatter.y=mod(scatter.y+uTime*12.0,uSourceHeight);
        float strand=step(.5,fract(sin(seed*91.7)*437.58));
        float angle=seed*TURNS*6.2832+strand*3.1416+uTime*.7;
        float helixDepth=sin(angle)*.5+.5;
        float radius=uHelixRadius*(1.0-intro*.5);
        vec2 helix=vec2(uCenter.x+cos(angle)*radius*(.85+helixDepth*.3),
          uSourceHeight*(.08+.84*seed));
        vec2 origin=kind>1.5?scatter:helix;
        vec2 pixel=mix(origin,target,intro);
        if(kind>1.5){
          pixel=vec2(origin.x,fract(seed+uTime*.004)*uResolution.y);
        }
        gl_Position=vec4(pixel/uResolution*vec2(2.0,-2.0)+vec2(-1.0,1.0),0.0,1.0);
        vColor=aColor;
        vAlpha=kind<.5?.9:(kind<1.5?(.15+max(0.0,p.z)*.9):.23);
        vAlpha*=mix(mix(.5,1.0,helixDepth),1.0,intro);
        vAlpha*=mix(1.0,.85,uLight);
        if(kind<-.5||kind>.5||seed>.65)vAlpha*=1.0-uLight;
        gl_PointSize=(kind<.5?2.1+seed*2.3:2.0+seed*2.0)*uDpr*perspective*mix(1.2,1.0,intro);
        gl_PointSize*=mix(1.0,.85,uLight);
      }`
      )
    );
    gl.attachShader(
      program,
      shader(
        gl.FRAGMENT_SHADER,
        `
      precision mediump float;uniform float uLight;varying vec3 vColor;varying float vAlpha;
      void main(){float d=length(gl_PointCoord-.5)*2.0;
        float alpha=(pow(max(0.0,1.0-d),2.0)*.65+(1.0-smoothstep(.0,.3,d))*.65)*vAlpha;
        float soft=pow(max(0.0,1.0-d),1.7)*vAlpha;
        alpha=mix(alpha,clamp(soft,0.0,1.0),uLight);
        vec3 ink=mix(vec3(.12,.13,.14),vec3(.23,.24,.25),clamp(vColor.r,0.0,1.0));
        gl_FragColor=vec4(mix(vColor,ink,uLight)*alpha,alpha);
      }`
      )
    );
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw Error('WebGL no disponible');
    gl.useProgram(program);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, points, gl.STATIC_DRAW);
    [
      ['aPosition', 3, 0],
      ['aColor', 3, 12],
      ['aSeed', 1, 24],
      ['aKind', 1, 28],
    ].forEach(([name, n, offset]) => {
      const a = gl.getAttribLocation(program, name);
      gl.enableVertexAttribArray(a);
      gl.vertexAttribPointer(a, n, gl.FLOAT, false, 32, offset);
    });
    uniforms = {};
    [
      'Resolution',
      'Center',
      'Pointer',
      'Size',
      'Dpr',
      'Time',
      'Formation',
      'SourceHeight',
      'HelixRadius',
      'Light',
    ].forEach((n) => (uniforms[n] = gl.getUniformLocation(program, 'u' + n)));
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    count = points.length / 8;
    ready = true;
    resize();
    journey.classList.add('is-rendered');
    schedule();
  }
  function resize() {
    width = journey.clientWidth;
    height = journey.clientHeight;
    dpr = Math.min(devicePixelRatio || 1, innerWidth <= 600 ? 1.25 : 1.5);
    const base = journey.getBoundingClientRect(),
      v = visual.getBoundingClientRect();
    cx = v.left - base.left + v.width / 2;
    cy = v.top - base.top + v.height / 2;
    sourceHeight = Math.max(1, signature.getBoundingClientRect().top - base.top);
    size = Math.min(v.width * 0.9, v.height * 1.65, 550);
    helixRadius = Math.min(width * 0.14, sourceHeight * 0.2, 130);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    waves.width = Math.round(width * dpr);
    waves.height = Math.round(height * dpr);
    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (ready) gl.viewport(0, 0, canvas.width, canvas.height);
    updateFormation();
    schedule();
  }
  function updateFormation() {
    const rect = signature.getBoundingClientRect();
    const travel = innerHeight * 0.35 + rect.height * 0.5;
    formationTarget = Math.max(0, Math.min(1, (innerHeight * 0.95 - rect.top) / travel));
  }
  function drawWaves() {
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);
    ctx.globalAlpha = formation;
    const isLight = document.documentElement.dataset.theme === 'light';
    const light = ctx.createRadialGradient(cx, cy, 0, cx, cy, size * 0.65);
    light.addColorStop(0, isLight ? '#36383c06' : '#9d4bff10');
    light.addColorStop(0.65, isLight ? '#36383c03' : '#9d4bff0c');
    light.addColorStop(1, '#9d4bff00');
    ctx.fillStyle = light;
    ctx.fillRect(cx - size, cy - size, size * 2, size * 2);
    const crossSlope = (signature.clientHeight * 0.64) / width;
    for (const direction of [-1, 1])
      for (let i = 0; i < 8; i++) {
        ctx.beginPath();
        for (let j = 0; j <= 80; j++) {
          const x = (j / 80) * width,
            local = (x - cx) / size;
          const amplitude = 12 + 20 * Math.exp(-local * local);
          const y =
            cy +
            (x - cx) * crossSlope * direction +
            Math.sin(local * 5.3 + i * 0.6 - time * 0.2) * amplitude +
            (i - 3.5) * 5;
          j ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
        }
        const color = ctx.createLinearGradient(0, 0, width, 0);
        color.addColorStop(0, isLight ? '#b47b1905' : '#a64dff05');
        color.addColorStop(
          Math.max(0.1, Math.min(0.9, cx / width)),
          isLight ? '#9654ba33' : '#a64dff55'
        );
        color.addColorStop(1, isLight ? '#c7953628' : '#29e0ef25');
        ctx.strokeStyle = color;
        ctx.lineWidth = i % 3 ? 0.6 : 1;
        ctx.stroke();
      }
    // Esfera Fibonacci proyectada en 3D.
    const shell = [];
    for (let i = 0; i < (isLight ? 0 : 100); i++) {
      const y = 1 - (2 * (i + 0.5)) / 100,
        r = Math.sqrt(1 - y * y),
        a = i * 2.399963 + time * 0.1;
      const x = Math.cos(a) * r * 0.59,
        z = Math.sin(a) * r * 0.59;
      const yy = y * 0.4,
        scale = 1.7 / (1.7 - z);
      shell.push({ x: cx + x * size * scale, y: cy + yy * size * scale, z, px: x, py: yy, pz: z });
    }
    for (let i = 0; i < shell.length; i++)
      for (let j = i + 1; j < shell.length; j++) {
        const a = shell[i],
          b = shell[j];
        if (Math.hypot(a.px - b.px, a.py - b.py, a.pz - b.pz) > 0.2) continue;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = isLight
          ? 'rgba(129,71,170,' + (0.025 + Math.max(0, a.z) * 0.1) + ')'
          : 'rgba(173,105,255,' + (0.035 + Math.max(0, a.z) * 0.15) + ')';
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
    const floor = cy + size * 0.47;
    ctx.save();
    ctx.translate(cx, floor);
    ctx.scale(1, 0.12);
    const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, size * 0.5);
    glow.addColorStop(0, isLight ? '#36383c14' : '#b47aff45');
    glow.addColorStop(0.3, isLight ? '#36383c08' : '#9747ff1a');
    glow.addColorStop(1, '#9d4bff00');
    ctx.fillStyle = glow;
    ctx.fillRect(-size, -size, size * 2, size * 2);
    ctx.restore();
  }
  function animate(now) {
    frame = 0;
    if (!visible || document.hidden || motion.matches || !ready) return;
    if (!last || now - last >= 1000 / 30) {
      const dt = last ? Math.min((now - last) / 1000, 0.1) : 1 / 30;
      time += dt;
      last = now;
      formation += (formationTarget - formation) * (1 - Math.exp(-dt * 7));
      rotationX += (pointerX - rotationX) * 0.07;
      rotationY += (pointerY - rotationY) * 0.07;
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform2f(uniforms.Resolution, width, height);
      gl.uniform2f(uniforms.Center, cx, cy);
      gl.uniform2f(uniforms.Pointer, rotationX, rotationY);
      gl.uniform1f(uniforms.Size, size);
      gl.uniform1f(uniforms.Dpr, dpr);
      gl.uniform1f(uniforms.Time, time);
      gl.uniform1f(uniforms.Formation, formation);
      gl.uniform1f(uniforms.SourceHeight, sourceHeight);
      gl.uniform1f(uniforms.HelixRadius, helixRadius);
      gl.uniform1f(uniforms.Light, document.documentElement.dataset.theme === 'light' ? 1 : 0);
      gl.drawArrays(gl.POINTS, 0, count);
      drawWaves();
    }
    frame = requestAnimationFrame(animate);
  }
  function schedule() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    last = 0;
    if (visible && !document.hidden && !motion.matches && ready)
      frame = requestAnimationFrame(animate);
  }
  const image = new Image();
  image.onload = () => {
    try {
      const sample = document.createElement('canvas');
      sample.width = 720;
      sample.height = Math.round((image.height / image.width) * 720);
      const c = sample.getContext('2d', { willReadFrequently: true });
      c.drawImage(image, 0, 0, sample.width, sample.height);
      const pixels = c.getImageData(0, 0, sample.width, sample.height).data,
        filled = [];
      const mask = new Uint8Array(sample.width * sample.height),
        clean = new Uint8Array(mask.length);
      for (let y = 0; y < sample.height; y++)
        for (let x = 0; x < sample.width; x++) {
          const o = (y * sample.width + x) * 4;
          if (pixels[o + 3] > 90 && Math.max(pixels[o], pixels[o + 1], pixels[o + 2]) > 70) {
            filled.push([x, y, o]);
            mask[y * sample.width + x] = 1;
          }
        }
      // Conserva trazos; descarta manchas aisladas.
      for (let start = 0; start < mask.length; start++) {
        if (!mask[start]) continue;
        const component = [start];
        mask[start] = 0;
        for (let n = 0; n < component.length; n++) {
          const at = component[n],
            x = at % sample.width,
            y = Math.floor(at / sample.width);
          for (let dy = -1; dy <= 1; dy++)
            for (let dx = -1; dx <= 1; dx++) {
              const xx = x + dx,
                yy = y + dy;
              if (xx < 0 || xx >= sample.width || yy < 0 || yy >= sample.height) continue;
              const next = yy * sample.width + xx;
              if (mask[next]) {
                mask[next] = 0;
                component.push(next);
              }
            }
        }
        if (component.length >= 200) for (const at of component) clean[at] = 1;
      }
      const data = [],
        step = Math.max(1, filled.length / (innerWidth <= 600 ? 6500 : 16000));
      for (let i = 0; i < filled.length; i += step) {
        const [x, y, o] = filled[Math.floor(i)],
          seed = random(i + 1);
        data.push(
          x / sample.width - 0.5,
          (y - sample.height / 2) / sample.width,
          (seed - 0.5) * 0.04,
          pixels[o] / 255,
          pixels[o + 1] / 255,
          pixels[o + 2] / 255,
          seed,
          clean[y * sample.width + x] ? 0 : -1
        );
      }
      const shellCount = innerWidth <= 600 ? 500 : 1100;
      for (let i = 0; i < shellCount; i++) {
        const y = 1 - (2 * (i + 0.5)) / shellCount,
          r = Math.sqrt(1 - y * y),
          a = i * 2.399963,
          seed = random(i + 8);
        data.push(
          Math.cos(a) * r * 0.59,
          y * 0.4,
          Math.sin(a) * r * 0.59,
          0.62,
          0.28 + seed * 0.25,
          1,
          seed,
          1
        );
      }
      for (let i = 0; i < 300; i++)
        data.push(0, 0, 0, i % 5 ? 0.65 : 0.16, i % 5 ? 0.3 : 0.88, 1, random(i + 31), 2);
      points = new Float32Array(data);
      initialize();
    } catch {
      ready = false;
      journey.classList.remove('is-rendered');
    }
  };
  image.src = './img/logo-transparent.png';
  new ResizeObserver(resize).observe(journey);
  new IntersectionObserver(
    (entries) => {
      visible = entries[0].isIntersecting;
      schedule();
    },
    { rootMargin: '100px' }
  ).observe(journey);
  journey.addEventListener(
    'pointermove',
    (e) => {
      if (e.pointerType !== 'mouse' || motion.matches) return;
      const r = visual.getBoundingClientRect();
      pointerX = Math.max(-1, Math.min(1, (e.clientX - r.left - r.width / 2) / r.width));
      pointerY = Math.max(-1, Math.min(1, (e.clientY - r.top - r.height / 2) / r.height));
    },
    { passive: true }
  );
  journey.addEventListener('pointerleave', () => {
    pointerX = 0;
    pointerY = 0;
  });
  addEventListener('resize', resize, { passive: true });
  document.fonts.ready.then(resize);
  addEventListener('scroll', updateFormation, { passive: true });
  document.addEventListener('visibilitychange', schedule);
  motion.addEventListener('change', schedule);
  canvas.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    ready = false;
    journey.classList.remove('is-rendered');
    schedule();
  });
  canvas.addEventListener('webglcontextrestored', () => {
    try {
      initialize();
    } catch {
      journey.classList.remove('is-rendered');
    }
  });
})();
