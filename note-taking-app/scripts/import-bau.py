"""Import source-faithful BAU PDFs from extracted page text; never alter originals.

Input: reports/bau-import/source-{1,2,3}.json and optional local OCR page JSON.
Output: content/bau/banks.json plus an auditable import report. All supplied
questions are assigned to fourth year by the user's explicit instruction.
"""
import bisect
import hashlib
import html
import json
import re
import shutil
import sys
import unicodedata
from collections import Counter, defaultdict
from difflib import SequenceMatcher
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
WORK = ROOT / 'reports' / 'bau-import'
OUT = ROOT / 'content' / 'bau'
OUT.mkdir(parents=True, exist_ok=True)
sys.stdout.reconfigure(encoding='utf-8')

GS_TOPICS = [
    ('Anatomy', 3), ('Esophagus', 12), ('Stomach & Duodenum', 17),
    ('Liver & Portal Hypertension & Spleen', 23), ('Gallbladder & Biliary Tree', 30),
    ('Pancreas', 37), ('Intestines + Rectum + Anus', 41), ('Hernia', 56),
    ('Intestinal Obstruction', 64), ('Appendix', 68), ('Surgical Site Infections', 73),
    ('Head & Neck Swellings', 80), ('Skin & Burns', 86), ('Breast', 90),
    ('Thyroid & Parathyroid', 98), ('Other Endocrine', 106),
    ('Vascular & Lower Limbs', 109), ('Lungs', 111), ('Paediatrics', 114),
    ('Shock', 120), ('Fluids', 126), ('Coagulation Disorders', 129),
    ('Trauma', 130), ('Miscellaneous', 136)
]
GS_GROUPS = {
    'Anatomy':'Anatomy', 'Esophagus':'Upper GI & Small Bowel',
    'Stomach & Duodenum':'Upper GI & Small Bowel',
    'Intestinal Obstruction':'Upper GI & Small Bowel',
    'Intestines + Rectum + Anus':'Colorectal, Appendix & Anal',
    'Appendix':'Colorectal, Appendix & Anal',
    'Liver & Portal Hypertension & Spleen':'Hepatobiliary, Pancreatic & Splenic',
    'Gallbladder & Biliary Tree':'Hepatobiliary, Pancreatic & Splenic',
    'Pancreas':'Hepatobiliary, Pancreatic & Splenic',
    'Thyroid & Parathyroid':'Endocrine', 'Other Endocrine':'Endocrine',
    'Head & Neck Swellings':'Endocrine', 'Skin & Burns':'Soft Tissue, Skin & Burns',
    'Shock':'Trauma, Critical Care, Fluids & Transfusion',
    'Fluids':'Trauma, Critical Care, Fluids & Transfusion',
    'Trauma':'Trauma, Critical Care, Fluids & Transfusion',
    'Coagulation Disorders':'Trauma, Critical Care, Fluids & Transfusion',
    'Vascular & Lower Limbs':'Vascular', 'Lungs':'Thoracic',
    'Surgical Site Infections':'Surgical Infection & Sepsis',
    'Hernia':'Hernia & Abdominal Wall', 'Breast':'Breast',
    'Paediatrics':'Paediatrics', 'Miscellaneous':'General Surgery'
}
# The year-end books supply aggregate topic charts, not per-question labels.
# These deterministic assignments are recorded as inferred, distinct from the
# compilation's explicit topic headings.
GS_RULES = [
    ('Hernia', r'hernia|inguinal canal|femoral canal|umbilic|hydrocele'),
    ('Appendix', r'appendic|mcburney|psoas sign|rovsing|obturator sign'),
    ('Breast', r'breast|mastect|mammogra|galactocele|fibroaden|brca|paget.s disease of the nipple'),
    ('Thyroid & Parathyroid', r'thyroid|parathyroid|graves|pemberton|thyroglobulin|thyroglossal|thyrotox|hypocalc|trousseau'),
    ('Other Endocrine', r'adrenal|aldoster|pheochromo|cushing|addison|men [12]|insulinoma|gastrinoma|pituitary'),
    ('Pancreas', r'pancrea|amylase|lipase|whipple|pseudocyst'),
    ('Gallbladder & Biliary Tree', r'gallbladder|gallstone|bile duct|biliary|cholang|cholecyst|murphy|choledoch|courvoisier'),
    ('Liver & Portal Hypertension & Spleen', r'liver|hepati|portal hyper|cirrhos|splen|hydatid|hepatoma'),
    ('Intestinal Obstruction', r'bowel obstruction|intestinal obstruction|volvulus|ileus|adhesion|strangulat'),
    ('Intestines + Rectum + Anus', r'colorect|colon|rectal|rectum|anal |anus|hemorrh|haemorrh|fissure|fistula.in.ano|diverticul|crohn|ulcerative colitis|mesenteric|meckel|hirschsprung|intussuscep'),
    ('Esophagus', r'esopha|dysphagia|achalasia|barrett|reflux|gerd|mallory|boerhaave'),
    ('Stomach & Duodenum', r'stomach|gastric|duoden|peptic|pylor|gastrojejun|gastrect|helicobacter'),
    ('Skin & Burns', r'burn|tbsa|parkland|melanoma|skin cancer|basal cell|squamous cell|pressure ulcer|wound healing|wound contraction|keloid'),
    ('Surgical Site Infections', r'infection|abscess|sepsis|sirs|necrotizing|necrotising|gas gangrene|clostridi|cellulitis|antibiotic|tetanus|surgical wound|wound dehiscence'),
    ('Vascular & Lower Limbs', r'vascular|aneurysm|aortic dissection|dvt|deep vein|varicose|claudication|ischemic limb|ischaemic limb|arterial occlus|arterial disease|arterial injury|six ps|ischemia|ischaemia|varicos'),
    ('Lungs', r'pneumothorax|hemothorax|haemothorax|chylothorax|pleural|chest tube|thorac|lung|bronch|pneumoni'),
    ('Coagulation Disorders', r'coagulat|thrombo|factor v|von willebrand|platelet|hemophil|haemophil|bleeding time|prothrombin'),
    ('Fluids', r'fluid|electrolyte|sodium|potassium|hypokal|hyperkal|hyponatr|hypernatr|acid.base|alkalosis|acidosis|transfus|blood group|blood loss|ringer|saline|blood donation'),
    ('Shock', r'shock|hypovolemi|haemodynamic|hemodynamic|cardiac output'),
    ('Trauma', r'trauma|glasgow|gcs|head injury|brain injury|head trauma|atls|fracture|seat.?belt|injury|injuries|accident|penetrating|blunt|compartment syndrome'),
    ('Paediatrics', r'congenital|neonat|newborn|infant|pediatric|paediatric|testicular|testis|orchid|cryptorchid'),
    ('Head & Neck Swellings', r'neck swelling|neck mass|branchial|salivary|parotid|submandibular'),
    ('Anatomy', r'anatomy|anatomical|nerve|artery|perineum|diaphragm|ligament')
]
IM_RULES = [
    ('Rheumatology & Immunology', 'Rheumatology', r'rheumatoid|arthritis|lupus|sle|scleroderma|sclerosis|sj.gren|vasculitis|gout|pseudogout|polymy|dermatomy|fibromyalgia|ankylosing|beh.et|raynaud|anti.?ccp|autoimmune|hiv'),
    ('Endocrinology', 'Diabetes & Glucose Disorders', r'diabet|insulin|metformin|hypoglyc|hyperglyc|dka|hba1c'),
    ('Endocrinology', 'Thyroid & Parathyroid', r'thyroid|graves|hashimoto|parathyroid|thyrotox|hypercalcemia|hypocalcemia'),
    ('Endocrinology', 'Adrenal & Pituitary', r'adrenal|addison|cushing|pituitary|aldoster|pheochromo|acromegaly|prolactin'),
    ('Hematology & Oncology', 'Anemia & Red Cell Disorders', r'anemia|anaemia|sickle|thalassem|hemolys|haemolys|iron defic|b12|cobalamin|folate|ferritin|g6pd'),
    ('Hematology & Oncology', 'Hematologic Malignancy', r'leukemia|leukaemia|lymphoma|myeloma|hodgkin|myeloprolif|polycythemia|polycythaemia'),
    ('Hematology & Oncology', 'Coagulation & Platelets', r'platelet|coagulat|thrombo|hemophil|haemophil|bleeding|von willebrand|purpura|pancytopenia'),
    ('Cardiology', 'Arrhythmias & ECG', r'atrial|arrhythm|tachycardia|bradycardia|ecg|electrocardio|av block|heart block|cha.ds|torsade|qt interval'),
    ('Cardiology', 'Coronary Artery Disease', r'infarct|coronary|angina|st.?elevation|acute coronary|troponin|ischemic heart|ischaemic heart'),
    ('Cardiology', 'Valvular & Structural Heart Disease', r'valv|murmur|mitral|aortic stenosis|aortic regurg|endocarditis|pericard|tamponade'),
    ('Cardiology', 'Heart Failure & Hypertension', r'heart failure|hypertensi|cardiomyop|cardiac|ejection fraction|orthopnea|orthopnoea'),
    ('Pulmonology', 'Obstructive Lung Disease', r'asthma|copd|emphysema|chronic bronch|spirometry|bronchodilat'),
    ('Pulmonology', 'Pulmonary Infection', r'pneumonia|curb.?65|tuberculo|tuberculosis|tb |bronchiect|lung abscess'),
    ('Pulmonology', 'Pleural & Pulmonary Vascular Disease', r'pleural|pneumothorax|pulmonary embol|pulmonary hyper|hemothorax|haemothorax'),
    ('Pulmonology', 'Respiratory Failure & Interstitial Disease', r'respirat|lung|hypoxi|sarcoid|alveol|ards|pulmonary fibrosis'),
    ('Gastroenterology & Hepatology', 'Liver & Biliary Disease', r'hepat|liver|cirrhos|ascites|varices|variceal|biliary|gallstone|cholang|jaundice'),
    ('Gastroenterology & Hepatology', 'Esophageal & Gastric Disease', r'dysphagia|esopha|achalasia|gastric|peptic|helicobacter|stomach|reflux|gerd|ulcer'),
    ('Gastroenterology & Hepatology', 'Intestinal Disease', r'bowel|crohn|colitis|diarrh|celiac|coeliac|malabsorp|constipation|diverticul|colon|intestinal|rectal'),
    ('Gastroenterology & Hepatology', 'Pancreatic Disease', r'pancrea|lipase|amylase'),
    ('Nephrology', 'Glomerular Disease', r'glomerul|nephrotic|nephritic|proteinuria|iga neph|goodpasture'),
    ('Nephrology', 'Kidney Injury & Chronic Kidney Disease', r'kidney|renal|aki|ckd|uremi|uraemi|dialysis|creatinine|interstitial neph|atn'),
    ('Nephrology', 'Urinary Tract Disease', r'urinary|dysuria|uti|pyeloneph|hematuria|haematuria|cystitis|nephrolith'),
    ('Electrolytes & Acid-Base', 'Electrolytes & Acid-Base', r'electrolyte|sodium|potassium|hyponatr|hypernatr|hypokal|hyperkal|alkalosis|acidosis|acid.base|anion gap|abg'),
    ('Neurology', 'Neurology', r'stroke|seizure|epilep|neurolog|mening|encephal|headache|migraine|parkinson|myasthen|neuropathy|guillain|demyelin|multiple sclerosis|cerebro|hemip|nystagmus'),
    ('General Medicine', 'Infection & Critical Care', r'infect|fever|sepsis|sirs|shock|bacter|viral|virus|malaria|antibiotic|anaphyl|organism|brucell|leishman'),
    ('General Medicine', 'General Medicine', r'.')
]

