"""Build the portable BAU JavaScript bank from explicitly curated source records.

Raw extraction is not clinical approval. Only curated items enter active questions.
Original banks/IDs are preserved. Figures are cropped without printed answers.
"""
import base64, csv, hashlib, html, json, re, shutil, random
from collections import Counter
from pathlib import Path
import pdfplumber

ROOT=Path(__file__).resolve().parents[1]
WORK=ROOT/'reports'/'bau-specialties'
CONTENT=ROOT/'content'/'bau'
if (ROOT/'reports/bau-expansion/base-bank.json').exists():
    raise SystemExit('An expanded BAU bank is present. Use scripts/build-bau-expansion.py to preserve fifth-year content and question IDs.')
BACKUP=WORK/'original-banks.json'
if not BACKUP.exists(): shutil.copy2(CONTENT/'banks.json',BACKUP)
data=json.loads(BACKUP.read_text(encoding='utf-8'))
bank=data['banks'][0]
source={int(p.stem.split('-')[1]):json.loads(p.read_text(encoding='utf-8')) for p in WORK.glob('source-[0-9][0-9][0-9].json')}
with (WORK/'curated.tsv').open(encoding='utf-8',newline='') as f: records=list(csv.DictReader(f,delimiter='\t'))
matching=json.loads((WORK/'matching.json').read_text(encoding='utf-8'))
# Keep the source's shared list as one matching question rather than four MCQs.
records=[r for r in records if not (r['source']=='6' and r['original'].startswith('7.') and r['page']=='39')]
records+=matching

def clean(value):
    value=re.sub(r'\s+',' ',value.replace('NOT SURE','').replace('Yaqeen Batch','').strip()).strip()
    replacements={'Racoon eye':'Raccoon eyes','racoon eye':'raccoon eyes','Wernick’s':'Wernicke’s','Von Hippel Lindua':'von Hippel–Lindau disease','Microdiscetomy':'Microdiscectomy','glascow coma':'Glasgow Coma','Notocord':'Notochord','Neuromylitis':'Neuromyelitis','sever headache':'severe headache','Alchol withdrawal':'Alcohol withdrawal','Mri lumbosacral':'MRI lumbosacral','Xray lumbar':'X-ray lumbar','Lumber puncture':'Lumbar puncture','Meningiomyelocele':'Myelomeningocele','chiari two':'Chiari II','Chiari two':'Chiari II','scitica':'sciatica','gentle man':'man','Cyto-albuminic dissociation':'albuminocytologic dissociation'}
    for old,new in replacements.items():value=value.replace(old,new)
    return value

