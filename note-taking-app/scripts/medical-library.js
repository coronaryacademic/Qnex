(function () {
  'use strict';
  const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const categoryIcons = {
    bau: '<svg class="ml-category-icon" width="20" height="22" viewBox="0 0 24 26" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 2h18v10c0 6-4 10-9 12-5-2-9-6-9-12z"/><path d="M5.5 4.5h13V12c0 4.5-2.8 7.7-6.5 9.2-3.7-1.5-6.5-4.7-6.5-9.2z"/><g stroke-width="1.15" transform="translate(12 12.7) scale(.82) translate(-12 -12.7)"><path d="M11.7 8.2v8.6l-1-1.9-2 .6.6-2-1.9-1 1.9-1-.6-2 2 .6z"/><path d="m12.9 9.4 2.3-1.6 1.5 1.5-.5 1.9 1.1 1.1-2.6 1.1.6 1.2-1.6 3.3-1.1-.3.1-2.8-.4-1.6.4-1.1-.2-1.6z"/></g></svg>',
    cqb: '<svg class="ml-category-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="4" rx="1"/><path d="M5 7v13h14V7M10 11h4"/></svg>',
    uworld: '<svg class="ml-category-icon ml-uw-icon" width="24" height="20" viewBox="0 0 32 24" fill="none" aria-hidden="true"><text x="1" y="18" font-family="Segoe UI,Arial,sans-serif" font-size="15" font-weight="600" letter-spacing="-1.2" fill="currentColor">UW</text></svg>',
    amboss: '<svg class="ml-category-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"/><path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4"/><circle cx="20" cy="10" r="2"/></svg>',
    mehlman: '<svg class="ml-category-icon ml-mehlman-icon" width="22" height="20" viewBox="0 0 22 24" fill="none" aria-hidden="true"><text x="1" y="19" font-family="Arial Narrow,Segoe UI,Arial,sans-serif" font-size="19" font-weight="700" letter-spacing="-.8" fill="currentColor">M</text></svg>',
    boardvitals: '<svg class="ml-category-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>',
    mksap: '<svg class="ml-category-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M12 8v8M8 12h8"/></svg>',
    abim: '<svg class="ml-category-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    nbme: '<svg class="ml-category-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>',
    cms: '<svg class="ml-category-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="m9 15 2 2 4-4"/></svg>',
    default: '<svg class="ml-category-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5.5C9 3.5 5 3.5 2 5v15c3-1.5 7-1.5 10 .5 3-2 7-2 10-.5V5c-3-1.5-7-1.5-10 .5ZM12 5.5v15"/></svg>'
  };
  const caret = '<svg class="ml-tree-caret" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>';
  const leafArrow = '<svg class="ml-leaf-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>';
  const leafDoc = '<svg class="ml-leaf-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>';

  const Library = {
    bootCache: new Map(),
    async preloadWorkspace(onStatus = () => {}) {
      const prime = async endpoint => {
        const value = await this.api(endpoint);
        this.bootCache.set(endpoint, {value, expires:Date.now() + 60000});
        return value;
      };
      await onStatus('Loading question banks…');
      const catalog = await prime('/catalog');
      await onStatus('Loading user settings…');
      const profile = await prime('/profile');
      await onStatus('Loading saved sessions…');
      const sessions = await prime('/sessions');
      this.banks = catalog.banks; this.root = catalog.root; this.profile = profile;
      this.currentBank = profile.currentBank || null; this.sessions = sessions;
      if (this.currentBank) {
        const bank = encodeURIComponent(this.currentBank);
        await onStatus('Loading bank filters…');
        await prime('/filters?bank=' + bank);
        await onStatus('Loading question list…');
        await prime('/questions-list?bank=' + bank);
        await onStatus('Loading dashboard statistics…');
        await prime('/statistics?bank=' + bank);
        await onStatus('Loading flagged questions…');
        await prime('/flagged?bank=' + bank);
      }
    },
    banks: [], sessions: [], active: null, currentBank: null, saveQueue: Promise.resolve(), viewToken: 0,
    defaultSessionTitle(date=new Date()) {
      const time=new Date(date);const day=time.toLocaleDateString('en-US',{month:'short',day:'numeric'});
      const hour=time.toLocaleTimeString('en-US',{hour:'numeric',hour12:true}).replace(/\s/g,'');
      return `Custom session from ${day}, ${hour}`;
    },
    openBankNodes: new Set(['uworld']),
    async api(endpoint, options = {}) {
      if (!options.method || options.method === 'GET') {
        const cached = this.bootCache.get(endpoint);
        if (cached && cached.expires > Date.now()) return structuredClone(cached.value);
      } else this.bootCache.clear();
      await window.fileSystemService.waitForReady();
      if(window.fileSystemService.isOffline && window.QnexOffline)return window.QnexOffline.library(endpoint,options);
      const response = await fetch(window.fileSystemService.baseUrl + '/medical-library' + endpoint, {
        ...options, headers: { 'Content-Type': 'application/json' }
      });
      const data = await response.json().catch(() => ({ error: 'The library service is unavailable. Restart Qnex to load the update.' }));
      if (!response.ok) throw new Error(data.error || 'Could not load the library.');
      return data;
    },
    status(message, error = false) {
      if(window.fileSystemService?.isOffline && window.QnexOffline){message=window.QnexOffline.message;error=false;}
      const node = document.getElementById('mlLibraryStatus');
      if (node) { const busy=/^(Finding|Connecting|Loading)/.test(message); node.innerHTML = error ? escape(message) : busy ? `<span class="qw-spinner" aria-hidden="true"></span><span>${escape(message)}</span>` : `<span>${escape(message)}</span>`; node.classList.toggle('error', error); }
    },
    async render() {
      const grid = document.getElementById('medicalLibraryGrid');
      if (!grid) return;
      const token = ++this.viewToken;
      grid.innerHTML = `
        <section class="ml-library">
          <div class="ml-library-toolbar">
            <input id="mlBankSearch" type="search" placeholder="Find a question bank…" aria-label="Find a question bank">
            <button class="ml-library-btn qd-icon-action" id="mlRefresh" title="Refresh" aria-label="Refresh"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 11a8 8 0 0 0-14-5L3 9m0-6v6h6M4 13a8 8 0 0 0 14 5l3-3m0 6v-6h-6"/></svg></button>
          </div>

          <p id="mlLibraryStatus" class="ml-library-muted ml-library-status" role="status"><span class="qw-spinner" aria-hidden="true"></span><span>Finding local question banks…</span></p>
          <div id="mlBankContent"></div>

          <div id="mlSavedSessions" class="ml-library-sessions"></div>
        </section>
      `;
      document.getElementById('mlRefresh').onclick = () => this.render();
      document.getElementById('mlBankSearch').oninput = () => { this.selectedBank = null; this.renderBanks(); };
      try {
        const [catalog, sessions, profile] = await Promise.all([this.api('/catalog'), this.api('/sessions'), this.api('/profile')]);
        if (token !== this.viewToken) return;
        this.banks = catalog.banks; this.root = catalog.root; this.sessions = sessions;
        this.profile = profile;
        this.currentBank = profile.currentBank || null;
        this.mergeSessionSummaries();
        this.renderGoalToolbar();
        this.renderBanks();
        this.renderSessions();

        // Sync question list into sidebar for the active bank
        if (this.currentBank && window.QuestionBase?.loadBankQuestions && (!window.QuestionBase.state.questions.length || window.QuestionBase._loadedBank !== this.currentBank)) {
          window.QuestionBase.loadBankQuestions(this.currentBank).catch(() => {});
        }
      } catch (error) { if (token === this.viewToken) this.status(error.message, true); }
    },
    renderLocationSettings(mount) {
      const section = document.createElement('section');
      section.className = 'qw-card';
      section.innerHTML = `<h3>Library location</h3><form class="ml-library-toolbar"><input aria-label="MedOS installation folder" value="${escape(this.root || 'D:\\MedOS\\MedOS')}"><button class="qw-icon" title="Connect folder" aria-label="Connect folder"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 7V5h6l2 2h10v13H3zM12 10v7m-3-3h6"/></svg></button></form><p class="qw-muted" role="status"></p>`;
      mount.append(section);
      const input = section.querySelector('input'), status = section.querySelector('[role="status"]');
      if (!this.root) this.api('/catalog').then(data => {
        this.root = data.root;
        if (section.isConnected && input.value === 'D:\\MedOS\\MedOS') input.value = data.root;
      }).catch(error => { if (section.isConnected) status.textContent = error.message; });
      section.querySelector('form').onsubmit = async event => {
        event.preventDefault();
        const button = section.querySelector('button');
        button.disabled = true; status.textContent = 'Connecting to the folder…';
        try {
          const data = await this.api('/connect', {method:'POST',body:JSON.stringify({root:input.value})});
          this.banks = data.banks; this.root = data.root; input.value = data.root;
          this.renderBanks(); this.renderGoalToolbar();
          status.textContent = 'Library location saved.';
        } catch (error) { status.textContent = error.message; }
        finally { button.disabled = false; }
      };
    },
    renderGoalToolbar() {
      const bar = document.getElementById('mlGoalToolbar');
      if (!bar) return;
      const activeBank = this.banks.find(b => b.key === this.currentBank);
      const icon = categoryIcons[activeBank?.category] || categoryIcons.default;
      bar.innerHTML = `
        <div class="ml-goal-status">
          <div class="ml-goal-icon-badge">${icon}</div>
          <div class="ml-goal-details">
            <div class="ml-goal-tag">CURRENT STUDY GOAL</div>
            <div class="ml-goal-title">${escape(activeBank?.label || 'No question bank chosen')}</div>
            <div class="ml-goal-meta">${activeBank ? `${activeBank.count.toLocaleString()} questions · Linked to Statistics & Sidebar` : 'Select a question bank below to begin practicing'}</div>
          </div>
        </div>
        <div class="ml-goal-actions">
          ${activeBank ? `<button type="button" class="ml-library-btn primary qd-icon-action" id="mlGoalStudyBtn" title="Practice Session" aria-label="Practice Session"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m8 4 12 8-12 8z"/></svg></button>` : ''}
          ${activeBank ? `<button type="button" class="ml-library-btn qd-icon-action" id="mlGoalStatsBtn" title="View Statistics" aria-label="View Statistics"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 20v-6M12 20V4M19 20V10"/></svg></button>` : ''}
          <button type="button" class="ml-library-btn" id="mlGoalChangeBtn">${activeBank ? 'Change QBank' : 'Choose QBank'}</button>
        </div>
      `;
      const studyBtn = document.getElementById('mlGoalStudyBtn');
      if (studyBtn && activeBank) studyBtn.onclick = () => this.openBank(activeBank.key);
      const statsBtn = document.getElementById('mlGoalStatsBtn');
      if (statsBtn) statsBtn.onclick = () => {
        if (window.QuestionBase) window.QuestionBase.switchTab('statistics');
      };
      const changeBtn = document.getElementById('mlGoalChangeBtn');
      if (changeBtn) changeBtn.onclick = () => {
        const content = document.getElementById('mlBankContent');
        if (content) content.scrollIntoView({ behavior: 'smooth', block: 'start' });
      };
    },
    async selectGoal(key) {
      try {
        this.profile = await this.api('/profile', { method: 'POST', body: JSON.stringify({ currentBank: key }) });
        this.currentBank = this.profile.currentBank;
        window.QbankProfile?.updateBank(this.banks.find(bank=>bank.key===this.currentBank));
        this.selectedBank = key;
        this.renderGoalToolbar();
        this.renderBanks();
        if (window.QuestionBase?.loadBankQuestions) {
          await window.QuestionBase.loadBankQuestions(key);
        }
        window.QBankDashboard?.refreshVisible();
      } catch (err) {
        console.warn('[MedicalLibrary] Could not save active goal:', err);
        throw err;
      }
    },
    groupBanks(banks) {
      const categories = [
        ['bau', 'BAU Qbank'],
        ['uworld', 'UWorld Qbank'], ['amboss', 'AMBOSS Qbank'],
        ['mehlman', 'Mehlman High Yield'], ['boardvitals', 'BoardVitals'],
        ['mksap', 'MKSAP'], ['abim', 'ABIM / Internal Medicine'],
        ['nbme', 'NBME Self-Assessments'], ['cms', 'CMS Forms']
      ];
      const groups = new Map(categories.map(([id, label]) => [id, { id, label, banks: [], children: [] }]));
      for (const bank of banks) {
        const category = ['amboss_abim', 'uworld_abim'].includes(bank.category) ? 'abim' : bank.category || 'other';
        if (!groups.has(category)) groups.set(category, { id: category, label: 'Other Question Banks', banks: [], children: [] });
        groups.get(category).banks.push(bank);
      }
      const compare = (a, b) => a.label.localeCompare(b.label, undefined, { numeric: true });
      for (const group of groups.values()) {
        group.banks.sort((a, b) => Number(!!a.isArchived) - Number(!!b.isArchived) || compare(a, b));
        if (!['nbme','cms'].includes(group.id)) continue;
        const children = new Map();
        for (const bank of group.banks) {
          const label = group.id === 'bau' ? `${bank.year || 4}th year` : group.id === 'nbme' ? `Step ${bank.step || bank.key.match(/^nbme-(\d+)/)?.[1] || 'Other'}` : bank.subject || bank.label.split(' · ')[0];
          if (!children.has(label)) children.set(label, { id: `${group.id}:${label}`, label, banks: [] });
          children.get(label).banks.push(bank);
        }
        group.children = [...children.values()].sort(compare);
      }
      return [...groups.values()].filter(group => group.banks.length);
    },
    renderBanks() {
      const content = document.getElementById('mlBankContent');
      if (!content) return;
      const query = document.getElementById('mlBankSearch').value.trim().toLowerCase();
      const listedBanks = [...this.banks];
      for (const year of [4,5,6]) {
        if (!listedBanks.some(bank => bank.category==='bau' && Number(bank.year)===year)) {
          listedBanks.push({key:`bau-year${year}`,label:`${year}th year`,category:'bau',year,count:0,isPending:true});
        }
      }
      const allGroups = this.groupBanks(listedBanks);
      const banks = allGroups.flatMap(group => group.banks.filter(bank => `${group.label} ${bank.year ? bank.year+'th year' : ''} ${bank.label} ${bank.subject || ''} ${bank.category}`.toLowerCase().includes(query)));
      const groups = this.groupBanks(banks);
      this.status(query ? `${banks.length} matching banks` : `${this.banks.length} banks · ${allGroups.length} collections`);
      const leaves = (items, category) => items.map(bank => {
        const form = bank.form || bank.label.match(/·\s*Form\s+(.+)$/)?.[1];
        const label = bank.isArchived ? (['uworld', 'amboss'].includes(category) ? 'Archived' : `Archived · ${bank.label.replace(/ · Archived$/, '')}`) : ['nbme', 'cms'].includes(category) && form ? `Form ${form}` : ['uworld', 'amboss'].includes(category) && bank.step ? `Step ${bank.step}${bank.category === 'amboss' && bank.step === 2 ? ' CK' : ''}` : bank.label;
        const isActiveGoal = this.currentBank === bank.key;
        return `
          <div class="ml-leaf-row${isActiveGoal ? ' is-active-goal' : ''}">
            <button type="button" class="ml-tree-leaf${this.selectedBank === bank.key ? ' is-selected' : ''}" ${bank.isPending ? 'disabled' : `data-bank="${escape(bank.key)}"`} aria-label="${escape(bank.label)}, ${bank.isPending ? 'Awaiting PDFs' : bank.count.toLocaleString()+' questions'}">
              <span class="ml-leaf-icon">${bank.isArchived ? categoryIcons.cqb : leafDoc}</span>
              <span class="ml-tree-leaf-name">${escape(label)}</span>
              ${isActiveGoal ? '<span class="ml-badge-active">CURRENT BANK</span>' : ''}
              <span class="ml-tree-count">${bank.count.toLocaleString()} <span class="ml-count-unit">questions</span></span>
              ${bank.isPending ? '' : `<span class="ml-leaf-arrow" aria-hidden="true">${leafArrow}</span>`}
            </button>
          </div>
        `;
      }).join('');
      const node = (id, label, count, children, nested = false, unit = '') => {
        const icon = categoryIcons[id] || categoryIcons.default;
        return `<details class="ml-tree-node${nested ? ' ml-tree-subgroup' : ''}" data-node="${escape(id)}"${query || this.openBankNodes.has(id) ? ' open' : ''}><summary>${caret}${nested ? '' : icon}<span class="ml-tree-name">${escape(label)}</span><span class="ml-tree-total">${count} ${unit || (nested ? (count === 1 ? 'form' : 'forms') : (count === 1 ? 'bank' : 'banks'))}</span></summary><div class="ml-tree-children">${children}</div></details>`;
      };
      content.innerHTML = `<div class="ml-collection-heading"><h3>Question banks</h3><div class="ml-bank-controls"><button type="button" class="qw-icon" data-bank-toggle aria-label="Expand all" title="Expand all"></button></div></div><div class="ml-bank-tree">${groups.map(group => node(group.id, group.label, group.banks.length, group.children.length ? group.children.map(child => node(child.id, child.label, child.banks.length, leaves(child.banks, group.id), true, group.id==='bau' ? 'subjects' : '')).join('') : leaves(group.banks, group.id))).join('')}</div>`;
      if (!banks.length) content.innerHTML = '<div class="ml-library-empty">No matching question banks. Try a source, Step, or subject.</div>';
      const toggle = content.querySelector('[data-bank-toggle]');
      const syncToggle = () => {
        if (!toggle) return;
        const allOpen = [...content.querySelectorAll('details[data-node]')].every(details => details.open);
        const label = allOpen ? 'Collapse all' : 'Expand all';
        toggle.dataset.bankToggle = String(!allOpen);
        toggle.title = label;
        toggle.setAttribute('aria-label', label);
        toggle.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16" aria-hidden="true"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="bevel" stroke-width="2" d="M3 6h10M3 10h10"/><path fill="currentColor" d="${allOpen ? 'm8 12 3 3H5zm0-8L5 1h6z' : 'm8 16 3-3H5zM8 0 5 3h6z'}"/></svg>`;
      };
      syncToggle();
      if (toggle) toggle.onclick = () => {
        const open = toggle.dataset.bankToggle === 'true';
        content.querySelectorAll('details[data-node]').forEach(details => {
          details.open = open;
          if (open) this.openBankNodes.add(details.dataset.node);
          else this.openBankNodes.delete(details.dataset.node);
        });
        syncToggle();
      };
      content.querySelectorAll('details[data-node]').forEach(details => details.addEventListener('toggle', () => {
        if (!details.isConnected) return;
        syncToggle();
        if (!query) {
          if (details.open) this.openBankNodes.add(details.dataset.node);
          else this.openBankNodes.delete(details.dataset.node);
        }
      }));
      content.querySelectorAll('[data-bank]').forEach(button => button.onclick = async () => {
        button.disabled = true;
        try { await this.selectGoal(button.dataset.bank); window.QuestionBase.switchTab('create-test'); }
        catch (error) { button.disabled = false; this.status(error.message, true); }
      });
      content.querySelectorAll('[data-set-goal]').forEach(button => {
        button.onclick = (e) => {
          e.stopPropagation();
          this.selectGoal(button.dataset.setGoal).catch(error => this.status(error.message, true));
        };
      });
    },
    async openBank(key) {
      const bank = this.banks.find(item => item.key === key);
      if (!bank) return;
      this.selectedBank = key;
      this.status('Loading subjects and systems…');
      try {
        const filters = await this.api('/filters?bank=' + encodeURIComponent(key));
        if (this.selectedBank !== key) return;
        const options = items => items.map(item => `<option value="${item.id}">${escape(item.name)} (${item.count})</option>`).join('');
        const isActiveGoal = this.currentBank === key;
        const backIcon = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>';
        document.getElementById('mlBankContent').innerHTML = `
          <form id="mlStudyForm" class="ml-library-form">
            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
              <button type="button" id="mlBack" class="ml-library-btn" style="display:inline-flex; align-items:center; gap:6px;">${backIcon} All banks</button>
              <button type="button" id="mlFormSetGoal" class="ml-library-btn ${isActiveGoal ? 'primary' : ''}">
                ${isActiveGoal ? '✓ Active Study Goal' : '★ Set as Active Study Goal'}
              </button>
            </div>
            <h3 style="margin-top:20px">${escape(bank.label)}</h3>
            <p class="ml-library-muted">${bank.count.toLocaleString()} questions available. Study with your Qnex Dungeon tools.</p>
            <div class="ml-library-fields">
              <label>Subject<select name="subject"><option value="">All subjects</option>${options(filters.subjects)}</select></label>
              <label>System<select name="system"><option value="">All systems</option>${options(filters.systems)}</select></label>
              <label>Questions<input name="count" type="number" min="1" step="1" value="10" required></label>
              <label>Question pool<select name="pool"><option value="all">All questions</option><option value="unused">Not answered in Qnex</option></select></label>
              <label>Feedback<select name="mode"><option value="tutor">Tutor — explain after answering</option><option value="exam">Exam — explain after ending the block</option></select></label>
              <label>Timer<select name="timer"><option value="off">No timer</option><option value="up">Count up</option><option value="down">90 seconds per question</option></select></label>
            </div>
            <p class="ml-library-muted">Standard multiple-choice practice. Linked case questions are skipped; official assessment scoring is not applied.</p>
            <div style="display:flex; gap:12px;">
              <button class="ml-library-btn primary qd-icon-action" id="mlStart" title="Start in Dungeon" aria-label="Start in Dungeon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m8 4 12 8-12 8z"/></svg></button>
            </div>
          </form>
        `;
        document.getElementById('mlBack').onclick = () => this.renderBanks();
        document.getElementById('mlFormSetGoal').onclick = () => this.selectGoal(key).catch(error => this.status(error.message, true));
        document.getElementById('mlStudyForm').onsubmit = event => { event.preventDefault(); this.start(bank, new FormData(event.currentTarget)); };
        this.status('Ready to build your session.');
      } catch (error) { this.status(error.message, true); }
    },
    async start(bank, form) {
      const button = document.getElementById('mlStart'); button.disabled = true;
      this.status('Loading questions, answers, and explanations…');
      try {
        if (!window.DungeonBase) throw new Error('Dungeon is not ready. Please reload Qnex.');
        this.profile = await this.api('/profile');
        const exclude = form.get('pool') === 'unused' ? [...new Set(this.sessions.filter(s => s.bank === bank.key).flatMap(s => s.usedIds || []))] : [];
        const result = await this.api('/questions', { method: 'POST', body: JSON.stringify({ bank: bank.key, subject: form.get('subject'), system: form.get('system'), count: Number(form.get('count')), exclude }) });
        if (!result.questions.length) throw new Error('No supported questions match this selection. Try another subject or question pool.');
        const questions = result.questions.map(q => this.adapt(q, bank.key, form));
        const session = { id: 'medos-' + crypto.randomUUID(), library: true, bank: bank.key, generation: this.profile.generations[bank.key] || 0, title: this.defaultSessionTitle(), date: new Date().toISOString(), questions, completed: false };
        const summary = await this.api('/sessions/' + session.id, { method: 'PUT', body: JSON.stringify(session) });
        this.updateSummary(summary); this.active = session;
        this.status(`${questions.length} questions loaded.${result.skipped ? ` ${result.skipped} incomplete or linked questions skipped.` : ''}`);
        window.DungeonBase.open(questions, session.id);
      } catch (error) { this.status(error.message, true); }
      finally { button.disabled = false; }
    },
    adapt(q, bank, form) {
      return { id: `medos:${bank}:${q.id}`, title: q.title || `${bank} · ${q.id}`, text: q.stem || '', explanation: q.explanation || '',
        contentFormat: 'medos-html', richText: q.stem_html, richExplanation: q.explanation_html,
        media: q.media || [], explanationMedia: q.explanation_media || [],
        source: { bank, questionId: q.id, displayId:q.displayId, aliases:q.aliases, references:q.sources },
        answerStats: q.answer_stats, subjectId: q.subject_id, systemId: q.system_id,
        options: q.choices.map((text, index) => ({ id: String(index + 1), text, richText: q.choices_html?.[index] || '', percent: q.answer_percentages?.[index], isCorrect: index + 1 === Number(q.correct) })),
        tags: { subject: q.subject_names?.length ? q.subject_names : q.subject ? [q.subject] : ['General'], system: q.system_groups?.length ? q.system_groups : q.system_group ? [q.system_group] : q.system ? [q.system] : ['General'], major: [], minor: q.system_detail ? [q.system_detail] : [] },
        _tutorMode: form.get('mode') !== 'exam', _timerMode: form.get('timer'), _timerScope: 'question', _timerSecs: form.get('timer') === 'down' ? 90 : 0 };
    },
    captureMarkup(q, container) {
      const content = (container.querySelector('.ml-rich-content') || container).cloneNode(true);
      content.querySelectorAll('.ml-media-unavailable[data-ml-src]').forEach(notice => {
        const media = document.createElement(['video','audio'].includes(notice.dataset.mlTag) ? notice.dataset.mlTag : 'img');
        media.setAttribute('src', notice.dataset.mlSrc); notice.replaceWith(media);
      });
      content.querySelectorAll('[data-ml-extra]').forEach(el => el.remove());
      content.querySelectorAll('[src], [href]').forEach(el => {
        for (const attr of ['src', 'href']) {
          const value = el.getAttribute(attr) || '';
          const match = value.match(/\/medical-library\/media\/[^/]+\/(\d+)\/([^?#]+)/);
          if (match) el.setAttribute(attr, '/qbank/media/' + match[1] + '/' + decodeURIComponent(match[2]));
        }
      });
      q.richText = content.innerHTML;
    },
    clearHighlights(q) {
      const template = document.createElement('template'); template.innerHTML = q.richText || '';
      template.content.querySelectorAll('span[class]').forEach(el => {
        if ([...el.classList].some(c => /^highlight(?:-[a-z]+)?$/.test(c))) el.replaceWith(...el.childNodes);
      });
      q.richText = template.innerHTML;
    },
    // Allow-list imported markup and resolve local media at render time so saved
    // sessions survive backend port changes. Ordinary Qnex questions use Markdown.
    renderContent(q, kind, option) {
      if (q.contentFormat !== 'medos-html') {
        const text = option ? option.text : kind === 'explanation' ? q.explanation : (q.text || q.body || q.content);
        return window.Markdown ? window.Markdown.render(text || '') : escape(text || '');
      }
      const markup = option ? option.richText || escape(option.text) : kind === 'explanation' ? q.richExplanation || escape(q.explanation) : q.richText || escape(q.text);
      const template = document.createElement('template'); template.innerHTML = markup || '';
      const allowed = new Set('P DIV SPAN FONT CENTER BR STRONG B EM I U S SUB SUP UL OL LI TABLE THEAD TBODY TFOOT TR TD TH CAPTION H1 H2 H3 H4 H5 H6 BLOCKQUOTE IMG A FIGURE FIGCAPTION HR VIDEO AUDIO SOURCE PRE CODE DETAILS SUMMARY'.split(' '));
      const assets = option ? [] : kind === 'explanation' ? (q.source.bank.startsWith('mehlman-') ? [] : q.explanationMedia) : q.media;
      const knownNames = new Set([...(q.media || []), ...(q.explanationMedia || [])].map(a => a.name.toLowerCase()));
      const mediaExtension = /\.(?:jpe?g|png|gif|webp|svg|mp4|webm|mov|m4v|mp3|wav|ogg)$/i;
      const url = raw => {
        const value = String(raw || '').trim();
        const exhibit = value.match(/\/qbank\/exhibit\/(\d{3,8})(?:[?#]|$)/) || value.match(/^(?:\.\/)?(\d{3,8})\.html(?:[?#].*)?$/);
        if (exhibit) return `${window.fileSystemService.baseUrl}/medical-library/exhibit/${encodeURIComponent(q.source.bank)}/${q.source.questionId}/${exhibit[1]}`;
        if (/\/medical-library\/exhibit\//.test(value)) return value;
        const match = value.match(/\/qbank\/media\/(\d+)\/([^?#]+)(?:[?#].*)?$/) || value.match(/\/medical-library\/media\/[^/]+\/(\d+)\/([^?#]+)(?:[?#].*)?$/);
        let name;
        try { name = decodeURIComponent(match ? match[2] : value.replace(/^https?:\/\/[^/]+\/.*?(?:webmedia|media)\//i, '').replace(/^(?:\.\.\/|\.\/)*(?:media\/)?/i, '').split(/[?#]/)[0]); } catch { return null; }
        if (!name || /[\\/]/.test(name) || !mediaExtension.test(name)) return null;
        return `${window.fileSystemService.baseUrl}/medical-library/media/${encodeURIComponent(q.source.bank)}/${match ? match[1] : q.source.questionId}/${encodeURIComponent(name)}`;
      };
      template.content.querySelectorAll('*').forEach(el => {
        if (!allowed.has(el.tagName)) { el.remove(); return; }
        if (el.tagName === 'IMG' && !el.getAttribute('src') && el.getAttribute('data-src')) el.setAttribute('src', el.getAttribute('data-src'));
        for (const attr of [...el.attributes]) {
          if(attr.name==='class' && q.source.bank.startsWith('amboss') && ['selected','wichtig','qbank-hint','qbank-hint-body'].includes(attr.value)) continue;
          if (attr.name === 'class' && el.tagName === 'SPAN' && /^highlight(?:-(?:yellow|green|blue|pink|purple|orange|red))?$/.test(attr.value)) continue;
          if (!['src', 'href', 'alt', 'title', 'colspan', 'rowspan'].includes(attr.name)) el.removeAttribute(attr.name);
        }
        for (const attr of ['src', 'href']) {
          if (!el.hasAttribute(attr)) continue;
          const rawValue = el.getAttribute(attr).trim();
          const safeLink = attr === 'href' && !/^(?:javascript:|data:)/i.test(rawValue) ? rawValue : null;
          const safe = url(rawValue) || safeLink;
          if (safe) el.setAttribute(attr, safe);
          else { el.removeAttribute(attr); if (el.tagName === 'A') el.title = 'This reference is not available in Qnex yet.'; }
        }
        if (el.tagName === 'VIDEO' || el.tagName === 'AUDIO') el.setAttribute('controls', '');
        if (el.tagName === 'A' && el.hasAttribute('href')) { el.target = '_blank'; el.rel = 'noopener noreferrer'; }
      });
      const makeMedia = (src, name = '') => {
        const tag = /\.(mp4|webm|mov|m4v)(?:[?#]|$)/i.test(src) ? 'video' : /\.(mp3|wav|ogg)(?:[?#]|$)/i.test(src) ? 'audio' : 'img';
        const media = document.createElement(tag); media.src = src;
        if (tag === 'img') { media.alt = 'Question illustration'; media.loading = 'lazy'; media.decoding = 'async'; }
        else { media.controls = true; media.preload = 'metadata'; }
        if (name) media.title = name;
        return media;
      };
      // MedOS keeps figure links in the sentence and opens them in its viewer.
      // Preserve the author's linked words rather than replacing them with images.
      template.content.querySelectorAll('a[href]').forEach(anchor => {
        const href = anchor.getAttribute('href') || '';
        if (url(href) && (/\.(?:jpe?g|png|gif|webp|svg)(?:[?#]|$)/i.test(href) || href.includes('/medical-library/exhibit/'))) {
          anchor.classList.add('ml-figure-link');
          anchor.removeAttribute('target');
          if (!anchor.title) anchor.title = 'Open figure';
          if (href.includes('/medical-library/exhibit/')) {
            anchor.dataset.mlBank = q.source.bank;
            anchor.dataset.mlQid = q.source.questionId;
          }
        }
      });
      const walker = document.createTreeWalker(template.content, NodeFilter.SHOW_TEXT);
      const textNodes = []; while (walker.nextNode()) textNodes.push(walker.currentNode);
      for (const node of textNodes) {
        if (node.parentElement?.closest('a,code,pre')) continue;
        const name = node.textContent.trim().replace(/^\[|\]$/g, '');
        if (!mediaExtension.test(name) || (!knownNames.has(name.toLowerCase()) && !/^\d[\w.-]*\.(?:jpe?g|png|gif|webp)$/i.test(name))) continue;
        const src = url(name); if (src) node.replaceWith(makeMedia(src, name));
      }
      const displayed = new Set([...template.content.querySelectorAll('[src], a.ml-figure-link[href]')].map(el => el.getAttribute('src') || el.getAttribute('href')));
      for (const asset of assets || []) {
        const src = url(asset.url); if (!src) continue;
        if (displayed.has(src)) continue;
        displayed.add(src);
        const media = makeMedia(src, asset.name);
        const figure = document.createElement('figure'); figure.dataset.mlExtra = 'true'; figure.append(media); template.content.append(figure);
      }
      if(kind==='explanation' && !option && q.source.bank.startsWith('mehlman-')) {
        const recordings=new Map(); const inlineRecordings=new Set();
        const add=raw=>{const src=url(raw);if(src && /\.(?:mp3|wav|ogg)(?:[?#]|$)/i.test(src)) recordings.set(src,true);};
        for(const asset of q.explanationMedia || []) add(asset.url || asset.name);
        template.content.querySelectorAll('audio').forEach(audio=>{
          const src=url(audio.getAttribute('src'));if(src)inlineRecordings.add(src);audio.querySelectorAll('source').forEach(source=>{const src=url(source.getAttribute('src'));if(src)inlineRecordings.add(src);});audio.classList.add('ml-inline-voice');audio.preload='metadata';audio.removeAttribute('autoplay');
        });
        template.content.querySelectorAll('a[href]').forEach(anchor=>{
          if(/\.(?:mp3|wav|ogg)(?:[?#]|$)/i.test(anchor.getAttribute('href'))) {
            add(anchor.getAttribute('href'));
            if(mediaExtension.test(anchor.textContent.trim()))anchor.remove();else anchor.replaceWith(...anchor.childNodes);
          }
        });
        inlineRecordings.forEach(src=>recordings.delete(src)); if(recordings.size) {
          const section=document.createElement('section');section.className='ml-voice-notes';section.setAttribute('aria-label','Explanation voice notes');
          const label=document.createElement('div');label.className='ml-voice-heading';label.textContent='Voice notes';section.append(label);
          [...recordings.keys()].forEach((src,index)=>{
            const row=document.createElement('div');row.className='ml-voice-row';
            const title=document.createElement('span');title.textContent=recordings.size>1 ? 'Note '+(index+1) : 'Listen';
            const audio=document.createElement('audio');audio.controls=true;audio.preload='metadata';audio.src=src;audio.setAttribute('aria-label','Voice note '+(index+1));
            row.append(title,audio);section.append(row);
          });template.content.append(section);
        }
      }
      template.content.querySelectorAll('table').forEach(table => {
        if(table.parentElement?.closest('table')) return;
        const wrapper = document.createElement('div'); wrapper.className = 'ml-table-scroll'; table.replaceWith(wrapper);
        const answerRows=[...table.tBodies].flatMap(body=>[...body.rows]);
        if(kind==='question' && answerRows.length>=2 && answerRows.every(row=>row.cells.length>=2 && /^[A-Z]$/.test(row.cells[0].textContent.trim())) && table.tHead?.rows[0]?.cells[0]?.textContent.trim()==='') {
          table.classList.add('ml-answer-reference');wrapper.classList.add('ml-answer-reference-wrap');
        }
        wrapper.append(table);
      });
      return '<div class="ml-rich-content">' + template.innerHTML + '</div>';
    },
    updateSummary(summary) {
      this.sessions = [summary, ...this.sessions.filter(s => s.id !== summary.id)];
      this.mergeSessionSummaries();
      window.QBankDashboard?.refreshVisible();
    },
    mergeSessionSummaries() {
      const qb = window.QuestionBase;
      if (!qb) return;
      qb.state.recentSessions = [...this.sessions, ...qb.state.recentSessions.filter(s => !s.library)].sort((a, b) => b.date.localeCompare(a.date));
      qb.renderRecentSessions();
    },
    async loadSummaries() {
      try { this.sessions = await this.api('/sessions'); this.mergeSessionSummaries(); }
      catch (error) { console.warn('[Medical Library]', error.message); }
    },
    saveDungeonSession(dungeon) {
      if (!this.active || this.active.id !== dungeon.state.associatedSessionId) return Promise.resolve();
      const snapshot = JSON.parse(JSON.stringify({ ...this.active, questions: dungeon.state.questions, completed: dungeon.state.isBlockRevealed }));
      if (dungeon.timerStart && dungeon._timerQuestion) {
        const live = dungeon._timerQuestion, copy = snapshot.questions.find(q => q.id === live.id);
        const elapsed = Math.max(0,Date.now()-dungeon.timerStart);
        if (copy) {
          const spent = live._timerMode === 'down' ? Math.min(elapsed,dungeon._timerInitialMs ?? elapsed) : elapsed;
          copy.timerElapsed = (copy.timerElapsed || 0)+spent;
          if (live._timerMode === 'down' && live._timerScope === 'session') snapshot.questions.forEach(q => { q._blockRemainingMs=Math.max(0,(dungeon._timerInitialMs ?? live._timerSecs*1000)-elapsed); });
          else if (live._timerMode === 'down') copy._remainingMs=Math.max(0,(dungeon._timerInitialMs ?? live._timerSecs*1000)-elapsed);
        }
      }
      this.active = snapshot;
      const save = this.saveQueue.catch(() => {}).then(async () => {
        const summary = await this.api('/sessions/' + snapshot.id, { method: 'PUT', body: JSON.stringify(snapshot) });
        this.updateSummary(summary); dungeon.updateSaveStatus('saved');
      });
      this.saveQueue = save;
      return save.catch(error => { dungeon.updateSaveStatus('error'); this.status('Could not save this session: ' + error.message, true); throw error; });
    },
    async resume(id, questionId) {
      const loading = document.createElement('div'); loading.className = 'qw-preparation-screen';
      loading.innerHTML = `<div class="qw-preparation-content" role="status">${window.QBankWorkspace.loadingLogo()}<h2>Loading your session</h2></div>`;
      document.body.append(loading);
      try {
        await this.saveQueue.catch(() => {});
        const session = await this.api('/sessions/' + id); this.active = session;
        // Restore table structure from the source when older highlights wrapped rows/cells.
        for (const q of session.questions.filter(q => q.source && /<table\b/i.test(q.richText || ''))) {
          try {
            const data = await this.api(`/question-detail?bank=${encodeURIComponent(q.source.bank)}&qid=${q.source.questionId}`);
            const fresh = this.adapt(data.question, q.source.bank, new FormData());
            const saved = document.createElement('template'); saved.innerHTML = q.richText;
            const source = document.createElement('template'); source.innerHTML = fresh.richText;
            const originalTables = [...source.content.querySelectorAll('table')];
            saved.content.querySelectorAll('table').forEach((table, index) => {
              const original = originalTables[index]; if (!original) return;
              const shape = el => [...el.rows].map(row => [...row.cells].map(cell => `${cell.colSpan}:${cell.rowSpan}`).join(',')).join(';');
              if (shape(table) !== shape(original)) table.replaceWith(original.cloneNode(true));
            });
            q.richText = saved.innerHTML;
          } catch (error) { console.warn('Could not restore source table:', error.message); }
        }
        window.DungeonBase.open(session.questions, id);
        window.DungeonBase.state.isBlockRevealed = !!session.completed;
        if (questionId) {
          const index = session.questions.findIndex(q => q.id === questionId);
          if (index >= 0) window.DungeonBase.jumpToQuestion(index);
        }
      } catch (error) { alert('Could not open this session: ' + error.message); }
      finally { loading.remove(); }
    },
    async remove(id) {
      if (!confirm('Delete this Qnex study session? The question bank will remain available.')) return;
      try {
        await this.saveQueue.catch(() => {});
        await this.api('/sessions/' + id, { method: 'DELETE' });
        this.sessions = this.sessions.filter(s => s.id !== id); this.mergeSessionSummaries(); this.renderSessions();
      } catch (error) { alert(error.message); }
    },
    async reset(id) {
      if (!confirm('Clear the answers and restart this study session?')) return;
      try {
        await this.saveQueue.catch(() => {});
        const session = await this.api('/sessions/' + id); session.completed = false;
        for (const q of session.questions) { delete q.submittedAnswer; delete q.timerElapsed; delete q.revealed; delete q._remainingMs; delete q._blockRemainingMs; delete q._timedOut; q.crossedOutOptionIds = []; }
        this.updateSummary(await this.api('/sessions/' + id, { method: 'PUT', body: JSON.stringify(session) }));
        await this.resume(id);
      } catch (error) { alert(error.message); }
    },
    renderSessions() {
      const container = document.getElementById('mlSavedSessions'); if (!container) return;
      const icon=path=>'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="'+path+'"/></svg>';
      const workspace = window.QBankWorkspace;
      const rows = [...this.sessions].sort((a,b) => new Date(b.date || b.updatedAt) - new Date(a.date || a.updatedAt));
      container.innerHTML='<div class="qw-section-heading"><h3>All sessions</h3><button class="qw-icon" data-clear-sessions title="Clear all study sessions" aria-label="Clear all study sessions" '+(rows.length ? '' : 'disabled')+'>'+icon('m6 6 12 12M6 18 18 6')+'</button></div>'+workspace.sessionTable(rows, true);
      container.querySelectorAll('[data-resume]').forEach(button=>button.onclick=()=>this.resume(button.dataset.resume));
      container.querySelectorAll('[data-rename]').forEach(button=>button.onclick=()=>workspace.rename(this.sessions.find(s=>s.id===button.dataset.rename),()=>this.renderSessions()));
      container.querySelectorAll('[data-result]').forEach(button=>button.onclick=async()=>{
        button.disabled=true;
        try {
          const session=await this.api('/sessions/'+encodeURIComponent(button.dataset.result));
          const bank=this.banks.find(b=>b.key===session.bank) || {label:session.bank || 'Qbank'};
          workspace.results(container,bank,session,()=>this.renderSessions());
        } catch(error) { window.showToast?.(error.message,'error'); button.disabled=false; }
      });
      const remove=async(ids,button)=>{
        if(!confirm(ids.length===1 ? 'Delete this study session and its saved answers?' : 'Delete all '+ids.length+' study sessions across your question banks? Their saved answers and statistics will also be removed.'))return;
        button.disabled=true;
        try{await this.saveQueue;for(const id of ids){await this.api('/sessions/'+encodeURIComponent(id),{method:'DELETE'});this.sessions=this.sessions.filter(s=>s.id!==id);if(this.active?.id===id)this.active=null;}this.mergeSessionSummaries();this.renderSessions();window.QBankDashboard?.refreshVisible();window.showToast('Study sessions deleted.','success');}
        catch(error){this.renderSessions();window.showToast(escape('Could not delete sessions: '+error.message),'error');}
      };
      container.querySelectorAll('[data-delete-session]').forEach(button=>button.onclick=()=>remove([button.dataset.deleteSession],button));
      const clear=container.querySelector('[data-clear-sessions]');if(clear)clear.onclick=()=>remove(this.sessions.map(s=>s.id),clear);

    }
  };
  window.MedicalLibrary = Library;
  document.addEventListener('play', event=>{
    if(!event.target.matches?.('.ml-voice-notes audio, audio.ml-inline-voice')) return;
    document.querySelectorAll('.ml-voice-notes audio, audio.ml-inline-voice').forEach(audio=>{if(audio!==event.target)audio.pause();});
  },true);
  document.addEventListener('click', event => {
    const target = event.target instanceof Element ? event.target : null;
    const tableButton=target?.closest('.ml-rich-content .ml-table-open');
    if(tableButton) {
      event.preventDefault();event.stopPropagation();
      const table=tableButton.parentElement.querySelector('table');
      if(table) window.DungeonBase?.openImageViewer('', '<div class="ml-rich-content"><div class="ml-table-scroll">'+table.outerHTML+'</div></div>');
      return;
    }
    const link = target?.closest('.ml-rich-content a.ml-figure-link');
    const image = target?.closest('.ml-rich-content img, .qa-answer-explanation img');
    if (!link && !image) return;
    event.preventDefault();
    event.stopPropagation();
    const src = link?.getAttribute('href') || image?.getAttribute('src');
    if (!src || !window.DungeonBase?.openImageViewer) return;
    if (link && src.includes('/medical-library/exhibit/')) {
      const viewer = window.DungeonBase;
      viewer.openImageViewer('', '<p role="status">Loading figure…</p>');
      const requestId = viewer._exhibitRequestId;
      Library.api(src.slice(window.fileSystemService.baseUrl.length + '/medical-library'.length)).then(result => {
        if (requestId !== viewer._exhibitRequestId || !document.getElementById('dungeonImageViewer')?.classList.contains('visible')) return;
        const html = Library.renderContent({contentFormat:'medos-html',source:{bank:link.dataset.mlBank,questionId:result.qid},richExplanation:result.html}, 'explanation');
        viewer.openImageViewer('', html);
      }).catch(error => {
        if (requestId === viewer._exhibitRequestId && document.getElementById('dungeonImageViewer')?.classList.contains('visible')) viewer.openImageViewer('', `<p role="alert">${escape(error.message)}</p>`);
      });
    } else window.DungeonBase.openImageViewer(src);
  }, true);
  const showMediaError = event => {
    const media = event.target;
    if (!media?.matches?.('.ml-rich-content img, .ml-rich-content video, .ml-rich-content audio, .qa-stem img, .qa-answer-explanation img, #viewerImage') || !media.isConnected) return;
    const notice = document.createElement('span'); notice.className = 'ml-media-unavailable'; notice.setAttribute('role', 'status');
    notice.dataset.mlSrc = media.getAttribute('src') || ''; notice.dataset.mlTag = media.tagName.toLowerCase();
    const icon=document.createElement('span');icon.className='ml-media-sad';icon.setAttribute('aria-hidden','true');icon.textContent=':(';
    const message=document.createElement('span');message.className='ml-media-error-text';message.textContent='Image unavailable — the source file may be missing or damaged.';notice.append(icon,message);
    media.closest('.qa-stem-figure,.qa-explanation-preview')?.querySelector('.qa-picture-expand')?.setAttribute('hidden','');
    const retry = document.createElement('button'); retry.type = 'button'; retry.textContent = 'Retry';
    retry.onclick = () => { const src = media.getAttribute('src'); notice.replaceWith(media); media.closest('.qa-stem-figure,.qa-explanation-preview')?.querySelector('.qa-picture-expand')?.removeAttribute('hidden'); media.setAttribute('src', src); if (media.load) media.load(); };
    notice.append(retry);
    if(media.id==='viewerImage'){media.hidden=true;media.parentElement.append(notice);retry.onclick=()=>{notice.remove();media.hidden=false;media.src=notice.dataset.mlSrc;};}
    else media.replaceWith(notice);
  };
  document.addEventListener('error', showMediaError, true);
  const mediaObserver = new MutationObserver(records => {
    for (const record of records) for (const node of record.addedNodes) {
      if (node.nodeType !== Node.ELEMENT_NODE) continue;
      const images = node.matches('img') ? [node] : [...node.querySelectorAll('img')];
      images.forEach(img => { if (img.complete && !img.naturalWidth && img.getAttribute('src')) showMediaError({target:img}); });
    }
  });
  mediaObserver.observe(document.body, {childList:true, subtree:true});
})();