def normalized(text):
    text = unicodedata.normalize('NFKC', text).casefold()
    return re.sub(r'[^\w]+', ' ', text).strip()

def prose(text):
    return re.sub(r'\s+', ' ', text).strip()

def rich(text):
    return '<p>' + html.escape(prose(text)) + '</p>' if text.strip() else ''

def classify(q):
    if q.get('explicitTopic'):
        topic=q['explicitTopic']; return GS_GROUPS[topic], topic, 'source heading'
    # Stem/answer carry more specific evidence than distractors/explanation.
    stem=q['stem']; answer=q['choices'][q['correct'] - 1]
    text = stem + ' ' + answer
    if q['course']=='gs':
        for topic, pattern in GS_RULES:
            if re.search(pattern, text, re.I): return GS_GROUPS[topic], topic, 'inferred from question'
        return 'General Surgery','Miscellaneous','inferred from question'
    scores=[]
    for priority,(group,topic,pattern) in enumerate(IM_RULES[:-1]):
        pattern=re.sub(r'(?<![a-z])(?:sle|hiv|aki|ckd|atn|abg)(?![a-z])',lambda m:r'\b'+m[0]+r'\b',pattern)
        stem_matches=re.findall(pattern,stem,re.I)
        answer_matches=re.findall(pattern,answer,re.I)
        score=sum(1+min(len(m),20)/20 for m in stem_matches)+sum(3+min(len(m),20)/10 for m in answer_matches)
        if topic=='Arrhythmias & ECG' and re.search(r'atrial fibrillation|CHA.?DS|CHA2DS|CHA₂DS|CURB',stem,re.I):score+=6 if 'CURB' not in stem else 0
        if topic=='Rheumatology' and re.search(r'multiple sclerosis',stem,re.I):score=0
        if score:scores.append((score,-priority,group,topic))
    if scores:
        _,_,group,topic=max(scores);return group,topic,'inferred from question'
    return 'General Medicine','General Medicine','inferred from question'

