/* =============================================================
   @javimxoficial · interactions (red/black premium rebuild)
   cursor spotlight · card spotlight · magnetic · reveal · counts · nav
   ============================================================= */

// ---- CURSOR SPOTLIGHT (smoothed) ----
function initCursorSpotlight() {
    if (window.matchMedia('(hover: none)').matches) return;
    const spot = document.getElementById('cursorSpotlight');
    if (!spot) return;
    let mx = innerWidth / 2, my = innerHeight / 2, sx = mx, sy = my;
    addEventListener('mousemove', (e) => { mx = e.clientX; my = e.clientY; }, { passive: true });
    (function loop() {
        sx += (mx - sx) * 0.18; sy += (my - sy) * 0.18;
        spot.style.transform = `translate(${sx}px, ${sy}px) translate(-50%, -50%)`;
        requestAnimationFrame(loop);
    })();
}

// ---- CIRCUIT BACKGROUND (Tron data-bus particles) ----
function initCircuit() {
    const canvas = document.getElementById('circuit');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const VIOLET = '166, 77, 255';   // #A64DFF
    let W, H, DPR, traces = [], pulses = [], grid = null, raf = 0;

    const rnd = (a, b) => a + Math.random() * (b - a);
    const pick = a => a[(Math.random() * a.length) | 0];
    function build() {
        traces = [];
        const g = 40;                              // grid step
        const cols = Math.ceil(W / g), rows = Math.ceil(H / g);
        const count = Math.min(26, Math.max(10, Math.floor((W * H) / 52000)));
        const edge = Math.max(3, Math.floor(cols * 0.2));
        for (let i = 0; i < count; i++) {
            // start hugging left or right edge, flow inward (center stays clear)
            const leftSide = Math.random() < 0.5;
            const hx = leftSide ? 1 : -1;
            let x = (leftSide ? ((rnd(0, edge)) | 0) : (cols - ((rnd(0, edge)) | 0))) * g;
            let y = ((Math.random() * rows) | 0) * g;
            const pts = [[x, y]];
            const segs = (rnd(5, 11)) | 0;
            let horiz = true;
            for (let s = 0; s < segs; s++) {
                // long horizontal run, then short 45° diagonal jog — repeat
                const len = (horiz ? (rnd(3, 9) | 0) : (rnd(1, 3) | 0)) * g;
                const vy = horiz ? 0 : (Math.random() < 0.5 ? 1 : -1);
                x += hx * len; y += vy * len;
                pts.push([x, y]);
                horiz = !horiz;
            }
            let total = 0; const segLen = [];
            for (let p = 1; p < pts.length; p++) {
                const l = Math.hypot(pts[p][0] - pts[p - 1][0], pts[p][1] - pts[p - 1][1]);
                segLen.push(l); total += l;
            }
            if (total < g * 2) continue;
            traces.push({ pts, segLen, total, color: VIOLET });
        }
    }

    function pointAt(tr, d) {
        for (let p = 0; p < tr.segLen.length; p++) {
            if (d <= tr.segLen[p]) {
                const a = tr.pts[p], b = tr.pts[p + 1];
                const t = tr.segLen[p] ? d / tr.segLen[p] : 0;
                return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
            }
            d -= tr.segLen[p];
        }
        const last = tr.pts[tr.pts.length - 1];
        return [last[0], last[1]];
    }

    function bakeGrid() {
        grid = document.createElement('canvas');
        grid.width = W * DPR; grid.height = H * DPR;
        const o = grid.getContext('2d');
        o.scale(DPR, DPR); o.lineCap = 'round'; o.lineJoin = 'round';
        const path = tr => {
            o.beginPath(); o.moveTo(tr.pts[0][0], tr.pts[0][1]);
            for (let p = 1; p < tr.pts.length; p++) o.lineTo(tr.pts[p][0], tr.pts[p][1]);
        };
        traces.forEach(tr => {
            // outer neon glow
            o.shadowColor = `rgba(${tr.color},1)`; o.shadowBlur = 14;
            o.lineWidth = 2.6; o.strokeStyle = `rgba(${tr.color},0.30)`; path(tr); o.stroke();
            // bright core
            o.shadowBlur = 6; o.lineWidth = 1.1; o.strokeStyle = `rgba(${tr.color},0.55)`; path(tr); o.stroke();
            o.shadowBlur = 0;
            // end pads
            [tr.pts[0], tr.pts[tr.pts.length - 1]].forEach(pt => {
                o.beginPath(); o.arc(pt[0], pt[1], 3, 0, 6.283);
                o.fillStyle = `rgba(${tr.color},0.85)`; o.fill();
                o.beginPath(); o.arc(pt[0], pt[1], 5.5, 0, 6.283);
                o.strokeStyle = `rgba(${tr.color},0.3)`; o.lineWidth = 1; o.stroke();
            });
        });
    }

    function spawn() {
        const tr = pick(traces);
        if (!tr) return;
        pulses.push({ tr, d: 0, speed: rnd(1.1, 2.6), tail: rnd(26, 60), color: tr.color });
    }

    function resize() {
        DPR = Math.min(window.devicePixelRatio || 1, 2);
        W = window.innerWidth; H = window.innerHeight;
        canvas.width = W * DPR; canvas.height = H * DPR;
        canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
        build(); bakeGrid(); pulses = [];
    }

    function frame() {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (grid) ctx.drawImage(grid, 0, 0);
        ctx.save();
        ctx.scale(DPR, DPR);
        ctx.globalCompositeOperation = 'lighter';
        const max = Math.min(40, Math.floor(traces.length * 0.9));
        if (pulses.length < max && Math.random() < 0.5) spawn();
        for (let i = pulses.length - 1; i >= 0; i--) {
            const pl = pulses[i];
            pl.d += pl.speed;
            if (pl.d - pl.tail > pl.tr.total) { pulses.splice(i, 1); continue; }
            const steps = 9;
            for (let s = 1; s <= steps; s++) {
                const d = pl.d - (pl.tail * s / steps);
                if (d < 0) break;
                const [x, y] = pointAt(pl.tr, d);
                const k = 1 - s / steps;
                ctx.beginPath();
                ctx.fillStyle = `rgba(${pl.color},${k * 0.95})`;
                ctx.arc(x, y, 2.2 * k + 0.7, 0, 6.283); ctx.fill();
            }
            if (pl.d <= pl.tr.total) {
                const [hx, hy] = pointAt(pl.tr, pl.d);
                const gr = ctx.createRadialGradient(hx, hy, 0, hx, hy, 12);
                gr.addColorStop(0, 'rgba(255,255,255,1)');
                gr.addColorStop(0.3, `rgba(${pl.color},0.9)`);
                gr.addColorStop(1, `rgba(${pl.color},0)`);
                ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(hx, hy, 12, 0, 6.283); ctx.fill();
            }
        }
        ctx.restore();
        raf = requestAnimationFrame(frame);
    }

    resize();
    let rt;
    addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(resize, 200); }, { passive: true });
    if (reduce) {
        // static circuit only
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (grid) ctx.drawImage(grid, 0, 0);
    } else {
        cancelAnimationFrame(raf);
        frame();
    }
}

