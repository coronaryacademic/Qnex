"""Extract candidates without publishing uncertain or incomplete exam items."""
from pathlib import Path
import json,re,bisect,unicodedata
ROOT=Path(__file__).resolve().parents[1];WORK=ROOT/'reports/bau-expansion'
inventory=json.loads((WORK/'inventory.json').read_text(encoding='utf8'))
selected={'Pediatric Medicine (Year-End Past Exams).pdf':(9,'PED'),'Obstetrics & Gynecology (Year-End Past Exams).pdf':(10,'OG'),'Intro - MiniOSCE..pdf':(3,'INTRO'),'PYQ-final_240910_102726 (2).pdf':(3,'INTROFINAL'),'Neurosurgery QA by Lecture.pdf':(6,'NSQA'),'Rheumatology_MCQ_Master_Review.pdf':(1,'RHEUM')}
def prose(t):return re.sub(r'\s+',' ',unicodedata.normalize('NFKC',t)).strip()
out=[];held=[]
for source in inventory:
 if source['file'] not in selected:continue
 sid,prefix=selected[source['file']];data=json.loads((WORK/source['extraction']).read_text(encoding='utf8'))
 text='';offsets=[];meta=[];batch='Unknown';year=None
 for p in data['pages']:
  body=p['text'].replace('\t',' ')
  header=re.search(r'\((\d)(?:th)?\s+Year\)\s*([A-Za-z]+)',body)
  if header:year=int(header[1]);batch=header[2]
  body=re.sub(r'(?m)^\s*(?:\(\d(?:th)?\s+Year\)\s*[A-Za-z]+|Page\s*\|\s*\d+|Rheumatology MCQ Master Review[^\n]*|Page \d+)\s*$','',body)
  offsets.append(len(text));meta.append({'file':source['file'],'page':p['page'],'batch':batch,'printedYear':year});text+=body+'\n'
 pat=r'(?m)^[ \t]*Question\s+(\d+)[ \t]*:?[ \t]*' if sid in (9,10) else (r'(?m)^[ \t]*Q(\d+)\.' if prefix in ('NSQA','RHEUM') else r'(?m)^[ \t]*(\d{1,3})\.[ \t]+')
 matches=list(re.finditer(pat,text))
 for i,m in enumerate(matches):
  end=matches[i+1].start() if i+1<len(matches) else len(text);body=text[m.end():end]
  body=re.split(r'(?im)^\s*(?:DISCLAIMER|Lecture \d+:|Part \d+\s*[·:]|Frequency Analysis|Comparison Tables)',body)[0]
  src=meta[bisect.bisect_right(offsets,m.start())-1].copy();src['endPage']=meta[bisect.bisect_right(offsets,end-1)-1]['page'];src['originalQuestionNumber']=int(m[1])
  body=re.sub(r'\[(?:Unique|Repeated)[^\]]*\]','',body)
  key=re.search(r'(?i)(?:Correct\s+)?Answer\s*:\s*([A-E])\b',body)
  before=body[:key.start()].rstrip('✓ \n') if key else body
  opts=list(re.finditer(r'(?m)^\s*([A-Ea-e])[).]\s*(.*)',before));letters=[o[1].upper() for o in opts]
  stem=prose(before[:opts[0].start()]) if opts else prose(before)
  stem=re.sub(r'\s*\((?:Wateen|Oath|Glory|Core|Grace)\)\s*',' ',stem).strip()
  choices=[prose(before[o.start(2):(opts[j+1].start() if j+1<len(opts) else len(before))]) for j,o in enumerate(opts)]
  reason=None
  if not key:reason='Missing explicit answer'
  elif len(opts)<2 or letters!=list('ABCDE')[:len(opts)] or len(opts)>5:reason='Incomplete or malformed choices'
  elif ord(key[1].upper())-64>len(choices):reason='Key outside choices'
  elif len(set(c.casefold() for c in choices))!=len(choices):reason='Duplicate choices'
  elif re.search(r'(?i)image|shown|figure|picture|radiograph below|ECG below',stem):reason='Figure must be recovered and checked'
  elif re.search(r'(?i)not recalled|no one|question about|there was a|cannot recall',stem):reason='Incomplete recollection'
  if reason:held.append({'reason':reason,'source':src,'stem':stem});continue
  correct=ord(key[1].upper())-64
  after=body[key.end():]
  explanation=''
  if sid in (9,10):
   marker=re.search(r'(?i)Explanation\s*:',after)
   if marker:explanation=prose(after[marker.end():])
  elif prefix=='RHEUM':
   marker=re.search(r'(?i)\bWhy\.',after)
   if marker:explanation=prose(after[marker.end():])
  elif prefix=='NSQA':explanation=prose(after.split('\n',1)[1] if '\n' in after else '')
  out.append({'source':src,'subject_id':sid,'prefix':prefix,'stem':stem,'choices':choices,'correct':correct,'explanation':explanation,'token':prefix+'-'+str(src['page'])+'-'+m[1]})
 (WORK/(prefix+'-digest.txt')).write_text('\n\n'.join(q['token']+' '+q['stem']+'\n'+' | '.join(chr(97+j)+'. '+c for j,c in enumerate(q['choices']))+'\nKEY '+str(q['correct'])+' '+q['explanation'] for q in out if q['prefix']==prefix),encoding='utf8')
(WORK/'candidates.json').write_text(json.dumps(out,ensure_ascii=False,indent=2),encoding='utf8')
(WORK/'held.json').write_text(json.dumps(held,ensure_ascii=False,indent=2),encoding='utf8')
(WORK/'extraction-held.json').write_text(json.dumps(held,ensure_ascii=False,indent=2),encoding='utf8')
from collections import Counter
print(Counter(q['prefix'] for q in out));print('Held',len(held))
