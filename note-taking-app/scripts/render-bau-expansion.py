from pathlib import Path
import json,logging
import pypdfium2 as pdfium
ROOT=Path(__file__).resolve().parents[1];WORK=ROOT/'reports/bau-expansion';out=WORK/'ocr';out.mkdir(exist_ok=True)
inv=json.loads((WORK/'inventory.json').read_text(encoding='utf8'))
manifest=[]
for r in inv:
 if r.get('pages',999)>20 or r.get('chars',999999)>1500 or not r.get('extraction'):continue
 if not any(t in r['file'].lower() for t in ('pp','breastfeeding','child mortality','contraception','preventive health','primary health','intro - iris','ethics 3')):continue
 pdf=pdfium.PdfDocument(r['path'])
 for i in range(len(pdf)):
  name=r['sha256'][:12]+'-p'+str(i+1)+'.png';target=out/name
  if not target.exists():
   page=pdf[i];image=page.render(scale=2).to_pil();image.thumbnail((2400,2400));image.save(target);page.close()
  manifest.append({'image':name,'file':r['file'],'page':i+1,'path':r['path']})
 pdf.close()
(WORK/'ocr-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf8')
print('Rendered',len(manifest),'pages')
