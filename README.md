# @javimxoficial · Personal creator brand

Sitio dedicado a la marca personal de **Javi (@javimxoficial)** como creador de contenido tech.

Arquitectura de 2 capas:
- **javividalm.pages.dev** → portafolio profesional (tech, dev, consultor)
- **javimxoficial.pages.dev** → marca personal creator (contenido, redes, colaboraciones)

## Stack

- HTML/CSS/JS vanilla (mismo enfoque que javividalm para máxima performance)
- Inter variable alojada localmente; Font Awesome alojado localmente
- Font Awesome 6.4
- Hosting: Cloudflare Pages (free tier permanente)

## Rediseño del portafolio

La portada reproduce la composición de la referencia con un paisaje cósmico,
tipografía blanca y degradados violeta/cian. `css/redesign.css` contiene los estilos
adaptables y `js/globe.js` dibuja un globo de partículas geográficas en Canvas 2D,
con rotación, conexiones, órbitas luminosas y una base holográfica.

Las cuatro tarjetas flotan de forma independiente y responden al puntero. Las
animaciones respetan `prefers-reduced-motion`; el Canvas se pausa cuando sale del
área visible o la pestaña queda oculta. No se requieren dependencias de ejecución
ni un proceso de build. Se conservan los proyectos, servicios y contacto existentes.

Para previsualizar con el chatbot, usa Node.js 20 o posterior:

```powershell
npm.cmd run dev
```

Abre `http://127.0.0.1:4173`. Este servidor ejecuta `/api/chat` además de servir
los archivos. Sin clave, el chatbot responde con información publicada del
portafolio y muestra su procedencia; estas respuestas no las genera una IA.
Live Server también permite este modo de consulta local, pero no ejecuta la API.

Para activar Gemini, copia `.dev.vars.example` a `.dev.vars`, completa
`GEMINI_API_KEY` con tu clave privada y reinicia el servidor. Puedes elegir el
modelo con `GEMINI_MODEL`. Las credenciales están excluidas de Git y el servidor
no sirve los archivos de configuración. En Cloudflare Pages, configura estas
variables en el entorno del proyecto.

Assets: `img/cosmic-landscape.png` (fondo generado), `fonts/` y `webfonts/` (fuentes
locales con sus licencias) y `data/land.geojson` ([Natural Earth, dominio público](https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_110m_land.geojson)).

## Estructura

La bienvenida permite elegir español o inglés y apariencia clara u oscura. Se
muestra una vez por sesión de pestaña; las preferencias se recuerdan en el
navegador y pueden cambiarse desde **Preferencias**, en el footer. Las traducciones
están en `data/translations-en.json` y los temas en `css/themes.css`. La animación
WebGL de bienvenida se pausa al entrar al sitio y respeta movimiento reducido.

La portada blanca usa su propia composición en `css/light-hero.css`: paisaje
dorado generado (`img/solar-landscape.webp`) y esfera solar procedural WebGL
(`js/solar-globe.js`). El prompt del paisaje está en
`img/solar-landscape.prompt.txt`. La esfera tiene alternativa CSS sin WebGL;
su animación se pausa fuera de pantalla, en segundo plano y con movimiento reducido.

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