skipped=[]
records=[]
sources=[]
def parse_block(body, meta, number, source_kind, explicit_topic=None):
    body=re.split(r'(?m)^\s*DISCLAIMER:',body)[0]
    body=re.sub(r'(?im)^\s*(?:Surgery Final.*|SURGERY/.*|General Surgery\s*$|Final Exam\s*$|Endorphin - 4th.*|Questions number:.*|Duration:.*|Doctors of the course:.*)\n?', '', body)
    answer=re.search(r'(?im)^\s*(?:Correct\s+Answer\s*:|Answer\s*(?:is\s*[:=]?|[:=]))\s*([A-E])\b([^\n]*)',body)
    before=body[:answer.start()] if answer else body
    opts=list(re.finditer(r'(?m)^\s*([A-Ea-e])\s*[).]\s*(.*)',before))
    reason=None
    if not opts or len(opts)<2: reason='Missing or incomplete options'
    letters=[m.group(1).upper() for m in opts]
    if opts and (letters!=list('ABCDE')[:len(opts)] or len(opts)>5): reason='Malformed or incomplete option sequence'
    stem=prose(before[:opts[0].start()]) if opts else prose(before)
    stem=re.sub(r'(?i)\s*Select one[:;.]?\s*$', '', stem)
    choices=[prose(before[m.start(2):(opts[j+1].start() if j+1<len(opts) else len(before))]) for j,m in enumerate(opts)]
    choices=[re.sub(r'(?i)\s*\(ANS\)\s*','',choice) for choice in choices]
    if any(not t or t in ['…','...'] for t in choices): reason='Incomplete option text'
    if len(stem)<22 or re.search(r'(?i)no one can recall|noone can recall|there was a question|therewasaquestion|question about|choices nor|not recalled',stem): reason='Incomplete recalled stem'
    if not answer: reason=reason or 'Missing source answer'
    correct=ord(answer.group(1))-64 if answer else 0
    if answer and re.match(r'\s*[+&/]\s*[A-E]\b',answer.group(2)): reason='Multiple or disputed source answers'
    if correct>len(choices): reason='Answer not among options'
    explanation=body[answer.end():].strip() if answer else ''
    if answer and source_kind=='year-end':
        marker=re.search(r'(?i)Explanation\s*:',explanation)
        explanation=explanation[marker.end():].strip() if marker else ''
    if source_kind=='topic-compilation' and answer:explanation=answer.group(2).strip()+'\n'+explanation
    if source_kind=='ocr': explanation=''
    prefix={'Endorphin':'Endo','WA':'WA'}.get(meta['batch'],meta['batch'])
    display=f'{prefix}-{number}'
    if meta.get('printedYear')==6: display=f'{prefix}-6-{number}'
    if source_kind=='topic-compilation': display=f'Surgery-{normalized(explicit_topic).replace(" ","-")}-{number}' if explicit_topic else f'{prefix}-Raw-{number}'
    if source_kind=='ocr': display=f'Screenshot-{meta["page"]}-{number}'
    source={**meta,'originalQuestionNumber':number,'alias':display,'extraction':source_kind}
    if reason:
        skipped.append({'reason':reason,'source':source,'stem':stem[:300]}); return
    q={'course':meta['course'],'stem':stem,'choices':choices,'correct':correct,'explanation':explanation,
       'displayId':display,'sources':[source],'aliases':[display],'explicitTopic':explicit_topic,
       'media':[],'sourceKind':source_kind}
    q['group'],q['topic'],q['classificationMethod']=classify(q)
    if source_kind=='ocr':
        # OCR-only copies are admitted only when their entire stem and option
        # set agree with an intact text-source question. Unverified screenshots
        # are ignored, as requested, rather than becoming guessed exam items.
        agree=lambda old: old['course']=='gs' and SequenceMatcher(None,normalized(old['stem']),normalized(q['stem'])).ratio()>=.97 and sorted(normalized(c) for c in old['choices'])==sorted(normalized(c) for c in q['choices'])
        if not any(agree(old) for old in records):
            skipped.append({'reason':'Unverified screenshot text','source':source,'stem':stem[:300]});return
    records.append(q)

