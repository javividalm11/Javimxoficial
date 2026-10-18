# @javimxoficial

Portafolio y marca personal de **Javi (@javimxoficial)**: Full Stack, Cloud y automatización con IA.
Sitio estático (HTML/CSS/JS vanilla, sin build) con una función serverless para el asistente IA.

Producción: <https://javimxoficial.pages.dev> · Hosting: Cloudflare Pages (despliegue automático desde `main`).

## Inicio rápido

Requiere Node.js 20 o superior.

```bash
npm install        # solo herramientas de desarrollo (ESLint y Prettier)
npm run dev        # http://127.0.0.1:4173 (sitio + /api/chat)
```

El servidor local aplica las mismas cabeceras de seguridad que producción (`_headers`).

| Comando                | Qué hace                                  |
| ---------------------- | ----------------------------------------- |
| `npm run dev`          | Servidor local con `/api/chat`            |
| `npm run lint`         | ESLint sobre JS y funciones               |
| `npm run format`       | Formatea JS con Prettier                  |
| `npm run format:check` | Verifica el formato sin modificar archivos |

## Configuración

### Asistente IA (Gemini)

Sin clave, el asistente responde con el catálogo del portafolio (`js/jai-catalog.js`),
etiquetado como "Información del portafolio". Con clave, usa Gemini.

1. Copia `.dev.vars.example` a `.dev.vars` y completa `GEMINI_API_KEY` (opcional: `GEMINI_MODEL`).
2. En Cloudflare Pages: **Settings → Variables and secrets**, tipo *Secret*. Aplican en el siguiente despliegue.

La clave vive solo en el servidor y nunca se envía al navegador.

### Datos de contacto

Se definen una sola vez en `js/site-config.js` (WhatsApp y email). El navegador los recibe
por `js/config-global.js` y el servidor los importa directamente. Los enlaces estáticos
de `index.html` (`wa.me`) deben actualizarse a mano si cambia el número.

### Contadores sociales

`data/social-counts.json` alimenta los contadores. Si falta un valor, la interfaz muestra "—".

## Seguridad

- **Secretos:** `.env*`, `.dev.vars*`, `*.pem` y `*.key` están en `.gitignore`. Solo se versiona `.dev.vars.example`.
- **`/api/chat`:** mismo origen (sin CORS abierto), límites de tamaño y de historial, validación de tipos,
  idioma en lista blanca, rate-limit por IP y errores genéricos. El limitador es best-effort por instancia;
  para protección real, añade una regla de rate limiting en Cloudflare (WAF).
- **Cabeceras (`_headers`):** CSP estricta (`script-src 'self'`, sin `unsafe-inline`), `X-Frame-Options`,
  `nosniff`, `Referrer-Policy`, `Permissions-Policy` y HSTS.
- **Enlaces externos:** `rel="noopener noreferrer"`. El contenido dinámico se escapa antes de insertarlo en el DOM.
- **Antes de subir:** revisa que no haya claves en el diff (`git diff --staged`).

Si modificas la CSP, no agregues scripts ni estilos inline: muévelos a archivos en `js/` o `css/`.

## Estructura

```
├── index.html            # página única
├── _headers              # cabeceras de seguridad y caché (Cloudflare Pages)
├── css/                  # estilos por sección y tema (claro/oscuro)
├── js/
│   ├── site-config.js    # contacto (fuente única)
│   ├── theme-init.js     # tema y bienvenida antes del primer render
│   ├── assistant.js      # widget JAVI IA (chat y voz)
│   ├── jai-catalog.js    # respuestas de respaldo sin IA
│   └── ...               # globo, partículas, proyectos, contacto, i18n
├── functions/api/chat.js # función serverless del asistente
├── scripts/dev-server.mjs# servidor local
├── data/                 # geojson, traducciones y contadores
├── fonts/ webfonts/      # tipografías locales con sus licencias
└── img/                  # imágenes y miniaturas de proyectos
```

## Convenciones

- JS legible y formateado con Prettier; `npm run lint` debe terminar sin errores.
- Comentarios cortos que expliquen el porqué, no el qué. Nada de bloques largos.
- Los `catch` nunca van vacíos: indica por qué se ignora el error.
- Usa `const` por defecto, `===` siempre y constantes con nombre en lugar de números mágicos.

## Despliegue

Cloudflare Pages: framework *None*, comando de build vacío, directorio de salida `/`.
Cada push a `main` despliega automáticamente. Tras añadir variables de entorno, vuelve a desplegar.

## Créditos y licencias

- Datos geográficos: [Natural Earth](https://github.com/nvkelso/natural-earth-vector) (dominio público).
- Tipografía Inter, Font Awesome y flag-icons: licencias incluidas junto a cada recurso.

**Autor:** Javier Vidal Miguel · [@javimxoficial](https://instagram.com/javimxoficial)
