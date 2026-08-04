/* @javimxoficial · asistente IA (chatbot + voice bot) */
(function () {
    'use strict';
    const WA = 'https://wa.me/522871254233?text=' + encodeURIComponent('Hola Javi, vengo de tu web y quiero más información.');
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const synth = window.speechSynthesis;
    const VOICE_OK = !!(SR && synth);

    let history = [];
    let greeted = false;
    let recog = null, callActive = false, listening = false, muted = false, speaking = false;
    let els = {};

    // DOM
    function build() {
        const fabs = document.createElement('div');
        fabs.className = 'ai-fabs';
        fabs.innerHTML = `
            <button class="ai-fab ai-fab--voice" id="aiVoiceFab" data-label="Habla con Javi IA" type="button" aria-label="Voice bot">
                <span class="ai-fab__pulse"></span><i class="fas fa-microphone"></i>
            </button>
            <button class="ai-fab ai-fab--chat" id="aiChatFab" data-label="Chatea con Javi IA" type="button" aria-label="Chatbot">
                <span class="ai-fab__pulse"></span><i class="fas fa-comment-dots"></i>
            </button>`;

        const panel = document.createElement('div');
        panel.className = 'ai-panel';
        panel.innerHTML = `
            <div class="ai-head">
                <div class="ai-head__avatar"><i class="fas fa-robot"></i></div>
                <div class="ai-head__meta">
                    <span class="ai-head__title">Javi IA</span>
                    <span class="ai-head__status"><span class="ai-dot"></span> En línea · respuesta al instante</span>
                </div>
                <button class="ai-head__close" id="aiClose" aria-label="Cerrar">&times;</button>
            </div>
            <div class="ai-msgs" id="aiMsgs"></div>
            <div class="ai-quick" id="aiQuick"></div>
            <div class="ai-composer">
                <input type="text" id="aiInput" placeholder="Escribe tu mensaje…" autocomplete="off">
                ${VOICE_OK ? '<button class="ai-icon-btn ai-icon-btn--mic" id="aiMic" aria-label="Hablar" title="Hablar"><i class="fas fa-microphone"></i></button>' : ''}
                <button class="ai-icon-btn" id="aiSend" aria-label="Enviar"><i class="fas fa-paper-plane"></i></button>
            </div>
            <div class="ai-voice" id="aiVoice">
                <div class="ai-orb" id="aiOrb"></div>
                <div class="ai-voice__status" id="aiVoiceStatus">Toca para hablar</div>
                <div class="ai-voice__transcript" id="aiVoiceTx"></div>
                <div class="ai-voice__hint">Habla con naturalidad; te respondo por voz.</div>
                <div class="ai-voice__ctrls">
                    <button class="ai-voice__btn" id="aiMute" aria-label="Silenciar"><i class="fas fa-microphone"></i></button>
                    <button class="ai-voice__btn ai-voice__btn--end" id="aiEnd" aria-label="Terminar"><i class="fas fa-phone-slash"></i></button>
                </div>
            </div>`;

        document.body.appendChild(fabs);
        document.body.appendChild(panel);

        els = {
            fabs, panel,
            msgs: panel.querySelector('#aiMsgs'), quick: panel.querySelector('#aiQuick'),
            input: panel.querySelector('#aiInput'), send: panel.querySelector('#aiSend'),
            mic: panel.querySelector('#aiMic'), close: panel.querySelector('#aiClose'),
            voice: panel.querySelector('#aiVoice'), orb: panel.querySelector('#aiOrb'),
            vStatus: panel.querySelector('#aiVoiceStatus'), vTx: panel.querySelector('#aiVoiceTx'),
            mute: panel.querySelector('#aiMute'), end: panel.querySelector('#aiEnd'),
        };

        document.getElementById('aiChatFab').addEventListener('click', () => openPanel(false));
        document.getElementById('aiVoiceFab').addEventListener('click', () => openPanel(true));
        els.close.addEventListener('click', closePanel);
        els.send.addEventListener('click', sendFromInput);
        els.input.addEventListener('keydown', (e) => { if (e.key === 'Enter') sendFromInput(); });
        if (els.mic) els.mic.addEventListener('click', () => startCall());
        els.end.addEventListener('click', endCall);
        els.mute.addEventListener('click', toggleMute);
    }

    // Panel
    function openPanel(voice) {
        greet();
        els.panel.classList.add('is-open');
        els.fabs.style.display = 'none';
        if (voice && VOICE_OK) startCall();
        else els.input.focus();
    }
    function closePanel() {
        endCall();
        els.panel.classList.remove('is-open');
        els.fabs.style.display = '';
    }
    function greet() {
        if (greeted) return; greeted = true;
        addBubble('bot', '¡Hola! Soy Javi IA 🤓 Puedo contarte sobre los servicios, precios o proyectos de @javimxoficial. ¿En qué te ayudo?');
        renderQuick(['¿Qué servicios ofreces?', 'Precios', 'Ver proyectos', 'Contactar a Javi']);
    }
    function renderQuick(items) {
        els.quick.innerHTML = '';
        items.forEach((t) => {
            const b = document.createElement('button');
            b.type = 'button'; b.textContent = t;
            b.addEventListener('click', () => {
                if (t === 'Contactar a Javi') { window.open(WA, '_blank', 'noopener'); return; }
                els.quick.innerHTML = ''; send(t);
            });
            els.quick.appendChild(b);
        });
    }

    // Messages
    function addBubble(role, text) {
        const d = document.createElement('div');
        d.className = 'ai-msg ai-msg--' + (role === 'user' ? 'user' : 'bot');
        d.textContent = text;
        els.msgs.appendChild(d);
        els.msgs.scrollTop = els.msgs.scrollHeight;
        return d;
    }
    function showTyping() {
        const d = document.createElement('div');
        d.className = 'ai-typing'; d.id = 'aiTyping';
        d.innerHTML = '<span></span><span></span><span></span>';
        els.msgs.appendChild(d); els.msgs.scrollTop = els.msgs.scrollHeight;
    }
    function hideTyping() { const t = document.getElementById('aiTyping'); if (t) t.remove(); }

    function sendFromInput() {
        const v = els.input.value.trim();
        if (!v) return;
        els.input.value = ''; els.quick.innerHTML = '';
        send(v);
    }

    async function send(text, opts) {
        opts = opts || {};
        addBubble('user', text);
        history.push({ role: 'user', content: text });
        showTyping();
        if (callActive) setVoice('thinking', 'Pensando…');
        try {
            const ctrl = new AbortController();
            const to = setTimeout(() => ctrl.abort(), 22000);
            const res = await fetch('/api/chat', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text, history: history.slice(-18) }), signal: ctrl.signal,
            });
            clearTimeout(to);
            const data = await res.json().catch(() => ({}));
            const reply = (data && data.message) ? data.message
                : 'Disculpa, no pude procesar eso. Escríbeme por WhatsApp al +52 287 125 4233.';
            hideTyping();
            addBubble('bot', reply);
            history.push({ role: 'assistant', content: reply });
            if (opts.voice || callActive) speak(reply, () => { if (callActive && !muted) listen(); });
        } catch (e) {
            hideTyping();
            addBubble('bot', 'Ups, hubo un problema de conexión. Intenta de nuevo o escríbeme por WhatsApp al +52 287 125 4233.');
            if (callActive) setVoice('idle', 'Toca para hablar');
        }
    }

    // Voice
    function setVoice(state, status) {
        els.orb.className = 'ai-orb' + (state ? ' is-' + state : '');
        if (status != null) els.vStatus.textContent = status;
    }
    function startCall() {
        if (!VOICE_OK) return;
        els.voice.classList.add('is-active');
        callActive = true; muted = false;
        els.mute.innerHTML = '<i class="fas fa-microphone"></i>';
        listen();
    }
    function endCall() {
        callActive = false;
        try { if (recog) recog.abort(); } catch (e) {}
        try { synth.cancel(); } catch (e) {}
        listening = false; speaking = false;
        els.voice.classList.remove('is-active');
        setVoice('', '');
        els.vTx.textContent = '';
    }
    function toggleMute() {
        muted = !muted;
        els.mute.innerHTML = muted ? '<i class="fas fa-microphone-slash"></i>' : '<i class="fas fa-microphone"></i>';
        if (muted) { try { if (recog) recog.abort(); } catch (e) {} setVoice('idle', 'Micrófono silenciado'); }
        else if (!speaking) listen();
    }
    function listen() {
        if (!callActive || muted || speaking || listening) return;
        try {
            recog = new SR();
            recog.lang = 'es-MX'; recog.interimResults = true; recog.continuous = false; recog.maxAlternatives = 1;
            let finalText = '';
            recog.onstart = () => { listening = true; setVoice('', 'Escuchando…'); };
            recog.onresult = (e) => {
                let interim = '';
                for (let i = e.resultIndex; i < e.results.length; i++) {
                    const t = e.results[i][0].transcript;
                    if (e.results[i].isFinal) finalText += t; else interim += t;
                }
                els.vTx.textContent = finalText || interim;
            };
            recog.onerror = () => { listening = false; };
            recog.onend = () => {
                listening = false;
                const t = finalText.trim();
                if (t && callActive) { els.vTx.textContent = ''; send(t, { voice: true }); }
                else if (callActive && !muted && !speaking) setVoice('idle', 'Toca para hablar');
            };
            recog.start();
        } catch (e) { listening = false; }
    }
    function speak(text, cb) {
        if (!synth) { cb && cb(); return; }
        try { synth.cancel(); } catch (e) {}
        const u = new SpeechSynthesisUtterance(text);
        u.lang = 'es-MX';
        const v = (synth.getVoices() || []).find((x) => /es[-_]/i.test(x.lang));
        if (v) u.voice = v;
        u.rate = 1.03; u.pitch = 1;
        if (callActive) setVoice('speaking', 'Hablando…');
        speaking = true;
        u.onend = () => { speaking = false; if (callActive) setVoice('idle', 'Toca para hablar'); cb && cb(); };
        u.onerror = () => { speaking = false; cb && cb(); };
        synth.speak(u);
    }

    // voice list warmup
    if (VOICE_OK && synth) { try { synth.getVoices(); synth.onvoiceschanged = () => synth.getVoices(); } catch (e) {} }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build);
    else build();
})();
