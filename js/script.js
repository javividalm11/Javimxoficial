/* =============================================================
   @javimxoficial · Site interactions
   ============================================================= */

// -------- Contadores de redes sociales --------
// Los valores REALES viven en /data/social-counts.json y se cargan async.
// Ese JSON puede actualizarse:
//   A) Manualmente editando el archivo y push a git
//   B) Semi-automatico: Cloudflare Worker con cron (YouTube via API oficial)
//   C) Full automatico: Cloudflare Worker + Meta/TikTok Business APIs

let SOCIAL_COUNTS = {
    instagram: 0,
    youtube: 0,
    tiktok: 0,
    facebook: 0,
    updated_at: null
};

// Formatea numeros: 1500 -> "1.5K", 25000 -> "25K", 1_200_000 -> "1.2M"
function formatCount(n) {
    if (n < 1000) return n.toString();
    if (n < 10_000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    if (n < 1_000_000) return Math.floor(n / 1000) + 'K';
    if (n < 10_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
    return Math.floor(n / 1_000_000) + 'M';
}

// Carga los contadores desde /data/social-counts.json
async function loadCounts() {
    try {
        // Cache-bust por dia para que el navegador recoja updates al menos diarios
        const day = new Date().toISOString().slice(0, 10);
        const res = await fetch(`/data/social-counts.json?v=${day}`, { cache: 'no-cache' });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const data = await res.json();
        SOCIAL_COUNTS = {
            instagram: data.instagram?.followers || 0,
            youtube:   data.youtube?.subscribers || 0,
            tiktok:    data.tiktok?.followers || 0,
            facebook:  data.facebook?.followers || 0,
            updated_at: data.updated_at || null
        };
    } catch (e) {
        console.warn('[javimxoficial] No se pudo cargar social-counts.json:', e.message);
    }
}

// Animacion del contador
function animateStats() {
    const cards = document.querySelectorAll('.stat-card');
    const keys = ['instagram', 'youtube', 'tiktok', 'facebook'];

    cards.forEach((card, i) => {
        const target = SOCIAL_COUNTS[keys[i]] || 0;
        const el = card.querySelector('.stat-card__value');
        if (!el) return;

        if (target === 0) {
            el.textContent = '—';
            el.style.color = 'hsla(0,0%,100%,0.4)';
            return;
        }

        el.style.color = '';
        const duration = 1400;
        const start = performance.now();
        const startVal = 0;

        function frame(now) {
            const elapsed = now - start;
            const t = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
            const current = Math.floor(startVal + (target - startVal) * eased);
            el.textContent = formatCount(current);
            if (t < 1) requestAnimationFrame(frame);
            else el.textContent = formatCount(target);
        }
        requestAnimationFrame(frame);
    });
}

// -------- Init: primero carga JSON, despues observa scroll para animar --------
let statsReady = false;
let statsVisible = false;

function tryAnimate() {
    if (statsReady && statsVisible) animateStats();
}

const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            statsVisible = true;
            tryAnimate();
            statsObserver.disconnect();
        }
    });
}, { threshold: 0.3 });

const statsSection = document.getElementById('stats');
if (statsSection) statsObserver.observe(statsSection);

loadCounts().then(() => {
    statsReady = true;
    tryAnimate();
});

// -------- Mobile nav toggle --------
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');

if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
        navToggle.classList.toggle('active');
        navLinks.classList.toggle('active');
    });

    navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            navToggle.classList.remove('active');
            navLinks.classList.remove('active');
        });
    });
}

// -------- Navbar hide/show on scroll --------
const navbar = document.getElementById('navbar');
let lastScroll = window.scrollY;
let ticking = false;

function onScroll() {
    const y = window.scrollY;
    if (y < 80) {
        navbar.classList.remove('nav-hidden');
        lastScroll = y;
        return;
    }
    const diff = y - lastScroll;
    if (Math.abs(diff) > 8) {
        navbar.classList.toggle('nav-hidden', diff > 0);
        lastScroll = y;
    }
}

window.addEventListener('scroll', () => {
    if (!ticking) {
        requestAnimationFrame(() => { onScroll(); ticking = false; });
        ticking = true;
    }
}, { passive: true });

// -------- Smooth scroll (con offset por navbar fijo) --------
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (!href || href === '#' || !href.startsWith('#')) return;
        const target = document.querySelector(href);
        if (!target) return;
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
});

// -------- Active nav link on scroll --------
const sections = document.querySelectorAll('section[id]');
window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(section => {
        if (window.scrollY >= section.offsetTop - 150) {
            current = section.getAttribute('id');
        }
    });
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.classList.toggle('active', link.getAttribute('href') === '#' + current);
    });
}, { passive: true });

// -------- Footer year --------
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();
