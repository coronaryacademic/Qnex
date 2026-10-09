const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const context={window:{},console};vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(__dirname,'dungeon-base.js'),'utf8').replace('export default class DungeonBase','class DungeonBase')+';window.Class=DungeonBase',context);
const group={id:'amboss2:1074',parentId:1074,itemIds:[1074,1075],total:2};
const questions=[1074,1075,2000].map((id,index)=>({id,caseGroup:index<2?{...group,index}:undefined}));
const engine=Object.create(context.window.Class.prototype);engine.state={questions,currentIndex:0,answers:new Map(),isBlockRevealed:false};engine.showNotification=()=>{};
assert.equal(engine.caseCanNavigate(1),false,'Cannot advance without answer');
assert.equal(engine.caseCanNavigate(2),false,'Cannot bypass case');
engine.state.answers.set(1074,{submitted:true,selectedId:'4'});
assert.equal(engine.caseFeedbackAllowed(questions[0]),false,'No feedback before final item');
assert.equal(engine.caseCanNavigate(2),false,'Cannot skip child after answering parent');
assert.equal(engine.caseCanNavigate(1),true);assert.equal(questions[0]._caseAdvanced,true);assert.equal(engine.state.answers.get(1074).locked,true);
engine.state.currentIndex=1;
assert.equal(engine.caseCanNavigate(2),false,'Need final answer before leaving case');
engine.state.answers.set(1075,{submitted:true,selectedId:'2'});
assert.equal(engine.caseFeedbackAllowed(questions[0]),true);
assert.equal(engine.caseCanNavigate(2),true);
const restored=JSON.parse(JSON.stringify(questions));engine.state.questions=restored;
assert.equal(restored[0]._caseAdvanced,true,'Lock survives saved question serialization');
engine.state.currentIndex=0;engine.state.selectedOption=null;
engine.handleSelectOption('1');assert.equal(engine.state.answers.get(1074).selectedId,'4','Advanced answer cannot change');
engine.clearAnswer();assert.equal(engine.state.answers.get(1074).selectedId,'4','Advanced answer cannot reset');
engine.state.isBlockRevealed=true;assert.equal(engine.caseCanNavigate(1),true,'Completed review can navigate freely');
console.log('PASS Qnex: ordered cases, no skipping, deferred feedback, locked answers and saved-lock resume.');

// Exercise the exact helper used by MedOS React through its installed compiler.
const ts=require('D:/MedOS/MedOS/app/node_modules/typescript');const moduleContext={exports:{}};vm.createContext(moduleContext);
vm.runInContext(ts.transpileModule(fs.readFileSync('D:/MedOS/MedOS/app/components/qbank/qbankCases.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,moduleContext);
const {navigateCase,caseFeedbackAllowed,orderedCaseUnits,caseBlocks}=moduleContext.exports;
let session={questions:questions.map(q=>({id:q.id,caseGroup:q.caseGroup})),current:0,answers:{},pendingAnswers:{0:3}};
assert.equal(navigateCase(session,1),null,'Pending answer must be submitted first');
session.answers[0]=3;assert.equal(caseFeedbackAllowed(session,0),false);assert.equal(navigateCase(session,2),null);
session=navigateCase(session,1);session.current=1;assert.equal(session.caseAdvanced[0],true);
session.answers[1]=1;assert.equal(caseFeedbackAllowed(session,0),true);assert.ok(navigateCase(session,2));
assert.deepEqual(Array.from(orderedCaseUnits([session.questions[1],session.questions[0]]).flat(),q=>q.id),[1074,1075]);
assert.equal(orderedCaseUnits([session.questions[1]]).length,0,'Incomplete groups cannot be started');
const blocks=caseBlocks([{id:1},...session.questions.slice(0,2),{id:3}],2);
assert.deepEqual(Array.from(blocks,b=>Array.from(b,q=>q.id)),[[1],[1074,1075],[3]]);
console.log('PASS MedOS: shared case flow, deferred feedback, source order and group-safe block partition.');


engine.state.questions=questions; assert.equal(engine.caseIsContiguous(questions[0]),true); engine.state.questions=[questions[0],questions[2],questions[1]]; assert.equal(engine.caseIsContiguous(questions[0]),false); engine.state.questions=[questions[1],questions[0]]; assert.equal(engine.caseIsContiguous(questions[0]),false); engine.state.questions=[questions[0]]; assert.equal(engine.caseIsContiguous(questions[0]),false); console.log('PASS: outline only for complete, adjacent cases in source order.');

engine.state.questions=questions;engine.state.currentIndex=0;engine.state.isBlockRevealed=false;engine.state.answers=new Map();questions.forEach(q=>{q.source={bank:'amboss2'};delete q._caseAdvanced;});assert.equal(engine.caseCanNavigate(1),true,'AMBOSS can skip an unanswered linked item');engine.state.answers.set(1074,{submitted:true,selectedId:'4'});assert.equal(engine.caseCanNavigate(1),true);assert.equal(questions[0]._caseAdvanced,true,'Answered item locks after advance');console.log('PASS: AMBOSS Next skips unanswered linked items and locks submitted answers.');
