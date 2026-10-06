from pathlib import Path
import json,re,logging
from collections import Counter
ROOT=Path(__file__).resolve().parents[1];WORK=ROOT/'reports/bau-expansion'
inv=json.loads((WORK/'inventory.json').read_text(encoding='utf8'))
# Recover only the extraction that contained an invalid PDF Unicode surrogate.
logging.getLogger('pypdf').setLevel(logging.ERROR)
for r in inv:
 if r.get('status') and 'surrogates not allowed' in r['status']:
  from pypdf import PdfReader
  pdf=PdfReader(r['path']);pages=[{'page':i+1,'text':(p.extract_text() or '').encode('utf8','replace').decode('utf8')} for i,p in enumerate(pdf.pages)]
  (WORK/r['extraction']).write_text(json.dumps({'file':r['file'],'path':r['path'],'pages':pages},ensure_ascii=False,indent=2),encoding='utf8');r.pop('status',None);r['unicodeRepairs']='Invalid PDF Unicode surrogate replaced; original PDF untouched.'
(WORK/'inventory.json').write_text(json.dumps(inv,ensure_ascii=False,indent=2),encoding='utf8')
text=(ROOT/'content/bau/bau-qbank.js').read_text(encoding='utf8');data=json.loads(text.split('const data=',1)[1].split(';\nif(typeof module',1)[0])
held=json.loads((WORK/'held.json').read_text(encoding='utf8'));added=[q for b in data['banks'] for q in b['questions'] if q.get('editorial',{}).get('fullIndependentClinicalReview') is False]
active=Counter(s['file'] for q in added for s in q['sources']);heldfiles=Counter(q['source']['file'] for q in held)
coverage=[]
for r in inv:
 status='Duplicate copy' if r.get('duplicateOf') else 'Reference material or further clinical curation needed'
 if r.get('status'):status='Extraction issue'
 elif active[r['file']]:status='Imported selected complete items; source-derived keys retain review status'
 elif heldfiles[r['file']]:status='Questions staged for individual review'
 elif r.get('chars',999999)<1500:status='Scanned reference or image material; not automatically published'
 coverage.append({**r,'status':status,'activeNewQuestions':active[r['file']],'heldCandidates':heldfiles[r['file']]})
(WORK/'source-coverage.json').write_text(json.dumps(coverage,ensure_ascii=False,indent=2),encoding='utf8')
report=json.loads((WORK/'build-report.json').read_text(encoding='utf8'))
lines=['# BAU import report — 6 October 2026','',f"Added {report['added']} questions; {sum(b['count'] for b in data['banks'])} active questions across fourth and fifth year.",'','| Year | Subject | Active questions |','|---|---|---:|']
for b in data['banks']:
 for s in b['subjects']:lines.append(f"| {b['year']} | {s['name']} | {s['count']} |")
lines+=['','The portable file is `content/bau/bau-qbank.js`. It contains both years and all 110 existing figures. The 2,151 prior clinical records were preserved.','',f"{report['duplicates']} matching copies were joined to existing questions as source aliases. Matching questions retain a shared answer list.",'','Clinical accuracy status: source-provided complete questions and explanations were imported with targeted corrections. A full independent clinical review of every imported key is not complete. Ambiguous, incomplete, unsupported-image and disputed items are excluded from active quizzes. Generated distractors and source information remain in metadata; production notes are excluded from explanations.','',f"{len(held)} candidate occurrences are held for review. This includes repeated source occurrences; it is not a count of unique omitted concepts.",'','Rebuild order: inventory (when new files arrive), stage, build, audit. The expansion build uses the frozen prior bank and stable question IDs. Do not regenerate the specialty-only bank over the expansion.','', '## Source files','', '| Source | New active questions | Status |','|---|---:|---|']
for r in coverage:lines.append('| '+r['file'].replace('|','/')+' | '+str(r['activeNewQuestions'])+' | '+r['status']+' |')
(WORK/'IMPORT-REPORT.md').write_text('\n'.join(lines)+'\n',encoding='utf8')
print(json.dumps({'sources':len(inv),'duplicates':sum(bool(r.get('duplicateOf')) for r in inv),'emptyFilesNow':sum(Path(r['path']).stat().st_size==0 for r in inv),'report':str(WORK/'IMPORT-REPORT.md')},indent=2))
