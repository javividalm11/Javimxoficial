/**
 * Cloudflare Pages Function — /api/chat
 * AI brain for the @javimxoficial assistant (chatbot + voice bot).
 * Uses Google Gemini (gemini-2.0-flash). Set GEMINI_API_KEY in the
 * Cloudflare Pages project → Settings → Environment variables.
 *
 * Request  (POST JSON): { message: string, history: [{role:'user'|'assistant', content:string}] }
 * Response (JSON):      { message: string }
 */

const SYSTEM_PROMPT = `Eres "Javi IA", el asistente virtual de Javi (@javimxoficial): creador de contenido tech, Cloud Engineer, Full Stack Developer y founder. Hablas en nombre de su marca.

TONO: cercano, claro y breve (2-4 frases). Responde SIEMPRE en el mismo idioma del usuario (español o inglés). Usa un estilo profesional pero relajado, con la energía de un creador tech.

QUÉ OFRECE JAVI (servicios "Trabaja conmigo" — presencia digital + automatización con IA para negocios):
- BÁSICO "Presencia Digital": Todo incluido $150 USD + $50/mes · Sin hosting $100 USD + $40/mes. Landing profesional, Google My Business, WhatsApp, SSL, mobile-first, entrega 5-7 días.
- PRO "Automatización Inteligente" (el más elegido): Todo incluido $350 USD + $100/mes · Sin hosting $300 USD + $80/mes. Todo lo del básico + reservas online, bot de WhatsApp con IA, recordatorios, reactivación de clientes, SEO local, reportes.
- PREMIUM "Ecosistema Digital Completo": Todo incluido $700 USD + $250/mes · Sin hosting $500 USD + $200/mes. Todo lo del pro + bot con memoria, CRM, campañas WhatsApp, 12 posts/mes con IA, blog SEO, pagos online, soporte prioritario.
- PLAN PERSONALIZADO: se arma a la medida y según el presupuesto del cliente.

PROYECTOS: Clínica Cordel (clínica dental), Pacas Tannya (e-commerce), Veoplaca (IA/visión), The Silencers (comunidad gamer), AegisAI (agentes de IA).

CONTACTO: WhatsApp +52 287 125 4233 · Email javividalm11@gmail.com · Instagram @javimxoficial.

REGLAS:
- Si preguntan precios, da el rango correcto y sugiere el diagnóstico gratis.
- Si el usuario quiere contratar o cotizar, invítalo a WhatsApp (+52 287 125 4233) o al Plan Personalizado del sitio.
- No inventes datos ni prometas lo que no está listado. Si no sabes algo, ofrece contactar a Javi directamente.`;

function json(obj, status, extraHeaders = {}) {
    return new Response(JSON.stringify(obj), {
        status,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', ...extraHeaders },
    });
}

export async function onRequestOptions() {
    return new Response(null, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        },
    });
}

export async function onRequestPost(context) {
    const { request, env } = context;
    try {
        const { message, history = [] } = await request.json();
        if (!message || typeof message !== 'string') return json({ message: 'Escríbeme tu pregunta y con gusto te ayudo.' }, 200);

        const key = env.GEMINI_API_KEY;
        if (!key) {
            return json({ message: 'El asistente aún no está configurado. Puedes escribirme por WhatsApp al +52 287 125 4233 o a javividalm11@gmail.com 😊' }, 200);
        }

        const contents = [];
        for (const h of (Array.isArray(history) ? history.slice(-18) : [])) {
            if (!h || !h.content) continue;
            contents.push({ role: h.role === 'assistant' ? 'model' : 'user', parts: [{ text: String(h.content) }] });
        }
        contents.push({ role: 'user', parts: [{ text: message }] });

        const body = {
            systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
            contents,
            generationConfig: { temperature: 0.7, maxOutputTokens: 500, topP: 0.95 },
        };

        const controller = new AbortController();
        const t = setTimeout(() => controller.abort(), 20000);
        const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`,
            { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: controller.signal }
        );
        clearTimeout(t);

        if (!res.ok) {
            const errText = await res.text();
            console.error('[api/chat] Gemini error', res.status, errText.slice(0, 300));
            const debug = new URL(request.url).searchParams.get('debug') === '1';
            if (debug) return json({ message: 'GEMINI ' + res.status + ': ' + errText.slice(0, 500) }, 200);
            return json({ message: 'Tuve un problema para responder ahora mismo. Intenta de nuevo o escríbeme por WhatsApp al +52 287 125 4233.' }, 200);
        }

        const data = await res.json();
        const reply = data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('').trim()
            || 'Disculpa, no pude procesar eso. ¿Puedes reformularlo?';
        return json({ message: reply }, 200);
    } catch (e) {
        console.error('[api/chat] error', e && e.message);
        return json({ message: 'Ups, algo falló de mi lado. Escríbeme por WhatsApp al +52 287 125 4233 y te ayudo de inmediato.' }, 200);
    }
}
