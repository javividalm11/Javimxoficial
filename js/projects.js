(() => {
  'use strict';
  const root = document.getElementById('proyectos');
  if (!root) return;
  const data = document.getElementById('projectsData');
  const projects = JSON.parse(data.textContent);
  const featured = document.getElementById('projectFeatured');
  const sidebar = document.getElementById('projectSidebar');
  const dots = document.getElementById('projectPageDots');
  const catalog = document.getElementById('projectCatalog');
  const dialog = document.getElementById('projectCase');
  const allButton = document.getElementById('projectViewAll');
  let category = 'Todos', index = 0;
  const escape = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const filtered = () => projects.filter(project => category === 'Todos' || project.tags.includes(category));
  const tagsFor = project => project.category.split(' · ').slice(0,2);
  const tagMarkup = tags => tags.map(tag => `<span>${escape(tag)}</span>`).join('');
  const highlightsFor = project => {
    if (project.name === 'ModArch') return [['cube','Diseño 3D','Concepto visual'],['calculator','Cotizador','Por m²'],['brain','IA','Asistente virtual']];
    if (project.name === 'Charms Studio') return [['cart-shopping','E-commerce','Catálogo online'],['users','Multifandom','Personalización'],['globe-americas','Ecuador','Envíos nacionales']];
    if (project.name === 'Veoplaca') return [['car','Vehículos','Consulta por placa'],['brain','IA','Visión por computadora'],['globe','Web App','Acceso online']];
    if (project.tags.includes('Automatización')) return [['code','Web + IA','Solución digital'],['bolt','Automatización','Asistencia online'],['cloud','Cloud','Despliegue web']];
    if (project.tags.includes('E-commerce')) return [['cart-shopping','E-commerce','Catálogo online'],['laptop-code','Web','Experiencia digital'],['cloud','Cloud','Despliegue web']];
    return [['code','Web App','Producto digital'],['users','Comunidad','Experiencia online'],['cloud','Cloud','Despliegue web']];
  };
  function preview(project) {
    const primary = project.tags.includes('E-commerce') ? 'E-commerce' : project.tags.includes('IA') ? 'Web App · IA' : 'Web App';
    return `<article class="project-preview"><button type="button" class="project-preview__select" data-project="${escape(project.id)}" aria-label="Destacar ${escape(project.name)}"><img src="${escape(project.image)}" alt="Vista del sitio de ${escape(project.name)}" loading="lazy" width="1100" height="700"><div><span class="project-preview__category">${primary}</span><h3>${escape(project.name)}</h3><p>${escape(project.description)}</p><div class="project-tags">${tagMarkup(tagsFor(project))}</div></div></button><a class="project-preview__visit" href="${escape(project.url)}" target="_blank" rel="noopener" aria-label="Visitar el sitio de ${escape(project.name)}"><i class="fas fa-arrow-right" aria-hidden="true"></i></a></article>`;
  }
  function render() {
    const list = filtered();
    index = (index + list.length) % list.length;
    const project = list[index];
    const name = project.name === 'ModArch' ? 'Mod<span class="showcase-gradient">Arch.</span>' : project.name === 'Charms Studio' ? 'Charms<br><span class="showcase-gradient">Studio.</span>' : `${escape(project.name)}<span class="showcase-gradient">.</span>`;
    featured.innerHTML = `<div class="project-featured__visual"><img src="${escape(project.image)}" alt="Sitio de ${escape(project.name)}" loading="eager" width="1100" height="700"></div><div class="project-featured__content"><span class="project-featured__badge"><i class="fas fa-star" aria-hidden="true"></i> Proyecto destacado</span><h3 tabindex="-1">${name}</h3><p class="project-featured__description">${escape(project.description)}</p><div class="project-tags">${tagMarkup(tagsFor(project))}</div><div class="project-highlights">${highlightsFor(project).map(([icon,title,detail])=>`<div><i class="fas fa-${icon}" aria-hidden="true"></i><span><strong>${title}</strong><small>${detail}</small></span></div>`).join('')}</div><div class="project-featured__actions"><button type="button" class="btn btn--primary" data-case="${escape(project.id)}">Ver caso completo <i class="fas fa-arrow-right" aria-hidden="true"></i></button><a class="btn btn--ghost" href="${escape(project.url)}" target="_blank" rel="noopener">Visitar sitio <i class="fas fa-arrow-up-right-from-square" aria-hidden="true"></i></a></div></div>`;
    featured.dataset.project = project.id;
    featured.setAttribute('aria-label', `Proyecto destacado: ${project.name}`);
    const related = list.filter(item => item.id !== project.id).slice(0,3);
    sidebar.innerHTML = related.map(preview).join('');
    sidebar.style.setProperty('--sidebar-count',String(Math.max(related.length,1)));
    sidebar.hidden = related.length === 0;
    dots.innerHTML = list.map((item,i)=>`<button type="button" data-page="${i}" class="${i===index?'is-active':''}" aria-label="Destacar ${escape(item.name)}" ${i===index?'aria-current="true"':''}></button>`).join('');
    document.getElementById('projectPrevious').disabled = list.length < 2;
    document.getElementById('projectNext').disabled = list.length < 2;
    if (!catalog.hidden) catalog.innerHTML = list.map(preview).join('');
    document.getElementById('projectAnnouncement').textContent = `${category}: ${list.length} proyectos. Destacado ${index+1} de ${list.length}: ${project.name}.`;
  }
  function select(id, focus) {
    const list=filtered(), next=list.findIndex(project=>project.id===id);
    if(next<0)return;
    index=next;render();
    if(focus)featured.querySelector('h3').focus({preventScroll:true});
  }
  function openCase(id) {
    const project=projects.find(item=>item.id===id);
    if(!project)return;
    document.getElementById('projectCaseTitle').textContent=project.name;
    const img=document.getElementById('projectCaseImage');img.src=project.image;img.alt=`Vista del sitio de ${project.name}`;
    document.getElementById('projectCaseDescription').textContent=project.description;
    document.getElementById('projectCaseTags').innerHTML=tagMarkup(project.tags);
    document.getElementById('projectCaseLink').href=project.url;
    dialog.showModal();document.body.classList.add('project-case-open');
  }
  root.addEventListener('click',event=>{
    const filter=event.target.closest('[data-filter]');
    if(filter){category=filter.dataset.filter;index=0;root.querySelectorAll('[data-filter]').forEach(button=>{const active=button===filter;button.classList.toggle('is-active',active);button.setAttribute('aria-pressed',String(active));});render();return;}
    const page=event.target.closest('[data-page]');
    if(page){index=Number(page.dataset.page);render();dots.querySelector(`[data-page="${index}"]`)?.focus({preventScroll:true});return;}
    const card=event.target.closest('button[data-project]');
    if(card){select(card.dataset.project,event.detail===0);if(catalog.contains(card))featured.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'center'});return;}
    const caseButton=event.target.closest('[data-case]');if(caseButton)openCase(caseButton.dataset.case);
  });
  document.getElementById('projectPrevious').addEventListener('click',()=>{index--;render();});
  document.getElementById('projectNext').addEventListener('click',()=>{index++;render();});
  allButton.addEventListener('click',()=>{catalog.hidden=!catalog.hidden;allButton.setAttribute('aria-expanded',String(!catalog.hidden));allButton.innerHTML=catalog.hidden?'Ver todos los proyectos <i class="fas fa-arrow-right" aria-hidden="true"></i>':'Ocultar proyectos <i class="fas fa-chevron-up" aria-hidden="true"></i>';if(!catalog.hidden){catalog.innerHTML=filtered().map(preview).join('');catalog.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});}});
  document.getElementById('projectCaseClose').addEventListener('click',()=>dialog.close());
  document.addEventListener('portfolio:open-case',event=>{if(typeof event.detail?.id==='string')openCase(event.detail.id);});
  dialog.addEventListener('close',()=>document.body.classList.remove('project-case-open'));
  dialog.addEventListener('click',event=>{if(event.target!==dialog)return;const box=dialog.getBoundingClientRect();if(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom)dialog.close();});
  let touchX=null;
  featured.addEventListener('touchstart',event=>{touchX=event.target.closest('a,button')?null:event.touches[0].clientX;},{passive:true});
  featured.addEventListener('touchend',event=>{if(touchX===null)return;const delta=event.changedTouches[0].clientX-touchX;touchX=null;if(Math.abs(delta)>70){index+=delta<0?1:-1;render();}},{passive:true});
  render();
})();
