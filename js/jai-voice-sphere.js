window.createJaiVoiceSphere = function (canvas) {
  'use strict';
  const orb = canvas.parentElement;
  const gl = canvas.getContext('webgl', {
    alpha: true,
    antialias: true,
    preserveDrawingBuffer: true,
  });
  if (!gl) return { resume() {}, pause() {}, setState() {} };
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let program,
    buffer,
    active = false,
    raf = 0,
    last = 0,
    time = 0,
    state = 0,
    lost = false;
  const uniforms = {};
  const points = [];
  for (let i = 0; i < 7200; i++) {
    const y = 1 - (2 * (i + 0.5)) / 7200,
      r = Math.sqrt(1 - y * y),
      a = i * 2.399963;
    points.push(r * Math.cos(a) * 0.65, y * 0.65, r * Math.sin(a) * 0.65, Math.random(), 0);
  }
  for (let ribbon = 0; ribbon < 2; ribbon++) {
    for (let i = 0; i < 700; i++) {
      const y = -0.645 + (1.29 * i) / 699,
        r = Math.sqrt(0.65 * 0.65 - y * y) * 1.014,
        a = (i / 699) * Math.PI * 2 + ribbon * Math.PI;
      points.push(r * Math.cos(a), y, r * Math.sin(a), Math.random(), 1);
    }
  }
  for (let i = 0; i < 85; i++) {
    const a = Math.random() * Math.PI * 2,
      r = 0.84 + Math.random() * 0.23;
    points.push(Math.cos(a) * r, Math.sin(a) * r, 0, Math.random(), 2);
  }
  const vs = `precision highp float;attribute vec3 aPosition;attribute float aSeed,aType;uniform float uTime,uMotion,uDpr,uActivity,uAspect;varying vec3 vColor;varying float vAlpha;
  void main(){float t=uTime*uMotion;vec3 p=aPosition;float a=t*(.13+uActivity*.08);p.x=aPosition.x*cos(a)+aPosition.z*sin(a);p.z=-aPosition.x*sin(a)+aPosition.z*cos(a);p.y+=sin(t*1.1+aSeed*25.)*.004*uMotion;p*=1.+sin(t*1.5)*.015*uMotion;float depth=(p.z+.65)/1.3;gl_Position=vec4(p.x/uAspect,p.y,p.z*.1,1.);gl_PointSize=(aType>.5?(aType>1.5?1.5:2.4):1.1+aSeed*1.7)*uDpr*(.6+depth*.6);vColor=aType>.5?vec3(1.,.64,1.):mix(vec3(.46,.10,.96),vec3(.89,.60,1.),depth);vAlpha=aType>1.5?.2+.25*sin(t+aSeed*17.):aType>.5?.65+depth*.3:.16+depth*.73;}`;
  const fs = `precision mediump float;varying vec3 vColor;varying float vAlpha;void main(){float d=length(gl_PointCoord-vec2(.5));if(d>.5)discard;gl_FragColor=vec4(vColor,(1.-smoothstep(.16,.5,d))*vAlpha);}`;
  function shader(type, source) {
    const s = gl.createShader(type);
    gl.shaderSource(s, source);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw Error('Voice shader failed');
    return s;
  }
  function setup() {
    try {
      const v = shader(gl.VERTEX_SHADER, vs),
        f = shader(gl.FRAGMENT_SHADER, fs);
      program = gl.createProgram();
      gl.attachShader(program, v);
      gl.attachShader(program, f);
      gl.linkProgram(program);
      gl.deleteShader(v);
      gl.deleteShader(f);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw Error('Voice shader link failed');
      gl.useProgram(program);
      buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(points), gl.STATIC_DRAW);
      for (const [name, size, offset] of [
        ['aPosition', 3, 0],
        ['aSeed', 1, 12],
        ['aType', 1, 16],
      ]) {
        const loc = gl.getAttribLocation(program, name);
        gl.enableVertexAttribArray(loc);
        gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 20, offset);
      }
      for (const name of ['uTime', 'uMotion', 'uDpr', 'uActivity', 'uAspect'])
        uniforms[name] = gl.getUniformLocation(program, name);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
      lost = false;
      orb.classList.add('sphere-webgl-ready');
      resize();
      sync();
    } catch {
      lost = true;
      orb.classList.remove('sphere-webgl-ready');
    }
  }
  function resize() {
    if (lost || !program || !canvas.clientWidth || !canvas.clientHeight) return;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(canvas.clientWidth * dpr);
    canvas.height = Math.round(canvas.clientHeight * dpr);
    gl.viewport(0, 0, canvas.width, canvas.height);
    draw();
  }
  function draw() {
    if (lost || !program) return;
    gl.useProgram(program);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform1f(uniforms.uTime, time / 1000);
    gl.uniform1f(uniforms.uMotion, motion.matches ? 0 : 1);
    gl.uniform1f(uniforms.uDpr, Math.min(devicePixelRatio || 1, 2));
    gl.uniform1f(uniforms.uActivity, state);
    gl.uniform1f(uniforms.uAspect, canvas.width / canvas.height);
    gl.drawArrays(gl.POINTS, 0, points.length / 5);
  }
  function frame(now) {
    raf = 0;
    if (!active || document.hidden || motion.matches || lost) return;
    if (last) time += Math.min(now - last, 60);
    last = now;
    draw();
    raf = requestAnimationFrame(frame);
  }
  function sync() {
    cancelAnimationFrame(raf);
    raf = 0;
    last = 0;
    if (active && !document.hidden && !motion.matches && !lost) raf = requestAnimationFrame(frame);
    else draw();
  }
  new ResizeObserver(resize).observe(canvas);
  document.addEventListener('visibilitychange', sync);
  motion.addEventListener('change', sync);
  canvas.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    lost = true;
    orb.classList.remove('sphere-webgl-ready');
    sync();
  });
  canvas.addEventListener('webglcontextrestored', setup);
  setup();
  return {
    resume() {
      active = true;
      resize();
      sync();
    },
    pause() {
      active = false;
      sync();
    },
    setState(value) {
      state =
        value === 'speaking' ? 1 : value === 'listening' ? 0.6 : value === 'thinking' ? 0.3 : 0;
      draw();
    },
  };
};
