'use strict';
// BAU content is bundled with Qnex. Sessions and progress use the same store as
// the other banks; the connected MedOS installation is never modified.
const fs = require('node:fs');
const path = require('node:path');
const { randomInt } = require('node:crypto');
const directory = path.join(__dirname, '..', 'content', 'bau');
const filename = path.join(directory, 'bau-qbank.js');
let cached, stamp;
function data() {
  if (!fs.existsSync(filename)) return {banks:[]};
  const modified = fs.statSync(filename).mtimeMs;
  if (!cached || modified !== stamp) { delete require.cache[require.resolve(filename)]; cached=require(filename); stamp=modified; }
  return cached;
}
function catalog() { return data().banks.map(({questions,...bank}) => bank); }
function bank(key) {
  const found = data().banks.find(b => b.key === key);
  if (!found) throw new Error('BAU question bank is unavailable.');
  return found;
}
function question(q) {
  return {...q, explanation_media:q.explanation_media ?? q.media ?? [], media:q.explanation_media ? q.media : [],
    title:q.displayId + ' · ' + q.stem.slice(0,110),
    subject_names:[q.subject], system_names:[q.system], system_groups:[q.system_group],
    system_detail:q.system, quality:{valid:true}, correct:String(q.correct)};
}
function dispatch(req) {
  const info=bank(req.bank), questions=info.questions;
  if (req.action === 'filters') {
    const systems = new Map();
    questions.forEach(q => {
      const value=systems.get(q.system_id) || {id:q.system_id,name:q.system,count:0};
      value.count++; systems.set(q.system_id,value);
    });
    return {subjects:info.subjects.map(subject => ({...subject,count:questions.filter(q=>q.subject_id===subject.id).length})),
      systems:[...systems.values()].sort((a,b)=>a.name.localeCompare(b.name)),amboss:false,
      items:questions.map(q => ({id:q.id,subject:q.subject_id,system:q.system_id,group:q.system_group,
        displayId:q.displayId,aliases:q.aliases, batch:q.sources[0]?.batch}))};
  }
  if (req.action === 'question_list') return {questions:questions.map(q => ({id:q.id,
    displayId:q.displayId,aliases:q.aliases,title:q.displayId+' · '+q.stem.slice(0,110),subject:q.subject,system:q.system}))};
  if (req.action === 'questions') {
    const included=req.ids ? new Set(req.ids.map(Number)) : null;
    const excluded=new Set((req.exclude || []).map(Number));
    const matching=questions.filter(q => !excluded.has(q.id) && (!included || included.has(q.id)) &&
      (!req.subject || Number(req.subject)===q.subject_id) && (!req.system || Number(req.system)===q.system_id));
    const shuffled=[...matching];
    for(let i=shuffled.length-1;i>0;i--){const j=randomInt(i+1);[shuffled[i],shuffled[j]]=[shuffled[j],shuffled[i]];}
    const count=Math.max(1,Math.min(questions.length,Number(req.count)||10));
    return {questions:shuffled.slice(0,count).map(question),matching:matching.length,skipped:0};
  }
  const q=questions.find(q => q.id===Number(req.qid));
  if (!q) throw new Error('BAU question not found.');
  if (req.action === 'question_detail') return {question:question(q)};
  if (req.action === 'media') {
    const name=String(req.name || '');
    if (path.basename(name)!==name || /[\\/]/.test(name) || ![...(q.media||[]),...(q.explanation_media||[])].some(m=>m.name===name)) throw new Error('BAU media not found.');
    const embedded=data().assets?.[name];
    if(embedded) return {body:embedded.base64,type:embedded.type};
    const body=fs.readFileSync(path.join(directory,'media',name));
    return {body:body.toString('base64'),type:'image/png'};
  }
  throw new Error('Unsupported BAU library operation.');
}
module.exports={catalog,dispatch};