def extract_text_source(index, course):
    data=json.loads((WORK/f'source-{index}.json').read_text(encoding='utf-8'))
    sources.append({'file':Path(data['path']).name,'pageCount':len(data['pages']),'course':course})
    text='';offsets=[];metadata=[];batch='Unknown';year=None;topic=None
    for page_no,page in enumerate(data['pages'],1):
        if index<3:
            header=re.search(r'\((\d)(?:th)?\s+Year\)\s*([A-Za-z]+)',page)
            if header: year=int(header[1]);batch=header[2]
            page=re.sub(r'(?m)^\s*\(\d(?:th)?\s+Year\)\s*[A-Za-z]+\s*$', '', page)
            page=re.sub(r'(?m)^\s*Page\s*\|\s*\d+\s*$', '', page)
        else:
            if page_no>=149: break # Screenshots handled separately after OCR.
            if page_no<4: continue
            if page_no<=137:
                printed=page_no-1
                topic=next((name for name,start in reversed(GS_TOPICS) if printed>=start),None)
                if topic: page=re.sub(r'(?m)^\s*'+re.escape(topic)+r'\s*$', '',page)
                batch='Mixed';year=None
            else: topic=None;batch='Endorphin';year=4
            page=re.sub(r'(?m)^\s*\d{1,3}\s*$', '',page)
        offsets.append(len(text));metadata.append({'file':Path(data['path']).name,'page':page_no,'batch':batch,'printedYear':year,'course':course,'topic':topic})
        text+=page.strip()+'\n'
    pattern=r'Question\s+(\d+)\s*:' if index<3 else r'(?m)^\s*(\d{1,3})[.)]\s+'
    matches=list(re.finditer(pattern,text))
    for j,m in enumerate(matches):
        end=matches[j+1].start() if j+1<len(matches) else len(text)
        page_index=bisect.bisect_right(offsets,m.start())-1
        meta=metadata[page_index].copy();meta['endPage']=metadata[bisect.bisect_right(offsets,max(m.end(),end-1))-1]['page']
        parse_block(text[m.end():end],meta,int(m[1]),'year-end' if index<3 else 'topic-compilation',meta.pop('topic'))
    print('Extracted source',index,'candidates',len(matches),flush=True)

