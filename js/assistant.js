/* JAVI IA: chat y voz */
(function () {
  'use strict';
  const { SITE } = window;
  const WA = SITE.whatsappUrl('Hola Javi, vengo de tu web y quiero más información.');
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const synth = window.speechSynthesis;
  const VOICE_OK = !!(SR && synth);

  let history = [];
  let busy = false;
  let logo = null;
  let panelLogo = null;
  let voiceSphere = null;
  let greeted = false;
  let recog = null,
    callActive = false,
    listening = false,
    muted = false,
    speaking = false;
  let recognitionRestart = null,
    stopListening = null;
  const WAVE_BARS = 37;
  let els = {};

  // DOM
  function buildWaveform(container) {
    const center = (WAVE_BARS - 1) / 2;
    for (let i = 0; i < WAVE_BARS; i += 1) {
      const bar = document.createElement('span');
      const height = 8 + Math.pow(1 - Math.abs(i - center) / center, 1.4) * 68;
      bar.style.setProperty('--bar-height', `${height}px`);
      bar.style.setProperty('--bar-delay', `${-i * 0.09}s`);
      container.appendChild(bar);
    }
  }

  function build() {
    const fabs = document.createElement('div');
    fabs.className = 'ai-fabs jai-widget';
    fabs.innerHTML = `
            <button class="jai-launcher" id="jaiLauncher" type="button" aria-label="Habla con JAVI IA, tu asistente digital" aria-expanded="false" aria-controls="aiPanel">
                <span class="jai-callout"><strong>Habla con JAVI IA</strong><span>Tu asistente digital</span></span>
                <span class="jai-emblem" aria-hidden="true"><canvas id="jaiLogo" class="jai-logo"></canvas><span class="jai-logo-fallback">JIA</span></span>
            </button>`;

    const panel = document.createElement('div');
    panel.className = 'ai-panel';
    panel.id = 'aiPanel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-labelledby', 'jaiPanelTitle');
    panel.setAttribute('aria-hidden', 'true');
    panel.innerHTML = `
            <div class="ai-head">
                <button type="button" class="ai-head__back" id="jaiBack" aria-label="Volver a las opciones de JAVI IA" hidden><i class="fas fa-arrow-left" aria-hidden="true"></i></button>
                <div class="ai-head__avatar jai-head-logo jai-panel-emblem" aria-hidden="true"><canvas id="jaiPanelLogo" class="jai-logo"></canvas><span class="jai-logo-fallback">JIA</span></div>
                <div class="ai-head__meta">
                    <span class="ai-head__title" id="jaiPanelTitle">JAVI IA</span>
                    <span class="ai-head__status" id="jaiPanelSubtitle">¿Cómo puedo ayudarte?</span>
                </div>
                <button class="ai-head__close" id="aiClose" aria-label="Cerrar">&times;</button>
            </div>
            <nav class="jai-menu" id="jaiMenu" aria-label="Opciones de JAVI IA">
                <button type="button" class="jai-menu-option" id="jaiMenuVoice" ${VOICE_OK ? '' : 'disabled title="La voz no está disponible en este navegador; puedes hacer una consulta por escrito"'}><span class="jai-menu-icon"><i class="fas fa-microphone" aria-hidden="true"></i></span><span>Hablar con JAVI IA por voz</span><i class="fas fa-chevron-right" aria-hidden="true"></i></button>
                <button type="button" class="jai-menu-option" id="jaiMenuChat"><span class="jai-menu-icon"><i class="far fa-comment-dots" aria-hidden="true"></i></span><span>Hacer una consulta</span><i class="fas fa-chevron-right" aria-hidden="true"></i></button>
                <a class="jai-menu-option" id="jaiMenuCall" href="${SITE.whatsappUrl('Hola Javi, me gustaría agendar una llamada para hablar de mi proyecto.')}" target="_blank" rel="noopener"><span class="jai-menu-icon"><i class="far fa-calendar" aria-hidden="true"></i></span><span>Agendar una llamada</span><i class="fas fa-chevron-right" aria-hidden="true"></i></a>
                <a class="jai-menu-option" id="jaiMenuProposal" href="#contacto"><span class="jai-menu-icon"><i class="far fa-file-lines" aria-hidden="true"></i></span><span>Solicitar una propuesta</span><i class="fas fa-chevron-right" aria-hidden="true"></i></a>
                <a class="jai-menu-option" id="jaiMenuAbout" href="#sobre-mi"><span class="jai-menu-icon"><i class="fas fa-users" aria-hidden="true"></i></span><span>Conocer más sobre Javi</span><i class="fas fa-chevron-right" aria-hidden="true"></i></a>
            </nav>
            <div class="ai-modes" role="group" aria-label="Modo de conversación"><button type="button" id="aiChatMode" class="is-active" aria-pressed="true"><i class="far fa-comment-dots" aria-hidden="true"></i> Escribir</button><button type="button" id="aiVoiceMode" aria-pressed="false" ${VOICE_OK ? '' : 'disabled title="La voz no está disponible en este navegador"'}><i class="fas fa-microphone" aria-hidden="true"></i> Hablar</button></div>
            <div class="ai-msgs" id="aiMsgs" role="log" aria-live="polite" aria-relevant="additions" aria-label="Conversación con JAVI IA"></div>
            <div class="ai-quick" id="aiQuick"></div>
            <div class="ai-composer">
                <button type="button" class="jai-chat-attach" id="jaiAttach" aria-label="Adjuntar archivo de texto" title="Adjuntar texto (.txt o .md)"><i class="fas fa-paperclip" aria-hidden="true"></i></button><input type="file" id="jaiAttachment" accept=".txt,.md,text/plain,text/markdown" hidden>
                <input type="text" id="aiInput" placeholder="Escribe tu mensaje…" autocomplete="off" maxlength="2000" aria-label="Mensaje para JAVI IA">
                ${VOICE_OK ? '<button class="ai-icon-btn ai-icon-btn--mic" id="aiMic" aria-label="Hablar" title="Hablar"><i class="fas fa-microphone"></i></button>' : ''}
                <button class="ai-icon-btn" id="aiSend" aria-label="Enviar"><i class="fas fa-paper-plane"></i></button>
            </div>
            <button type="button" class="jai-chat-footer" id="jaiChatVoiceHint" ${VOICE_OK ? '' : 'disabled'}><i class="fas fa-microphone" aria-hidden="true"></i> También puedes hablar con JAVI IA por voz</button>
            <p class="jai-attachment-status" id="jaiAttachmentStatus" role="status"></p>
            <div class="ai-voice" id="aiVoice">
                <div class="jai-voice-art">
                <button type="button" class="ai-orb" id="aiOrb" aria-label="Toca para hablar con JAVI IA"><svg class="jai-voice-waves" viewBox="0 0 400 270" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="jaiWaveColor"><stop stop-color="#7747e4" stop-opacity=".1"/><stop offset=".5" stop-color="#cf6bff"/><stop offset="1" stop-color="#7747e4" stop-opacity=".1"/></linearGradient></defs><path d="M0 138 Q28 83 56 132 T112 133 T168 137 T224 135 T280 133 T336 138 T400 128"/><path d="M0 128 Q28 171 56 137 T112 132 T168 138 T224 135 T280 139 T336 123 T400 145"/></svg><canvas id="jaiVoiceSphere" aria-hidden="true"></canvas><span class="jai-sphere-fallback" aria-hidden="true"></span></button>
                <span class="jai-waveform" aria-hidden="true"></span>
                </div>
                <div class="ai-voice__status" id="aiVoiceStatus" role="status">Tu asistente digital.</div>
                <div class="ai-voice__transcript" id="aiVoiceTx" aria-live="polite"></div>
                <div class="ai-voice__hint" id="jaiVoiceHint">Te ayudo a crear, automatizar y hacer crecer tus ideas con IA.</div>
                <div class="jai-processing" id="jaiProcessing" aria-label="Estado de la consulta"><p><i class="far fa-circle-check" aria-hidden="true"></i> Consulta recibida</p><p><i class="fas fa-circle-notch" aria-hidden="true"></i> Preparando tu respuesta</p></div>
                <div class="ai-voice__ctrls">
                    <button class="ai-voice__btn" id="aiMute" aria-label="Toca para hablar"><i class="fas fa-microphone"></i></button>
                    <button class="ai-voice__btn ai-voice__btn--end" id="aiEnd" aria-label="Finalizar y volver al menú"><i class="fas fa-phone-slash"></i></button>
                    <button type="button" class="ai-voice__btn jai-transcript-button" id="jaiTranscript" aria-label="Ver transcripción" aria-controls="jaiVoiceHistory" aria-expanded="false"><i class="far fa-file-lines" aria-hidden="true"></i></button>
                </div>
                <p class="jai-voice-guide" id="jaiVoiceGuide">Iniciar conversación por voz</p>
                <div class="jai-voice-history" id="jaiVoiceHistory" hidden aria-label="Transcripción de la conversación"></div>
            </div>`;

    buildWaveform(panel.querySelector('.jai-waveform'));
    document.body.appendChild(fabs);
    document.body.appendChild(panel);

    els = {
      fabs,
      panel,
      launcher: fabs.querySelector('#jaiLauncher'),
      chatMode: panel.querySelector('#aiChatMode'),
      voiceMode: panel.querySelector('#aiVoiceMode'),
      menu: panel.querySelector('#jaiMenu'),
      back: panel.querySelector('#jaiBack'),
      subtitle: panel.querySelector('#jaiPanelSubtitle'),
      msgs: panel.querySelector('#aiMsgs'),
      quick: panel.querySelector('#aiQuick'),
      input: panel.querySelector('#aiInput'),
      send: panel.querySelector('#aiSend'),
      mic: panel.querySelector('#aiMic'),
      close: panel.querySelector('#aiClose'),
      voice: panel.querySelector('#aiVoice'),
      orb: panel.querySelector('#aiOrb'),
      vStatus: panel.querySelector('#aiVoiceStatus'),
      vTx: panel.querySelector('#aiVoiceTx'),
      mute: panel.querySelector('#aiMute'),
      end: panel.querySelector('#aiEnd'),
      hint: panel.querySelector('#jaiVoiceHint'),
      guide: panel.querySelector('#jaiVoiceGuide'),
      transcript: panel.querySelector('#jaiTranscript'),
      voiceHistory: panel.querySelector('#jaiVoiceHistory'),
    };

    els.launcher.addEventListener('click', () =>
      els.panel.classList.contains('is-open') ? closePanel() : openPanel()
    );
    panel.querySelector('#jaiMenuChat').addEventListener('click', () => showConversation(false));
    panel.querySelector('#jaiMenuVoice').addEventListener('click', () => showConversation(true));
    els.back.addEventListener('click', showMenu);
    panel.querySelector('#jaiMenuCall').addEventListener('click', closePanel);
    panel.querySelector('#jaiMenuAbout').addEventListener('click', closePanel);
    panel.querySelector('#jaiMenuProposal').addEventListener('click', () => {
      closePanel();
      requestAnimationFrame(() =>
        document.getElementById('proposalName')?.focus({ preventScroll: true })
      );
    });
    els.chatMode.addEventListener('click', () => {
      endCall();
      els.input.focus();
    });
    els.voiceMode.addEventListener('click', startCall);
    panel.querySelector('#jaiChatVoiceHint').addEventListener('click', startCall);
    panel
      .querySelector('#jaiAttach')
      .addEventListener('click', () => panel.querySelector('#jaiAttachment').click());
    panel.querySelector('#jaiAttachment').addEventListener('change', async (event) => {
      const file = event.target.files[0];
      if (!file) return;
      const feedback = panel.querySelector('#jaiAttachmentStatus');
      if (!/\.(txt|md)$/i.test(file.name) || file.size > 65536) {
        feedback.textContent = 'Selecciona un archivo .txt o .md de hasta 64 KB.';
        event.target.value = '';
        return;
      }
      try {
        const text = `[${file.name}] ${(await file.text()).replace(/\s+/g, ' ')}`;
        els.input.value = text.slice(0, 2000);
        feedback.textContent =
          text.length > 2000
            ? 'Texto cargado: se usarán los primeros 2000 caracteres.'
            : 'Texto cargado. Revísalo antes de enviarlo.';
        els.input.focus();
      } catch {
        feedback.textContent = 'No pude leer el archivo. Puedes copiar el texto en el mensaje.';
      }
      event.target.value = '';
    });
    els.orb.addEventListener('click', listen);
    if (window.createJaiLogo) logo = window.createJaiLogo(fabs.querySelector('#jaiLogo'));
    if (window.createJaiLogo) {
      panelLogo = window.createJaiLogo(panel.querySelector('#jaiPanelLogo'));
      panelLogo.pause();
    }
    if (window.createJaiVoiceSphere)
      voiceSphere = window.createJaiVoiceSphere(panel.querySelector('#jaiVoiceSphere'));
    els.transcript.addEventListener('click', () => {
      const open = els.voiceHistory.hidden;
      els.voiceHistory.hidden = !open;
      els.transcript.setAttribute('aria-expanded', String(open));
      els.voiceHistory.replaceChildren();
      for (const item of history) {
        const line = document.createElement('p');
        line.textContent = `${item.role === 'user' ? 'Tú' : 'JAVI IA'}: ${item.content}`;
        els.voiceHistory.append(line);
      }
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && els.panel.classList.contains('is-open')) closePanel();
    });
    els.close.addEventListener('click', closePanel);
    els.send.addEventListener('click', sendFromInput);
    els.input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') sendFromInput();
    });
    if (els.mic) els.mic.addEventListener('click', () => startCall());
    els.end.addEventListener('click', showMenu);
    els.mute.addEventListener('click', toggleMute);
    observeFooter();
  }

  function observeFooter() {
    const footer = document.querySelector('.contact-footer, footer');
    if (!footer) return;
    let hidden = false;
    let fadeTimer;
    const update = () => {
      const rect = footer.getBoundingClientRect();
      const visible = rect.top < window.innerHeight && rect.bottom > 0;
      if (visible === hidden) return;
      hidden = visible;
      clearTimeout(fadeTimer);
      if (hidden) {
        const hadFocus =
          els.panel.contains(document.activeElement) || els.fabs.contains(document.activeElement);
        fadeTimer = setTimeout(
          () => closePanel({ restoreFocus: false }),
          window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 320
        );
        if (hadFocus) footer.querySelector('a')?.focus({ preventScroll: true });
        logo?.pause();
      } else if (!document.hidden) logo?.resume();
      els.fabs.classList.toggle('is-footer-hidden', hidden);
      els.panel.classList.toggle('is-footer-hidden', hidden);
      els.fabs.inert = hidden;
      els.panel.inert = hidden;
      els.panel.setAttribute(
        'aria-hidden',
        String(hidden || !els.panel.classList.contains('is-open'))
      );
      if (hidden) els.fabs.setAttribute('aria-hidden', 'true');
      else els.fabs.removeAttribute('aria-hidden');
    };
    update();
    if ('IntersectionObserver' in window) new IntersectionObserver(update).observe(footer);
    else window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update, { passive: true });
  }

  // Panel
  function openPanel() {
    els.panel.classList.add('is-open');
    els.panel.setAttribute('aria-hidden', 'false');
    els.launcher.setAttribute('aria-expanded', 'true');
    els.fabs.classList.add('is-panel-open');
    els.launcher.setAttribute('aria-label', 'Cerrar las opciones de JAVI IA');
    panelLogo?.resume();
    showMenu();
  }
  function showMenu() {
    endCall();
    els.panel.classList.remove('is-chat');
    els.panel.classList.add('is-menu');
    els.menu.hidden = false;
    els.back.hidden = true;
    els.menu.scrollTop = 0;
    els.subtitle.textContent = '¿Cómo puedo ayudarte?';
    els.menu.querySelector('button:not(:disabled)').focus({ preventScroll: true });
  }
  function showConversation(voice) {
    els.panel.classList.remove('is-menu');
    els.panel.classList.toggle('is-chat', !voice);
    els.menu.hidden = true;
    els.back.hidden = false;
    els.subtitle.textContent = 'Tu asistente digital';
    greet();
    if (voice && VOICE_OK) {
      startCall();
      els.mute.focus({ preventScroll: true });
    } else els.input.focus();
  }
  function closePanel(options = {}) {
    endCall();
    els.panel.classList.remove('is-open');
    els.panel.setAttribute('aria-hidden', 'true');
    els.launcher.setAttribute('aria-expanded', 'false');
    els.fabs.classList.remove('is-panel-open');
    els.launcher.setAttribute('aria-label', 'Habla con JAVI IA, tu asistente digital');
    panelLogo?.pause();
    if (options.restoreFocus !== false) els.launcher.focus({ preventScroll: true });
  }
  function greet() {
    if (greeted) return;
    greeted = true;
    addBubble(
      'bot',
      'Hola, soy JAVI IA. Puedo ayudarte a encontrar la mejor solución digital para tu negocio.'
    );
    const shortcuts = document.createElement('div');
    shortcuts.className = 'jai-chat-shortcuts';
    shortcuts.innerHTML = `<button type="button" data-jai-shortcut="projects"><i class="fas fa-border-all" aria-hidden="true"></i> Ver proyectos <i class="fas fa-chevron-right" aria-hidden="true"></i></button><button type="button" data-jai-shortcut="services"><i class="fas fa-cube" aria-hidden="true"></i> Conocer servicios <i class="fas fa-chevron-right" aria-hidden="true"></i></button><button type="button" data-jai-shortcut="proposal"><i class="far fa-file-lines" aria-hidden="true"></i> Solicitar propuesta <i class="fas fa-chevron-right" aria-hidden="true"></i></button><button type="button" class="jai-shortcut-voice" data-jai-shortcut="voice" ${VOICE_OK ? '' : 'disabled'}><i class="fas fa-wave-square" aria-hidden="true"></i> Hablar por voz <i class="fas fa-chevron-right" aria-hidden="true"></i></button>`;
    shortcuts.addEventListener('click', (event) => {
      const action = event.target.closest('[data-jai-shortcut]')?.dataset.jaiShortcut;
      if (action === 'voice') startCall();
      if (action === 'services') send('¿Qué servicios ofreces?');
      if (action === 'projects') {
        addBubble(
          'bot',
          'Estos son algunos de los proyectos reales de Javi. Puedes explorar cada caso.'
        );
        showProjectCards();
      }
      if (action === 'proposal') {
        closePanel();
        location.hash = '#contacto';
        requestAnimationFrame(() =>
          document.getElementById('proposalName')?.focus({ preventScroll: true })
        );
      }
    });
    els.msgs.append(shortcuts);
    renderQuick(['Recomiéndame un plan', 'Quiero una cotización']);
  }
  function renderQuick(items) {
    els.quick.innerHTML = '';
    items.forEach((t) => {
      const b = document.createElement('button');
      b.type = 'button';
      const icon = document.createElement('i');
      icon.className = t.includes('plan') ? 'fas fa-wand-magic-sparkles' : 'far fa-file-lines';
      icon.setAttribute('aria-hidden', 'true');
      b.append(icon, document.createTextNode(t));
      b.addEventListener('click', () => {
        if (t === 'Contactar a Javi') {
          window.open(WA, '_blank', 'noopener,noreferrer');
          return;
        }
        send(t);
      });
      els.quick.appendChild(b);
    });
  }

  // Messages
  function addBubble(role, text) {
    const row = document.createElement('div');
    row.className = 'jai-message-row jai-message-row--' + (role === 'user' ? 'user' : 'bot');
    const avatar = document.createElement('span');
    avatar.className = 'jai-message-avatar';
    avatar.setAttribute('aria-hidden', 'true');
    avatar.textContent = role === 'user' ? 'Tú' : 'JIA';
    const d = document.createElement('div');
    d.className = 'ai-msg ai-msg--' + (role === 'user' ? 'user' : 'bot');
    const body = document.createElement('p');
    body.textContent = role === 'bot' ? window.PortfolioI18n?.t(text) || text : text;
    d.append(body);
    const stamp = document.createElement('time');
    stamp.dateTime = new Date().toISOString();
    stamp.textContent = new Date().toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    stamp.className = 'jai-message-time';
    d.append(stamp);
    row.append(avatar, d);
    els.msgs.appendChild(row);
    els.msgs.scrollTop = els.msgs.scrollHeight;
    return d;
  }
  function showProjectCards(query = '') {
    const data = document.getElementById('projectsData');
    if (!data) return;
    const projects = JSON.parse(data.textContent);
    const ids = /tienda|commerce|producto/i.test(query)
      ? ['charms-studio', 'white-apple']
      : ['modarch', 'clínica-cordel'];
    const list = document.createElement('div');
    list.className = 'jai-chat-projects';
    list.setAttribute('aria-label', 'Proyectos recomendados');
    for (const id of ids) {
      const project = projects.find((item) => item.id === id);
      if (!project) continue;
      const card = document.createElement('article');
      const img = document.createElement('img');
      img.src = project.image;
      img.alt = project.name;
      img.loading = 'lazy';
      const title = document.createElement('h4');
      title.textContent = project.name;
      const description = document.createElement('p');
      description.textContent = project.description;
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = 'Ver caso →';
      button.addEventListener('click', () => {
        closePanel();
        document.dispatchEvent(
          new CustomEvent('portfolio:open-case', { detail: { id: project.id } })
        );
      });
      card.append(img, title, description, button);
      list.append(card);
    }
    els.msgs.append(list);
    els.msgs.scrollTop = els.msgs.scrollHeight;
  }
  function showTyping() {
    const d = document.createElement('div');
    d.className = 'ai-typing';
    d.id = 'aiTyping';
    d.innerHTML = '<span></span><span></span><span></span>';
    els.msgs.appendChild(d);
    els.msgs.scrollTop = els.msgs.scrollHeight;
  }
  function hideTyping() {
    const t = document.getElementById('aiTyping');
    if (t) t.remove();
  }

  function sendFromInput() {
    if (busy) return;
    const v = els.input.value.trim();
    if (!v) return;
    els.input.value = '';
    els.panel.querySelector('#jaiAttachmentStatus').textContent = '';
    send(v);
  }

  async function send(text) {
    if (busy) return;
    text = window.PortfolioI18n?.t(text) || text;
    busy = true;
    els.send.disabled = true;
    addBubble('user', text);
    history.push({ role: 'user', content: text });
    showTyping();
    if (callActive) setVoice('thinking', 'Analizando tu consulta…');
    let to;
    try {
      const ctrl = new AbortController();
      to = setTimeout(() => ctrl.abort(), 22000);
      let data;
      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: text,
            history: history.slice(0, -1).slice(-18),
            language: window.PortfolioI18n?.language || 'es',
          }),
          signal: ctrl.signal,
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          const rateLimited = res.status === 429 && typeof body.error === 'string';
          throw Object.assign(new Error('Chat unavailable'), {
            userMessage: rateLimited ? body.error : undefined,
          });
        }
        data = await res.json();
        if (typeof data.message !== 'string' || !data.message.trim())
          throw new Error('Invalid chat response');
      } catch (error) {
        if (!['localhost', '127.0.0.1', '[::1]'].includes(location.hostname)) throw error;
        const { getCatalogReply } = await import('./jai-catalog.js');
        data = {
          message: getCatalogReply(text, history.slice(0, -1), window.PortfolioI18n?.language),
          mode: 'catalog',
        };
      }
      clearTimeout(to);
      const reply = data.message;
      hideTyping();
      const bubble = addBubble('bot', reply);
      if (data.mode === 'catalog') {
        const source = document.createElement('span');
        source.className = 'jai-message-source';
        source.textContent = 'Información del portafolio';
        bubble.prepend(source);
      }
      if (!callActive)
        els.subtitle.textContent =
          data.mode === 'catalog' ? 'Respuestas del portafolio' : 'Tu asistente digital';
      history.push({ role: 'assistant', content: reply });
      if (
        !callActive &&
        /proyecto|ejemplo|portafolio|web|sitio|página|tienda|project|example|portfolio|store/i.test(
          text
        )
      )
        showProjectCards(text);
      if (callActive) {
        els.vTx.textContent = reply;
        speak(reply, () => {
          setTimeout(() => {
            if (callActive && !muted) listen();
          }, 0);
        });
      }
    } catch (error) {
      hideTyping();
      addBubble(
        'bot',
        error.userMessage ||
          'Ups, hubo un problema de conexión. Intenta de nuevo o escríbeme por WhatsApp desde la sección Contacto.'
      );
      if (callActive) setVoice('idle', 'Toca para hablar');
    } finally {
      clearTimeout(to);
      busy = false;
      els.send.disabled = false;
      history = history.slice(-36);
    }
  }

  // Voice
  function setVoice(state, status) {
    els.orb.classList.remove('is-thinking', 'is-speaking', 'is-idle');
    if (state) els.orb.classList.add('is-' + state);
    els.voice.dataset.state = state || 'listening';
    voiceSphere?.setState(state || 'listening');
    const mode = state || 'listening';
    const labels = {
      idle: 'LISTO PARA CONVERSAR',
      listening: 'ESCUCHANDO',
      thinking: 'PROCESANDO',
      speaking: 'JAVI IA ESTÁ HABLANDO',
    };
    if (callActive) els.subtitle.textContent = labels[mode] || labels.idle;
    els.hint.textContent =
      mode === 'listening'
        ? 'Puedes contarme lo que necesitas.'
        : mode === 'thinking'
          ? 'Estoy revisando tu consulta para darte una respuesta.'
          : mode === 'speaking'
            ? 'Puedes silenciar la voz o consultar la transcripción.'
            : 'Te ayudo a crear, automatizar y hacer crecer tus ideas con IA.';
    els.guide.textContent =
      mode === 'listening'
        ? 'Toca el botón para terminar de escuchar'
        : mode === 'thinking'
          ? 'Preparando tu respuesta…'
          : mode === 'speaking'
            ? 'Silenciar · Finalizar · Ver transcripción'
            : 'Habla con naturalidad. Estoy aquí para ayudarte.';
    if (callActive && (mode === 'idle' || mode === 'thinking')) voiceSphere?.resume();
    else voiceSphere?.pause();
    els.mute.innerHTML =
      mode === 'listening'
        ? '<i class="fas fa-stop" aria-hidden="true"></i>'
        : mode === 'idle'
          ? '<i class="fas fa-microphone" aria-hidden="true"></i><span>Iniciar conversación por voz <i class="fas fa-arrow-right" aria-hidden="true"></i></span>'
          : '<i class="fas fa-microphone" aria-hidden="true"></i>';
    els.mute.disabled = mode === 'thinking';
    els.mute.setAttribute(
      'aria-label',
      mode === 'listening'
        ? 'Terminar de escuchar'
        : mode === 'speaking'
          ? 'Silenciar respuesta'
          : mode === 'thinking'
            ? 'Procesando tu consulta'
            : 'Iniciar conversación por voz'
    );
    if (status !== null && status !== undefined) {
      els.vStatus.textContent = status;
      els.vStatus.classList.toggle('is-detail', status.length > 36);
    }
  }
  function startCall() {
    if (!VOICE_OK) return;
    if (callActive) return;
    els.chatMode.classList.remove('is-active');
    els.chatMode.setAttribute('aria-pressed', 'false');
    els.voiceMode.classList.add('is-active');
    els.voiceMode.setAttribute('aria-pressed', 'true');
    els.voice.classList.add('is-active');
    els.panel.classList.add('is-voice');
    els.subtitle.textContent = 'Conversación por voz';
    callActive = true;
    muted = false;
    els.voice.dataset.muted = 'false';
    els.mute.setAttribute('aria-pressed', 'false');
    els.mute.setAttribute('aria-label', 'Toca para hablar');
    els.mute.innerHTML = '<i class="fas fa-microphone"></i>';
    setVoice('idle', 'Tu asistente digital.');
    voiceSphere?.resume();
  }
  function endCall() {
    callActive = false;
    clearTimeout(recognitionRestart);
    recognitionRestart = null;
    const previous = recog;
    recog = null;
    stopListening = null;
    try {
      previous?.abort();
    } catch {
      // abort() falla si no hay sesión de reconocimiento activa.
    }
    try {
      synth?.cancel();
    } catch {
      // cancel() puede fallar si no hay síntesis activa.
    }
    listening = false;
    speaking = false;
    els.voice.classList.remove('is-active');
    els.panel.classList.remove('is-voice');
    voiceSphere?.pause();
    setVoice('', '');
    els.vTx.textContent = '';
    els.voiceHistory.hidden = true;
    els.transcript.setAttribute('aria-expanded', 'false');
    els.chatMode.classList.add('is-active');
    els.chatMode.setAttribute('aria-pressed', 'true');
    els.voiceMode.classList.remove('is-active');
    els.voiceMode.setAttribute('aria-pressed', 'false');
  }
  function toggleMute() {
    if (recognitionRestart) {
      clearTimeout(recognitionRestart);
      recognitionRestart = null;
      setVoice('idle', 'Toca para hablar');
      return;
    }
    if (listening) {
      stopListening?.();
      return;
    }
    if (speaking) {
      muted = !muted;
      els.voice.dataset.muted = String(muted);
      if (muted) synth.pause();
      else synth.resume();
      els.mute.setAttribute('aria-pressed', String(muted));
      els.mute.setAttribute('aria-label', muted ? 'Reanudar respuesta' : 'Silenciar respuesta');
      return;
    }
    if (!busy) {
      muted = false;
      els.voice.dataset.muted = 'false';
      listen();
      return;
    }
    if (!listening && !speaking && !muted) {
      listen();
      return;
    }
    muted = !muted;
    els.mute.setAttribute('aria-pressed', String(muted));
    els.mute.setAttribute('aria-label', muted ? 'Activar micrófono' : 'Silenciar micrófono');
    els.mute.innerHTML = muted
      ? '<i class="fas fa-microphone-slash"></i>'
      : '<i class="fas fa-microphone"></i>';
    if (muted) {
      try {
        if (recog) recog.abort();
      } catch {
        // abort() falla si el reconocimiento no está en curso.
      }
      setVoice('idle', 'Micrófono silenciado');
    } else if (!speaking) listen();
  }
  function listen() {
    if (!callActive || muted || speaking || listening || busy) return;
    try {
      const session = new SR();
      recog = session;
      session.lang = window.PortfolioI18n?.language === 'en' ? 'en-US' : 'es-MX';
      session.interimResults = true;
      session.continuous = true;
      session.maxAlternatives = 1;
      let finalText = '',
        interimText = '',
        finishTimer;
      let stopRequested = false;
      let voiceError = false;
      const current = () => recog === session && callActive;
      stopListening = () => {
        if (!current()) return;
        stopRequested = true;
        clearTimeout(finishTimer);
        session.stop();
      };
      listening = true;
      session.onstart = () => {
        if (!current()) return;
        els.vTx.textContent = '';
        els.mute.setAttribute('aria-label', 'Terminar de escuchar');
        setVoice('', 'Te escucho…');
      };
      session.onresult = (e) => {
        if (!current()) return;
        let interim = '';
        finalText = '';
        for (let i = 0; i < e.results.length; i++) {
          const t = e.results[i][0].transcript;
          if (e.results[i].isFinal) finalText += t + ' ';
          else interim += t;
        }
        interimText = interim;
        els.vTx.textContent = (finalText + interim).trim();
        els.vTx.scrollTop = els.vTx.scrollHeight;
        clearTimeout(finishTimer);
        if (finalText.trim() && !interim)
          finishTimer = setTimeout(() => {
            if (current()) {
              stopRequested = true;
              session.stop();
            }
          }, 900);
      };
      session.onerror = (event) => {
        if (!current()) return;
        if (event.error === 'no-speech') return;
        voiceError = true;
        listening = false;
        setVoice(
          'idle',
          event.error === 'not-allowed' || event.error === 'service-not-allowed'
            ? 'Permite el micrófono para hablar o vuelve al menú.'
            : 'No pude escucharte. Toca la esfera para volver a intentar.'
        );
      };
      session.onend = () => {
        clearTimeout(finishTimer);
        if (!current()) return;
        recog = null;
        stopListening = null;
        listening = false;
        const t = (finalText || (stopRequested ? interimText : '')).trim();
        if (t && !voiceError) {
          els.vTx.textContent = '';
          send(t);
        } else if (!muted && !speaking && !voiceError && !stopRequested) {
          recognitionRestart = setTimeout(() => {
            recognitionRestart = null;
            listen();
          }, 300);
        } else if (!voiceError) setVoice('idle', 'Toca para hablar');
      };
      session.start();
    } catch {
      listening = false;
      recog = null;
      stopListening = null;
      setVoice('idle', 'No pude iniciar el micrófono. Toca para volver a intentar.');
    }
  }
  function speak(text, cb) {
    if (!synth) {
      cb && cb();
      return;
    }
    try {
      synth.cancel();
    } catch {
      // cancel() puede fallar si no hay síntesis activa.
    }
    const u = new SpeechSynthesisUtterance(text);
    u.lang = window.PortfolioI18n?.language === 'en' ? 'en-US' : 'es-MX';
    const v = (synth.getVoices() || []).find((x) =>
      x.lang.toLowerCase().startsWith(u.lang.slice(0, 2))
    );
    if (v) u.voice = v;
    u.rate = 1.03;
    u.pitch = 1;
    if (callActive) setVoice('speaking', 'Aquí tienes mi respuesta.');
    speaking = true;
    u.onend = () => {
      speaking = false;
      if (callActive) setVoice('idle', 'Tu asistente digital.');
      cb && cb();
    };
    u.onerror = () => {
      speaking = false;
      cb && cb();
    };
    synth.speak(u);
  }

  // voice list warmup
  if (VOICE_OK && synth) {
    try {
      synth.getVoices();
      synth.onvoiceschanged = () => synth.getVoices();
    } catch {
      // Sin voces: se usa la del navegador.
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build);
  else build();
})();