# The 53-question Yaqeen paper: preserve its supplied choices, with explicit
# editorial overrides where there was ambiguity, an error, or an omitted context.
doc=source[54]
text='\n'.join(p['text'] for p in doc['pages'][26:34])
text=re.sub(r'Group B Neuro[^\n]*','',text)
starts=list(re.finditer(r'(?m)^\s*(\d{1,2})\.\s+',text))
raw={int(m[1]):text[m.end():starts[i+1].start() if i+1<len(starts) else len(text)] for i,m in enumerate(starts)}
review=list(csv.DictReader((WORK/'neuro-final-review.tsv').open(encoding='utf-8'),delimiter='\t'))
assert len(raw)==len(review)==53
overrides={
  1: {'choices':{2:'D-penicillamine is a copper-chelating treatment option'}},
  2: {'stem':'A patient has an ischemic stroke associated with atrial fibrillation. Among the medications listed, which is appropriate for long-term cardioembolic stroke prevention when anticoagulation can safely start?'},
  3: {'stem':'A 60-year-old has a disabling ischemic stroke beginning 45 minutes ago. BP is 150/95 mmHg, glucose is normal, CT excludes hemorrhage, and eligibility assessment finds no contraindication to IV thrombolysis. Among the listed choices, what is the best next treatment?'},
  14:{'stem':'Which headache presentation is least concerning for a secondary cause?','choices':{0:'A long-standing unchanged pattern without red flags'}},
  15:{'choices':{3:'Protect exposed neural tissue and reduce infection and CSF-leak risk'}},
  22:{'stem':'Which lesion is least typically associated with ring enhancement on contrast brain imaging?'},
  24:{'stem':'Which statement can be true of an epidural hematoma at the cranial vertex?','choices':{0:'It routinely spreads across the coronal and lambdoid sutures',3:'It may cross the midline at the vertex'}},
  29:{'stem':'A patient has low back pain, right sciatica, and significant progressive foot weakness. Which investigation best evaluates a compressive root lesion?'},
  30:{'stem':'In an appropriately selected patient requiring surgery for a symptomatic lumbar disc herniation, which procedure directly removes the herniated disc material?'},
  31:{'stem':'For a resectable diffuse glioma near primary motor cortex, which surgical strategy aims to maximize treatment while preserving function?'},
  32:{'stem':'A stable 9-year-old has progressive headache, vomiting, and truncal ataxia. Which imaging test best characterizes a suspected posterior fossa tumor?'},
  33:{'stem':'After a severe traumatic head injury, which listed step belongs to immediate stabilization while the airway, breathing, and circulation are assessed?','choices':{0:'Maintain cervical spine precautions and stabilize the patient'}},
  35:{'stem':'A child has an optic pathway glioma. Which inherited disorder should be considered?'},
  36:{'stem':'Which listed intracranial hemorrhage can cause communicating hydrocephalus by impairing CSF absorption?'},
  44:{'stem':'In specialist emergency management of raised ICP with impending herniation, which of the following may be used?','choices':{1:'Appropriate sedation and airway protection',2:'Hyperosmolar therapy when indicated',3:'Brief rescue hyperventilation while definitive treatment is arranged'}},
  45:{'stem':'SAH remains strongly suspected after a negative noncontrast CT obtained more than six hours after symptom onset. Which listed investigation may help identify blood-breakdown products when safe and appropriately timed?'},
  47:{'choices':{0:'Temporal artery biopsy can support the diagnosis'}},
  49:{'choices':{3:'Chronic migraine involves at least 15 headache days/month for more than three months, with migraine features on at least 8 days/month',4:'Pain is typically moderate or severe and pulsating'}},
  51:{'choices':{3:'Imaging may show no mass lesion, although supportive signs may be present'}},
  53:{'choices':{3:'The AIDP subtype is predominantly demyelinating',4:'It is an important cause of acute generalized weakness'}}
}
for row in review:
    n=int(row['number']); block=raw[n]
    opts=list(re.finditer(r'(?m)^\s*([a-e])\.\s+',block))
    assert len(opts)==5,(n,len(opts))
    choices=[clean(block[m.end():opts[i+1].start() if i+1<len(opts) else len(block)]) for i,m in enumerate(opts)]
    if n==5: choices[-1]=re.sub(r'Group B Neuro.*','',choices[-1])
    changes=overrides.get(n,{})
    for i,value in changes.get('choices',{}).items():choices[i]=value
    original_stem=clean(block[:opts[0].start()])
    stem=changes.get('stem',original_stem)
    page=next(p['page'] for p in doc['pages'][26:34] if re.search(r'(?m)^\s*'+str(n)+r'\.\s+',p['text']))
    sid=6 if n in [15,17,18,19,21,22,24,25,27,29,30,31,32,33,34,35,36,38,39,40,41,42,43,44,45] else 5
    records.append({'source':54,'page':page,'original':str(n),'subject':sid,'topic':'Neurosurgery final review' if sid==6 else 'Neuromedicine final review','stem':stem,'choices':choices,'correct':int(row['correct']),'explanation':row['explanation'],'originalStem':original_stem,'originalChoices':[clean(block[m.end():opts[i+1].start() if i+1<len(opts) else len(block)]) for i,m in enumerate(opts)]})

refs={
 'Guillain-Barre syndrome':'https://onlinelibrary.wiley.com/doi/10.1111/ene.16073',
 'Stroke':'https://www.nice.org.uk/guidance/ng128/chapter/recommendations',
 'Headache':'https://www.nice.org.uk/guidance/cg150/chapter/recommendations',
 'Metabolic bone disease':'https://iscd.org/learn/official-positions/adult-positions/',
 'Anticoagulant reversal':'https://www.acc.org/latest-in-cardiology/ten-points-to-remember/2020/07/10/11/26/2020-acc-expert-consensus-decision-pathway-on-bleeding',
 'Malignant hyperthermia':'https://www.mhaus.org/healthcare-professionals/managing-a-crisis/',
 'Orthopedic emergencies':'https://www.aaos.org/quality/quality-programs/acute-compartment-syndrome/',
 'Bone tumors':'https://orthoinfo.aaos.org/en/diseases--conditions/bone-tumor/'
}
subjects={s['id']:s['name'] for s in bank['subjects']}
systems={(q['subject_id'],q['system']):q['system_id'] for q in bank['questions']}
next_system=max(q['system_id'] for q in bank['questions'])+1
next_id=max(q['id'] for q in bank['questions'])+1
registry_path=WORK/'specialty-id-registry.json'
registry=json.loads(registry_path.read_text(encoding='utf-8')) if registry_path.exists() else {}
if not registry and (CONTENT/'bau-qbank.js').exists():
    previous=(CONTENT/'bau-qbank.js').read_text(encoding='utf-8').split('const data=',1)[1].split(';\nif(typeof module',1)[0]
    registry={q['displayId']:q['id'] for q in json.loads(previous)['banks'][0]['questions'] if q.get('editorial')}
