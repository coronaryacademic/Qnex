"""Read-only verification of every referenced local Qbank image."""
import base64
import io
import json
import re
import runpy
import sys
from pathlib import Path
from PIL import Image
from xml.etree import ElementTree

project = Path(__file__).resolve().parent.parent
sys.argv = [str(project / 'server/medos-reader.py'), sys.argv[1]]
bridge = runpy.run_path(sys.argv[0])
reader = bridge['reader']
report = {'banks': [], 'missing': [], 'damaged': [], 'recovered': [], 'checked': 0, 'valid': 0}
cache = {}
for bank in bridge['dispatch']({'action': 'catalog'})['banks']:
    key = bank['key']
    print('Checking ' + bank['label'], file=sys.stderr, flush=True)
    conn = bridge['connection'](key)
    refs = {}
    for index, row in enumerate(conn.execute('SELECT id, question, explanation, mediaName, otherMedias FROM Questions')):
        if index and index % 500 == 0:
            print(f'{key}: read {index} questions', file=sys.stderr, flush=True)
        names = set(reader._split_media(row['mediaName']) + reader._split_media(row['otherMedias']))
        for field in ['question', 'explanation']:
            names.update(reader._html_media_names(reader._decrypt_qbank_html(row['id'], row[field])))
        for name in names:
            if re.search(r'\.(jpe?g|png|gif|webp|svg)$', name, re.I):
                refs.setdefault(name, []).append(row['id'])
    # Answer figures also belong to the source content.
    for row in conn.execute('SELECT qId, answerText FROM Answers'):
        for name in reader._html_media_names(reader._decrypt_qbank_html(row['qId'], row['answerText'])):
            if re.search(r'\.(jpe?g|png|gif|webp|svg)$', name, re.I):
                refs.setdefault(name, []).append(row['qId'])
    conn.close()
    summary = {'bank': key, 'references': len(refs), 'valid': 0, 'missing': 0, 'damaged': 0, 'recovered': 0}
    print(f'{key}: decoding {len(refs)} image references', file=sys.stderr, flush=True)
    for index, (name, qids) in enumerate(refs.items()):
        if index and index % 1000 == 0:
            print(f'{key}: decoded {index} images', file=sys.stderr, flush=True)
        entry = {'bank': key, 'name': name, 'questionIds': sorted(set(qids))}
        report['checked'] += 1
        path = reader._resolve_qbank_media_path(key, qids[0], name)
        try:
            if path:
                stamp = str(path)
                if stamp in cache:
                    if cache[stamp] is not None:
                        raise ValueError(cache[stamp])
                    data = None
                else:
                    data = reader._decrypt_media(path.name, path.read_bytes())
            else:
                data = bridge['recover_media'](key, qids[0], name).body
                report['recovered'].append(entry)
                summary['recovered'] += 1
            if data is not None:
                if name.lower().endswith('.svg'):
                    ElementTree.fromstring(data)
                else:
                    with Image.open(io.BytesIO(data)) as image:
                        image.load()
                if path:
                    cache[str(path)] = None
            summary['valid'] += 1
            report['valid'] += 1
        except Exception as error:
            reason = str(getattr(error, 'detail', None) or error)
            entry['reason'] = reason
            bucket = 'missing' if not path else 'damaged'
            if path:
                cache[str(path)] = reason
            report[bucket].append(entry)
            summary[bucket] += 1
    report['banks'].append(summary)
print(json.dumps(report, indent=2))
