"""Reviewed classification corrections; question IDs and clinical content stay intact."""
MOVES={
1000396:(5,'Guillain-Barre syndrome'),1000397:(5,'Guillain-Barre syndrome'),
1000425:(5,'Epilepsy'),1000426:(5,'Stroke'),1000434:(5,'Epilepsy'),
1000457:(5,'Cerebrovascular screening'),1000458:(5,'Subarachnoid hemorrhage'),
1000459:(6,'Spinal disorders'),1000460:(5,'Multiple sclerosis'),1000461:(5,'CNS infection'),
1000463:(5,'Headache'),1000464:(6,'Spinal disorders'),1000542:(5,'Guillain-Barre syndrome'),
1000573:(5,'Neurologic anatomy'),1000579:(6,'Spinal tumors'),1000580:(5,'CNS infection'),
1000582:(5,'Raised intracranial pressure'),1000600:(5,'Multiple sclerosis'),
1000713:(5,'Movement disorders'),1000714:(5,'Neuromuscular disorders'),1000715:(5,'Myopathies'),
1000726:(5,'Neurologic anatomy'),1000737:(5,'CNS infection'),1000738:(5,'Movement disorders'),
1000801:(5,'Headache'),1000802:(5,'CNS infection'),1000803:(5,'Movement disorders'),
1000813:(5,'Multiple sclerosis'),1000838:(5,'Guillain-Barre syndrome'),1000839:(5,'Stroke'),
1000992:(5,'Stroke'),1001348:(5,'Stroke'),1001682:(5,'Stroke'),
1001168:(6,'Raised intracranial pressure'),1001679:(6,'Raised intracranial pressure'),
1001283:(8,'Preoperative assessment'),1001588:(8,'Preoperative assessment'),
}
# False-positive topic assignments inside IM; these remain medical questions.
REPAIRS={1000040:'Electrolytes & Acid-Base',1000428:'Pleural & Pulmonary Vascular Disease',1000531:'Kidney Injury & Chronic Kidney Disease',
1000017:'Respiratory Failure & Interstitial Disease',1000074:'Pulmonary Infection',1000076:'Respiratory Failure & Interstitial Disease',
1000172:'Heart Failure & Hypertension',1000139:'Rheumatology',1000657:'Rheumatology',1000821:'Rheumatology',
1000222:'Rheumatology',1000638:'Rheumatology',1000683:'Rheumatology'}

def migrate(bank):
    subjects={s['id']:s['name'] for s in bank['subjects']}
    lookup={(q['subject_id'],q['system']):(q['system_id'],q['system_group']) for q in bank['questions']}
    next_system=max(q['system_id'] for q in bank['questions'])+1
    report=[]
    for q in bank['questions']:
        target=MOVES.get(q['id'])
        if not target and q['id'] in REPAIRS:target=(1,REPAIRS[q['id']])
        if not target:continue
        sid,topic=target
        before={k:q[k] for k in ['subject_id','subject','system_id','system','system_group','topic']}
        if (sid,topic) not in lookup:
            lookup[(sid,topic)]=(next_system,topic);next_system+=1
        system_id,group=lookup[(sid,topic)]
        q['classificationHistory']=[before]
        q.update(subject_id=sid,subject=subjects[sid],system_id=system_id,system=topic,system_group=group,group=group,topic=topic)
        report.append({'id':q['id'],'displayId':q['displayId'],'from':before,'toSubject':subjects[sid],'toTopic':topic,'movedSubject':before['subject_id']!=sid})
    assert len(report)==len(MOVES)+len(REPAIRS),'Every reviewed classification correction must match a question'
    return report
