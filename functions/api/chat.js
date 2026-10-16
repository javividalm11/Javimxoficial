import { getCatalogReply } from '../../js/jai-catalog.js';

/* /api/chat · cerebro IA (Gemini). Requiere env GEMINI_API_KEY en Cloudflare Pages. */

const SYSTEM_PROMPT = `Eres "JAVI IA", el asistente digital de Javi (@javimxoficial): creador de contenido tech, Cloud Engineer, Full Stack Developer y founder. Hablas en nombre de su marca.

TONO: cercano, claro y breve (2-4 frases). Responde SIEMPRE en el mismo idioma del usuario (español o inglés). Usa un estilo profesional pero relajado, con la energía de un creador tech.

QUÉ OFRECE JAVI (servicios "Trabaja conmigo" — presencia digital + automatización con IA para negocios):
- BÁSICO "Presencia Digital": Todo incluido $250 USD · Sin hosting $150 USD. Landing profesional, Google My Business, WhatsApp, SSL, mobile-first, entrega 5-7 días.
- PRO "Automatización Inteligente" (el más elegido): Todo incluido $700 USD · Sin hosting $500 USD. Todo lo del básico + reservas online, bot de WhatsApp con IA, recordatorios, reactivación de clientes, SEO local, reportes.
- PREMIUM "Ecosistema Digital Completo": Todo incluido $1,500 USD · Sin hosting $1,000 USD. Todo lo del pro + bot con memoria, CRM, campañas WhatsApp, 12 posts/mes con IA, blog SEO, pagos online, soporte prioritario.
- PLAN PERSONALIZADO: se arma a la medida y según el presupuesto del cliente.

PROYECTOS: ModArch (arquitectura e interiores, proyecto destacado), Clínica Cordel (clínica dental y reservas), Charms Studio (e-commerce de merch), White Apple (venta de iPhones), Pacas Tannya (e-commerce), Veoplaca (consulta vehicular), The Silencers (comunidad gamer), AegisAI (agentes de IA).

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

export async function onRequestPost({ request, env }) {
    let payload;
    try { payload = await request.json(); }
    catch { return json({ error: 'Solicitud JSON inválida.' }, 400); }
    const { message, history = [], language = 'es' } = payload || {};
    if (typeof message !== 'string' || !message.trim() || message.length > 2000) {
        return json({ error: 'Escribe una consulta de hasta 2000 caracteres.' }, 400);
    }
    const conversation = Array.isArray(history) ? history.slice(-18).filter(h =>
        h && ['user', 'assistant'].includes(h.role) && typeof h.content === 'string'
    ).map(h => ({ role: h.role, content: h.content.slice(0, 4000) })) : [];
    const fallback = reason => json({ message: getCatalogReply(message, conversation, language), mode: 'catalog', reason }, 200);
    const key = env.GEMINI_API_KEY;
    if (!key) return fallback('missing_api_key');
    const model = /^[a-zA-Z0-9.-]+$/.test(env.GEMINI_MODEL || '') ? env.GEMINI_MODEL : 'gemini-2.5-flash';
    const contents = conversation.map(h => ({
        role: h.role === 'assistant' ? 'model' : 'user', parts: [{ text: h.content }],
    }));
    contents.push({ role: 'user', parts: [{ text: message }] });
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
            method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
            body: JSON.stringify({
                systemInstruction: { parts: [{ text: SYSTEM_PROMPT + (language === 'en' ? '\nPreferred portfolio language: English. Respond in English unless the user explicitly asks for another language.' : '') }] }, contents,
                generationConfig: { temperature: 0.7, maxOutputTokens: 500, topP: 0.95 },
            }), signal: controller.signal,
        });
        if (!res.ok) {
            console.error('[api/chat] Provider status:', res.status);
            return fallback('provider_unavailable');
        }
        const data = await res.json();
        const reply = data?.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('').trim();
        return reply ? json({ message: reply, mode: 'ai' }, 200) : fallback('empty_response');
    } catch {
        console.error('[api/chat] Provider unavailable');
        return fallback('provider_unavailable');
    } finally { clearTimeout(timeout); }
}
