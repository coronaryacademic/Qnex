(() => {
  'use strict';
  const key='qnex-qbank-profile-v1';
  const objectives=['UWorld · USMLE Step 1','UWorld · USMLE Step 2 CK','UWorld · USMLE Step 3','AMBOSS · Step 1','AMBOSS · Step 2 CK','Mehlman Medical','BoardVitals','MKSAP','Other'];
  const Profile={
    read(){try {const value=JSON.parse(localStorage.getItem(key));return value?.username&&value?.objective?value:null;}catch{return null;}},
    updateBank(bank){
      const saved=this.read();if(!saved||!bank)return;
      const profile={...saved,objective:bank.label,bankKey:bank.key};localStorage.setItem(key,JSON.stringify(profile));
      window.dispatchEvent(new CustomEvent('qbank-profile-changed',{detail:profile}));
    },
    async selectObjective(objective){
      if(objective==='Other')return false;
      const lib=window.MedicalLibrary;if(!lib?.api)return false;
      if(!lib.banks.length)lib.banks=(await lib.api('/catalog')).banks;
      const step=Number(objective.match(/Step (\d)/)?.[1]);
      const category=objective.startsWith('UWorld')?'uworld':objective.startsWith('AMBOSS')?'amboss':null;
      const matches=lib.banks.filter(bank=>bank.label===objective||(category&&bank.category===category&&Number(bank.step)===step));
      if(matches.length!==1)return false;
      await lib.selectGoal(matches[0].key);return true;
    },
    showLibrary(){
      const qbank=window.QuestionBase;qbank?.open();qbank?.switchTab('medical-library');
      qbank?.el?.sidebar?.classList.remove('collapsed');
      if(!matchMedia('(prefers-reduced-motion: reduce)').matches)qbank?.el?.base?.animate([{opacity:0,transform:'translateX(24px)'},{opacity:1,transform:'translateX(0)'}],{duration:350,easing:'ease-out'});
    },
    open(firstRun=false,replay=false){
      if(firstRun&&this.read()&&!replay)return;
      if(document.getElementById('qbankProfileIntro'))return;
      const saved=this.read();
      const dialog=document.createElement('dialog');dialog.id='qbankProfileIntro';dialog.className='qp-intro';
      dialog.innerHTML=`<form class="qp-form" novalidate><div class="qp-wordmark qnex-knock-logo"><span class="qnex-knock-word">Qnex</span><span class="qnex-knock-dot">.</span></div><p class="qp-eyebrow">Brought to you by the Cornary Academic Team</p><div class="qp-step-window"><div class="qp-step-track"><section class="qp-step"><h1>Let’s start with your name.</h1><p class="qp-description">Make this study space yours.</p><label>Username<input name="username" maxlength="40" placeholder="What should we call you?" autocomplete="nickname" required></label></section><section class="qp-step" inert><h1>Choose your qbank.</h1><p class="qp-description">Which question bank do you want to solve?</p><label>Qbank<select name="objective" required>${objectives.map(value=>`<option>${value}</option>`).join('')}</select></label></section></div></div><p class="qp-error" role="alert" hidden></p><div class="qp-step-actions"><button type="button" class="qp-back" hidden>Back</button><button type="submit" class="qp-next">Next</button></div><p class="qp-step-count" aria-live="polite">1 of 2</p><p class="qp-settings-note">You can change all of these choices later in Settings.</p>${firstRun?'':'<button type="button" class="qp-cancel">Cancel</button>'}</form>`;
      document.body.append(dialog);
      const form=dialog.querySelector('form'),username=form.elements.username,objective=form.elements.objective;
      // Use an anchored chooser instead of the OS-positioned iOS select popover.
      objective.hidden=true;
      const chooser=document.createElement('details');chooser.className='qp-objective-picker';
      const summary=document.createElement('summary');summary.setAttribute('aria-label','Choose your qbank');
      const options=document.createElement('div');options.className='qp-objective-options';options.setAttribute('role','group');options.setAttribute('aria-label','Question banks');
      const selectedLabel=document.createElement('span');summary.append(selectedLabel);summary.insertAdjacentHTML('beforeend','<svg class="qp-picker-chevron" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>');
      let pickerAnimation,pickerRevision=0,pickerExpanded=false;
      const setPickerOpen=expanded=>{const revision=++pickerRevision;pickerExpanded=expanded;pickerAnimation?.cancel();summary.setAttribute('aria-expanded',String(expanded));if(matchMedia('(prefers-reduced-motion: reduce)').matches){chooser.open=expanded;return;}chooser.open=true;const height=options.getBoundingClientRect().height;pickerAnimation=options.animate(expanded?[{height:'0px',opacity:0},{height:height+'px',opacity:1}]:[{height:height+'px',opacity:1},{height:'0px',opacity:0}],{duration:180,easing:'ease-out'});pickerAnimation.onfinish=()=>{if(revision===pickerRevision){chooser.open=expanded;pickerAnimation=null;}};};
      summary.onclick=event=>{event.preventDefault();setPickerOpen(!pickerExpanded);};
      const syncObjective=()=>{selectedLabel.textContent=objective.options[objective.selectedIndex]?.textContent || 'Choose your qbank';options.querySelectorAll('button').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.value===objective.value)));};
      for(const value of objectives){const button=document.createElement('button');button.type='button';button.dataset.value=value;button.textContent=value;button.onclick=()=>{objective.value=value;syncObjective();setPickerOpen(false);summary.focus();objective.dispatchEvent(new Event('change',{bubbles:true}));};options.append(button);}
      chooser.append(summary,options);objective.after(chooser);
      chooser.addEventListener('keydown',event=>{if(event.key==='Escape'&&chooser.open){event.preventDefault();event.stopPropagation();setPickerOpen(false);summary.focus();}});
      let step=0;
      const setStep=value=>{
        step=value;form.classList.toggle('qp-second-step',step===1);
        form.querySelectorAll('.qp-step').forEach((pane,index)=>pane.inert=index!==step);
        form.querySelector('.qp-back').hidden=step===0;
        form.querySelector('.qp-next').textContent=step===0?'Next':firstRun?'Get started':'Save profile';
        form.querySelector('.qp-step-count').textContent=`${step+1} of 2`;
        form.querySelector('.qp-error').hidden=true;
        (step===0?username:summary).focus({preventScroll:true});
      };
      form.querySelector('.qp-back').onclick=()=>setStep(0);
      if(saved){username.value=saved.username;objective.value=objectives.includes(saved.objective)?saved.objective:'Other';}
      syncObjective();
      objective.onchange=()=>{if(step===1&&objective.value==='Other')form.requestSubmit();};
      dialog.oncancel=event=>{if(firstRun)event.preventDefault();};
      dialog.onclose=()=>dialog.remove();
      dialog.querySelector('.qp-cancel')?.addEventListener('click',()=>dialog.close());
      form.onsubmit=async event=>{
        event.preventDefault();
        if(step===0){if(!username.value.trim()){username.setCustomValidity('Please enter your name.');username.reportValidity();username.oninput=()=>username.setCustomValidity('');return;}username.setCustomValidity('');setStep(1);return;}
        
        const profile={username:username.value.trim(),objective:objective.value};
        const error=form.querySelector('.qp-error');
        if(!profile.username||!profile.objective){error.textContent='Please enter your name and objective.';error.hidden=false;return;}
        try{localStorage.setItem(key,JSON.stringify(profile));}catch{error.textContent='Your profile could not be saved. Please try again.';error.hidden=false;return;}
        window.dispatchEvent(new CustomEvent('qbank-profile-changed',{detail:profile}));
        if(profile.objective==='Other'){
          dialog.close();
          this.showLibrary();
          return;
        }
        // Enter Qbank immediately. Bank discovery must not hold the welcome dialog open.
        dialog.close();
        this.showLibrary();
        this.selectObjective(profile.objective).catch(err=>{
          console.warn('[QbankProfile] Bank selection failed:',err);
          window.showToast?.('Your profile is saved. Choose a bank from Qbank Library.','error');
        });
      };
      dialog.showModal();username.focus();
    }
  };
  window.QbankProfile=Profile;
  window.addEventListener('qbank-profile-changed',()=>{
    window.QBankDashboard?.refreshVisible();
    window.QBankWorkspace?.syncSidebar();
    const dungeon=window.DungeonBase,q=dungeon?.state?.questions?.[dungeon.state.currentIndex];
    if(q&&dungeon.el?.container?.classList.contains('amboss-dungeon'))dungeon.renderAmbossHeader(q);
  });
  window.addEventListener('DOMContentLoaded',()=>{
    if(!Profile.read())Profile.open(true);
  });
})();
