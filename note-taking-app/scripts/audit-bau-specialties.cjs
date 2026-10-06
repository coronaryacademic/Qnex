const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),work=path.join(root,'reports/bau-specialties');
const data=require('../content/bau/bau-qbank'),original=JSON.parse(fs.readFileSync(path.join(work,'original-banks.json'),'utf8'));
const all=data.banks[0].questions,newItems=all.filter(q=>q.editorial);
assert.equal(new Set(all.map(q=>q.id)).size,all.length);
const unchangedClinicalRecord=q=>Object.fromEntries(Object.entries(q).filter(([key])=>!['explanation','explanation_html','editorialNotes','subject_id','subject','system_id','system','system_group','group','topic','classificationHistory','sourceTopic'].includes(key)));
assert.deepEqual(all.slice(0,original.banks[0].questions.length).map(unchangedClinicalRecord),original.banks[0].questions.map(unchangedClinicalRecord),'Existing IM and surgery questions, choices, and IDs must remain intact');
for(const q of newItems){
 assert(q.stem&&q.explanation&&q.sources.length);
 assert.equal(new Set(q.choices).size,q.choices.length);
 if(q.type==='matching')assert(q.matching.every(b=>b.prompt&&b.correct>=1&&b.correct<=q.choices.length));
 else assert(q.correct>=1&&q.correct<=q.choices.length);
 assert(!q.choices.some(c=>/Yaqeen Batch|Group B Neuro|NOT SURE/.test(c)));
 for(const m of q.media)assert(data.assets[m.name]);
}
const generated=newItems.filter(q=>q.editorial.generatedDistractors);
assert(new Set(generated.map(q=>q.correct)).size>=4,'Generated correct choices must not always occupy the same position');
const inventory=JSON.parse(fs.readFileSync(path.join(work,'inventory.json'),'utf8'));
const coverage=inventory.map(s=>({...s,preview:undefined,importedQuestions:newItems.filter(q=>q.sources.some(r=>r.file===s.file)).length,status:newItems.some(q=>q.sources.some(r=>r.file===s.file))?'Contains curated items; full-file coverage not certified':'No newly approved items; not evidence of full-file review'}));
fs.writeFileSync(path.join(work,'source-coverage.json'),JSON.stringify(coverage,null,2));
const report=`# BAU specialty import review\n\nThe active portable file is content/bau/bau-qbank.js. It contains ${all.length} questions and ${Object.keys(data.assets).length} embedded image assets. The original ${original.banks[0].questions.length} IM and general-surgery questions and IDs are preserved.\n\nThis batch adds ${newItems.length} questions, including ${newItems.filter(q=>q.type==='matching').length} shared-list matching questions. All matching branches use the same ordered choices, and answers can repeat. Reconstructed MCQ choices are recorded as editorial additions. Original source-page text is retained for traceability.\n\n## Coverage limitation\n\nAll ${inventory.length} PDFs were inventoried and their embedded text extracted. This is not a claim that every question in every PDF was clinically reviewed or imported. Large compilations, remaining image-dependent items, and incomplete recalls still require further review. Raw text and OCR are stored separately and never treated as approved questions. source-coverage.json records which files contributed active items.\n\n## Clinical image handling\n\nEleven new clinical figures were cropped from source PDFs at 300 dpi, inspected visually, and embedded together with existing bank figures. Crops exclude printed answer text. Rendering does not recover detail absent from the original. media-audit.json records source pages and crop bounds.\n\n## Verification\n\nData validation preserves original questions and IDs, validates keys and matching branch ranges, checks embedded assets, and checks generated choice positioning. Browser checks cover shared lists, repeated answers, incomplete submissions, draft restoration, tutor grading, exam saving, review locking, specialty selection, and existing BAU navigation. These are local component checks; they do not certify a complete live Electron session or clinical completeness.\n`;
fs.writeFileSync(path.join(work,'REVIEW.md'),report);
console.log(`PASS: ${all.length} unique questions; ${newItems.length} new records; original questions unchanged; keys, lists, references to figures, and generated choice positioning validated.`);
