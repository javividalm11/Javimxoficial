# @javimxoficial · Personal creator brand

Sitio dedicado a la marca personal de **Javi (@javimxoficial)** como creador de contenido tech.

Arquitectura de 2 capas:
- **javividalm.pages.dev** → portafolio profesional (tech, dev, consultor)
- **javimxoficial.pages.dev** → marca personal creator (contenido, redes, colaboraciones)

## Stack

- HTML/CSS/JS vanilla (mismo enfoque que javividalm para máxima performance)
- Google Fonts: Poppins + Inter
- Font Awesome 6.4
- Hosting: Cloudflare Pages (free tier permanente)

## Estructura

```
JAVIMXOFICIAL/
├── index.html          # landing page principal
├── css/styles.css      # estilos (dark + gradients cálidos)
├── js/script.js        # interacciones + contador social + smooth scroll
├── img/                # fotos, favicon (agregar hero.jpg, favicon.png)
└── README.md
```

## Configuración pendiente antes de lanzar

### 1. Fotos y assets
Agrega en `/img/`:
- `hero.jpg` — foto tuya principal, formato 4:5 (ideal 800×1000px o superior)
- `favicon.png` — ícono del sitio (32×32 o 64×64)

### 2. Contadores sociales reales
Edita `js/script.js` línea `SOCIAL_COUNTS`:
```js
const SOCIAL_COUNTS = {
    instagram: 1500,   // ← tu número real
    youtube: 420,
    tiktok: 250,
    facebook: 800
};
```

Los contadores animan de 0 a tu número al hacer scroll. Si dejas en `0`, muestra "—".

### 3. Handles de TikTok
El link a TikTok apunta a `@javimxoficial`. Si tu handle real es distinto, actualiza en `index.html` (busca `tiktok.com/@javimxoficial`).

### 4. Contenido destacado
En la sección `Contenido destacado`, hay 3 placeholders. Reemplaza con:
- Miniatura de tu video más viral (thumb custom)
- Link real al post/video
- Título real

### 5. Domain / hosting
Deploy a Cloudflare Pages:
```bash
# 1. crear repo en GitHub (javimxoficial-site u otro nombre)
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/[user]/javimxoficial-site.git
git push -u origin main

# 2. En Cloudflare Pages dashboard:
#    - Import an existing Git repository
#    - Project name: javimxoficial
#    - Framework preset: None
#    - Build command: (vacío)
#    - Build output directory: /
#    - Deploy
```

URL final: `https://javimxoficial.pages.dev/`

## Diferencias visuales vs javividalm

| | javividalm | javimxoficial |
|---|---|---|
| Paleta | Purple + dark (`#818cf8`) | Warm gradient (`#f43f5e` → `#f97316` → `#fbbf24`) |
| Tipografía | Inter | Poppins (headers) + Inter (body) |
| Vibe | Tech · minimalista · serio | Creator · expressive · aspiracional |
| Foco | Código, proyectos, expertise | Personalidad, contenido, comunidad |
| CTA principal | Contratar / Ver proyecto | Seguir en redes / Colabora |

## Cross-linking recomendado

Para reforzar tu entidad SEO/GEO ante Google e IAs:

- Este sitio linkea a `javividalm.pages.dev` (portafolio tech) en hero social + footer
- `javividalm.pages.dev` debería linkear de vuelta a este sitio en el footer

Google entiende que ambos son la misma persona y consolida autoridad de dominio.

---

**Autor**: Javier Vidal Miguel · [@javimxoficial](https://instagram.com/javimxoficial)
