"""Expand the portable bank from a frozen base, stable ids and explicit curation."""
from pathlib import Path
import json,re,html,hashlib,random,importlib.util
from collections import Counter,defaultdict
ROOT=Path(__file__).resolve().parents[1];WORK=ROOT/'reports/bau-expansion';OUT=ROOT/'content/bau/bau-qbank.js'
spec=importlib.util.spec_from_file_location('curation',ROOT/'scripts/bau-expansion-curation.py');curation=importlib.util.module_from_spec(spec);spec.loader.exec_module(curation)
data=json.loads((WORK/'base-bank.json').read_text(encoding='utf8'));bank4=data['banks'][0]
bank5={'key':'bau-year5','label':'5th year','category':'bau','year':5,'subjects':[{'id':9,'name':'Pediatrics'},{'id':10,'name':'Obstetrics & Gynecology'}],'questions':[]}
data['banks'].append(bank5)
names={s['id']:s['name'] for b in data['banks'] for s in b['subjects']}
inventory=json.loads((WORK/'inventory.json').read_text(encoding='utf8'));byhash={r.get('sha256','')[:12]:r for r in inventory if r.get('extraction')}
registryfile=WORK/'ids.json';registry=json.loads(registryfile.read_text()) if registryfile.exists() else {}
nextid=max([q['id'] for b in data['banks'] for q in b['questions']]+list(registry.values()))+1
def norm(t):return re.sub(r'[^\w]+',' ',t.casefold()).strip()
def signature(q):return (q['subject_id'],norm(q['stem']),tuple(sorted(norm(c) for c in q['choices'])))
existing={signature(q):q for b in data['banks'] for q in b['questions']}
systems={(q['subject_id'],q['system_group'],q['system']):q['system_id'] for b in data['banks'] for q in b['questions']};nextsystem=max(systems.values())+1
def classify(q):
 if q.get('topic'):
  taxonomy_spec=importlib.util.spec_from_file_location('taxonomy',ROOT/'scripts/bau-taxonomy.py');taxonomy=importlib.util.module_from_spec(taxonomy_spec);taxonomy_spec.loader.exec_module(taxonomy)
  return taxonomy.MAP.get(q['subject_id'],{}).get(q['topic'],(q.get('group',q['topic']),q['topic']))
 sid=q['subject_id'];t=q['stem']+' '+q['choices'][q['correct']-1]
 if sid==1:return 'Rheumatology & Immunology','Rheumatology'
 if sid==3:
  rules=[('History and examination','History taking',r'history|consent|social|medication|chief complaint'),('Clinical foundations','Medical terminology',r'prefix|suffix|word|term|plural|bony part'),('Communication and professionalism','Communication and ethics',r'communication|patient.doctor|listening|professional|paternal|consumer|bad news'),('Clinical foundations','Infection prevention',r'precaution|influenza|transmission'),('History and examination','General examination',r'.')]
 elif sid==6:
  rules=[('Spine','Spinal disorders and radiculopathy',r'disc|myelopathy|radicul|back pain|L4|L5|C5|C6|nerve root'),('Spine','Spinal trauma',r'Brown|thoracic|Chance|cervical.*fracture|atlanto|T10'),('Spine','Spinal tumors',r'spinal.*tumor|spinal.*tumour'),('Cranial neurosurgery','Head injury',r'epidural|subdural|concussion|skull|GCS|lucid|Cushing|head injury'),('Cranial neurosurgery','Neurovascular disorders',r'SAH|subarachnoid|aneurysm|vasospasm|cavern|AVM|hemorrhage'),('Congenital and CSF disorders','Hydrocephalus and congenital conditions',r'hydrocephal|shunt|suture|sinus tract|myelomening'),('Cranial neurosurgery','Brain tumors',r'.')]
 elif sid==9:
  rules=[('Cardiology','Congenital heart disease',r'heart defect|congenital heart|Fallot|transposition|TGA|coarctation|ductus|murmur|septal defect|cyanotic.*infant|cyanotic.*newborn'),('Endocrinology','Diabetes and metabolic emergencies',r'diabet|DKA|ketoacidosis|insulin|hypoglyc'),('Endocrinology','Growth, puberty and endocrine disorders',r'thyroid|precocious|adrenal|pubert|stature|growth delay|growth hormone|adrenarche|bone age|Turner|amenorrhea'),('Neonatology','Neonatal jaundice',r'(newborn|neonat|physiolog).*(jaundice|bilirubin)|cephalohemat|caput'),('Neonatology','Neonatal assessment and resuscitation',r'Apgar|hypoxic.isch|newborn resuscit|neonatal resuscit'),('Growth and development','Development and behaviour',r'develop|milestone|months.*age|grasp|crawl|stairs|cooing|weight gain|birth weight|autis|attention|hyperactivity|IQ|language|cognitive|cruises'),('Respiratory medicine','Respiratory disorders',r'asthma|wheez|bronchiolit|pneumoni|croup|epiglott|stridor|cystic fibrosis|clubbing|airway|bronchoscopy'),('Renal medicine','Renal and urinary disorders',r'renal|kidney|glomerul|nephrot|nephrit|urinalysis|hematuria|proteinuria|urinary|ureter|creatinine|oliguria|diuret|blood pressure|hypertens'),('Gastroenterology','Gastrointestinal and liver disorders',r'diarr|celiac|coeliac|malabsorp|constipat|stool|jaundice|bilirubin|liver|hepat|bowel|vomit|abdominal|intussus|reflux|bleed.*gastro|GI bleeding'),('Hematology and oncology','Blood disorders and malignancy',r'anemi|anaemi|hemoglobin|leukem|leukaem|lymphom|thalassem|sickle|platelet|hemophil|haemophil|coagula|neuroblast|Wilms|nephroblast|tumor lysis|G6PD|hemolys|haemolys|von Willebrand|neutrop'),('Rheumatology and immunology','Inflammatory disease and immunodeficiency',r'JIA|arthritis|Kawasaki|lupus|vasculitis|rheumat|immune|immunoglobulin|immunodefic|SCID'),('Infection and prevention','Vaccination and infectious disease',r'vaccin|immunization|infect|meningitis|organism|pathogen|fever|antibiotic|antibacterial|virus|tuberc|malaria|Brucell'),('Neurology','Pediatric neurological disorders',r'seizure|epilep|headache|dystrophy|neurolog|muscular atrophy|tuberous|hydrocephal|neuropathy|hyperreflex|breath.hold|status epileptic'),('Genetics','Genetics and congenital disorders',r'genetic|inherit|chromosom|trisom|Down syndrome|syndrome|sex.influenced'),('Nutrition','Nutrition and vitamin deficiencies',r'feeding|breast milk|vitamin|rickets|nutrit|formula|zinc|food'),('Neonatology','Neonatal disorders',r'newborn|neonat'),('General pediatrics','Clinical assessment',r'.')]
 elif sid==10:
  rules=[('Obstetrics','Early pregnancy and ectopic pregnancy',r'ectopic|molar|mole|miscarriage|pregnancy loss|abortion|trophoblast|hydatidiform|hyperemesis'),('Gynecology','Gynecological oncology',r'cancer|carcinoma|HPV|malignan|CIN|endometrial hyperplasia|ovarian tumor|ovarian tumour'),('Gynecology','Contraception',r'contracept|IUCD|IUD|implant|steriliz|sterilis|emergency pill'),('Gynecology','Menstrual disorders and reproductive endocrinology',r'menstr|amenorrhea|dysmenorr|PCOS|polycystic|hirsut|viriliz|FSH|luteal|menopause|HRT|hormone replacement|inhibin|androgen|karyotype'),('Gynecology','Infertility and endometriosis',r'infertil|conceive|IVF|endometriosis|semen|ovulation induction'),('Gynecology','Urogynecology and pelvic floor',r'urinary|incontinen|prolapse|bladder|ureter|pelvic floor'),('Obstetrics','Hypertensive disorders and maternal disease',r'preeclamps|pre.eclamps|eclamps|HELLP|hypertens|diabet|thyroid|maternal.*disease|septic shock'),('Obstetrics','Placental disease and obstetric hemorrhage',r'placent|postpartum hemorr|post.partum hemorr|abruption|previa|PPH|atony|hypotonic'),('Obstetrics','Preterm birth and membrane rupture',r'preterm|premature|PPROM|membrane|corticosteroid|tocoly'),('Obstetrics','Labor and delivery',r'labor|labour|forceps|vacuum|cesarean|caesarean|presentation|cardinal|breech|episiotomy|perineal'),('Obstetrics','Fetal assessment and multiple pregnancy',r'fetal|foetal|twin|chorionic|CTG|cardiotoco|biophysical|Doppler|fundal|ultrasound|amniotic'),('Gynecology','Pelvic infection and benign conditions',r'infect|vaginit|cervicitis|fibroid|pelvic.*disease|discharge|Bartholin'),('Obstetrics','Antenatal and postnatal care',r'.')]
 else:return 'Clinical foundations','General principles'
 for group,topic,pattern in rules:
  if re.search(pattern,t,re.I):return group,topic
