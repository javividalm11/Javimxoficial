/* Fotosfera solar con partículas en órbita. */
(() => {
  const canvas = document.getElementById('solarGlobe');
  if (!canvas) return;
  const stage = canvas.parentElement,
    root = document.documentElement,
    welcome = document.getElementById('welcomeDialog');
  const motion = matchMedia('(prefers-reduced-motion:reduce)');
  let gl,
    program,
    resolution,
    time,
    ready = false,
    failed = false,
    visible = false,
    frame = 0,
    last = 0,
    elapsed = 0;
  const vertex = 'attribute vec2 aPosition;void main(){gl_Position=vec4(aPosition,0.,1.);}';
  const fragment = `
    precision highp float;
    uniform vec2 uResolution;uniform float uTime;
    float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
    float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.)),f.x),f.y);}
    float fbm(vec2 p){float value=0.,weight=.5;for(int i=0;i<5;i++){value+=weight*noise(p);p=mat2(.8,-.6,.6,.8)*p*2.04+vec2(2.3,1.7);weight*=.5;}return value;}
    mat2 rotation(float a){return mat2(cos(a),-sin(a),sin(a),cos(a));}
    void main(){
      vec2 pixel=vec2(gl_FragCoord.x,uResolution.y-gl_FragCoord.y);
      float radius=uResolution.x*.255;
      vec2 p=(pixel-uResolution*vec2(.5,.47))/radius;
      float r=length(p),angle=atan(p.y,p.x),t=uTime;
      float fire=fbm(vec2(angle*5.,t*.13+r*4.));
      float halo=exp(-max(r-1.,0.)*12.)*(.3+fire*.7);
      float alpha=r<1.?1.:halo*.7;
      vec3 color=vec3(1.,.66,.035);
      if(r<1.){
        float z=sqrt(max(0.,1.-r*r));
        vec2 uv=p*3.1+vec2(z*.8,t*.025);
        vec2 warp=vec2(fbm(uv*2.+vec2(t*.045,0.)),fbm(uv*2.+vec2(6.7,-t*.04)));
        float surface=fbm(uv*5.+warp*3.);
        float veins=pow(1.-abs(sin((uv.x+uv.y)*8.+surface*17.+t*.13)),8.);
        color=mix(vec3(.92,.22,.004),vec3(1.,.84,.08),smoothstep(.21,.77,surface));
        color+=vec3(1.,.82,.30)*veins*.9;
        color+=vec3(.32,.27,.10)*pow(1.-z,4.);
        color*=.85+.22*z;
        float flare=exp(-length(p-vec2(.04,.03))*15.);
        float ray=(exp(-abs(p.y-.03)*95.)+exp(-abs(p.x-.04)*95.)+exp(-abs(p.x-p.y-.01)*100.))*exp(-r*5.);
        color=mix(color,vec3(1.,1.,.84),min(.95,flare*.85+ray*.35));
      }else{
        float plume=sin(angle*19.+fire*11.+t*.22)*.5+.5;
        alpha+=exp(-abs(r-1.03)*45.)*.75+pow(plume,7.)*exp(-max(r-1.,0.)*18.)*.45;
      }
      for(int ring=0;ring<3;ring++){
        float tilt=float(ring)*.43-.49;
        vec2 q=rotation(tilt)*p;
        float ellipse=abs(length(vec2(q.x/1.42,q.y/.30))-1.);
        float line=exp(-ellipse*radius*.30)*.65;
        if(r>1.005||q.y>0.){color=mix(color,vec3(1.,1.,.77),line);alpha=max(alpha,line);}
        for(int j=0;j<3;j++){
          float a=t*(.13+float(ring)*.02)+float(j)*2.094+float(ring);
          vec2 center=rotation(-tilt)*vec2(cos(a)*1.42,sin(a)*.30);
          vec2 local=(p-center)/(.036+float(j)*.005);
          float d=length(local);
          if(d<1.&&(r>1.01||q.y>0.)){
            float shine=pow(max(0.,1.-length(local-vec2(-.35,-.4))),3.);
            color=mix(vec3(.87,.35,.008),vec3(1.,.89,.34),sqrt(max(0.,1.-d*d)))+shine;
            alpha=1.;
          }
        }
      }
      alpha=clamp(alpha,0.,1.);if(r>1.7)alpha=0.;
      gl_FragColor=vec4(color*alpha,alpha);
    }`;
  function compile(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw Error('Solar shader unavailable');
    return shader;
  }
  function setup() {
    try {
      gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false });
      if (!gl) throw Error('WebGL unavailable');
      program = gl.createProgram();
      const v = compile(gl.VERTEX_SHADER, vertex),
        f = compile(gl.FRAGMENT_SHADER, fragment);
      gl.attachShader(program, v);
      gl.attachShader(program, f);
      gl.linkProgram(program);
      gl.deleteShader(v);
      gl.deleteShader(f);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS))
        throw Error('Solar program unavailable');
      gl.useProgram(program);
      const buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
        gl.STATIC_DRAW
      );
      const position = gl.getAttribLocation(program, 'aPosition');
      gl.enableVertexAttribArray(position);
      gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
      resolution = gl.getUniformLocation(program, 'uResolution');
      time = gl.getUniformLocation(program, 'uTime');
      ready = true;
      resize();
      stage.classList.add('solar-ready');
    } catch {
      failed = true;
      ready = false;
      stage.classList.remove('solar-ready');
    }
  }
  function resize() {
    const dpr = Math.min(devicePixelRatio || 1, 1.5);
    canvas.width = Math.max(1, Math.round(stage.clientWidth * dpr));
    canvas.height = Math.max(1, Math.round(stage.clientHeight * dpr));
    if (ready) {
      gl.viewport(0, 0, canvas.width, canvas.height);
      if (root.dataset.theme === 'light') draw();
    }
  }
  function draw() {
    if (!ready || gl.isContextLost()) return;
    gl.useProgram(program);
    gl.uniform2f(resolution, canvas.width, canvas.height);
    gl.uniform1f(time, elapsed);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }
  function animate(now) {
    frame = 0;
    if (
      !visible ||
      document.hidden ||
      root.dataset.theme !== 'light' ||
      welcome?.open ||
      motion.matches
    )
      return;
    if (!last || now - last >= 1000 / 30) {
      if (last) elapsed += Math.min((now - last) / 1000, 0.1);
      last = now;
      draw();
    }
    frame = requestAnimationFrame(animate);
  }
  function sync() {
    cancelAnimationFrame(frame);
    frame = 0;
    last = 0;
    stage.setAttribute(
      'aria-label',
      root.dataset.theme === 'light'
        ? 'Esfera solar animada con servicios digitales'
        : 'Globo de partículas con servicios digitales'
    );
    if (root.dataset.theme !== 'light' || welcome?.open) return;
    if (!ready && !failed) setup();
    if (!ready) return;
    draw();
    if (visible && !document.hidden && !motion.matches) frame = requestAnimationFrame(animate);
  }
  new ResizeObserver(resize).observe(stage);
  new IntersectionObserver(
    ([entry]) => {
      visible = entry.isIntersecting;
      sync();
    },
    { rootMargin: '80px' }
  ).observe(stage);
  new MutationObserver(sync).observe(root, { attributes: true, attributeFilter: ['data-theme'] });
  if (welcome)
    new MutationObserver(sync).observe(welcome, { attributes: true, attributeFilter: ['open'] });
  document.addEventListener('visibilitychange', sync);
  motion.addEventListener('change', sync);
  canvas.addEventListener('webglcontextlost', (event) => {
    event.preventDefault();
    ready = false;
    cancelAnimationFrame(frame);
    frame = 0;
    stage.classList.remove('solar-ready');
  });
  canvas.addEventListener('webglcontextrestored', () => {
    failed = false;
    sync();
  });
  sync();
})();
