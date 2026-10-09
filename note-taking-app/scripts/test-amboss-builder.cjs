const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const context = {window:{},Intl,Date};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'amboss-test-builder.js'),'utf8'),context);
const match = (...args) => Array.from(context.window.AmbossTestBuilder.matching(...args));
const groups = context.window.AmbossTestBuilder.classification([
  {id:60,name:'Surgery - Abdominal surgery'}, {id:59,name:'Surgery - General surgery'},
  {id:24,name:'Internal medicine - Cardiology and angiology'}, {id:3,name:'Anatomy'}
]);
const surgery = groups.find(group => group.name === 'Surgery');
assert.deepEqual(Array.from(surgery.children,child=>child.id),[59,60]);
assert.equal(surgery.children[0].name,'General surgery');
assert.equal(groups.find(group=>group.name === 'Anatomy').children,undefined);
const taxonomy = {items:[
  {id:1,subject:10,system:20,articles:[100],hasImage:true},
  {id:1,subject:11,system:20,articles:[100],hasImage:true},
  {id:2,subject:10,system:21,articles:[101],hasImage:false},
  {id:3,subject:11,system:20,articles:[100,101],hasImage:true},
  {id:4,subject:11,system:20,articles:[],hasImage:false}
]};
const draft = {articles:[],subjects:[],systems:[],saved:[],statuses:[],attempts:'latest',marked:false,images:false};
const stats = {progress:{1:'correct',2:'incorrect',3:'correct'},ambossProgress:{1:'correct',2:'incorrect',3:'hint'},attemptProgress:{1:['incorrect','correct'],2:['incorrect'],3:['hint']},markedIds:[3]};
const saved = [{id:'test',questionIds:[1,4]}];
assert.deepEqual(match(taxonomy,draft,stats,saved),[1,2,3,4]);
assert.deepEqual(match(taxonomy,{...draft,articles:['100'],subjects:['11'],systems:['20']},stats,saved),[1,3]);
assert.deepEqual(match(taxonomy,{...draft,statuses:['new']},stats,saved),[4]);
assert.deepEqual(match(taxonomy,{...draft,statuses:['hint']},stats,saved),[3]);
assert.deepEqual(match(taxonomy,{...draft,statuses:['incorrect']},stats,saved),[2]);
assert.deepEqual(match(taxonomy,{...draft,statuses:['incorrect'],attempts:'all'},stats,saved),[1,2]);
assert.deepEqual(match(taxonomy,{...draft,images:true,marked:true},stats,saved),[3]);
assert.deepEqual(match(taxonomy,{...draft,saved:['test']},stats,saved),[1,4]);
assert.deepEqual(match(taxonomy,{...draft,saved:['missing']},stats,saved),[]);
const {bankStatistics,MedosReader} = require('../server/medical-library');
const question = (id,correct,hint=false) => ({source:{questionId:id},submittedAnswer:{submitted:true,selectedId:1,isCorrect:correct},_ambossHintUsed:hint});
const sessions = [
  {bank:'amboss1',questions:[question(1,false),question(2,true,true)],date:'2026-10-01'},
  {bank:'amboss1',questions:[question(1,true)],date:'2026-10-02'}
];
const computed = bankStatistics(sessions,'amboss1',10);
assert.equal(computed.progress[1],'correct');
assert.equal(computed.ambossProgress[2],'hint');
assert.deepEqual(computed.attemptProgress[1],['incorrect','correct']);
console.log('PASS: article/taxonomy intersection, unique counts, statuses, attempt history, marks, images, saved tests.');
if(process.argv.includes('--live')) (async () => {
  const reader = new MedosReader('D:\\MedOS\\MedOS');
  try {
    const catalog = await reader.request({action:'catalog'});
    for(const bank of catalog.banks.filter(bank => bank.category === 'amboss' && !bank.isArchived)) {
      const start = Date.now();
      const filters = await reader.request({action:'filters',bank:bank.key});
      assert(filters.amboss && filters.items.length && filters.articles.length);
      const article = filters.articles.find(article => article.count >= 3);
      const ids = match(filters,{...draft,articles:[String(article.id)]},{},[]);
      assert.equal(ids.length,article.count);
      const result = await reader.request({action:'questions',bank:bank.key,ids,count:3});
      assert.equal(result.questions.length,3);
      assert(result.questions.every(question => ids.includes(question.id)));
      console.log(JSON.stringify({bank:bank.key,questions:new Set(filters.items.map(item=>item.id)).size,articles:filters.articles.length,article:article.name,matching:ids.length,generated:result.questions.length,seconds:((Date.now()-start)/1000).toFixed(1)}));
    }
  } finally {reader.close();}
})().catch(error => {console.error(error);process.exitCode = 1;});

assert.deepEqual(match({...taxonomy,caseGroups:[[1,2]]},{...draft,questionIds:'2, 2',statuses:['new']},stats,saved),[2,1]);
assert.deepEqual(match(taxonomy,{...draft,questionIds:'999'},stats,saved),[]);
assert.deepEqual(Array.from(context.window.AmbossTestBuilder.parseIds('1074, 1075,1074')),[1074,1075]);
console.log('PASS: comma-separated IDs, deduplication, unavailable IDs and whole-case expansion.');

assert.deepEqual(match(taxonomy,{...draft,custom:false,questionIds:'2'},stats,saved),[1,2,3,4]);
assert.deepEqual(match(taxonomy,{...draft,custom:true,questionIds:''},stats,saved),[]);
assert.deepEqual(match({...taxonomy,caseGroups:[[1,2]]},{...draft,custom:true,idKind:'tests',loadedTestIds:[2]},stats,saved),[2,1]);
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
for(const block of html.matchAll(/<script\s+type="module">([\s\S]*?)<\/script>/g))assert.equal(require('D:/MedOS/MedOS/app/node_modules/typescript').createSourceFile('inline.mjs',block[1],99,true,1).parseDiagnostics.length,0,'Inline module must parse');
console.log('PASS: Standard ignores custom IDs; Custom saved-test IDs expand cases; inline modules parse.');
