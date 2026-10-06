const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),d=require('../content/bau/bau-qbank');
const base=JSON.parse(fs.readFileSync(path.join(root,'reports/bau-expansion/base-bank.json'),'utf8'));
const all=d.banks.flatMap(b=>b.questions),ids=new Set(),systems=new Map();
for(const b of d.banks){
  assert.equal(b.count,b.questions.length);
  assert.equal(b.subjects.reduce((n,s)=>n+s.count,0),b.count);
  for(const q of b.questions){
    assert(!ids.has(q.id),`Duplicate id ${q.id}`);ids.add(q.id);
    const system=[q.subject_id,q.system_group,q.system].join('|');
    assert(!systems.has(q.system_id)||systems.get(q.system_id)===system,`System collision ${q.system_id}`);systems.set(q.system_id,system);
    assert(q.choices.length>=2&&(q.type==='matching'||q.choices.length<=5));
    if(q.type==='matching')q.matching.forEach(branch=>assert(branch.correct>=1&&branch.correct<=q.choices.length));
    else assert(Number.isInteger(q.correct)&&q.correct>=1&&q.correct<=q.choices.length);
    assert(q.stem&&q.sources.length);
    if(q.editorial?.fullIndependentClinicalReview===false){
      assert(q.explanation);
      assert(!/Question\s+\d+\s*[:.]|DISCLAIMER|AI.enhanced|our university answer|More than one option|Triple H therapy/i.test(q.explanation),q.displayId+' contaminated explanation');
      assert(new Set(q.choices.map(c=>c.toLowerCase())).size===q.choices.length);
    }
    for(const m of [...(q.media||[]),...(q.explanation_media||[])])assert(d.assets[m.name],`Missing figure ${m.name}`);
  }
}
const byid=new Map(all.map(q=>[q.id,q]));
for(const b of base.banks)for(const old of b.questions){
  const current=byid.get(old.id);assert(current,`Lost original ${old.id}`);
  for(const field of ['stem','choices','correct','explanation','subject_id','media','explanation_media'])assert.deepEqual(current[field],old[field],`Changed original clinical field ${old.id} ${field}`);
}
assert.equal(Object.keys(d.assets).length,Object.keys(base.assets).length);
console.log(`PASS: ${all.length} questions, ${d.banks.length} years, preserved ${base.banks[0].questions.length} original questions and ${Object.keys(d.assets).length} figures.`);
