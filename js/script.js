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

// ---- FOOTER YEAR ----
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

// ---- INIT ----
function initAll() {
    initCursorSpotlight();
    initSpotlightCards();
    initMagnetic();
    initScrollReveal();
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initAll);
else initAll();
