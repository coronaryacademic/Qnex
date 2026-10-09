const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const values=new Map(),localStorage={getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,String(value))};
const context={window:{},localStorage};vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(__dirname,'qbank-settings.js'),'utf8'),context);
const standard={adjustment:0},amboss={adjustment:0},started={settings:{timing:{total:180}}};
context.window.QnexSettings.applyAccommodation('50',{drafts:new Map([['uw',standard]]),ambossDrafts:new Map([['amboss',amboss]])});
assert.equal(standard.adjustment,50);assert.equal(amboss.adjustment,50);assert.equal(started.settings.timing.total,180);assert.equal(localStorage.getItem('qnex-time-accommodation'),'50');
assert.deepEqual(Array.from(context.window.QnexSettings.layouts.filter(l=>l[2]),l=>l[0]),['uw','amboss','bau','nbme','nbme-secondary']);
assert.deepEqual(Array.from(context.window.QnexSettings.layouts.filter(l=>!l[2]),l=>l[0]),['mehlman','abim','qnex']);
vm.runInContext(fs.readFileSync(path.join(__dirname,'dungeon-base.js'),'utf8').replace('export default class DungeonBase','class DungeonBase')+';window.Engine=DungeonBase',context);
const engine=Object.create(context.window.Engine.prototype),q={contentFormat:'medos-html',source:{bank:'amboss2'}};
assert.equal(engine.questionLayout(q),'amboss');assert.equal(engine.questionLayout({source:{bank:'bau-phc'}}),'bau');assert.equal(engine.questionLayout({source:{bank:'step2'}}),'uw');
assert.equal(engine.questionLayout({source:{bank:'nbme-step1'}}),'nbme');
for(const layout of ['uw','amboss','bau','nbme','nbme-secondary']){localStorage.setItem('qnex-dungeon-layout',layout);assert.equal(engine.questionLayout(q),layout);}
for(const unavailable of ['mehlman','abim','qnex','invalid','auto']){localStorage.setItem('qnex-dungeon-layout',unavailable);assert.equal(engine.questionLayout(q),'amboss');}
console.log('PASS: shared time preferences, available/planned layouts and source-safe layout fallback.');
