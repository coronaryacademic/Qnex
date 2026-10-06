import json
from pathlib import Path
p=Path(__file__).resolve().parents[1]/'reports/bau-specialties/matching.json'
rows=json.loads(p.read_text(encoding='utf-8'))
items=[
 (54,15,'movement', 'Movement disorders', ['Multiple system atrophy','Progressive supranuclear palsy','Parkinson disease','Dementia with Lewy bodies'], [
 ('Parkinsonism with prominent early autonomic dysfunction, including urinary dysfunction',1),
 ('Parkinsonism with vertical supranuclear gaze palsy and early falls',2),
 ('Initially asymmetric bradykinesia and rigidity with a typical levodopa response',3),
 ('Dementia developing before or within one year of parkinsonism, with cognitive fluctuations and visual hallucinations',4)],
 'Early autonomic failure suggests MSA; vertical gaze palsy suggests PSP; asymmetric onset is typical of Parkinson disease. Dementia timing, fluctuations, and hallucinations distinguish dementia with Lewy bodies. The source descriptions were clarified because symmetry alone is insufficient.'),
 (54,39,'2','Headache',['Migraine','Cluster headache','Tension-type headache','Transient ischemic attack','Idiopathic intracranial hypertension','Giant cell arteritis'],[
 ('Recurrent headache lasting 1–3 days, preceded by reversible zigzag visual phenomena',1),
 ('Repeated 15–180-minute attacks of severe unilateral orbital pain with ipsilateral lacrimation and rhinorrhea',2),
 ('Headache and papilledema after imaging excludes a mass and venous thrombosis; lumbar puncture shows raised opening pressure with normal CSF composition',5),
 ('A 75-year-old with new headache, jaw claudication, scalp tenderness, and transient visual loss',6)],
 'The original six-option shared list is preserved. Duration and diagnostic context were clarified: papilledema alone does not establish idiopathic intracranial hypertension, and new headache with ischemic visual symptoms in an older patient requires urgent assessment for GCA.'),
 (43,64,'definitions','Movement disorders',['Tremor','Ballismus','Dystonia','Tics'],[
 ('Rhythmic oscillatory movement of a body part',1),
 ('Large-amplitude flinging movements, predominantly of proximal limbs',2),
 ('Sustained or intermittent muscle contractions causing twisting movements or abnormal postures',3),
 ('Sudden, recurrent, nonrhythmic movements or vocalizations, often temporarily suppressible',4)],
 'Tremor is rhythmic; ballismus is flinging; dystonia produces patterned twisting or abnormal postures; tics are recurrent movements or vocalizations. A shared list was constructed from the source definitions and answers.')]
for source,page,number,topic,choices,branches,explanation in items:
 if any(r['source']==source and r['original']==number for r in rows):continue
 rows.append(dict(source=source,page=page,original=number,subject=5,topic=topic,stem='Match each description to the best diagnosis or term. Use the same answer list for every part.',choices=choices,matching=[dict(prompt=t,correct=c) for t,c in branches],explanation=explanation))
p.write_text(json.dumps(rows,ensure_ascii=False,indent=2),encoding='utf-8')
