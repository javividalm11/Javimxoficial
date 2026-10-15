/* Geographic particle globe. Native canvas, no runtime dependencies. */
(() => {
  'use strict';
  const canvas = document.getElementById('particleGlobe');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const stage = canvas.parentElement;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const welcome = document.getElementById('welcomeDialog');
  let width = 0, height = 0, dpr = 1, radius = 0, cx = 0, cy = 0;
  let points = [], visible = true, raf = 0, last = 0, elapsed = 0;
  let seed = 81;
  const random = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  const stars = Array.from({ length: 110 }, () => [random(), random(), random()]);
  const rad = Math.PI / 180;
  const networks = [[40,-74],[19,-99],[-23,-46],[51,0],[48,2],[6,3],[-34,18],[30,31],[25,55],[1,104],[35,139],[37,-122],[-34,-58]];
  function resize() {
    width = stage.clientWidth; height = stage.clientHeight;
    dpr = Math.min(devicePixelRatio || 1, 1.75);
    canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
    radius = width * .225; cx = width * .54; cy = height * .48;
    stage.parentElement.style.setProperty('--pedestal-y', `${stage.offsetTop + cy + radius * 1.2625}px`);
    draw();
  }
  function project(lat, lon, rotation, scale = 1) {
    const a = lat * rad, b = lon * rad + rotation;
    const x = Math.cos(a) * Math.sin(b), y = Math.sin(a), z = Math.cos(a) * Math.cos(b);
    const tilt = -.13, yy = y * Math.cos(tilt) - z * Math.sin(tilt), zz = y * Math.sin(tilt) + z * Math.cos(tilt);
    return [cx + x * radius * scale, cy - yy * radius * scale, zz];
  }
  function path(coords, color, lineWidth, glow = 0) {
    ctx.beginPath(); coords.forEach((p,i) => i ? ctx.lineTo(p[0],p[1]) : ctx.moveTo(p[0],p[1]));
    ctx.strokeStyle = color; ctx.lineWidth = lineWidth; ctx.shadowColor = color; ctx.shadowBlur = glow; ctx.stroke(); ctx.shadowBlur = 0;
  }
  function orbit(angle, time, back) {
    const nodes = [], count = 150;
    const cr = Math.cos(angle), sr = Math.sin(angle);
    for (let i = 0; i <= count; i++) {
      const a = i / count * Math.PI * 2, x = Math.cos(a) * radius * 1.46, y = Math.sin(a) * radius * .35;
      nodes.push([cx + x * cr - y * sr, cy + x * sr + y * cr]);
    }
    path(nodes, back ? '#7a35d855' : '#b082ffb0', width / 680, back ? 8 : 12);
    const a = time * .35 + angle * 3;
    const x = Math.cos(a) * radius * 1.46, y = Math.sin(a) * radius * .35;
    light(cx + x * cr - y * sr, cy + x * sr + y * cr, 2.2, '#e6d5ff');
  }
  function light(x,y,size,color) {
    ctx.shadowBlur = 15; ctx.shadowColor = '#ac6cff'; ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(x,y,size,0,Math.PI*2); ctx.fill(); ctx.shadowBlur = 0;
  }
  function pedestal(t) {
    const y = cy + radius * 1.15;
    const bloom = ctx.createRadialGradient(cx,y,1,cx,y,radius*1.25);
    bloom.addColorStop(0,'#913aff55'); bloom.addColorStop(.5,'#5514a51a'); bloom.addColorStop(1,'#7d29ff00');
    ctx.fillStyle = bloom; ctx.fillRect(cx-radius*1.5,y-radius*.4,radius*3,radius*.9);
    for(let i=3;i>=0;i--){
      ctx.beginPath(); ctx.ellipse(cx,y+i*radius*.075,radius*(1.04+i*.04),radius*.14,0,0,Math.PI*2);
      ctx.fillStyle=i ? '#08091bd9':'#24183d88';ctx.fill();
      ctx.strokeStyle=i===0?'#d6b5ff':'#7744c4';ctx.lineWidth=i===0?2:1;
      ctx.shadowColor='#8f3dff';ctx.shadowBlur=i===0?22:9;ctx.stroke();ctx.shadowBlur=0;
    }
    for(let i=0;i<6;i++){
      const a=i/6*Math.PI*2+t*.07;
      light(cx+Math.cos(a)*radius*.97,y+Math.sin(a)*radius*.12,2,'#e5ceff');
    }
  }
  function draw() {
    if(!width || !height) return;
    ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,width,height);
    const t = elapsed / 1000, rotation = 1.13 + t*.045;
    for(const [x,y,a] of stars){ctx.fillStyle=`rgba(177,139,255,${.15+a*.5})`;ctx.fillRect(x*width,y*height,a>.88?1.7:1,a>.88?1.7:1);}
    pedestal(t);
    orbit(-.51,t,true);orbit(.73,t+.9,true);
    const aura=ctx.createRadialGradient(cx,cy,radius*.75,cx,cy,radius*1.3);
    aura.addColorStop(0,'#904cff00');aura.addColorStop(.52,'#ab65ff27');aura.addColorStop(.68,'#a34fff32');aura.addColorStop(1,'#5e1ed700');
    ctx.fillStyle=aura;ctx.beginPath();ctx.arc(cx,cy,radius*1.3,0,Math.PI*2);ctx.fill();
    const globe=ctx.createRadialGradient(cx-radius*.3,cy-radius*.4,0,cx,cy,radius);
    globe.addColorStop(0,'#2c126c9e');globe.addColorStop(.7,'#100c3ad9');globe.addColorStop(1,'#6a33c088');
    ctx.fillStyle=globe;ctx.beginPath();ctx.arc(cx,cy,radius,0,Math.PI*2);ctx.fill();
    // Front-facing meridians and parallels form the translucent globe mesh.
    for(let lon=-180;lon<180;lon+=20){let segment=[];for(let lat=-90;lat<=90;lat+=3){const p=project(lat,lon,rotation);if(p[2]>0)segment.push(p);else if(segment.length){path(segment,'#8662f343',.65);segment=[];}}if(segment.length)path(segment,'#8662f343',.65);}
    for(let lat=-70;lat<=70;lat+=20){let segment=[];for(let lon=-180;lon<=180;lon+=3){const p=project(lat,lon,rotation);if(p[2]>0)segment.push(p);else if(segment.length){path(segment,'#8260de43',.65);segment=[];}}if(segment.length)path(segment,'#8260de43',.65);}
    ctx.fillStyle='#d2a3ff';
    for(const p of points){const v=project(p[0],p[1],rotation);if(v[2]<-.12)continue;ctx.globalAlpha=Math.max(.1,(v[2]+.12)*.85);const size=width/660*(p[2] ? 1.25 : .85);ctx.beginPath();ctx.arc(v[0],v[1],size,0,Math.PI*2);ctx.fill();}
    ctx.globalAlpha=1;
    const flareX=cx-radius*.67,flareY=cy-radius*.6;
    const flare=ctx.createRadialGradient(flareX,flareY,0,flareX,flareY,radius*.26);
    flare.addColorStop(0,'#ffffffdc');flare.addColorStop(.07,'#f7d6ffd0');flare.addColorStop(.25,'#c36bff6c');flare.addColorStop(1,'#9a38ff00');
    ctx.fillStyle=flare;ctx.fillRect(flareX-radius*.26,flareY-radius*.26,radius*.52,radius*.52);
    const hubs=networks.map(([a,b])=>project(a,b,rotation,1.014));
    for(let i=0;i<hubs.length;i++){
      const a=hubs[i];if(a[2]<0)continue;
      for(let j=i+1;j<hubs.length;j++){
        const b=hubs[j];if(b[2]<0 || (j+i)%3!==0)continue;
        path([a,b],'#a77aff55',.7);
        const progress=(t*.15+i*.23+j*.11)%1;
        light(a[0]+(b[0]-a[0])*progress,a[1]+(b[1]-a[1])*progress,.85,'#cfc1ff');
      }
      light(a[0],a[1],1.7+Math.sin(t*2+i)*.45,'#f0e5ff');
    }
    ctx.beginPath();ctx.arc(cx,cy,radius,0,Math.PI*2);ctx.strokeStyle='#baa4ff';ctx.lineWidth=1.3;ctx.shadowColor='#a85fff';ctx.shadowBlur=18;ctx.stroke();ctx.shadowBlur=0;
    orbit(.17,t,false);
  }
  function inside(x,y,ring){let hit=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){const a=ring[i],b=ring[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])hit=!hit;}return hit;}
  async function geography(){
    try{
      const response=await fetch('./data/land.geojson');if(!response.ok)throw new Error('Geography unavailable');
      const json=await response.json(),polygons=[];
      for(const f of json.features){const all=f.geometry.type==='MultiPolygon'?f.geometry.coordinates:[f.geometry.coordinates];for(const rings of all){const ring=rings[0];const xs=ring.map(p=>p[0]),ys=ring.map(p=>p[1]);polygons.push({rings,minX:Math.min(...xs),maxX:Math.max(...xs),minY:Math.min(...ys),maxY:Math.max(...ys)});}}
      for(let lat=-60;lat<84;lat+=1.15){const step=1.15/Math.max(.2,Math.cos(lat*rad));for(let lon=-180;lon<180;lon+=step){if(polygons.some(p=>lon>=p.minX&&lon<=p.maxX&&lat>=p.minY&&lat<=p.maxY&&inside(lon,lat,p.rings[0])&&!p.rings.slice(1).some(r=>inside(lon,lat,r))))points.push([lat,lon,random()>.9]);}}
      draw();
    }catch(error){console.warn('[Globe]',error.message);points=Array.from({length:2800},()=>[Math.asin(random()*2-1)/rad,random()*360-180,false]);draw();}
  }
  function frame(now){raf=0;if(!visible||document.hidden||motion.matches||welcome?.open||document.documentElement.dataset.theme==='light')return;if(last)elapsed+=Math.min(now-last,60);last=now;draw();raf=requestAnimationFrame(frame);}
  function sync(){cancelAnimationFrame(raf);raf=0;last=0;if(document.documentElement.dataset.theme==='light'||welcome?.open)return;if(visible&&!document.hidden&&!motion.matches)raf=requestAnimationFrame(frame);else draw();}
  new ResizeObserver(resize).observe(stage);
  new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;sync();},{rootMargin:'80px'}).observe(stage);
  document.addEventListener('visibilitychange',sync);motion.addEventListener('change',sync);
  new MutationObserver(sync).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
  if(welcome)new MutationObserver(sync).observe(welcome,{attributes:true,attributeFilter:['open']});
  if(matchMedia('(hover: hover)').matches){stage.addEventListener('pointermove',e=>{if(motion.matches)return;const box=stage.getBoundingClientRect();stage.style.setProperty('--pointer-x',`${(e.clientX-box.left-box.width/2)*.013}px`);stage.style.setProperty('--pointer-y',`${(e.clientY-box.top-box.height/2)*.013}px`);});stage.addEventListener('pointerleave',()=>{stage.style.setProperty('--pointer-x','0px');stage.style.setProperty('--pointer-y','0px');});}
  const toggle=document.getElementById('navToggle');toggle?.setAttribute('aria-expanded','false');toggle?.setAttribute('aria-controls','navLinks');toggle?.addEventListener('click',()=>toggle.setAttribute('aria-expanded',String(toggle.classList.contains('active'))));document.querySelectorAll('#navLinks a').forEach(a=>a.addEventListener('click',()=>toggle?.setAttribute('aria-expanded','false')));
  resize();geography();sync();
})();