def extract_ocr():
    for path in sorted((WORK/'ocr').glob('page-*.png.json')):
        page_no=int(re.search(r'page-(\d+)',path.name)[1])
        if 168<=page_no<=180:continue # These pages have intact PDF text.
        data=json.loads(path.read_text(encoding='utf-8-sig'))
        # Group nearby OCR lines into reading rows, repairing detached option
        # letters without importing Telegram names or unrelated comments.
        ordered=[]
        for line in data['lines']:
            if not line['words']: continue
            words=line['words'];ordered.append((min(w['y'] for w in words),min(w['x'] for w in words),line['text']))
        ordered.sort();rows=[]
        for y,x,t in ordered:
            if rows and abs(y-rows[-1][0])<7: rows[-1][1].append((x,t))
            else: rows.append([y,[(x,t)]])
        lines=[' '.join(t for x,t in sorted(parts)) for y,parts in rows]
        text='\n'.join(lines)
        # Only complete, labeled MCQs ending with an explicit source key.
        starts=list(re.finditer(r'(?m)^\s*(?:(\d{1,3})[.)]\s*)?(?=Which\b|What\b|All\b|A\s+\d|In contrast\b|Vomiting\b|Regarding\b|One\b)([^\n]+)',text))
        used=[]
        for n,m in enumerate(starts):
            if any(a<=m.start()<b for a,b in used): continue
            key=re.search(r'(?im)Answer\s*(?:is\s*[:=]?|[:=])\s*[A-E]\b',text[m.start():])
            if not key: continue
            end=m.start()+key.end();block=text[m.start():end]
            if len(block)>4500: continue
            # Reject blocks spanning another numbered question or chat UI.
            if re.search(r'(?im)^\s*(?:\d{1,3}[.)]\s+|.*Like Reply|.*Write a comment)',block[m.end()-m.start():]): continue
            original_number=int(m[1]) if m[1] else n+1
            body=block[m.end(1)-m.start()+1:] if m[1] else block
            meta={'file':sources[2]['file'],'page':page_no,'endPage':page_no,'batch':'Screenshots','printedYear':None,'course':'gs'}
            parse_block(body,meta,original_number,'ocr')
            used.append((m.start(),end))