// ---- PROJECTS CAROUSEL (horizontal slideshow) ----
function initCarousel() {
    const root = document.getElementById('projCarousel');
    const track = document.getElementById('projTrack');
    const dotsWrap = document.getElementById('projDots');
    if (!root || !track) return;
    const slides = [...track.children];
    if (slides.length < 2) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const dots = slides.map((_, i) => {
        const b = document.createElement('button');
        b.setAttribute('aria-label', 'Ir al proyecto ' + (i + 1));
        b.addEventListener('click', () => { stop(); go(i); });
        dotsWrap.appendChild(b);
        return b;
    });

    const step = () => slides[1].offsetLeft - slides[0].offsetLeft;
    const index = () => Math.round(track.scrollLeft / (step() || 1));
    const go = (i) => track.scrollTo({ left: i * step(), behavior: 'smooth' });
    const sync = () => {
        const idx = Math.max(0, Math.min(index(), slides.length - 1));
        dots.forEach((d, i) => d.classList.toggle('is-active', i === idx));
    };

    let ticking = false;
    track.addEventListener('scroll', () => {
        if (!ticking) { requestAnimationFrame(() => { sync(); ticking = false; }); ticking = true; }
    }, { passive: true });

    document.getElementById('projPrev')?.addEventListener('click', () => { stop(); go(Math.max(0, index() - 1)); });
    document.getElementById('projNext')?.addEventListener('click', () => { stop(); go(index() + 1 >= slides.length ? 0 : index() + 1); });

    let timer = null;
    function play() { if (reduce) return; stop(); timer = setInterval(() => { go(index() + 1 >= slides.length ? 0 : index() + 1); }, 5000); }
    function stop() { if (timer) { clearInterval(timer); timer = null; } }
    root.addEventListener('pointerenter', stop);
    root.addEventListener('pointerleave', play);
    root.addEventListener('touchstart', stop, { passive: true });

    sync();
    play();
}

// ---- CARD SPOTLIGHT (cursor-tracked glow) ----
function initSpotlightCards() {
    if (window.matchMedia('(hover: none)').matches) return;
    document.querySelectorAll('[data-spotlight]').forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const r = card.getBoundingClientRect();
            card.style.setProperty('--mx', `${((e.clientX - r.left) / r.width) * 100}%`);
            card.style.setProperty('--my', `${((e.clientY - r.top) / r.height) * 100}%`);
        }, { passive: true });
    });
}

// ---- MAGNETIC BUTTONS ----
function initMagnetic() {
    if (window.matchMedia('(hover: none)').matches) return;
    const S = 0.25;
    document.querySelectorAll('.magnetic').forEach(el => {
        el.addEventListener('mousemove', (e) => {
            const r = el.getBoundingClientRect();
            el.style.transform = `translate(${(e.clientX - (r.left + r.width / 2)) * S}px, ${(e.clientY - (r.top + r.height / 2)) * S}px)`;
        });
        el.addEventListener('mouseleave', () => { el.style.transform = ''; });
    });
}

