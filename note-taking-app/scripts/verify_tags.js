
const CT_TAG_OPTIONS = {
    subject: ['Pathology', 'Pharmacology', 'Anatomy', 'Physiology', 'Microbiology', 'Immunology', 'Biochemistry', 'Genetics', 'Epidemiology', 'Biostatistics', 'Embryology', 'History taking', 'Physical examination'],
    system:  ['Cardiology', 'Pulmonology', 'Nephrology', 'Gastroenterology', 'Neurology', 'Hematology', 'Endocrinology', 'Rheumatology', 'Infectious Disease', 'Dermatology', 'Musculoskeletal', 'Reproductive', 'Renal'],
    major:   ['Internal Medicine', 'Surgery', 'Pediatrics', 'OB/GYN', 'Psychiatry', 'Family Medicine', 'Emergency Medicine'],
    minor:   ['Orthopedics', 'Anesthesia', 'Neurosurgery', 'Cardiothoracic Surgery', 'Vascular Surgery', 'Urology', 'ENT', 'Plastic Surgery', 'Intensive Care', 'Radiology', 'Palliative Care'],
};

function _ctGetTagsFromNumericId(idStr) {
    if (!idStr) return null;
    const tags = { subject: [], system: [], major: [], minor: [] };
    
    if (idStr.includes('.')) {
        const parts = idStr.replace('QNX-', '').split('.');
        const cats = ['subject', 'system', 'major', 'minor'];
        cats.forEach((cat, i) => {
            const valStr = parts[i];
            if (valStr && valStr !== '0') {
                const id = parseInt(valStr);
                if (id > 0 && CT_TAG_OPTIONS[cat][id - 1]) {
                    tags[cat].push(CT_TAG_OPTIONS[cat][id - 1]);
                }
            }
        });
        return tags;
    }

    const clean = idStr.replace(/\D/g, '');
    if (clean.length < 1) return null;

    let remaining = clean;
    const categories = ['subject', 'system', 'major', 'minor'];
    
    for (const cat of categories) {
        if (remaining.length === 0) break;
        
        const twoDigits = parseInt(remaining.substring(0, 2));
        const oneDigit = parseInt(remaining.substring(0, 1));
        
        let id = -1;
        let consumed = 0;
        
        if (twoDigits > 0 && twoDigits <= CT_TAG_OPTIONS[cat].length) {
            if (twoDigits >= 10) {
                id = twoDigits;
                consumed = 2;
            } else {
                id = oneDigit;
                consumed = 1;
            }
        } else if (oneDigit > 0 && oneDigit <= CT_TAG_OPTIONS[cat].length) {
            id = oneDigit;
            consumed = 1;
        } else {
            consumed = 1;
        }
        
        if (id !== -1) {
            const tagName = CT_TAG_OPTIONS[cat][id - 1];
            if (tagName) tags[cat].push(tagName);
        }
        remaining = remaining.substring(consumed);
    }
    
    return tags;
}

const testIds = ['00001126', '00006438', '00004271', '120000'];
testIds.forEach(id => {
    console.log(`ID: ${id}`);
    console.log(JSON.stringify(_ctGetTagsFromNumericId(id), null, 2));
    console.log('---');
});