next_id=max([next_id-1,*registry.values()])+1
seen={}
new=[]
media_assignments={
 (19,1,'1'):0,(19,1,'3'):2,(19,2,'4'):0,(19,4,'15'):0,
 (19,5,'19'):0,(19,5,'20'):1,(19,5,'21'):2,(19,6,'23'):0,(19,6,'25'):1,
 (18,3,'21'):0,(18,4,'25'):0
}
pdfs={}; audit=[]
for row in records:
    sn=int(row['source']); page=int(row['page']); number=str(row['original']); sid=int(row['subject'])
    stem=clean(row['stem']); explanation=clean(row['explanation']); topic=row['topic']
    choices=row.get('choices') or [row['answer']]+row['distractors'].split(';')
    choices=[clean(c) for c in choices]
    typ='matching' if row.get('matching') else 'mcq'
    correct=int(row.get('correct',1)) if typ=='mcq' else 0
    if 'answer' in row:
        answer=choices[correct-1]
        random.Random(f'{sn}:{page}:{number}').shuffle(choices)
        correct=choices.index(answer)+1
    assert len(choices)>=3 and len(set(choices))==len(choices),(sn,page,number,choices)
    original=source[sn]
    src={'file':original['file'],'page':page,'endPage':page,'originalQuestionNumber':number,'batch':'Iris' if 'Iris' in original['file'] else 'Vagus' if sn==71 else 'Yaqeen' if sn==54 else 'Aorta' if sn in [6,42] else 'Collected','course':sid,'extraction':'editorially reconstructed' if 'answer' in row else 'reviewed source options'}
    signature=hashlib.sha256(json.dumps([sid,stem.casefold(),choices,typ],ensure_ascii=False).encode()).hexdigest()
    if signature in seen:
        seen[signature]['sources'].append(src);continue
    prefix={5:'NM',6:'NS',7:'ORTHO',8:'ANES'}[sid]
    display=f'{prefix}-S{sn:02}-{page}-{number}'
    if display not in registry:registry[display]=next_id;next_id+=1
    question_id=registry[display]
    key=(sid,topic)
    if key not in systems:systems[key]=next_system;next_system+=1
    q={'id':question_id,'displayId':display,'aliases':[display],'subject_id':sid,'subject':subjects[sid],
       'system_id':systems[key],'system':topic,'system_group':topic,'group':topic,'topic':topic,
       'classificationMethod':'editorially reviewed','type':typ,'stem':stem,'stem_html':'<p>'+html.escape(stem)+'</p>',
       'choices':choices,'correct':correct,'explanation':explanation,'explanation_html':'<p>'+html.escape(explanation)+'</p>',
       'sources':[src],'media':[],'explanation_media':[],
       'editorial':{'status':'reviewed','generatedDistractors':'answer' in row,'originalSourcePageText':original['pages'][page-1]['text'],'originalStem':row.get('originalStem'),'originalChoices':row.get('originalChoices'),'note':'Source recollection proofread; wording, context, and key corrected where needed. Generated choices are editorial additions, not a claim about the original exam.'}}
    if row.get('matching'):q['matching']=row['matching'];q['editorial']['generatedDistractors']=False
    for extra in row.get('alsoSources',[]):
        other=source[extra['source']];q['sources'].append({**src,'file':other['file'],'page':extra['page'],'endPage':extra['page'],'originalQuestionNumber':extra['original']})
    if topic in refs:
        q['references']=[{'title':'Clinical review reference','url':refs[topic]}]
        q['explanation_html']+=f'<p><a href="{html.escape(refs[topic])}">Clinical review reference</a></p>'
    image_index=media_assignments.get((sn,page,number))
    if image_index is not None:
        if sn not in pdfs:pdfs[sn]=pdfplumber.open(original['path'])
        pdfpage=pdfs[sn].pages[page-1]
        images=sorted(pdfpage.images,key=lambda image:(image['top'],image['x0']))
        image=images[image_index]
        bbox=(max(0,image['x0']),max(0,image['top']),min(pdfpage.width,image['x1']),min(pdfpage.height,image['bottom']))
        name=f'clinical-s{sn}-p{page}-i{image_index+1}.png'
        target=CONTENT/'media'/name
        if not target.exists():pdfpage.crop(bbox).to_image(resolution=300).save(str(target))
        asset={'name':name,'url':f'/qbank/media/{question_id}/{name}','sourcePage':page,'kind':'question figure','sourceResolution':image.get('srcsize')}
        q['media'].append(asset)
        q['stem_html']+=f'<figure><img src="{asset["url"]}" alt="Question figure"></figure>'
        audit.append({'id':display,'file':name,'source':original['file'],'page':page,'bbox':bbox,'sourceResolution':image.get('srcsize')})
    seen[signature]=q;new.append(q)
