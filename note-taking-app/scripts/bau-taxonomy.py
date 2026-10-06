"""Clinical systems contain focused topics; exam/source labels are provenance only."""
MAP={
5:{
 'Pituitary disorders':('Neuroendocrine disorders','Pituitary disorders'),
 'Headache':('Headache and facial pain','Headache disorders'),
 'Movement disorders':('Movement disorders','Movement disorders'),
 'Guillain-Barre syndrome':('Peripheral nerves and neuromuscular disorders','Guillain–Barré syndrome'),
 'Multiple sclerosis':('Demyelinating disorders','Multiple sclerosis'),
 'Neurologic anatomy':('Neurologic assessment and localization','Neuroanatomy and localization'),
 'Peripheral nerve disorders':('Peripheral nerves and neuromuscular disorders','Peripheral nerve disorders'),
 'Peripheral neuropathy':('Peripheral nerves and neuromuscular disorders','Peripheral neuropathy'),
 'Myopathies':('Peripheral nerves and neuromuscular disorders','Myopathies'),
 'Cerebrovascular screening':('Cerebrovascular disorders','Cerebrovascular screening'),
 'Neuromuscular disorders':('Peripheral nerves and neuromuscular disorders','Neuromuscular junction disorders'),
 'Stroke':('Cerebrovascular disorders','Stroke'),
 'Subarachnoid hemorrhage':('Cerebrovascular disorders','Subarachnoid hemorrhage'),
 'CNS infection':('CNS infections','Meningitis and CNS infection'),
 'Dementia':('Cognition and dementia','Dementia'),
 'Hydrocephalus':('CSF and intracranial pressure','Hydrocephalus'),
 'Epilepsy':('Seizures and epilepsy','Epilepsy'),
},
6:{
 'Spinal imaging':('Spine and spinal cord','Spinal imaging'),
 'Congenital spinal disorders':('Spine and spinal cord','Congenital spinal disorders'),
 'Spine and radiculopathy':('Spine and spinal cord','Disc disease and radiculopathy'),
 'Spinal disorders':('Spine and spinal cord','Spinal disorders'),
 'Spinal tumors':('Spine and spinal cord','Spinal tumors'),
 'Pituitary disorders':('Brain and pituitary tumors','Pituitary tumors'),
 'Brain tumors':('Brain and pituitary tumors','Brain tumors'),
 'Subarachnoid hemorrhage':('Cerebrovascular neurosurgery','Subarachnoid hemorrhage'),
 'Vascular malformations':('Cerebrovascular neurosurgery','Vascular malformations'),
 'Congenital disorders':('Congenital cranial disorders','Congenital cranial disorders'),
 'Hydrocephalus':('CSF and intracranial pressure','Hydrocephalus'),
},
7:{
 'Spine':('Spine and spinal cord','Spinal disorders'),
 'Spinal disorders':('Spine and spinal cord','Spinal disorders'),
 'Spinal deformity':('Spine and spinal cord','Spinal deformity'),
 'Spinal trauma':('Spine and spinal cord','Spinal trauma'),
 'Hand anatomy':('Hand and wrist','Hand anatomy'),
 'Hand disorders':('Hand and wrist','Hand disorders'),
 'Tendon injuries':('Hand and wrist','Tendon injuries'),
 'Hip disorders':('Hip and pelvis','Hip disorders'),
 'Hip examination':('Hip and pelvis','Hip examination'),
 'Hip fractures':('Hip and pelvis','Hip fractures'),
 'Pelvic trauma':('Hip and pelvis','Pelvic trauma'),
 'Knee disorders':('Knee','Knee disorders'),
 'Knee examination':('Knee','Knee examination'),
 'Knee injuries':('Knee','Knee injuries'),
 'Shoulder anatomy':('Shoulder','Shoulder anatomy'),
 'Shoulder disorders':('Shoulder','Shoulder disorders'),
 'Shoulder examination':('Shoulder','Shoulder examination'),
 'Foot and ankle':('Foot and ankle','Foot and ankle disorders'),
 'Fractures':('Trauma and fracture care','Fractures'),
 'Fracture healing':('Trauma and fracture care','Fracture healing'),
 'Fracture mechanisms':('Trauma and fracture care','Fracture mechanisms'),
 'Fracture management':('Trauma and fracture care','Fracture management'),
 'Upper-limb trauma':('Trauma and fracture care','Upper-limb trauma'),
 'Lower-limb trauma':('Trauma and fracture care','Lower-limb trauma'),
 'Stress fractures':('Trauma and fracture care','Stress fractures'),
 'Orthopedic emergencies':('Trauma and fracture care','Orthopedic emergencies'),
 'Vascular examination':('Trauma and fracture care','Neurovascular assessment'),
 'Pediatric fractures':('Pediatric orthopedics','Pediatric fractures'),
 'Pediatric orthopedics':('Pediatric orthopedics','Developmental and pediatric disorders'),
 'Bone tumors':('Bone tumors','Bone tumors'),
 'Bone and joint infection':('Bone and joint infection','Bone and joint infection'),
 'Metabolic bone disease':('Metabolic bone disease','Metabolic bone disease'),
 'Degenerative joint disease':('Arthritis and soft tissue disorders','Degenerative joint disease'),
 'Soft tissue disorders':('Arthritis and soft tissue disorders','Soft tissue disorders'),
 'Peripheral nerve injuries':('Peripheral nerve injuries','Peripheral nerve injuries'),
 'Orthopedic procedures':('Perioperative orthopedic care','Orthopedic procedures'),
 'Perioperative pharmacology':('Perioperative orthopedic care','Perioperative pharmacology'),
},
8:{
 'Airway anatomy':('Airway and ventilation','Airway anatomy'),
 'Airway management':('Airway and ventilation','Airway management'),
 'Respiratory support':('Airway and ventilation','Respiratory support'),
 'Respiratory physiology':('Airway and ventilation','Respiratory physiology'),
 'General anesthesia':('General anesthesia and pharmacology','General anesthesia'),
 'Neuromuscular blockade':('General anesthesia and pharmacology','Neuromuscular blockade'),
 'Perioperative pharmacology':('General anesthesia and pharmacology','Perioperative pharmacology'),
 'Pharmacology principles':('General anesthesia and pharmacology','Pharmacology principles'),
 'Regional anesthesia':('Regional and local anesthesia','Regional anesthesia'),
 'Local anesthesia':('Regional and local anesthesia','Local anesthesia'),
 'Fluid physiology':('Fluids and blood products','Fluid physiology'),
 'Fluid therapy':('Fluids and blood products','Fluid therapy'),
 'Transfusion':('Fluids and blood products','Blood products and transfusion'),
 'Blood products':('Fluids and blood products','Blood products and transfusion'),
 'Anticoagulant reversal':('Fluids and blood products','Anticoagulant reversal'),
 'Preoperative assessment':('Perioperative assessment and monitoring','Preoperative assessment'),
 'Monitoring':('Perioperative assessment and monitoring','Monitoring'),
 'Vascular access':('Perioperative assessment and monitoring','Vascular access'),
 'Recovery and analgesia':('Recovery and pain management','Recovery and analgesia'),
 'Pediatric anesthesia':('Obstetric and pediatric anesthesia','Pediatric anesthesia'),
 'Obstetric anesthesia':('Obstetric and pediatric anesthesia','Obstetric anesthesia'),
 'Resuscitation':('Resuscitation and anesthetic emergencies','Resuscitation'),
 'Malignant hyperthermia':('Resuscitation and anesthetic emergencies','Malignant hyperthermia'),
 'Shock':('Cardiovascular physiology and shock','Shock'),
 'Cardiovascular physiology':('Cardiovascular physiology and shock','Cardiovascular physiology'),
}}
FINAL={1:'Movement disorders',2:'Stroke',3:'Stroke',4:'Epilepsy',5:'Epilepsy',6:'Stroke',7:'Stroke',8:'Movement disorders',9:'Neurologic anatomy',10:'Epilepsy',11:'Peripheral nerve disorders',12:'Movement disorders',13:'Movement disorders',14:'Headache',15:'Congenital spinal disorders',16:'Neurologic anatomy',17:'Brain tumors',18:'Head and spinal injury',19:'Brain tumors',20:'Multiple sclerosis',21:'Spinal tumors',22:'Brain tumors',23:'Neurologic anatomy',24:'Head and spinal injury',25:'Cranial anatomy',26:'Peripheral neuropathy',27:'Head and spinal injury',28:'Subarachnoid hemorrhage',29:'Spine and radiculopathy',30:'Spine and radiculopathy',31:'Brain tumors',32:'Brain tumors',33:'Head and spinal injury',34:'Congenital spinal disorders',35:'Brain tumors',36:'Hydrocephalus',37:'Peripheral neuropathy',38:'Congenital spinal disorders',39:'Spine and radiculopathy',40:'Spinal anatomy',41:'Head and spinal injury',42:'Brain tumors',43:'Head and spinal injury',44:'Raised intracranial pressure',45:'Subarachnoid hemorrhage',46:'Epilepsy',47:'Headache',48:'Headache',49:'Headache',50:'Peripheral neuropathy',51:'Raised intracranial pressure',52:'Multiple sclerosis',53:'Guillain-Barre syndrome'}

