import json
from pathlib import Path
import pypdfium2 as pdfium
ROOT=Path(__file__).resolve().parents[1]
WORK=ROOT/'reports'/'bau-specialties'
OUT=WORK/'ocr'; OUT.mkdir(exist_ok=True)
for file in sorted(WORK.glob('source-*.json')):
    source=json.loads(file.read_text(encoding='utf-8'))
    name=source['file'].lower()
    if not any(word in name for word in ['neuro','anesth','ortho','mini osce','notes_','vagus','overdose','x-ray','نيرو','اورثو']): continue
    if len(source['pages'])>150: continue
    doc=pdfium.PdfDocument(source['path'])
    for page in source['pages']:
        if len(page['text'].strip())>=150: continue
        out=OUT/f"{file.stem}-p{page['page']:04}.png"
        if not out.exists():
            image=doc[page['page']-1].render(scale=2).to_pil()
            if max(image.size)>2400: image.thumbnail((2400,2400))
            image.save(out)
    print(file.stem, flush=True)
