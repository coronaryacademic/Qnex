(function () {
  'use strict';
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const icon = paths => `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;
  const icons = {
    score: icon('<path d="m3 6 2 2 4-4M12 6h9M3 13l2 2 4-4M12 13h9M12 20h9"/>'),
    usage: icon('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M8 13h8M8 17h8"/>'),
    tests: icon('<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>')
  };
  const Dashboard = {
    mainRevision: 0, statsRevision: 0, brandTimer: null, updateObserver: null, updateMutationObserver: null,
    withTimeout(promise, ms = 45000) {
      let timer;
      return Promise.race([promise, new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error('The question-bank service took too long to respond. Check the MedOS folder or restart Qnex.')), ms);
      })]).finally(() => clearTimeout(timer));
    },
    isTemporary(error) { return /abort|timeout|took too long|fetch|network|connect|still starting|unavailable|502|503|504/i.test(error?.name+' '+error?.message); },
    retryView(owner, valid, retry) {
      clearTimeout(owner.retryTimer);
      owner.retryCount=(owner.retryCount || 0)+1;
      const delay=Math.min(15000,2000*Math.pow(2,Math.min(owner.retryCount-1,3)));
      owner.retryTimer=setTimeout(()=>{owner.retryTimer=null;if(valid())retry();},delay);
    },
    metrics(stats) {
      const attempted = stats.correct + stats.incorrect;
      const usage = stats.totalQuestions ? Math.min(100, 100 * stats.used / stats.totalQuestions) : 0;
      return { score: attempted ? Math.round(100 * stats.correct / attempted) : 0,
        usage, usageLabel: usage > 0 && usage < 0.1 ? '<0.1' : Math.floor(usage*10)/10,
        completion: stats.created ? Math.round(100 * stats.completed / stats.created) : 0,
        averageTime: stats.used ? Math.round(stats.totalTime / stats.used) : 0 };
    },
    async context() {
      const lib = window.MedicalLibrary;
      await this.withTimeout(lib.saveQueue);
      const [profile, catalog] = await this.withTimeout(Promise.all([
        lib.api('/profile'), lib.banks.length ? Promise.resolve({ banks: lib.banks }) : lib.api('/catalog')
      ]));
      lib.banks = catalog.banks;
      lib.profile = profile;
        lib.currentBank = profile.currentBank;
        window.QBankWorkspace?.syncSidebar();
      // A saved choice always wins; first-time users see the chooser instead of
      // silently being assigned a question bank.
      let bank = lib.banks.find(item => item.key === profile.currentBank);
      if(bank?.key.startsWith('bau-'))bank={...bank,label:`BAU - ${bank.label.replace(/^BAU\s*[-:·]?\s*/i,'')}`};
      const stats = bank ? await this.withTimeout(lib.api('/statistics?bank=' + encodeURIComponent(bank.key))) : null;
      return { bank, stats, profile };
    },
    selector() {
      const lib = window.MedicalLibrary;
      const options = lib.groupBanks(lib.banks).map(group => `<optgroup label="${escape(group.label)}">${group.banks.map(bank => `<option value="${escape(bank.key)}"${bank.key === lib.currentBank ? ' selected' : ''}>${escape(bank.label)}</option>`).join('')}</optgroup>`).join('');
      return `<label class="qd-bank-label" for="qdCurrentBank">Current question bank</label><select id="qdCurrentBank"><option value=""${lib.currentBank ? '' : ' selected'} disabled>Choose a question bank</option>${options}</select>`;
    },
    card(label, percent, detail, symbol) {
      return `<article class="qd-card"><div><div class="qd-card-label">${label}</div><div class="qd-card-value"><strong>${escape(percent)}%</strong> <span>${detail}</span></div></div><span class="qd-card-icon">${icons[symbol]}</span></article>`;
    },
    async renderMain() {
      clearTimeout(this.retryTimer);
      const mount = document.getElementById('qbankMainDashboard'); if (!mount) return;
      if (this.brandTimer) { clearInterval(this.brandTimer); this.brandTimer = null; }
      this.updateObserver?.disconnect();
      this.updateMutationObserver?.disconnect();
      const revision = ++this.mainRevision;
      mount.innerHTML = window.QBankWorkspace?.loading('Loading your dashboard…') || '<p class="qd-message" role="status">Loading your question-bank dashboard…</p>';
      try {
        const { bank, stats } = await this.context();
        if (revision !== this.mainRevision) return;
        this.retryCount=0;
        const m = stats && this.metrics(stats);
        mount.innerHTML = `<header class="qd-main-header"><div class="qd-welcome"><h2>Welcome ${escape(window.QbankProfile?.read()?.username || "doctor")}</h2><span>${escape(bank?.label || 'Your study dashboard')}</span></div><div class="qd-actions"><button id="qdBrowse" class="ml-library-btn qd-icon-action" title="Browse Qbank library" aria-label="Browse Qbank library">${icon('<path d="M4 6H3v14a1 1 0 0 0 1 1h14"/><rect x="7" y="3" width="14" height="14" rx="1"/><path d="M12.1 8a1.9 1.9 0 0 1 3.8 0c0 1.3-1.9 1.5-1.9 2.8" stroke-width="1.4"/><circle cx="14" cy="13.4" r=".55" fill="currentColor" stroke="none"/>')}</button><button id="qdMedical" class="ml-library-btn qd-icon-action" title="Medical Library — Coming soon" aria-label="Medical Library">${icon('<path d="M4 6H3v14a1 1 0 0 0 1 1h14"/><rect x="7" y="3" width="14" height="14" rx="1"/><path d="M10.5 7h7M10.5 10h7M10.5 13h4.5" stroke-width="1.4"/>')}</button>${bank ? '<button id="qdPractice" class="ml-library-btn qd-icon-action" title="Create test" aria-label="Create test">'+icon('<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><path d="M12 8v8M8 12h8"/>')+'</button><button id="qdStats" class="ml-library-btn qd-icon-action" title="View Performance" aria-label="View Performance">'+icon('<path d="M5 20v-6M12 20V4M19 20V10"/>')+'</button>' : ''}</div></header>
          <p id="qdMessage" class="qd-message" role="status" hidden></p>
          ${stats ? `<div class="qd-cards">${this.card('Question Score', m.score, 'Correct', 'score')}${this.card('QBank Usage', m.usageLabel, `${stats.used.toLocaleString()} / ${stats.totalQuestions.toLocaleString()} Used`, 'usage')}${this.card('Test Count', m.completion, `${stats.completed} / ${stats.created} Completed`, 'tests')}</div>` : '<div class="ml-library-empty">Choose a bank in the sidebar to see your study activity.</div>'}`;
        if (bank) {
          const bankName = mount.querySelector('.qd-welcome > span');
          const bankLine = document.createElement('div');
          bankLine.className = 'qw-heading-title';
          bankName.replaceWith(bankLine);
          bankLine.append(bankName);
          bankLine.insertAdjacentHTML('beforeend', '<button type="button" class="qw-bank-switch" title="Change question bank" aria-label="Change question bank">'+icon('<path d="M4 7h16m-4-4 4 4-4 4M20 17H4m4-4-4 4 4 4"/>')+'</button>');
          bankLine.querySelector('button').onclick = () => window.QBankWorkspace.openBankPicker();
        }
        // Banner retained for later use; kept as an HTML comment.
        mount.insertAdjacentHTML('beforeend','<!-- <section class="qd-brand-panel" aria-label="Qnex visual rotation"><div class="qd-brand-copy"><span class="qd-brand-credit">© 2026 · Qnex X.50</span></div><div class="qd-brand-art"><img class="qd-brand-slide active" src="assets/qnex-brand/artwork-hd.png" alt="Abstract Qnex artwork" width="2048" height="1024" loading="lazy"><img class="qd-brand-slide" src="assets/qnex-brand/xray.png" alt="Chest X-ray" width="2048" height="1024" loading="lazy"><img class="qd-brand-slide" src="assets/qnex-brand/mri.png" alt="MRI scan" width="2048" height="1024" loading="lazy"></div></section> -->');
        mount.insertAdjacentHTML('beforeend','<section class="qd-update-batch" aria-labelledby="qdUpdateBatchTitle"><h3 id="qdUpdateBatchTitle">Update batch</h3></section>');
        mount.querySelector('.qd-update-batch').insertAdjacentHTML('beforeend','<p class="qd-update-current" role="status">The app is up to date!</p>');
        const recent = document.createElement('section'); recent.className='qd-recent';
        recent.innerHTML='<h3>Recent sessions</h3><div class="qd-recent-list">Loading sessions…</div>';
        mount.querySelector('.qd-update-batch').before(recent);
        recent.after(mount.querySelector('.qd-update-batch'));
        const updateList = document.createElement('div'); updateList.className = 'qd-update-list';
        updateList.setAttribute('aria-label', 'Update notes'); updateList.tabIndex = 0;
        const updateSection = mount.querySelector('.qd-update-batch');
        updateList.append(...updateSection.querySelectorAll('.qd-media-audit-notice, .qd-update-current'));
        updateSection.append(updateList);
        const sizeUpdateList = () => {
          const notes = [...updateList.children].slice(0, 3);
          updateList.style.maxHeight = notes.length ? `${notes.reduce((height, note) => height + note.getBoundingClientRect().height / (Number(localStorage.getItem('qnex-app-scale')) || 1), 0) + Math.max(0, notes.length - 1) * 10}px` : '';
        };
        this.updateObserver = new ResizeObserver(sizeUpdateList);
        this.updateObserver.observe(updateList);
        this.updateMutationObserver = new MutationObserver(sizeUpdateList);
        this.updateMutationObserver.observe(updateList, { childList: true });
        sizeUpdateList();
        window.MedicalLibrary.api('/sessions').then(sessions => {
          if (revision !== this.mainRevision || !recent.isConnected) return;
          const latest = sessions.filter(s => !bank || s.bank === bank.key).sort((a,b) => new Date(b.updatedAt || b.date)-new Date(a.updatedAt || a.date)).slice(0,3);
          const list=recent.querySelector('.qd-recent-list'); list.textContent='';
          if (!latest.length) list.innerHTML='<p class="qd-section-status">No recent sessions yet.</p>';
          latest.forEach(session => {
            const button=document.createElement('button'); button.type='button'; button.className='qd-recent-session';
            const title=document.createElement('strong'); title.textContent=session.title;
            const detail=document.createElement('small'); detail.textContent=(session.answered || 0)+' / '+session.count+' answered';
            const resume=document.createElement('span'); resume.className='qd-recent-resume'; resume.setAttribute('aria-hidden','true');
            resume.title=session.completed ? 'Review session' : 'Resume session'; resume.setAttribute('aria-label',resume.title+' — '+session.title);
            resume.innerHTML=icon('<path d="m9 5 7 7-7 7"/>');
            button.setAttribute('aria-label',resume.title+' — '+session.title);
            button.append(title,detail,resume); button.onclick=async()=>{if(button.disabled)return;button.disabled=true;try{await window.MedicalLibrary.resume(session.id);}catch(error){window.showToast?.(error.message,'error');}finally{button.disabled=false;}};
            list.append(button);
          });
        }).catch(()=>{if(recent.isConnected)recent.querySelector('.qd-recent-list').innerHTML='<p class="qd-section-status">Unable to load recent sessions.</p>';});
        /* Banner rotation retained with its commented markup.
        const brandSlides = [...mount.querySelectorAll('.qd-brand-slide')]; let brandIndex = 0;
        this.brandTimer = setInterval(() => { brandSlides[brandIndex]?.classList.remove('active'); brandIndex = (brandIndex + 1) % brandSlides.length; brandSlides[brandIndex]?.classList.add('active'); }, 7000);
        */
        document.getElementById('qdMedical').onclick = () => window.QuestionBase.switchTab('medical-reference');
        document.getElementById('qdBrowse').onclick = () => window.QuestionBase.switchTab('medical-library');
        if (bank) {
          document.getElementById('qdPractice').parentElement.append(document.getElementById('qdPractice'));
          document.getElementById('qdPractice').onclick = async () => {
            window.QuestionBase.switchTab('create-test');
          };
          document.getElementById('qdStats').onclick = () => window.QuestionBase.switchTab('statistics');

        }
      } catch (error) {
        if (revision === this.mainRevision) mount.innerHTML = `<div class="qw-feedback"><p class="qd-message qd-error" role="alert">${escape(error.message)}</p><button class="ml-library-btn qd-icon-action" id="qdRetry" title="Retry" aria-label="Retry">${icon('<path d="M20 11a8 8 0 0 0-14-5L3 9m0-6v6h6M4 13a8 8 0 0 0 14 5l3-3m0 6v-6h-6"/>')}</button></div>`;
        if(revision !== this.mainRevision)return;
        const retry = document.getElementById('qdRetry'); if (retry) retry.onclick = () => this.renderMain();
        if(this.isTemporary(error)){
          mount.querySelector('[role=alert]').textContent='Connecting to your question bank… Retrying automatically.';
          this.retryView(this,()=>revision===this.mainRevision && mount.isConnected && !!mount.closest('[data-tab-content].active'),()=>this.renderMain());
        }
      }
    },
    mainError(error) {
      const message = document.getElementById('qdMessage');
      if (message) { message.hidden=false; message.textContent = error.message; message.classList.add('qd-error'); }
    },
    async reset(bank, mount) {
      if(!mount){window.QuestionBase.switchTab('qbank-reset');return;}
      const dialog=document.createElement('section');dialog.className='qw-card qw-reset-page';
      dialog.innerHTML=`<form><label class="qw-field">Reset<select name="scope"><option value="current" ${bank ? '' : 'disabled'}>Current Qbank${bank ? ' — '+escape(bank.label) : ''}</option><option value="all">All Qbanks across the app</option></select></label><div class="qd-reset-warning"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 6v7m0 3v2"/></svg><div><strong>Warning: This action cannot be undone in Qnex.</strong><p>Resetting the QBank will clear your progress for <strong data-reset-target>${escape(bank?.label || 'all Qbanks across the app')}</strong>, including:</p><ul><li>All test history and sessions</li><li>Usage statistics (Used/Unused questions)</li><li>Performance metrics (Correct/Incorrect counts)</li><li>Omitted questions</li></ul><p>Your marked questions will also be reset.</p></div></div><label class="qw-field qd-reset-confirm">If you are sure you want to proceed, type <strong>RESET</strong> in the box below to enable the button.<input name="confirmation" placeholder="Type RESET to confirm" autocomplete="off" spellcheck="false" required></label><p role="status"></p><div class="qw-dialog-actions"><button type="button" class="ml-library-btn qd-icon-action" title="Cancel" aria-label="Cancel"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 6 12 12M6 18 18 6"/></svg></button><button class="ml-library-btn primary qd-icon-action" disabled title="Reset QBank" aria-label="Reset QBank"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 10a9 9 0 1 1 2 8M3 4v6h6"/></svg></button></div></form>`;
      mount.innerHTML=bank ? window.QBankWorkspace.heading('Reset progress',bank) : '<header class="qw-heading"><h2>Reset progress</h2></header>';if(bank)window.QBankWorkspace.wireHeading(mount);mount.append(dialog);
      const input=dialog.querySelector('input'),button=dialog.querySelector('.primary'),scope=dialog.querySelector('[name="scope"]');
      scope.value=bank ? 'current' : 'all';
      const updateScope=()=>{
        const all=scope.value==='all';
        dialog.querySelector('[data-reset-target]').textContent=all ? 'all Qbanks across the app' : bank.label;
        button.title=all ? 'Reset all Qbanks' : 'Reset current Qbank';button.setAttribute('aria-label',button.title);
        input.value='';button.disabled=true;
      };
      scope.onchange=updateScope;updateScope();input.focus();input.oninput=()=>button.disabled=input.value!=='RESET';dialog.querySelector('[type=button]').onclick=()=>window.QuestionBase.switchTab('main');
      dialog.querySelector('form').onsubmit=async event=>{
        event.preventDefault();if(input.value!=='RESET')return;button.disabled=true;scope.disabled=true;
        try{const lib=window.MedicalLibrary;await lib.saveQueue;lib.profile=await lib.api('/reset-progress',{method:'POST',body:JSON.stringify(scope.value==='all' ? {scope:'all'} : {scope:'current',bank:bank.key})});if(scope.value==='all' || lib.active?.bank===bank?.key)lib.active=null;await lib.loadSummaries();lib.renderSessions();window.showToast(scope.value==='all' ? 'All question banks reset.' : 'Current question bank reset.','success');window.QuestionBase.switchTab('main');}
        catch(error){dialog.querySelector('[role=status]').textContent=error.message;button.disabled=false;scope.disabled=false;}
      };
    },
    async renderStatistics() {
      if (window.QBankWorkspace) return window.QBankWorkspace.render('statistics');
      const revision = ++this.statsRevision;
      const panel = document.querySelector('[data-tab-content="statistics"]'); if (!panel) return;
      const dashboard = panel.querySelector('.stats-dashboard');
      const subtitle = panel.querySelector('.stats-title-group p');
      if (dashboard) { dashboard.style.visibility = 'hidden'; dashboard.setAttribute('aria-busy', 'true'); }
      if (subtitle) subtitle.textContent = 'Loading the selected question bank…';
      try {
        const { bank, stats } = await this.context();
        if (revision !== this.statsRevision) return;
        if (!stats) { if (subtitle) subtitle.textContent = 'Choose your question bank on Main to see its statistics.'; return; }
        const m = this.metrics(stats), text = (id, value) => { const el = document.getElementById(id); if (el) el.textContent = String(value); };
        if (subtitle) subtitle.textContent = `${bank.label} · Latest answer per question · Change bank or reset progress on Main`;
        const values = { 'stat-correct': stats.correct, 'stat-incorrect': stats.incorrect, 'stat-omitted': stats.omitted,
          'stat-accuracy': m.score + '%', 'stat-total-questions': stats.totalQuestions, 'stat-used-q': stats.used,
          'stat-unused-q': Math.max(0, stats.totalQuestions - stats.used), 'stat-used-pct': m.usageLabel + '%',
          'stat-total-folders': stats.created, 'stat-total-sessions': stats.completed, 'stat-suspended': stats.suspended,
          'stat-avg-time': m.averageTime + 's', barValueCorrect: stats.correct, barValueIncorrect: stats.incorrect };
        Object.entries(values).forEach(([id, value]) => text(id, value));
        for (const [id, percent] of [['donutCorrect', m.score], ['donutUsed', m.usage]]) {
          const el = document.getElementById(id); if (el) el.style.strokeDasharray = `${percent * 3.14} 314`;
        }
        const total = Math.max(1, stats.correct + stats.incorrect);
        for (const [id, count] of [['barCorrect', stats.correct], ['barIncorrect', stats.incorrect]]) {
          const el = document.getElementById(id); if (el) el.style.height = (count / total * 90) + '%';
        }
        if (dashboard) dashboard.style.visibility = '';
      } catch (error) { if (revision === this.statsRevision && subtitle) subtitle.textContent = 'Could not load statistics: ' + error.message; }
      finally { if (revision === this.statsRevision && dashboard) dashboard.removeAttribute('aria-busy'); }
    },
    refreshVisible() {
      const tab = window.QuestionBase?.state.lastActiveTab || 'main';
      if (tab === 'main') this.renderMain();
      if (tab === 'statistics') this.renderStatistics();
    }
  };
  window.QBankDashboard = Dashboard;
})();