def organize(questions):
    result=[]
    for q in questions:
        sid=q['subject_id']
        if sid not in MAP:continue
        topic=q['topic']
        if topic.endswith('final review'):
            topic=FINAL[int(q['sources'][0]['originalQuestionNumber'])]
        if topic=='Head and spinal injury':
            spinal=any(x in q['stem'].lower() for x in ['spinal cord injury','spinal cord injuries','spine injury','traumatic spinal','sacral segments'])
            group,topic=('Spine and spinal cord','Spinal trauma') if spinal else ('Head trauma','Head injury and assessment')
        elif topic in ['Raised intracranial pressure','Cranial anatomy','Spinal anatomy']:
            group={'Raised intracranial pressure':'CSF and intracranial pressure','Cranial anatomy':'Cranial anatomy and localization','Spinal anatomy':'Spine and spinal cord'}[topic]
        else:
            group,topic=MAP[sid][topic]
        q.setdefault('sourceTopic',q['topic'])
        result.append((q,group,topic))
    # Retain existing IDs for canonical leaves where possible; merge synonyms.
    used={q['system_id'] for q in questions if q['subject_id'] not in MAP}
    candidates={}
    for q,group,topic in result:candidates.setdefault((q['subject_id'],topic),[]).append(q['system_id'])
    next_id=max(q['system_id'] for q in questions)+1
    ids={}
    for key in sorted(candidates):
        available=sorted(set(candidates[key])-used)
        if available:system_id=available[0]
        else:system_id=next_id;next_id+=1
        ids[key]=system_id;used.add(system_id)
    for q,group,topic in result:
        q.update(system_id=ids[(q['subject_id'],topic)],system=topic,system_group=group,group=group,topic=topic)
    return [{'subject':sid,'system':group,'topics':sorted({topic for q,g,topic in result if q['subject_id']==sid and g==group})} for sid,group in sorted({(q['subject_id'],g) for q,g,t in result})]
