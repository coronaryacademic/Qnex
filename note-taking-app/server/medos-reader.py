"""Read-only JSON-lines bridge to the installed MedOS content reader.

Only content functions are used; MedOS accounts, sessions and progress are never
opened. Qnex owns the worker process and persists its own sessions separately.
"""
import base64
import contextlib
import json
import os
import re
from pathlib import Path
import sqlite3
import sys

sys.dont_write_bytecode = True
ROOT = Path(sys.argv[1]).resolve()
os.environ['MEDOS_ROOT'] = str(ROOT)
sys.path.insert(0, str(ROOT / 'app' / 'backend'))


def read_only(event, args):
    if event == 'open':
        mode, flags = args[1], args[2]
        if (isinstance(mode, str) and any(c in mode for c in 'wax+')) or (
            isinstance(flags, int) and flags & (os.O_WRONLY | os.O_RDWR | os.O_CREAT | os.O_TRUNC)
        ):
            raise PermissionError('The Qnex content reader is read-only.')
    if event == 'sqlite3.connect':
        if 'mode=ro' not in str(args[0]):
            raise PermissionError('Only read-only content databases are allowed.')


sys.addaudithook(read_only)
with contextlib.redirect_stdout(sys.stderr):
    import qbank_reader as reader


def connection(bank):
    info = reader._resolve_bank(bank)
    if not info.db_path.resolve().is_relative_to(ROOT / 'data'):
        raise ValueError('This bank is outside the connected MedOS data folder.')
    return reader._conn(bank)


def taxonomy_names(conn, question):
    if not question:
        return question
    question['answer_percentages'] = [row['correctPercentage'] for row in conn.execute(
        'SELECT correctPercentage FROM Answers WHERE qId=? ORDER BY answerId', (question['id'],)
    )]
    for field, table in [('subject', 'Subjects'), ('system', 'Systems')]:
        mapping = {r['id']: r['name'] for r in conn.execute(f'SELECT id, name FROM {table}')}
        ids = reader._parse_amboss_taxonomy_ids(question.get(field + '_id'))
        names = [mapping[i] for i in ids if i in mapping] or ['General']
        question[field + '_names'] = names
        if field == 'system':
            question['system_groups'] = list(dict.fromkeys(reader._system_group(n) for n in names))
    return question


_media_recovery_index = {}


def validate_media_bytes(name, data):
    """Check decrypted image pixels before serving a broken preview."""
    suffix = Path(name).suffix.lower()
    if suffix in {'.jpg', '.jpeg', '.png', '.gif', '.webp'}:
        import io
        from PIL import Image
        with Image.open(io.BytesIO(data)) as image:
            image.load()
    elif suffix == '.svg':
        from xml.etree import ElementTree
        ElementTree.fromstring(data)


def recover_media(bank, qid, name):
    """Recover an exact asset from alternate source folders, never a lookalike."""
    global _media_recovery_index
    try:
        response = reader.media(qid, name, bank)
        validate_media_bytes(name, response.body)
        return response
    except Exception as original:
        roots = [reader._bank_dir(bank)]
        if str(bank).startswith('amboss'):
            roots.extend(directory for directory in (ROOT / 'data').iterdir()
                         if directory.is_dir() and 'amboss' in directory.name.lower())
        # Hash/UUID filenames identify exact assets across shared library folders.
        # Short clinical filenames remain confined to their own source bank.
        if re.search(r'[0-9a-f]{12,}|[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}', name, re.I):
            roots.append(ROOT / 'data')
        candidates = []
        for directory in dict.fromkeys(roots):
            cache_key = str(directory)
            if cache_key not in _media_recovery_index:
                index = {}
                for folder, _, files in os.walk(directory):
                    for filename in files:
                        index.setdefault(filename.lower(), []).append(Path(folder) / filename)
                _media_recovery_index[cache_key] = index
            candidates.extend(_media_recovery_index[cache_key].get(name.lower(), []))
        for path in candidates:
            try:
                data = reader._decrypt_media(path.name, path.read_bytes())
                if not data:
                    continue
                validate_media_bytes(name, data)
                from starlette.responses import Response
                return Response(data, media_type=reader._media_type(name))
            except Exception:
                continue
        raise original

