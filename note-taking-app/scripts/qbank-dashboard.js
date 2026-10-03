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
    mainRevision: 0, statsRevision: 0, brandTimer: null,
    withTimeout(promise, ms = 8000) {
      return Promise.race([promise, new Promise((_, reject) => setTimeout(() => reject(new Error('The question-bank service took too long to respond. Check the MedOS folder or restart Qnex.')), ms))]);
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
      const bank = lib.banks.find(item => item.key === profile.currentBank);
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
      const mount = document.getElementById('qbankMainDashboard'); if (!mount) return;
      if (this.brandTimer) { clearInterval(this.brandTimer); this.brandTimer = null; }
      const revision = ++this.mainRevision;
      mount.innerHTML = window.QBankWorkspace?.loading('Loading your dashboard…') || '<p class="qd-message" role="status">Loading your question-bank dashboard…</p>';
      try {
        const { bank, stats } = await this.context();
        if (revision !== this.mainRevision) return;
        const m = stats && this.metrics(stats);
        mount.innerHTML = `<header class="qd-main-header"><div class="qd-welcome"><h2>Welcome Mo'men</h2><span>${escape(bank?.label || 'Your study dashboard')}</span></div><div class="qd-actions"><button id="qdBrowse" class="ml-library-btn qd-icon-action" title="Browse Qbank library" aria-label="Browse Qbank library">${icon('<path d="M2 7v8a3 3 0 0 0 6 0V7M11 7l2 11 3-8 3 8 3-11"/>')}</button><button id="qdMedical" class="ml-library-btn qd-icon-action" title="Medical Library — Coming soon" aria-label="Medical Library">${icon('<path d="M12 5.5C9 3.5 5 3.5 2 5v15c3-1.5 7-1.5 10 .5 3-2 7-2 10-.5V5c-3-1.5-7-1.5-10 .5ZM12 5.5v15"/>')}</button>${bank ? '<button id="qdPractice" class="ml-library-btn primary qd-icon-action" title="Create test" aria-label="Create test">'+icon('<path d="m8 4 12 8-12 8z"/>')+'</button><button id="qdStats" class="ml-library-btn qd-icon-action" title="View Statistics" aria-label="View Statistics">'+icon('<path d="M5 20v-6M12 20V4M19 20V10"/>')+'</button>' : ''}</div></header>
          <p id="qdMessage" class="qd-message" role="status" hidden></p>
          ${stats ? `<div class="qd-cards">${this.card('Question Score', m.score, 'Correct', 'score')}${this.card('QBank Usage', m.usageLabel, `${stats.used.toLocaleString()} / ${stats.totalQuestions.toLocaleString()} Used`, 'usage')}${this.card('Test Count', m.completion, `${stats.completed} / ${stats.created} Completed`, 'tests')}</div>` : '<div class="ml-library-empty">Choose a bank in the sidebar to see your study activity.</div>'}`;
        mount.insertAdjacentHTML('beforeend','<section class="qd-brand-panel" aria-label="Qnex visual rotation"><div class="qd-brand-copy"><span class="qd-brand-credit">© 2026 · Qnex X.50</span></div><div class="qd-brand-art"><img class="qd-brand-slide active" src="assets/qnex-brand/artwork-hd.png" alt="Abstract Qnex artwork" width="2048" height="1024" loading="lazy"><img class="qd-brand-slide" src="assets/qnex-brand/xray.png" alt="Chest X-ray" width="2048" height="1024" loading="lazy"><img class="qd-brand-slide" src="assets/qnex-brand/mri.png" alt="MRI scan" width="2048" height="1024" loading="lazy"></div></section>');
        const recent = document.createElement('section'); recent.className='qd-recent';
        recent.innerHTML='<h3>Recent sessions</h3><div class="qd-recent-list">Loading sessions…</div>';
        mount.querySelector('.qd-brand-panel').before(recent);
        window.MedicalLibrary.api('/sessions').then(sessions => {
          if (revision !== this.mainRevision || !recent.isConnected) return;
          const latest = sessions.filter(s => !bank || s.bank === bank.key).sort((a,b) => new Date(b.updatedAt || b.date)-new Date(a.updatedAt || a.date)).slice(0,3);
          const list=recent.querySelector('.qd-recent-list'); list.textContent='';
          if (!latest.length) list.textContent='No recent sessions yet.';
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
        }).catch(()=>{if(recent.isConnected)recent.querySelector('.qd-recent-list').textContent='Unable to load recent sessions.';});
        const brandSlides = [...mount.querySelectorAll('.qd-brand-slide')]; let brandIndex = 0;
        this.brandTimer = setInterval(() => { brandSlides[brandIndex]?.classList.remove('active'); brandIndex = (brandIndex + 1) % brandSlides.length; brandSlides[brandIndex]?.classList.add('active'); }, 7000);
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
        if (revision === this.mainRevision) mount.innerHTML = `<p class="qd-message qd-error" role="alert">${escape(error.message)}</p><button class="ml-library-btn qd-icon-action" id="qdRetry" title="Retry" aria-label="Retry"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 7v5h-5M4 17a8 8 0 1 0 2-11"/></svg></button>`;
        const retry = document.getElementById('qdRetry'); if (retry) retry.onclick = () => this.renderMain();
      }
    },
    mainError(error) {
      const message = document.getElementById('qdMessage');
      if (message) { message.hidden=false; message.textContent = error.message; message.classList.add('qd-error'); }
    },
    async reset(bank, mount) {
      if(!mount){window.QuestionBase.switchTab('qbank-reset');return;}
      const dialog=document.createElement('section');dialog.className='qw-card qw-reset-page';
      dialog.innerHTML=`<form><div class="qd-reset-warning"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 6v7m0 3v2"/></svg><div><strong>Warning: This action cannot be undone in Qnex.</strong><p>Resetting the QBank will clear your progress for <strong>${escape(bank.label)}</strong>, including:</p><ul><li>All test history and sessions</li><li>Usage statistics (Used/Unused questions)</li><li>Performance metrics (Correct/Incorrect counts)</li><li>Omitted questions</li></ul><p>Your marked questions will also be reset.</p></div></div><label class="qw-field qd-reset-confirm">If you are sure you want to proceed, type <strong>RESET</strong> in the box below to enable the button.<input name="confirmation" placeholder="Type RESET to confirm" autocomplete="off" spellcheck="false" required></label><p role="status"></p><div class="qw-dialog-actions"><button type="button" class="ml-library-btn qd-icon-action" title="Cancel" aria-label="Cancel"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 6 12 12M6 18 18 6"/></svg></button><button class="ml-library-btn primary qd-icon-action" disabled title="Reset QBank" aria-label="Reset QBank"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 10a9 9 0 1 1 2 8M3 4v6h6"/></svg></button></div></form>`;
      mount.innerHTML=window.QBankWorkspace.heading('Reset progress',bank);window.QBankWorkspace.wireHeading(mount);mount.append(dialog);
      const input=dialog.querySelector('input'),button=dialog.querySelector('.primary');input.focus();input.oninput=()=>button.disabled=input.value!=='RESET';dialog.querySelector('[type=button]').onclick=()=>window.QuestionBase.switchTab('main');
      dialog.querySelector('form').onsubmit=async event=>{
        event.preventDefault();if(input.value!=='RESET')return;button.disabled=true;
        try{const lib=window.MedicalLibrary;await lib.saveQueue;lib.profile=await lib.api('/reset-progress',{method:'POST',body:JSON.stringify({bank:bank.key})});if(lib.active?.bank===bank.key)lib.active=null;await lib.loadSummaries();window.showToast('Question bank progress reset.','success');window.QuestionBase.switchTab('main');}
        catch(error){dialog.querySelector('[role=status]').textContent=error.message;button.disabled=false;}
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
