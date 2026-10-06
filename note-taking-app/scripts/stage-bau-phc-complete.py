"""Account for every numbered source occurrence before clinical review."""
from pathlib import Path
import json,re,bisect,unicodedata
ROOT=Path(__file__).resolve().parents[1];WORK=ROOT/'reports/bau-phc-complete'
inv=json.loads((WORK/'inventory.json').read_text(encoding='utf8'))
def clean(s):return re.sub(r'\s+',' ',unicodedata.normalize('NFKC',s)).strip()
records=[]
for r in inv:
 d=json.loads((WORK/r['cache']).read_text(encoding='utf8'));text='';offsets=[]
 for p in d['pages']:offsets.append(len(text));text+=p['text']+'\n'
 starts=list(re.finditer(r'(?m)^[ \t]*(\d{1,3})\s*[.)-]\s*(?=[A-Za-z])',text))
 for i,m in enumerate(starts):
  end=starts[i+1].start() if i+1<len(starts) else len(text);body=text[m.end():end]
  # Answer tables are associated with the preceding group of questions.
  tail=re.search(r'(?i)\bAnswers?\s*:',body);answer=None
  if tail:
   pairs=dict((int(n),ord(a.upper())-64) for n,a in re.findall(r'(\d+)\s*[).:]\s*([A-Ea-e])\b',body[tail.end():]))
   for old in records[::-1]:
    if old['file']!=r['file'] or old.get('tableComplete'):break
    if old['number'] in pairs:old['correct']=pairs[old['number']];old['tableComplete']=True
   answer=pairs.get(int(m[1]));body=body[:tail.start()]
  opts=list(re.finditer(r'(?m)^[ \t]*([A-Ea-e])\s*[).]\s*',body))
  if not opts:opts=list(re.finditer(r'(?m)^[ \t]*-\s+',body))
  choices=[clean(body[o.end():(opts[j+1].start() if j+1<len(opts) else len(body))]) for j,o in enumerate(opts)]
  stem=clean(body[:opts[0].start()]) if opts else clean(body)
  marked=[j+1 for j,c in enumerate(choices) if '*' in c or '(ANS)' in c]
  if len(marked)==1:answer=marked[0]
  page=d['pages'][bisect.bisect_right(offsets,m.start())-1]['page']
  records.append({'file':r['file'],'hash':r['hash'][:12],'page':page,'number':int(m[1]),'stem':stem,'choices':choices,'correct':answer,'token':'PHC-'+r['hash'][:6]+'-'+str(page)+'-'+m[1]})
(WORK/'candidates.json').write_text(json.dumps(records,ensure_ascii=False,indent=2),encoding='utf8')
(WORK/'digest.txt').write_text('\n\n'.join(q['token']+' '+q['stem']+'\n'+' | '.join(chr(97+i)+'. '+c for i,c in enumerate(q['choices']))+'\nKEY '+str(q['correct']) for q in records),encoding='utf8')
from collections import Counter
print('Occurrences',len(records),'explicit keys',sum(q['correct'] is not None for q in records));print(Counter(q['file'] for q in records))
