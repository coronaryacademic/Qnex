
const fs = require('fs');

// Mock parser function from question-base.js
function parseSessionText(text) {
    // Normalize line endings
    text = text.replace(/\r\n/g, "\n");
    
    const chunks = text.split(/Question title:/g);
    const questions = [];
    
    // Skip first empty chunk if text starts with "Question title:"
    for (let i = 0; i < chunks.length; i++) {
        let chunk = chunks[i].trim();
        if (!chunk) continue;
        
        const q = {
            id: i.toString(),
            title: "Untitled",
            text: "",
            options: [],
            explanation: "",
        };
        
        const contextIdx = chunk.indexOf("Question context:");
        const optionsIdx = chunk.indexOf("Question options:");
        const explIdx = chunk.indexOf("Question explanation:");
        
        let titleEnd = chunk.length;
        if (contextIdx !== -1) titleEnd = Math.min(titleEnd, contextIdx);
        else if (optionsIdx !== -1) titleEnd = Math.min(titleEnd, optionsIdx);
        
        q.title = chunk.substring(0, titleEnd).trim() || "Untitled Question";
        
        if (contextIdx !== -1) {
            let contextEnd = chunk.length;
            if (optionsIdx !== -1) contextEnd = Math.min(contextEnd, optionsIdx);
            else if (explIdx !== -1) contextEnd = Math.min(contextEnd, explIdx);
            
            let contextText = chunk.substring(contextIdx + "Question context:".length, contextEnd).trim();
            q.text = contextText.replace(/\n/g, "<br>");
        }
        
        if (optionsIdx !== -1) {
            let optionsEnd = chunk.length;
            if (explIdx !== -1) optionsEnd = Math.min(optionsEnd, explIdx);
            
            const optionsBlock = chunk.substring(optionsIdx + "Question options:".length, optionsEnd).trim();
            const optionLines = optionsBlock.split("\n");
            
            optionLines.forEach((line, idx) => {
                line = line.trim();
                if (!line) return;
                
                const isCorrect = line.startsWith("*");
                if (isCorrect) line = line.substring(1).trim();
                
                // Strip prefixes logic
                line = line.replace(/^(\([A-Za-z0-9]+\)|[A-Za-z0-9]+\.)\s*/, "");
                
                q.options.push({
                    text: line,
                    isCorrect: isCorrect
                });
            });
        }
        
        if (explIdx !== -1) {
            q.explanation = chunk.substring(explIdx + "Question explanation:".length).trim();
        }
        
        if (q.options.length > 0) {
             questions.push(q);
        }
    }
    
    return questions;
}

const input = `Question title:
Prerenal AKI physiology

Question context:
A 72-year-old man presents with 3 days of vomiting and diarrhea. Blood pressure is 85/50 mmHg. Creatinine increased from 0.9 to 2.1 mg/dL. Urinalysis is bland with no casts.

Question options:
  *(A) Increased proximal tubular sodium and water reabsorption
  (B) Acute tubular epithelial necrosis
  (C) Immune complex deposition in glomeruli
  (D) Postrenal obstruction

Question explanation:
Hypoperfusion activates RAAS and sympathetic tone, causing avid sodium and water reabsorption. Findings include FeNa <1%, concentrated urine, and bland sediment, consistent with prerenal azotemia.`;

const result = parseSessionText(input);
console.log(JSON.stringify(result, null, 2));
