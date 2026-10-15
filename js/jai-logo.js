/* JIA glyphs rendered as animated GPU particles, with a static fallback. */
window.createJaiLogo = function (canvas) {
  'use strict';
  const emblem = canvas.parentElement;
  const gl = canvas.getContext('webgl', {alpha:true,antialias:true,premultipliedAlpha:false,preserveDrawingBuffer:true});
  if (!gl) { canvas.hidden=true; return {pause(){},resume(){}}; }
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let program, buffer, count=0, points=[], locations={}, raf=0, last=0, time=0, active=true, visible=true, lost=false;
  let pointer=[0,0], pointerTarget=[0,0];
  const vertex = `
    precision highp float;
    attribute vec3 aTarget;
    attribute float aSeed;
    attribute float aType;
    uniform float uTime, uMotion, uDpr, uIntro;
    uniform vec2 uPointer;
    varying vec3 vColor;
    varying float vAlpha;
    void main(){
      float t=uTime*uMotion;
      vec2 target=aTarget.xy;
      vec2 origin=vec2(cos(aSeed*6.283),sin(aSeed*6.283))*(0.45+aSeed*0.35);
      float intro=1.0-pow(1.0-uIntro,3.0);
      vec2 p=mix(origin,target,intro);
      p+=vec2(sin(t*0.8+aSeed*35.0),cos(t*0.6+aSeed*27.0))*0.010*uMotion;
      p+=uPointer*0.025*(0.3+aSeed);
      if(aType>0.5){
        float a=aSeed*6.283+t*0.14;
        p=vec2(cos(a),sin(a))*(0.76+sin(aSeed*31.0)*0.075);
      }
      gl_Position=vec4(p,aTarget.z,1.0);
      gl_PointSize=(aType>0.5?1.0:1.10+aSeed*0.60)*uDpr;
      vColor=mix(vec3(0.66,0.28,1.0),vec3(0.97,0.91,1.0),clamp((aTarget.y+0.8)/1.6,0.0,1.0));
      vAlpha=aType>0.5?0.22+0.22*sin(aSeed*31.0+t):0.82+0.18*sin(aSeed*25.0+t);
    }`;
  const fragment = `
    precision mediump float;
    varying vec3 vColor;
    varying float vAlpha;
    void main(){
      float d=length(gl_PointCoord-vec2(0.5));
      if(d>0.5)discard;
      float alpha=(1.0-smoothstep(0.25,0.5,d))*vAlpha;
      gl_FragColor=vec4(vColor,alpha);
    }`;
  function shader(type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){gl.deleteShader(s);throw new Error('JIA shader could not compile');}return s;}
  function setup(){
    try{
      const vs=shader(gl.VERTEX_SHADER,vertex),fs=shader(gl.FRAGMENT_SHADER,fragment);
      program=gl.createProgram();gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);gl.deleteShader(vs);gl.deleteShader(fs);
      if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error('JIA shader could not link');
      buffer=gl.createBuffer();gl.useProgram(program);gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
      gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(points),gl.STATIC_DRAW);
      const stride=5*4;
      for(const [name,size,offset] of [['aTarget',3,0],['aSeed',1,12],['aType',1,16]]){const loc=gl.getAttribLocation(program,name);gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,size,gl.FLOAT,false,stride,offset);}
      for(const name of ['uTime','uMotion','uDpr','uIntro','uPointer'])locations[name]=gl.getUniformLocation(program,name);
      gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE);gl.disable(gl.DEPTH_TEST);
      emblem.classList.add('webgl-ready');lost=false;resize();sync();
    }catch(error){emblem.classList.remove('webgl-ready');canvas.hidden=true;lost=true;}
  }
  function geometry(){
    const mask=document.createElement('canvas');mask.width=320;mask.height=220;
    const c=mask.getContext('2d');c.fillStyle='#fff';c.font='italic 900 125px Inter, sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText('JIA',155,115);
    const pixels=c.getImageData(0,0,320,220).data;
    points=[];
    for(let y=0;y<220;y+=2){for(let x=0;x<320;x+=2){if(pixels[(y*320+x)*4+3]>110)points.push((x/320-.5)*1.8,(.5-y/220)*1.3,0,Math.random(),0);}}
    for(let i=0;i<64;i++)points.push(0,0,0,i/64,1);
    count=points.length/5;setup();
  }
  function resize(){
    if(lost||!program)return;
    const dpr=Math.min(devicePixelRatio||1,2);const size=canvas.clientWidth;
    if(!size)return;
    canvas.width=Math.round(size*dpr);canvas.height=Math.round(canvas.clientHeight*dpr);gl.viewport(0,0,canvas.width,canvas.height);draw();
  }
  function draw(){
    if(lost||!program||!canvas.width)return;
    gl.useProgram(program);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform1f(locations.uTime,time/1000);gl.uniform1f(locations.uMotion,motion.matches?0:1);
    gl.uniform1f(locations.uIntro,motion.matches?1:Math.min(time/1500,1));
    gl.uniform1f(locations.uDpr,Math.min(devicePixelRatio||1,2));gl.uniform2f(locations.uPointer,pointer[0],pointer[1]);gl.drawArrays(gl.POINTS,0,count);
  }
  function frame(now){raf=0;if(!active||!visible||document.hidden||motion.matches||lost)return;if(last)time+=Math.min(now-last,60);last=now;pointer[0]+=(pointerTarget[0]-pointer[0])*.06;pointer[1]+=(pointerTarget[1]-pointer[1])*.06;draw();raf=requestAnimationFrame(frame);}
  function sync(){cancelAnimationFrame(raf);raf=0;last=0;if(active&&visible&&!document.hidden&&!motion.matches&&!lost&&program)raf=requestAnimationFrame(frame);else draw();}
  new ResizeObserver(resize).observe(canvas);
  new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;sync();}).observe(canvas);
  document.addEventListener('visibilitychange',sync);motion.addEventListener('change',sync);
  emblem.parentElement.addEventListener('pointermove',event=>{if(motion.matches)return;const box=emblem.getBoundingClientRect();pointerTarget=[(event.clientX-box.left)/box.width-.5,.5-(event.clientY-box.top)/box.height];});
  emblem.parentElement.addEventListener('pointerleave',()=>{pointerTarget=[0,0];});
  canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();lost=true;emblem.classList.remove('webgl-ready');sync();});
  canvas.addEventListener('webglcontextrestored',()=>{canvas.hidden=false;setup();});
  (document.fonts?.ready||Promise.resolve()).then(geometry);
  return {pause(){active=false;sync();},resume(){active=true;resize();sync();}};
};