def archived_ids(bank):
    archive = json.loads(Path(__file__).with_name('media-archive.json').read_text(encoding='utf-8'))
    if Path(archive['sourceRoot']).resolve() != ROOT:
        return set()
    return set(archive.get('banks', {}).get(bank, {}).get('questionIds', []))


def dispatch(req):
    action = req.get('action')
    if action == 'archive':
        groups = []
        for key, info in reader._bank_registry().items():
            ids = archived_ids(key)
            if not ids:
                continue
            with contextlib.closing(connection(key)) as conn:
                items = [dict(id=r['id'], title=r['title'] or f"Question #{r['id']}")
                         for r in conn.execute('SELECT id,title FROM Questions ORDER BY id') if r['id'] in ids]
            groups.append(dict(bank=key, label=info.label, questions=items))
        return {'groups': groups, 'count': sum(len(g['questions']) for g in groups)}
    if action == 'archive_detail':
        bank, qid = str(req.get('bank', '')), int(req.get('qid', 0))
        if qid not in archived_ids(bank):
            raise ValueError('Question is not in CQB.')
        with contextlib.closing(connection(bank)) as conn:
            return {'question': taxonomy_names(conn, reader._fetch_full_question(conn, qid, bank))}
    if action == 'catalog':
        reader.reset_bank_registry()
        banks = []
        for key, info in reader._bank_registry().items():
            try:
                with contextlib.closing(connection(key)) as conn:
                    source_count = conn.execute('SELECT COUNT(*) FROM Questions').fetchone()[0]
                    existing = {r[0] for r in conn.execute('SELECT id FROM Questions')}
                    archived = len(existing & archived_ids(key))
                    count = source_count - archived
                banks.append(dict(key=key, label=info.label, category=info.category,
                                  step=info.step, subject=info.subject, form=info.form, count=count,
                                  archivedCount=archived, sourceCount=source_count))
                if archived:
                    banks.append(dict(key=key + '--archived', label=info.label + ' · Archived',
                                      category=info.category, step=info.step, subject=info.subject,
                                      form=info.form, count=archived, isArchived=True, sourceBank=key))
            except (ValueError, sqlite3.Error):
                continue
        return {'banks': banks}
    bank = str(req.get('bank', ''))
    archive_pool = bank.endswith('--archived')
    if archive_pool:
        bank = bank[:-len('--archived')]
    archived = archived_ids(bank)
    if archive_pool and not archived:
        raise ValueError('No archived questions exist for this bank.')
    if action == 'filters':
        with contextlib.closing(connection(bank)) as conn:
            subjects = {r['id']: dict(id=r['id'], name=r['name'], count=0) for r in conn.execute('SELECT id,name FROM Subjects')}
            systems = {r['id']: dict(id=r['id'], name=r['name'], count=0) for r in conn.execute('SELECT id,name FROM Systems')}
            items = []
            for row in conn.execute('SELECT id,subId,sysId FROM Questions'):
                if (row['id'] not in archived) if archive_pool else (row['id'] in archived):
                    continue
                sub_ids = reader._parse_amboss_taxonomy_ids(row['subId']) or [0]
                sys_ids = reader._parse_amboss_taxonomy_ids(row['sysId']) or [0]
                for sid in sub_ids:
                    subjects.setdefault(sid, dict(id=sid, name='General', count=0))['count'] += 1
                for sid in sys_ids:
                    systems.setdefault(sid, dict(id=sid, name='General', count=0))['count'] += 1
                for sub in sub_ids:
                    for sys_id in sys_ids:
                        items.append(dict(id=row['id'], subject=sub, system=sys_id,
                                          group=reader._system_group(systems[sys_id]['name']) or 'General'))
            result = dict(subjects=sorted((s for s in subjects.values() if s['count']), key=lambda s: s['name']),
                          systems=sorted((s for s in systems.values() if s['count']), key=lambda s: s['name']),
                          items=items, amboss=reader._is_amboss_qbank(bank))
        return result
    if action == 'questions':
        limit = max(1, int(req.get('count', 10)))
        clauses, values = [], []
        for field, column in [('subject', 'subId'), ('system', 'sysId')]:
            if req.get(field) not in (None, ''):
                clauses.append(f'{column}=?')
                values.append(int(req[field]))
        where = ' WHERE ' + ' AND '.join(clauses) if clauses else ''
        excluded = {int(qid) for qid in req.get('exclude', [])} | (set() if archive_pool else archived)
        included = {int(qid) for qid in req['ids']} if 'ids' in req else None
        questions, skipped = [], 0
        with contextlib.closing(connection(bank)) as conn:
            ids = [r[0] for r in conn.execute('SELECT id FROM Questions' + where + ' ORDER BY RANDOM()', values)
                   if r[0] not in excluded and (not archive_pool or r[0] in archived) and (included is None or r[0] in included)]
            for qid in ids:
                q = reader._fetch_full_question(conn, qid, bank)
                # Linked case sequences need their own ordered session flow.
                if not q or not q.get('quality', {}).get('valid') or q.get('parentQId'):
                    skipped += 1
                    continue
                questions.append(taxonomy_names(conn, q))
                if len(questions) == limit:
                    break
        return {'questions': questions, 'skipped': skipped, 'matching': len(ids)}
    if action == 'question_list':
        limit = max(1, min(10000, int(req.get('limit', 5000))))
        with contextlib.closing(connection(bank)) as conn:
            subjects = {r['id']: r['name'] for r in conn.execute('SELECT id,name FROM Subjects')}
            systems = {r['id']: r['name'] for r in conn.execute('SELECT id,name FROM Systems')}
            cursor = conn.execute(
                'SELECT q.id, q.title, q.subId, q.sysId '
                'FROM Questions q '
                'ORDER BY q.id LIMIT ?',
                (limit,)
            )
            items = []
            for r in cursor.fetchall():
                if (r['id'] not in archived) if archive_pool else (r['id'] in archived):
                    continue
                title = (r['title'] or '').strip()
                sub = ', '.join(subjects[i] for i in reader._parse_amboss_taxonomy_ids(r['subId']) if i in subjects)
                sys_name = ', '.join(systems[i] for i in reader._parse_amboss_taxonomy_ids(r['sysId']) if i in systems)
                if not title:
                    title = f"{sub or 'Question'} #{r['id']}"
                items.append({
                    'id': r['id'],
                    'title': title,
                    'subject': sub or 'General',
                    'system': sys_name or 'General'
                })
        return {'questions': items}
    if action == 'question_detail':
        qid = int(req.get('qid', 0))
        if archive_pool and qid not in archived:
            raise ValueError('Question is not in this Archived bank.')
        if qid in archived and not archive_pool:
            from fastapi import HTTPException
            raise HTTPException(410, 'This question is archived because source images are missing.')
        with contextlib.closing(connection(bank)) as conn:
            q = taxonomy_names(conn, reader._fetch_full_question(conn, qid, bank))
            return {'question': q}
    if action == 'exhibit':
        exhibit_id = str(req.get('exhibitId', ''))
        with contextlib.closing(connection(bank)):
            pass
        found = reader._exhibit_html_for_qid(bank, exhibit_id, int(req.get('qid', 0)))
        if not found:
            found = reader._exhibit_html(bank, exhibit_id)
        if not found:
            raise ValueError('Exhibit not found in the source bank.')
        owner_qid, fragment = found
        return {'qid': owner_qid, 'html': fragment}
    if action == 'media':
        # Validate bank against the selected installation before resolving assets.
        with contextlib.closing(connection(bank)):
            pass
        name = str(req.get('name', ''))
        if Path(name).name != name or '/' in name or '\\' in name:
            raise ValueError('Invalid media filename.')
        response = recover_media(bank, int(req['qid']), name)
        return {'body': base64.b64encode(response.body).decode('ascii'), 'type': response.media_type}
    raise ValueError('Unknown library operation.')


for line in sys.stdin:
    request = {}
    try:
        request = json.loads(line)
        with contextlib.redirect_stdout(sys.stderr):
            result = dispatch(request)
        response = {'id': request['id'], 'result': result}
    except Exception as exc:
        response = {'id': request.get('id'), 'error': str(getattr(exc, 'detail', None) or exc), 'status': getattr(exc, 'status_code', 400)}
    print(json.dumps(response, ensure_ascii=True), flush=True)
