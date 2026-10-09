"""Read-only AMBOSS question facets, derived from shipped source references."""
import contextlib
from pathlib import Path
import re
import sqlite3

_cache = {}
_cards = re.compile(r'data-learningcard-id\s*=\s*[\"\x27]([^\"\x27]+)', re.I)


def enrich(reader, root, bank, result, excluded, archive_pool):
    db = reader._resolve_bank(bank).db_path
    library = Path(root) / 'data' / 'amboss' / 'amboss-2025.db'
    signature = (str(db), db.stat().st_mtime_ns,
                 library.stat().st_mtime_ns if library.exists() else None)
    if signature not in _cache:
        cards = {}
        if library.exists():
            with contextlib.closing(sqlite3.connect(f'file:{library}?mode=ro', uri=True)) as conn:
                for doc_id, title, path in conn.execute('SELECT id,title,path FROM Docs'):
                    if path:
                        cards[Path(path).stem] = (doc_id, title)
        valid = reader._valid_ids(bank)
        questions, articles = {}, {}
        with contextlib.closing(reader._conn(bank)) as conn:
            for row in conn.execute('SELECT id,question,explanation,parentQId FROM Questions'):
                qid = row['id']
                if qid not in valid or row['parentQId']:
                    continue
                stem = reader._decrypt_qbank_html(qid, row['question'])
                explanation = reader._decrypt_qbank_html(qid, row['explanation'])
                refs = set()
                for card in _cards.findall(stem + explanation):
                    if card in cards:
                        doc_id, title = cards[card]
                        refs.add(doc_id)
                        articles[doc_id] = title
                questions[qid] = dict(articles=sorted(refs), hasImage=bool(
                    re.search(r'<img\b|data-type=[\"\x27]image', stem + explanation, re.I)))
        _cache[signature] = questions, articles
    questions, article_titles = _cache[signature]
    items = [dict(item, **questions[item['id']]) for item in result['items']
             if item['id'] in questions]
    counts = {}
    seen = set()
    for item in items:
        if item['id'] in seen:
            continue
        seen.add(item['id'])
        for article in item['articles']:
            counts[article] = counts.get(article, 0) + 1
    result.update(items=items, articles=sorted(
        [dict(id=key, name=article_titles[key], count=count) for key, count in counts.items()],
        key=lambda article: article['name'].casefold()),
        articleLinkBasis='Source article links in question stems and explanations',
        articlesAvailable=library.exists(), symptomsAvailable=False)
    # Counts describe supported items; the builder expands reviewed case units.
    for facet, field in [('subjects', 'subject'), ('systems', 'system')]:
        for option in result[facet]:
            option['count'] = len({item['id'] for item in items if item[field] == option['id']})
        result[facet] = [option for option in result[facet] if option['count']]
    return result
