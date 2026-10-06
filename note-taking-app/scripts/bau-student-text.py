"""Keep import/editing provenance out of learner-facing question text."""
import re, html

def student_text(q):
    old=q['explanation']
    text=old
    if q.get('editorial'):
        # Clinical qualifications remain; only production commentary is removed.
        text=re.sub(r"(?:The (?:source(?:'s)?|original|uncertain source|native source|supplied|vague source|older source)[^.]*|Duplicate correct options[^.]*|A shared list was constructed[^.]*)\.(?:\s*|$)",'',text)
        text=re.sub(r';\s*(?:the source|the original)[^.]*\.', '.',text,flags=re.I)
        text=text.replace(' and was incorrectly excluded by the source','')
        text=text.replace('Great-toe extension is often loosely called dorsiflexion in recalled questions.','Great-toe extension helps assess L5 motor function.')
        text=text.replace('separate oral and IV steroid distractors made the original question ambiguous.','')
        text=text.replace('warfarin is the anticoagulant among the original listed options.','warfarin is the anticoagulant among the listed options.')
        text=text.replace('Duration and diagnostic context were clarified: papilledema alone','Papilledema alone')
        text=text.replace('Meningiomas are more strongly associated with NF2, so the source\'s combined wording was corrected.','Meningiomas are more strongly associated with NF2.')
        text=text.replace('the supplied single image','this single image')
        text=text.replace('Headache is common but the source substituted it for the mental-status component.','Headache is also common.')
        text=re.sub(r'\s+',' ',text).strip()
    # A few older imported explanations also contain explicit production notes.
    text=re.sub(r',?\s*but this was the original\s+exam question\.', '.',text)
    text=re.sub(r'Note: Multicentric disease[^.]*original source\.', '',text,flags=re.S)
    text=re.sub(r'I couldn.t find a reliable source[^\n]*\n[^\n]*ChatGPT states:', '',text)
    if text!=old:
        q.setdefault('editorialNotes',{})['previousExplanation']=old
        q['explanation']=text
        q['explanation_html']='<p>'+html.escape(text).replace('\n','<br>')+'</p>'
    if q.get('editorial'):
        stem=q['stem']
        replacements={'The source axial spinal MRI':'The axial spinal MRI below','the supplied lumbar MRI image':'the lumbar MRI image below','The arrow-free source image':'The image below','the source figure':'the image below','The source shoulder radiograph':'The shoulder radiograph below','The source radiograph':'The radiograph below'}
        for a,b in replacements.items():stem=stem.replace(a,b)
        q['stem']=stem
        q['stem_html']=re.sub(r'^<p>.*?</p>','<p>'+html.escape(stem)+'</p>',q['stem_html'],count=1,flags=re.S)
    # Reference URLs remain in metadata; generic editing-reference links aren't
    # part of the learning explanation.
    q['explanation_html']=re.sub(r'<p><a [^>]*>Clinical review reference</a></p>','',q.get('explanation_html',''))