// ---- SCROLL REVEAL (stagger) ----
function initScrollReveal() {
    const items = document.querySelectorAll('.reveal');
    if (!items.length) return;
    const io = new IntersectionObserver((entries) => {
        entries.forEach((entry, i) => {
            if (entry.isIntersecting) {
                setTimeout(() => entry.target.classList.add('is-visible'), i * 60);
                io.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    items.forEach(el => io.observe(el));
}

// ---- SOCIAL COUNTS (from /data/social-counts.json) ----
let SOCIAL_COUNTS = { instagram: 0, youtube: 0, tiktok: 0, facebook: 0 };

function formatCount(n) {
    if (n < 1000) return n.toString();
    if (n < 10_000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    if (n < 1_000_000) return Math.floor(n / 1000) + 'K';
    if (n < 10_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
    return Math.floor(n / 1_000_000) + 'M';
}

async function loadCounts() {
    try {
        const day = new Date().toISOString().slice(0, 10);
        const res = await fetch(`/data/social-counts.json?v=${day}`, { cache: 'no-cache' });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const d = await res.json();
        SOCIAL_COUNTS = {
            instagram: d.instagram?.followers || 0,
            youtube: d.youtube?.subscribers || 0,
            tiktok: d.tiktok?.followers || 0,
            facebook: d.facebook?.followers || 0
        };
    } catch (e) {
        console.warn('[javimxoficial] social-counts.json:', e.message);
    }
}

function animateCounts() {
    document.querySelectorAll('[data-key]').forEach(el => {
        const target = SOCIAL_COUNTS[el.dataset.key] || 0;
        if (!target) { el.textContent = '—'; el.style.opacity = '0.4'; return; }
        el.style.opacity = '';
        const dur = 1800, start = performance.now();
        (function frame(now) {
            const t = Math.min((now - start) / dur, 1);
            const eased = 1 - Math.pow(1 - t, 3);
            el.textContent = formatCount(Math.floor(target * eased));
            if (t < 1) requestAnimationFrame(frame); else el.textContent = formatCount(target);
        })(performance.now());
    });
}

let countsReady = false, countsVisible = false;
function tryCounts() { if (countsReady && countsVisible) animateCounts(); }

const connectSection = document.getElementById('conecta');
if (connectSection) {
    const co = new IntersectionObserver((entries) => {
        entries.forEach(e => { if (e.isIntersecting) { countsVisible = true; tryCounts(); co.disconnect(); } });
    }, { threshold: 0.25 });
    co.observe(connectSection);
}
loadCounts().then(() => { countsReady = true; tryCounts(); });

// ---- NAVBAR: mobile toggle + hide-on-scroll ----
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');
if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => { navToggle.classList.toggle('active'); navLinks.classList.toggle('active'); });
    navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => { navToggle.classList.remove('active'); navLinks.classList.remove('active'); }));
}

const navbar = document.getElementById('navbar');
let lastScroll = scrollY, ticking = false;
function onScroll() {
    const y = scrollY;
    if (y < 90) { navbar.classList.remove('nav-hidden'); lastScroll = y; return; }
    const diff = y - lastScroll;
    if (Math.abs(diff) > 8) { navbar.classList.toggle('nav-hidden', diff > 0); lastScroll = y; }
}
addEventListener('scroll', () => { if (!ticking) { requestAnimationFrame(() => { onScroll(); ticking = false; }); ticking = true; } }, { passive: true });

// ---- ACTIVE NAV LINK on scroll ----
const sections = document.querySelectorAll('section[id], header[id]');
addEventListener('scroll', () => {
    let current = '';
    sections.forEach(s => { if (scrollY >= s.offsetTop - 160) current = s.id; });
    document.querySelectorAll('.nav-links a').forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + current));
}, { passive: true });

// ---- CUSTOM PLAN → WhatsApp quote ----
const customBtn = document.getElementById('customQuote');
if (customBtn) {
    customBtn.addEventListener('click', () => {
        const opts = [...document.querySelectorAll('.p-custom__opts input:checked')].map(i => i.value);
        const budget = (document.getElementById('customBudget')?.value || '').trim();
        const extra = (document.getElementById('customExtra')?.value || '').trim();
        let msg = 'Hola Javi, quiero un plan personalizado a mi medida.';
        if (opts.length) msg += '\n\nMe interesa incluir:\n• ' + opts.join('\n• ');
        if (budget) msg += '\n\nMi presupuesto aprox.: ' + budget;
        if (extra) msg += '\n\nAdemás: ' + extra;
        window.open('https://wa.me/522871254233?text=' + encodeURIComponent(msg), '_blank', 'noopener');
    });
}

// ---- FOOTER YEAR ----
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

// ---- INIT ----
function initAll() {
    initCircuit();
    initCarousel();
    initCursorSpotlight();
    initSpotlightCards();
    initMagnetic();
    initScrollReveal();
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initAll);
else initAll();
