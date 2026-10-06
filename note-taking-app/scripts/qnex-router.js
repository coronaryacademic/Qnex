/* URL navigation owns the Qbank and test pages; legacy renderers remain reusable. */
(function () {
  'use strict';
  const pages={qbank:'medical-library',home:'main','recent-session':'recent-sessions','recent-sessions':'recent-sessions','create-test':'create-test',settings:'qbank-settings',statistics:'statistics',performance:'statistics',search:'bank-search',notebook:'notebook',flagged:'flagged',reset:'qbank-reset','medical-library':'medical-reference'};
  const paths=Object.fromEntries(Object.entries(pages).map(([path,tab])=>[tab,path]));
  paths['recent-sessions']='recent-session';
  const titles={qbank:'Dashboard',home:'Dashboard','recent-session':'Sessions','recent-sessions':'Sessions','create-test':'Setup',settings:'Settings',statistics:'Performance',performance:'Performance',search:'Search',notebook:'Notebook',flagged:'Flagged Questions',reset:'Reset Progress','medical-library':'Medical Library'};
  const R={
    applying:false, revision:0, current:null, returnPath:'home', maxHistoryIndex:0,
    back() { if(this.canGoBack()) history.back(); },
    canGoBack() { const previous=history.state?.qnexPrevious;return !!previous && previous!=='home'; },
    previous() { if((history.state?.qnexIndex || 0)>0) history.back(); },
    next() { if((history.state?.qnexIndex || 0)<this.maxHistoryIndex) history.forward(); },
    syncBack() {
      document.body.dataset.qnexCanBack=String(this.canGoBack());
      const index=history.state?.qnexIndex || 0;
      document.body.dataset.qnexCanForward=String(index<this.maxHistoryIndex);
      const prev=document.getElementById('qwNavPrevious'),next=document.getElementById('qwNavNext');
      if(prev)prev.disabled=index===0;if(next)next.disabled=index>=this.maxHistoryIndex;
    },
    settleRender(tab, revision=this.revision) {
      const render=()=>{if(revision!==this.revision)return;try{this.renderTab(tab);}catch(error){console.error('[QnexRouter] render failed',error);}};
      render();
      // iPad Safari can apply the hash/class transition one frame after the
      // route event. A single deferred commit prevents a valid destination
      // from being left blank when users navigate quickly or press Back.
      setTimeout(()=>{if(revision===this.revision)render();},120);
    },
    setTitle(path) { document.title='Qnex'; document.body.dataset.qnexRoute=path; },
    write(path,replace=false) {
      this.setTitle(path);
      const hash='#/qnex/'+path;
      if(location.hash!==hash) {
        const previous=location.hash.replace(/^#\/?qnex\//,'');
        const index=(history.state?.qnexIndex || 0)+(replace?0:1);
        const state={...(history.state || {}),qnexIndex:index,qnexPrevious:replace?history.state?.qnexPrevious:(previous || null)};
        history[replace?'replaceState':'pushState'](state,'',hash);
        if(!replace)this.maxHistoryIndex=index;
      }
      this.syncBack();
    },
    show(test) {
      document.body.dataset.qnexPage=test?'test':'qbank';
      const qbank=document.getElementById('questionBase'),dungeon=document.getElementById('dungeonBase');
      qbank?.classList.toggle('hidden',test);dungeon?.classList.toggle('hidden',!test);
    },
    page(tab,replace=false) {
      if(this.applying)return this.renderTab(tab);
      if(document.body.classList.contains('dungeon-open'))this.leaveTest();
      const path=paths[tab]||'qbank';
      if(window.QBankWorkspace)window.QBankWorkspace.revision++;
      this.revision++;this.current=path;this.returnPath=path;this.write(path,replace);this.show(false);
      this.settleRender(pages[path],this.revision);return;
    },
    leaveTest() {
      if(!document.body.classList.contains('dungeon-open'))return;
      this.applying=true;
      try{this.closeTest();}finally{this.applying=false;}
    },
    report(id, tab = 'analysis') {
      const path=(tab==='results'?'test-results/':'test-analysis/')+encodeURIComponent(id);
      this.write(path);return this.apply();
    },
    async apply() {
      this.syncBack();
      const revision=++this.revision;
      if(window.QBankWorkspace)window.QBankWorkspace.revision++;
      let path=location.hash.replace(/^#\/?/,'').replace(/^qnex\//,'');
      if(!path){this.page('main',true);return;}
      this.setTitle(path);
      if(/^test-(analysis|results)\//.test(path)) {
        this.current=path;this.returnPath='recent-session';
        this.leaveTest();this.show(false);this.renderTab('recent-sessions');
        if(window.QBankWorkspace)window.QBankWorkspace.revision++;
        const panel=document.querySelector('[data-tab-content="recent-sessions"]');
        if(panel)panel.innerHTML='<p role="status">Loading test results…</p>';
        try {
          const id=decodeURIComponent(path.slice(path.indexOf('/')+1));
          await window.MedicalLibrary.saveQueue.catch(()=>{});
          const session=id.startsWith('medos-')?await window.MedicalLibrary.api('/sessions/'+encodeURIComponent(id)):window.QuestionBase.state.recentSessions.find(s=>String(s.id)===id);
          if(revision!==this.revision)return;
          if(!session?.questions?.length)throw Error('This test is unavailable.');
          const bank=window.MedicalLibrary.banks.find(b=>b.key===session.bank)||{label:session.bank||'Qbank'};
          const mount=document.createElement('div');mount.className='qw-page ml-library';panel.replaceChildren(mount);
          window.QBankWorkspace.results(mount,bank,session,()=>this.page('recent-sessions'),path.startsWith('test-analysis/')?'analysis':'results');
        }catch(error){if(revision===this.revision){this.page('recent-sessions',true);window.showToast?.('Could not open results: '+error.message,'error');}}
        return;
      }
      if(path.startsWith('test/')) {
        let id;try{id=decodeURIComponent(path.slice(5));}catch{this.page('medical-library',true);return;}
        if(!id){this.page('medical-library',true);return;}
        this.current=path;
        if(document.body.classList.contains('dungeon-open')&&window.DungeonBase.state.associatedSessionId===id){this.show(true);return;}
        this.leaveTest();this.show(false);
        this.renderTab('recent-sessions');
        try {
          let session;
          if(window.MedicalLibrary.active?.id===id) session=window.MedicalLibrary.active;
          else if(id.startsWith('medos-')) {await window.MedicalLibrary.saveQueue.catch(()=>{});session=await window.MedicalLibrary.api('/sessions/'+encodeURIComponent(id));}
          else session=window.QuestionBase.state.recentSessions.find(s=>String(s.id)===id);
          if(revision!==this.revision)return;
          if(!session?.questions?.length)throw Error('This test is unavailable or has no saved questions.');
          window.MedicalLibrary.active=session.library||id.startsWith('medos-')?session:window.MedicalLibrary.active;
          this.applying=true;
          try {this.openTest(session.questions,id);window.DungeonBase.state.isBlockRevealed=!!session.completed;this.show(true);}finally{this.applying=false;}
        }catch(error){if(revision===this.revision){this.page('recent-sessions',true);window.showToast?.('Could not open test: '+error.message,'error');}}
        return;
      }
      if(!pages[path]){this.page('medical-library',true);return;}
      this.leaveTest();this.current=path;this.returnPath=path;this.show(false);this.settleRender(pages[path],revision);
    },
    init() {
      if(this.initialized||!window.DungeonBase||!window.QuestionBase)return;
      this.initialized=true;
      history.replaceState({...history.state,qnexIndex:0},'',location.href);
      let root=document.getElementById('qnexPages');
      if(!root){root=document.createElement('main');root.id='qnexPages';document.body.append(root);}
      ['questionBase','dungeonBase'].forEach(id=>{const page=document.getElementById(id);if(page)root.append(page);});
      const Q=window.QuestionBase,D=window.DungeonBase;
      this.renderTab=Q.switchTab.bind(Q);this.openTest=D.open.bind(D);this.closeTest=D.close.bind(D);
      Q.switchTab=tab=>this.page(tab);
      // Startup shows the current route without invoking the legacy Home renderer.
      Q.open=()=>{if(this.current?.startsWith('test/'))return;this.show(false);};
      D.open=(questions,id)=>{
        if(!questions?.length)throw Error('No questions are available in this test.');
        this.revision++;
        const sessionId=id||D.state.sessionId;
        const result=this.openTest(questions,sessionId);
        this.current='test/'+encodeURIComponent(sessionId);this.write(this.current);this.show(true);return result;
      };
      D.close=()=>{if(this.applying)return this.closeTest();this.leaveTest();this.page(pages[this.returnPath]||'medical-library');};
      document.querySelectorAll('#qbankTabNav [data-tab]').forEach(button=>{button.dataset.route='#/qnex/'+(paths[button.dataset.tab]||'qbank');});
      window.addEventListener('hashchange',()=>this.apply());
      this.apply();
    }
  };
  window.QnexRouter=R;
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>R.init(),{once:true});else R.init();
})();
