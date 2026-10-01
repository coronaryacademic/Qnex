"""Read-only JSON-lines bridge to the installed MedOS content reader.

Only content functions are used; MedOS accounts, sessions and progress are never
opened. Qnex owns the worker process and persists its own sessions separately.
"""
import base64
import contextlib
import json
import os
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
    for field, table in [('subject', 'Subjects'), ('system', 'Systems')]:
        mapping = {r['id']: r['name'] for r in conn.execute(f'SELECT id, name FROM {table}')}
        ids = reader._parse_amboss_taxonomy_ids(question.get(field + '_id'))
        names = [mapping[i] for i in ids if i in mapping] or ['General']
        question[field + '_names'] = names
        if field == 'system':
            question['system_groups'] = list(dict.fromkeys(reader._system_group(n) for n in names))
    return question


def dispatch(req):
    action = req.get('action')
    if action == 'catalog':
        reader.reset_bank_registry()
        banks = []
        for key, info in reader._bank_registry().items():
            try:
                with contextlib.closing(connection(key)) as conn:
                    count = conn.execute('SELECT COUNT(*) FROM Questions').fetchone()[0]
                banks.append(dict(key=key, label=info.label, category=info.category,
                                  step=info.step, subject=info.subject, form=info.form, count=count))
            except (ValueError, sqlite3.Error):
                continue
        return {'banks': banks}
    bank = str(req.get('bank', ''))
    if action == 'filters':
        with contextlib.closing(connection(bank)) as conn:
            subjects = {r['id']: dict(id=r['id'], name=r['name'], count=0) for r in conn.execute('SELECT id,name FROM Subjects')}
            systems = {r['id']: dict(id=r['id'], name=r['name'], count=0) for r in conn.execute('SELECT id,name FROM Systems')}
            items = []
            for row in conn.execute('SELECT id,subId,sysId FROM Questions'):
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
        limit = min(100, max(1, int(req.get('count', 10))))
        clauses, values = [], []
        for field, column in [('subject', 'subId'), ('system', 'sysId')]:
            if req.get(field) not in (None, ''):
                clauses.append(f'{column}=?')
                values.append(int(req[field]))
        where = ' WHERE ' + ' AND '.join(clauses) if clauses else ''
        excluded = {int(qid) for qid in req.get('exclude', [])}
        included = {int(qid) for qid in req['ids']} if 'ids' in req else None
        questions, skipped = [], 0
        with contextlib.closing(connection(bank)) as conn:
            ids = [r[0] for r in conn.execute('SELECT id FROM Questions' + where + ' ORDER BY RANDOM()', values)
                   if r[0] not in excluded and (included is None or r[0] in included)]
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
        with contextlib.closing(connection(bank)) as conn:
            q = taxonomy_names(conn, reader._fetch_full_question(conn, qid, bank))
            return {'question': q}
    if action == 'media':
        # Validate bank against the selected installation before resolving assets.
        with contextlib.closing(connection(bank)):
            pass
        name = str(req.get('name', ''))
        if Path(name).name != name or '/' in name or '\\' in name:
            raise ValueError('Invalid media filename.')
        response = reader.media(int(req['qid']), name, bank)
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
        response = {'id': request.get('id'), 'error': str(getattr(exc, 'detail', None) or exc)}
    print(json.dumps(response, ensure_ascii=True), flush=True)