def extract_vagus_appendix():
    data=json.loads((WORK/'source-3.json').read_text(encoding='utf-8'))
    text='';offsets=[]
    for page in range(169,181):
        offsets.append(len(text));text+=data['pages'][page-1]+'\n'
    matches=list(re.finditer(r'(?m)^\s*Q(\d+)\s*:\s*',text))
    for j,m in enumerate(matches):
        end=matches[j+1].start() if j+1<len(matches) else len(text)
        meta={'file':Path(data['path']).name,'page':169+bisect.bisect_right(offsets,m.start())-1,
              'endPage':169+bisect.bisect_right(offsets,max(m.end(),end-1))-1,'batch':'Vagus','printedYear':6,'course':'gs'}
        parse_block(text[m.end():end],meta,int(m[1]),'topic-compilation')

for index,course in [(1,'gs'),(2,'im'),(3,'gs')]: extract_text_source(index,course)
extract_vagus_appendix()
extract_ocr()

# Conservative deduplication: punctuation/case/option-order variants collapse;
# a similar stem with different distractors remains a distinct exam variant.
def fingerprint(q):
    return q['course']+'|'+normalized(q['stem'])+'|'+'|'.join(sorted(normalized(c) for c in q['choices']))

by_fingerprint={};duplicates=[];conflicts=[]
for q in records:
    key=fingerprint(q);old=by_fingerprint.get(key)
    if old:
        if normalized(old['choices'][old['correct']-1])!=normalized(q['choices'][q['correct']-1]):
            conflicts.append({'first':old['sources'],'second':q['sources'],'stem':q['stem'],'answers':[old['choices'][old['correct']-1],q['choices'][q['correct']-1]]})
            old['conflict']=True
        old['sources']+=q['sources'];old['aliases']+=q['aliases'];old['media']+=q['media']
        if q['explicitTopic']: old['topic']=q['topic'];old['group']=q['group'];old['classificationMethod']='source heading'
        duplicates.append({'kept':old['displayId'],'merged':q['displayId'],'kind':'exact normalized stem and option set'})
        if len(q['explanation'])>len(old['explanation']):old['explanation']=q['explanation']
    else: by_fingerprint[key]=q

# Compare high-confidence spelling/format variants within matching option sets.
option_groups=defaultdict(list);merged=[]
for q in by_fingerprint.values():
    option_groups[(q['course'],tuple(sorted(normalized(c) for c in q['choices'])))].append(q)
