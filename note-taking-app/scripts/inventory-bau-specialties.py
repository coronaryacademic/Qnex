"""Read source PDFs without modifying them; save page text for editorial review."""
import json
from pathlib import Path
from pypdf import PdfReader

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'reports' / 'bau-specialties'
OUT.mkdir(parents=True, exist_ok=True)
SRC = Path(r'C:\Users\momen\Downloads\Telegram Desktop')
inventory = []
for i, file in enumerate(sorted(SRC.glob('*.pdf')), 1):
    try:
        reader = PdfReader(file)
        pages = [{'page': n + 1, 'text': page.extract_text() or ''} for n, page in enumerate(reader.pages)]
        record = {'file': file.name, 'path': str(file), 'pages': pages}
        (OUT / f'source-{i:03}.json').write_text(json.dumps(record, ensure_ascii=False, indent=2), encoding='utf-8')
        inventory.append({'id': i, 'file': file.name, 'pages': len(pages), 'chars': sum(len(p['text']) for p in pages), 'preview': '\n'.join(p['text'] for p in pages[:2])[:2000]})
    except Exception as exc:
        inventory.append({'id': i, 'file': file.name, 'error': str(exc)})
    print(i, file.name.encode('ascii', errors='replace').decode(), flush=True)
(OUT / 'inventory.json').write_text(json.dumps(inventory, ensure_ascii=False, indent=2), encoding='utf-8')
