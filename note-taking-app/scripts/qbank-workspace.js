(function () {
  'use strict';
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const lib = () => window.MedicalLibrary;
  const svg = path => `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;
  const icons = { play: svg('<path d="m8 5 11 7-11 7z"/>'), edit: svg('<path d="m16 3 5 5-12 12H4v-5zM14 5l5 5"/>'), results: svg('<path d="M4 20V10M12 20V4M20 20v-7"/>'), search: svg('<circle cx="10" cy="10" r="7"/><path d="m15 15 6 6"/>') };
  const percent = (n, total) => total ? Math.round(100 * n / total) : 0;
  const unique = items => [...new Set(items)];
  const outcome = q => !q.submittedAnswer?.submitted || q.submittedAnswer.selectedId == null ? 'omitted' : q.submittedAnswer.isCorrect ? 'correct' : 'incorrect';
  const workspaceBankLabel = bank => {
    if (!bank) return 'Choose a question bank';
    const key=String(bank.key || '').toLowerCase(), label=String(bank.label || '');
    if(key.startsWith('bau-'))return `BAU - ${label.replace(/^BAU\s*[-:·]?\s*/i,'')}`;
    const provider=key.startsWith('mehlman') || /mehlman/i.test(label) ? 'Mehlman' : key.startsWith('amboss') || /amboss/i.test(label) ? 'AMBOSS' : key.startsWith('uworld') || /uworld|uworld/i.test(label) ? 'UWorld' : key.startsWith('boardvitals') || /boardvitals/i.test(label) ? 'BoardVitals' : key.startsWith('mksap') || /mksap/i.test(label) ? 'MKSAP' : '';
    const clean=label.replace(/^(UWorld|AMBOSS|Mehlman|BoardVitals|MKSAP)\s*[-:·]?\s*/i,'');
    return provider ? `${provider} - ${clean}` : label;
  };
  const W = {
    revision: 0, drafts: new Map(), page: 0, statsTab: 'overall', reportBy: 'subject', graphBy: 'test',
    applyAppScale(value) {
      if(window.QnexResponsive)return window.QnexResponsive.applyScale(value);
      const scale=window.innerWidth<1200?1:Number(value) || 1;
      document.documentElement.style.zoom=String(scale);
      document.documentElement.style.setProperty('--qnex-app-scale',String(scale));
    },
    init() {
      // Qbank must not inherit the hidden standalone notes container.
      const base=document.getElementById("questionBase");
      if(document.body.classList.contains("qbank-only") && base) {
        document.body.append(base);
        base.classList.remove("hidden");
      }
      this.applyAppScale(localStorage.getItem("qnex-app-scale") || "1");
      const sidebar = document.querySelector('#questionSidebar .sidebar-content');
      let nav = document.getElementById('qbankTabNav');
      if (!sidebar) return;
      if(!nav) {
        nav=document.createElement('div');nav.id='qbankTabNav';nav.className='qbank-tab-nav';
        for(const [tab,label,icon] of [
          ['main','Dashboard','<path d="m3 10 9-7 9 7v11H3z"/>'],
          ['statistics','Performance','<path d="M4 20V10M12 20V4M20 20v-7"/>'],
          ['create-test','Create Test','<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M12 8v8M8 12h8"/>'],
          ['recent-sessions','Recent Sessions','<path d="M12 8v4l3 3m6-3a9 9 0 1 1-6.219-8.56"/>'],
          ['medical-library','Library','<path d="M4 6h16M4 12h16M4 18h16"/>']
        ]) {const button=document.createElement('button');button.className='qbank-tab';button.dataset.tab=tab;button.innerHTML=svg(icon)+label;button.onclick=()=>window.QuestionBase.switchTab(tab);nav.append(button);}
      }
      sidebar.replaceChildren(nav);
      const historyNav=document.createElement('div');historyNav.className='qw-sidebar-history';historyNav.setAttribute('aria-label','Page history');
      for(const [id,label,path,action] of [['qwNavPrevious','Previous page','m15 6-6 6 6 6','previous'],['qwNavNext','Next page','m9 6 6 6-6 6','next']]) {
        const button=document.createElement('button');button.id=id;button.type='button';button.className='qw-icon';button.title=label;button.setAttribute('aria-label',label);button.disabled=true;button.innerHTML=svg('<path d="'+path+'"/>');button.onclick=()=>window.QnexRouter?.[action]();historyNav.append(button);
      }
      sidebar.prepend(historyNav);
      const forward=document.createElement('button');forward.id='qwHeaderNext';forward.type='button';forward.className='icon-btn';forward.title='Next page';forward.setAttribute('aria-label','Next page');forward.innerHTML='<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 6 6 6-6 6"/></svg>';forward.onclick=()=>window.QnexRouter?.next();document.getElementById('toggleQuestionSidebarBtn').before(forward);
      const oldBack=document.getElementById('backToMainFromQuestionsHeader');
      if(oldBack){const back=oldBack.cloneNode(true);oldBack.replaceWith(back);back.title='Back';back.setAttribute('aria-label','Back');back.onclick=()=>window.QnexRouter?.back();}
      const dashboardShortcut=document.createElement('button');dashboardShortcut.id='qwHeaderDashboard';dashboardShortcut.type='button';dashboardShortcut.className='icon-btn';dashboardShortcut.title='Dashboard';dashboardShortcut.setAttribute('aria-label','Dashboard');dashboardShortcut.innerHTML=nav.querySelector('[data-tab="main"] svg').outerHTML;dashboardShortcut.onclick=()=>window.QuestionBase.switchTab('main');document.getElementById('toggleQuestionSidebarBtn').after(dashboardShortcut);
      const head = document.createElement('div'); head.className = 'qw-bank-head';
      head.innerHTML='<button id="qwBankSwitch" type="button" aria-label="Open Qbank Library">Choose a question bank</button>';
      const header=document.querySelector('#questionSidebar .sidebar-header');header.after(head);
      const brand=document.createElement('button');brand.className='qw-brand-link qw-sidebar-wordmark';brand.type='button';brand.title='Qbank Library';brand.setAttribute('aria-label','Qnex — Open Qbank Library');brand.innerHTML='<span class="qw-sidebar-intro-ring" aria-hidden="true"><span>A</span><span>B</span><span>C</span><span>D</span></span><span class="qw-sidebar-intro-q" aria-hidden="true">Q</span><span class="qw-sidebar-loop-word" aria-hidden="true">Qnex<span class="qw-logo-dot">.</span></span>';const back=header.querySelector('#backToMainFromQuestions');back?.after(brand);if(!back)header.prepend(brand);brand.onclick=()=>window.QuestionBase.switchTab('medical-library');
      sidebar.prepend(nav); nav.classList.add('qw-nav');
      nav.setAttribute('aria-label', 'Question bank navigation');
      const bankLibrary = nav.querySelector('[data-tab="medical-library"]');
      if (bankLibrary) bankLibrary.innerHTML = svg('<path d="M4 6H3v14a1 1 0 0 0 1 1h14"/><rect x="7" y="3" width="14" height="14" rx="1"/><path d="M12.1 8a1.9 1.9 0 0 1 3.8 0c0 1.3-1.9 1.5-1.9 2.8" stroke-width="1.4"/><circle cx="14" cy="13.4" r=".55" fill="currentColor" stroke="none"/>') + 'Qbank Library';
      const medical = document.createElement('button'); medical.className = 'qbank-tab'; medical.dataset.tab = 'medical-reference';
      medical.innerHTML = svg('<path d="M4 6H3v14a1 1 0 0 0 1 1h14"/><rect x="7" y="3" width="14" height="14" rx="1"/><path d="M10.5 7h7M10.5 10h7M10.5 13h4.5" stroke-width="1.4"/>') + 'Medical Library';
      medical.onclick = () => window.QuestionBase.switchTab('medical-reference'); nav.append(medical);
      const medicalPanel = document.createElement('div'); medicalPanel.className = 'tab-content'; medicalPanel.dataset.tabContent = 'medical-reference';
      medicalPanel.innerHTML = '<div class="qw-page ml-library"><header class="qw-heading"><h2>Medical Library</h2></header><div class="qw-card"><h3>Coming soon</h3><p class="qw-muted">Your space for medical references and study resources.</p></div></div>';
      document.querySelector('[data-tab-content="main"]').parentElement.append(medicalPanel);
      const search = document.createElement('button'); search.className = 'qbank-tab'; search.dataset.tab = 'bank-search';
      search.innerHTML = icons.search + 'Search bank'; search.onclick = () => window.QuestionBase.switchTab('bank-search'); nav.append(search);
      const searchPanel = document.createElement('div'); searchPanel.className = 'tab-content'; searchPanel.dataset.tabContent = 'bank-search';
      document.querySelector('[data-tab-content="main"]').parentElement.append(searchPanel);
      const list = document.getElementById('questionList');
      for (const [tab,label,path] of [
        ['flagged','Flagged Questions','<path d="M5 21V4m0 0c5-4 9 4 14 0v10c-5 4-9-4-14 0"/>'],
        ['notebook','Notebook','<rect x="5" y="3" width="15" height="18" rx="2"/><path d="M9 3v18M3 7h4M3 12h4M3 17h4M12 8h5M12 12h5"/>']
      ]) {
        const button=document.createElement('button');button.className='qbank-tab';button.dataset.tab=tab;button.innerHTML=svg(path)+label;
        button.onclick=()=>window.QuestionBase.switchTab(tab);nav.append(button);
        const panel=document.createElement('div');panel.className='tab-content';panel.dataset.tabContent=tab;medicalPanel.after(panel);
      }
      const reset=document.createElement('button');reset.className='qbank-tab';reset.id='qwResetBank';reset.dataset.tab='qbank-reset';reset.innerHTML=svg('<path d="M3 10a9 9 0 1 1 2 8M3 4v6h6"/>')+'Reset';
      reset.onclick=()=>window.QuestionBase.switchTab('qbank-reset');nav.append(reset);
      // Keep legacy DOM references available to existing handlers, outside the sidebar.
      const legacy=document.createElement('div');legacy.hidden=true;legacy.id='qwLegacyTools';legacy.style.display='none';document.body.append(legacy);
      [list,document.getElementById('createSessionBtn'),document.querySelector('#questionSidebar .sidebar-search'),document.querySelector('#questionSidebar .sidebar-action-menu')].filter(Boolean).forEach(node=>legacy.append(node));
      document.getElementById('playQuestionsBtn')?.remove();
      document.querySelector('#questionContent .header-center')?.remove();
      document.getElementById('questionEditor')?.remove();
      document.getElementById('sessionCreator')?.remove();
      legacy.remove();
      const settings=document.createElement('button');settings.className='icon-btn qw-header-settings';settings.id='qwHeaderSettings';settings.type='button';settings.title='Settings';settings.setAttribute('aria-label','Settings');settings.dataset.tab='qbank-settings';settings.classList.add('qw-profile-avatar');const updateAvatar=()=>{const name=window.QbankProfile?.read()?.username?.trim() || '';settings.textContent=Array.from(name)[0]?.toUpperCase() || 'Q';settings.title=name ? name+' — Settings' : 'Account settings';settings.setAttribute('aria-label',settings.title);};updateAvatar();window.addEventListener('qbank-profile-changed',updateAvatar);settings.onclick=()=>window.QuestionBase.switchTab('qbank-settings');const headerActions=document.createElement('div');headerActions.className='qw-header-account';
      const notifications=document.getElementById('notifCenter');
      if(notifications){notifications.setAttribute('role','button');notifications.tabIndex=0;notifications.setAttribute('aria-label','Notifications');notifications.onkeydown=event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();notifications.click();}};headerActions.append(notifications);}
      headerActions.append(settings);document.querySelector('#questionContent .question-header').append(headerActions);
      const settingsPanel=document.createElement('div');settingsPanel.className='tab-content';settingsPanel.dataset.tabContent='qbank-settings';medicalPanel.after(settingsPanel);
      const resetPanel=document.createElement('div');resetPanel.className='tab-content';resetPanel.dataset.tabContent='qbank-reset';settingsPanel.after(resetPanel);
      head.querySelector('button').onclick=()=>window.QuestionBase.switchTab('medical-library');
      const group=document.createElement('section');group.className='qw-qbank-group';
      const groupHead=document.createElement('div');groupHead.className='qw-qbank-group-head';
      const toggle=document.createElement('button');toggle.type='button';toggle.className='qbank-tab qw-qbank-toggle';toggle.setAttribute('aria-controls','qwQbankSubnav');toggle.innerHTML=bankLibrary.querySelector('svg').outerHTML+'<span>Qbank/Test</span><svg class="qw-qbank-caret" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="m7 14 5-5 5 5"/></svg>';
      bankLibrary.innerHTML=svg('<path d="M4 6h16M4 12h16M4 18h16"/>')+'Library';
      const dashboard=nav.querySelector('[data-tab="main"]');dashboard.innerHTML=dashboard.querySelector('svg').outerHTML+'Dashboard';
      const children=document.createElement('div');children.id='qwQbankSubnav';children.className='qw-qbank-subnav';
      for(const tab of ['medical-library','create-test','recent-sessions','statistics','bank-search']) {
        const button=nav.querySelector('[data-tab="'+tab+'"]');if(!button)continue;
        if(tab==='statistics')button.innerHTML=icons.results+'Performance';
        if(tab==='bank-search')button.innerHTML=icons.search+'Search';
        children.append(button);
      }
      nav.querySelector('[data-tab="main"]').after(group);groupHead.append(toggle);group.append(groupHead,children);
      const setExpanded=expanded=>{children.hidden=!expanded;toggle.setAttribute('aria-expanded',String(expanded));toggle.setAttribute('aria-label',(expanded?'Collapse':'Expand')+' Qbank/Test');group.classList.toggle('collapsed',!expanded);};
      setExpanded(localStorage.getItem('qnex-qbank-nav-expanded')!=='false');
      toggle.onclick=()=>{const expanded=children.hidden;setExpanded(expanded);localStorage.setItem('qnex-qbank-nav-expanded',String(expanded));};
      this.expandQbankNav=()=>setExpanded(true);
      this.syncSidebar();
      if(document.body.classList.contains("qbank-only")) window.QuestionBase?.open();
    },
    syncSidebar() {
      const active=window.QuestionBase?.state.lastActiveTab;
      document.body.dataset.qnexTab=active || 'main';
      if(active!==this.lastSidebarTab && ['medical-library','create-test','recent-sessions','statistics','bank-search'].includes(active))this.expandQbankNav?.();
      this.lastSidebarTab=active;
      const bank = lib().banks.find(b => b.key === lib().currentBank);
      const button = document.getElementById('qwBankSwitch');
      const reset=document.getElementById('qwResetBank');if(reset)reset.disabled=false;
      if (button) {
        button.textContent=workspaceBankLabel(bank);button.title='Open Qbank Library';
      }
      document.querySelectorAll('#qbankTabNav .qbank-tab').forEach(b => b.setAttribute('aria-current', b.dataset.tab === window.QuestionBase?.state.lastActiveTab ? 'page' : 'false'));
    },
    loadingLogo() { return '<div class="qnex-loading-mark qnex-knock-logo" aria-hidden="true"><span class="qnex-knock-word">Qnex</span><span class="qnex-knock-dot">.</span></div>'; },
    loading(label='Loading your bank…') { return `<div class="qw-loader qnex-branded-loader" role="status" aria-live="polite">${this.loadingLogo()}<span>${esc(label)}</span></div>`; },
    async render(tab) {
      clearTimeout(this.retryTimer);
      if(tab === 'recent-sessions' && /^test-(analysis|results)\//.test(window.QnexRouter?.current || '')) return;
      const revision = ++this.revision;
      const panel = document.querySelector(`[data-tab-content="${tab}"]`); if (!panel) return;
      panel.setAttribute('aria-busy','true');
      panel.innerHTML = '<div class="qw-page ml-library">'+this.loading(tab==='notebook' ? 'Opening your notebook…' : tab==='create-test' && String(lib()?.currentBank || lib()?.profile?.currentBank || '').startsWith('amboss') ? 'Loading your bank… It may take a little while.' : 'Loading your bank…')+'</div>';
      try {
        if(tab==='qbank-settings'){await window.QnexSettings.render(panel.firstChild,this);return;}
        if (tab === 'notebook') {
          const notes = await this.loadNotes();
          if (revision !== this.revision) return;
          const mount=document.createElement('div');mount.className='qw-page ml-library';panel.replaceChildren(mount);
          this.notebook(mount, notes.filter(n => n.type === 'dungeon-note' || n.id?.startsWith('dungeon_note_')));return;
        }
        const context = await window.QBankDashboard.context();
        if (revision !== this.revision) return;
        this.retryCount=0;
        this.syncSidebar();
        if (!context.bank && tab === 'flagged') {
          const mount=document.createElement('div');mount.className='qw-page ml-library';panel.replaceChildren(mount);
          this.flagged(mount, {label:'Qnex Qbank'}, []);return;
        }
        if(tab==='qbank-reset'){const mount=document.createElement('div');mount.className='qw-page ml-library';panel.replaceChildren(mount);window.QBankDashboard.reset(context.bank,mount);return;}
        if (!context.bank) {
          panel.innerHTML = '<div class="qw-page ml-library"><h2>Choose your question bank</h2><p>Select a bank on Main to build tests and track your progress.</p><button class="ml-library-btn" id="qwChoose">Choose bank</button></div>';
          panel.querySelector('button').onclick = () => window.QuestionBase.switchTab('main'); return;
        }
        const mount = document.createElement('div'); mount.className = 'qw-page ml-library';
        if (tab === 'flagged') {
          const questions=await lib().api('/flagged?bank='+encodeURIComponent(context.bank.key));
          if (revision !== this.revision) return;
          panel.replaceChildren(mount);
          this.flagged(mount,context.bank,questions);
        } else if (tab === 'create-test') {
          const taxonomy = await lib().api('/filters?bank=' + encodeURIComponent(context.bank.key));
          if (revision !== this.revision) return;
          panel.replaceChildren(mount);
          this.builder(mount, context, taxonomy);
        } else if (tab === 'recent-sessions') {
          const sessions = await lib().api('/sessions'); if (revision !== this.revision) return;
          panel.replaceChildren(mount);
          this.history(mount, context, sessions);
        } else if (tab === 'statistics') {
          const taxonomy = await lib().api('/filters?bank=' + encodeURIComponent(context.bank.key));
          if (revision !== this.revision) return;
          panel.replaceChildren(mount);
          this.performance(mount, context, taxonomy);
        } else {
          const data = await lib().api('/questions-list?bank=' + encodeURIComponent(context.bank.key));
          if (revision !== this.revision) return;
          panel.replaceChildren(mount);
          this.search(mount, context, data.questions);
        }
      } catch (error) {
        if (revision !== this.revision) return;
        panel.innerHTML = `<div class="qw-page ml-library"><div class="qw-feedback"><p class="qd-message qd-error" role="alert">${esc(error.message)}</p><button class="ml-library-btn qd-icon-action" title="Retry" aria-label="Retry"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 11a8 8 0 0 0-14-5L3 9m0-6v6h6M4 13a8 8 0 0 0 14 5l3-3m0 6v-6h-6"/></svg></button></div></div>`;
        panel.querySelector('button').onclick = () => this.render(tab);
        if(window.QBankDashboard.isTemporary(error)){
          panel.querySelector('[role=alert]').textContent='Connecting to your question bank… Retrying automatically.';
          window.QBankDashboard.retryView(this,()=>revision===this.revision && panel.isConnected && panel.classList.contains('active'),()=>this.render(tab));
        }
      } finally {
        if (revision === this.revision) panel.removeAttribute('aria-busy');
      }
    },
    heading(title, bank) { return `<header class="qw-heading"><div><h2>${title}</h2><div class="qw-heading-title"><p>${esc(bank.label)}</p><button type="button" class="qw-bank-switch" data-change-bank title="Change question bank" aria-label="Change question bank">${svg('<path d="M4 7h16m-4-4 4 4-4 4M20 17H4m4-4-4 4 4 4"/>')}</button></div></div></header>`; },
    wireHeading(mount) { mount.querySelector('[data-change-bank]').onclick = () => this.openBankPicker(); },
    openBankPicker() { window.QuestionBase.switchTab('medical-library'); },
    builder(mount, { bank, stats, profile }, taxonomy) {
      const provider = bank.category || (bank.key.startsWith('amboss') ? 'amboss' : '');
      const customBuilder = window.QnexTestBuilders?.[provider];
      if (customBuilder) return customBuilder(mount, { bank, stats, profile }, taxonomy, this);
      let draft = this.drafts.get(bank.key);
      if (!draft) {
        draft = { subjects: [], systems: [], pools: [], count: 40, tutor: true, timed: false, name: '', custom: false, ids: '', timingBasis:'question', timingScope:'session', seconds:90, minutes:60, adjustment:Number(localStorage.getItem('qnex-time-accommodation') || 0) };
        this.drafts.set(bank.key, draft);
      }
      const items = taxonomy.items || [];
      draft.pools=draft.pools.slice(0,1);
      const groups = new Map();
      for (const item of items) {
        const name = item.group || 'General';
        if (!groups.has(name)) groups.set(name, new Map());
        const key = taxonomy.amboss ? `${item.system}:${item.subject}` : String(item.system);
        const label = taxonomy.amboss ? taxonomy.subjects.find(s => s.id === item.subject)?.name : taxonomy.systems.find(s => s.id === item.system)?.name;
        const children = groups.get(name);
        if (!children.has(key)) children.set(key, { key, label: label || name, count: 0, ids: new Set() });
        children.get(key).ids.add(item.id);
        children.get(key).count = children.get(key).ids.size;
      }
      for(const [name,children] of groups)groups.set(name,new Map([...children].sort(([,a],[,b])=>a.label.localeCompare(b.label))));
      const check = (name, value, label, count, checked) => `<label class="qw-check"><input type="checkbox" name="${name}" value="${esc(value)}"${checked ? ' checked' : ''}><span>${esc(label)}</span>${count == null ? '' : `<small>${count.toLocaleString()}</small>`}</label>`;
      mount.innerHTML = this.heading('Create Test', bank) + `<form id="qwBuilder">
        <section class="qw-card"><h3>Test mode</h3><div class="qw-inline"><label class="qw-switch"><input type="checkbox" role="switch" name="tutor"${draft.tutor ? ' checked' : ''}><span></span>Tutor</label><label class="qw-switch"><input type="checkbox" role="switch" name="timed"${draft.timed ? ' checked' : ''}><span></span>Timed</label><button type="button" id="qwAccommodation" class="qw-clock" aria-label="Time accommodation" title="Time accommodation"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/></svg></button></div><p class="qw-muted">Tutor shows explanations after each answer. Timed adds a shared countdown for the test.</p><input type="hidden" name="adjustment" value="${draft.adjustment || 0}"><p id="qwTimingSummary" class="qw-timing-summary" aria-live="polite"></p></section>
        <section class="qw-card"><h3>Question mode</h3><div class="qw-segments"><button type="button" data-mode="standard" class="${!draft.custom ? 'active' : ''}">Standard</button><button type="button" data-mode="custom" class="${draft.custom ? 'active' : ''}">Custom</button></div><label class="qw-field">Test name <span class="qw-muted">(optional)</span><input name="title" maxlength="120" placeholder="e.g. Cardiology review" value="${esc(draft.name)}"></label><div id="qwCustom" ${draft.custom ? '' : 'hidden'}><h3>Instructions on using Custom mode</h3><p class="qw-muted">Create a test with specific question IDs from this bank. Enter IDs separated by commas, or retrieve the questions from a saved test.</p><div class="qw-custom-grid"><div><h3>Create Test by Question IDs</h3><label class="qw-field">Question IDs<textarea name="ids" rows="4" placeholder="Enter question IDs separated by commas">${esc(draft.ids)}</textarea></label></div><div><h3>Retrieve Questions of a Test #</h3><label class="qw-field">Test ID<input name="retrieveId" placeholder="Enter Test ID"></label><button type="button" class="ml-library-btn qd-icon-action" id="qwRetrieve" disabled title="Retrieve" aria-label="Retrieve"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12m-5-5 5 5 5-5M4 17v4h16v-4"/></svg></button><p id="qwRetrieveStatus" role="status"></p></div></div></div></section>
        <section class="qw-card"><h3>Select Source:</h3><p class="qw-muted">Choose a source to begin, then select subjects and systems below.</p><div class="qw-inline">${[['all','All questions'],['new','New questions'],['incorrect','Incorrect answers'],['marked','Marked questions'],['omitted','Omitted questions']].map(([id,label]) => check('pool',id,label,null,draft.pools.includes(id))).join('')}</div></section>
        <section class="qw-card"><div class="qw-section-heading"><h3>Subjects</h3><label><input type="checkbox" data-all="subject"> Select all</label></div><div class="qw-check-grid">${taxonomy.subjects.map(s => check('subject',s.id,s.name,s.count,draft.subjects.includes(String(s.id)))).join('')}</div></section>
        <section class="qw-card"><div class="qw-section-heading"><h3>Systems & topics</h3><label><input type="checkbox" data-all="system"> Select all</label></div><div class="qw-check-grid">${[...groups].sort(([a],[b]) => a.localeCompare(b)).map(([name, children], i) => `<details class="qw-system"><summary><input type="checkbox" data-group="${i}" aria-label="Select ${esc(name)}"><span>${esc(name)}</span><small>${unique([...children.values()].flatMap(c => [...c.ids])).length}</small></summary><div>${[...children.values()].map(c => check('system',c.key,c.label,c.count,draft.systems.includes(c.key))).join('')}</div></details>`).join('')}</div></section>
        <section class="qw-card qw-generate"><div class="qw-generate-details"><strong id="qwMatching" aria-live="polite"></strong><div class="qw-selection-tags" id="qwSelectionTags" aria-label="Selected subjects and systems"></div></div><div class="qw-question-count"><label for="qwBlockCount">Questions per test</label><input id="qwBlockCount" name="count" type="text" inputmode="numeric" pattern="[0-9]+" autocomplete="off" required value="${draft.count}"><button type="button" id="qwMatchCount" class="qw-match-count">Match questions number</button></div><button class="ml-library-btn primary" id="qwGenerate" title="Generate Test" aria-label="Generate Test">${icons.play}</button></section><p id="qwStatus" role="status"></p>
      </form>`;
      this.wireHeading(mount);
      const form = mount.querySelector('form');
      if(bank.key.startsWith('bau-')) {
        const field=document.createElement('label');field.className='qw-switch';
        field.innerHTML='<input type="checkbox" role="switch" name="bauNavigation" aria-label="Two-way navigation"><span></span><b class="qw-navigation-label" style="font-weight:inherit">One way</b>';
        form.querySelector('.qw-switch').closest('.qw-inline').append(field);
        field.querySelector('input').checked=draft.bauNavigation==='two-way';
      }
      // Keep editing keys inside the builder instead of invoking app shortcuts.
      form.addEventListener('keydown', event => {
        if (!event.target.closest('input, textarea, select, [contenteditable]')) return;
        event.stopPropagation();
        if (event.key === 'Enter' && event.target.matches('input:not([type=checkbox]):not([type=radio])')) event.preventDefault();
      });
      const idStatus=document.createElement('p');idStatus.id='qwIdStatus';idStatus.setAttribute('aria-live','polite');form.querySelector('[name=ids]').after(idStatus);
      const subjectSection=form.querySelector('[data-all="subject"]').closest('section');
      const systemSection=form.querySelector('[data-all="system"]').closest('section');
      const generateSection=form.querySelector('.qw-generate');
      [subjectSection,systemSection,generateSection].forEach(section=>section.classList.add('qw-step'));
      const addStatus=section=>{const status=document.createElement('p');status.className='qw-muted qw-step-status';status.setAttribute('aria-live','polite');section.querySelector('h3').closest('.qw-section-heading')?.after(status);return status;};
      const subjectStatus=addStatus(subjectSection),systemStatus=addStatus(systemSection);
      let idsSyncTimer;
      const sync = () => {
        clearTimeout(idsSyncTimer);
        draft.bauNavigation=form.elements.bauNavigation?.checked ? 'two-way' : 'one-way';
        const navigationLabel=form.querySelector('.qw-navigation-label');
        if(navigationLabel)navigationLabel.textContent=draft.bauNavigation==='two-way' ? 'Two way' : 'One way';
        const fd = new FormData(form);
        Object.assign(draft, { subjects: fd.getAll('subject'), systems: fd.getAll('system'), pools: fd.getAll('pool'), name: fd.get('title'), ids: fd.get('ids'), count: Number(fd.get('count')), tutor: fd.has('tutor'), timed: fd.has('timed'), timingBasis:'question', timingScope:'session', seconds:90, minutes:60, adjustment:Number(form.elements.adjustment.value) });
        const facet=this.facets(items,draft,stats,taxonomy.amboss);
        form.querySelectorAll('[name="subject"]').forEach(box=>{
          const count=facet.subjects.get(box.value)?.size || 0;box.closest('label').querySelector('small').textContent=count.toLocaleString();
          box.disabled=!count;if(!count)box.checked=false;
        });
        draft.subjects=[...form.querySelectorAll('[name="subject"]:checked')].map(b=>b.value);
        const systems=this.facets(items,draft,stats,taxonomy.amboss);
        form.querySelectorAll('[name="system"]').forEach(box=>{
          const count=systems.systems.get(box.value)?.size || 0;box.closest('label').querySelector('small').textContent=count.toLocaleString();
          box.closest('label').hidden=!count;
          box.disabled=!count;if(!count)box.checked=false;
        });
        draft.systems=[...form.querySelectorAll('[name="system"]:checked')].map(b=>b.value);
        form.querySelectorAll('[data-all]').forEach(all => { const boxes = [...form.querySelectorAll(`[name="${all.dataset.all}"]:not(:disabled)`)]; all.disabled=!boxes.length;all.checked = boxes.length > 0 && boxes.every(b => b.checked); all.indeterminate = boxes.some(b => b.checked) && !all.checked; });
        form.querySelectorAll('[data-group]').forEach(box => {
          const children = [...box.closest('details').querySelectorAll('[name="system"]:not(:disabled)')];
          box.disabled=!children.length;box.checked = children.length>0 && children.every(c => c.checked); box.indeterminate = children.some(c => c.checked) && !box.checked;
          box.closest('details').hidden=!children.length;
          const ids=new Set(children.flatMap(b=>[...(systems.systems.get(b.value) || [])]));
          box.closest('summary').querySelector('small').textContent=ids.size.toLocaleString();
        });
        const matching = this.matching(items, draft, stats, taxonomy.amboss);
        if (!draft.countManual) {
          draft.count=matching.length;
          form.elements.count.value=matching.length;
        }
        mount.querySelector('#qwMatching').textContent = `${matching.length.toLocaleString()} matching questions`;
        const selectedTags = unique([
          ...taxonomy.subjects.filter(subject => draft.subjects.includes(String(subject.id))).map(subject => subject.name),
          ...[...form.querySelectorAll('[name="system"]:checked')].map(box => box.closest('.qw-check').querySelector('span').textContent)
        ]);
        mount.querySelector('#qwSelectionTags').innerHTML = selectedTags.map(tag => `<span class="qw-selection-tag">${esc(tag)}</span>`).join('');
        const validation=this.validateIds(items,draft.ids);
        idStatus.className=validation.valid ? 'qw-id-valid' : 'qw-id-invalid';
        idStatus.textContent=validation.message;
        subjectSection.hidden=draft.custom || !draft.pools.length;
        systemSection.hidden=draft.custom || !draft.pools.length || !draft.subjects.length;
        form.querySelector('[name=pool]').closest('section').hidden=draft.custom;
        generateSection.hidden=draft.custom ? !validation.valid : !draft.pools.length || !draft.systems.length;
        form.querySelector('#qwRetrieve').disabled=!form.elements.retrieveId.value.trim();


        const sourceCount=facet.ids.size,systemCount=unique([...systems.systems.values()].flatMap(ids=>[...ids])).length;
        subjectStatus.textContent=sourceCount ? `${sourceCount.toLocaleString()} questions in the selected source · ${draft.subjects.length} subjects selected` : 'No questions in this source yet. Choose another source to continue.';
        systemStatus.textContent=`${systemCount.toLocaleString()} questions across your selected subjects · ${matching.length.toLocaleString()} match the selected systems`;
        form.elements.ids.setAttribute('aria-invalid',String(draft.custom && !!draft.ids.trim() && !validation.valid));
        form.querySelector('#qwTimingSummary').hidden=!draft.timed;
        const count=Math.min(draft.count,matching.length);
        const timing=this.timing(draft,count);
        form.querySelector('#qwTimingSummary').textContent=count>0 ? `${count} questions · ${this.duration(timing.total)} total · ${this.duration(timing.total/count)} ${draft.timingScope==='session' ? 'average per question' : 'per question'}${draft.adjustment ? ` (${Math.abs(draft.adjustment)}% ${draft.adjustment>0 ? 'extra' : 'less'} time)` : ''}` : 'Select questions to calculate your test time.';
        mount.querySelector('#qwGenerate').disabled = !matching.length || !Number.isInteger(draft.count) || draft.count<1 || (draft.custom && !validation.valid) || (draft.timed && !timing.valid);
        return matching;
      };
      form.querySelector('#qwMatchCount').onclick = () => {
        draft.countManual=false;
        sync();
      };
      const countInput = form.querySelector('#qwBlockCount');
      countInput.addEventListener('focus', event => event.target.select());
      countInput.addEventListener('keydown', event => event.stopPropagation());
      form.oninput = event => {
        if (event.target.name === 'title') { draft.name=event.target.value; return; }
        if (event.target.name === 'retrieveId') { form.querySelector('#qwRetrieve').disabled=!event.target.value.trim(); return; }
        if (event.target.name === 'ids') {
          draft.ids=event.target.value;
          clearTimeout(idsSyncTimer);
          form.querySelector('#qwGenerate').disabled=true;
          idsSyncTimer=setTimeout(()=>{if(form.isConnected)sync();},150);
          return;
        }
        if (event.target.name === 'count') draft.countManual=true;
        if (event.target.type !== 'checkbox') sync();
      };
      form.onchange = event => {
        const target = event.target;
        if (target.name === 'title' || target.name === 'retrieveId') return;
        if (target.dataset.all) form.querySelectorAll(`[name="${target.dataset.all}"]:not(:disabled)`).forEach(b => b.checked = target.checked);
        if (target.hasAttribute('data-group')) target.closest('details').querySelectorAll('[name="system"]:not(:disabled)').forEach(b => b.checked = target.checked);
        if (target.name === 'pool' && target.checked) form.querySelectorAll('[name="pool"]').forEach(b => { if (b !== target) b.checked = false; });
        sync();
      };
      form.querySelectorAll('[data-mode]').forEach(button => button.onclick = () => { draft.custom = button.dataset.mode === 'custom'; form.querySelector('#qwCustom').hidden = !draft.custom; form.querySelectorAll('[data-mode]').forEach(b => b.classList.toggle('active', b === button)); sync(); });
      form.querySelector('#qwAccommodation').onclick=()=>{
        const dialog=document.createElement('dialog');dialog.className='qw-dialog ml-library qw-accommodation';
        dialog.innerHTML='<form><h2>Time Accommodation</h2><p class="qw-muted">This setting applies to future tests.</p>'+[[0,'Standard'],[25,'Extra (1.25x)'],[50,'Extended (1.5x)'],[100,'Double (2x)']].map(([value,label])=>'<label class="qw-check"><input type="radio" name="allowance" value="'+value+'"'+(draft.adjustment===value ? ' checked' : '')+'>'+label+'</label>').join('')+'<div class="qw-dialog-actions"><button type="button" class="ml-library-btn qd-icon-action" title="Cancel" aria-label="Cancel"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 6 12 12M6 18 18 6"/></svg></button><button class="ml-library-btn primary qd-icon-action" title="Apply" aria-label="Apply"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg></button></div></form>';
        document.body.append(dialog);dialog.showModal();dialog.onclose=()=>dialog.remove();dialog.querySelector('[type=button]').onclick=()=>dialog.close();
        dialog.querySelector('form').onsubmit=e=>{e.preventDefault();const value=Number(new FormData(e.currentTarget).get('allowance'));form.elements.adjustment.value=value;localStorage.setItem('qnex-time-accommodation',String(value));this.drafts.forEach(d=>d.adjustment=value);sync();dialog.close();dialog.remove();};
      };
      form.querySelector('#qwRetrieve').onclick=async()=>{
        const button=form.querySelector('#qwRetrieve'),status=form.querySelector('#qwRetrieveStatus');button.disabled=true;status.textContent='Retrieving questions…';
        try{const enteredId=form.elements.retrieveId.value.trim();const savedTests=await lib().api('/sessions');const matches=savedTests.filter(s=>s.id===enteredId||s.id.slice(-8)===enteredId);if(matches.length!==1)throw Error(matches.length ? 'This ID matches more than one test. Copy its full ID from Recent Sessions.' : 'Test not found in Qnex. For a test from another app, enter its bank question IDs on the left.');const session=await lib().api('/sessions/'+encodeURIComponent(matches[0].id));if(session.bank!==bank.key)throw Error('This test belongs to a different question bank.');const ids=unique((session.questions || []).map(q=>(q.source?.displayId || q.source?.questionId)).filter(id=>id!=null));if(!ids.length)throw Error('No question IDs found in this test.');form.elements.ids.value=ids.join(', ');status.textContent=ids.length+' question IDs retrieved.';sync();}catch(error){status.textContent=error.message;}finally{button.disabled=!form.elements.retrieveId.value.trim();}
      };
      form.onsubmit = async event => {
        event.preventDefault(); const ids = sync(); const button = mount.querySelector('#qwGenerate'); button.disabled = true;
        const status = mount.querySelector('#qwStatus'); status.textContent = '';
        let preparationScreen;
        try {
          if (draft.custom && !this.validateIds(items,draft.ids).valid) throw new Error(this.validateIds(items,draft.ids).message);
          if (!ids.length) throw new Error('Choose a question source, subjects and systems first.');
          if (!Number.isInteger(draft.count) || draft.count<1) throw new Error('Enter a positive whole number of questions.');
          preparationScreen = document.createElement('div'); preparationScreen.className = 'qw-preparation-screen';
          preparationScreen.setAttribute('role', 'status'); preparationScreen.setAttribute('aria-live', 'polite');
          preparationScreen.innerHTML = `<div class="qw-preparation-content">${this.loadingLogo()}<h2>Preparing your questions</h2><p>${esc(bank.label)} · ${Math.min(draft.count, ids.length).toLocaleString()} questions</p></div>`;
          document.body.append(preparationScreen);
          await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
          const result = await lib().api('/questions', { method: 'POST', body: JSON.stringify({ bank: bank.key, ids, count: draft.count }) });
          if (!result.questions.length) throw new Error('No supported questions match. Try a different selection.');
          const options = new Map([['mode',draft.tutor ? 'tutor' : 'exam'],['timer',draft.timed ? 'down' : 'up']]);
          const questions = result.questions.map(q => ({ ...lib().adapt(q, bank.key, options), starred: (stats.markedIds || []).includes(q.id) }));
          if(bank.key.startsWith('bau-'))questions.forEach(q=>{q._bauNavigation=draft.bauNavigation;q._bauSessionTitle=draft.name.trim() || lib().defaultSessionTitle();});
          const timing=this.timing(draft,questions.length);
          if(draft.timed && !timing.valid) throw new Error('Enter a valid time allowance.');
          questions.forEach((q,i)=>{q._timerScope=draft.timed ? draft.timingScope : 'question';q._timerSecs=draft.timed ? (draft.timingScope==='session' ? timing.total : timing.allocations[i]) : 0;q._budgetSeconds=timing.allocations[i];});
          const session = { id: 'medos-' + window.QnexCompat.uuid(), library: true, bank: bank.key, generation: profile.generations[bank.key] || 0, title: draft.name.trim() || lib().defaultSessionTitle(), date: new Date().toISOString(), questions, completed: false, settings: { pools: [...draft.pools], custom: draft.custom, timing:draft.timed ? {...timing,scope:draft.timingScope,basis:draft.timingBasis,adjustment:draft.adjustment} : null } };
          lib().updateSummary(await lib().api('/sessions/' + session.id, { method: 'PUT', body: JSON.stringify(session) }));
          lib().active = session;
          status.textContent = `${questions.length} questions ready.${result.skipped ? ` Skipped ${result.skipped} incomplete source items.` : ''}`;
          window.DungeonBase.open(questions, session.id);
          document.getElementById('dungeonLoadingScreen')?.classList.add('hidden');
        } catch (error) { status.textContent = error.message; }
        finally { preparationScreen?.remove(); sync(); }
      };
      sync();
    },
    inPool(id, pools, stats) {
      const result=stats.progress?.[id];
      return pools.some(pool=>pool==='all' || pool==='new' && !result || pool===result || pool==='marked' && (stats.markedIds || []).includes(id));
    },
    facets(items,draft,stats,amboss) {
      const subjects=new Map(),systems=new Map(),ids=new Set();
      for(const q of items){
        if(!this.inPool(q.id,draft.pools,stats))continue;
        ids.add(q.id);const subject=String(q.subject);
        if(!subjects.has(subject))subjects.set(subject,new Set());subjects.get(subject).add(q.id);
        if(!draft.subjects.includes(subject))continue;
        const key=amboss ? `${q.system}:${q.subject}` : String(q.system);
        if(!systems.has(key))systems.set(key,new Set());systems.get(key).add(q.id);
      }
      return {subjects,systems,ids};
    },
    resolveQuestionIds(items, text) {
      const aliases=new Map();
      items.forEach(q=>[String(q.id),q.displayId,...(q.aliases || [])].filter(Boolean).forEach(alias=>{
        const key=String(alias).toLowerCase();if(!aliases.has(key))aliases.set(key,new Set());aliases.get(key).add(q.id);
      }));
      const raw=text.trim().split(/[\s,]+/).filter(Boolean),ids=[],missing=[],ambiguous=[];
      raw.forEach(value=>{const matches=aliases.get(value.toLowerCase());if(!matches)missing.push(value);else if(matches.size>1)ambiguous.push(value);else ids.push([...matches][0]);});
      return {raw,ids:unique(ids),missing:unique(missing),ambiguous:unique(ambiguous)};
    },
    validateIds(items, text) {
      if(!text.trim())return {valid:false,message:'Enter question IDs to check them.'};
      const {raw,ids,missing,ambiguous}=this.resolveQuestionIds(items,text),found=ids.length;
      const valid=!missing.length&&!ambiguous.length;
      const message=ambiguous.length ? `These IDs identify more than one question: ${ambiguous.slice(0,10).join(', ')}. Use the full batch ID.` : missing.length ? `${found} questions found. IDs not found in this bank: ${missing.slice(0,10).join(', ')}${missing.length>10 ? '…' : ''}.` : `IDs valid · ${found} ${found===1 ? 'question' : 'questions'} found.${raw.length>ids.length ? ' Duplicate IDs counted once.' : ''}`;
      return {valid,found,missing,ambiguous,message};
    },
    duration(seconds) { const value=Math.max(0,Math.round(seconds || 0));return `${Math.floor(value/60)}m ${String(value%60).padStart(2,'0')}s`; },
    timing(draft,count) {
      const factor=1+Number(draft.adjustment || 0)/100;
      const base=draft.timingBasis==='block' ? Number(draft.minutes)*60 : Number(draft.seconds)*count;
      const total=Math.round(base*factor);
      const valid=Number.isInteger(count) && count>0 && Number.isFinite(total) && total>=count && total<=86400*4 && factor>0;
      const allocations=valid ? Array.from({length:count},(_,i)=>Math.floor(total/count)+(i<total%count ? 1 : 0)) : [];
      return {total:valid ? total : 0,allocations,valid};
    },
    matching(items, draft, stats, amboss) {
      const requested = draft.custom ? new Set(this.resolveQuestionIds(items,draft.ids).ids) : null;
      const marked = new Set(stats.markedIds || []);
      return unique(items.filter(q => {
        if (draft.custom && !requested.has(q.id)) return false;
        if (!draft.custom && (!draft.subjects.includes(String(q.subject)) || !draft.systems.includes(amboss ? `${q.system}:${q.subject}` : String(q.system)))) return false;
        if (draft.custom) return true;
        const result = stats.progress?.[q.id];
        return draft.pools.some(pool => pool === 'all' || pool === 'new' && !result || pool === result || pool === 'marked' && marked.has(q.id));
      }).map(q => q.id));
    },
    sessionTable(sessions, withDelete = false) {
      return `<div class="qw-table-scroll"><table class="qw-table qw-session-table"><thead><tr><th>Date / Time</th><th>Test / ID</th><th>Mode</th><th>Subjects</th><th>Systems</th><th>Score</th><th>Progress</th><th>Actions</th></tr></thead><tbody>${sessions.map(s => `<tr><td>${esc(new Date(s.date).toLocaleDateString())}<small>${esc(new Date(s.date).toLocaleTimeString(undefined,{hour:"numeric",minute:"2-digit"}))}</small></td><td><strong>${esc(s.title)}</strong><small>${esc(s.id.slice(-8))}</small></td><td>${esc(s.mode || 'Tutor')}<small>${s.timed ? 'Timed' : 'Untimed'}</small></td><td>${this.chips(s.subjects || [])}</td><td>${this.chips(s.systems || [])}</td><td>${s.completed ? percent(s.correct,s.count)+'%' : '—'}</td><td>${s.answered} / ${s.count}<small>${s.completed ? 'Completed' : 'In progress'}</small></td><td><div class="qw-inline"><button class="qw-icon" data-rename="${esc(s.id)}" title="Rename test" aria-label="Rename test">${icons.edit}</button><button class="qw-icon" data-result="${esc(s.id)}" title="Results and analysis" aria-label="Results and analysis">${icons.results}</button><button class="qw-icon" data-resume="${esc(s.id)}" title="${s.completed ? 'Review' : 'Resume'}" aria-label="${s.completed ? 'Review' : 'Resume'}">${s.completed ? svg('<path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6z"/><circle cx="12" cy="12" r="2.5"/>') : icons.play}</button><button class="qw-icon qw-unsee" data-unsee="${esc(s.id)}" title="Unsee — Reset questions to New" aria-label="Unsee — Reset questions to New">${svg('<path d="M20 11a8 8 0 1 0-2 6M20 4v7h-7"/><path d="M18 20h.01M21 17h.01"/>')}</button>${withDelete ? `<button class="qw-icon" data-delete-session="${esc(s.id)}" title="Delete session" aria-label="Delete session">${svg('<path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7"/>')}</button>` : ''}</div></td></tr>`).join('') || '<tr><td colspan="8" class="qw-empty-sessions">No sessions yet. Create a test to get started.</td></tr>'}</tbody></table></div>`;
    },
    history(mount, { bank }, sessions) {
      mount.innerHTML = this.heading('Recent Sessions', bank) + '<label class="qw-field">Find a test<input id="qwFindTest" type="search" placeholder="Search test names"></label><div id="qwHistory"></div>';
      this.wireHeading(mount);
      const draw = () => {
        const term = mount.querySelector('#qwFindTest').value.toLowerCase();
        const filtered = sessions.filter(s => s.title.toLowerCase().includes(term));
        this.page = Math.min(this.page, Math.max(0, Math.ceil(filtered.length/10)-1));
        const rows = filtered.slice(this.page*10,this.page*10+10);
        mount.querySelector('#qwHistory').innerHTML = `<h3>Current Qbank sessions</h3>${this.sessionTable(filtered.filter(s => s.bank === bank.key))}<h3>All Qbank sessions</h3>${this.sessionTable(rows)}<div class="qw-pagination"><button class="ml-library-btn qd-icon-action" id="qwPrev" ${this.page === 0 ? 'disabled' : ''} title="Previous" aria-label="Previous"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 5-7 7 7 7"/></svg></button><span>${filtered.length ? this.page*10+1 : 0}–${this.page*10+rows.length} of ${filtered.length}</span><button class="ml-library-btn" id="qwNext" ${(this.page+1)*10 >= filtered.length ? 'disabled' : ''}>Next</button></div>`;
        mount.querySelector('#qwPrev')?.addEventListener('click', () => { this.page--; draw(); });
        mount.querySelector('#qwNext')?.addEventListener('click', () => { this.page++; draw(); });
        mount.querySelectorAll('#qwHistory td:nth-child(2) small').forEach(b => b.onclick = async () => { try { const row=b.closest('tr');const id=row.querySelector('[data-resume]')?.dataset.resume;if(!id)throw Error('Test ID unavailable');await navigator.clipboard.writeText(id); if (typeof window.showToast === 'function') window.showToast('Test ID copied to clipboard.', 'success', 2200); else window.notifCenter?.add('Test ID copied to clipboard.', 'success'); b.title='Copied'; setTimeout(() => b.title='Copy test ID', 1200); } catch { if (typeof window.showToast === 'function') window.showToast('Could not copy the test ID.', 'error', 2200); else window.notifCenter?.add('Could not copy the test ID.', 'error'); } });
        this.wireUnsee(mount, () => this.history(mount, { bank }, lib().sessions));
        mount.querySelectorAll('[data-resume]').forEach(b => b.onclick = () => lib().resume(b.dataset.resume));
        mount.querySelectorAll('[data-resume]').forEach(b => {
          const remove=document.createElement('button');remove.className='qw-icon';remove.title='Delete test';remove.setAttribute('aria-label','Delete test');
          remove.innerHTML=svg('<path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7"/>');b.after(remove);
          remove.onclick=async()=>{
            const session=sessions.find(s=>s.id===b.dataset.resume);
            if(!confirm(`Delete “${session.title}”? Its saved answers will be removed from this bank’s progress.`))return;
            remove.disabled=true;
            try {
              await lib().saveQueue;
              await lib().api('/sessions/'+session.id,{method:'DELETE'});
              sessions.splice(sessions.indexOf(session),1);lib().sessions=lib().sessions.filter(s=>s.id!==session.id);
              if(lib().active?.id===session.id)lib().active=null;
              if(window.QuestionBase.state.recentSessions)window.QuestionBase.state.recentSessions=window.QuestionBase.state.recentSessions.filter(s=>s.id!==session.id);
              draw();
            } catch(error){alert(error.message);remove.disabled=false;}
          };
        });
        mount.querySelectorAll('[data-rename]').forEach(b => b.onclick = () => this.rename(sessions.find(s => s.id === b.dataset.rename), draw));
        mount.querySelectorAll('[data-result]').forEach(b => b.onclick = async () => {
          b.disabled = true;
          try { const session = await lib().api('/sessions/' + b.dataset.result); const sessionBank = lib().banks.find(item => item.key === session.bank) || bank; if (mount.isConnected) this.results(mount, sessionBank, session, () => this.history(mount, { bank }, sessions)); }
          catch (error) { alert(error.message); b.disabled = false; }
        });
      };
      mount.querySelector('#qwFindTest').oninput = () => { this.page = 0; draw(); }; draw();
    },
    chips(values = []) { return `<span class="qw-chips">${values.slice(0,2).map(v => `<span>${esc(v)}</span>`).join('')}${values.length > 2 ? `<span title="${esc(values.slice(2).join(', '))}">+${values.length-2}</span>` : ''}</span>`; },
    async loadNotes() {
      const notes = window.electronAPI?.readNotes ? await window.electronAPI.readNotes() : await window.fileSystemService.loadNotes();
      if (!Array.isArray(notes)) throw new Error('Could not read your saved notebook.');
      return notes;
    },
    async saveNote(note) {
      const result = window.electronAPI?.writeNote ? await window.electronAPI.writeNote(note) : await window.fileSystemService.saveNote(note.id,note);
      if (result?.success === false) throw new Error(result.error || 'The note could not be saved.');
      if(window.state?.notes){const i=window.state.notes.findIndex(n=>n.id===note.id);if(i<0)window.state.notes.push(note);else window.state.notes[i]=note;}
      window.TwoBase?.refreshSidebar?.();
    },
    flagged(mount, bank, questions) {
      const own = (window.QuestionBase.state.questions || []).filter(q => q.starred && !q.library);
      mount.innerHTML = this.heading('Flagged Questions',bank) + '<p class="qw-muted">Questions you flagged in Dungeon. Open one to continue or remove its flag.</p>' +
        (questions.length ? [...questions.reduce((groups,q)=>{const name=(q.tags?.subject || []).join(' / ') || 'General';if(!groups.has(name))groups.set(name,[]);groups.get(name).push(q);return groups;},new Map())].sort(([a],[b])=>a.localeCompare(b)).map(([subject,items])=>`<details class="qw-flag-group" open><summary><span>${esc(subject)}</span><small>${items.length} flagged</small></summary><div>${items.map(q=>`<button type="button" class="qw-search-row" data-flag-session="${esc(q.sessionId)}" data-flag-question="${esc(q.id)}"><strong>#${esc(q.questionId)} · ${esc(q.title)}</strong><small>${esc(q.sessionTitle)}</small></button>`).join('')}</div></details>`).join('') : '<div class="qw-card">No flagged questions in this bank yet.</div>') +
        (own.length ? '<h3 class="qw-own-heading">Qnex Qbank</h3>'+own.map(q => `<button class="qw-search-row" data-own-question="${esc(q.id)}">${esc(q.title || 'Untitled question')}</button>`).join('') : '');
      this.wireHeading(mount);
      mount.querySelectorAll('[data-flag-session]').forEach(b => b.onclick = () => lib().resume(b.dataset.flagSession,b.dataset.flagQuestion));
      mount.querySelectorAll('[data-own-question]').forEach(b => b.onclick = () => window.DungeonBase.open([own.find(q => q.id === b.dataset.ownQuestion)]));
    },
    notebook(mount, notes) {
      mount.innerHTML = '<header class="qw-heading"><div><h2>Notebook</h2><p>Your saved Dungeon notes</p></div><button class="ml-library-btn" id="qwNewNote">New note</button></header><div class="qw-inline"><label class="qw-field">Find a note<input id="qwNoteSearch" type="search" placeholder="Search notes"></label><label class="qw-check"><input id="qwNoteCurrent" type="checkbox">Current bank only</label></div><div id="qwNotes"></div>';
      const draw = () => {
        const query=mount.querySelector('#qwNoteSearch').value.toLowerCase(), current=mount.querySelector('#qwNoteCurrent').checked;
        const filtered=notes.filter(n => (!current || n.bank === lib().currentBank || n.questionId?.startsWith('medos:'+lib().currentBank+':')) && (n.title+' '+(n.content || n.contentHtml || '')).toLowerCase().includes(query)).sort((a,b)=>(b.updatedAt || '').localeCompare(a.updatedAt || ''));
        mount.querySelector('#qwNotes').innerHTML=filtered.length ? filtered.map(n=>`<button class="qw-search-row" data-note="${esc(n.id)}"><strong>${esc(n.title || 'Untitled note')}</strong><small>${esc(n.bank ? lib().banks.find(b=>b.key===n.bank)?.label || n.bank : 'Qnex Qbank')} · ${esc(n.updatedAt ? new Date(n.updatedAt).toLocaleDateString() : '')}</small><p>${esc((n.content || n.contentHtml || '').replace(/<[^>]*>/g,'').slice(0,180))}</p></button>`).join('') : '<div class="qw-card">No notes here yet. Save a sticky note in Dungeon, or create a note here.</div>';
        mount.querySelectorAll('[data-note]').forEach(b=>b.onclick=()=>this.editNote(notes.find(n=>n.id===b.dataset.note),notes,draw));
      };
      mount.querySelector('#qwNewNote').onclick=()=>this.editNote(null,notes,draw);
      mount.querySelector('#qwNoteSearch').oninput=draw;mount.querySelector('#qwNoteCurrent').onchange=draw;draw();
    },
    editNote(note, notes, redraw) {
      const dialog=document.createElement('dialog');dialog.className='qw-dialog qw-note-editor ml-library';
      dialog.innerHTML='<form><h2>'+ (note ? 'Edit note' : 'New note')+'</h2><label class="qw-field">Title<input name="title" required maxlength="160"></label><label class="qw-field">Note<textarea name="content" rows="12" required></textarea></label><p role="status"></p><div class="qw-inline"><button type="button" class="ml-library-btn qd-icon-action" title="Cancel" aria-label="Cancel"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 6 12 12M6 18 18 6"/></svg></button><button class="ml-library-btn primary qd-icon-action" title="Save note" aria-label="Save note"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 3h12l4 4v14H3V3h2M7 3v6h10V3M7 21v-8h10v8"/></svg></button></div></form>';
      dialog.querySelector('[name="title"]').value=note?.title || '';
      dialog.querySelector('textarea').value=note?.content || note?.contentHtml || '';
      document.body.append(dialog);dialog.showModal();dialog.querySelector('input').focus();dialog.onclose=()=>dialog.remove();dialog.querySelector('[type="button"]').onclick=()=>dialog.close();
      dialog.querySelector('form').onsubmit=async event=>{
        event.preventDefault();const button=dialog.querySelector('.primary');button.disabled=true;
        const now=new Date().toISOString();
        const text=dialog.querySelector('textarea').value;
        const saved={...note,id:note?.id || 'dungeon_note_'+window.QnexCompat.uuid(),type:'dungeon-note',title:dialog.querySelector('input').value.trim(),content:text,contentHtml:text,bank:note?.bank || lib().currentBank || null,createdAt:note?.createdAt || now,updatedAt:now,date:now};
        try {
          await this.saveNote(saved);
          const index=notes.findIndex(n=>n.id===saved.id);if(index<0)notes.push(saved);else notes[index]=saved;
          if(window.state?.notes){const i=window.state.notes.findIndex(n=>n.id===saved.id);if(i<0)window.state.notes.push(saved);else window.state.notes[i]=saved;}
          redraw();dialog.close();
        } catch(error) {dialog.querySelector('[role="status"]').textContent='Could not save: '+error.message;button.disabled=false;}
      };
    },
    rename(summary, redraw) {
      const dialog = document.createElement('dialog'); dialog.className = 'qw-dialog ml-library';
      dialog.innerHTML = `<form><h2>Rename test</h2><label class="qw-field">Test name<input required maxlength="120" value="${esc(summary.title)}"></label><p role="alert"></p><div class="qw-inline"><button type="button" class="ml-library-btn qd-icon-action" title="Cancel" aria-label="Cancel"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 6 12 12M6 18 18 6"/></svg></button><button class="ml-library-btn primary qd-icon-action" title="Rename" aria-label="Rename"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m16 3 5 5-12 12H4v-5zM14 5l5 5"/></svg></button></div></form>`;
      document.body.append(dialog); dialog.showModal(); dialog.querySelector('input').select();
      dialog.onclose = () => dialog.remove(); dialog.querySelector('[type="button"]').onclick = () => dialog.close();
      dialog.querySelector('form').onsubmit = async e => {
        e.preventDefault(); const title = dialog.querySelector('input').value.trim(); if (!title) return;
        const button = dialog.querySelector('button.primary'); button.disabled = true;
        try { await lib().saveQueue; const session = await lib().api('/sessions/' + summary.id); session.title = title;
          await lib().api('/sessions/' + session.id, { method:'PUT',body:JSON.stringify(session) });
          if (lib().active?.id === session.id) lib().active.title = title;
          summary.title = title; redraw(); dialog.close();
        } catch (error) { dialog.querySelector('[role="alert"]').textContent = error.message; button.disabled = false; }
      };
    },
    wireUnsee(mount, redraw) {
      mount.querySelectorAll('[data-unsee]').forEach(button => button.onclick = async () => {
        button.disabled = true;
        try { if (await lib().reset(button.dataset.unsee, false)) redraw(); }
        finally { if(button.isConnected) button.disabled = false; }
      });
    },
    results(mount, bank, session, back, initialTab = 'results') {
      this.revision++; // Cancel any session-list render started before opening this report.
      let tab = initialTab, filter = 'all';
      const questions = session.questions || [];
      const counts = {correct:0, incorrect:0, omitted:0};
      questions.forEach(q => counts[outcome(q)]++);
      const score = percent(counts.correct, questions.length);
      const changes = {C2I:0,I2C:0,I2I:0};
      questions.forEach(q => Object.keys(changes).forEach(k => changes[k] += Number(q.answerChanges?.[k]) || 0));
      const validStats = questions.map(q => Number(q.answerStats?.percent_correct)).filter((n,i) => questions[i].answerStats?.percent_correct != null && Number.isFinite(n));
      const average = validStats.length === questions.length && validStats.length ? Math.round(validStats.reduce((a,b)=>a+b,0)/validStats.length) : null;
      const tags = (q, field) => (q.tags?.[field] || []).join(', ') || '—';
      const groupTable = field => {
        const groups = new Map();
        questions.forEach(q => (q.tags?.[field]?.length ? q.tags[field] : ['General']).forEach(name => {
          if(!groups.has(name)) groups.set(name,{correct:0,incorrect:0,omitted:0,total:0});
          const row=groups.get(name); row.total++; row[outcome(q)]++;
        }));
        return '<details class="qw-analysis-group" open><summary>'+ (field==='subject'?'Subjects':'Systems') +'</summary><div class="qw-table-scroll"><table class="qw-table"><thead><tr><th>Name</th><th>Total Q</th><th>Correct</th><th>Incorrect</th><th>Omitted</th></tr></thead><tbody>'+[...groups].map(([name,r])=>'<tr><td>'+esc(name)+'</td><td>'+r.total+'</td>'+['correct','incorrect','omitted'].map(k=>'<td>'+r[k]+' ('+percent(r[k],r.total)+'%)</td>').join('')+'</tr>').join('')+'</tbody></table></div></details>';
      };
      const tally = (title, rows) => '<section class="qw-analysis-tally"><h3>'+title+'</h3>'+rows.map(([label,value])=>'<div><span>'+label+'</span><b>'+value+'</b></div>').join('')+'</section>';
      const draw = () => {
        if(window.QnexRouter?.initialized){const route=(tab==='analysis'?'test-analysis/':'test-results/')+encodeURIComponent(session.id);window.QnexRouter.current=route;window.QnexRouter.returnPath='recent-session';window.QnexRouter.write(route);}
        mount.innerHTML = '<section class="qw-test-report"><header class="qw-result-nav"><button class="qw-result-back" id="qwBackTests">← Previous Tests</button><button class="ml-library-btn primary" id="qwReviewTest">Review Test</button></header><h2 class="qw-result-title">'+esc(session.title || 'Test Results')+'</h2><div class="qw-tabs">'+['results','analysis'].map(t=>'<button data-result-tab="'+t+'" class="'+(tab===t?'active':'')+'">Test '+(t==='results'?'Results':'Analysis')+'</button>').join('')+'</div><div id="qwResultBody"></div></section>';
        mount.querySelector('#qwBackTests').onclick = back;
        mount.querySelector('#qwReviewTest').onclick = () => lib().resume(session.id);
        mount.querySelectorAll('[data-result-tab]').forEach(b => b.onclick = () => {tab=b.dataset.resultTab;draw();});
        const body=mount.querySelector('#qwResultBody');
        if(tab==='results') {
          body.innerHTML = '<div class="qw-results-summary"><section><h3>Your Score</h3><strong class="qw-result-score qw-'+(score>=60?'correct':'incorrect')+'">'+score+'%</strong>'+(average==null?'':'<p class="qw-muted">Avg: '+average+'% (question peers)</p>')+'<div class="qw-score-track"><span style="width:'+score+'%"></span></div></section><section class="qw-test-settings"><h3>Test Settings</h3><p><span>Mode</span><span class="qw-chips"><span>'+(questions[0]?._tutorMode===false?'Exam':'Tutor')+'</span><span>'+(questions[0]?._timerMode==='down'?'Timed':'Untimed')+'</span></span></p><p><span>Question Pool</span><span class="qw-chips"><span>'+esc(session.settings?.pools?.join(', ') || 'All')+'</span></span></p></section></div><label class="qw-result-filter">Show: <select aria-label="Filter question results">'+['all','correct','incorrect','omitted'].map(f=>'<option value="'+f+'" '+(f===filter?'selected':'')+'>'+f[0].toUpperCase()+f.slice(1)+'</option>').join('')+'</select></label><div class="qw-table-scroll"><table class="qw-table"><thead><tr><th>Result</th><th>ID</th><th>Subject</th><th>System</th><th>Topic</th><th>% Correct Others</th><th>Time Spent</th></tr></thead><tbody>'+questions.filter(q=>filter==='all'||outcome(q)===filter).map(q=>'<tr><td class="qw-'+outcome(q)+'" aria-label="'+outcome(q)+'">'+({correct:'✓',incorrect:'×',omitted:'—'}[outcome(q)])+'</td><td>'+esc(q.source?.displayId || q.source?.questionId || q.id)+'</td><td>'+esc(tags(q,'subject'))+'</td><td>'+esc(tags(q,'system'))+'</td><td>'+esc(tags(q,'minor'))+'</td><td>'+(q.answerStats?.percent_correct==null?'—':esc(q.answerStats.percent_correct)+'%')+'</td><td>'+(q.timerElapsed==null?'—':Math.round(q.timerElapsed/1000)+'s')+'</td></tr>').join('')+'</tbody></table></div>';
          body.querySelector('select').onchange=e=>{filter=e.target.value;draw();};
        } else {
          const green=questions.length?100*counts.correct/questions.length:0,red=questions.length?100*counts.incorrect/questions.length:0;
          body.innerHTML='<div class="qw-analysis-summary"><div class="qw-score-donut" role="img" aria-label="'+counts.correct+' correct, '+counts.incorrect+' incorrect, '+counts.omitted+' omitted" style="--correct-end:'+green+'%;--incorrect-end:'+(green+red)+'%"><div><strong>'+score+'%</strong><span>Correct</span></div></div>'+tally('Your Score',[['Total Correct',counts.correct],['Total Incorrect',counts.incorrect],['Total Omitted',counts.omitted]])+tally('Answer Changes',[['Correct to Incorrect',changes.C2I],['Incorrect to Correct',changes.I2C],['Incorrect to Incorrect',changes.I2I]])+'</div>'+groupTable('subject')+groupTable('system');
        }
      }; draw();
    },
    reportRows(rows, totals = {}) {
      return rows.length ? rows.sort((a,b) => a.name.localeCompare(b.name)).map(r => `<article class="qw-report"><div class="qw-section-heading"><strong>${esc(r.name)}</strong><span>${r.used}${totals[r.name] != null ? ' / '+totals[r.name] : ''} used · ${percent(r.correct,r.used)}% correct</span></div><div class="qw-bar"><span style="width:${percent(r.correct,r.used)}%;background:#35aa77"></span><span style="width:${percent(r.incorrect,r.used)}%;background:#de646e"></span></div><small>${r.correct} correct · ${r.incorrect} incorrect · ${r.omitted} omitted</small></article>`).join('') : '<p>No saved answers yet.</p>';
    },
    performance(mount, { bank, stats }, taxonomy) {
      const performance=stats.performance || stats;
      const draw = () => {
        mount.innerHTML = this.heading('Performance', bank) + `<p class="qw-stats-note"><strong>Note:</strong> Performance metrics use completed tests. Press End when you finish a test to record your results. QBank usage counts unique questions with saved answers, including tests in progress.</p><div class="qw-tabs">${['overall','reports','graphs'].map(tab => `<button data-stats="${tab}" class="${this.statsTab === tab ? 'active' : ''}">${tab[0].toUpperCase()+tab.slice(1)}</button>`).join('')}</div><div id="qwPerformance"></div>`;
        this.wireHeading(mount);
        mount.querySelectorAll('[data-stats]').forEach(b => b.onclick = () => { this.statsTab = b.dataset.stats; draw(); });
        const body = mount.querySelector('#qwPerformance');
        if (this.statsTab === 'overall') {
          const score=percent(performance.correct,performance.correct+performance.incorrect);
          const unused=Math.max(0,stats.totalQuestions-stats.used);
          const ring=(value,label,color)=>'<article class="qw-stat-card qw-ring-card"><div class="qw-ring" style="--ring-value:'+value+';--ring-color:'+color+'"><div><strong>'+value+'%</strong><span>'+label+'</span></div></div></article>';
          const card=(title,rows)=>'<article class="qw-stat-card"><h3>'+title+'</h3>'+rows.map(([label,value])=>'<div class="qw-stat-row"><span>'+label+'</span><strong>'+Number(value || 0).toLocaleString()+'</strong></div>').join('')+'</article>';
          body.innerHTML='<h3>Performance</h3><div class="qw-stat-grid">'+ring(score,'Correct','#20c464')+card('Your Score',[['Total Correct',performance.correct],['Total Incorrect',performance.incorrect],['Total Omitted',performance.omitted]])+card('Answer Changes',[['Correct to Incorrect',performance.changes.C2I],['Incorrect to Correct',performance.changes.I2C],['Incorrect to Incorrect',performance.changes.I2I]])+ring(stats.totalQuestions ? Math.floor(1000*unused/stats.totalQuestions)/10 : 0,'Unused','#9ca3af')+card('QBank Usage',[['Used Questions',stats.used],['Unused Questions',unused],['Total Questions',stats.totalQuestions]])+card('Test Count',[['Tests Created',stats.created],['Tests Completed',stats.completed],['Suspended Tests',stats.suspended]])+'</div>';
        } else if (this.statsTab === 'reports') {
          const totals = {};
          if (this.reportBy === 'subject') taxonomy.subjects.forEach(s => totals[s.name] = s.count);
          else {
            const grouped = {};
            (taxonomy.items || []).forEach(q => (grouped[q.group] ||= new Set()).add(q.id));
            Object.entries(grouped).forEach(([name, ids]) => totals[name] = ids.size);
          }
          body.innerHTML = `<div class="qw-segments"><button data-report="subject" class="${this.reportBy === 'subject' ? 'active' : ''}">By subject</button><button data-report="system" class="${this.reportBy === 'system' ? 'active' : ''}">By system</button></div>${this.reportRows(Object.values(performance.reports[this.reportBy]), totals)}`;
          body.querySelectorAll('[data-report]').forEach(b => b.onclick = () => { this.reportBy = b.dataset.report; draw(); });
        } else {
          body.innerHTML = `<div class="qw-segments"><button data-graph="test" class="${this.graphBy === 'test' ? 'active' : ''}">Performance by Test</button><button data-graph="date" class="${this.graphBy === 'date' ? 'active' : ''}">Performance by Date</button></div>${this.graph(stats.tests)}`;
          body.querySelectorAll('[data-graph]').forEach(b => b.onclick = () => { this.graphBy = b.dataset.graph; draw(); });
        }
      }; draw();
    },
    graph(tests) {
      tests=[...tests].filter(t=>Number.isFinite(t.score)).sort((a,b)=>String(a.date).localeCompare(String(b.date))); 
      let points = tests;
      if (this.graphBy === 'date') {
        const days = new Map(); tests.forEach(t => { const day = new Date(t.date).toLocaleDateString(); const values = days.get(day) || []; values.push(t.score); days.set(day,values); });
        points = [...days].map(([title,values]) => ({ title,score:values.reduce((a,b) => a+b,0)/values.length }));
      }
      const sorted = points.map(p => p.score).sort((a,b) => a-b), middle = Math.floor(sorted.length/2);
      const median = !sorted.length ? 0 : sorted.length%2 ? sorted[middle] : (sorted[middle-1]+sorted[middle])/2;
      const x = i => points.length === 1 ? 440 : 50+i*780/(points.length-1), y = score => 235-score*2;
      return `<div class="qw-card"><svg class="qw-graph" viewBox="0 0 880 285" role="img" aria-label="Performance by ${this.graphBy}, median ${Math.round(median)} percent">${[0,25,50,75,100].map(n => `<path d="M50 ${y(n)}H840" stroke="currentColor" opacity=".12"/><text x="8" y="${y(n)+4}" fill="currentColor" font-size="12">${n}%</text>`).join('')}<path d="M50 ${y(median)}H840" stroke="currentColor" opacity=".4" stroke-dasharray="5 5"/><polyline points="${points.map((p,i) => `${x(i)},${y(p.score)}`).join(' ')}" fill="none" stroke="#7098ef" stroke-width="2.5"/>${points.map((p,i) => `<circle cx="${x(i)}" cy="${y(p.score)}" r="4" fill="${p.score >= 70 ? '#35aa77' : p.score >= 50 ? '#d5a64b' : '#de646e'}"><title>${esc(p.title)}: ${Math.round(p.score)}%</title></circle>`).join('')}${points.filter((p,i)=>i===0 || i===points.length-1 || i%Math.max(1,Math.ceil(points.length/6))===0).map(p=>`<text x="${x(points.indexOf(p))}" y="265" text-anchor="middle" fill="currentColor" font-size="11">${esc(p.date ? new Date(p.date).toLocaleDateString(undefined,{month:"short",day:"numeric"}) : p.title)}</text>`).join('')}${!points.length ? '<text x="440" y="130" text-anchor="middle" fill="currentColor" font-size="14">Complete a test to see your performance graph.</text>' : ''}</svg><div class="qw-graph-legend"><span style="color:#35aa77">● ≥70% (Good)</span><span style="color:#d5a64b">● 50–69% (Fair)</span><span style="color:#de646e">● &lt;50% (Needs Work)</span></div><p class="qw-muted">Median ${Math.round(median)}% · ${this.graphBy === 'date' ? 'Daily average of completed test scores' : 'Completed tests in chronological order'}</p><details><summary>View data</summary>${points.map(p => `<p>${esc(p.title)} · ${Math.round(p.score)}%</p>`).join('')}</details></div>`;
    },
    search(mount, { bank }, questions) {
      mount.innerHTML = this.heading('Search bank', bank) + '<label class="qw-field">Find a question<input type="search" placeholder="Search by ID, title, subject, or system"></label><p class="qw-muted">Search this bank’s question index. Open a result to read it.</p><div id="qwSearchResults"></div>';
      this.wireHeading(mount);
      const draw = () => {
        const query = mount.querySelector('input').value.trim().toLowerCase();
        const matches = query ? questions.filter(q => `${q.source.displayId || q.source.questionId} ${(q.source.aliases || []).join(' ')} ${q.title} ${q.tags.subject} ${q.tags.system}`.toLowerCase().includes(query)) : [];
        const results = mount.querySelector('#qwSearchResults');
        results.innerHTML = query ? `<p>${matches.length} matches${matches.length > 50 ? ' · showing first 50' : ''}</p>`+matches.slice(0,50).map(q => `<button class="qw-search-row" data-question="${q.source.questionId}"><strong>#${esc(q.source.displayId || q.source.questionId)} · ${esc(q.title)}</strong><small>${esc(q.tags.subject.join(', '))} · ${esc(q.tags.system.join(', '))}</small></button>`).join('') : '';
        results.querySelectorAll('[data-question]').forEach(b => b.onclick = async () => {
          b.disabled = true;
          try { const result = await lib().api(`/question-detail?bank=${encodeURIComponent(bank.key)}&qid=${b.dataset.question}`);
            if (!result.question) throw new Error('Question unavailable.');
            const q = lib().adapt(result.question,bank.key,new Map([['mode','tutor'],['timer','off']]));
            const dialog = document.createElement('dialog'); dialog.className = 'qw-dialog qw-reader ml-library';
            dialog.innerHTML = `<button class="ml-library-btn qd-icon-action" title="Close" aria-label="Close"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 6 12 12M6 18 18 6"/></svg></button><h2>Question #${esc(q.source.displayId || q.source.questionId)}</h2>${lib().renderContent(q,'question')}<ol>${q.options.map(o => `<li>${lib().renderContent(q,'option',o)}</li>`).join('')}</ol><details><summary>Explanation</summary>${lib().renderContent(q,'explanation')}</details>`;
            document.body.append(dialog); dialog.showModal(); dialog.querySelector('button').onclick = () => dialog.close(); dialog.onclose = () => dialog.remove();
          } catch (error) { alert(error.message); } finally { b.disabled = false; }
        });
      }; mount.querySelector('input').oninput = draw;
    }
  };
  window.QBankWorkspace = W;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => W.init()); else W.init();
})();
