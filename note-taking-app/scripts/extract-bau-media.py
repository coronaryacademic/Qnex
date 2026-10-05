"""Preserve clinical figures from the topic-organized surgery compilation.

Decorative year-end book watermarks and social-media screenshots are excluded.
Only figures associated with admitted complete questions are bundled.
"""
import hashlib
import html
import json
import re
from pathlib import Path
import pdfplumber

ROOT=Path(__file__).resolve().parents[1]
WORK=ROOT/'reports'/'bau-import'
OUT=ROOT/'content'/'bau'
MEDIA=OUT/'media';MEDIA.mkdir(exist_ok=True)
data=json.loads((OUT/'banks.json').read_text(encoding='utf-8'))
source=json.loads((WORK/'source-3.json').read_text(encoding='utf-8'))
source_name=Path(source['path']).name
questions=[q for bank in data['banks'] for q in bank['questions'] if q['subject']=='General Surgery 1']
index={}
for q in questions:
    q['media']=[]
    for s in q['sources']:
        if s['file']==source_name and s['extraction']!='ocr':
            for p in range(s['page'],s['endPage']+1):
                index.setdefault(p,[]).append((q,s))
assignments=[];ignored=[]

def attach(q, page, bbox, number, kind):
    safe=(max(0,bbox[0]),max(0,bbox[1]),min(page.width,bbox[2]),min(page.height,bbox[3]))
    if safe[2]-safe[0]<12 or safe[3]-safe[1]<12:return
    name=f'surgery-p{page.page_number}-figure{number}.png'
    target=MEDIA/name
    if not target.exists():page.crop(safe).to_image(resolution=160).save(str(target))
    asset={'name':name,'url':f'/qbank/media/{q["id"]}/{name}','sourcePage':page.page_number,'kind':kind}
    if not any(a['name']==name for a in q['media']):q['media'].append(asset)
    assignments.append({'question':q['displayId'],'page':page.page_number,'file':name,'kind':kind})

with pdfplumber.open(source['path']) as doc:
    image_pages=json.loads((WORK/'images-3.json').read_text())
    for metadata in image_pages:
        p=metadata['page']
        if p<4 or p>137:continue
        page=doc.pages[p-1]
        for number,image in enumerate(metadata['images'],1):
            bbox=image['bbox']
            # A diagram beside a paragraph can begin below its associated stem;
            # look above its top edge, including one text-line of tolerance.
            above=page.crop((0,0,page.width,min(page.height,max(1,bbox[1]+12)))).extract_text(x_tolerance=1) or ''
            markers=list(re.finditer(r'(?m)^\s*(\d{1,3})[.)]\s+',above))
            original=int(markers[-1][1]) if markers else None
            candidates=[(q,s) for q,s in index.get(p,[]) if original is None or s['originalQuestionNumber']==original]
            if not candidates:
                ignored.append({'page':p,'image':number,'reason':'Associated question was incomplete or excluded'});continue
            candidates.sort(key=lambda value:(value[1]['page'],value[1]['originalQuestionNumber']))
            attach(candidates[-1][0],page,bbox,number,'clinical figure')
    # The large Crohn/UC comparison is text laid out as a table across two
    # pages. Preserve its visual structure alongside the extracted explanation.
    for p in [51,52]:
        candidates=[(q,s) for q,s in index.get(p,[]) if s['originalQuestionNumber']==20]
        if candidates:
            page=doc.pages[p-1]
            attach(candidates[0][0],page,(65,65,page.width-35,page.height-42),99,'source comparison table')

# Explicit source cross-references share their actual explanation figures.
for q in questions:
    refs=re.findall(r'(?i)(?:explanation|picture).*?question\s+(\d+)',q['explanation'])
    for number in refs:
        own=[s for s in q['sources'] if s['file']==source_name]
        referenced=next((other for other in questions if other!=q and other['system']==q['system'] and
            any(s['file']==source_name and s['originalQuestionNumber']==int(number) and
                any(s['batch']==t['batch'] for t in own) for s in other['sources'])),None)
        if referenced:
            for asset in referenced['media']:
                if not any(a['name']==asset['name'] for a in q['media']):
                    q['media'].append({**asset,'url':f'/qbank/media/{q["id"]}/{asset["name"]}'})

for q in questions:
    # Idempotent HTML: no duplicated figures if the extraction is repeated.
    q['explanation_html']=re.sub(r'<figure data-bau-source="true">.*?</figure>','',q['explanation_html'],flags=re.S)
    for asset in q['media']:
        q['explanation_html']+=f'<figure data-bau-source="true"><img src="{html.escape(asset["url"])}" alt="Source {html.escape(asset["kind"])}"><figcaption>Source page {asset["sourcePage"]}</figcaption></figure>'
(OUT/'banks.json').write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8')
report=json.loads((WORK/'import-report.json').read_text(encoding='utf-8'))
report['media']={'files':len({a['file'] for a in assignments}),'questionsWithMedia':sum(bool(q['media']) for q in questions),'assignments':assignments,'ignored':ignored}
(WORK/'import-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print('Clinical media:',report['media']['files'],'files;',report['media']['questionsWithMedia'],'questions illustrated.')
