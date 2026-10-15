(() => {
  const dialog=document.getElementById('welcomeDialog');if(!dialog)return;
  const root=document.documentElement;
  let saved={};try{saved=JSON.parse(localStorage.getItem('javi.preferences.v1')||'{}')}catch{}
  if(!saved || typeof saved!=='object') saved={};
  let language=saved.language==='en'?'en':'es';
  const theme=saved.theme==='light'?'light':'dark';
  function applyTheme(value){
    const selected=value==='light'?'light':'dark';
    root.dataset.theme=selected;
    document.querySelector('meta[name=color-scheme]').content=selected;
    document.querySelector('meta[name=theme-color]').content=selected==='light'?'#fafbff':'#050818';
    document.dispatchEvent(new CustomEvent('portfolio:theme',{detail:{theme:selected}}));
  }
  dialog.querySelector(`[name=welcomeLanguage][value=${language}]`).checked=true;
  dialog.querySelector(`[name=welcomeTheme][value=${theme}]`).checked=true;
  applyTheme(theme);
  const effects=[window.createWelcomeParticles?.(document.getElementById('welcomeParticles')),window.createWelcomeParticles?.(document.getElementById('welcomeLogoParticles'),{logo:true})];
  const particles={start(){effects.forEach(effect=>effect?.start())},stop(){effects.forEach(effect=>effect?.stop())}};
  const copy={es:{title:'Elige tu <span>apariencia</span>',description:'¿Cómo prefieres visualizar el sitio?',legend:'Apariencia del portafolio',light:'BLANCO',dark:'NEGRO',lightDescription:'Interfaz clara y minimalista',darkDescription:'Interfaz oscura y moderna',back:'Volver',enter:'Entrar al portafolio',loading:'Preparando tu portafolio…',error:'No pude cargar las traducciones. Intenta de nuevo.'},en:{title:'Choose your <span>appearance</span>',description:'How would you like to view the site?',legend:'Portfolio appearance',light:'LIGHT',dark:'DARK',lightDescription:'A bright, minimal interface',darkDescription:'A dark, modern interface',back:'Back',enter:'Enter portfolio',loading:'Preparing your portfolio…',error:'Could not load translations. Please try again.'}};
  function updateLanguageCopy(){dialog.lang=language;document.getElementById('welcomeTitle').innerHTML=language==='en'?'Choose your <span>language</span>':'Elige tu <span>idioma</span>';document.querySelector('#welcomeLanguageStep .welcome-description').textContent=language==='en'?'Choose how you would like to explore my portfolio.':'Selecciona cómo quieres explorar mi portafolio.';document.querySelector('#welcomeLanguageStep legend').textContent=language==='en'?'Portfolio language':'Idioma del portafolio';document.getElementById('welcomeContinue').innerHTML=(language==='en'?'Continue':'Continuar')+' <i class="fas fa-arrow-right" aria-hidden="true"></i>';dialog.querySelectorAll('.welcome-preview__title').forEach(el=>el.innerHTML=language==='en'?'WEB + AI<br>+ CLOUD':'WEB + IA<br>+ CLOUD');}
  function showStep(step){dialog.classList.toggle('is-theme-step',step===2);document.getElementById('welcomeLanguageStep').hidden=step!==1;document.getElementById('welcomeThemeStep').hidden=step!==2;dialog.setAttribute('aria-labelledby',step===1?'welcomeTitle':'welcomeThemeTitle');document.getElementById('welcomeFeedback').textContent='';if(step===2){const c=copy[language];document.getElementById('welcomeThemeTitle').innerHTML=c.title;for(const [id,key]of [['welcomeThemeDescription','description'],['welcomeThemeLegend','legend'],['welcomeLightLabel','light'],['welcomeDarkLabel','dark'],['welcomeLightDescription','lightDescription'],['welcomeDarkDescription','darkDescription']])document.getElementById(id).textContent=c[key];document.querySelector('#welcomeBack span').textContent=c.back;document.querySelector('#welcomeEnter span').textContent=c.enter;dialog.querySelector('#welcomeThemeStep').lang=language;}requestAnimationFrame(()=>dialog.querySelector(`input[name=${step===1?'welcomeLanguage':'welcomeTheme'}]:checked`).focus({preventScroll:true}));}
  function open(){updateLanguageCopy();showStep(1);root.classList.add('welcome-open');dialog.showModal();root.classList.remove('welcome-pending');particles?.start()}
  dialog.querySelectorAll('[name=welcomeLanguage]').forEach(input=>input.addEventListener('change',()=>{language=input.value;updateLanguageCopy()}));
  dialog.querySelectorAll('[name=welcomeTheme]').forEach(input=>input.addEventListener('change',()=>applyTheme(input.value)));
  document.getElementById('welcomeContinue').addEventListener('click',()=>showStep(2));document.getElementById('welcomeBack').addEventListener('click',()=>showStep(1));
  document.getElementById('welcomeEnter').addEventListener('click',async()=>{const button=document.getElementById('welcomeEnter');button.disabled=true;document.getElementById('welcomeFeedback').textContent=copy[language].loading;try{await window.PortfolioI18n.setLanguage(language);const preferences={language,theme:dialog.querySelector('[name=welcomeTheme]:checked').value};root.dataset.theme=preferences.theme;document.querySelector('meta[name=color-scheme]').content=preferences.theme==='light'?'light':'dark';try{localStorage.setItem('javi.preferences.v1',JSON.stringify(preferences));sessionStorage.setItem('javi.welcome.v1','1')}catch{}dialog.close();root.classList.remove('welcome-open');particles?.stop();document.querySelector('#top a, #navbar a')?.focus({preventScroll:true});}catch{document.getElementById('welcomeFeedback').textContent=copy[language].error}finally{button.disabled=false}});
  dialog.addEventListener('cancel',e=>e.preventDefault());document.querySelectorAll('[data-welcome-open]').forEach(button=>button.addEventListener('click',()=>{document.getElementById('navLinks')?.classList.remove('active');document.getElementById('navToggle')?.classList.remove('active');open()}));
  let completed=false;try{completed=!!sessionStorage.getItem('javi.welcome.v1')}catch{}
  if(!completed)open();else{root.classList.remove('welcome-pending');window.PortfolioI18n.setLanguage(language).catch(()=>{});}
})();
