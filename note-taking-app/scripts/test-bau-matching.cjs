const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),bank=require('../content/bau/bau-qbank');
(async()=>{
 const {chromium}=require('C:/Users/momen/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000}});
  await page.route('http://qnex.test/**',r=>r.fulfill({contentType:'text/html',body:'<section id="dungeonBase"><div id="dungeonMainContent"></div></section>'}));await page.goto('http://qnex.test');
  await page.addStyleTag({content:fs.readFileSync(path.join(root,'styles/bau-dungeon.css'),'utf8')});
  await page.addScriptTag({content:fs.readFileSync(path.join(root,'scripts/dungeon-base.js'),'utf8').replace('export default class DungeonBase','window.DungeonClass = class DungeonBase')});
  const fixture=bank.banks[0].questions.find(q=>q.type==='matching'&&q.topic==='Knee examination');
  await page.evaluate(q=>{
   const d=window.DungeonBase=new window.DungeonClass();
   d.el={container:document.getElementById('dungeonBase'),main:document.getElementById('dungeonMainContent')};
   d.state.questions=[{...q,source:{bank:'bau-year4'},questionType:q.type,contentFormat:'medos-html',_tutorMode:true,options:q.choices.map((text,i)=>({id:String(i+1),text,isCorrect:false}))}];
   d.state.associatedSessionId='matching-fixture';
   window.MedicalLibrary={renderContent:(q,type,opt)=>type==='option'?opt.text:type==='question'?'<div><p>'+q.stem+'</p></div>':q.explanation};
   for(const m of ['renderSidebar','pushHistoryState','stopTimer','saveQuestionsToBackend','updateQuestionTitle','renderToolbarState','updateSaveStatus'])d[m]=()=>{};
   d.showNotification=text=>window.lastNotice=text;
   d.render=()=>d.renderQuestion();d.renderQuestion();
  },fixture);
  assert.equal(await page.locator('select[data-bau-match]').count(),6);
  const lists=await page.locator('select[data-bau-match]').evaluateAll(xs=>xs.map(x=>Array.from(x.options).map(o=>o.text).join('|')));
  assert.equal(new Set(lists).size,1);
  await page.locator('[data-bau-submit]').click();
  assert.equal(await page.evaluate(()=>window.lastNotice),'Please choose an answer for each part');
  assert.equal(await page.evaluate(()=>window.DungeonBase.state.answers.size),0);
  for(let i=0;i<fixture.matching.length;i++)await page.locator(`[data-bau-match="${i}"]`).selectOption(String(fixture.matching[i].correct));
  await page.evaluate(()=>window.DungeonBase.renderQuestion());
  assert.equal(await page.locator('[data-bau-match="2"]').inputValue(),'3');
  assert.equal(await page.locator('[data-bau-match="3"]').inputValue(),'3','Repeated answer must be allowed');
  await page.locator('[data-bau-submit]').click();
  assert.equal(await page.evaluate(()=>window.DungeonBase.state.answers.values().next().value.isCorrect),true);
  assert.equal(await page.locator('select:disabled').count(),6);
  assert.equal(await page.locator('.bau-matching small').count(),6);
  assert(!(await page.locator('.bau-explanation').textContent()).includes('undefined'));
  await page.screenshot({path:path.join(root,'reports/bau-specialties/matching-quiz.png'),fullPage:true});
  await page.evaluate(()=>{const d=window.DungeonBase,q=d.state.questions[0];d.state.answers.clear();delete q.submittedAnswer;delete q.matchingDraft;q._tutorMode=false;d.renderQuestion();});
  await page.locator('[data-bau-match="0"]').selectOption('2');
  assert.equal(await page.locator('.bau-explanation').count(),0);
  assert.equal(await page.evaluate(()=>window.DungeonBase.state.questions[0].submittedAnswer.isCorrect),false);
  await page.evaluate(()=>{const d=window.DungeonBase;d.state.isBlockRevealed=true;d.renderQuestion();});
  assert.equal(await page.locator('select:disabled').count(),6);
  console.log('PASS: shared dropdowns, repeated answers, incomplete submission, draft restoration, tutor grading, exam saving and review locking.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
