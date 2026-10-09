(function () {
  'use strict';
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const labels = {articles:'Articles', systems:'Systems', subjects:'Disciplines', saved:'Saved questions'};
  const svg = path => `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;
  const icons = {plus:svg('<path d="M12 5v14M5 12h14"/>'), clock:svg('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'), close:svg('<path d="m6 6 12 12M6 18 18 6"/>'), search:svg('<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4.5 4.5"/>'), reset:svg('<path d="M3 3v5h5M3.5 8a8.5 8.5 0 1 1-.2 7"/>'), chevron:svg('<path d="m9 6 6 6-6 6"/>')};
  function classification(options) {
    const roots = new Map();
    for (const option of options) {
      const parts = option.name.split(' - ');
      if (parts.length < 2) {roots.set('leaf:' + option.id,option);continue;}
      const name = parts.shift(), key = 'group:' + name;
      if (!roots.has(key)) roots.set(key,{id:key,name,children:[]});
      roots.get(key).children.push({...option,name:parts.join(' - ')});
    }
    for (const root of roots.values()) root.children?.sort((a,b) => Number(a.id) - Number(b.id));
    return [...roots.values()].sort((a,b) => a.name.localeCompare(b.name));
  }
  const statuses = [['new','Not yet answered'], ['hint','Answered correctly using hints'], ['incorrect','Answered incorrectly'], ['correct','Answered correctly']];
  const unique = values => [...new Set(values)];
  const defaultTitle = () => 'Custom session from ' + new Intl.DateTimeFormat('en-US', {timeZone:'Asia/Amman', month:'short', day:'numeric', hour:'numeric'}).format(new Date());
  const defaults = () => ({articles:[], systems:[], subjects:[], saved:[], statuses:['new'], attempts:'latest', marked:false, images:false, count:20, questionIds:'', custom:false, idKind:'questions', testIds:'', loadedTestIds:[], title:defaultTitle(), mode:'study', more:false, timed:false, timingBasis:'question', seconds:90, minutes:30, adjustment:Number(localStorage.getItem('qnex-time-accommodation') || 0)});

  function blockTiming(draft, count, workspace) {
    return {...workspace.timing(draft,count),scope:'session',basis:draft.timingBasis,adjustment:draft.adjustment};
  }

  function parseIds(value) { return unique(String(value || '').split(',').map(id=>id.trim()).filter(id=>/^\d+$/.test(id)).map(Number)); }
  function matching(taxonomy, draft, stats, savedTests) {
    const requested = draft.idKind === 'tests' ? (draft.loadedTestIds || []) : parseIds(draft.questionIds);
    if (draft.custom === true || (draft.custom == null && String(draft.questionIds || '').trim())) {
      const available = new Set((taxonomy.items || []).map(q=>q.id));
      const selected = new Set(requested.filter(id=>available.has(id)));
      for (const group of taxonomy.caseGroups || []) if (group.some(id=>selected.has(id)) && group.every(id=>available.has(id))) group.forEach(id=>selected.add(id));
      return [...selected];
    }
    const marked = new Set(stats.markedIds || []);
    const saved = new Set(savedTests.filter(test => draft.saved.includes(test.id)).flatMap(test => test.questionIds || []));
    const ids = unique((taxonomy.items || []).filter(q => {
      const previous = stats.attemptProgress?.[q.id] || [];
      const latest = stats.ambossProgress?.[q.id] || (stats.progress?.[q.id] === 'omitted' ? 'new' : stats.progress?.[q.id]) || 'new';
      const outcomes = draft.attempts === 'all' ? (previous.length ? previous : ['new']) : [latest];
      return (!draft.statuses.length || outcomes.some(status => draft.statuses.includes(status)))
        && (!draft.marked || marked.has(q.id)) && (!draft.images || q.hasImage)
        && (!draft.subjects.length || draft.subjects.includes(String(q.subject)))
        && (!draft.systems.length || draft.systems.includes(String(q.system)))
        && (!draft.articles.length || (q.articles || []).some(id => draft.articles.includes(String(id))))
        && (!draft.saved.length || saved.has(q.id));
    }).map(q => q.id));
    const selected=new Set(ids), available=new Set((taxonomy.items||[]).map(q=>q.id));
    for(const group of taxonomy.caseGroups||[]){
      if(group.some(id=>selected.has(id)) && group.every(id=>available.has(id))) group.forEach(id=>selected.add(id));
    }
    return [...selected];
  }

  function builder(mount, {bank, stats, profile}, taxonomy, workspace) {
    const lib = window.MedicalLibrary;
    workspace.ambossDrafts ||= new Map();
    let draft = workspace.ambossDrafts.get(bank.key);
    if (!draft) { draft = defaults(); workspace.ambossDrafts.set(bank.key, draft); }
    draft.custom ??= false;draft.idKind ||= 'questions';draft.testIds ||= '';draft.loadedTestIds ||= [];
    let savedTests = [], savedError = '', savedLoading = true, busy = false, refreshSavedDialog;
    const examName = bank.label.replace(/^AMBOSS\s*[-:·]?\s*/i, '').replace(/\s*[·-]?\s*202\d\b/, '').trim().replace(/^Step /,'USMLE Step ');
    mount.classList.add('qa-create');
    const row = (key, name) => `<button type="button" class="qa-create-row" data-filter="${key}"><span class="qa-create-plus">${key === 'timer' ? icons.clock : icons.plus}</span><span>${name}</span><span class="qa-create-value" data-value="${key}">All</span></button>`;
    mount.innerHTML = `<header class="qa-create-heading"><h2>New Custom Session for <button type="button" data-exam>${esc(examName)}</button></h2></header>
      <div class="qa-create-reset"><button type="button" data-reset>${icons.reset} RESET</button></div>
      <form class="qa-create-form">
        <div class="qa-create-grid"><section class="qa-create-card"><h3>Set session topics</h3>
          <div class="qa-create-type" role="group" aria-label="Test selection mode"><button type="button" data-selection="standard">Standard</button><button type="button" data-selection="custom">Custom</button></div>
          <div class="qa-standard-topics"><div class="qa-create-search"><label for="qaFilterSearch">FILTER SEARCH</label><div>${icons.search}<input id="qaFilterSearch" type="search" placeholder="E.g., articles, systems, disciplines" autocomplete="off"></div><div class="qa-create-search-results" hidden></div></div>
          ${row('exams','Exams')}${Object.entries(labels).map(([key,name]) => row(key,name)).join('')}</div>
          <div class="qa-create-ids" hidden><div class="qa-id-kind" role="group" aria-label="Custom ID type"><button type="button" data-id-kind="questions">Question IDs</button><button type="button" data-id-kind="tests">Saved test IDs</button></div>
            <div data-id-panel="questions"><label for="qaQuestionIds">QUESTION IDS</label><input id="qaQuestionIds" type="text" inputmode="numeric" placeholder="E.g., 1074, 1075" value="${esc(draft.questionIds)}" aria-describedby="qaIdsHelp"><small id="qaIdsHelp">Separate IDs with commas. Linked items are included together in order.</small></div>
            <div data-id-panel="tests" hidden><label for="qaTestIds">SAVED TEST IDS</label><div class="qa-test-id-row"><input id="qaTestIds" type="text" placeholder="Paste saved test IDs, separated by commas" value="${esc(draft.testIds)}"><button type="button" data-load-tests>Load</button></div><small>Use saved Qnex tests from this AMBOSS bank.</small><small class="qa-test-id-status" role="status"></small></div>
          </div>
        </section><section class="qa-create-card"><h3>Session criteria</h3>
          <div class="qa-create-title"><label for="qaSessionTitle">SESSION TITLE</label><input id="qaSessionTitle" maxlength="120" value="${esc(draft.title)}"></div>
          ${row('status','Status')}
          ${row('timer','Block timer')}
          <div class="qa-create-more-options" ${draft.more ? '' : 'hidden'}>
            <label class="qa-create-toggle">Marked questions only<input type="checkbox" name="marked" role="switch" ${draft.marked ? 'checked' : ''}><span></span></label>
            <label class="qa-create-toggle">Questions with images only<input type="checkbox" name="images" role="switch" ${draft.images ? 'checked' : ''}><span></span></label>
          </div><button type="button" class="qa-create-more" aria-expanded="${draft.more}"><span>${draft.more ? 'LESS' : 'MORE'}</span>${icons.chevron}</button>
          <div class="qa-create-count"><label for="qaQuestionCount">QUESTION COUNT</label><div><input id="qaQuestionCount" type="text" inputmode="numeric" pattern="[0-9]+" required value="${draft.count}" aria-describedby="qaAvailable"><span id="qaAvailable" aria-live="polite"></span><button type="button" class="qa-match-count" title="Set question count to all matching questions">Match selected</button></div></div>
          <p class="qa-create-mode-note"></p>
        </section></div><p class="qa-create-message" role="status"></p>
        <footer class="qa-create-footer"><span>SESSION TYPE</span><div class="qa-create-modes"><button type="button" data-mode="study">Study mode</button><button type="button" data-mode="exam">Exam mode</button></div><button type="submit" class="qa-create-start">Start</button></footer>
      </form>`;
    const form = mount.querySelector('form'), message = mount.querySelector('.qa-create-message');
    const optionsFor = key => key === 'saved' ? savedTests.map(test => ({id:test.id, name:test.title, count:(test.questionIds || []).length})) : taxonomy[key] || [];
    const update = () => {
      mount.querySelector('.qa-standard-topics').hidden=draft.custom;
      mount.querySelector('.qa-create-ids').hidden=!draft.custom;
      mount.querySelector('[data-filter=status]').hidden=draft.custom;
      mount.querySelectorAll('[data-selection]').forEach(button=>{const active=(button.dataset.selection==='custom')===draft.custom;button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));});
      mount.querySelectorAll('[data-id-kind]').forEach(button=>{const active=button.dataset.idKind===draft.idKind;button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));});
      mount.querySelectorAll('[data-id-panel]').forEach(panel=>panel.hidden=panel.dataset.idPanel!==draft.idKind);
      for (const key of Object.keys(labels)) {
        const node = mount.querySelector(`[data-value="${key}"]`);
        const selected = draft[key] || [];
        const names = optionsFor(key).filter(option => selected.includes(String(option.id))).map(option => option.name);
        node.textContent = names.length === 1 ? names[0] : names.length ? `${names.length} selected` : 'All';
        node.classList.toggle('selected', !!names.length);
      }
      const status = mount.querySelector('[data-value="status"]');
      status.textContent = draft.statuses.length === 1 ? statuses.find(([id]) => id === draft.statuses[0])[1] : draft.statuses.length ? `${draft.statuses.length} selected` : 'All';
      status.classList.toggle('selected', !!draft.statuses.length);
      const exam = mount.querySelector('[data-value="exams"]'); exam.textContent = examName; exam.classList.add('selected');
      const ids = matching(taxonomy, draft, stats, savedTests);
      const timing = blockTiming(draft,draft.count,workspace);
      mount.querySelector('[data-value=timer]').textContent = draft.timed ? (timing.valid ? workspace.duration(timing.total) + ' countdown' : 'Set duration') : 'Elapsed time';
      mount.querySelector('.qa-create-mode-note').textContent = draft.mode === 'exam' ? 'Answers stay hidden until End Block. Unanswered questions are omitted; results and analysis follow.' : 'Explanations appear after each answer. End Block saves your results and analysis.';
      mount.querySelector('#qaAvailable').textContent = '/' + ids.length.toLocaleString();
      mount.querySelector('.qa-match-count').disabled = busy || !ids.length;
      mount.querySelector('.qa-create-start').disabled = busy || !ids.length || !Number.isInteger(draft.count) || draft.count < 1 || draft.count > ids.length || draft.timed && !timing.valid;
      mount.querySelectorAll('[data-mode]').forEach(button => { button.classList.toggle('active', button.dataset.mode === draft.mode); button.setAttribute('aria-pressed', String(button.dataset.mode === draft.mode)); });
      return ids;
    };
    const openDialog = (key, initialSearch = '') => {
      if (key === 'exams') return openExams();
      if (key === 'timer') return openTimer();
      const isStatus = key === 'status';
      let selected = [...(isStatus ? draft.statuses : draft[key] || [])], attempt = draft.attempts;
      const expanded = new Set();
      const dialog = document.createElement('dialog'); dialog.className = 'qa-create-dialog' + (isStatus ? ' qa-create-status-dialog' : '');
      const title = isStatus ? 'Status' : labels[key];
      dialog.innerHTML = `<div class="qa-create-dialog-head"><h2 id="qaDialogTitle">${title}</h2><button type="button" data-close aria-label="Close">${icons.close}</button></div>
        <div class="qa-create-dialog-body">${isStatus ? '' : `<div class="qa-dialog-search">${icons.search}<input type="search" aria-label="Search ${title}" placeholder="Search..." value="${esc(initialSearch)}"></div>`}
          <div class="qa-create-selected"></div><h4>${isStatus ? 'INCLUDE QUESTIONS WITH FOLLOWING STATUS:' : 'INCLUDE QUESTIONS FROM:'}</h4><div class="qa-create-options"></div>
          ${isStatus ? `<div class="qa-create-attempts"><h4>HOW SHOULD STATUS FILTERS BE APPLIED?</h4><label><input type="radio" name="attempt" value="all" ${attempt === 'all' ? 'checked' : ''}>Based on all previous question attempts</label><label><input type="radio" name="attempt" value="latest" ${attempt === 'latest' ? 'checked' : ''}>Based on most recent question attempt</label></div>` : ''}
        </div><div class="qa-create-dialog-footer"><button type="button" data-clear>Reset</button><button type="button" class="primary" data-done>Done</button></div>`;
      dialog.setAttribute('aria-labelledby','qaDialogTitle');
      const draw = () => {
        const options = isStatus ? statuses.map(([id,name]) => ({id,name})) : optionsFor(key);
        const selection = dialog.querySelector('.qa-create-selected');
        selection.innerHTML = selected.length ? options.filter(option => selected.includes(String(option.id))).map(option => `<button type="button" data-remove="${esc(option.id)}" aria-label="Remove ${esc(option.name)}">${esc(option.name)} ${icons.close}</button>`).join('') : (isStatus ? '<span class="qa-create-pill">All</span>' : `<span class="qa-create-pill">All</span> By default, all ${title.toLowerCase()} are included unless filters are selected.`);
        selection.querySelectorAll('[data-remove]').forEach(button => button.onclick = () => {selected = selected.filter(id => id !== button.dataset.remove);draw();});
        const term = (dialog.querySelector('input[type=search]')?.value || '').toLowerCase();
        const filtered = options.filter(option => option.name.toLowerCase().includes(term));
        const list = dialog.querySelector('.qa-create-options');
        let empty = 'No matches found.';
        if (key === 'symptoms') empty = 'Symptom tags are not available in the installed AMBOSS question bank.';
        if (key === 'articles' && taxonomy.articlesAvailable === false) empty = 'The AMBOSS article library is not loaded.';
        if (key === 'saved') empty = savedLoading ? 'Loading saved questions…' : savedError || 'No Qnex tests saved for this question bank yet.';
        const optionRow = option => `<label><input type="checkbox" value="${esc(option.id)}" ${selected.includes(String(option.id)) ? 'checked' : ''}><span>${esc(option.name)}</span>${option.count == null ? '' : `<small>${option.count.toLocaleString()}</small>`}</label>`;
        if (key === 'subjects') {
          const roots = classification(options).filter(option => option.name.toLowerCase().includes(term) || option.children?.some(child => child.name.toLowerCase().includes(term)));
          list.innerHTML = roots.map(option => {
            if (!option.children) return optionRow(option);
            const children = option.name.toLowerCase().includes(term) ? option.children : option.children.filter(child => child.name.toLowerCase().includes(term));
            const ids = option.children.map(child => String(child.id));
            const count = new Set((taxonomy.items || []).filter(item => ids.includes(String(item.subject))).map(item => item.id)).size;
            return `<details class="qa-classification-group" data-group="${esc(option.id)}" ${term || expanded.has(option.id) ? 'open' : ''}><summary><span class="qa-group-chevron">${icons.chevron}</span><label><input type="checkbox" data-parent="${esc(option.id)}" ${ids.every(id => selected.includes(id)) ? 'checked' : ''}><span>${esc(option.name)}</span></label><small>${count.toLocaleString()}</small></summary><div>${children.map(optionRow).join('')}</div></details>`;
          }).join('');
          list.querySelectorAll('details').forEach(details => details.ontoggle = () => {if (details.open) expanded.add(details.dataset.group);else expanded.delete(details.dataset.group);});
          list.querySelectorAll('[data-parent]').forEach(box => {
            const ids = roots.find(option => option.id === box.dataset.parent).children.map(child => String(child.id));
            box.indeterminate = ids.some(id => selected.includes(id)) && !ids.every(id => selected.includes(id));
            box.closest('label').onclick = event => event.stopPropagation();
            box.onchange = () => {selected = box.checked ? unique([...selected,...ids]) : selected.filter(id => !ids.includes(id));draw();};
          });
        } else list.innerHTML = filtered.map(optionRow).join('');
        if (!list.innerHTML) list.innerHTML = `<p class="qa-create-empty">${esc(empty)}</p>`;
        list.querySelectorAll('input:not([data-parent])').forEach(box => box.onchange = () => {selected = box.checked ? unique([...selected,box.value]) : selected.filter(id => id !== box.value);draw();});
        dialog.querySelector('[data-clear]').disabled = !selected.length && (!isStatus || attempt === 'latest');
      };
      dialog.querySelector('[data-close]').onclick = () => dialog.close();
      dialog.querySelector('[data-clear]').onclick = () => {selected = [];attempt = 'latest';dialog.querySelector('[value=latest]')?.click();draw();};
      dialog.querySelector('[data-done]').onclick = () => { if (isStatus) {draft.statuses = selected;draft.attempts = attempt;} else draft[key] = selected;update();dialog.close();};
      dialog.querySelector('input[type=search]')?.addEventListener('input',draw);
      dialog.querySelectorAll('[name=attempt]').forEach(radio => radio.onchange = () => {attempt = radio.value;draw();});
      dialog.addEventListener('keydown', event => event.stopPropagation());
      if (key === 'saved') refreshSavedDialog = draw;
      dialog.onclose = () => {if(refreshSavedDialog === draw) refreshSavedDialog = null;dialog.remove();}; document.body.append(dialog);draw();dialog.showModal();
    };
    function openTimer() {
      const value = {...draft};
      const dialog = document.createElement('dialog');dialog.className = 'qa-create-dialog qa-create-status-dialog qa-create-timer-dialog';
      dialog.innerHTML = `<div class="qa-create-dialog-head"><h2>Block timer</h2><button type="button" data-close aria-label="Close">${icons.close}</button></div><form><div class="qa-create-dialog-body">
        <div class="qa-create-options"><label><input type="radio" name="clock" value="elapsed" ${!value.timed ? 'checked' : ''}>Elapsed time</label><label><input type="radio" name="clock" value="countdown" ${value.timed ? 'checked' : ''}>Countdown for the whole block</label></div>
        <div class="qa-timing-budget"><label>Time allowance<select name="basis"><option value="question" ${value.timingBasis === 'question' ? 'selected' : ''}>Seconds per question</option><option value="block" ${value.timingBasis === 'block' ? 'selected' : ''}>Minutes for the whole block</option></select></label><label>Duration<input name="duration" type="number" min="1" step="1" value="${value.timingBasis === 'block' ? value.minutes : value.seconds}"></label><label>Time accommodation<select name="adjustment">${[[0,'Standard'],[25,'1.25×'],[50,'1.5×'],[100,'2×']].map(([id,label]) => `<option value="${id}" ${value.adjustment === id ? 'selected' : ''}>${label}</option>`).join('')}</select></label></div>
        <p class="qa-timing-summary"></p><p class="qa-create-empty">The countdown is shared across all questions. Suspending or pausing a block preserves the remaining time. When time expires, the block ends and unanswered questions are recorded as omitted.</p><p role="alert"></p>
        </div><div class="qa-create-dialog-footer"><button type="button" data-clear>Reset</button><button type="submit" class="primary">Done</button></div></form>`;
      const controls = dialog.querySelector('form');
      const sync = () => {
        value.timed = controls.elements.clock.value === 'countdown';
        value.timingBasis = controls.elements.basis.value;
        value[value.timingBasis === 'block' ? 'minutes' : 'seconds'] = Number(controls.elements.duration.value);
        value.adjustment = Number(controls.elements.adjustment.value);
        const timing = blockTiming(value,draft.count,workspace);
        dialog.querySelector('.qa-timing-budget').hidden = !value.timed;
        dialog.querySelector('.qa-timing-summary').textContent = value.timed ? (timing.valid ? `${workspace.duration(timing.total)} for ${draft.count} questions` : 'Enter a valid duration.') : 'No time limit. Time spent on each question is saved for analysis.';
        return timing;
      };
      controls.elements.basis.onchange = () => {controls.elements.duration.value = value[controls.elements.basis.value === 'block' ? 'minutes' : 'seconds'];sync();};
      controls.addEventListener('input',sync);
      dialog.querySelector('[data-clear]').onclick = () => {value.timed = draft.mode === 'exam';value.timingBasis = 'question';value.seconds = 90;value.minutes = 30;value.adjustment = 0;controls.elements.clock.value = value.timed ? 'countdown' : 'elapsed';controls.elements.basis.value = 'question';controls.elements.duration.value = 90;controls.elements.adjustment.value = 0;sync();};
      controls.onsubmit = event => {event.preventDefault();const timing = sync();if(value.timed && !timing.valid){dialog.querySelector('[role=alert]').textContent = 'Enter a positive duration within four days.';return;}Object.assign(draft,{timed:value.timed,timingBasis:value.timingBasis,seconds:value.seconds,minutes:value.minutes,adjustment:value.adjustment});update();dialog.close();};
      dialog.querySelector('[data-close]').onclick = () => dialog.close();
      dialog.addEventListener('keydown',event=>event.stopPropagation());
      dialog.onclose = () => dialog.remove();document.body.append(dialog);sync();dialog.showModal();
    }
    function openExams() {
      const dialog = document.createElement('dialog');dialog.className = 'qa-create-dialog qa-create-status-dialog';
      dialog.innerHTML = '<div class="qa-create-dialog-head"><h2>Exams</h2><button type="button" aria-label="Close">'+icons.close+'</button></div><div class="qa-create-dialog-body"><p>Choose the AMBOSS question bank for this session.</p><div class="qa-create-options"></div><p role="status"></p></div>';
      dialog.querySelector('.qa-create-options').innerHTML = lib.banks.filter(item => item.category === 'amboss' && !item.isArchived).map(item => `<button type="button" data-bank="${esc(item.key)}" ${item.key === bank.key ? 'class="selected"' : ''}>${esc(item.label)}</button>`).join('');
      dialog.querySelectorAll('[data-bank]').forEach(button => button.onclick = async () => {
        dialog.querySelectorAll('[data-bank]').forEach(item => item.disabled = true);
        try {await lib.selectGoal(button.dataset.bank);dialog.close();workspace.render('create-test');}
        catch(error) {dialog.querySelector('[role=status]').textContent = error.message;dialog.querySelectorAll('[data-bank]').forEach(item => item.disabled = false);}
      });
      dialog.querySelector('[aria-label=Close]').onclick = () => dialog.close();
      dialog.onclose = () => dialog.remove();document.body.append(dialog);dialog.showModal();
    }
    mount.querySelectorAll('[data-filter]').forEach(button => button.onclick = () => openDialog(button.dataset.filter));
    mount.querySelector('[data-exam]').onclick = openExams;
    mount.querySelector('[data-reset]').onclick = () => {Object.assign(draft,defaults());builder(mount,{bank,stats,profile},taxonomy,workspace);};
    mount.querySelector('.qa-create-more').onclick = event => {draft.more = !draft.more;mount.querySelector('.qa-create-more-options').hidden = !draft.more;event.currentTarget.querySelector('span').textContent = draft.more ? 'LESS' : 'MORE';event.currentTarget.setAttribute('aria-expanded',String(draft.more));};
    mount.querySelectorAll('[data-mode]').forEach(button => button.onclick = () => {draft.mode = button.dataset.mode;draft.timed = draft.mode === 'exam';update();});
    const syncCustomCount=()=>{draft.count=matching(taxonomy,draft,stats,savedTests).length;mount.querySelector('#qaQuestionCount').value=draft.count;update();};
    mount.querySelectorAll('[data-selection]').forEach(button=>button.onclick=()=>{draft.custom=button.dataset.selection==='custom';message.textContent='';if(draft.custom)syncCustomCount();else{draft.count=20;mount.querySelector('#qaQuestionCount').value=20;update();}});
    mount.querySelectorAll('[data-id-kind]').forEach(button=>button.onclick=()=>{draft.idKind=button.dataset.idKind;message.textContent='';syncCustomCount();});
    mount.querySelector('#qaTestIds').oninput=event=>{draft.testIds=event.target.value;draft.loadedTestIds=[];mount.querySelector('.qa-test-id-status').textContent='';syncCustomCount();};
    mount.querySelector('[data-load-tests]').onclick=async event=>{
      const button=event.currentTarget,status=mount.querySelector('.qa-test-id-status');
      const testIds=unique(draft.testIds.split(',').map(id=>id.trim()).filter(Boolean));
      if(!testIds.length){status.textContent='Enter a saved test ID.';return;}
      button.disabled=true;status.textContent='Loading saved questions…';
      const request=draft.testIds;
      try{
        const tests=await Promise.all(testIds.map(id=>lib.api('/sessions/'+encodeURIComponent(id))));
        if(request!==draft.testIds||!form.isConnected)return;
        if(tests.some(test=>test.bank!==bank.key))throw Error('Use test IDs from '+bank.label+'.');
        draft.loadedTestIds=unique(tests.flatMap(test=>(test.questions||[]).map(q=>Number(q.source?.questionId ?? q.id))));
        if(!draft.loadedTestIds.length)throw Error('These tests contain no questions.');
        syncCustomCount();status.textContent=tests.length+' test'+(tests.length===1?'':'s')+' loaded · '+draft.count+' available questions.';
      }catch(error){draft.loadedTestIds=[];syncCustomCount();status.textContent=error.message;}finally{button.disabled=false;}
    };
    mount.querySelector('#qaQuestionIds').oninput = event => {draft.questionIds = event.target.value; if(draft.questionIds.trim()) {draft.count = matching(taxonomy,draft,stats,savedTests).length; mount.querySelector('#qaQuestionCount').value=draft.count;} update();};
    mount.querySelector('#qaSessionTitle').oninput = event => draft.title = event.target.value;
    mount.querySelector('#qaQuestionCount').oninput = event => {draft.count = /^\d+$/.test(event.target.value) ? Number(event.target.value) : NaN;update();};
    mount.querySelector('.qa-match-count').onclick = () => {
      draft.count = matching(taxonomy, draft, stats, savedTests).length;
      mount.querySelector('#qaQuestionCount').value = draft.count;
      update();
    };
    mount.querySelectorAll('input[type=checkbox]').forEach(box => box.onchange = () => {draft[box.name] = box.checked;update();});
    form.addEventListener('keydown', event => {if(event.target.matches('input')) {event.stopPropagation();if(event.key === 'Enter') event.preventDefault();}});
    const search = mount.querySelector('#qaFilterSearch'), results = mount.querySelector('.qa-create-search-results');
    search.oninput = () => {
      const term = search.value.trim().toLowerCase();results.hidden = !term;
      const matches = ['articles','systems','subjects'].flatMap(key => optionsFor(key).filter(option => option.name.toLowerCase().includes(term)).slice(0,8).map(option => ({key,...option})));
      results.innerHTML = matches.map(option => `<button type="button" data-key="${option.key}">${esc(option.name)}<small>${labels[option.key]}</small></button>`).join('') || '<p>No matches found.</p>';
      results.querySelectorAll('button').forEach(button => button.onclick = () => openDialog(button.dataset.key, search.value));
    };
    lib.api('/sessions').then(tests => { if (!form.isConnected) return;savedTests = tests.filter(test => test.bank === bank.key);savedLoading = false;update();refreshSavedDialog?.(); }).catch(error => {savedLoading = false;savedError = error.message;refreshSavedDialog?.();});
    form.onsubmit = async event => {
      event.preventDefault();if(busy)return;
      const tokens=String(draft.questionIds||'').split(',').map(id=>id.trim());
      if(draft.custom && draft.idKind==='questions' && draft.questionIds?.trim() && tokens.some(id=>!/^\d+$/.test(id))) {message.textContent='Enter numeric question IDs separated by commas.';return;}
      const missing=(draft.custom && draft.idKind==='questions' ? parseIds(draft.questionIds) : []).filter(id=>!(taxonomy.items||[]).some(q=>q.id===id));
      if(missing.length){message.textContent='Unavailable question IDs: '+missing.join(', ')+'.';return;}
      const ids = update();if(!ids.length || !Number.isInteger(draft.count) || draft.count < 1 || draft.count > ids.length) {message.textContent = 'Enter a question count between 1 and ' + ids.length + '.';return;}
      busy = true;update();message.textContent = 'Preparing your questions…';
      let preparation;
      try {
        preparation = document.createElement('div');preparation.className = 'qw-preparation-screen';preparation.setAttribute('role','status');
        preparation.innerHTML = `<div class="qw-preparation-content">${workspace.loadingLogo()}<h2>Preparing your questions</h2><p>${esc(bank.label)} · ${draft.count} questions</p></div>`;document.body.append(preparation);
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        const result = await lib.api('/questions',{method:'POST',body:JSON.stringify({bank:bank.key,ids,count:draft.count})});
        if (!result.questions.length) throw Error('No supported questions match these filters.');
        const exam = draft.mode === 'exam', options = new Map([['mode',exam ? 'exam' : 'tutor'],['timer',draft.timed ? 'down' : 'up']]);
        const questions = result.questions.map(q => ({...lib.adapt(q,bank.key,options),starred:(stats.markedIds || []).includes(q.id)}));
        const timing = blockTiming(draft,questions.length,workspace);
        if (draft.timed && !timing.valid) throw Error('Set a valid block time allowance.');
        questions.forEach((q,i) => {q._timerScope = draft.timed ? 'session' : 'question';q._timerSecs = draft.timed ? timing.total : 0;q._budgetSeconds = timing.allocations[i];});
        const session = {id:'medos-' + window.QnexCompat.uuid(),library:true,bank:bank.key,generation:profile.generations[bank.key] || 0,title:draft.title.trim() || defaultTitle(),date:new Date().toISOString(),questions,completed:false,settings:{builder:'amboss',filters:JSON.parse(JSON.stringify(draft)),pools:[...draft.statuses],custom:draft.custom,timing:draft.timed ? timing : null}};
        lib.updateSummary(await lib.api('/sessions/' + session.id,{method:'PUT',body:JSON.stringify(session)}));lib.active = session;
        window.DungeonBase.open(questions,session.id);document.getElementById('dungeonLoadingScreen')?.classList.add('hidden');message.textContent = '';
      } catch(error) {message.textContent = error.message;}
      finally {preparation?.remove();busy = false;update();}
    };
    update();
  }
  window.QnexTestBuilders = {...window.QnexTestBuilders,amboss:builder};
  window.AmbossTestBuilder = {matching,classification,blockTiming,parseIds};
})();
