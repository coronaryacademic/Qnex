const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const bau=require('../server/bau-library');
const {bankStatistics}=require('../server/medical-library');
const root=path.resolve(__dirname,'..');
(async()=>{
  const catalog=bau.catalog();assert.equal(catalog.length,1);assert.equal(catalog[0].key,'bau-year4');
  const bank=catalog[0], taxonomy=bau.dispatch({action:'filters',bank:bank.key});
  assert.equal(taxonomy.subjects.length,8);assert.equal(taxonomy.subjects.reduce((n,s)=>n+s.count,0),bank.count);
  assert.equal(new Set(taxonomy.items.map(q=>q.id)).size,bank.count);
  for(const subject of taxonomy.subjects.filter(s=>s.count)){
    const result=bau.dispatch({action:'questions',bank:bank.key,subject:subject.id,count:bank.count});
    assert.equal(result.matching,subject.count);assert(result.questions.every(q=>q.subject_id===subject.id));
    assert(result.questions.every(q=>q.choices.length>=2&&Number(q.correct)>0&&Number(q.correct)<=q.choices.length));
  }
  for(const system of taxonomy.systems){
    const result=bau.dispatch({action:'questions',bank:bank.key,system:system.id,count:bank.count});
    assert.equal(result.questions.length,system.count);
  }
  const context={window:{},document:{readyState:'loading',addEventListener(){}},console};
  vm.runInNewContext(fs.readFileSync(path.join(root,'scripts/qbank-workspace.js'),'utf8'),context);
  assert.equal(context.window.QBankWorkspace.validateIds(taxonomy.items,'IM-Iris-1').valid,true);
  assert.equal(context.window.QBankWorkspace.validateIds(taxonomy.items,'Iris-1').valid,false);
  const all=bau.dispatch({action:'questions',bank:bank.key,count:bank.count}).questions;
  for(const q of all.filter(q=>q.explanation_media.length))for(const media of q.explanation_media){
    const result=bau.dispatch({action:'media',bank:bank.key,qid:q.id,name:media.name});
    assert.equal(Buffer.from(result.body,'base64').subarray(1,4).toString(),'PNG');
  }
  const {chromium}=require('C:/Users/momen/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
  const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
  try{
    const page=await browser.newPage({viewport:{width:1400,height:1000}});
    await page.route('http://qnex.test/**',route=>route.fulfill({contentType:'text/html',body:'<html data-theme="dark"><body><main class="ml-library qw-page"><input id="mlBankSearch"><p id="mlStatus"></p><div id="mlBankContent"></div><div id="builder"></div></main></body></html>'}));
    await page.goto('http://qnex.test');
    for(const name of ['medical-library.js','qbank-workspace.js'])await page.addScriptTag({content:fs.readFileSync(path.join(root,'scripts',name),'utf8')});
    for(const name of ['style.css','medical-library.css','qbank-workspace.css']){const file=path.join(root,'styles',name);if(fs.existsSync(file))await page.addStyleTag({content:fs.readFileSync(file,'utf8')});}
    await page.evaluate(({bank,taxonomy,stats})=>{
      const L=window.MedicalLibrary,W=window.QBankWorkspace;
      window.QuestionBase={switchTab(){}};
      L.banks=[bank,{key:'step1',label:'Step 1',category:'uworld',step:1,count:3659}];L.renderBanks();
      const group=document.querySelector('[data-node="bau"]');
      if(group.querySelectorAll('.ml-tree-leaf').length!==3||group.querySelector('.ml-tree-subgroup'))throw Error('BAU must have three direct year leaves');
      if(group.querySelector('.ml-tree-total').textContent!=='3 banks')throw Error('Wrong BAU bank count');
      if(group.textContent.includes('subjects')||group.textContent.includes('Internal Medicine'))throw Error('Subjects leaked into library');
      if(group.open||!document.querySelector('[data-node="uworld"]').open)throw Error('Incorrect default expansion');
      group.open=true;
      W.builder(document.getElementById('builder'),{bank,stats,profile:{generations:{}}},taxonomy);
    },{bank,taxonomy,stats:bankStatistics([],bank.key,bank.count)});
    assert.equal(await page.locator('[name=bauNavigation]').getAttribute('role'),'switch');
    assert.equal(await page.locator('.qw-navigation-label').textContent(),'One way');
    await page.locator('[name=bauNavigation]').check();
    assert.equal(await page.locator('.qw-navigation-label').textContent(),'Two way');
    await page.locator('[name=bauNavigation]').uncheck();
    assert.equal(await page.locator('.qw-navigation-label').textContent(),'One way');
    await page.locator('[name=pool][value=all]').check();
    await page.locator('[name=subject][value="1"]').check();
    assert.equal(await page.locator('[name=subject]').count(),8);
    assert.equal(await page.locator('[name=subject]:disabled').count(),6);
    assert.equal(await page.locator('.qw-system:not([hidden])').count(),new Set(taxonomy.items.filter(q=>q.subject===1).map(q=>q.group)).size);
    assert.equal(await page.locator('[name=system]:disabled').evaluateAll(boxes=>boxes.every(box=>box.closest('label').hidden)),true);
    await page.locator('[data-all=system]').check();
    assert.equal(await page.locator('[name=count]').inputValue(),String(taxonomy.subjects[0].count));
    await page.locator('[name=count]').fill('11');
    await page.locator('[name=subject][value="2"]').check();
    assert.equal(await page.locator('[name=count]').inputValue(),'11','Manual count persists when filters change');
    await page.locator('#qwMatchCount').click();
    await page.locator('[data-all=system]').check();
    assert.equal(await page.locator('[name=count]').inputValue(),String(bank.count));
    await page.locator('[name=subject][value="1"]').uncheck();
    assert.equal(await page.locator('[name=count]').inputValue(),String(taxonomy.subjects[1].count));
    assert.equal(await page.locator('.qw-system:not([hidden])').count(),new Set(taxonomy.items.filter(q=>q.subject===2).map(q=>q.group)).size);
    await page.evaluate(()=>document.addEventListener('keydown',event=>event.preventDefault()));
    await page.locator('[data-mode=custom]').click();
    await page.evaluate(()=>{
      const W=window.QBankWorkspace,original=W.facets;
      window.typingFacetCalls=0;
      W.facets=function(...args){window.typingFacetCalls++;return original.apply(this,args);};
    });
    await page.locator('[name=title]').pressSequentially('Cardiology review');
    assert.equal(await page.locator('[name=title]').inputValue(),'Cardiology review');
    assert.equal(await page.evaluate(()=>window.typingFacetCalls),0,'Title typing must not recalculate filters');
    await page.locator('[name=ids]').pressSequentially('IM-Iris-1, GS-Iris-1');
    await page.locator('[name=ids]').press('Enter');
    await page.locator('[name=ids]').pressSequentially('IM-Iris-2');
    assert.equal(await page.locator('[name=ids]').inputValue(),'IM-Iris-1, GS-Iris-1\nIM-Iris-2');
    await page.locator('[name=retrieveId]').pressSequentially('test-1234');
    await page.locator('[name=retrieveId]').press('Backspace');
    assert.equal(await page.locator('[name=retrieveId]').inputValue(),'test-123');
    const beforeRetrieve=await page.evaluate(()=>window.typingFacetCalls);
    await page.locator('[name=retrieveId]').pressSequentially('45');
    assert.equal(await page.evaluate(()=>window.typingFacetCalls),beforeRetrieve,'Test-ID typing must not recalculate filters');
    await page.screenshot({path:path.join(root,'reports/bau-import/year-bank-and-builder.png'),fullPage:true});
  }finally{await browser.close();}
  console.log('PASS: three year leaves, default collapse, Create Test subjects/topics, alias ambiguity, unique IDs, complete keys and clinical media.');
})().catch(error=>{console.error(error);process.exitCode=1;});