held=json.loads((WORK/'extraction-held.json').read_text(encoding='utf8'));approved=[]
for q in json.loads((WORK/'candidates.json').read_text(encoding='utf8')):
 reason=curation.curate(q)
 if reason:held.append({'reason':reason,'source':q['source'],'stem':q['stem'],'token':q['token']})
 else:approved.append(q)
for i,(sid,h,p,topic,stem,answer,distractors,explanation) in enumerate(curation.AUTHORED,1):
 r=byhash[h];choices=[answer]+distractors;random.Random('bau-expansion-'+stem).shuffle(choices)
 approved.append({'subject_id':sid,'prefix':'AUTH','token':'AUTH-'+h+'-'+hashlib.sha256(stem.encode()).hexdigest()[:8],'topic':topic,'stem':stem,'choices':choices,'correct':choices.index(answer)+1,'explanation':explanation,'source':{'file':r['file'],'page':p,'endPage':p,'originalQuestionNumber':None,'batch':'Topic review'},'generated':True})
for row in curation.MATCHING:
 r=byhash[row['hash']];q={**row,'prefix':'MATCH','type':'matching','correct':1,'token':'MATCH-'+row['hash']+'-'+str(row['page']),'generated':True,'source':{'file':r['file'],'page':row['page'],'endPage':row['page'],'originalQuestionNumber':row.get('number',14),'batch':'Block A'}};approved.append(q)
