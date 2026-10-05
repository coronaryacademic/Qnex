const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
(async()=>{
 const {chromium}=require('C:/Users/momen/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000}});
  await page.route('http://qnex.test/**',route=>route.fulfill({contentType:'text/html',body:'<html><body><section id="dungeonBase" class="dungeon-base"><div class="dungeon-main"><div class="dungeon-scroll-wrapper"><div class="dungeon-main-panel"><div id="dungeonMainContent"></div></div></div></div></section></body></html>'}));await page.goto('http://qnex.test');
  for(const file of ['style.css','dungeon-base.css','bau-dungeon.css'])await page.addStyleTag({content:fs.readFileSync(path.join(root,'styles',file),'utf8')});
  await page.addScriptTag({content:fs.readFileSync(path.join(root,'scripts/dungeon-base.js'),'utf8').replace('export default class DungeonBase','window.DungeonClass = class DungeonBase')});
  await page.evaluate(()=>{
   const D=window.DungeonBase=new window.DungeonClass();
   D.el={container:document.getElementById('dungeonBase'),main:document.getElementById('dungeonMainContent')};
   D.state.questions=Array.from({length:5},(_,i)=>({id:'q'+i,source:{bank:'bau-year4'},contentFormat:'medos-html',tags:{subject:['Internal Medicine 1']},_bauSessionTitle:'Cardiology review',_timerMode:'down',_timerScope:'session',_tutorMode:false,options:[{id:'1',text:'First option',isCorrect:true},{id:'2',text:'Second option',isCorrect:false}]}));
   D.state.associatedSessionId='fixture';
   window.MedicalLibrary={renderContent:(q,type,opt)=>type==='option'?opt.text:type==='question'?'<p>A patient presents with chest pain. What is the next step?</p>':'<p>Source explanation of the correct answer.</p>'};
   for(const method of ['renderSidebar','pushHistoryState','stopTimer','saveQuestionsToBackend','updateQuestionTitle','renderToolbarState'])D[method]=()=>{};
   D.render=()=>D.renderQuestion();D.renderQuestion();
  });
  assert.equal(await page.locator('.bau-squares button').count(),5);
  assert((await page.locator('.bau-course').textContent()).includes('Internal Medicine 1'));
  await page.waitForFunction(()=>!document.querySelector('.bau-time').hidden);
  await page.locator('[data-bau-time-toggle]').click();assert.equal(await page.locator('[data-bau-clock]').isVisible(),false);
  await page.locator('[data-bau-flag]').click();assert.equal(await page.locator('.bau-squares button.current svg').count(),1);
  await page.locator('[name=bau-answer][value="1"]').check();
  assert.equal(await page.evaluate(()=>window.DungeonBase.state.questions[0].submittedAnswer.selectedId),'1');
  await page.locator('[data-bau-next]').click();
  assert.equal(await page.locator('[data-bau-index="0"]').isDisabled(),true);
  await page.evaluate(()=>{window.DungeonBase.navPrev();window.DungeonBase.jumpToQuestion(0);});
  assert.equal(await page.evaluate(()=>window.DungeonBase.state.currentIndex),1);
  await page.evaluate(()=>{window.DungeonBase.state.questions.forEach(q=>q._bauNavigation='two-way');window.DungeonBase.renderQuestion();});
  await page.locator('[data-bau-prev]').click();assert.equal(await page.evaluate(()=>window.DungeonBase.state.currentIndex),0);
  await page.evaluate(()=>{window.DungeonBase.state.isBlockRevealed=true;window.DungeonBase.renderQuestion();});
  assert.equal(await page.locator('.bau-explanation').count(),1);
  assert.equal(await page.locator('.bau-navigation').evaluate(node=>node.getBoundingClientRect().right<=innerWidth),true,'Navigation must fit the viewport');
  await page.screenshot({path:path.join(root,'reports/bau-import/bau-dungeon.png'),fullPage:true});
  console.log('PASS: BAU layout, delayed timer, hide/show, filled flag, saved exam selection, one-way guards, two-way navigation and explanation.');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
