const fs=require('node:fs'),assert=require('node:assert/strict');
const {chromium}=require('C:/Users/momen/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
 try {
 const page=await browser.newPage({viewport:{width:1400,height:900}});
 await page.setContent('<style>:root{--border:#ddd;font-family:Arial}</style><body class="theme-light"><main class="qw-page ml-library" id="mount"></main></body>');
 await page.addStyleTag({path:require('node:path').join(__dirname,'../styles/medical-library.css')});
 await page.addStyleTag({path:require('node:path').join(__dirname,'../styles/qbank-workspace.css')});
 await page.evaluate(()=>{window.MedicalLibrary={resume:id=>window.reviewed=id};});
 let source=fs.readFileSync(require('node:path').join(__dirname,'qbank-workspace.js'),'utf8');
 source=source.replace(/if (document.readyState === 'loading')[^\n]+/, '');
 await page.addScriptTag({content:source});
 await page.evaluate(()=>{
 window.sample={id:'test-1',title:'Sample test',completed:true,questions:[true,false,true].map((correct,i)=>({id:'q'+i,source:{questionId:i},tags:{subject:[i===1?'Anatomy':'Physiology'],system:['Reproduction'],minor:['Topic']},submittedAnswer:{submitted:true,selectedId:'a',isCorrect:correct},timerElapsed:18000,answerChanges:i===1?{C2I:1}:{},_tutorMode:true}))};
 window.QBankWorkspace.results(document.querySelector('#mount'),{},sample,()=>{});
 });
 assert.equal(await page.locator('.qw-result-score').textContent(),'67%');
 assert.equal(await page.locator('tbody tr').count(),3);
 await page.selectOption('select','incorrect');assert.equal(await page.locator('tbody tr').count(),1);
 await page.click('[data-result-tab="analysis"]');
 assert.equal(await page.locator('.qw-score-donut').getAttribute('aria-label'),'2 correct, 1 incorrect, 0 omitted');
 assert.match(await page.locator('.qw-analysis-tally').nth(1).textContent(),/Correct to Incorrect1/);
 assert.equal(await page.locator('.qw-analysis-group').count(),2);
 await page.click('#qwReviewTest');assert.equal(await page.evaluate(()=>window.reviewed),'test-1');
 await page.evaluate(()=>{sample.questions.forEach(q=>q.submittedAnswer.isCorrect=false);QBankWorkspace.results(document.querySelector('#mount'),{},sample,()=>{});});
 await page.click('[data-result-tab="analysis"]');assert.equal(await page.locator('.qw-score-donut').evaluate(el=>el.style.getPropertyValue('--incorrect-end')),'100%');
 await page.screenshot({path:require('node:path').join(__dirname,'../reports/session-analysis.png')});
 await page.evaluate(()=>{delete sample.questions[0].submittedAnswer;sample.questions[1].tags={};QBankWorkspace.results(document.querySelector('#mount'),{},sample,()=>{});});
 await page.click('[data-result-tab="analysis"]');assert.match(await page.locator('.qw-score-donut').getAttribute('aria-label'),/1 omitted/);
 const html=await page.evaluate(()=>QBankWorkspace.sessionTable([{id:'test-1',date:new Date().toISOString(),title:'Test',count:3,answered:3,correct:0,completed:true}]));assert.match(html,/data-unsee="test-1"/);
 let librarySource=fs.readFileSync(require('node:path').join(__dirname,'medical-library.js'),'utf8');
 await page.addScriptTag({content:librarySource});
 const resetResult=await page.evaluate(async()=>{
  const L=MedicalLibrary;
  const old={id:'reset-1',completed:true,questions:[{submittedAnswer:{submitted:true},answerChanges:{C2I:2},timerElapsed:10,revealed:true,_timedOut:true,starred:true}]};
  window.confirm=()=>true;L.saveQueue=Promise.resolve();L.active=old;let written;
  L.api=async(path,opts)=>{if(opts){written=JSON.parse(opts.body);return {id:old.id};}return structuredClone(old);};
  L.updateSummary=()=>{};L.mergeSessionSummaries=()=>{};L.resume=()=>{throw Error('Reset should not launch test');};
  await L.reset(old.id,false);
  return {completed:written.completed,answered:!!written.questions[0].submittedAnswer,changes:!!written.questions[0].answerChanges,starred:written.questions[0].starred,active:L.active};
 });
 assert.deepEqual(resetResult,{completed:false,answered:false,changes:false,starred:true,active:null});
 console.log('PASS: 67% results, result filters, answer changes, subject/system tables, review action, 0% chart, omitted and missing tags, shared reset action.');
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
