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
      dialog.innerHTML=`<form class="qp-form" novalidate><div class="qp-wordmark">Qnex<span>.</span></div><p class="qp-eyebrow">ALL YOUR FAVORITE QBANKS</p><div class="qp-step-window"><div class="qp-step-track"><section class="qp-step"><h1>Let’s start with your name.</h1><p class="qp-description">Make this study space yours.</p><label>Username<input name="username" maxlength="40" placeholder="What should we call you?" autocomplete="nickname" required></label></section><section class="qp-step" inert><h1>Choose your qbank.</h1><p class="qp-description">Which question bank do you want to solve?</p><label>Qbank<select name="objective" required>${objectives.map(value=>`<option>${value}</option>`).join('')}</select></label></section></div></div><p class="qp-error" role="alert" hidden></p><div class="qp-step-actions"><button type="button" class="qp-back" hidden>Back</button><button type="submit" class="qp-next">Next</button></div><p class="qp-step-count" aria-live="polite">1 of 2</p>${firstRun?'':'<button type="button" class="qp-cancel">Cancel</button>'}</form>`;
      document.body.append(dialog);
      const form=dialog.querySelector('form'),username=form.elements.username,objective=form.elements.objective;
      let step=0;
      const setStep=value=>{
        step=value;form.classList.toggle('qp-second-step',step===1);
        form.querySelectorAll('.qp-step').forEach((pane,index)=>pane.inert=index!==step);
        form.querySelector('.qp-back').hidden=step===0;
        form.querySelector('.qp-next').textContent=step===0?'Next':firstRun?'Get started':'Save profile';
        form.querySelector('.qp-step-count').textContent=`${step+1} of 2`;
        form.querySelector('.qp-error').hidden=true;
        (step===0?username:objective).focus({preventScroll:true});
      };
      form.querySelector('.qp-back').onclick=()=>setStep(0);
      if(saved){username.value=saved.username;objective.value=objectives.includes(saved.objective)?saved.objective:'Other';}
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
        form.querySelector('.qp-next').disabled=true;
        let selected=false;
        try{selected=await this.selectObjective(profile.objective);}catch(err){error.textContent='Could not set the active qbank. Please try again.';error.hidden=false;form.querySelector('.qp-next').disabled=false;return;}
        if(!firstRun){dialog.close();return;}
        dialog.classList.add('qp-welcome-stage');
        form.innerHTML='<div class="qp-welcome"><span class="qp-welcome-icon" aria-hidden="true">✓</span><h1>Welcome doctor!</h1><p class="qp-welcome-name"></p><p>Your study space is ready.</p></div>';
        form.querySelector('.qp-welcome-name').textContent=profile.username;
        setTimeout(()=>{dialog.close();if(!selected)this.showLibrary();},1800);
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
    const preview='qnex-profile-preview-20261004-1';
    if(!localStorage.getItem(preview)){localStorage.setItem(preview,'shown');Profile.open(true,true);}
    else if(!Profile.read())Profile.open(true);
  });
})();
