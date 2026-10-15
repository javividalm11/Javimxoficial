/* Answers grounded in the portfolio. This is a catalog fallback, not model-generated AI. */
export function getCatalogReply(message, history = [], language = 'es') {
  const normalized = value => String(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  const text = normalized(message);
  const previous = history.filter(item => item?.role === 'user').slice(-3).map(item => normalized(item.content)).join(' ');
  const context = `${previous} ${text}`;
  if (language === 'en') {
    const contact = 'You can request a proposal in Contact or message Javi on WhatsApp at +52 287 125 4233.';
    if (/plan|recommend|price|cost|budget|quote|package/.test(text)) {
      if (/crm|ecosystem|campaign|memory/.test(context)) return `The Premium plan is the reference for CRM, campaigns and advanced automation: $700 USD + $250 USD/month with hosting and domain, or $500 USD + $200 USD/month if you manage them. Confirm the final scope with Javi. ${contact}`;
      if (/automat|booking|reservation|chatbot|voicebot|whatsapp|\bai\b/.test(context)) return `For a website with automation, consider Pro: $350 USD + $100 USD/month with hosting and domain, or $300 USD + $80 USD/month if you manage them. It includes online booking, an AI WhatsApp bot and reminders. ${contact}`;
      if (/web|page|landing|presence/.test(context)) return `For a website or landing page, Basic starts at $150 USD + $50 USD/month with hosting and domain, or $100 USD + $40 USD/month if you manage them. Pro adds automation and starts at $350 USD + $100 USD/month. ${contact}`;
      return 'The published plans with hosting and domain are Basic ($150 USD + $50 USD/month), Pro ($350 USD + $100 USD/month) and Premium ($700 USD + $250 USD/month). Custom plans and options without hosting are also available. Do you need a website, automation or a complete system?';
    }
    if (/service|offer|develop|automat|cloud|devops/.test(text)) return 'Javi offers web development and e-commerce, AI automation, chatbots, voicebots, and Cloud and DevOps solutions. Explore Services to compare plans or request a custom proposal. What would you like to build?';
    if (/project|example|portfolio|modarch|cordel|veoplaca|charms/.test(text)) return 'The portfolio includes ModArch (architecture and interiors), Clínica Cordel (website and booking), Charms Studio (e-commerce) and Veoplaca (vehicle lookup by license plate). Open their case studies from the chat cards or Projects.';
    if (/contact|call|schedule|hire|email/.test(text)) return `Javi's email is javividalm11@gmail.com. ${contact}`;
    if (/who|javi|about/.test(text)) return 'Javi Vidal Miguel is a Full Stack Developer and Cloud Engineer. He builds websites, AI automations and cloud solutions. Learn more in About me and explore his work in Projects.';
    if (/hello|\bhi\b|hey/.test(text)) return 'Hi, I am JAVI IA. In portfolio mode, I can help you explore the published services, plans, projects and contact information. Would you like to compare plans or see projects?';
    return `I am answering with published portfolio information: services, plans, projects and contact details. ${contact}`;
  }
  const contact = 'Puedes solicitar una propuesta en la sección Contacto o escribir a Javi por WhatsApp al +52 287 125 4233.';
  if (/plan|recomiend|precio|costo|cuanto|presupuesto|cotiza|paquete/.test(text)) {
    if (/crm|ecosistema|campana|memoria/.test(context)) return `Para CRM, campañas y automatización avanzada, el plan Premium cuesta $700 USD + $250 USD/mes con hosting y dominio, o $500 USD + $200 USD/mes si tú los gestionas. El alcance final se confirma con Javi. ${contact}`;
    if (/automat|reserv|chatbot|voicebot|whatsapp|\bia\b/.test(context)) return `Por lo que describes, el plan Pro es la referencia para una web con automatización: $350 USD + $100 USD/mes con hosting y dominio, o $300 USD + $80 USD/mes si tú los gestionas. Incluye reservas online, bot de WhatsApp con IA y recordatorios. ${contact}`;
    if (/web|pagina|landing|presencia/.test(context)) return `Para una página web o landing, puedes partir del plan Básico: $150 USD + $50 USD/mes con hosting y dominio, o $100 USD + $40 USD/mes si tú los gestionas. Si también necesitas automatizaciones, el Pro parte de $350 USD + $100 USD/mes. ${contact}`;
    return `Los planes publicados son Básico ($150 USD + $50 USD/mes), Pro ($350 USD + $100 USD/mes) y Premium ($700 USD + $250 USD/mes), con hosting y dominio incluidos. También hay opciones sin hosting y un plan personalizado. ¿Necesitas una web, automatización o un sistema completo?`;
  }
  if (/servicio|ofrece|desarrollo|automat|cloud|devops/.test(text)) return 'Javi ofrece desarrollo web y e-commerce, automatización con IA, chatbots, voicebots y soluciones Cloud y DevOps. Puedes explorar Servicios para comparar los planes o solicitar una propuesta a medida. ¿Qué te gustaría construir?';
  if (/proyecto|ejemplo|portafolio|modarch|cordel|veoplaca|charms/.test(text)) return 'Entre los proyectos del portafolio están ModArch (arquitectura e interiores con cotizador y asistente con IA), Clínica Cordel (web y reservas), Charms Studio (e-commerce) y Veoplaca (consulta de vehículos por placa). Puedes abrir sus casos desde las tarjetas del chat o la sección Proyectos.';
  if (/contact|llamada|agendar|contratar|email|correo/.test(text)) return `El email de Javi es javividalm11@gmail.com. ${contact}`;
  if (/quien|javi|sobre ti/.test(text)) return 'Javi Vidal Miguel es Full Stack Developer y Cloud Engineer. Construye sitios web, automatizaciones con IA y soluciones en la nube. Puedes conocerlo en Sobre mí y explorar sus trabajos en Proyectos.';
  if (/hola|buenas|saludo/.test(text)) return 'Hola, soy JAVI IA. En modo portafolio puedo orientarte con los servicios, planes, proyectos y contacto publicados. ¿Quieres comparar planes o ver proyectos?';
  if (/web|pagina|landing|tienda|negocio/.test(text)) return `Para orientarte, dime si buscas una página informativa, una tienda online o una web con automatizaciones. Puedo mostrarte los planes y proyectos publicados. ${contact}`;
  return `Estoy respondiendo con la información publicada en el portafolio: servicios, planes, proyectos y contacto. Para una consulta específica, ${contact.charAt(0).toLowerCase()+contact.slice(1)}`;
}