for pdf in pdfs.values():pdf.close()
registry_path.write_text(json.dumps(registry,indent=2),encoding='utf-8')
bank['questions'].extend(new)
import importlib.util
move_spec=importlib.util.spec_from_file_location('bau_subject_migrations',ROOT/'scripts'/'bau-subject-migrations.py')
migrations=importlib.util.module_from_spec(move_spec);move_spec.loader.exec_module(migrations)
migration_report=migrations.migrate(bank)
(WORK/'subject-migrations.json').write_text(json.dumps(migration_report,ensure_ascii=False,indent=2),encoding='utf-8')
taxonomy_spec=importlib.util.spec_from_file_location('bau_taxonomy',ROOT/'scripts'/'bau-taxonomy.py')
taxonomy=importlib.util.module_from_spec(taxonomy_spec);taxonomy_spec.loader.exec_module(taxonomy)
taxonomy_report=taxonomy.organize(bank['questions'])
student_spec=importlib.util.spec_from_file_location('bau_student_text',ROOT/'scripts'/'bau-student-text.py')
student=importlib.util.module_from_spec(student_spec);student_spec.loader.exec_module(student)
for q in bank['questions']:student.student_text(q)
(WORK/'taxonomy.json').write_text(json.dumps(taxonomy_report,ensure_ascii=False,indent=2),encoding='utf-8')
bank['count']=len(bank['questions'])
bank['subjects']=[{**s,'count':sum(q['subject_id']==s['id'] for q in bank['questions'])} for s in bank['subjects']]
data['schemaVersion']=2
data['contentReview']={'date':'2026-10-05','newQuestions':len(new),'matchingQuestions':sum(q['type']=='matching' for q in new),'sourceDirectory':str(Path(source[1]['path']).parent),'scope':'Neuromedicine, Neurosurgery, Orthopedics, Anesthesia','status':'Partial clinical curation; see source coverage report. Raw OCR is not approved content.'}
# The portable file contains every referenced active figure, including the old bank.
assets={}
for q in bank['questions']:
    for m in q.get('media',[])+q.get('explanation_media',[]):
        name=m['name']
        if name not in assets:assets[name]={'type':'image/png','base64':base64.b64encode((CONTENT/'media'/name).read_bytes()).decode()}
data['assets']=assets
output=CONTENT/'bau-qbank.js'
output.write_text("// Portable BAU Qbank. Questions, sources, and clinical figures in one file.\n(function(root){\n'use strict';\nconst data="+json.dumps(data,ensure_ascii=False,separators=(',',':'))+";\nif(typeof module==='object'&&module.exports)module.exports=data;\nelse root.BAU_QBANK=data;\n})(typeof globalThis!=='undefined'?globalThis:this);\n",encoding='utf-8')
(WORK/'media-audit.json').write_text(json.dumps(audit,ensure_ascii=False,indent=2),encoding='utf-8')
(WORK/'build-report.json').write_text(json.dumps({'originalQuestions':len(bank['questions'])-len(new),'addedQuestions':len(new),'totalQuestions':bank['count'],'matchingQuestions':sum(q['type']=='matching' for q in new),'assets':len(assets),'subjects':bank['subjects'],'output':str(output),'clinicalReviewComplete':False},ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'added':len(new),'total':bank['count'],'matching':sum(q['type']=='matching' for q in new),'embeddedFigures':len(assets)},indent=2))