for group in option_groups.values():
    kept=[]
    for q in group:
        stem=normalized(q['stem']);match=None
        for old in kept:
            previous=normalized(old['stem'])
            critical=lambda t:(re.findall(r'\d+(?:\.\d+)?',t),re.findall(r'\b(?:not|except|incorrect|false|least|most)\b',t))
            if critical(stem)==critical(previous) and SequenceMatcher(None,stem,previous).ratio()>=.92:
                match=old;break
        if match:
            if normalized(match['choices'][match['correct']-1])!=normalized(q['choices'][q['correct']-1]):
                match['conflict']=True;conflicts.append({'first':match['sources'],'second':q['sources'],'stem':q['stem'],'answers':[match['choices'][match['correct']-1],q['choices'][q['correct']-1]]})
            match['conflict']=match.get('conflict',False) or q.get('conflict',False)
            match['sources']+=q['sources'];match['aliases']+=q['aliases']
            if q['explicitTopic']:match['topic']=q['topic'];match['group']=q['group'];match['classificationMethod']='source heading'
            if len(q['explanation'])>len(match['explanation']):match['explanation']=q['explanation']
            duplicates.append({'kept':match['displayId'],'merged':q['displayId'],'kind':'same option set and high-confidence wording variant'})
        else:kept.append(q)
    merged+=kept

# Reuse previous numeric IDs, so reimporting does not invalidate saved progress.
id_path=OUT/'id-registry.json'
registry=json.loads(id_path.read_text()) if id_path.exists() else {}
next_id=max(registry.values(),default=1000000)+1
all_questions=[];topic_ids={};courses={}
subjects=[{'id':1,'name':'Internal Medicine 1'},{'id':2,'name':'General Surgery 1'}]+[{'id':i+3,'name':name} for i,name in enumerate(['Clinical introductory','Primary Health Care','Neuromedicine','Neurosurgery','Orthopedics','Anesthesia'])]
for subject_id,(course,label) in enumerate([('im','Internal Medicine 1'),('gs','General Surgery 1')],1):
    questions=[];usable=[q for q in merged if q['course']==course and not q.get('conflict')]
    for q in usable:
        digest=hashlib.sha256(fingerprint(q).encode()).hexdigest()
        if digest not in registry:registry[digest]=next_id;next_id+=1
        topic_key=(course,q['group'],q['topic'])
        if topic_key not in topic_ids:topic_ids[topic_key]=len(topic_ids)+1
        item={k:v for k,v in q.items() if k not in ['course','explicitTopic','sourceKind','conflict']}
        item.update(id=registry[digest],subject_id=subject_id,system_id=topic_ids[topic_key],subject=label,system=q['topic'],system_group=q['group'])
        item['displayId']=course.upper()+'-'+q['displayId']
        item['aliases']=sorted(set(item['aliases']+[item['displayId']]+[course.upper()+'-'+alias for alias in item['aliases']]))
        item['stem_html']=rich(item['stem'])
        item['explanation_html']=rich(item['explanation']) or '<p>No explanation was provided in the source.</p>'
        questions.append(item)
    all_questions+=questions
    courses[label]={'questions':len(questions),'topics':dict(Counter(q['system'] for q in questions)),'batches':dict(Counter(s['batch'] for q in questions for s in q['sources']))}
banks=[{'key':'bau-year4','label':'4th year','category':'bau','year':4,'subjects':subjects,'count':len(all_questions),'questions':all_questions}]

report={'sources':sources,'assignedYear':4,'completeOccurrences':len(records),'uniqueQuestions':sum(b['count'] for b in banks),
        'duplicatesMerged':len(duplicates),'duplicates':duplicates,'answerConflicts':conflicts,
        'excluded':skipped,'excludedByReason':dict(Counter(s['reason'] for s in skipped)),
        'courses':courses,
        'sourceStatistics':{'General Surgery':'Original topic-distribution chart preserved as gs-topics.png; bars have no printed exact counts.',
                            'Internal Medicine':'Original topic-distribution chart preserved as im-topics.png; bars have no printed exact counts.'},
        'classification':'Compilation headings preserved; year-end questions assigned using source chart categories and deterministic content rules.',
        'answerPolicy':'Source keys preserved without clinical re-verification; incomplete and conflicting keys excluded from scored tests.'}
for course in ['gs','im']:
    shutil.copyfile(WORK/f'{course}-topics.png',OUT/f'{course}-topics.png')
(OUT/'banks.json').write_text(json.dumps({'schemaVersion':1,'banks':banks,'sources':sources,'sourceStatistics':report['sourceStatistics']},ensure_ascii=False,indent=2),encoding='utf-8')
id_path.write_text(json.dumps(registry,indent=2),encoding='utf-8')
(WORK/'import-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({k:report[k] for k in ['completeOccurrences','uniqueQuestions','duplicatesMerged','excludedByReason','courses']},ensure_ascii=False,indent=2))
