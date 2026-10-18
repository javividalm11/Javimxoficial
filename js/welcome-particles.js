/* Partículas que forman el retrato o la firma. */
window.createWelcomeParticles = function (canvas, { logo = false } = {}) {
  const gl = canvas.getContext('webgl', { alpha: true, antialias: false });
  if (!gl) return { start() {}, stop() {} };
  const motion = matchMedia('(prefers-reduced-motion:reduce)');
  let active = false,
    ready = false,
    frame = 0,
    program,
    uniforms,
    count = 0,
    last = 0,
    elapsed = 0,
    dpr = 1;
  let shapeMasks = null,
    pointBuffer = null,
    cardRect = [0, 0, 0, 0],
    faceLoading = false,
    builtMobile = innerWidth <= 800;
  const card = canvas.closest('dialog')?.querySelector('.welcome-card');
  const random = (n) => {
    const x = Math.sin(n * 127.1 + 31.7) * 43758.5453;
    return x - Math.floor(x);
  };
  const vertex = `
    attribute vec4 aPoint;
    attribute vec3 aFace,aSignature;
    attribute float aInk;
    uniform vec2 uViewport;
    uniform vec4 uCardRect;
    uniform float uTime,uDpr,uMobile,uShapesReady;
    uniform mediump float uLight;
    varying vec3 vColor;varying float vAlpha;
    vec3 auroraColor(float seed){
      vec3 mint=vec3(.08,1.,.53),cyan=vec3(.13,.60,1.),violet=vec3(.86,.16,1.);
      vec3 base=mix(mint,cyan,.5+.5*sin(uTime*.16+seed*5.));
      vec3 darkColor=mix(base,violet,.28+.28*sin(uTime*.12+seed*7.));
      // Colores saturados para contraste sobre blanco.
      vec3 lightColor=mix(vec3(.015,.30,.32),vec3(.32,.035,.66),.5+.5*sin(uTime*.14+seed*5.));
      return mix(darkColor,lightColor,uLight);
    }
    vec3 scene(float mode,vec3 q){
      float aspect=uViewport.x/uViewport.y;
      if(mode<.5 || (mode>2.5 && uShapesReady<.5)){
        float x=(q.x-.5)*aspect*2.;
        float fold=sin(q.x*8.+uTime*.20)*.30+sin(q.x*17.-uTime*.12)*.10;
        float y=fold+(q.y-.5)*(.35+.35*pow(sin(q.x*4.+uTime*.13),2.));
        return vec3(x,y,sin(q.x*5.+q.z*3.)*.2);
      }
      if(mode<1.5){
        float y=mod(q.y*2.8+uTime*(.10+q.z*.12),2.8)-1.4;
        float x=(q.x-.5)*aspect*2.-y*.42;
        return vec3(x,y,q.z*.2);
      }
      if(mode<2.5){
        float age=clamp((mod(uTime,48.)-22.)/10.,0.,1.);
        float radius=pow(q.y,.75)*(.10+age*1.75);
        float angle=floor(q.z*4.)*1.5708+q.y*6.5+uTime*.10+(q.x-.5)*.48;
        return vec3(cos(angle)*radius,sin(angle)*radius*.64,(q.x-.5)*radius*.35);
      }
      float side=step(.5,q.z),scale=min(uViewport.x,uViewport.y)*.62;
      vec2 pixel;
      if(uMobile<.5){
        float leftGap=max(uCardRect.x,1.);
        float rightEdge=uCardRect.x+uCardRect.z;
        float rightGap=max(uViewport.x-rightEdge,1.);
        float gap=mix(leftGap,rightGap,side);
        float size=min(gap*.84,uViewport.y*.53);
        float centerX=mix(leftGap*.5,rightEdge+rightGap*.5,side);
        pixel=vec2(centerX,uViewport.y*.52)+aFace.xy*size;
        pixel.x+=sin(uTime*.23+side)*size*.015;
      }else{
        float topGap=max(uCardRect.y,0.);
        float bottomEdge=uCardRect.y+uCardRect.w;
        float bottomGap=max(uViewport.y-bottomEdge,0.);
        float gap=mix(topGap,bottomGap,side);
        float size=min(uViewport.x*.76,max(80.*uDpr,gap*1.45));
        float centerY=mix(topGap*.5,bottomEdge+bottomGap*.5,side);
        pixel=vec2(uViewport.x*.5,centerY)+aSignature.xy*size;
        pixel.y+=sin(uTime*.3+side)*2.*uDpr;
      }
      return vec3((pixel-uViewport*.5)/scale,0.);
    }
    void main(){
      float kind=aPoint.w,seed=fract(sin(dot(aPoint.xyz,vec3(17.2,91.7,37.3)))*43758.5);
      vec2 pixel;float pointSize=1.4,alpha=.5;
      vColor=auroraColor(aPoint.x);
      float cycle=mod(uTime/12.,4.),current=floor(cycle),next=mod(current+1.,4.);
      float blend=smoothstep(.68,1.,fract(cycle));
      if(kind<.5){
        vec3 p=mix(scene(current,aPoint.xyz),scene(next,aPoint.xyz),blend);
        p.xy+=sin(blend*3.14159)*vec2(sin(seed*18.+uTime*.2),cos(seed*23.+uTime*.2))*.12;
        float scale=min(uViewport.x,uViewport.y)*.62;
        pixel=uViewport*.5+p.xy*scale*(2.5/(2.5-p.z));
        float center=1.-abs(aPoint.y-.5)*2.;
        alpha=.20+pow(center,1.5)*.47;pointSize=1.2+seed*2.;
        alpha*=.7+.3*sin(seed*18.+uTime*.55);
        vColor=auroraColor(aPoint.x+aPoint.z*.3);
        float shapeWeight=((current==3.?1.-blend:0.)+(next==3.?blend:0.))*uShapesReady;
        float detail=mix(aFace.z,aSignature.z,uMobile);
        float shapeAlpha=mix(.05+pow(detail,1.6)*1.8,.55,uMobile);
        float shapeSize=mix(1.3+detail*.9,1.1+seed*.25,uMobile);
        // Realza cabello y lentes sobre blanco.
        float ink=pow(clamp(aInk,0.,1.),1.35);
        shapeAlpha=mix(shapeAlpha,mix(.10+ink*2.2,.95,uMobile),uLight);
        shapeSize=mix(shapeSize,mix(1.85+ink*.65,1.8,uMobile),uLight);
        alpha=mix(alpha,shapeAlpha,shapeWeight);
        pointSize=mix(pointSize,shapeSize,shapeWeight);
        float colorPosition=mix(aFace.x+.5,aSignature.x+.5,uMobile);
        vec3 shapeColor=auroraColor(colorPosition)+vec3(detail*.14*(1.-uMobile)*(1.-uLight));
        vColor=mix(vColor,shapeColor,shapeWeight);
      }else if(kind<1.5){
        float meteorWeight=(current==1.?1.-blend:0.)+(next==1.?blend:0.);
        float travel=fract(uTime*.075+aPoint.x),trail=aPoint.z;
        vec2 head=vec2(fract(aPoint.x*7.7)*1.6-.3,fract(aPoint.y*3.1)*.8-.4);
        pixel=(head+vec2(-.8,1.2)*travel+vec2(.11,-.165)*trail)*uViewport;
        alpha=meteorWeight*pow(1.-trail,1.8)*.9;pointSize=1.+(1.-trail)*2.5;
        vColor=mix(vec3(.6,.84,1.),auroraColor(aPoint.x),trail);
      }else if(kind<2.5){
        pixel=aPoint.xy*uViewport+vec2(sin(uTime*.13+seed*20.),cos(uTime*.11+seed*40.))*10.*uDpr;
        alpha=.10+.40*pow(.5+.5*sin(uTime*.6+seed*30.),4.);pointSize=.8+seed*2.;
      }else{
        float angle=aPoint.x+uTime*(kind<3.5?.22:-.19);
        float radius=min(uViewport.x,uViewport.y)*.25;
        float spread=(aPoint.y-.5)*radius*.34;
        float r=radius+spread+sin(angle*4.+uTime*.9)*radius*.035;
        vec2 p=vec2(cos(angle),sin(angle))*r;
        if(kind>3.5){p.y*=.40;p=mat2(.94,-.34,.34,.94)*p*1.35;}
        pixel=uViewport*.5+p;
        alpha=(.25+.85*pow(1.-abs(aPoint.y-.5)*2.,2.))*(.65+.35*sin(angle*3.+uTime));
        pointSize=.9+seed*2.2;vColor=auroraColor(angle/6.283);
      }
      gl_Position=vec4(pixel/uViewport*vec2(2.,-2.)+vec2(-1.,1.),0.,1.);
      gl_PointSize=pointSize*uDpr;vAlpha=min(1.,alpha*mix(1.,1.45,uLight));
    }`;
  const fragment = `precision mediump float;uniform float uLight;varying vec3 vColor;varying float vAlpha;void main(){float d=length(gl_PointCoord-.5)*2.;float glow=pow(max(0.,1.-d),mix(1.3,.65,uLight));gl_FragColor=vec4(vColor,vAlpha*glow);}`;
  function compile(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw Error('Shader unavailable');
    return shader;
  }
  function setup() {
    try {
      builtMobile = innerWidth <= 800;
      if (program && gl.isProgram(program)) gl.deleteProgram(program);
      if (pointBuffer && gl.isBuffer(pointBuffer)) gl.deleteBuffer(pointBuffer);
      program = gl.createProgram();
      const v = compile(gl.VERTEX_SHADER, vertex),
        f = compile(gl.FRAGMENT_SHADER, fragment);
      gl.attachShader(program, v);
      gl.attachShader(program, f);
      gl.linkProgram(program);
      gl.deleteShader(v);
      gl.deleteShader(f);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw Error('Program unavailable');
      gl.useProgram(program);
      const points = [];
      function add(x, y, z, kind, index) {
        const face =
          kind === 0 && shapeMasks
            ? shapeMasks.face[Math.floor(random(index + 200000) * shapeMasks.face.length)]
            : [0, 0, 0];
        const signature =
          kind === 0 && shapeMasks
            ? shapeMasks.signature[Math.floor(random(index + 300000) * shapeMasks.signature.length)]
            : [0, 0, 0];
        points.push(
          x,
          y,
          z,
          kind,
          ...face.slice(0, 3),
          ...signature,
          kind === 0 && shapeMasks ? face[3] || 0 : 0
        );
      }
      if (logo) {
        for (let i = 0; i < 2300; i++) add((i / 2300) * Math.PI * 2, random(i + 1), 0, 3, i);
        for (let i = 0; i < 800; i++) add((i / 800) * Math.PI * 2, random(i + 4000), 0, 4, i);
      } else {
        const cloud = innerWidth <= 800 ? 8000 : 40000;
        for (let i = 0; i < cloud; i++)
          add(random(i + 1), random(i + 30000), random(i + 60000), 0, i);
        for (let i = 0; i < 50; i++)
          for (let tail = 0; tail < 35; tail++)
            add(random(i + 90000), random(i + 100000), tail / 34, 1, i);
        for (let i = 0; i < 300; i++) add(random(i + 90), random(i + 800), random(i), 2, i);
      }
      count = points.length / 11;
      pointBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, pointBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(points), gl.STATIC_DRAW);
      for (const [name, size, offset] of [
        ['aPoint', 4, 0],
        ['aFace', 3, 16],
        ['aSignature', 3, 28],
        ['aInk', 1, 40],
      ]) {
        const location = gl.getAttribLocation(program, name);
        if (location >= 0) {
          gl.enableVertexAttribArray(location);
          gl.vertexAttribPointer(location, size, gl.FLOAT, false, 44, offset);
        }
      }
      uniforms = {};
      for (const name of [
        'uViewport',
        'uTime',
        'uDpr',
        'uMobile',
        'uShapesReady',
        'uCardRect',
        'uLight',
      ])
        uniforms[name] = gl.getUniformLocation(program, name);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
      ready = true;
      resize();
    } catch {
      ready = false;
    }
  }
  function resize() {
    if (!logo && ready && builtMobile !== innerWidth <= 800) {
      setup();
      return;
    }
    const rect = canvas.getBoundingClientRect();
    dpr = Math.min(devicePixelRatio || 1, 1.5);
    canvas.width = Math.max(1, Math.round(rect.width * dpr));
    canvas.height = Math.max(1, Math.round(rect.height * dpr));
    const c = card?.getBoundingClientRect();
    if (c) cardRect = [c.x * dpr, c.y * dpr, c.width * dpr, c.height * dpr];
    gl.viewport(0, 0, canvas.width, canvas.height);
    loadFaceIfNeeded();
    if (active && motion.matches && !frame) frame = requestAnimationFrame(draw);
  }
  function draw(now) {
    frame = 0;
    if (!active || !ready || document.hidden || gl.isContextLost()) return;
    if (!last || now - last >= 1000 / 30) {
      if (last) elapsed += Math.min((now - last) / 1000, 0.1);
      last = now;
      const light = document.documentElement.dataset.theme === 'light';
      if (light)
        gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      else gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(program);
      gl.uniform1f(uniforms.uLight, light ? 1 : 0);
      gl.uniform2f(uniforms.uViewport, canvas.width, canvas.height);
      gl.uniform1f(uniforms.uTime, elapsed);
      gl.uniform1f(uniforms.uDpr, dpr);
      gl.uniform1f(uniforms.uMobile, innerWidth <= 800 ? 1 : 0);
      gl.uniform1f(
        uniforms.uShapesReady,
        shapeMasks && (innerWidth <= 800 || shapeMasks.portraitReady) ? 1 : 0
      );
      gl.uniform4f(uniforms.uCardRect, ...cardRect);
      gl.drawArrays(gl.POINTS, 0, count);
    }
    if (!motion.matches) frame = requestAnimationFrame(draw);
  }
  function start() {
    active = true;
    last = 0;
    resize();
    if (ready && !frame) frame = requestAnimationFrame(draw);
  }
  function stop() {
    active = false;
    cancelAnimationFrame(frame);
    frame = 0;
    last = 0;
  }
  setup();
  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  if (card) observer.observe(card);
  function sampleImage(url, portrait) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => {
        try {
          const sample = document.createElement('canvas');
          sample.width = portrait ? 280 : 440;
          sample.height = portrait
            ? Math.round((280 * 970) / 720)
            : Math.round((440 * image.height) / image.width);
          const context = sample.getContext('2d', { willReadFrequently: true });
          if (portrait)
            context.drawImage(image, 260, 0, 720, 970, 0, 0, sample.width, sample.height);
          else context.drawImage(image, 0, 0, sample.width, sample.height);
          const pixels = context.getImageData(0, 0, sample.width, sample.height).data;
          const luminance = (i) =>
            (pixels[i] * 0.2126 + pixels[i + 1] * 0.7152 + pixels[i + 2] * 0.0722) / 255;
          const mask = [];
          for (let y = 1; y < sample.height - 1; y++)
            for (let x = 1; x < sample.width - 1; x++) {
              const i = (y * sample.width + x) * 4;
              if (pixels[i + 3] < 70) continue;
              const light = luminance(i),
                edge =
                  Math.abs(light - luminance(i + 4)) +
                  Math.abs(light - luminance(i + sample.width * 4));
              if (!portrait && Math.max(pixels[i], pixels[i + 1], pixels[i + 2]) < 65) continue;
              const point = [
                x / sample.width - 0.5,
                (y - sample.height * 0.5) / sample.width,
                portrait ? Math.min(1, 0.1 + light * 0.85 + edge * 1.6) : 1,
              ];
              if (portrait) point.push(Math.min(1, (1 - light) * 0.95 + edge * 2.5));
              mask.push(point);
            }
          if (!mask.length) throw Error('Empty particle image');
          resolve(mask);
        } catch (error) {
          reject(error);
        }
      };
      image.onerror = reject;
      image.src = url;
    });
  }
  function loadFaceIfNeeded() {
    if (logo || innerWidth <= 800 || !shapeMasks || shapeMasks.portraitReady || faceLoading) return;
    faceLoading = true;
    sampleImage('./img/welcome-portrait.png', true)
      .then((face) => {
        shapeMasks.face = face;
        shapeMasks.portraitReady = true;
        setup();
        if (active) start();
      })
      .catch(() => {});
  }
  if (!logo)
    sampleImage('./img/logo-transparent.png', false)
      .then((signature) => {
        shapeMasks = { face: signature, signature, portraitReady: false };
        setup();
        if (active) start();
      })
      .catch(() => {});
  document.addEventListener('visibilitychange', () => {
    if (active) {
      cancelAnimationFrame(frame);
      frame = 0;
      last = 0;
      if (!document.hidden) start();
    }
  });
  document.addEventListener('portfolio:theme', () => {
    if (active && motion.matches) {
      cancelAnimationFrame(frame);
      frame = 0;
      start();
    }
  });
  motion.addEventListener('change', () => {
    if (active) {
      cancelAnimationFrame(frame);
      frame = 0;
      start();
    }
  });
  canvas.addEventListener('webglcontextlost', (event) => {
    event.preventDefault();
    cancelAnimationFrame(frame);
    frame = 0;
    ready = false;
  });
  canvas.addEventListener('webglcontextrestored', () => {
    setup();
    if (active) start();
  });
  return { start, stop };
};