by_signature=defaultdict(list)
for q in approved:by_signature[signature(q)].append(q)
conflicts={s for s,qs in by_signature.items() if len({norm(q['choices'][q['correct']-1]) for q in qs})>1}
added=[];duplicates=[]
for q in approved:
 sig=signature(q)
 if sig in conflicts:held.append({'reason':'Conflicting source keys','source':q['source'],'stem':q['stem']});continue
 old=existing.get(sig)
 if old:
  if norm(old['choices'][int(old['correct'])-1])!=norm(q['choices'][q['correct']-1]):held.append({'reason':'Key conflicts with existing bank','source':q['source'],'stem':q['stem']});continue
  src={**q['source'],'alias':q['token'],'extraction':'expansion'}
  if src not in old['sources']:old['sources'].append(src)
  if q['token'] not in old['aliases']:old['aliases'].append(q['token'])
  duplicates.append({'token':q['token'],'existing':old['displayId']});continue
 token=q['token']
 if token not in registry:registry[token]=nextid;nextid+=1
 group,topic=classify(q)
 if q['subject_id']==6:
  group={'Spine':'Spine and spinal cord','Cranial neurosurgery':'Brain and pituitary tumors','Congenital and CSF disorders':'CSF and intracranial pressure'}.get(group,group)
  if topic=='Head injury':group,topic='Head trauma','Head injury and assessment'
  if topic=='Neurovascular disorders':group='Cerebrovascular neurosurgery'
  if topic=='Spinal disorders and radiculopathy':topic='Disc disease and radiculopathy'
 sk=(q['subject_id'],group,topic)
 if sk not in systems:systems[sk]=nextsystem;nextsystem+=1
 explanation=q['explanation'];explanation=re.sub(r'\s+([,.;:])',r'\1',explanation)
 explanation=re.sub(r'(?i)\s*Note:\s*our university.*','',explanation)
 record={'id':registry[token],'displayId':token,'aliases':[token],'subject_id':q['subject_id'],'subject':names[q['subject_id']],'system_id':systems[sk],'system':topic,'system_group':group,'group':group,'topic':topic,'classificationMethod':'content topic','type':'mcq','stem':q['stem'],'stem_html':'<p>'+html.escape(q['stem'])+'</p>','choices':q['choices'],'correct':q['correct'],'explanation':explanation,'explanation_html':'<p>'+html.escape(explanation)+'</p>','sources':[{**q['source'],'alias':token,'extraction':'PDF text' if not q.get('generated') else 'curated topic review'}],'media':[],'explanation_media':[],'editorial':{'status':'source-key import with targeted clinical edits' if not q.get('generated') else 'curated','generatedDistractors':bool(q.get('generated')),'fullIndependentClinicalReview':False}}
 if q.get('references'):record['references']=q['references']
 elif q.get('generated') and q.get('topic') in curation.REFERENCES:record['references']=[curation.REFERENCES[q['topic']]]
 if q.get('matching'):record.update(type='matching',matching=q['matching']);record['editorial']['generatedDistractors']=False
 (bank5 if q['subject_id'] in (9,10) else bank4)['questions'].append(record);existing[sig]=record;added.append(record)
for b in data['banks']:
 b['count']=len(b['questions'])
 for s in b['subjects']:s['count']=sum(q['subject_id']==s['id'] for q in b['questions'])
data['contentReview']['expansion']={'date':'2026-10-06','added':len(added),'fullIndependentClinicalReview':False,'sourceFiles':len(inventory),'held':len(held)}
OUT.write_text("// Portable BAU Qbank: questions and figures.\n(function(root){\n'use strict';\nconst data="+json.dumps(data,ensure_ascii=False,separators=(',',':'))+";\nif(typeof module==='object'&&module.exports)module.exports=data;\nelse root.BAU_QBANK=data;\n})(typeof globalThis!=='undefined'?globalThis:this);\n",encoding='utf8')
registryfile.write_text(json.dumps(registry,indent=2),encoding='utf8')
(WORK/'held.json').write_text(json.dumps(held,ensure_ascii=False,indent=2),encoding='utf8')
report={'added':len(added),'duplicates':len(duplicates),'banks':[{k:v for k,v in b.items() if k!='questions'} for b in data['banks']],'addedBySubject':dict(Counter(q['subject'] for q in added)),'held':len(held),'clinicalReviewComplete':False}
(WORK/'build-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf8');(WORK/'duplicates.json').write_text(json.dumps(duplicates,indent=2),encoding='utf8')
print(json.dumps(report,ensure_ascii=False,indent=2))
