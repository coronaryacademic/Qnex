from pathlib import Path
import json,hashlib,logging
from pypdf import PdfReader
logging.getLogger('pypdf').setLevel(logging.ERROR)
root=Path(__file__).resolve().parents[1]
out=root/'reports/bau-expansion';out.mkdir(parents=True,exist_ok=True)
inventory=[];seen={}
for f in sorted(Path(r'C:\Users\momen\Downloads\Telegram Desktop').glob('*.pdf')):
 r={'file':f.name,'path':str(f),'bytes':f.stat().st_size}
 if not r['bytes']:r['status']='Download incomplete: empty file'
 else:
  r['sha256']=hashlib.sha256(f.read_bytes()).hexdigest()
  if r['sha256'] in seen:r['duplicateOf']=seen[r['sha256']]
  else:
   seen[r['sha256']]=f.name
   try:
    pdf=PdfReader(f);pages=[{'page':i+1,'text':(p.extract_text() or '').encode('utf-8','replace').decode('utf-8')} for i,p in enumerate(pdf.pages)]
    r.update(pages=len(pages),chars=sum(len(p['text']) for p in pages),extraction=r['sha256'][:12]+'.json')
    (out/r['extraction']).write_text(json.dumps({'file':f.name,'path':str(f),'pages':pages},ensure_ascii=False,indent=2),encoding='utf-8')
   except Exception as e:r['status']=str(e)
 inventory.append(r);print(f.name.encode('ascii','replace').decode(),flush=True)
(out/'inventory.json').write_text(json.dumps(inventory,ensure_ascii=False,indent=2),encoding='utf-8')
