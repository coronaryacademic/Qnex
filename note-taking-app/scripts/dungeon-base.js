export default class DungeonBase {
    constructor() {
        this.el = {};
        this.state = {
            questions: [],
            currentIndex: 0,
            sessionId: this.generateSessionId(), // Unique ID for this question session
            answers: new Map(), // id -> { isCorrect: boolean, selectedId: string, submitted: boolean }
            selectedOption: null, // Temporary selection before submit
            sidebarCollapsed: false,
            activeHighlightColor: 'yellow', // Default highlighter color
            toolbarVisible: true,
            toolbarPosition: 'floating', // 'floating', 'top', 'bottom', 'left', 'right'
            unsavedChanges: false,
            splitView: false,
            isBlockRevealed: false,
            associatedSessionId: null,
            hideTimerUntilMinute: false, 
            floatingTimer: false,       
            contentAlignment: localStorage.getItem('dungeonContentAlignment') || 'left',
            viewer: {
                zoom: 1,
                x: 0,
                y: 0,
                rotation: 0,
                inverted: false,
                flipped: false,
                isDragging: false,
                startX: 0,
                startY: 0
            }
        };
        this.history = { past: [], future: [] };
        this.questionStartTime = 0;
        this.currentNote = null;
        this.labData = {
            "Blood": [
                { name: "Hemoglobin (Hb)", normal: "M: 13.5-17.5, F: 12.0-15.5 g/dL" },
                { name: "Hematocrit (Hct)", normal: "M: 41-50%, F: 36-44%" },
                { name: "RBC Count", normal: "M: 4.5-5.9, F: 4.1-5.1 million/uL" },
                { name: "MCV", normal: "80-100 fL" },
                { name: "MCHC", normal: "32-36 g/dL" },
                { name: "WBC Count", normal: "4,500-11,000/uL" },
                { name: "Platelet Count", normal: "150,000-450,000/uL" },
                { name: "EPO (Erythropoietin)", normal: "4-24 mU/mL" },
                { name: "Ferritin", normal: "M: 20-250, F: 10-120 ng/mL" },
                { name: "Serum Iron", normal: "60-170 ug/dL" },
                { name: "TIBC", normal: "240-450 ug/dL" },
                { name: "Transferrin Sat.", normal: "20-50%" },
                { name: "Vitamin B12", normal: "200-900 pg/mL" },
                { name: "Folate (B9)", normal: "2-20 ng/mL" },
                { name: "Vitamin B6", normal: "5-50 ug/L" },
                { name: "Reticulocyte Count", normal: "0.5-1.5% of RBCs" },
                { name: "Haptoglobin", normal: "30-200 mg/dL" },
                { name: "LDH", normal: "140-280 U/L" },
                { name: "Indirect Bilirubin", normal: "0.2-0.8 mg/dL" },
                { name: "Neutrophils", normal: "40 - 60%" },
                { name: "Lymphocytes", normal: "20 - 40%" },
                { name: "Monocytes", normal: "2 - 8%" },
                { name: "Eosinophils", normal: "1 - 4%" },
                { name: "Basophils", normal: "0.5 - 1%" },
                { name: "Erythrocyte Sedimentation Rate (ESR)", normal: "M: 0-15, F: 0-20 mm/hr" }
            ],
            "Electrolytes": [
                { name: "Sodium (Na+)", normal: "135 - 145 mEq/L" },
                { name: "Potassium (K+)", normal: "3.5 - 5.0 mEq/L" },
                { name: "Chloride (Cl-)", normal: "98 - 106 mEq/L" },
                { name: "Bicarbonate (HCO3)", normal: "22 - 28 mEq/L" },
                { name: "Calcium (Total)", normal: "8.5 - 10.5 mg/dL" },
                { name: "Calcium (Ionized)", normal: "4.6 - 5.3 mg/dL" },
                { name: "Magnesium (Mg)", normal: "1.5 - 2.5 mg/dL" },
                { name: "Phosphorus (PO4)", normal: "2.5 - 4.5 mg/dL" },
                { name: "Anion Gap", normal: "8 - 12 mEq/L" }
            ],
            "Kidney": [
                { name: "Blood Urea Nitrogen (BUN)", normal: "7 - 20 mg/dL" },
                { name: "Creatinine", normal: "0.6 - 1.2 mg/dL" },
                { name: "Glomerular Filtration Rate (GFR)", normal: "> 90 mL/min" },
                { name: "BUN/Creatinine Ratio", normal: "10:1 - 20:1" },
                { name: "Fractional Excretion of Sodium (FeNa)", normal: "< 1% (Prerenal), > 2% (ATN)" },
                { name: "Fractional Excretion of Urea (FeUrea)", normal: "< 35% (Prerenal)" },
                { name: "Urine Creatinine", normal: "M: 14-26, F: 11-20 mg/kg/day" },
                { name: "Urine Urea Nitrogen", normal: "12 - 20 g/24h" }
            ],
            "Liver / GI": [
                { name: "Alanine Aminotransferase (ALT)", normal: "7 - 56 U/L" },
                { name: "Aspartate Aminotransferase (AST)", normal: "10 - 40 U/L" },
                { name: "Alkaline Phosphatase (ALP)", normal: "44 - 147 U/L" },
                { name: "Bilirubin (Total)", normal: "0.1 - 1.2 mg/dL" },
                { name: "Bilirubin (Direct)", normal: "< 0.3 mg/dL" },
                { name: "Albumin", normal: "3.5 - 5.5 g/dL" },
                { name: "Total Protein", normal: "6.0 - 8.3 g/dL" },
                { name: "Amylase", normal: "23 - 85 U/L" },
                { name: "Lipase", normal: "0 - 160 U/L" },
                { name: "Lactate", normal: "0.5 - 1 mmol/L" },
                { name: "Ammonia", normal: "15 - 45 µg/dL" }
            ],
            "Vitals / Bedside": [
                { name: "Heart Rate (Pulse)", normal: "60 - 100 bpm" },
                { name: "Blood Pressure (Systolic)", normal: "90 - 120 mmHg" },
                { name: "Blood Pressure (Diastolic)", normal: "60 - 80 mmHg" },
                { name: "Mean Arterial Pressure (MAP)", normal: "70 - 105 mmHg" },
                { name: "Respiratory Rate", normal: "12 - 20 /min" },
                { name: "Temperature", normal: "36.5 - 37.5 °C" },
                { name: "Oxygen Saturation (O2 Sat)", normal: "> 95%" },
                { name: "BMI (Underweight)", normal: "< 18.5" },
                { name: "BMI (Normal)", normal: "18.5 - 24.9" },
                { name: "BMI (Overweight)", normal: "25 - 29.9" },
                { name: "BMI (Obese)", normal: "≥ 30" }
            ],
            "Hemodynamics": [
                { name: "Central Venous Pressure (CVP/JVP)", normal: "2 - 6 mmHg" },
                { name: "Pulmonary Capillary Wedge Pressure (PCWP)", normal: "6 - 12 mmHg" },
                { name: "Cardiac Output (CO)", normal: "4 - 8 L/min" },
                { name: "Cardiac Index (CI)", normal: "2.5 - 4.0 L/min/m²" },
                { name: "Systemic Vascular Resistance (SVR)", normal: "800 - 1200 dynes·s/cm⁵" },
                { name: "Pulmonary Vascular Resistance (PVR)", normal: "< 250 dynes·s/cm⁵" },
                { name: "Mixed Venous O2 (SvO2)", normal: "65 - 75%" },
                { name: "Ejection Fraction (LVEF)", normal: "55 - 70%" }
            ],
            "Coagulation": [
                { name: "Prothrombin Time (PT)", normal: "11 - 13.5 sec" },
                { name: "INR", normal: "0.8 - 1.1" },
                { name: "Partial Thromboplastin Time (PTT)", normal: "25 - 35 sec" },
                { name: "Bleeding Time", normal: "2 - 7 min" },
                { name: "Fibrinogen", normal: "200 - 400 mg/dL" },
                { name: "D-Dimer", normal: "< 500 ng/mL" }
            ],
            "Lipids": [
                { name: "Cholesterol (Total)", normal: "< 200 mg/dL" },
                { name: "LDL Cholesterol", normal: "< 100 mg/dL" },
                { name: "HDL Cholesterol", normal: "> 60 mg/dL" },
                { name: "Triglycerides", normal: "< 150 mg/dL" }
            ],
            "ABG (Arterial)": [
                { name: "pH", normal: "7.35 - 7.45" },
                { name: "PaCO2", normal: "35 - 45 mmHg" },
                { name: "PaO2", normal: "80 - 100 mmHg" },
                { name: "Bicarbonate (HCO3)", normal: "22 - 26 mEq/L" },
                { name: "Base Excess", normal: "-2 to +2 mEq/L" }
            ],
            "Urine": [
                { name: "Urine Output", normal: "0.5 - 1.5 mL/kg/hr" },
                { name: "Specific Gravity", normal: "1.005 - 1.030" },
                { name: "Urine pH", normal: "4.6 - 8.0" },
                { name: "Urine Osmolality", normal: "50 - 1200 mOsm/kg" },
                { name: "Urine Sodium", normal: "20 mEq/L" },
                { name: "Urine Protein", normal: "0 - 8 mg/dL" }
            ],
            "Endocrine": [
                { name: "Thyroid Stimulating Hormone (TSH)", normal: "0.4 - 4.0 mIU/L" },
                { name: "Free T4 (Thyroxine)", normal: "0.8 - 1.8 ng/dL" },
                { name: "Total T3 (Triiodothyronine)", normal: "80 - 200 ng/dL" },
                { name: "Estradiol (E2)", normal: "Follicular: 30-120, Luteal: 70-300 pg/mL" },
                { name: "Progesterone", normal: "Follicular: <1, Luteal: 2-25 ng/mL" },
                { name: "FSH", normal: "Varies by cycle phase" },
                { name: "LH", normal: "Varies by cycle phase" },
                { name: "Testosterone (Total, M)", normal: "300 - 1000 ng/dL" },
                { name: "Testosterone (Total, F)", normal: "15 - 70 ng/dL" },
                { name: "Prolactin", normal: "< 25 ng/mL" },
                { name: "Parathyroid Hormone (PTH)", normal: "10 - 65 pg/mL" },
                { name: "Cortisol (AM)", normal: "6 - 23 µg/dL" },
                { name: "Hemoglobin A1c (HbA1c)", normal: "< 5.7%" },
                { name: "Glucose (Fasting)", normal: "70 - 99 mg/dL" }
            ],
            "CSF": [
                { name: "Opening Pressure", normal: "6 - 20 cmH2O" },
                { name: "WBC", normal: "0 - 5 /µL" },
                { name: "Glucose", normal: "40 - 80 mg/dL" },
                { name: "Protein", normal: "15 - 45 mg/dL" }
            ]
        };
    }

    generateSessionId() {
        return `session_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    }

    init() {
        this.el.container = document.getElementById("dungeonBase");

        // Layout Migration / Enforcement
        if (this.el.container) {
            // 1. Remove obsolete Right Panel if present
            const oldRightPanel = this.el.container.querySelector('.dungeon-right-panel');
            if (oldRightPanel) {
                oldRightPanel.remove();
            }

            // 2. Ensure Sidebar & Main exist (Basic reset if totally missing)
            if (!this.el.container.querySelector('.dungeon-sidebar')) {
                this.el.container.innerHTML = `
              <!-- Topbar -->
              <div id="dungeonTopbar" class="dungeon-topbar">
                <div class="dungeon-topbar-left">
                  <button id="dungeonSidebarToggle" class="dungeon-topbar-btn" title="Toggle Sidebar">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
                  </button>
                  <div id="dungeonQuestionTitle" class="dungeon-question-title">Untitled Question</div>
                </div>
                <div class="dungeon-topbar-center">
                  <div id="dungeonTopbarNav" class="dungeon-topbar-nav hidden">
                    <button id="dungeonTopbarPrev" class="dungeon-topbar-nav-btn" title="Previous Question">
                      <svg viewBox="0 0 45.86 37.3" style="width:48px;height:48px;transform:scaleX(-1);flex-shrink:0"><g><polygon fill="currentColor" points="9.94,9.4 35.92,18.88 9.94,27.9"></polygon><polygon fill="#5490CC" points="10.63,12.31 10.59,24.96 30.31,18.88"></polygon></g></svg>
                      <span>Previous</span>
                    </button>
                    <div class="dungeon-topbar-nav-divider"></div>
                    <button id="dungeonTopbarNext" class="dungeon-topbar-nav-btn" title="Next Question">
                      <svg viewBox="0 0 45.86 37.3" style="width:48px;height:48px;flex-shrink:0"><g><polygon fill="currentColor" points="9.94,9.4 35.92,18.88 9.94,27.9"></polygon><polygon fill="#5490CC" points="10.63,12.31 10.59,24.96 30.31,18.88"></polygon></g></svg>
                      <span>Next</span>
                    </button>
                  </div>
                </div>
                <div class="dungeon-topbar-right">
                  <button id="dungeonLabBtn" class="dungeon-topbar-btn" title="Lab Values">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M10 2v7.31"></path>
                        <path d="M14 2v7.31"></path>
                        <path d="M8.5 2h7"></path>
                        <path d="M14 9.3a6.5 6.5 0 1 1-4 0"></path>
                    </svg>
                  </button>
                  <button id="dungeonCalcBtn" class="dungeon-topbar-btn" title="Calculator">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="4" y="2" width="16" height="20" rx="2"></rect>
                        <line x1="8" y1="6" x2="16" y2="6"></line>
                        <line x1="16" y1="14" x2="16" y2="14"></line>
                        <line x1="12" y1="14" x2="12" y2="14"></line>
                        <line x1="8" y1="14" x2="8" y2="14"></line>
                        <line x1="16" y1="18" x2="16" y2="18"></line>
                        <line x1="12" y1="18" x2="12" y2="18"></line>
                        <line x1="8" y1="18" x2="8" y2="18"></line>
                    </svg>
                  </button>
                  <div class="dungeon-font-group">
                      <button class="dungeon-topbar-btn dungeon-font-btn small" data-font-size="small" title="Small Font">A</button>
                      <button class="dungeon-topbar-btn dungeon-font-btn medium active" data-font-size="medium" title="Medium Font">A</button>
                      <button class="dungeon-topbar-btn dungeon-font-btn large" data-font-size="large" title="Large Font">A</button>
                  </div>
                  <button id="dungeonSearchToggle" class="dungeon-topbar-btn" title="Search">
                     <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                  </button>
                  <div id="dungeonSearchWrapper" class="dungeon-search-wrapper">
                     <div class="dungeon-search-container">
                         <input type="text" id="dungeonSearchInput" placeholder="Search..." spellcheck="false" autocomplete="off" />
                         <div class="dungeon-search-actions">
                             <span id="dungeonSearchCount" class="hidden"></span>
                             <button id="dungeonSearchPrev" class="search-nav-btn" disabled title="Prev">
                                 <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="18 15 12 9 6 15"></polyline></svg>
                             </button>
                             <button id="dungeonSearchNext" class="search-nav-btn" disabled title="Next">
                                 <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
                             </button>
                             <button id="dungeonSearchClose" class="search-close-btn" title="Close">
                                 <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                             </button>
                         </div>
                     </div>
                  </div>
                  <button id="dungeonToolbarOptions" class="dungeon-topbar-btn" title="Toolbar Options">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <line x1="4" y1="6" x2="20" y2="6"></line>
                      <line x1="4" y1="12" x2="20" y2="12"></line>
                      <line x1="4" y1="18" x2="20" y2="18"></line>
                    </svg>
                  </button>
                  <button id="dungeonCloseBtn" class="dungeon-topbar-btn" title="Close">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </div>
              </div>
              
              <!-- Toolbar Options Menu -->
              <div id="dungeonToolbarMenu" class="dungeon-toolbar-menu hidden">
                <div class="dungeon-toolbar-menu-section">
                  <div class="dungeon-toolbar-menu-label">View Options</div>
                  <button id="dungeonSplitViewToggle" class="dungeon-menu-toggle">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                      <line x1="12" y1="3" x2="12" y2="21"></line>
                    </svg>
                    <span>Split View Explanation</span>
                  </button>
                  <button id="dungeonToolbarToggle" data-action="toggle">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                    <span>Toggle Toolbar</span>
                  </button>
                  <button id="dungeonHideTimerToggle" class="dungeon-menu-toggle">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12 6 12 12 16 14"></polyline>
                        <line x1="2" y1="2" x2="22" y2="22"></line>
                    </svg>
                    <span>Hide Timer</span>
                  </button>
                  <button id="dungeonTimerFloatingToggle" class="dungeon-menu-toggle">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                    <span>Floating Clock</span>
                  </button>
                </div>
                <div class="dungeon-toolbar-menu-divider"></div>
                <div class="dungeon-toolbar-menu-section">
                  <div class="dungeon-toolbar-menu-label">Highlighter Color</div>
                  <div class="dungeon-menu-grid five-col highlighter-colors" style="grid-template-columns: repeat(5, 1fr); gap: 8px;">
                    <button class="hl-color-btn active" data-color="yellow" title="Yellow" style="background: hsl(60, 100%, 65%); width: 28px; height: 28px; border-radius: 6px; border: 2px solid white; cursor: pointer;"></button>
                    <button class="hl-color-btn" data-color="green" title="Green" style="background: hsl(120, 100%, 75%); width: 28px; height: 28px; border-radius: 6px; border: 2px solid transparent; cursor: pointer;"></button>
                    <button class="hl-color-btn" data-color="blue" title="Blue" style="background: hsl(190, 100%, 75%); width: 28px; height: 28px; border-radius: 6px; border: 2px solid transparent; cursor: pointer;"></button>
                    <button class="hl-color-btn" data-color="pink" title="Pink" style="background: hsl(320, 100%, 75%); width: 28px; height: 28px; border-radius: 6px; border: 2px solid transparent; cursor: pointer;"></button>
                    <button class="hl-color-btn" data-color="orange" title="Orange" style="background: hsl(35, 100%, 70%); width: 28px; height: 28px; border-radius: 6px; border: 2px solid transparent; cursor: pointer;"></button>
                  </div>
                </div>
                <div class="dungeon-toolbar-menu-divider"></div>
                <div class="dungeon-toolbar-menu-section">
                  <div class="dungeon-toolbar-menu-label">Toolbar Position</div>
                  <button id="dungeonFloatingToggle" data-position="floating" class="dungeon-menu-toggle">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="4" width="16" height="16" rx="2"></rect><path d="M9 9h6v6H9z"></path></svg>
                    <span>Floating Mode</span>
                  </button>
                  <div class="dungeon-menu-grid" style="margin-top: 8px;">
                    <button data-position="top" title="Top">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"></rect><path d="M3 9h18"></path></svg>
                    </button>
                    <button data-position="bottom" title="Bottom">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"></rect><path d="M3 15h18"></path></svg>
                    </button>
                    <button data-position="left" title="Left">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"></rect><path d="M9 3v18"></path></svg>
                    </button>
                    <button data-position="right" title="Right">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"></rect><path d="M15 3v18"></path></svg>
                    </button>
                  </div>
                </div>
                <div class="dungeon-toolbar-menu-divider"></div>
                <div class="dungeon-toolbar-menu-section">
                  <div class="dungeon-toolbar-menu-label">Topbar Buttons</div>
                  <div class="dungeon-menu-grid three-col">
                    <button data-topbar-position="left" title="Align Left">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="21" y1="6" x2="3" y2="6"></line><line x1="15" y1="12" x2="3" y2="12"></line><line x1="17" y1="18" x2="3" y2="18"></line></svg>
                    </button>
                    <button data-topbar-position="center" title="Align Center">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="21" y1="6" x2="3" y2="6"></line><line x1="17" y1="12" x2="7" y2="12"></line><line x1="19" y1="18" x2="5" y2="18"></line></svg>
                    </button>
                    <button data-topbar-position="right" title="Align Right">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="21" y1="6" x2="3" y2="6"></line><line x1="21" y1="12" x2="9" y2="12"></line><line x1="21" y1="18" x2="7" y2="18"></line></svg>
                    </button>
                  </div>
                </div>
                <div class="dungeon-toolbar-menu-divider"></div>
                <div class="dungeon-toolbar-menu-section">
                  <div class="dungeon-toolbar-menu-label">Content Alignment</div>
                  <div class="dungeon-menu-grid">
                    <button id="dungeonAlignLeftBtn" class="dungeon-menu-toggle" data-alignment="left">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="17" y1="6" x2="3" y2="6"></line><line x1="21" y1="12" x2="3" y2="12"></line><line x1="15" y1="18" x2="3" y2="18"></line></svg>
                      <span>Left</span>
                    </button>
                    <button id="dungeonAlignCenterBtn" class="dungeon-menu-toggle" data-alignment="center">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="21" y1="6" x2="3" y2="6"></line><line x1="17" y1="12" x2="7" y2="12"></line><line x1="19" y1="18" x2="5" y2="18"></line></svg>
                      <span>Center</span>
                    </button>
                  </div>
                </div>
                <div class="dungeon-toolbar-menu-divider"></div>
                <div class="dungeon-toolbar-menu-section">
                  <div class="dungeon-toolbar-menu-label">Theme</div>
                  <div class="dungeon-theme-selector">
                    <button id="dungeonThemePrev" class="dungeon-theme-nav-btn" title="Previous Theme">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
                    </button>
                    <div id="dungeonThemeDisplay" class="dungeon-theme-display">Dark</div>
                    <button id="dungeonThemeNext" class="dungeon-theme-nav-btn" title="Next Theme">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
                    </button>
                  </div>
                </div>
              </div>
              
              <div id="dungeonSidebar" class="dungeon-sidebar">
                <!-- Stats will be added at bottom by JS -->
              </div>
              <div class="dungeon-main">
                  <div class="dungeon-scroll-wrapper" id="dungeonScrollWrapper">
                      <div id="dungeonMainPanel" class="dungeon-main-panel">
                          <div id="dungeonMainContent" class="dungeon-question-container font-medium"></div>
                      </div>
                      <div id="dungeonSplitResizer" class="dungeon-split-resizer hidden"></div>
                      <div id="dungeonExplanationPanel" class="dungeon-explanation-panel hidden">
                          <div id="dungeonExplanationContent" class="dungeon-question-container font-medium"></div>
                      </div>
                  </div>
              </div>
              
              <!-- Footer (Bottom Header) -->
              <div id="dungeonFooter" class="dungeon-footer">
                  <div class="dungeon-footer-left"><span class="dungeon-block-clock">Block Time Elapsed: <span id="dungeonBlockElapsed">00:00:00</span></span>
                      <div class="dungeon-stat-item" title="Time Elapsed">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                          <span id="dungeonTimer" style="font-weight: 600; color: var(--text-muted); font-variant-numeric: tabular-nums;">00:00</span>
                      </div>
                  </div>
                  <div class="dungeon-footer-center">
                      <div id="dungeonExamResults" class="dungeon-footer-center-stats hidden">
                          <div class="dungeon-stat-item correct" title="Correct Answers">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                              <span id="dungeonStatCorrectExam">0</span>
                          </div>
                          <div class="dungeon-stat-item total" title="Total Questions">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                              <span id="dungeonStatTotalExam">0</span>
                          </div>
                          <div class="dungeon-stat-item score" title="Final Score">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path><path d="M22 12A10 10 0 0 0 12 2v10z"></path></svg>
                              <span id="dungeonStatScore">0%</span>
                          </div>
                          <div class="dungeon-stat-item wrong" title="Wrong Answers">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                              <span id="dungeonStatWrongExam">0</span>
                          </div>
                      </div>
                       <div id="dungeonTutorStats" class="dungeon-footer-center-stats">
                           <div class="dungeon-stat-item correct" title="Correct Answers">
                               <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                               <span id="dungeonStatCorrect">0</span>
                           </div>
                           <div class="dungeon-stat-item total" title="Question Progress">
                               <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                               <span id="dungeonStatTotal">0/0</span>
                           </div>
                           <div class="dungeon-stat-item score" title="Current Score">
                               <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path><path d="M22 12A10 10 0 0 0 12 2v10z"></path></svg>
                               <span id="dungeonStatScoreTutor">0%</span>
                           </div>
                           <div class="dungeon-stat-item wrong" title="Wrong Answers">
                               <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                               <span id="dungeonStatWrong">0</span>
                           </div>
                       </div>
                  </div>
                  <div class="dungeon-footer-right">
                      <span id="dungeonSaveStatus" class="dungeon-save-status saved">Saved</span>
                      
                      <button id="dungeonNoteBtn" class="dungeon-reveal-btn footer-note-btn hidden" title="Add Note">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                          </svg>
                      </button>

                      <button id="dungeonSuspendBtn" class="dungeon-reveal-btn" title="Suspend Block (Resume Later)">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
                      </button>

                      <button id="dungeonEndBlockBtn" class="dungeon-reveal-btn" title="End Block (Finish Early)">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="9" x2="15" y2="15"></line><line x1="15" y1="9" x2="9" y2="15"></line></svg>
                      </button>

                      <button id="dungeonSubmitBlockBtn" class="dungeon-reveal-btn submit-block-svg" title="Submit Block & See Results">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11"/></svg>
                      </button>

                      <button id="dungeonClearBtn" class="dungeon-reveal-btn" title="Clear Answer" style="display: none;">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                              <circle cx="12" cy="12" r="10"></circle>
                              <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
                          </svg>
                      </button>
                  </div>
              </div>
              
              <!-- Loading Screen -->
              <div id="dungeonLoadingScreen" class="dungeon-loading-screen hidden">
                  <div class="dungeon-loading-content">
                      ${window.QBankWorkspace?.loadingLogo() || '<div class="dungeon-loading-spinner"></div>'}
                      <div class="dungeon-loading-text">Loading Questions...</div>
                  </div>
              </div>
              
              <!-- Calculator -->
              <div id="dungeonCalculator" class="dungeon-calculator hidden">
                  <div class="dungeon-calc-header" id="dungeonCalcHeader">
                      <span>Calculator</span>
                      <button id="dungeonCalcClose" title="Close">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                      </button>
                  </div>
                  <div class="dungeon-calc-display-container">
                      <div id="dungeonCalcDisplay" class="dungeon-calc-display">0</div>
                  </div>
                  <div class="dungeon-calc-mode-switch">
                      <button id="dungeonCalcModeBasic" class="active" data-mode="basic">Basic</button>
                      <button id="dungeonCalcModeAdv" data-mode="advanced">Advanced</button>
                  </div>
                  <div id="dungeonCalcAdvRow" class="dungeon-calc-keys advanced-keys hidden">
                       <button class="calc-btn fn" data-val="sin">sin</button>
                       <button class="calc-btn fn" data-val="cos">cos</button>
                       <button class="calc-btn fn" data-val="tan">tan</button>
                       <button class="calc-btn fn" data-val="log">log</button>
                       
                       <button class="calc-btn fn" data-val="ln">ln</button>
                       <button class="calc-btn fn" data-val="sqrt">√</button>
                       <button class="calc-btn fn" data-val="pow">^</button>
                       <button class="calc-btn fn" data-val="pi">π</button>
                  </div>
                  <div class="dungeon-calc-keys basic-keys">
                      <button class="calc-btn op" data-val="C">C</button>
                      <button class="calc-btn op" data-val="backspace">⌫</button>
                      <button class="calc-btn op" data-val="(">(</button>
                      <button class="calc-btn op" data-val=")">)</button>
                      
                      <button class="calc-btn num" data-val="7">7</button>
                      <button class="calc-btn num" data-val="8">8</button>
                      <button class="calc-btn num" data-val="9">9</button>
                      <button class="calc-btn op" data-val="/">÷</button>
                      
                      <button class="calc-btn num" data-val="4">4</button>
                      <button class="calc-btn num" data-val="5">5</button>
                      <button class="calc-btn num" data-val="6">6</button>
                      <button class="calc-btn op" data-val="*">×</button>
                      
                      <button class="calc-btn num" data-val="1">1</button>
                      <button class="calc-btn num" data-val="2">2</button>
                      <button class="calc-btn num" data-val="3">3</button>
                      <button class="calc-btn op" data-val="-">-</button>
                      
                      <button class="calc-btn num" data-val="0">0</button>
                      <button class="calc-btn num" data-val=".">.</button>
                      <button class="calc-btn eq" data-val="=">=</button>
                      <button class="calc-btn op" data-val="+">+</button>
                  </div>
              </div>
               
               <!-- Lab Sidebar -->
               <div id="dungeonLabSidebar" class="dungeon-lab-sidebar">
                   <div class="lab-sidebar-header">
                       <h3>Lab Values</h3>
                       <button id="dungeonLabClose" class="lab-close-btn">
                           <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                       </button>
                   </div>
                   <div class="lab-search-container">
                       <input type="text" id="dungeonLabSearch" placeholder="Search lab values..." spellcheck="false" />
                       <svg class="lab-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                   </div>
                   <div id="dungeonLabContent" class="lab-content">
                       <!-- Values injected by JS -->
                   </div>
               </div>
            `;
            }

            // 3. Ensure Toolbar exists
            if (!this.el.container.querySelector('#dungeonToolbar')) {
                const toolbarHTML = `
                <div id="dungeonToolbar" class="dungeon-toolbar">
                    <div id="dungeonToolPrev" class="dungeon-tool-btn" title="Previous Question">
                         <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                    </div>
                    <div id="dungeonToolUndo" class="dungeon-tool-btn" title="Undo (Ctrl+Z)">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/></svg>
                    </div>
                    <div class="dungeon-tool-btn" data-tool="star" title="Flag question">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 21V4m0 0c5-4 9 4 14 0v10c-5 4-9-4-14 0"/></svg>
                    </div>
                    <div class="dungeon-tool-btn" data-tool="note" title="Add Note">
                         <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                    </div>
                    <div class="dungeon-tool-btn" data-tool="submit" title="Submit">
                         <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    </div>
                    <div class="dungeon-tool-btn" data-tool="highlight" title="Highlight Mode">
                        <svg xmlns="http://www.w3.org/2000/svg" width="19" height="19" fill="currentColor" stroke="currentColor" stroke-width="0.4" stroke-linecap="round" stroke-linejoin="round" class="bi bi-highlighter" viewBox="0 0 16 16">
                        <path fill-rule="evenodd" d="M11.096.644a2 2 0 0 1 2.791.036l1.433 1.433a2 2 0 0 1 .035 2.791l-.413.435-8.07 8.995a.5.5 0 0 1-.372.166h-3a.5.5 0 0 1-.234-.058l-.412.412A.5.5 0 0 1 2.5 15h-2a.5.5 0 0 1-.354-.854l1.412-1.412A.5.5 0 0 1 1.5 12.5v-3a.5.5 0 0 1 .166-.372l8.995-8.07zm-.115 1.47L2.727 9.52l3.753 3.753 7.406-8.254zm3.585 2.17.064-.068a1 1 0 0 0-.017-1.396L13.18 1.387a1 1 0 0 0-1.396-.018l-.068.065zM5.293 13.5 2.5 10.707v1.586L3.707 13.5z"/>
                        </svg>
                    </div>
                    <div class="dungeon-tool-btn" data-tool="clear" title="Clear Highlights">
                         <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21"></path><path d="M22 21H7"></path><path d="m5 11 9 9"></path></svg>
                    </div>
                    <div id="dungeonToolRedo" class="dungeon-tool-btn" title="Redo (Ctrl+Y)">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13"/></svg>
                    </div>
                    <div id="dungeonToolNext" class="dungeon-tool-btn" title="Next Question">
                         <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                    </div>
                </div>
             `;
                this.el.container.insertAdjacentHTML('beforeend', toolbarHTML);
            }
        }

        this.el.sidebar = document.getElementById("dungeonSidebar");
        this.el.main = document.getElementById("dungeonMainContent");
        // prevBtn and nextBtn removed as they are dynamic now

        if (!this.el.container) {
            console.error("DungeonBase container not found in DOM");
            return;
        }

        // Initialize Sidebar Resizer
        this.initResizer();
        this.initToolbar();
        this.initTopbar();
        // Timer Hiding Toggle
        const hideTimerBtn = document.getElementById('dungeonHideTimerToggle');
        const CLOCK_SVG = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`;
        const CLOCK_HIDDEN_SVG = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline><line x1="2" y1="2" x2="22" y2="22"></line></svg>`;
        const _updateHideTimerBtn = () => {
            if (!hideTimerBtn) return;
            const hidden = this.state.hideTimerUntilMinute;
            hideTimerBtn.classList.toggle('active', hidden);
            hideTimerBtn.innerHTML = `${hidden ? CLOCK_HIDDEN_SVG : CLOCK_SVG} <span>${hidden ? 'Show Timer' : 'Hide Timer'}</span>`;
        };
        if (hideTimerBtn) {
            hideTimerBtn.onclick = (e) => {
                e.stopPropagation();
                this.state.hideTimerUntilMinute = !this.state.hideTimerUntilMinute;
                _updateHideTimerBtn();
                this.updateTimerDisplay(this.lastTimerMs || 0);
            };
            _updateHideTimerBtn();
        }

        // Timer Floating Toggle
        const timerFloatingBtn = document.getElementById('dungeonTimerFloatingToggle');
        if (timerFloatingBtn) {
            timerFloatingBtn.onclick = () => {
                this.state.floatingTimer = !this.state.floatingTimer;
                timerFloatingBtn.classList.toggle('active', this.state.floatingTimer);
                this.updateTimerLayout();
            };
            timerFloatingBtn.classList.toggle('active', this.state.floatingTimer);
        }

        this.initFooter();
        this.initCalculator();
        this.initSearch();
        this.initMobileHighlightSupport();

        this.bindEvents();

        // Global Keybinds for switching between layers
        document.addEventListener('keydown', (e) => {
            // ESC to close Dungeon layer - DISABLED per user request
            /*
            if (e.key === 'Escape' && document.body.classList.contains('dungeon-open')) {
                // Don't close if a modal or search is open?
                // For simplicity, just close.
                const searchWrapper = document.getElementById('dungeonSearchWrapper');
                if (searchWrapper && searchWrapper.classList.contains('active')) {
                    // If search is active, let search-close handle it or just close search first?
                    // But usually user wants to exit the whole thing.
                }
                this.close();
            }
            */
        });

        this.initImageViewer();
    }

    initFooter() {
        const right=document.querySelector('.dungeon-footer-right');
        if (right && !document.getElementById('dungeonMedicalLibraryBtn')) {
            const b=document.createElement('button'); b.id='dungeonMedicalLibraryBtn'; b.className='dungeon-reveal-btn'; b.title='Medical Library';
            b.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="4" y="3" width="12" height="16" rx="2"/><path d="M16 6h4v15H8v-2M7 7h6M7 11h6M7 15h4"/></svg><span>Medical Library</span>';
            b.onclick=()=>this.showNotification('Medical Library — Coming soon','info');right.prepend(b);
        }
        for(const [id,label] of [['dungeonNoteBtn','Note'],['dungeonSuspendBtn','Suspend'],['dungeonEndBlockBtn','End Block'],['dungeonSubmitBlockBtn','Submit Block']]) {
            const b=document.getElementById(id);if(b&&!b.querySelector('.dungeon-footer-label')){const span=document.createElement('span');span.className='dungeon-footer-label';span.textContent=label;b.append(span);}
        }

        // Bind Reveal Button
        const revealBtn = document.getElementById('dungeonRevealBtn');
        if (revealBtn) {
            revealBtn.onclick = () => this.toggleReveal();
        }

        // Bind Timer Reset
        const timerEl = document.getElementById('dungeonTimer');
        if (timerEl) {
            timerEl.style.cursor = 'pointer';
            timerEl.title = 'Click to reset timer';
            timerEl.onclick = () => {
                if (this.state.questions[this.state.currentIndex]?.contentFormat === 'medos-html') return;
                this.timerStart = Date.now();
                this.updateTimerDisplay(0);
            };
        }

        const endBlockBtn = document.getElementById('dungeonEndBlockBtn');
        if (endBlockBtn) {
            endBlockBtn.onclick = () => this.submitBlock(); // Both end the block
        }

        // Initialize Sub-components
        this.initLab();

        // Clear Answer Button
        const clearBtn = document.getElementById('dungeonClearBtn');
        if (clearBtn) {
            clearBtn.onclick = () => this.clearAnswer();
        }

        // Footer Note Button
        const footerNoteBtn = document.getElementById('dungeonNoteBtn');
        if (footerNoteBtn) {
            footerNoteBtn.onclick = () => {
                const q = this.state.questions[this.state.currentIndex];
                if (q) {
                    new window.DungeonNote(this, q.id);
                }
            };
        }
    }

    initToolbar() {
        const toolbar = document.getElementById("dungeonToolbar");
        if (!toolbar) return;

        // Add tooltip for interaction hints
        toolbar.title = "Drag to move, Double-click to rotate";

        // 1. Initial Position (Restored or Centered)
        const restoreOrCenterToolbar = async () => {
            let savedMode = localStorage.getItem('dungeonToolbarPosition');

            // Try backend persistence
            if (window.Storage && window.Storage.loadSettings) {
                try {
                    const settings = await window.Storage.loadSettings();
                    if (settings.dungeonToolbarPosition) {
                        savedMode = settings.dungeonToolbarPosition;
                        // Sync to local
                        localStorage.setItem('dungeonToolbarPosition', savedMode);
                    }
                } catch (e) {
                    console.warn("Dungeon: Failed to load backend settings for toolbar", e);
                }
            }

            if (savedMode && savedMode !== 'floating') {
                this.setToolbarPosition(savedMode);
            } else {
                this.setToolbarPosition('floating');
            }

            // Ensure visible class is added after positioning
            toolbar.classList.add('visible');
        };
        setTimeout(() => {
            restoreOrCenterToolbar();
            // Add visible class after positioning
            toolbar.classList.add('visible');
        }, 0);

        // 2. Drag Logic (only for floating mode)
        let isDragging = false;
        let startX, startY, startLeft, startTop;

        const onMouseDown = (e) => {
            // Don't allow dragging if toolbar is docked
            if (toolbar.classList.contains('docked-top') ||
                toolbar.classList.contains('docked-bottom') ||
                toolbar.classList.contains('docked-left') ||
                toolbar.classList.contains('docked-right')) {
                return;
            }

            if (e.target.closest('.dungeon-tool-btn')) return;
            if (e.button !== 0) return;

            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;

            const rect = toolbar.getBoundingClientRect();
            startLeft = rect.left;
            startTop = rect.top;

            toolbar.style.cursor = 'grabbing';
            document.body.style.userSelect = 'none';

            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        };

        const onMouseMove = (e) => {
            if (!isDragging) return;
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;

            let newLeft = startLeft + dx;
            let newTop = startTop + dy;

            // Constraints
            const sidebar = document.getElementById('dungeonSidebar');
            const sidebarWidth = sidebar ? sidebar.offsetWidth : 0;
            const w = window.innerWidth;
            const h = window.innerHeight;
            const rect = toolbar.getBoundingClientRect();
            const tw = rect.width;
            const th = rect.height;

            if (newLeft < sidebarWidth) newLeft = sidebarWidth;
            if (newLeft + tw > w) newLeft = w - tw;
            if (newTop < 0) newTop = 0;
            if (newTop + th > h) newTop = h - th;

            toolbar.style.left = newLeft + 'px';
            toolbar.style.top = newTop + 'px';
        };

        const onMouseUp = () => {
            isDragging = false;
            toolbar.style.cursor = 'grab';
            document.body.style.userSelect = '';
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);

            // Save Position
            const state = {
                left: toolbar.style.left,
                top: toolbar.style.top,
                vertical: toolbar.classList.contains('vertical')
            };
            localStorage.setItem("dungeonToolbarPos", JSON.stringify(state));
        };

        const onTouchStart = (e) => {
            // Don't allow dragging if toolbar is docked
            if (toolbar.classList.contains('docked-top') ||
                toolbar.classList.contains('docked-bottom') ||
                toolbar.classList.contains('docked-left') ||
                toolbar.classList.contains('docked-right')) {
                return;
            }

            if (e.target.closest('.dungeon-tool-btn')) return;
            
            isDragging = true;
            const touch = e.touches[0];
            startX = touch.clientX;
            startY = touch.clientY;

            const rect = toolbar.getBoundingClientRect();
            startLeft = rect.left;
            startTop = rect.top;

            toolbar.style.cursor = 'grabbing';
            document.body.style.userSelect = 'none';

            document.addEventListener('touchmove', onTouchMove, { passive: false });
            document.addEventListener('touchend', onTouchEnd);
        };

        const onTouchMove = (e) => {
            if (!isDragging) return;
            e.preventDefault(); // Prevent scrolling while dragging
            const touch = e.touches[0];
            const dx = touch.clientX - startX;
            const dy = touch.clientY - startY;

            let newLeft = startLeft + dx;
            let newTop = startTop + dy;

            // Constraints
            const sidebar = document.getElementById('dungeonSidebar');
            const sidebarWidth = sidebar ? sidebar.offsetWidth : 0;
            const w = window.innerWidth;
            const h = window.innerHeight;
            const rect = toolbar.getBoundingClientRect();
            const tw = rect.width;
            const th = rect.height;

            if (newLeft < sidebarWidth) newLeft = sidebarWidth;
            if (newLeft + tw > w) newLeft = w - tw;
            if (newTop < 0) newTop = 0;
            if (newTop + th > h) newTop = h - th;

            toolbar.style.left = newLeft + 'px';
            toolbar.style.top = newTop + 'px';
        };

        const onTouchEnd = () => {
            isDragging = false;
            toolbar.style.cursor = 'grab';
            document.body.style.userSelect = '';
            document.removeEventListener('touchmove', onTouchMove);
            document.removeEventListener('touchend', onTouchEnd);

            // Save Position
            const state = {
                left: toolbar.style.left,
                top: toolbar.style.top,
                vertical: toolbar.classList.contains('vertical')
            };
            localStorage.setItem("dungeonToolbarPos", JSON.stringify(state));
        };

        toolbar.addEventListener('mousedown', onMouseDown);
        toolbar.addEventListener('touchstart', onTouchStart, { passive: false });

        // 3. Rotation Logic (Manual Double Click for robustness)
        let lastClickTime = 0;
        toolbar.addEventListener('click', (e) => {
            console.log('[DungeonToolbar] Click detected on:', e.target.tagName);
            console.log('[DungeonToolbar] Current Classes:', toolbar.className);

            // Don't allow rotation if toolbar is docked
            if (toolbar.classList.contains('docked-top') ||
                toolbar.classList.contains('docked-bottom') ||
                toolbar.classList.contains('docked-left') ||
                toolbar.classList.contains('docked-right')) {
                console.log('[DungeonToolbar] Rotation blocked: Toolbar is docked.');
                return;
            }

            const currentTime = Date.now();
            const timeDiff = currentTime - lastClickTime;
            console.log('[DungeonToolbar] TimeDiff:', timeDiff);

            if (timeDiff < 400 && timeDiff > 0) {
                console.log('[DungeonToolbar] Double Click Triggered! Rotation starting...');
                // Double Click Detected
                e.preventDefault();
                e.stopPropagation(); // Stop propagation to buttons if possible

                toolbar.classList.toggle('vertical');
                console.log('[DungeonToolbar] New Classes:', toolbar.className);

                this.updateHighlightSVG(toolbar);

                const state = {
                    left: toolbar.style.left,
                    top: toolbar.style.top,
                    vertical: toolbar.classList.contains('vertical')
                };
                localStorage.setItem("dungeonToolbarPos", JSON.stringify(state));

                lastClickTime = 0; // Reset
            } else {
                lastClickTime = currentTime;
            }
        }, true); // Capture phase to intercept before buttons

        // Bind Nav Buttons
        const btnPrev = document.getElementById("dungeonToolPrev");
        const btnNext = document.getElementById("dungeonToolNext");
        const btnUndo = document.getElementById("dungeonToolUndo");
        const btnRedo = document.getElementById("dungeonToolRedo");

        if (btnPrev) btnPrev.onclick = () => this.navPrev();
        if (btnNext) btnNext.onclick = () => this.navNext();
        if (btnUndo) btnUndo.onclick = () => this.handleUndo();
        if (btnRedo) btnRedo.onclick = () => this.handleRedo();

        // Bind Tools
        const starBtn = toolbar.querySelector('.dungeon-tool-btn[data-tool="star"]');
        if (starBtn) starBtn.onclick = () => this.toggleStar();

        const highlightBtn = toolbar.querySelector('.dungeon-tool-btn[data-tool="highlight"]');
        if (highlightBtn) highlightBtn.onclick = () => this.toggleHighlightMode();

        const submitBtn = toolbar.querySelector('.dungeon-tool-btn[data-tool="submit"]');
        if (submitBtn) submitBtn.onclick = () => this.handleSubmit();

        const noteBtn = toolbar.querySelector('.dungeon-tool-btn[data-tool="note"]');
        if (noteBtn) noteBtn.onclick = () => this.addNote();

        const clearBtn = toolbar.querySelector('.dungeon-tool-btn[data-tool="clear"]');
        if (clearBtn) clearBtn.onclick = () => this.clearHighlights();

        this.updateHighlightSVG(toolbar);
        this.renderToolbarState();
    }

    pushHistoryState() {
        const q = this.state.questions[this.state.currentIndex];
        if (!q) return;

        // Clone relevant state
        const stateSnapshot = {
            questionId: q.id,
            questionIndex: this.state.currentIndex,
            text: q.text,
            richText: q.richText,
            crossedOutOptionIds: q.crossedOutOptionIds ? [...q.crossedOutOptionIds] : [],
            selectedOption: this.state.selectedOption,
            answer: this.state.answers.has(q.id) ? JSON.parse(JSON.stringify(this.state.answers.get(q.id))) : null
        };

        this.history.past.push(stateSnapshot);
        // Clear future on new action
        this.history.future = [];
        
        // Optional: limit history size
        if (this.history.past.length > 50) {
            this.history.past.shift();
        }
        
        this.renderToolbarState();
    }

    applyHistoryState(stateSnapshot) {
        if (!stateSnapshot) return;

        const q = this.state.questions[stateSnapshot.questionIndex];
        if (!q || q.id !== stateSnapshot.questionId) return; // Paranoia check

        // Restore state
        q.text = stateSnapshot.text;
        if (q.contentFormat === 'medos-html') q.richText = stateSnapshot.richText;
        q.crossedOutOptionIds = [...stateSnapshot.crossedOutOptionIds];
        
        if (stateSnapshot.answer) {
            this.state.answers.set(q.id, JSON.parse(JSON.stringify(stateSnapshot.answer)));
            q.submittedAnswer = JSON.parse(JSON.stringify(stateSnapshot.answer));
        } else {
            this.state.answers.delete(q.id);
            q.submittedAnswer = null;
        }

        // Only restore selectedOption if we are on the same question
        if (this.state.currentIndex === stateSnapshot.questionIndex) {
            this.state.selectedOption = stateSnapshot.selectedOption;
        }

        this.updateSaveStatus('unsaved');
        this.saveQuestionsToBackend();
        
        // If we are not on the question where the undo happened, jump to it
        if (this.state.currentIndex !== stateSnapshot.questionIndex) {
            this.jumpToQuestion(stateSnapshot.questionIndex);
        } else {
            this.renderQuestion();
            this.renderSidebar();
        }
    }

    getCurrentStateSnapshot() {
        const q = this.state.questions[this.state.currentIndex];
        if (!q) return null;
        return {
            questionId: q.id,
            questionIndex: this.state.currentIndex,
            text: q.text,
            crossedOutOptionIds: q.crossedOutOptionIds ? [...q.crossedOutOptionIds] : [],
            selectedOption: this.state.selectedOption,
            answer: this.state.answers.has(q.id) ? JSON.parse(JSON.stringify(this.state.answers.get(q.id))) : null
        };
    }

    handleUndo() {
        if (this.history.past.length === 0) return;
        
        // Save current actual state to future before applying past
        const currentState = this.getCurrentStateSnapshot();
        if (currentState) {
            this.history.future.push(currentState);
        }

        const poppedState = this.history.past.pop();
        this.applyHistoryState(poppedState);
        this.showNotification("Action undone", "info");
        this.renderToolbarState();
    }

    handleRedo() {
        if (this.history.future.length === 0) return;

        // Save current actual state to past before applying future
        const currentState = this.getCurrentStateSnapshot();
        if (currentState) {
            this.history.past.push(currentState);
        }

        const poppedState = this.history.future.pop();
        this.applyHistoryState(poppedState);
        this.showNotification("Action redone", "info");
        this.renderToolbarState();
    }

    initTopbar() {
        // Sidebar Toggle
        const sidebarToggle = document.getElementById('dungeonSidebarToggle');
        if (sidebarToggle) {
            sidebarToggle.onclick = () => this.toggleSidebar();
        }

        // Toolbar Options Menu
        const toolbarOptionsBtn = document.getElementById('dungeonToolbarOptions');
        const toolbarMenu = document.getElementById('dungeonToolbarMenu');

        if (!toolbarOptionsBtn || !toolbarMenu) return;

        // Prevent duplicate listeners if initTopbar is called again
        if (toolbarOptionsBtn.dataset.initialized) return;
        toolbarOptionsBtn.dataset.initialized = "true";

        const splitViewToggle = document.getElementById('dungeonSplitViewToggle');
        if (splitViewToggle) {
            splitViewToggle.onclick = (e) => {
                e.stopPropagation();
                this.toggleSplitView();
                // Keep menu open
            };
        }

        if (toolbarOptionsBtn && toolbarMenu) {
            toolbarOptionsBtn.onclick = (e) => {
                e.stopPropagation();
                toolbarMenu.classList.toggle('hidden');
                toolbarOptionsBtn.classList.toggle('active', !toolbarMenu.classList.contains('hidden'));
            };

            // Close menu when clicking outside
            document.addEventListener('click', (e) => {
                if (!toolbarMenu.contains(e.target) && e.target !== toolbarOptionsBtn) {
                    toolbarMenu.classList.add('hidden');
                    toolbarOptionsBtn.classList.remove('active');
                }
            });

            // Toolbar Toggle button
            const toolbarToggle = document.getElementById('dungeonToolbarToggle');
            if (toolbarToggle) {
                toolbarToggle.onclick = (e) => {
                    e.stopPropagation();
                    this.toggleToolbar();
                    // Update button text
                    const span = toolbarToggle.querySelector('span');
                    if (span) {
                        span.textContent = this.state.toolbarVisible ? 'Hide Toolbar' : 'Show Toolbar';
                    }
                };
            }

            // Position buttons
            toolbarMenu.querySelectorAll('button[data-position]').forEach(btn => {
                btn.onclick = () => {
                    const position = btn.dataset.position;
                    this.setToolbarPosition(position);
                };
            });

            // Topbar buttons position
            toolbarMenu.querySelectorAll('button[data-topbar-position]').forEach(btn => {
                btn.onclick = () => {
                    const pos = btn.dataset.topbarPosition;
                    this.setTopbarButtonsPosition(pos);
                };
            });

            // Highlighter Color selection
            toolbarMenu.querySelectorAll('.hl-color-btn').forEach(btn => {
                btn.onclick = (e) => {
                    e.stopPropagation();
                    const color = btn.dataset.color;
                    this.state.activeHighlightColor = color;
                    this.state.highlightMode = true; // Auto-enable highlight mode when a color is chosen
                    
                    // Update active state icons in menu
                    toolbarMenu.querySelectorAll('.hl-color-btn').forEach(b => {
                        const isActive = b.dataset.color === color;
                        b.classList.toggle('active', isActive);
                        b.style.borderColor = isActive ? 'white' : 'transparent';
                        b.style.transform = isActive ? 'scale(1.15)' : 'scale(1)';
                        b.style.boxShadow = isActive ? '0 0 8px rgba(255,255,255,0.4)' : 'none';
                    });

                    // Update main toolbar icon state
                    this.renderToolbarState();
                };
            });

            // Content alignment buttons
            toolbarMenu.querySelectorAll('button[data-alignment]').forEach(btn => {
                btn.onclick = () => {
                    const align = btn.dataset.alignment;
                    this.setContentAlignment(align);
                };
            });

            // Theme Carousel Logic
            const themes = ['dark', 'light'];
            const themeDisplay = document.getElementById('dungeonThemeDisplay');

            const updateThemeDisplay = () => {
                const currentTheme = localStorage.getItem('theme') || 'dark';
                if (themeDisplay) themeDisplay.textContent = currentTheme.charAt(0).toUpperCase() + currentTheme.slice(1);
            };

            // Initialize display
            updateThemeDisplay();

            const cycleTheme = (direction) => {
                const currentTheme = localStorage.getItem('theme') || 'dark';
                let index = themes.indexOf(currentTheme);
                if (index === -1) index = 0; // Default to dark if unknown

                if (direction === 'next') {
                    index = (index + 1) % themes.length;
                } else {
                    index = (index - 1 + themes.length) % themes.length;
                }

                const newTheme = themes[index];
                this.setTheme(newTheme);
                updateThemeDisplay();
            };

            const prevThemeBtn = document.getElementById('dungeonThemePrev');
            const nextThemeBtn = document.getElementById('dungeonThemeNext');

            if (prevThemeBtn) {
                prevThemeBtn.onclick = (e) => {
                    e.stopPropagation(); // prevent menu close
                    cycleTheme('prev');
                };
            }

            if (nextThemeBtn) {
                nextThemeBtn.onclick = (e) => {
                    e.stopPropagation(); // prevent menu close
                    cycleTheme('next');
                };
            }

            // Listen for theme changes from other parts of the app
            window.addEventListener('theme-changed', (e) => {
                updateThemeDisplay();
            });

            // Also update when toggling menu to be safe
            const originalToggleClick = toolbarToggle ? toolbarToggle.onclick : null;
            if (toolbarToggle) {
                toolbarToggle.onclick = (e) => {
                    updateThemeDisplay(); // Sync before opening
                    if (originalToggleClick) originalToggleClick(e);
                };
            }

            // Bind Search
            const searchWrapper = document.getElementById('dungeonSearchWrapper');
            const searchToggle = document.getElementById('dungeonSearchToggle');
            const searchInput = document.getElementById('dungeonSearchInput');

            if (searchToggle && searchWrapper && searchInput) {
                searchToggle.onclick = (e) => {
                    e.stopPropagation();
                    searchWrapper.classList.toggle('active');
                    if (searchWrapper.classList.contains('active')) {
                        searchInput.focus();
                    }
                };

                searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));

                // Click outside to close
                document.addEventListener('click', (e) => {
                    if (!searchWrapper.contains(e.target) && searchWrapper.classList.contains('active')) {
                        if (!searchInput.value) {
                            searchWrapper.classList.remove('active');
                        }
                    }
                });
            }

            const closeBtn = document.getElementById('dungeonCloseBtn');
            if (closeBtn) {
                closeBtn.onclick = () => {
                    if (confirm("Are you sure you want to exit the Dungeon session? Unsaved progress may be lost.")) {
                        // Hide Dungeon Base
                        if (this.el.container) this.el.container.classList.add('hidden');
                        
                        // Show Note Base if it exists
                        const noteBase = document.getElementById('noteBase');
                        if (noteBase) {
                            noteBase.classList.remove('hidden');
                        }
                        this.stopTimer();
                        document.body.classList.remove("dungeon-open");
                    }
                };
            }
        }

        // Font Resize Buttons
        const fontButtons = document.querySelectorAll('.dungeon-font-btn');
        if (fontButtons.length > 0) {
            fontButtons.forEach(btn => {
                btn.onclick = () => {
                    const size = btn.dataset.fontSize;
                    this.setFontSize(size);

                    // Update active state
                    fontButtons.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                };
            });

            // Load saved font size
            const savedFontSize = localStorage.getItem('dungeonFontSize') || 'medium';
            this.setFontSize(savedFontSize);
            fontButtons.forEach(btn => {
                if (btn.dataset.fontSize === savedFontSize) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            });
        }

        // Topbar Prev/Next nav buttons (visible when toolbar is hidden)
        const topbarPrevBtn = document.getElementById('dungeonTopbarPrev');
        const topbarNextBtn = document.getElementById('dungeonTopbarNext');
        if (topbarPrevBtn) {
            topbarPrevBtn.onclick = () => this.navPrev();
        }
        if (topbarNextBtn) {
            topbarNextBtn.onclick = () => this.navNext();
        }

        // Load saved states
        const savedSidebarState = localStorage.getItem('dungeonSidebarCollapsed');
        if (savedSidebarState === 'true') {
            this.toggleSidebar();
        }

        // Load saved topbar buttons position
        const savedTopbarPosition = localStorage.getItem('dungeonTopbarButtonsPosition') || 'right';
        this.setTopbarButtonsPosition(savedTopbarPosition);

        const savedToolbarVisible = localStorage.getItem('dungeonToolbarVisible');
        if (savedToolbarVisible === 'false') {
            this.state.toolbarVisible = false;
            this.state.highlightMode = true; // Auto-highlight on load if hidden
            this.updateToolbarVisibility();
        }

        // Initial state sync
        this.setContentAlignment(this.state.contentAlignment);

        // Initialize Split View Resizer
        this.initSplitResizer();
    }

    toggleSidebar() {
        this.state.sidebarCollapsed = !this.state.sidebarCollapsed;
        const sidebar = document.getElementById('dungeonSidebar');
        const main = document.querySelector('.dungeon-main');
        const toolbar = document.getElementById('dungeonToolbar');

        if (sidebar) {
            sidebar.classList.toggle('collapsed', this.state.sidebarCollapsed);
        }

        if (main) {
            main.classList.toggle('sidebar-collapsed', this.state.sidebarCollapsed);
            // Update inline style to ensure it works with resizer
            if (this.state.sidebarCollapsed) {
                main.style.left = '0';
                if (this.state.toolbarPosition === 'left' && toolbar) {
                    toolbar.style.left = '0';
                }
            } else {
                // Expanding - restore positions
                const w = sidebar ? sidebar.offsetWidth : 0;
                if (w > 0) {
                    if (this.state.toolbarPosition === 'left') {
                        main.style.left = (w + 50) + 'px';
                        if (toolbar) toolbar.style.left = w + 'px';
                    } else {
                        main.style.left = w + 'px';
                    }
                } else {
                    // Fallback if offsetWidth is 0 (shouldn't happen if expanding)
                    // Clear inline to let CSS take over or previous logic
                    main.style.left = '';
                }

            }
        }

        localStorage.setItem('dungeonSidebarCollapsed', this.state.sidebarCollapsed);
    }

    toggleToolbar() {
        this.state.toolbarVisible = !this.state.toolbarVisible;
        
        // Auto-activate highlight mode when hiding toolbar
        if (!this.state.toolbarVisible) {
            this.state.highlightMode = true;
            const toolbar = document.getElementById('dungeonToolbar');
            if (toolbar) {
                this.updateHighlightSVG(toolbar);
            }
        }

        this.updateToolbarVisibility();
        this.render(); // Force re-render to show/hide inline submit button
        localStorage.setItem('dungeonToolbarVisible', this.state.toolbarVisible);
    }

    updateToolbarVisibility() {
        const toolbar = document.getElementById('dungeonToolbar');
        if (toolbar) {
            if (this.state.toolbarVisible) {
                toolbar.style.display = 'flex';
                // RE-APPLY layout if docked
                if (this.state.toolbarPosition !== 'floating') {
                    this.setToolbarPosition(this.state.toolbarPosition);
                }
                // Trigger reflow for animation
                toolbar.offsetHeight;
                toolbar.classList.add('visible');
            } else {
                toolbar.classList.remove('visible');
                // REMOVE layout padding immediately
                const main = document.querySelector('.dungeon-main');
                const sidebar = document.getElementById('dungeonSidebar');
                const topbar = document.getElementById('dungeonTopbar');
                const topbarHeight = (topbar && topbar.offsetHeight) || 60;
                
                if (main) {
                    main.style.top = topbarHeight + 'px';
                    main.style.bottom = '0';
                    main.style.left = ''; // Reset to default (flex layout usually handles it)
                    if (sidebar && !this.state.sidebarCollapsed) {
                         // If sidebar exists, we might need to restore its default left/width if we pushed it
                         // But usually sidebar is static.
                    }
                }
                if (sidebar) {
                    sidebar.style.top = topbarHeight + 'px';
                    sidebar.style.bottom = '0';
                }

                setTimeout(() => {
                    if (!this.state.toolbarVisible) {
                        toolbar.style.display = 'none';
                    }
                }, 300); // Match animation duration
            }
        }

        // Update toggle button text
        const toggleBtn = document.getElementById('dungeonToolbarToggle');
        if (toggleBtn) {
            const span = toggleBtn.querySelector('span');
            if (span) {
                span.textContent = this.state.toolbarVisible ? 'Hide Toolbar' : 'Show Toolbar';
            }
        }

        // Show/hide topbar nav buttons (Prev/Next) when toolbar is hidden
        const topbarNav = document.getElementById('dungeonTopbarNav');
        if (topbarNav) {
            topbarNav.classList.toggle('hidden', this.state.toolbarVisible);
        }

        // Toggle Footer Note Button visibility (Show when toolbar is hidden)
        const footerNoteBtn = document.getElementById('dungeonNoteBtn');
        if (footerNoteBtn) {
            if (!this.state.toolbarVisible) {
                footerNoteBtn.style.display = 'flex';
                // Small delay to allow reflow before animation
                setTimeout(() => footerNoteBtn.classList.add('visible'), 10);
                footerNoteBtn.classList.remove('hidden');
            } else {
                footerNoteBtn.classList.remove('visible');
                // Hide after animation finishes
                setTimeout(() => {
                    if (this.state.toolbarVisible) {
                        footerNoteBtn.style.display = 'none';
                        footerNoteBtn.classList.add('hidden');
                    }
                }, 300);
            }
        }
    }

    setToolbarPosition(position) {
        this.state.toolbarPosition = position;
        const toolbar = document.getElementById('dungeonToolbar');
        if (!toolbar) return;

        const sidebar = document.getElementById('dungeonSidebar');
        // Robust width calculation: prefer style width (if resized), fallback to offset, default to 80
        let sidebarWidth = 80;
        if (sidebar && !this.state.sidebarCollapsed) {
            if (sidebar.style.width) {
                sidebarWidth = parseInt(sidebar.style.width, 10);
            } else if (sidebar.offsetWidth > 0) {
                sidebarWidth = sidebar.offsetWidth;
            }
        } else if (this.state.sidebarCollapsed) {
            sidebarWidth = 0;
        }

        // Remove all position classes
        toolbar.classList.remove('docked-top', 'docked-bottom', 'docked-left', 'docked-right', 'vertical');
        toolbar.style.left = '';
        toolbar.style.top = '';
        toolbar.style.right = '';
        toolbar.style.bottom = '';
        toolbar.style.cursor = ''; // Reset cursor

        const topbar = document.getElementById('dungeonTopbar');
        const topbarHeight = (topbar && topbar.offsetHeight) || 60;

        const toolbarHeight = 50; // Default toolbar height

        // Get main content area for adding padding classes
        const main = document.querySelector('.dungeon-main');
        if (main) {
            main.classList.remove('toolbar-docked-top', 'toolbar-docked-bottom');
        }

        // Reset sidebar positioning
        if (sidebar) {
            sidebar.style.top = '';
            sidebar.style.bottom = '';
        }

        switch (position) {
            case 'top':
                toolbar.classList.add('docked-top');
                toolbar.style.top = topbarHeight + 'px';
                toolbar.style.left = '0'; // Start from left edge, above sidebar
                toolbar.style.right = '0';
                toolbar.style.cursor = 'default'; // Not draggable

                // Push sidebar down below toolbar
                if (sidebar) {
                    sidebar.style.top = this.state.toolbarVisible ? (topbarHeight + toolbarHeight) + 'px' : topbarHeight + 'px';
                }
                if (main) {
                    main.classList.add('toolbar-docked-top');
                    main.style.top = this.state.toolbarVisible ? (topbarHeight + toolbarHeight) + 'px' : topbarHeight + 'px';
                }
                break;
            case 'bottom':
                const footerHeight = 40;
                toolbar.classList.add('docked-bottom');
                toolbar.style.bottom = footerHeight + 'px'; // Sit above footer
                toolbar.style.top = 'auto';
                toolbar.style.left = '0';
                toolbar.style.right = '0';
                toolbar.style.cursor = 'default';

                // Push sidebar up above toolbar + footer
                if (sidebar) {
                    sidebar.style.bottom = this.state.toolbarVisible ? (toolbarHeight + footerHeight) + 'px' : footerHeight + 'px';
                }
                if (main) {
                    main.classList.add('toolbar-docked-bottom');
                    main.style.bottom = this.state.toolbarVisible ? (toolbarHeight + footerHeight) + 'px' : footerHeight + 'px';
                }
                break;
            case 'left':
                toolbar.classList.add('docked-left', 'vertical');
                toolbar.style.left = sidebarWidth + 'px';
                toolbar.style.top = topbarHeight + 'px';
                toolbar.style.bottom = '0';
                toolbar.style.cursor = 'default'; // Not draggable

                // Reset sidebar to default
                if (sidebar) {
                    sidebar.style.top = topbarHeight + 'px';
                    sidebar.style.bottom = '0';
                }
                if (main) {
                    main.style.top = topbarHeight + 'px';
                    main.style.bottom = '0';
                    // Push main content right to make room for toolbar (50px)
                    const contentLeft = this.state.toolbarVisible ? (sidebarWidth + 50) : sidebarWidth;
                    main.style.left = contentLeft + 'px';
                }
                break;
            case 'right':
                toolbar.classList.add('docked-right', 'vertical');
                toolbar.style.left = 'auto'; // Explicitly override any previous or default left value
                toolbar.style.right = '0';
                toolbar.style.top = topbarHeight + 'px';
                toolbar.style.bottom = '0';
                toolbar.style.cursor = 'default'; // Not draggable

                // Reset sidebar to default
                if (sidebar) {
                    sidebar.style.top = topbarHeight + 'px';
                    sidebar.style.bottom = '0';
                }
                if (main) {
                    main.style.top = topbarHeight + 'px';
                    main.style.bottom = '0';
                    main.style.right = this.state.toolbarVisible ? '50px' : '0';
                }
                break;
            case 'floating':
            default:
                toolbar.style.cursor = 'grab'; // Draggable

                // Reset sidebar and main to default
                if (sidebar) {
                    sidebar.style.top = topbarHeight + 'px';
                    sidebar.style.bottom = '0';
                }
                if (main) {
                    main.style.top = topbarHeight + 'px';
                    main.style.bottom = '0';
                }

                // Restore saved position or center
                const savedPos = localStorage.getItem('dungeonToolbarPos');
                if (savedPos) {
                    try {
                        const pos = JSON.parse(savedPos);
                        toolbar.style.left = pos.left;
                        toolbar.style.top = pos.top;
                        if (pos.vertical) toolbar.classList.add('vertical');
                    } catch (e) { }
                } else {
                    const w = window.innerWidth;
                    const tw = toolbar.offsetWidth || 300;
                    toolbar.style.left = (w / 2 - tw / 2) + 'px';
                    toolbar.style.top = (topbarHeight + 40) + 'px';
                }
                break;
        }

        this.updateHighlightSVG(toolbar);
        localStorage.setItem('dungeonToolbarPosition', position);

        // Persist to backend
        (async () => {
            if (window.Storage && window.Storage.loadSettings && window.Storage.saveSettings) {
                try {
                    const current = await window.Storage.loadSettings();
                    // Only save if changed
                    if (current.dungeonToolbarPosition !== position) {
                        current.dungeonToolbarPosition = position;
                        await window.Storage.saveSettings(current);
                    }
                } catch (e) {
                    console.error("Dungeon: Failed to save toolbar position to backend", e);
                }
            }
        })();
    }

    updateStats() {
        // Stats are now in sidebar, updated during renderSidebar()
        // This method kept for compatibility but does nothing
    }

    updateSaveStatus(status = 'saved') {
        if (status === 'saved') {
            this.showNotification("Note saved", "success");
            this.state.unsavedChanges = false;
        } else if (status === 'unsaved') {
            this.showNotification("Unsaved changes", "info");
            // Toggle End/Submit Block UI based on completion
        const submitBlockBtn = document.getElementById("dungeonSubmitBlockBtn");
        if (submitBlockBtn) {
            const unanswered = this.state.questions.length - this.state.answers.size;
            const iconSubmit = submitBlockBtn.querySelector('.btn-icon-submit');
            const iconEnd = submitBlockBtn.querySelector('.btn-icon-end');
            const btnText = submitBlockBtn.querySelector('.btn-text');

            if (unanswered === 0) {
                if (iconSubmit) iconSubmit.style.display = 'block';
                if (iconEnd) iconEnd.style.display = 'none';
                if (btnText) btnText.textContent = 'Submit Block';
            } else {
                if (iconSubmit) iconSubmit.style.display = 'none';
                if (iconEnd) iconEnd.style.display = 'block';
                if (btnText) btnText.textContent = 'End Block';
            }
        }

        this.state.unsavedChanges = true;
        }

        const saveStatusEl = document.getElementById('dungeonSaveStatus');
        if (saveStatusEl) {
            saveStatusEl.style.display = 'none'; // Suppress local UI
        }
    }
    updateQuestionTitle() {
        for (const id of ['dungeonSidebarToggle','dungeonSearchToggle','dungeonToolbarOptions','dungeonCloseBtn']) {
            const button = document.getElementById(id);
            button?.querySelector('.dungeon-header-label')?.remove();
            button?.classList.remove('dungeon-header-labeled');
        }
        for (const [id, label] of [['dungeonLabBtn','Lab Values'], ['dungeonCalcBtn','Calculator']]) {
            const button = document.getElementById(id);
            if (button && !button.querySelector('.dungeon-header-label')) {
                const caption = document.createElement('span');
                caption.className = 'dungeon-header-label'; caption.textContent = label;
                button.append(caption); button.classList.add('dungeon-header-labeled');
                button.setAttribute('aria-label', label);
            }
        }
        const sidebar = document.getElementById('dungeonSidebar');
        if (sidebar && this._layoutSidebar !== sidebar) {
            this._sidebarLayoutObserver?.disconnect();
            this._sidebarClassObserver?.disconnect();
            this._layoutSidebar = sidebar;
            const sync = () => {
                const width = sidebar.classList.contains('collapsed') ? 0 : sidebar.offsetWidth;
                for (const id of ['dungeonTopbar', 'dungeonFooter']) {
                    const fullWidthHeader = id === 'dungeonTopbar' && this.el.container?.classList.contains('amboss-dungeon');
                    document.getElementById(id)?.style.setProperty('left', (fullWidthHeader ? 0 : width) + 'px', 'important');
                }
            };
            this._sidebarLayoutObserver = new ResizeObserver(sync);
            this._sidebarLayoutObserver.observe(sidebar);
            this._sidebarClassObserver = new MutationObserver(sync);
            this._sidebarClassObserver.observe(sidebar, { attributes:true, attributeFilter:['class'] });
            sync();
        }
        const q = this.state.questions[this.state.currentIndex];
        const titleEl = document.getElementById('dungeonQuestionTitle');
        if (titleEl && q) {
            const rawId = String(q.source?.displayId ?? q.source?.questionId ?? q.spId ?? q.id ?? '');
            const displayId = (rawId.includes('.')) ? rawId.split('.').pop() : (rawId.replace('QNX-', '').replace(/[-.]/g, '') || 'N/A');
            
            titleEl.innerHTML = `
                <div class="dungeon-title-line">Item ${this.state.currentIndex + 1} of ${this.state.questions.length}</div>
                <div class="dungeon-id-line" title="Click to copy ID">Question ID: <span class="id-value">${displayId}</span></div>
                <button class="dungeon-question-flag" type="button" title="Mark question" aria-label="Mark question" aria-pressed="${Boolean(q.starred || q.isStarred)}"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M4 3h9l1 3h7v12h-9l-1-3H6v7H4z"/></svg><span>Mark</span></button>
            `;

            titleEl.querySelector('.id-value').textContent = q.source?.displayId ?? q.source?.questionId ?? displayId;
            titleEl.querySelector('.dungeon-question-flag').onclick = () => this.toggleStar();
            // Add Click to Copy functionality
            const idLine = titleEl.querySelector('.dungeon-id-line');
            if (idLine && rawId) {
                idLine.onclick = () => {
                    navigator.clipboard.writeText(rawId).then(() => {
                        const originalColor = idLine.style.color;
                        idLine.style.color = 'var(--success)';
                        setTimeout(() => {
                            idLine.style.color = originalColor;
                        }, 1500);
                    });
                };
            }
        }
    }

    setFontSize(size) {
        const containers = [
            document.getElementById('dungeonMainContent'),
            document.getElementById('dungeonExplanationContent')
        ];

        containers.forEach(container => {
            if (!container) return;
            // Remove all font size classes
            container.classList.remove('font-small', 'font-medium', 'font-large');
            // Add the selected font size class
            container.classList.add(`font-${size}`);
        });

        // Save to localStorage
        localStorage.setItem('dungeonFontSize', size);
    }

    setTopbarButtonsPosition(position) {
        // Get the buttons/groups to move
        const labBtn = document.getElementById('dungeonLabBtn');
        const calcBtn = document.getElementById('dungeonCalcBtn');
        const fontGroup = document.querySelector('.dungeon-font-group');
        // Fallback if group not found
        const fontBtns = document.querySelectorAll('.dungeon-font-btn');

        // Get the containers
        const topbarLeft = document.querySelector('.dungeon-topbar-left');
        const topbarCenter = document.querySelector('.dungeon-topbar-center');
        const topbarRight = document.querySelector('.dungeon-topbar-right');

        if (!labBtn || !calcBtn || !topbarLeft || !topbarCenter || !topbarRight) return;

        // Helper to move items
        const moveItems = (container, refNode = null) => {
            if (refNode) {
                container.insertBefore(labBtn, refNode);
                container.insertBefore(calcBtn, refNode);
                if (fontGroup) {
                    container.insertBefore(fontGroup, refNode);
                } else if (fontBtns.length) {
                    Array.from(fontBtns).reverse().forEach(btn => container.insertBefore(btn, refNode));
                }
            } else {
                container.appendChild(labBtn);
                container.appendChild(calcBtn);
                if (fontGroup) {
                    container.appendChild(fontGroup);
                } else if (fontBtns.length) {
                    fontBtns.forEach(btn => container.appendChild(btn));
                }
            }
        };

        if (position === 'left') {
            moveItems(topbarLeft);
        } else if (position === 'center') {
            moveItems(topbarCenter);
        } else {
            // Right (Default)
            const searchBtn = document.getElementById('dungeonSearchToggle');
            // If searchBtn exists, insert before it. Otherwise prepend to right (or append if empty, but prepend is safer fallback)
            if (searchBtn) {
                moveItems(topbarRight, searchBtn);
            } else {
                moveItems(topbarRight, topbarRight.firstChild);
            }
        }

        // Save preference
        localStorage.setItem('dungeonTopbarButtonsPosition', position);
    }

    setContentAlignment(alignment) {
        this.state.contentAlignment = alignment;
        const mainPanel = document.getElementById('dungeonMainPanel');
        const expPanel = document.getElementById('dungeonExplanationPanel');
        
        [mainPanel, expPanel].forEach(panel => {
            if (panel) {
                panel.classList.remove('align-center', 'align-right', 'align-left');
                panel.classList.add(`align-${alignment}`);
            }
        });

        // Update active state in menu
        const menu = document.getElementById('dungeonToolbarMenu');
        if (menu) {
            menu.querySelectorAll('button[data-alignment]').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.alignment === alignment);
            });
        }

        localStorage.setItem('dungeonContentAlignment', alignment);
    }

    ensureLabComponents() {
        // 1. Sidebar
        let sidebar = document.getElementById('dungeonLabSidebar');

        if (!sidebar && this.el.container) {
            const html = `
               <div id="dungeonLabSidebar" class="dungeon-lab-sidebar">
                   <div class="lab-resizer"></div>
                   <div class="lab-sidebar-header" id="dungeonLabHeader" title="Click to close">
                       <h3>Lab Values</h3>
                   </div>
                   <div id="dungeonLabFilters" class="lab-filters"></div>
                   <div class="lab-search-container">
                       <input type="text" id="dungeonLabSearch" placeholder="Search lab values..." spellcheck="false" />
                       <svg class="lab-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                   </div>
                   <div id="dungeonLabContent" class="lab-content"></div>
               </div>
          `;
            this.el.container.insertAdjacentHTML('beforeend', html);
        } else if (sidebar) {
            // Legacy Fixes

            // Remove Close Button
            const closeBtn = document.getElementById('dungeonLabClose') || sidebar.querySelector('.lab-close-btn');
            if (closeBtn) closeBtn.remove();

            // Add Resizer
            if (!sidebar.querySelector('.lab-resizer')) {
                const resizer = document.createElement('div');
                resizer.className = 'lab-resizer';
                sidebar.insertBefore(resizer, sidebar.firstChild);
            }

            // Add Filters (Immediately after Header)
            if (!document.getElementById('dungeonLabFilters')) {
                const filters = document.createElement('div');
                filters.id = 'dungeonLabFilters';
                filters.className = 'lab-filters';

                const header = document.getElementById('dungeonLabHeader') || sidebar.querySelector('.lab-sidebar-header');
                const search = sidebar.querySelector('.lab-search-container');

                if (header) {
                    header.insertAdjacentElement('afterend', filters);
                } else if (search) {
                    search.insertAdjacentElement('beforebegin', filters);
                }
            }
        }

        // 2. Button
        if (!document.getElementById('dungeonLabBtn')) {
            const rightBar = document.querySelector('.dungeon-topbar-right');
            if (rightBar) {
                const btnHtml = `
                  <button id="dungeonLabBtn" class="dungeon-topbar-btn" title="Lab Values">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M10 2v7.31"></path>
                        <path d="M14 2v7.31"></path>
                        <path d="M8.5 2h7"></path>
                        <path d="M14 9.3a6.5 6.5 0 1 1-4 0"></path>
                    </svg>
                  </button>
               `;
                rightBar.insertAdjacentHTML('afterbegin', btnHtml);
            }
        }
    }

    initLab() {
        this.ensureLabComponents();

        const sidebar = document.getElementById('dungeonLabSidebar');
        const header = document.getElementById('dungeonLabHeader') || sidebar.querySelector('.lab-sidebar-header');
        const toggle = document.getElementById('dungeonLabBtn');
        const search = document.getElementById('dungeonLabSearch');
        const filters = document.getElementById('dungeonLabFilters');
        const resizer = sidebar.querySelector('.lab-resizer');

        if (!sidebar || !toggle) return;

        this.state.activeLabCategory = 'All';
        this.renderLabFilters(filters);
        this.renderLabValues();

        // Prevent closing when clicking inside sidebar
        sidebar.onclick = (e) => {
            e.stopPropagation();
        };

        toggle.onclick = (e) => {
            e.stopPropagation();
            e.preventDefault();
            sidebar.classList.toggle('active');
            const isActive = sidebar.classList.contains('active');
            toggle.classList.toggle('active', isActive);
            this.updateToolbarPush();
            if (isActive && search) setTimeout(() => search.focus(), 50);
        };

        if (header) {
            header.onclick = () => {
                sidebar.classList.remove('active');
                toggle.classList.remove('active');
                this.updateToolbarPush();
            };
        }

        // Removed: Click outside to close (User request)

        if (search) {
            search.oninput = (e) => {
                this.renderLabValues(e.target.value);
            };
        }

        if (resizer) {
            // Restore saved width
            const savedLabWidth = localStorage.getItem('dungeonLabWidth');
            if (savedLabWidth) {
                const w = Math.max(310, Math.min(parseInt(savedLabWidth), 550));
                sidebar.style.width = `${w}px`;
            }

            resizer.onmousedown = (e) => {
                e.preventDefault();
                sidebar.classList.add('resizing');
                this.el.container?.classList.add('qa-lab-resizing');
                document.addEventListener('mousemove', onResize);
                document.addEventListener('mouseup', stopResize);
                sidebar.style.transition = 'none';
            };

            const onResize = (e) => {
                let newWidth = window.innerWidth - e.clientX;
                const amboss=this.el.container?.classList.contains('amboss-dungeon');
                const maxWidth=amboss?Math.max(310,window.innerWidth-(this.state.sidebarCollapsed?56:Number.parseInt(getComputedStyle(this.el.container).getPropertyValue('--qa-sidebar-width'))||320)-320):550;
                newWidth = Math.max(310, Math.min(newWidth, maxWidth));
                sidebar.style.width = `${newWidth}px`;
                if(amboss)this.el.container.style.setProperty('--qa-lab-panel-width',`${newWidth}px`);
                this.updateToolbarPush();
            };

            const stopResize = () => {
                document.removeEventListener('mousemove', onResize);
                document.removeEventListener('mouseup', stopResize);
                sidebar.style.transition = '';
                sidebar.classList.remove('resizing');
                this.el.container?.classList.remove('qa-lab-resizing');
                localStorage.setItem('dungeonLabWidth', parseInt(sidebar.style.width));
            };
        }

        // Sync with Toolbar Position
        const toolbar = document.getElementById('dungeonToolbar');
        if (toolbar) {
            const updateLabPos = () => {
                sidebar.classList.remove('toolbar-top', 'toolbar-bottom');

                // Check common docking classes
                if (toolbar.classList.contains('docked-top')) {
                    sidebar.classList.add('toolbar-top');
                } else if (toolbar.classList.contains('docked-bottom')) {
                    sidebar.classList.add('toolbar-bottom');
                }
                // Fallback: Check if localStorage says 'top'/bottom if classes fail? 
                // But classes are safer if dynamic.
            };

            updateLabPos();
            const obs = new MutationObserver(updateLabPos);
            obs.observe(toolbar, { attributes: true, attributeFilter: ['class'] });
        }
    }

    updateToolbarPush() {
        const root=this.el?.container;
        if(root?.classList.contains('amboss-dungeon')) {
            const panel=document.getElementById('dungeonLabSidebar');
            const active=Boolean(panel?.classList.contains('active'));
            const media=document.getElementById('dungeonImageViewer');
            const docked=Boolean(media?.classList.contains('visible')&&media.classList.contains('qa-media-docked'));
            root.classList.toggle('qa-labs-open',active);
            root.classList.toggle('qa-media-open',docked);
            root.style.setProperty('--qa-lab-width',docked?media.getBoundingClientRect().width+'px':active?panel.getBoundingClientRect().width+'px':'0px');
            root.querySelector('[data-qa="labs"]')?.setAttribute('aria-expanded',String(active));
        }
        // Disabled: Toolbar should not move when lab sidebar opens
        // const sidebar = document.getElementById('dungeonLabSidebar');
        // const toolbar = document.getElementById('dungeonToolbar');
        // if (!sidebar || !toolbar) return;

        // const rect = toolbar.getBoundingClientRect();
        // const isRight = rect.left > window.innerWidth / 2;

        // const isActive = sidebar.classList.contains('active');
        // const width = sidebar.getBoundingClientRect().width;

        // if (isActive && isRight) {
        //      toolbar.style.transform = `translateX(-${width}px)`;
        //      toolbar.style.transition = 'transform 0.3s ease';
        // } else {
        //      toolbar.style.transform = '';
        // }
    }

    renderLabFilters(container) {
        if (!container || !this.labData) return;
        const categories = ['All', ...Object.keys(this.labData)];

        container.innerHTML = categories.map(cat => `
          <button class="lab-filter-chip ${cat === this.state.activeLabCategory ? 'active' : ''}" data-cat="${cat}">
              ${cat}
          </button>
      `).join('');

        container.querySelectorAll('.lab-filter-chip').forEach(btn => {
            btn.onclick = () => {
                this.state.activeLabCategory = btn.dataset.cat;
                this.renderLabFilters(container);
                const search = document.getElementById('dungeonLabSearch');
                this.renderLabValues(search ? search.value : "");
            };
        });
    }

    renderLabValues(filter = "") {
        const content = document.getElementById('dungeonLabContent');
        if (!content || !this.labData) return;

        content.innerHTML = "";
        const filterLower = filter.toLowerCase().trim();
        const activeCat = this.state.activeLabCategory || 'All';

        // Abbreviation Mappings for Search
        const searchMappings = {
            "bp": "blood pressure",
            "hr": "heart rate",
            "rr": "respiratory rate",
            "temp": "temperature",
            "hgb": "hemoglobin",
            "hct": "hematocrit",
            "o2": "oxygen",
            "sat": "saturation",
            "plt": "platelets",
            "na": "sodium",
            "k": "potassium",
            "cl": "chloride",
            "ca": "calcium",
            "mg": "magnesium",
            "glu": "glucose",
            "cr": "creatinine",
            "pmn": "neutrophils",
            "anc": "neutrophils",
            "bil": "bilirubin",
            "alb": "albumin",
            "tsh": "thyroid",
            "ua": "urine"
        };

        const mappedTerm = searchMappings[filterLower];

        for (const [category, items] of Object.entries(this.labData)) {
            if (activeCat !== 'All' && activeCat !== category) continue;

            const filteredItems = items.filter(item => {
                if (!filterLower) return true;

                const nameLower = item.name.toLowerCase();
                const valLower = item.normal.toLowerCase();

                // 1. Direct Match
                if (nameLower.includes(filterLower) || valLower.includes(filterLower)) return true;

                // 2. Mapped Match (e.g. user typed "bp", we check if name includes "blood pressure")
                if (mappedTerm && nameLower.includes(mappedTerm)) return true;

                return false;
            });

            if (filteredItems.length > 0) {
                const group = document.createElement('div');
                group.className = 'lab-group';

                const header = document.createElement('div');
                header.className = 'lab-group-header';
                header.textContent = category;
                group.appendChild(header);

                filteredItems.forEach(item => {
                    const itemEl = document.createElement('div');
                    itemEl.className = 'lab-item';
                    itemEl.innerHTML = `
                       <span class="lab-name">${item.name}</span>
                       <span class="lab-value">${item.normal}</span>
                   `;
                    // Highlight search match if simple
                    if (filterLower.length > 1) {
                        const regex = new RegExp(`(${filterLower})`, 'gi');
                        // Optional: highlighting logic could go here
                    }
                    group.appendChild(itemEl);
                });

                content.appendChild(group);
            }
        }

        if (content.children.length === 0) {
            content.innerHTML = `<div style="padding: 20px; text-align: center; color: var(--text-muted); font-size: 0.9rem;">No matches found</div>`;
        }
    }

    initCalculator() {
        const calc = document.getElementById('dungeonCalculator');
        const display = document.getElementById('dungeonCalcDisplay');
        const header = document.getElementById('dungeonCalcHeader');
        const closeBtn = document.getElementById('dungeonCalcClose');
        const toggleBtn = document.getElementById('dungeonCalcBtn');

        if (!calc || !display || !header || !closeBtn) return;

        // Toggle Visibility
        if (toggleBtn) {
            toggleBtn.onclick = () => {
                calc.classList.toggle('hidden');
                const isActive = !calc.classList.contains('hidden');
                toggleBtn.classList.toggle('active', isActive);

                if (isActive) {
                    // Determine safe position if off-screen (reset)
                    const rect = calc.getBoundingClientRect();
                    if (rect.bottom < 0 || rect.right < 0 || rect.top < 0) {
                        calc.style.top = '80px';
                        calc.style.right = '20px';
                        calc.style.left = '';
                    }
                }
            };
        }

        closeBtn.onclick = () => {
            calc.classList.add('hidden');
            if (toggleBtn) toggleBtn.classList.remove('active');
        };

        // Draggable Logic
        let isDragging = false;
        let startX, startY, initialLeft, initialTop;

        header.onmousedown = (e) => {
            if (e.target.closest('button')) return; // Don't drag if clicking close button
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            const rect = calc.getBoundingClientRect();
            initialLeft = rect.left;
            initialTop = rect.top;
            calc.style.cursor = 'grabbing';
            document.body.style.userSelect = 'none'; // Prevent text selection
        };

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            e.preventDefault();
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            calc.style.left = `${initialLeft + dx}px`;
            calc.style.top = `${initialTop + dy}px`;
            calc.style.right = 'auto'; // Disable right once moved
        });

        document.addEventListener('mouseup', () => {
            isDragging = false;
            if (header) header.style.cursor = 'grab';
            document.body.style.userSelect = '';
        });

        // Calculator Logic
        let currentExpr = '';
        let resultDisplayed = false;

        const updateDisplay = (val) => {
            display.textContent = val || '0';
            display.scrollLeft = display.scrollWidth; // Auto scroll to end
        };

        // Mode Switch
        const modeBasicBtn = document.getElementById('dungeonCalcModeBasic');
        const modeAdvBtn = document.getElementById('dungeonCalcModeAdv');
        const advRow = document.getElementById('dungeonCalcAdvRow');

        if (modeBasicBtn && modeAdvBtn && advRow) {
            modeBasicBtn.onclick = () => {
                modeBasicBtn.classList.add('active');
                modeAdvBtn.classList.remove('active');
                advRow.classList.add('hidden');
            };
            modeAdvBtn.onclick = () => {
                modeAdvBtn.classList.add('active');
                modeBasicBtn.classList.remove('active');
                advRow.classList.remove('hidden');
            };
        }

        // Keys
        calc.querySelectorAll('.calc-btn').forEach(btn => {
            btn.onclick = () => {
                const val = btn.dataset.val;
                if (!val) return;

                // Clear handling
                if (val === 'C') {
                    currentExpr = '';
                    resultDisplayed = false;
                    updateDisplay('0');
                    return;
                }

                // Backspace
                if (val === 'backspace') {
                    if (resultDisplayed) {
                        currentExpr = '';
                        resultDisplayed = false;
                    } else {
                        currentExpr = currentExpr.slice(0, -1);
                    }
                    updateDisplay(currentExpr);
                    return;
                }

                // Calculate
                if (val === '=') {
                    try {
                        // Safe-ish Evaluation
                        // Replace symbols for evaluation
                        let evalExpr = currentExpr
                            .replace(/×/g, '*') // Just in case visual use
                            .replace(/pi/g, 'Math.PI')
                            .replace(/e/g, 'Math.E')
                            .replace(/sin/g, 'Math.sin')
                            .replace(/cos/g, 'Math.cos')
                            .replace(/tan/g, 'Math.tan')
                            .replace(/log/g, 'Math.log10')
                            .replace(/ln/g, 'Math.log')
                            .replace(/sqrt/g, 'Math.sqrt')
                            .replace(/pow/g, 'Math.pow') // Handling pow if used as func
                            .replace(/\^/g, '**')
                            .replace(/exp/g, 'Math.exp');

                        // Filter unsafe characters
                        if (/[^0-9+\-*/().% \w]/.test(evalExpr.replace(/Math\.\w+/g, ''))) {
                            throw new Error('Invalid Input');
                        }

                        // Simple evaluation
                        // eslint-disable-next-line no-eval
                        const result = eval(evalExpr);

                        // Check for Infinity/NaN
                        if (!isFinite(result) || isNaN(result)) {
                            throw new Error('Math Error');
                        }

                        // formatting
                        let final = parseFloat(result.toFixed(10)).toString(); // 10 decimal precision
                        currentExpr = final;
                        resultDisplayed = true;
                        updateDisplay(final);

                    } catch (e) {
                        updateDisplay('Error');
                        resultDisplayed = true;
                        currentExpr = '';
                    }
                    return;
                }

                // Append input
                if (resultDisplayed) {
                    // If starting new number/func, clear previous result unless operator
                    if (['+', '-', '*', '/', '^', '%'].includes(val)) {
                        resultDisplayed = false;
                    } else {
                        currentExpr = '';
                        resultDisplayed = false;
                    }
                }

                // Function wrapping
                if (['sin', 'cos', 'tan', 'log', 'ln', 'sqrt', 'exp'].includes(val)) {
                    currentExpr += val + '(';
                } else if (val === 'pow') {
                    currentExpr += '^';
                } else {
                    currentExpr += val;
                }

                updateDisplay(currentExpr);
            };
        });

        // Keyboard Support
        document.addEventListener('keydown', (e) => {
            if (calc.classList.contains('hidden')) return;

            const key = e.key;
            let btnSelector = null;

            if (/[0-9]/.test(key)) {
                btnSelector = `.calc-btn[data-val="${key}"]`;
            } else if (key === '.') {
                btnSelector = '.calc-btn[data-val="."]';
            } else if (key === '+' || key === '-') {
                btnSelector = `.calc-btn[data-val="${key}"]`;
            } else if (key === '*' || key.toLowerCase() === 'x') {
                btnSelector = '.calc-btn[data-val="*"]';
            } else if (key === '/') {
                btnSelector = '.calc-btn[data-val="/"]';
            } else if (key === 'Enter' || key === '=') {
                btnSelector = '.calc-btn[data-val="="]';
                e.preventDefault(); // Prevent default enter behavior
            } else if (key === 'Backspace') {
                btnSelector = '.calc-btn[data-val="backspace"]';
            } else if (key === 'Escape') {
                btnSelector = '.calc-btn[data-val="C"]';
            } else if (key === '(' || key === ')') {
                btnSelector = `.calc-btn[data-val="${key}"]`;
            }

            if (btnSelector) {
                const btn = calc.querySelector(btnSelector);
                if (btn) {
                    btn.click();
                    // Optional: Add visual active state briefly
                    btn.style.transform = 'scale(0.95)';
                    setTimeout(() => btn.style.transform = '', 100);
                }
            }
        });
    }

    async setTheme(theme) {
        // Apply theme to document body (Matching app.js logic)
        document.body.classList.remove('theme-light');

        if (theme === 'light') {
            document.body.classList.add('theme-light');
        }
        // 'dark' is default (no class)

        // Sync with backend storage
        if (window.Storage && window.Storage.saveSettings) {
            try {
                // Load fresh settings to avoid overwrites
                let settings = {};
                if (window.Storage.loadSettings) {
                    settings = await window.Storage.loadSettings();
                }

                // Update
                settings.theme = theme;

                // Save
                await window.Storage.saveSettings(settings);

                // Update global state if exposed
                if (window.state && window.state.settings) {
                    window.state.settings.theme = theme;
                }

            } catch (e) {
                console.error("Dungeon: Failed to sync theme", e);
            }
        }

        // Fallback / Local sync
        localStorage.setItem('theme', theme);

        // Notify app
        window.dispatchEvent(new CustomEvent('theme-changed', { detail: { theme } }));
    }


    updateHighlightSVG(toolbar) {
        const highlightBtn = toolbar.querySelector('.dungeon-tool-btn[data-tool="highlight"]');
        if (!highlightBtn) return;

        const isVertical = toolbar.classList.contains('vertical');
        const svgPath = highlightBtn.querySelector('svg path:nth-child(2)');

        if (svgPath) {
            if (isVertical) {
                // Vertical orientation - slightly different end point
                svgPath.setAttribute('d', 'm22 12-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4l3-3 3 3L23 10z');
            } else {
                // Horizontal orientation - original path
                svgPath.setAttribute('d', 'm22 12-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4l3-3 3 3L24 10z');
            }
        }
    }

    toggleHighlightMode() {
        this.state.highlightMode = !this.state.highlightMode;
        this.renderToolbarState();
    }

    toggleStar() {
        const q = this.state.questions[this.state.currentIndex];
        if (!q) return;

        // Update local state (standardize on 'starred' to match QuestionBase)
        q.starred = !(q.starred || q.isStarred);
        // remove legacy isStarred if present to avoid confusion
        delete q.isStarred;
        this.updateQuestionTitle();

        this.renderToolbarState();

        // SYNC WITH QUESTION BASE & PERSIST
        if (window.QuestionBase && window.QuestionBase.state) {
            const qBaseQuestion = window.QuestionBase.state.questions.find(item => item.id === q.id);
            if (qBaseQuestion) {
                qBaseQuestion.starred = q.starred;

                // Persist via QuestionBase (Handles FileSystem/Electron/LocalStorage)
                window.QuestionBase.saveData();

                // Update UI
                window.QuestionBase.renderSidebar();
            }
        }

        this.renderSidebar(); // Update Dungeon Sidebar instantly
        if (q.contentFormat === 'medos-html') { this.saveQuestionsToBackend(); return; }
        this.updateSaveStatus('saved');
    }

    highlightTextRange(range, root, colorClass) {
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
        const parts = [];
        while (walker.nextNode()) {
            const node = walker.currentNode;
            if (!range.intersectsNode(node)) continue;
            let start = node === range.startContainer ? range.startOffset : 0;
            let end = node === range.endContainer ? range.endOffset : node.length;
            while (start < end && /\s/.test(node.data[start])) start++;
            while (end > start && /\s/.test(node.data[end - 1])) end--;
            if (end > start) parts.push({ node, start, end });
        }
        const spans = [];
        for (const { node, start, end } of parts.reverse()) {
            if (end < node.length) node.splitText(end);
            const text = start ? node.splitText(start) : node;
            const span = document.createElement('span'); span.className = colorClass;
            text.replaceWith(span); span.append(text); spans.unshift(span);
        }
        if (spans.length) {
            const selected = document.createRange();
            selected.setStart(spans[0].firstChild, 0);
            selected.setEnd(spans[spans.length - 1].firstChild, spans[spans.length - 1].firstChild.length);
            const selection = window.getSelection(); selection.removeAllRanges(); selection.addRange(selected);
        }
        return spans.length;
    }

    handleHighlight(e, type, id) {
        if (!this.state.highlightMode) return;

        // Stop highlighting for options entirely (Crossing out is enough)
        if (type === 'option') return;

        const q = this.state.questions[this.state.currentIndex];
        const selection = window.getSelection();

        // 1. Un-Highlight (Clicking existing highlight)
        if (selection.toString().length === 0) {
            const isHighlight = e.target.classList.contains('highlight') || 
                               Array.from(e.target.classList).some(c => c.startsWith('highlight-'));
            
            if (isHighlight) {
                this.pushHistoryState(); // Snapshot before change
                
                const content = e.target.textContent;
                const parent = e.target.parentNode;
                // replace span with text node
                const textNode = document.createTextNode(content);
                parent.replaceChild(textNode, e.target);
                parent.normalize(); // merge text nodes

                // Persist Removal
                if (type === 'main') {
                    if (q.contentFormat === 'medos-html') window.MedicalLibrary.captureMarkup(q, e.currentTarget);
                    else q.text = e.currentTarget.innerHTML;
                }

                this.updateSaveStatus('unsaved');
                this.saveQuestionsToBackend();
            }
            return;
        }

        if (!selection.toString().trim()) return;

        // 2. Add Highlight (Selection)
        if (selection.toString().length > 0) {
            const range = selection.getRangeAt(0);

            // Keep boundary whitespace outside the highlight without changing the text.
            if (range.startContainer.nodeType === Node.TEXT_NODE) {
                const text=range.startContainer.textContent;
                let start=range.startOffset;
                const end=range.startContainer===range.endContainer?range.endOffset:text.length;
                while(start<end && /\s/.test(text[start]))start++;
                range.setStart(range.startContainer,start);
            }
            if (range.endContainer.nodeType === Node.TEXT_NODE) {
                const text=range.endContainer.textContent;
                let end=range.endOffset;
                const start=range.startContainer===range.endContainer?range.startOffset:0;
                while(end>start && /\s/.test(text[end-1]))end--;
                range.setEnd(range.endContainer,end);
            }
            // Ensure we are selecting inside the context box
            if (!e.currentTarget.contains(range.commonAncestorContainer)) return;

            this.pushHistoryState(); // Snapshot before change

            const span = document.createElement("span");
            const colorClass = this.state.activeHighlightColor === 'yellow' ? 'highlight' : `highlight-${this.state.activeHighlightColor}`;
            span.className = colorClass;
            try {
                if (!this.highlightTextRange(range, e.currentTarget, colorClass)) return;

                // Persist Addition
                if (type === 'main') {
                    if (q.contentFormat === 'medos-html') window.MedicalLibrary.captureMarkup(q, e.currentTarget);
                    else q.text = e.currentTarget.innerHTML;
                }

                this.updateSaveStatus('unsaved');
                this.saveQuestionsToBackend();
            } catch (err) {
                console.warn("Highlight failed (crossing tags?)", err);
            }
        }
    }

    // handleHighlightTouch: mirrors handleHighlight but for touch events on iPad.
    // Called via ontouchend on the context box element.
    handleHighlightTouch(e, type) {
        if (!this.state.highlightMode) return;
        if (type === 'option') return;

        // Capture static information before the event object is recycled or cleared
        const contextBox = e.currentTarget; 
        const touchX = e.changedTouches && e.changedTouches[0] ? e.changedTouches[0].clientX : null;
        const touchY = e.changedTouches && e.changedTouches[0] ? e.changedTouches[0].clientY : null;

        // Use a small delay so iOS has time to finalize the selection range
        setTimeout(() => {
            const selection = window.getSelection();
            const q = this.state.questions[this.state.currentIndex];
            
            // Un-highlight: tap on existing highlight with no selection
            const hasSelection = selection && selection.rangeCount > 0 && selection.toString().length > 0;
            
            if (!hasSelection) {
                if (touchX !== null && touchY !== null) {
                    const target = document.elementFromPoint(touchX, touchY);
                    const isHighlight = target && (target.classList.contains('highlight') || 
                                       Array.from(target.classList).some(c => c.startsWith('highlight-')));
                    
                    if (isHighlight) {
                        this.pushHistoryState();
                        const content = target.textContent;
                        const parent = target.parentNode;
                        const textNode = document.createTextNode(content);
                        parent.replaceChild(textNode, target);
                        parent.normalize();
                        if (type === 'main' && contextBox) {
                            if (q.contentFormat === 'medos-html') window.MedicalLibrary.captureMarkup(q, contextBox);
                            else q.text = contextBox.innerHTML;
                        }
                        this.updateSaveStatus('unsaved');
                        this.saveQuestionsToBackend();
                    }
                }
                return;
            }

            // Add highlight: text is selected
            const range = selection.getRangeAt(0);
            if (!contextBox || !contextBox.contains(range.commonAncestorContainer)) return;

            // Prevent double-highlighting if already highlighted in this block
            if (range.commonAncestorContainer.nodeType === 1 && range.commonAncestorContainer.classList.contains('highlight')) return;
            if (range.commonAncestorContainer.parentElement && range.commonAncestorContainer.parentElement.classList.contains('highlight')) return;

            this.pushHistoryState();
            const span = document.createElement('span');
            const colorClass = this.state.activeHighlightColor === 'yellow' ? 'highlight' : `highlight-${this.state.activeHighlightColor}`;
            span.className = colorClass;
            try {
                if (!this.highlightTextRange(range, contextBox, colorClass)) return;
                if (type === 'main') {
                    if (q.contentFormat === 'medos-html') window.MedicalLibrary.captureMarkup(q, contextBox);
                    else q.text = contextBox.innerHTML;
                }
                this.updateSaveStatus('unsaved');
                this.saveQuestionsToBackend();
            } catch (err) {
                console.warn('Touch highlight failed:', err);
            }
        }, 150); // Increased delay for iPad menu animations
    }

    // Mobile touch support for highlighting
    initMobileHighlightSupport() {
        // 1. selectionchange: The most reliable way on iPad to detect when selection "settles"
        document.addEventListener('selectionchange', () => {
            if (!this.state.highlightMode) return;

            // Debounce so we don't highlight while they are still dragging handles
            clearTimeout(this._selectionTimer);
            this._selectionTimer = setTimeout(() => {
                const selection = window.getSelection();
                if (selection && selection.rangeCount > 0 && selection.toString().length > 3) {
                    const range = selection.getRangeAt(0);
                    // Find context box
                    let node = range.commonAncestorContainer;
                    if (node.nodeType !== 1) node = node.parentElement;
                    const contextBox = node.closest('.dungeon-context-box');
                    
                    if (contextBox) {
                        // Trigger highlight. We pass a fake event since we only need currentTarget
                        this.handleHighlightTouch({ currentTarget: contextBox }, 'main');
                    }
                }
            }, 600); // 600ms pause in selection changes
        });

        // 2. Highlight-button touchend fallback: lets user tap the toolbar button
        // after selecting text to apply the highlight (useful on all devices).
        const bindHighlightBtn = () => {
            const highlightBtn = document.querySelector('[data-tool="highlight"]');
            if (highlightBtn && !highlightBtn._touchBound) {
                highlightBtn._touchBound = true;
                highlightBtn.addEventListener('touchend', (e) => {
                    if (!this.state.highlightMode) return;
                    const selection = window.getSelection();
                    if (selection && selection.toString().length > 0) {
                        e.preventDefault();
                        // Find the context box the selection is inside
                        const range = selection.getRangeAt(0);
                        const contextBox = range.commonAncestorContainer.nodeType === 1
                            ? range.commonAncestorContainer.closest('.dungeon-context-box')
                            : range.commonAncestorContainer.parentElement.closest('.dungeon-context-box');
                        if (!contextBox) return;
                        const fakeEvent = { currentTarget: contextBox, target: contextBox, changedTouches: e.changedTouches };
                        this.handleHighlightTouch(fakeEvent, 'main');
                    }
                });
            }
        };
        // Try immediately and after a short delay in case toolbar renders late
        bindHighlightBtn();
        setTimeout(bindHighlightBtn, 1000);
    }

    saveQuestionsToBackend() {
        this.updateSaveStatus('saving');
        if (this.state.associatedSessionId?.startsWith('medos-')) {
            return window.MedicalLibrary.saveDungeonSession(this).catch(error => {
                console.error('[Dungeon] Library session save failed:', error);
            });
        }

        // 1. Force sync ALL questions in the current session back to QuestionBase
        if (window.QuestionBase && window.QuestionBase.state) {
            this.state.questions.forEach(dq => {
                const mq = window.QuestionBase.state.questions.find(item => item.id === dq.id);
                if (mq) {
                    mq.submittedAnswer = dq.submittedAnswer;
                    mq.revealed = dq.revealed;
                    mq.crossedOutOptionIds = dq.crossedOutOptionIds;
                    mq.timerElapsed = dq.timerElapsed;
                    mq.starred = dq.starred;
                    mq.isStarred = dq.isStarred;
                    if (dq.tags) mq.tags = dq.tags;
                }
            });
            window.QuestionBase.saveData(); // This handles LocalStorage, Electron, and Server
        } else {
            // Fallback if QuestionBase is not available (though it should be)
            if (window.Storage && window.Storage.saveQuestions) {
                window.Storage.saveQuestions({
                    questions: this.state.questions,
                    folders: []
                });
            }
        }

        setTimeout(() => this.updateSaveStatus('saved'), 500);
    }

    renderToolbarState() {
        const toolbar = document.getElementById("dungeonToolbar");
        if (!toolbar) return;

        const q = this.state.questions[this.state.currentIndex];

        // Star
        const starBtn = toolbar.querySelector('[data-tool="star"]');
        if (starBtn && q) {
            // Check both for backward compatibility during migration
            if (q.starred || q.isStarred) starBtn.classList.add('active');
            else starBtn.classList.remove('active');
        }

        // Highlight
        const highlightBtn = toolbar.querySelector('[data-tool="highlight"]');
        if (highlightBtn) {
            if (this.state.highlightMode) highlightBtn.classList.add('active');
            else highlightBtn.classList.remove('active');
        }

        // Undo/Redo
        const undoBtn = document.getElementById('dungeonToolUndo');
        const redoBtn = document.getElementById('dungeonToolRedo');

        if (undoBtn) {
            if (this.history.past.length === 0) {
                undoBtn.classList.add('disabled');
                undoBtn.style.opacity = '0.4';
                undoBtn.style.cursor = 'not-allowed';
            } else {
                undoBtn.classList.remove('disabled');
                undoBtn.style.opacity = '1';
                undoBtn.style.cursor = 'pointer';
            }
        }

        if (redoBtn) {
            if (this.history.future.length === 0) {
                redoBtn.classList.add('disabled');
                redoBtn.style.opacity = '0.4';
                redoBtn.style.cursor = 'not-allowed';
            } else {
                redoBtn.classList.remove('disabled');
                redoBtn.style.opacity = '1';
                redoBtn.style.cursor = 'pointer';
            }
        }
    }

    addNote() {
        if (this.currentNote) {
            this.currentNote.destroy();
            this.currentNote = null;
            return;
        }

        const q = this.state.questions[this.state.currentIndex];
        if (!q) return;

        this.currentNote = new DungeonNote(this, q.id);
    }


    // Returns the current session mode based on the first question's settings
    _getSessionMode() {
        const q = this.state.questions[0];
        if (!q) return 'tutor';
        if (q._allMode) return 'all';
        if (q._tutorMode === false) {
            return this.state.isBlockRevealed ? 'revealed-exam' : 'exam';
        }
        return 'tutor';
    }

    startTimer() {
        this.stopTimer(); // Clear existing
        const q = this.state.questions[this.state.currentIndex];
        const timerEl = document.getElementById('dungeonTimer');
        if (!timerEl) return;

        // Track when this question started for the "Hide Timer (1 min)" feature
        if (!this.questionStartTime) {
            this.questionStartTime = Date.now();
        }

        // If the exam block is already revealed (session finished/resumed), freeze timer
        if (this.state.isBlockRevealed) {
            const mode = this._getSessionMode();
            const modeLabel = mode === 'exam' || mode === 'revealed-exam' ? 'Exam' : 'Tutor';
            timerEl.textContent = `${modeLabel} | Completed`;
            timerEl.title = 'Session completed';
            return;
        }

        const timerMode = q._timerMode || 'off';
        const timerScope = q._timerScope || 'question';
        const timerSecs = q._timerSecs || 60;

        if (timerMode === 'off' || q._timerMode === 'untimed') {
            const mode = this._getSessionMode();
            const modeLabel = (mode === 'exam' || mode === 'revealed-exam') ? 'Exam' : (mode === 'all' ? 'Open Mode' : 'Tutor');
            timerEl.textContent = `${modeLabel} | Untimed`;
            timerEl.title = "Assessment is untimed";
            return;
        }

        // Handle Session-wide timer initialization
        if (timerMode === 'down' && timerScope === 'session' && !this.sessionTimerStart) {
            this.sessionTimerStart = Date.now();
        }

        // Initialize tracker for stopTimer()
        this._timerQuestion = q;
        this._timerInitialMs = (timerMode === 'up') ? (q.timerElapsed || 0) : null;
        const savedBlockRemaining = q.contentFormat === 'medos-html' && timerScope === 'session' ? (q._blockRemainingMs ?? timerSecs * 1000) : timerSecs * 1000;
        if (q.contentFormat === 'medos-html' && timerMode === 'down' && timerScope === 'session') {
            this.sessionTimerStart = Date.now();
            this._timerInitialMs = savedBlockRemaining;
        }
        
        // Stop 'up' timer from ticking if question is answered, committed (exam), or revealed
        const answer = this.state.answers.get(q.id);
        const isAnswered = (answer && answer.submitted && (q._tutorMode !== false || answer.timerStopped)) || q.revealed;
        if (timerMode === 'up' && isAnswered) {
            this.updateTimerDisplay(q.timerElapsed || 0);
            return; 
        }

        // For per-question countdown: restore remaining time if we've been here before
        if (timerMode === 'down' && timerScope === 'question') {
            // If answered or timed out, show frozen time and don't run
            const existingAnswer = this.state.answers.get(q.id);
            if (q._timedOut) {
                timerEl.textContent = '0:00';
                timerEl.title = 'Time expired for this question';
                return;
            }
            if (existingAnswer && existingAnswer.submitted && !existingAnswer.examCommitted) {
                // Answered via normal submit — show remaining time frozen, don't tick
                const frozenMs = (q._remainingMs !== undefined) ? q._remainingMs : (timerSecs * 1000);
                this.updateTimerDisplay(frozenMs);
                return;
            }
            // Restore saved remaining time (from a previous visit), otherwise start fresh
            const initialMs = (q._remainingMs !== undefined) ? q._remainingMs : (timerSecs * 1000);
            this.lastTimerMs = initialMs;
            this.timerStart = Date.now();
            // Track which question owns this timer
            this._timerQuestion = q;
            this._timerInitialMs = initialMs;
            this.updateTimerDisplay(initialMs);

            this.timerInterval = setInterval(() => {
                const now = Date.now();
                const elapsed = now - this.timerStart;
                this.lastTimerMs = Math.max(0, initialMs - elapsed);

                if (this.lastTimerMs <= 0) {
                    this.updateTimerDisplay(0);
                    q._timedOut = true;
                    q._remainingMs = 0;
                    this.handlePerQuestionTimeUp(q);
                } else {
                    this.updateTimerDisplay(this.lastTimerMs);
                }
            }, 100);
            return;
        }

        this.timerStart = Date.now();
        
        // Initial display
        if (timerMode === 'up') {
            this.updateTimerDisplay(q.timerElapsed || 0);
        } else if (timerMode === 'down') {
            const initialRemaining = timerScope === 'session' 
                ? savedBlockRemaining - (Date.now() - this.sessionTimerStart)
                : (timerSecs * 1000);
            this.updateTimerDisplay(Math.max(0, initialRemaining));
        }

        this.timerInterval = setInterval(() => {
            const now = Date.now();
            const elapsedSinceRender = now - this.timerStart;
            
            if (timerMode === 'up') {
                this.lastTimerMs = (q.timerElapsed || 0) + elapsedSinceRender;
            } else {
                // Down + Session scope
                this.lastTimerMs = Math.max(0, savedBlockRemaining - (now - this.sessionTimerStart));
            }

            if (timerMode === 'down' && this.lastTimerMs <= 0) {
                this.updateTimerDisplay(0);
                this.handleTimeUp();
            } else {
                this.updateTimerDisplay(this.lastTimerMs);
            }
        }, 100);
    }

    // Called when a per-question countdown hits zero
    handlePerQuestionTimeUp(q) {
        this.stopTimer();
        // Auto-submit if not already answered
        if (!this.state.answers.has(q.id)) {
            const autoAnswer = {
                selectedId: null,
                isCorrect: false,
                submitted: true,
                autoSubmitted: true,
                timestamp: Date.now()
            };
            this.state.answers.set(q.id, autoAnswer);
            q.submittedAnswer = autoAnswer;
        } else {
            // Lock the existing answer
            const ans = this.state.answers.get(q.id);
            if (ans) ans.locked = true;
        }
        this.renderSidebar();
        this.renderQuestion();
        if (q.contentFormat === 'medos-html') this.saveQuestionsToBackend();
    }

    handleTimeUp() {
        this.stopTimer();
        
        // Finalize scoring for unanswered questions
        this.state.questions.forEach(q => {
            if (!this.state.answers.has(q.id)) {
                const autoAnswer = {
                    selectedId: null,
                    isCorrect: false,
                    submitted: true,
                    timestamp: Date.now()
                };
                this.state.answers.set(q.id, autoAnswer);
                q.submittedAnswer = autoAnswer;
                q.revealed = true;
            }
        });

        if (this.state.questions.some(q => q.contentFormat === 'medos-html')) {
            this.state.isBlockRevealed = true;
            this.saveQuestionsToBackend();
        }
        const stats = this.calculateStats();
        this.showTimeUpDialog(stats);
    }

    showTimeUpDialog(stats) {
        // Create modal
        const modal = document.createElement('div');
        modal.id = 'dungeonTimeUpModal';
        modal.className = 'dungeon-modal-overlay';
        
        const remainingQs = this.state.questions.length - this.state.answers.size;
        const total = this.state.questions.length;
        const score = total > 0 ? Math.round((stats.correct / total) * 100) : 0;

        modal.innerHTML = `
            <div class="dungeon-modal-content center-window">
                <div class="dungeon-modal-header">
                    <h2>Time is Up!</h2>
                </div>
                <div class="dungeon-modal-body">
                    <div class="dungeon-results-summary">
                        <div class="dungeon-result-stat">
                            <span class="label">Final Score</span>
                            <span class="value score">${score}%</span>
                        </div>
                        <div class="dungeon-result-stat">
                            <span class="label">Correct</span>
                            <span class="value correct">${stats.correct}</span>
                        </div>
                        <div class="dungeon-result-stat">
                            <span class="label">Incorrect</span>
                            <span class="value incorrect">${stats.wrong}</span>
                        </div>
                    </div>
                    <p class="dungeon-modal-text">Unanswered questions have been marked as incorrect.</p>
                </div>
                <div class="dungeon-modal-footer">
                    <button id="timeUpLeaveBtn" class="dungeon-btn secondary">Leave Session</button>
                    <button id="timeUpExploreBtn" class="dungeon-btn primary">Explore the Answers</button>
                </div>
            </div>
        `;

        document.getElementById('dungeonBase').appendChild(modal);

        document.getElementById('timeUpLeaveBtn').onclick = () => {
            modal.remove();
            this.close();
        };

        document.getElementById('timeUpExploreBtn').onclick = () => {
            modal.remove();
            this.state.isBlockRevealed = true;
            this.submitBlock(true); // Call submitBlock without confirmation to refresh UI
        };
    }

    stopTimer() {
        const now = Date.now();
        if (!this.timerStart) {
            // If timer isn't active, ensure we clear tracking refs anyway
            this._timerQuestion = null;
            this._timerInitialMs = null;
            return;
        }

        // Save remaining/elapsed time to the CORRECT question (tracked at start)
        const q = this._timerQuestion;
        if (q?.contentFormat === 'medos-html' && q._timerMode === 'down') {
            const elapsed = Math.max(0, Math.min(now - this.timerStart, this._timerInitialMs ?? now - this.timerStart));
            q.timerElapsed = (q.timerElapsed || 0) + elapsed;
            if (q._timerScope === 'session') {
                const remaining = Math.max(0, (this._timerInitialMs ?? q._timerSecs * 1000) - elapsed);
                this.state.questions.forEach(item => { item._blockRemainingMs = remaining; });
            }
        }
        if (q && !q._timedOut) {
            const elapsed = now - this.timerStart;
            if (q._timerMode === 'up') {
                q.timerElapsed = (q.timerElapsed || 0) + elapsed;
            } else if (q._timerMode === 'down' && q._timerScope === 'question' && this._timerInitialMs !== null) {
                q._remainingMs = Math.max(0, this._timerInitialMs - elapsed);
            }
        }
        
        this._timerQuestion = null;
        this._timerInitialMs = null;
        this.timerStart = null; // Mark inactive

        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    updateTimerDisplay(ms) {
        const bauClock=this.el.main?.querySelector('[data-bau-clock] strong');
        if(bauClock){const seconds=Math.max(0,Math.ceil(ms/1000));bauClock.textContent=`${Math.floor(seconds/3600)}:${String(Math.floor(seconds/60)%60).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`;}
        const blockClock=document.getElementById('dungeonBlockElapsed');
        if(blockClock){
            const saved=this.state.questions.reduce((sum,q)=>sum+(Number(q.timerElapsed)||0),0);
            const live=this.timerInterval && this.timerStart ? Math.max(0,Date.now()-this.timerStart) : 0;
            const current=this.state.questions[this.state.currentIndex];
            const timed=current?._timerMode==='down';
            let blockMs=saved+live;
            if(timed && current._timerScope==='session') {
                blockMs=Math.max(0,ms);
            } else if(timed) {
                blockMs=this.state.questions.reduce((sum,item)=>sum+Math.max(0,item._remainingMs ?? ((Number(item._timerSecs)||60)*1000-(Number(item.timerElapsed)||0))),0);
                const currentSaved=Math.max(0,current._remainingMs ?? ((Number(current._timerSecs)||60)*1000-(Number(current.timerElapsed)||0)));
                blockMs=Math.max(0,blockMs-currentSaved+Math.max(0,ms));
            }
            const seconds=timed ? Math.ceil(blockMs/1000) : Math.floor(blockMs/1000);
            blockClock.title=timed ? 'Block time remaining' : 'Block time elapsed';
            blockClock.textContent=[Math.floor(seconds/3600),Math.floor(seconds/60)%60,seconds%60].map(n=>String(n).padStart(2,'0')).join(':');
        }

        this.lastTimerMs = ms;
        this.updateAmbossClocks?.(ms);
        const timerEl = document.getElementById('dungeonTimer');
        if (!timerEl) return;

        const q = this.state.questions[this.state.currentIndex];
        
        // 1. Check if timer should be hidden (Hide until 1 min passes)
        // If timer is hidden, hide the entire timer element (including icon)
        if (this.state.hideTimerUntilMinute && !this.state.isBlockRevealed) {
            const now = Date.now();
            const elapsedOnCurrentQ = now - this.questionStartTime;
            
            if (elapsedOnCurrentQ < 30000) {
                const floatingWrap = document.getElementById('dungeonFloatingTimerWrap');
                if (floatingWrap) {
                    floatingWrap.style.visibility = 'hidden';
                    floatingWrap.style.opacity = '0';
                    floatingWrap.style.pointerEvents = 'none';
                } else {
                    const statItem = timerEl.closest('.dungeon-stat-item') || timerEl;
                    statItem.style.visibility = 'hidden';
                    statItem.style.opacity = '0';
                    statItem.style.pointerEvents = 'none';
                }
                return;
            }
        }
        // Restore visibility
        {
            const floatingWrap = document.getElementById('dungeonFloatingTimerWrap');
            if (floatingWrap) {
                floatingWrap.style.visibility = '';
                floatingWrap.style.opacity = '1';
                floatingWrap.style.pointerEvents = '';
            }
            const statItem = timerEl.closest('.dungeon-stat-item') || timerEl;
            statItem.style.visibility = '';
            statItem.style.opacity = '1';
            statItem.style.pointerEvents = '';
        }
        timerEl.style.opacity = "1";

        if (q && (q._timerMode === 'untimed' || q._timerMode === 'off')) {
            const mode = this._getSessionMode();
            let modeLabel = 'Tutor';
            if (mode === 'exam' || mode === 'revealed-exam') modeLabel = 'Exam';
            else if (mode === 'all') modeLabel = 'Open Mode';
            
            timerEl.textContent = `${modeLabel} | Untimed`;
            return;
        }

        const totalSeconds = Math.floor(ms / 1000);
        const h = Math.floor(totalSeconds / 3600);
        const m = Math.floor((totalSeconds % 3600) / 60);
        const s = totalSeconds % 60;

        if (h > 0) {
            timerEl.textContent = `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        } else {
            timerEl.textContent = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        }
    }

    updateTimerLayout() {
        const timerEl = document.getElementById('dungeonTimer');
        if (!timerEl) return;
        
        const footerLeft = document.querySelector('.dungeon-footer-left');
        const container = document.getElementById('dungeonBase');
        
        // Remove existing floating timer if any
        let floatingWrap = document.getElementById('dungeonFloatingTimerWrap');
        
        if (this.state.floatingTimer) {
            if (!floatingWrap) {
                floatingWrap = document.createElement('div');
                floatingWrap.id = 'dungeonFloatingTimerWrap';
                floatingWrap.className = 'dungeon-floating-timer';
                container.appendChild(floatingWrap);
                // Make draggable
                let isDragging = false, startX, startY, startLeft, startTop;
                floatingWrap.style.cursor = 'grab';
                floatingWrap.addEventListener('mousedown', (e) => {
                    isDragging = true;
                    startX = e.clientX;
                    startY = e.clientY;
                    const rect = floatingWrap.getBoundingClientRect();
                    startLeft = rect.left;
                    startTop = rect.top;
                    floatingWrap.style.cursor = 'grabbing';
                    floatingWrap.style.right = 'auto';
                    floatingWrap.style.left = startLeft + 'px';
                    floatingWrap.style.top = startTop + 'px';
                    e.preventDefault();
                });

                floatingWrap.addEventListener('touchstart', (e) => {
                    isDragging = true;
                    const touch = e.touches[0];
                    startX = touch.clientX;
                    startY = touch.clientY;
                    const rect = floatingWrap.getBoundingClientRect();
                    startLeft = rect.left;
                    startTop = rect.top;
                    floatingWrap.style.cursor = 'grabbing';
                    floatingWrap.style.right = 'auto';
                    floatingWrap.style.left = startLeft + 'px';
                    floatingWrap.style.top = startTop + 'px';
                    // We don't preventDefault here to allow scrolling if they just tap, 
                    // but we do in touchmove.
                });

                document.addEventListener('mousemove', (e) => {
                    if (!isDragging) return;
                    let newLeft = startLeft + e.clientX - startX;
                    let newTop = startTop + e.clientY - startY;

                    // Constraints
                    const rect = floatingWrap.getBoundingClientRect();
                    const maxX = window.innerWidth - rect.width;
                    const maxY = window.innerHeight - rect.height;

                    newLeft = Math.max(0, Math.min(newLeft, maxX));
                    newTop = Math.max(0, Math.min(newTop, maxY));

                    floatingWrap.style.left = newLeft + 'px';
                    floatingWrap.style.top  = newTop + 'px';
                });

                document.addEventListener('touchmove', (e) => {
                    if (!isDragging) return;
                    e.preventDefault(); // Prevent scrolling while dragging
                    const touch = e.touches[0];
                    let newLeft = startLeft + touch.clientX - startX;
                    let newTop = startTop + touch.clientY - startY;

                    // Constraints
                    const rect = floatingWrap.getBoundingClientRect();
                    const maxX = window.innerWidth - rect.width;
                    const maxY = window.innerHeight - rect.height;

                    newLeft = Math.max(0, Math.min(newLeft, maxX));
                    newTop = Math.max(0, Math.min(newTop, maxY));

                    floatingWrap.style.left = newLeft + 'px';
                    floatingWrap.style.top  = newTop + 'px';
                }, { passive: false });

                const stopDrag = () => {
                    isDragging = false;
                    if (floatingWrap) floatingWrap.style.cursor = 'grab';
                };

                document.addEventListener('mouseup', stopDrag);
                document.addEventListener('touchend', stopDrag);
                document.addEventListener('touchcancel', stopDrag);
            }
            // Move timerEl to floatingWrap
            const timerParent = timerEl.closest('.dungeon-stat-item');
            if (timerParent) {
                floatingWrap.appendChild(timerParent);
            }
        } else {
            // Move back to footer-left
            if (floatingWrap && footerLeft) {
                const timerParent = timerEl.closest('.dungeon-stat-item');
                if (timerParent) {
                    footerLeft.appendChild(timerParent);
                }
                floatingWrap.remove();
            }
        }
    }

    updateSidebarStats() {
        let correct = 0;
        let wrong = 0;

        this.state.questions.forEach(q => {
            const ans = this.state.answers.get(q.id);
            if (ans) {
                if (ans.isCorrect) correct++;
                else wrong++;
            }
        });

        const mode = this._getSessionMode();
        const showScores = (mode === 'tutor' || mode === 'revealed-exam');
        const showTotalOnly = (mode === 'all');

        const correctEl = document.getElementById('dungeonStatCorrect');
        const wrongEl   = document.getElementById('dungeonStatWrong');
        const totalEl   = document.getElementById('dungeonStatTotal');
        const scoreEl   = document.getElementById('dungeonStatScoreTutor');

        // Stats wrappers
        const correctWrap = correctEl?.closest('.dungeon-stat-item');
        const wrongWrap   = wrongEl?.closest('.dungeon-stat-item');
        const totalWrap   = totalEl?.closest('.dungeon-stat-item');
        const scoreWrap   = scoreEl?.closest('.dungeon-stat-item');

        if (correctWrap) correctWrap.style.display = showScores ? '' : 'none';
        if (wrongWrap)   wrongWrap.style.display   = showScores ? '' : 'none';
        if (scoreWrap)   scoreWrap.style.display   = showScores ? '' : 'none';
        if (totalWrap)   totalWrap.style.display   = (showScores || showTotalOnly) ? '' : 'none';

        if (showScores || showTotalOnly) {
            if (showScores) {
                if (correctEl) correctEl.textContent = correct;
                if (wrongEl)   wrongEl.textContent   = wrong;
            }
            
            if (totalEl) {
                const current = this.state.currentIndex + 1;
                const total = this.state.questions.length;
                
                if (showTotalOnly) {
                    totalEl.textContent = `${current}/${total}`;
                } else {
                    const attempted = correct + wrong;
                    // For Question Progress: Show navigation index (current/total)
                    // The title of this element is "Question Progress"
                    totalEl.textContent = `${current}/${total}`;
                }
            }
            
            if (showScores && scoreEl) {
                const attempted = correct + wrong;
                const pct = attempted > 0 ? Math.round((correct / attempted) * 100) : 0;
                scoreEl.textContent = `${pct}%`;
            }
        }
 else {
            // Exam mode (pre-reveal): only show total attempted
            if (totalEl) {
                const attempted = correct + wrong;
                totalEl.textContent = `${attempted}/${this.state.questions.length}`;
            }
        }
    }

    clearAnswer() {
        const q = this.state.questions[this.state.currentIndex];
        if (!q) return;
        const answer = this.state.answers.get(q.id);

        // Only allow clearing if answered or revealed
        if (!q.revealed && (!answer || !answer.submitted)) return;

        // Remove from runtime state
        this.state.answers.delete(q.id);

        // Remove from question object
        delete q.submittedAnswer;
        delete q.ambossAttemptedOptionIds;

        // Reset timer
        delete q.timerElapsed;

        // Clear revealed state too
        q.revealed = false;

        // Reset selection
        this.state.selectedOption = null;

        // Persist
        this.updateSaveStatus('unsaved');
        this.saveQuestionsToBackend();

        // Re-render
        this.render();
    }

    updateRevealButton() {
        const q = this.state.questions[this.state.currentIndex];
        if (!q) return;
        const answer = this.state.answers.get(q.id);
        const revealBtn     = document.getElementById('dungeonRevealBtn');
        const clearBtn      = document.getElementById('dungeonClearBtn');
        const suspendBtn    = document.getElementById('dungeonSuspendBtn');
        const endBlockBtn   = document.getElementById('dungeonEndBlockBtn');
        const submitBlockBtn = document.getElementById('dungeonSubmitBlockBtn');
        const resultsEl     = document.getElementById('dungeonExamResults');
        const statsEl       = document.getElementById('dungeonTutorStats');

        if (!revealBtn) return;

        const mode = this._getSessionMode();
        const isExamMode    = (mode === 'exam' || mode === 'revealed-exam');
        const isRevealedSession = (mode === 'revealed-exam');
        const isOpenMode    = (mode === 'all');
        const unanswered    = this.state.questions.length - this.state.answers.size;

        // Reset visibility
        if (revealBtn) revealBtn.style.display = 'none';
        if (clearBtn) clearBtn.style.display = 'none';
        if (suspendBtn) suspendBtn.style.display = 'none';
        if (endBlockBtn) endBlockBtn.style.display = 'none';
        if (submitBlockBtn) submitBlockBtn.style.display = 'none';

        if (isOpenMode) {
            // Open Mode: Only Reveal and Clear
            if (q.revealed || (answer && answer.submitted)) {
                if (clearBtn) clearBtn.style.display = 'inline-flex';
                if (revealBtn) revealBtn.style.display = 'none';
            } else {
                if (revealBtn) {
                    revealBtn.style.display = 'inline-flex';
                    revealBtn.classList.remove('active');
                }
                if (clearBtn) clearBtn.style.display = 'none';
            }
            if (resultsEl) resultsEl.classList.add('hidden');
            if (statsEl) statsEl.classList.remove('hidden');
        } else if (isExamMode) {
            // Exam mode: hide Reveal, show Suspend
            if (suspendBtn) suspendBtn.style.display = 'inline-flex';

            if (isRevealedSession) {
                // Block already submitted/ended — hide action buttons
                if (resultsEl) resultsEl.classList.remove('hidden');
                if (statsEl)   statsEl.classList.add('hidden');
            } else {
                // Pre-reveal: show End Block or Submit depending on unanswered count
                if (unanswered > 0) {
                    if (endBlockBtn)    endBlockBtn.style.display    = 'inline-flex';
                } else {
                    if (submitBlockBtn) submitBlockBtn.style.display = 'inline-flex';
                }
                if (resultsEl) resultsEl.classList.add('hidden');
                if (statsEl)   statsEl.classList.remove('hidden');
            }
        } else {
            // Tutor Mode
            if (answer && answer.submitted) {
                if (clearBtn) clearBtn.style.display = 'inline-flex';
                if (revealBtn) revealBtn.style.display = 'none';
            } else if (q.revealed) {
                if (revealBtn) {
                    revealBtn.style.display = 'inline-flex';
                    revealBtn.classList.add('active');
                }
                if (clearBtn) clearBtn.style.display = 'inline-flex';
            } else {
                if (revealBtn) {
                    revealBtn.style.display = 'inline-flex';
                    revealBtn.classList.remove('active');
                }
                if (clearBtn) clearBtn.style.display = 'none';
            }
        }
    }

    clearHighlights() {
        const q = this.state.questions[this.state.currentIndex];
        if (!q) return;

        let changed = false;

        // 1. Remove all highlight spans from the main text
        if (q.contentFormat === 'medos-html') {
            window.MedicalLibrary.clearHighlights(q);
            changed = true;
        }
        if (q.text && q.text.includes('class="highlight"')) {
            q.text = q.text.replace(/<span class="highlight">(.*?)<\/span>/g, '$1');
            changed = true;
        }

        // 2. Clear crossed out options
        if (q.crossedOutOptionIds && q.crossedOutOptionIds.length > 0) {
            q.crossedOutOptionIds = [];
            changed = true;
        }

        if (changed) {
            this.renderQuestion(); // Re-render to show changes
            this.updateSaveStatus('unsaved');
            this.saveQuestionsToBackend();
        }
    }



    initResizer() {
        // Safety check
        if (!this.el.sidebar) return;

        // Load saved width
        const savedWidth = localStorage.getItem("dungeonSidebarWidth");
        if (savedWidth) {
            this.el.sidebar.style.width = savedWidth + "px";
        }
        // Ensure layout is synced on load
        this.updateMainPosition();

        // Create handle if not exists
        if (!this.el.sidebar.querySelector('.dungeon-resizer-handle')) {
            const handle = document.createElement('div');
            handle.className = 'dungeon-resizer-handle';
            // Make grip area wider but keep visual invisible (or slight hint)
            handle.style.cssText = "position: absolute; right: -4px; top: 0; width: 10px; height: 100%; cursor: col-resize; z-index: 99; background: transparent;";

            handle.addEventListener('mousedown', (e) => {
                e.preventDefault();
                const startX = e.clientX;
                const startWidth = this.el.sidebar.offsetWidth;
                document.body.style.cursor = "col-resize"; // Force cursor on body during drag

                // Disable transitions during drag for responsiveness
                this.el.sidebar.style.transition = 'none';
                const main = document.querySelector('.dungeon-main');
                if (main) main.style.transition = 'none';
                const toolbar = document.getElementById('dungeonToolbar');
                if (toolbar) toolbar.style.transition = 'none';

                const onMouseMove = (ev) => {
                    const newWidth = startWidth + (ev.clientX - startX);
                    const amboss=this.el.container?.classList.contains('amboss-dungeon');
                    if (newWidth >= (amboss?220:50) && newWidth <= (amboss?Math.min(520,window.innerWidth-360):300)) {
                        this.el.sidebar.style.width = newWidth + 'px';
                        if(amboss)this.el.container.style.setProperty('--qa-sidebar-width',newWidth+'px');

                        // Update Main Content Position
                        if (main) {
                            if (this.state.toolbarPosition === 'left') {
                                main.style.left = (newWidth + 50) + 'px';
                            } else {
                                main.style.left = newWidth + 'px';
                            }
                        }

                        // Update Toolbar Position if docked left
                        if (this.state.toolbarPosition === 'left' && toolbar) {
                            toolbar.style.left = newWidth + 'px';
                        }
                    }
                };

                const onMouseUp = () => {
                    localStorage.setItem("dungeonSidebarWidth", parseInt(this.el.sidebar.style.width)); // Save
                    if(this.el.container?.classList.contains('amboss-dungeon'))localStorage.setItem('qnex-amboss-sidebar-width',String(this.el.sidebar.offsetWidth));
                    document.body.style.cursor = ""; // Reset cursor

                    // Re-enable transitions
                    this.el.sidebar.style.transition = '';
                    if (main) main.style.transition = '';
                    if (toolbar) toolbar.style.transition = '';

                    document.removeEventListener('mousemove', onMouseMove);
                    document.removeEventListener('mouseup', onMouseUp);
                };

                document.addEventListener('mousemove', onMouseMove);
                document.addEventListener('mouseup', onMouseUp);
            });

            // Touch support for iPad sidebar resizing
            handle.addEventListener('touchstart', (e) => {
                e.preventDefault();
                const touch = e.touches[0];
                const startX = touch.clientX;
                const startWidth = this.el.sidebar.offsetWidth;
                this.el.sidebar.style.transition = 'none';
                const main = document.querySelector('.dungeon-main');
                if (main) main.style.transition = 'none';
                const toolbar = document.getElementById('dungeonToolbar');
                if (toolbar) toolbar.style.transition = 'none';

                const onTouchMove = (ev) => {
                    ev.preventDefault();
                    const newWidth = startWidth + (ev.touches[0].clientX - startX);
                    if (newWidth >= 50 && newWidth <= 300) {
                        this.el.sidebar.style.width = newWidth + 'px';
                        if (main) {
                            main.style.left = (this.state.toolbarPosition === 'left')
                                ? (newWidth + 50) + 'px'
                                : newWidth + 'px';
                        }
                        if (this.state.toolbarPosition === 'left' && toolbar) {
                            toolbar.style.left = newWidth + 'px';
                        }
                    }
                };

                const onTouchEnd = () => {
                    localStorage.setItem("dungeonSidebarWidth", parseInt(this.el.sidebar.style.width));
                    this.el.sidebar.style.transition = '';
                    if (main) main.style.transition = '';
                    if (toolbar) toolbar.style.transition = '';
                    document.removeEventListener('touchmove', onTouchMove);
                    document.removeEventListener('touchend', onTouchEnd);
                };

                document.addEventListener('touchmove', onTouchMove, { passive: false });
                document.addEventListener('touchend', onTouchEnd);
            }, { passive: false });

            this.el.sidebar.appendChild(handle);
        }
    }

    // Helper to sync main content with sidebar on load/toggle
    updateMainPosition() {
        const sidebar = document.getElementById('dungeonSidebar');
        const main = document.querySelector('.dungeon-main');
        if (sidebar && main) {
            if (this.state.sidebarCollapsed) {
                main.style.left = '0';
            } else {
                // Prioritize inline style (from resizer) or localStorage
                let w = sidebar.style.width;
                if (!w) {
                    const saved = localStorage.getItem("dungeonSidebarWidth");
                    if (saved) w = saved + 'px';
                }

                // Fallback to offsetWidth if visible, otherwise default to 80px (CSS default)
                if (!w) {
                    const offset = sidebar.offsetWidth;
                    w = (offset > 0 ? offset : 80) + 'px';
                }

                main.style.left = w;
            }
        }
    }

    bindEvents() {
        // Close button
        const closeBtn = document.getElementById("dungeonCloseBtn");
        if (closeBtn) {
            closeBtn.onclick = () => {
                if (confirm("Are you sure you want to exit the Dungeon session? Unsaved progress may be lost.")) {
                    this.close();
                }
            };
        }

        // Footer buttons
        const suspendBtn = document.getElementById("dungeonSuspendBtn");
        if (suspendBtn) suspendBtn.onclick = () => this.suspendBlock();

        const submitBlockBtn = document.getElementById("dungeonSubmitBlockBtn");
        if (submitBlockBtn) submitBlockBtn.onclick = () => this.submitBlock();

        // Keyboard nav
        document.addEventListener("keydown", (e) => {
            if (e.target.closest?.('input, textarea, select, [contenteditable="true"]')) return;
            if (this.el.container.classList.contains("hidden")) return;

            const searchWrapper = document.getElementById('dungeonSearchWrapper');
            const calculator = document.getElementById('dungeonCalculator');
            const isSearchActive = searchWrapper && searchWrapper.classList.contains('active');
            const isCalcActive = calculator && !calculator.classList.contains('hidden');

            if (e.key === "ArrowRight") this.navNext();
            if (e.key === "ArrowLeft") this.navPrev();
            // if (e.key === "Escape") this.close(); // DISABLED per user request

            // Enter Key logic
            if (e.key === "Enter" && !isSearchActive && !isCalcActive) {
                const currentQ = this.state.questions[this.state.currentIndex];
                if (currentQ && this.state.selectedOption) {
                    if (currentQ._tutorMode !== false) {
                        // Tutor mode: full submit (shows feedback, stops timer)
                        this.handleSubmit();
                    } else {
                        // Exam mode: silently save the choice — timer keeps running (unless 'up' mode)
                        // When timer runs out, this saved choice is final
                        const selectedOpt = currentQ.options?.find(o => String(o.id) === String(this.state.selectedOption));
                        const isCorrect = selectedOpt?.isCorrect || false;
                        const answerData = {
                            submitted: true,
                            selectedId: this.state.selectedOption,
                            isCorrect,
                            examCommitted: true  // Saved by Enter, timer still running
                        };
                        this.state.answers.set(currentQ.id, answerData);
                        currentQ.submittedAnswer = answerData;
                        
                        // Stop 'up' timer immediately on commit
                        if (currentQ._timerMode === 'up') {
                            this.stopTimer();
                        }
                        
                        this.renderSidebar();
                        // For 'up' mode, re-render question to freeze timer UI
                        if (currentQ._timerMode === 'up') {
                            this.render();
                        }
                    }
                }
            }
        });
    }

    open(questions, sessionId = null) {
        document.body.classList.add("dungeon-open");
        if (!questions || questions.length === 0) {
            alert("No questions to play!");
            return;
        }

        // Setup state
        this.state.questions = [...questions];
        this.state.associatedSessionId = sessionId;
        this.state.isBlockRevealed = false; // Reset block revealed on open
        // Initialize session timer start IMMEDIATELY on open
        this.sessionTimerStart = Date.now();

        // Performance: Pre-cache search text
        this.state.questions.forEach(q => {
            if (q._searchCached) return;
            q._searchTitle = (q.title || "").toLowerCase();
            q._searchContent = this.stripHtml(q.text || q.body || q.content || "").toLowerCase();
            if (q.options) {
                q.options.forEach(opt => {
                    opt._searchText = (opt.text || "").toLowerCase();
                });
            }
            q._searchCached = true;
        });
        
        this.state.answers.clear();

        // Load persisted answers from question objects
        let firstUnansweredIndex = -1;
        this.state.questions.forEach((q, idx) => {
            if (q.submittedAnswer) {
                this.state.answers.set(q.id, q.submittedAnswer);
                // If it's a resumed session and questions have submitted answers,
                // and it's tutor mode off (exam), we might want to check if block was previously revealed.
                // For now, we only reveal if explicitly submitted in this instance.
            } else if (firstUnansweredIndex === -1) {
                firstUnansweredIndex = idx;
            }
        });

        // Auto-jump to first unanswered question, or stay at 0 if none found (all answered)
        this.state.currentIndex = firstUnansweredIndex !== -1 ? firstUnansweredIndex : 0;
        if(questions[0]?.source?.bank?.startsWith('bau-')){
            this.state.isBlockRevealed=Boolean(window.MedicalLibrary?.active?.id===sessionId && window.MedicalLibrary.active.completed);
            if(!this.state.isBlockRevealed && questions[0]._bauNavigation!=='two-way')this.state.currentIndex=Math.max(this.state.currentIndex,...questions.map(q=>Number(q._bauReached)||0));
        }
        this.state.selectedOption = null;

        // Show container and loading screen
        this.el.container.classList.remove("hidden");
        const loadingScreen = document.getElementById('dungeonLoadingScreen');
        if (loadingScreen) {
            loadingScreen.classList.remove('hidden');
            setTimeout(() => {
                loadingScreen.classList.add('hidden');
                this.render();
            }, 400);
        } else {
            this.render();
        }

        // Ensure Lab is initialized (fixes hot-reload/state issues)
        this.initLab();
    }

    suspendBlock() {
        if (confirm("Are you sure you want to suspend this block? Your progress will be saved but the timer will stop.")) {
            this.close();
        }
    }

    async submitBlock(skipConfirm = false) {
        if (!this.state.isBlockRevealed) {
            const unanswered = this.state.questions.length - this.state.answers.size;
            if (unanswered > 0 && !skipConfirm) {
                if (!confirm(`You still have ${unanswered} unanswered questions. Are you sure you want to end the block?`)) {
                    return;
                }
            }

            // Automatically reveal and mark unanswered as incorrect
            this.state.questions.forEach(q => {
                if (!this.state.answers.has(q.id)) {
                    const autoAnswer = {
                        selectedId: null,
                        isCorrect: false,
                        submitted: true,
                        timestamp: Date.now()
                    };
                    this.state.answers.set(q.id, autoAnswer);
                    q.submittedAnswer = autoAnswer;
                    q.revealed = true;
                }
            });

            this.state.isBlockRevealed = true;
        }
        
        this.stopTimer();
        // Finalize scoring
        const stats = this.calculateStats();
        stats.percentage = this.state.questions.length > 0 ? Math.round((stats.correct / this.state.questions.length) * 100) : 0;
        
        // Show results in footer
        const resultsEl = document.getElementById("dungeonExamResults");
        const statsEl = document.getElementById("dungeonTutorStats");
        const scoreEl = document.getElementById("dungeonStatScore"); // This is for the main exam score
        
        if (resultsEl) resultsEl.classList.remove("hidden");
        // if (statsEl) statsEl.classList.add("hidden"); // Optional: hide old stats
        
        if (scoreEl) {
            scoreEl.textContent = `${stats.percentage}%`;
        }

        const correctExam = document.getElementById("dungeonStatCorrectExam");
        const totalExam = document.getElementById("dungeonStatTotalExam");
        const wrongExam = document.getElementById("dungeonStatWrongExam");

        if (correctExam) correctExam.textContent = stats.correct;
        if (totalExam) totalExam.textContent = this.state.questions.length;
        if (wrongExam) wrongExam.textContent = stats.wrong; // Use stats.wrong from calculateStats

        // Also update Tutor stats for consistency if visible
        const tutorCorrect = document.getElementById("dungeonStatCorrect");
        const tutorTotal = document.getElementById("dungeonStatTotal");
        const tutorScore = document.getElementById("dungeonStatScoreTutor");
        const tutorWrong = document.getElementById("dungeonStatWrong");

        if (tutorCorrect) tutorCorrect.textContent = stats.correct;
        if (tutorTotal) tutorTotal.textContent = `${stats.correct + stats.wrong}/${this.state.questions.length}`;
        if (tutorScore) tutorScore.textContent = `${stats.percentage}%`;
        if (tutorWrong) tutorWrong.textContent = stats.wrong;

        this.updateSidebarStats();
        this.render(); // Re-render to show feedback for current question
        
        // Persist session results if sessionId exists
        if (this.state.associatedSessionId) {
            try {
                // Fetch the existing session if needed, but here we just want to update stats.
                // Assuming backend has a way to update specific session stats.
                // For now, let's just save the questions (which contain submittedAnswer with feedback)
                await this.saveQuestionsToBackend();
                
                // Also update the session record itself if possible
                if (this.state.associatedSessionId.startsWith('medos-')) return;
                const sessionsStr = localStorage.getItem("active-recall-recent-sessions");
                if (sessionsStr) {
                    const sessions = JSON.parse(sessionsStr);
                    const session = sessions.find(s => s.id === this.state.associatedSessionId);
                    if (session) {
                        session.stats = {
                            score: Math.round((stats.correct / this.state.questions.length) * 100),
                            correct: stats.correct,
                            total: this.state.questions.length,
                            date: new Date().toISOString()
                        };
                        localStorage.setItem("active-recall-recent-sessions", JSON.stringify(sessions));
                        
                        // Sync to backend
                        await window.fileSystemService.makeRequest('/sessions', {
                            method: 'POST',
                            body: JSON.stringify(sessions)
                        });
                    }
                }
            } catch (err) {
                console.error("[DungeonBase] Failed to persist session stats:", err);
            }
        }
    }

    calculateStats() {
        let correct = 0;
        let wrong = 0;
        let unanswered = 0;

        this.state.questions.forEach(q => {
            const ans = this.state.answers.get(q.id);
            if (ans) {
                if (ans.isCorrect) correct++;
                else wrong++;
            } else {
                unanswered++;
            }
        });

        return { correct, wrong, unanswered };
    }

    close() {
        if(this._viewerDock) this._viewerDock.hidden=true;
        document.getElementById('dungeonImageViewer')?.classList.remove('visible');
        this._exhibitRequestId = (this._exhibitRequestId || 0) + 1;
        document.body.classList.remove("dungeon-open");
        this.el.container.classList.add("hidden");
        this.stopTimer();
        if (this.state.associatedSessionId?.startsWith('medos-')) this.saveQuestionsToBackend();

        // Cleanup any active sticky notes
        if (window.DungeonNote && window.DungeonNote.destroyAll) {
            window.DungeonNote.destroyAll();
        }
        this.currentNote = null;

        // Restore QBank Tabs to ensure they are properly visible and styled
        if (window.QuestionBase && typeof window.QuestionBase.switchTab === "function") {
            const lastTab = window.QuestionBase.state.lastActiveTab || "main";
            window.QuestionBase.switchTab(lastTab);
        }
    }

    render() {
        // 1. Sidebar
        this.renderSidebar();

        // 2. Main Question
        this.renderQuestion();

        // 3. Update topbar and footer
        this.updateQuestionTitle();
        this.updateStats(); // Keeps old hook just in case
        this.updateSidebarStats(); // New Stats

        // Update Reveal Button State
        this.updateRevealButton();

        // Reset per-question hide-timer clock and questionStartTime on each navigation
        this.questionStartTime = Date.now();

        // Start Timer
        this.startTimer();

        // 3. Nav Buttons State (Toolbar)
        const prev = document.getElementById("dungeonToolPrev");
        const next = document.getElementById("dungeonToolNext");

        if (prev) {
            if (this.state.currentIndex === 0) {
                prev.style.opacity = "0.3";
                prev.style.pointerEvents = "none";
            } else {
                prev.style.opacity = "1";
                prev.style.pointerEvents = "auto";
            }
        }
        if (next) {
            if (this.state.currentIndex === this.state.questions.length - 1) {
                next.style.opacity = "0.3";
                next.style.pointerEvents = "none";
            } else {
                next.style.opacity = "1";
                next.style.pointerEvents = "auto";
            }
        }
    }

    handleSearch(query) {
        this.state.searchQuery = query;
        this.renderSidebar();
    }

    renderSidebar() {
        // Save current scroll position
        const questionsContainer = this.el.sidebar.querySelector('.dungeon-sidebar-questions');
        const savedScrollTop = questionsContainer ? questionsContainer.scrollTop : 0;

        // Clear sidebar but preserve resizer handle
        const handle = this.el.sidebar.querySelector('.dungeon-resizer-handle');

        this.el.sidebar.innerHTML = "";

        this.el.sidebar.innerHTML = "";

        // Create scrollable container for questions
        const newQuestionsContainer = document.createElement('div');
        newQuestionsContainer.className = 'dungeon-sidebar-questions';

        this.state.questions.forEach((q, index) => {
            let isHidden = false;
            if (this.state.searchQuery) {
                const query = this.state.searchQuery.toLowerCase();
                // Use cache for speed
                const title = q._searchTitle !== undefined ? q._searchTitle : (q.title || "").toLowerCase();
                const content = q._searchContent !== undefined ? q._searchContent : (q.text || "").toLowerCase();

                let match = title.includes(query) || content.includes(query);
                if (!match && q.options) {
                    match = q.options.some(o => (o._searchText !== undefined ? o._searchText : (o.text || "").toLowerCase()).includes(query));
                }

                if (!match) isHidden = true;
            }

            const box = document.createElement("div");
            box.className = "dungeon-q-box";
            box.style.position = 'relative'; // CRITICAL for star absolute positioning
            if (isHidden) box.style.display = "none";
            // Add data-index for fast filtering updates without re-render
            box.dataset.qIndex = index;

            // Check Status first so active styling can build on it
            const answer = this.state.answers.get(q.id);
            let content = `<span class="q-number" style="font-size: 0.9rem;">${index + 1}</span>`;

            if (answer && answer.submitted) {
                if (this.state.isBlockRevealed || q._tutorMode !== false) {
                    if (answer.isCorrect) {
                        box.classList.add("correct");
                    } else {
                        box.classList.add("wrong");
                    }
                } else {
                    box.classList.add("solved");
                }
            }
            
            // Revealed state (Orange) - take precedence
            if (q.revealed) {
                box.classList.remove("correct", "wrong", "solved");
                box.classList.add("revealed-state");
            }

            if (index === this.state.currentIndex) {
                box.classList.add("active");
            }

            const statusIcon = box.classList.contains("correct") ? "<svg viewBox=\"0 0 24 24\" fill=\"currentColor\" aria-hidden=\"true\"><path d=\"M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z\"/></svg>" : box.classList.contains("wrong") ? "<svg viewBox=\"0 0 24 24\" fill=\"currentColor\" aria-hidden=\"true\"><path d=\"M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z\"/></svg>" : "";
            if (statusIcon) content = '<span class="dungeon-result-icon">'+statusIcon+'</span>'+content;
            box.title = q.title || `Question ${index + 1}`;

            // Timed-out indicator: crossed clock SVG
            const timedOutSvg = q._timedOut 
                ? `<span class="dungeon-timed-out-icon" title="Time expired — answer locked" style="position:absolute;bottom:2px;right:2px;opacity:0.9;">
                       <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                         <circle cx="12" cy="12" r="10"></circle>
                         <polyline points="12 6 12 12 16 14"></polyline>
                         <line x1="2" y1="2" x2="22" y2="22"></line>
                       </svg>
                   </span>` 
                : '';
            if (q._timedOut) box.classList.add('timed-out');
            box.style.position = 'relative';
            box.innerHTML = `<span class="dungeon-box-status">${content}</span>${timedOutSvg}`;

            // Star Indicator
            if (q.starred || q.isStarred) {
                const star = document.createElement('div');
                star.className = 'dungeon-flagged-indicator';
                star.title = 'Flagged question';
                star.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M5 21V4m0 0c5-4 9 4 14 0v10c-5 4-9-4-14 0"/></svg>';
                box.appendChild(star);
                box.style.position = 'relative'; // Ensure relative for abs star
            }

            box.onclick = () => {
                // this.saveCurrentSelection(); // Not needed or undefined
                this.state.currentIndex = index;
                this.state.selectedOption = null; // Reset temp selection on switch
                this.render();
            };

            // DIRECT double-click for starring - Most robust way
            box.ondblclick = (e) => {
                e.stopPropagation();
                this.state.currentIndex = index;
                this.toggleStar();
            };

            newQuestionsContainer.appendChild(box);
        });

        // Add questions container to sidebar
        this.el.sidebar.appendChild(newQuestionsContainer);

        // Restore scroll position
        newQuestionsContainer.scrollTop = savedScrollTop;

        // Re-append handle at the end so it's on top
        if (handle) {
            this.el.sidebar.appendChild(handle);
        } else {
            this.initResizer(); // Fallback if handle wasn't there
        }
        if(this.el.container?.classList.contains('amboss-dungeon'))this.renderAmbossSidebar();
    }

    // Search Implementation
    initSearch() {
        const wrapper = document.getElementById('dungeonSearchWrapper');
        const toggle = document.getElementById('dungeonSearchToggle');
        const input = document.getElementById('dungeonSearchInput');
        const closeBtn = document.getElementById('dungeonSearchClose');
        const nextBtn = document.getElementById('dungeonSearchNext');
        const prevBtn = document.getElementById('dungeonSearchPrev');

        if (!wrapper || !toggle || !input) return;

        const updateToggleState = () => {
            toggle.classList.toggle('active', wrapper.classList.contains('active'));
        };

        // Global Shortcut (Ctrl+F)
        if (this._searchCtrlFHandler) {
            document.removeEventListener('keydown', this._searchCtrlFHandler);
        }

        this._searchCtrlFHandler = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
                // Zombie check
                if (!wrapper.isConnected) {
                    document.removeEventListener('keydown', this._searchCtrlFHandler);
                    return;
                }

                e.preventDefault();
                wrapper.classList.toggle('active');
                updateToggleState();

                if (wrapper.classList.contains('active')) {
                    setTimeout(() => {
                        input.focus();
                        input.select();
                    }, 50);
                    if (input.value) this.runSearch(input.value);
                } else {
                    this.clearSearchHighlights();
                    input.blur();
                }
            }
        };

        document.addEventListener('keydown', this._searchCtrlFHandler);

        // Toggle Visibility
        toggle.onclick = (e) => {
            e.stopPropagation();
            wrapper.classList.toggle('active');
            updateToggleState(); // Sync state

            if (wrapper.classList.contains('active')) {
                input.focus();
                if (input.value) this.runSearch(input.value);
            } else {
                this.clearSearchHighlights(); // Clear when closing via toggle
                input.blur();
            }
        };

        // Close
        if (closeBtn) {
            closeBtn.onclick = () => {
                wrapper.classList.remove('active');
                updateToggleState();
                this.clearSearchHighlights();
            };
        }

        // Update toggle state initially and on Ctrl+F
        // (Modify Ctrl+F handler in same block if possible, or assume separate)
        // I'll update keydown handler too.

        // ... input logic ...

        let debounceTimeout;
        input.oninput = (e) => {
            const term = e.target.value;
            clearTimeout(debounceTimeout);
            debounceTimeout = setTimeout(() => {
                this.runSearch(term);
            }, 300);
        };

        // Navigation
        if (nextBtn) nextBtn.onclick = () => this.navigateSearch(1);
        if (prevBtn) prevBtn.onclick = () => this.navigateSearch(-1);

        // Keyboard
        input.onkeydown = (e) => {
            if (e.key === 'Enter') {
                if (e.shiftKey) this.navigateSearch(-1);
                else this.navigateSearch(1);
            } else if (e.key === 'Escape') {
                wrapper.classList.remove('active');
                this.clearSearchHighlights();
            }
        };
    }

    filterSidebarQuery(term) {
        this.state.searchQuery = term;
        const container = this.el.sidebar.querySelector('.dungeon-sidebar-questions');
        if (!container) return;

        const boxes = container.children;
        const termLower = term ? term.toLowerCase() : "";

        for (let i = 0; i < boxes.length; i++) {
            const box = boxes[i];
            const index = parseInt(box.dataset.qIndex);
            const q = this.state.questions[index];
            if (!q) continue;

            if (!term) {
                box.style.display = "";
                continue;
            }

            const title = q._searchTitle !== undefined ? q._searchTitle : (q.title || "").toLowerCase();
            const content = q._searchContent !== undefined ? q._searchContent : (q.text || "").toLowerCase();

            let match = title.includes(termLower) || content.includes(termLower);
            if (!match && q.options) {
                match = q.options.some(o => (o._searchText !== undefined ? o._searchText : (o.text || "").toLowerCase()).includes(termLower));
            }

            box.style.display = match ? "" : "none";
        }
    }

    escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    runSearch(term) {
        if (!term) {
            this.clearSearchHighlights();
            return;
        }

        // Update Sidebar Filtering (Fast)
        this.filterSidebarQuery(term);

        const termLower = term.toLowerCase();
        // Regex for finding ALL occurrences
        const regex = new RegExp(this.escapeRegExp(termLower), 'g');
        const results = [];

        this.state.questions.forEach((q, qIndex) => {
            // 1. Check Title (Use Cached)
            const title = q._searchTitle !== undefined ? q._searchTitle : (q.title || "").toLowerCase();
            const titleMatches = title.match(regex);
            if (titleMatches) {
                titleMatches.forEach(() => results.push({ qIndex, type: 'title' }));
            }

            // 2. Check Content (Use Cached)
            const content = q._searchContent !== undefined ? q._searchContent : this.stripHtml(q.text || q.body || q.content || "").toLowerCase();
            const contentMatches = content.match(regex);
            if (contentMatches) {
                contentMatches.forEach(() => results.push({ qIndex, type: 'content' }));
            }

            // 3. Check Options (Use Cached)
            if (q.options) {
                q.options.forEach((opt, optIndex) => {
                    const optText = opt._searchText !== undefined ? opt._searchText : (opt.text || "").toLowerCase();
                    const optMatches = optText.match(regex);
                    if (optMatches) {
                        optMatches.forEach(() => results.push({ qIndex, type: 'option', optIndex }));
                    }
                });
            }

            // 4. Check Question ID (Accurate matching)
            const spId = q.spId || "";
            if (spId) {
                const cleanId = spId.toLowerCase();
                const numericId = cleanId.replace(/\D/g, "");
                
                // Match against full ID (QNX-1234) or just numeric (1234)
                if (cleanId.includes(termLower) || numericId.includes(termLower)) {
                    results.push({ qIndex, type: 'id' });
                }
            }
        });

        this.state.search = {
            results,
            currentIndex: 0,
            term
        };

        this.updateSearchUI();

        if (results.length > 0) {
            const currentMatches = results.filter(r => r.qIndex === this.state.currentIndex);
            if (currentMatches.length === 0) {
                const first = results[0];
                this.jumpToQuestion(first.qIndex);
            } else {
                const idx = results.findIndex(r => r.qIndex === this.state.currentIndex);
                if (idx !== -1) this.state.search.currentIndex = idx;
                this.highlightSearchTerms();
            }
        } else {
            this.highlightSearchTerms();
        }
    }

    navigateSearch(direction) {
        const s = this.state.search;
        if (!s || !s.results.length) return;

        s.currentIndex += direction;
        // Wrap around
        if (s.currentIndex >= s.results.length) s.currentIndex = 0;
        if (s.currentIndex < 0) s.currentIndex = s.results.length - 1;

        const result = s.results[s.currentIndex];

        this.updateSearchUI();

        if (result.qIndex !== this.state.currentIndex) {
            this.jumpToQuestion(result.qIndex);
        } else {
            this.highlightSearchTerms();
        }
    }

    updateSearchUI() {
        const s = this.state.search;
        const countEl = document.getElementById('dungeonSearchCount');
        const prev = document.getElementById('dungeonSearchPrev');
        const next = document.getElementById('dungeonSearchNext');

        if (countEl) {
            if (!s || !s.term) {
                countEl.classList.add('hidden');
                if (prev) prev.disabled = true;
                if (next) next.disabled = true;
            } else {
                countEl.classList.remove('hidden');
                countEl.textContent = `${s.results.length ? s.currentIndex + 1 : 0}/${s.results.length}`;
                if (prev) prev.disabled = s.results.length === 0;
                if (next) next.disabled = s.results.length === 0;
            }
        }
    }

    clearSearchHighlights() {
        this.state.search = null;

        // Clear Sidebar Filtering
        this.filterSidebarQuery("");

        this.updateSearchUI();
        const highlights = document.querySelectorAll('.search-highlight');
        highlights.forEach(h => {
            const parent = h.parentNode;
            if (parent) {
                parent.replaceChild(document.createTextNode(h.textContent), h);
                parent.normalize();
            }
        });
    }

    highlightSearchTerms() {
        // Remove old
        const oldHighlights = document.querySelectorAll('.search-highlight');
        oldHighlights.forEach(h => {
            const parent = h.parentNode;
            if (parent) {
                parent.replaceChild(document.createTextNode(h.textContent), h);
                parent.normalize();
            }
        });

        const s = this.state.search;
        if (!s || !s.term || s.results.length === 0) return;

        if (this.state.currentIndex !== s.results[s.currentIndex].qIndex && s.results.some(r => r.qIndex === this.state.currentIndex)) {
            // Allow manual nav match
        } else if (this.state.currentIndex !== s.results[s.currentIndex].qIndex) {
            return; // No results on this page
        }

        const container = document.querySelector('.dungeon-main') || document.body;
        const titleEl = document.getElementById('dungeonQuestionTitle');

        // Highlight Main Content
        this.highlightTextInNode(container, s.term);

        // Highlight Title
        if (titleEl) {
            this.highlightTextInNode(titleEl, s.term);
        }

        // Mark current
        const pageResults = s.results.filter(r => r.qIndex === this.state.currentIndex);
        const localIndex = pageResults.findIndex(r => r === s.results[s.currentIndex]);

        if (localIndex !== -1) {
            const highlights = document.querySelectorAll('.search-highlight'); // Grab ALL highlights (title + content)
            // We need to map localIndex to the actual highlight element.
            // This is tricky because title highlights come before main highlights in DOM order usually?
            // #dungeonQuestionTitle is in topbar (before main).
            // So highlights[0] might be title.

            // Re-query all to be sure of order
            if (highlights[localIndex]) {
                highlights[localIndex].classList.add('current');
                highlights[localIndex].scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else if (highlights.length > 0) {
                highlights[0].classList.add('current');
            }
        }
    }

    highlightTextInNode(node, term) {
        if (node.nodeType === 3) { // Text
            const val = node.nodeValue;
            const lowerVal = val.toLowerCase();
            const lowerTerm = term.toLowerCase();
            let index = lowerVal.indexOf(lowerTerm);

            if (index >= 0) {
                const span = document.createElement('span');
                span.className = 'search-highlight';
                span.textContent = val.substr(index, term.length);

                const after = val.substr(index + term.length);
                const afterNode = document.createTextNode(after);

                node.nodeValue = val.substr(0, index);
                node.parentNode.insertBefore(span, node.nextSibling);
                node.parentNode.insertBefore(afterNode, span.nextSibling);

                // Continue in afterNode?
                // YES, invoke recursively to catch multiple occurrences in same text node
                this.highlightTextInNode(afterNode, term);
            }
        } else if (node.nodeType === 1 && node.childNodes && !/(script|style|button|textarea)/i.test(node.tagName) && !node.classList.contains('search-highlight')) {
            for (let i = node.childNodes.length - 1; i >= 0; i--) {
                this.highlightTextInNode(node.childNodes[i], term);
            }
        }
    }

    stripHtml(html) {
        if (!html) return "";
        // Regex is much faster than DOM creation for search indexing
        return html.replace(/<[^>]*>/g, ' ').replace(/&[^;]+;/g, ' ').replace(/\s+/g, ' ').trim();
    }

    jumpToQuestion(index) {
        this.state.currentIndex = index;
        this.state.selectedOption = null;
        this.render();
    }

    bauCanNavigate(index) {
        const q=this.state.questions[this.state.currentIndex];
        const furthest=Math.max(this.state.currentIndex,...this.state.questions.map(item=>Number(item._bauReached)||0));
        return !q?.source?.bank?.startsWith('bau-') || this.state.isBlockRevealed || q._bauNavigation==='two-way' || index>=furthest;
    }

    renderBauQuestion(q) {
        const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
        const index=this.state.currentIndex,answer=this.state.answers.get(q.id),review=this.state.isBlockRevealed;
        q._bauReached=Math.max(index,Number(q._bauReached)||0);
        const show=review || (q._tutorMode!==false && answer?.submitted);
        const flag='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 3h9l1 3h7v12h-9l-1-3H6v7H4z"/></svg>';
        const course=q.tags?.subject?.join(' / ')||'BAU Qbank';
        const session=window.MedicalLibrary?.active;
        const title=q._bauSessionTitle || (session?.id===this.state.associatedSessionId ? session.title : 'Custom session');
        const render=(item,type,opt)=>window.MedicalLibrary.renderContent(item,type,opt);
        this.el.main.innerHTML=`<div class="bau-quiz"><div class="bau-course">${esc(course)} <span>/</span> ${esc(title)}</div><h1>${esc(title)}</h1><button class="bau-back" data-bau-close>Back</button><div class="bau-layout"><section><div class="bau-time" hidden><button data-bau-time-toggle>${this._bauTimerHidden?'Show':'Hide'}</button><span data-bau-clock ${this._bauTimerHidden?'hidden':''}>${q._timerMode==='down'?'Time left':'Time elapsed'} <strong>00:00</strong></span></div><div class="bau-question-row"><aside class="bau-info"><strong>Question ${index+1}</strong><p>${answer?.submitted?'Answer saved':'Not yet answered'}</p><p>Marked out of 1</p><button data-bau-flag aria-pressed="${Boolean(q.starred||q.isStarred)}">${flag}${q.starred||q.isStarred?'Flagged':'Flag question'}</button></aside><div><div class="bau-question">${render(q,'question')}<p>Select one:</p><div class="bau-options">${q.options.map((opt,i)=>`<label><input type="radio" name="bau-answer" value="${esc(opt.id)}" ${String(answer?.selectedId || this.state.selectedOption)===String(opt.id)?'checked':''} ${review || (show && q._tutorMode!==false)?'disabled':''}><span>${String.fromCharCode(97+i)}.</span><div>${render(q,'option',opt)}</div></label>`).join('')}</div></div>${show?`<div class="bau-explanation"><p>${answer?.isCorrect?'Your answer is correct.':'Your answer is incorrect.'}</p><p>The correct answer is: ${esc(q.options.find(o=>o.isCorrect)?.text)}</p>${render(q,'explanation')}</div>`:''}<div class="bau-actions">${q._tutorMode!==false&&!show?'<button data-bau-submit>Check answer</button>':''}${index>0&&this.bauCanNavigate(index-1)?'<button data-bau-prev>Previous page</button>':''}<button data-bau-next>${index===this.state.questions.length-1?'Finish attempt …':'Next page'}</button></div></div></div></section><aside class="bau-navigation"><h2>Quiz navigation</h2><div class="bau-squares">${this.state.questions.map((item,i)=>`<button data-bau-index="${i}" class="${i===index?'current ':''}${this.state.answers.has(item.id)?'answered':''}" ${!this.bauCanNavigate(i)?'disabled':''} aria-label="Question ${i+1}${item.starred||item.isStarred?', flagged':''}" ${i===index?'aria-current="step"':''}>${i+1}${item.starred||item.isStarred?flag:''}</button>`).join('')}</div><button class="bau-finish" data-bau-finish>Finish attempt …</button></aside></div></div>`;
        const mount=this.el.main;
        if(q._timedOut || answer?.locked)mount.querySelectorAll('[name=bau-answer], [data-bau-submit]').forEach(control=>control.disabled=true);
        mount.querySelectorAll('[name=bau-answer]').forEach(input=>input.onchange=()=>this.handleSelectOption(input.value));
        mount.querySelector('[data-bau-submit]')?.addEventListener('click',()=>this.handleSubmit());
        mount.querySelector('[data-bau-flag]').onclick=()=>{this.toggleStar();this.renderQuestion();};
        mount.querySelector('[data-bau-close]').onclick=()=>this.suspendBlock();
        mount.querySelector('[data-bau-prev]')?.addEventListener('click',()=>this.navPrev());
        mount.querySelector('[data-bau-next]').onclick=()=>index===this.state.questions.length-1?this.submitBlock():this.navNext();
        mount.querySelector('[data-bau-finish]').onclick=()=>this.submitBlock();
        mount.querySelectorAll('[data-bau-index]').forEach(button=>button.onclick=()=>this.jumpToQuestion(Number(button.dataset.bauIndex)));
        mount.querySelector('[data-bau-time-toggle]').onclick=()=>{this._bauTimerHidden=!this._bauTimerHidden;mount.querySelector('[data-bau-clock]').hidden=this._bauTimerHidden;mount.querySelector('[data-bau-time-toggle]').textContent=this._bauTimerHidden?'Show':'Hide';};
        const key=this.state.associatedSessionId+':'+index;
        if(this._bauTimerQuestion!==key){this._bauTimerQuestion=key;this._bauTimerAppearAt=Date.now()+2000;}
        clearTimeout(this._bauTimerAppear);
        const remaining=Math.max(0,this._bauTimerAppearAt-Date.now());
        const time=mount.querySelector('.bau-time');
        if(!remaining)time.hidden=false;
        else this._bauTimerAppear=setTimeout(()=>{if(time.isConnected)time.hidden=false;},remaining);
        this.updateTimerDisplay(this.lastTimerMs||0);
    }

    renderQuestion() {
        const q = this.state.questions[this.state.currentIndex];
        const bau=q.source?.bank?.startsWith('bau-');
        this.el.container?.classList.toggle('bau-dungeon',Boolean(bau));
        const amboss=q.contentFormat==='medos-html' && q.source?.bank?.startsWith('amboss');
        this.el.container?.classList.toggle('amboss-dungeon',Boolean(amboss));
        if(amboss) {this.renderAmbossQuestion(q);return;}
        if(bau) {this.renderBauQuestion(q);return;}
        const answer = this.state.answers.get(q.id);
        const isTimedOut = q._timedOut === true;
        const isSubmitted = answer && answer.submitted;
        const isLocked = isTimedOut || (answer && answer.locked);
        const isRevealed = q.revealed || false;

        // Tutor Mode respect
        // Show explanation if revealed OR (submitted AND tutor mode is ON)
        // IN EXAM MODE: Hide feedback until block is revealed
        const isExamMode = q._tutorMode === false;
        const showFeedback = !isExamMode || this.state.isBlockRevealed;
        const showExplanation = isRevealed || (isSubmitted && showFeedback);

        let html = `
    <!-- Context Box (Image/Code) -->
    <div class="dungeon-context-box" onmouseup="window.DungeonBase.handleHighlight(event, 'main')" ontouchend="window.DungeonBase.handleHighlightTouch(event, 'main')">
           ${q.contentFormat === 'medos-html' ? window.MedicalLibrary.renderContent(q, 'question') : (window.Markdown ? window.Markdown.render(q.text || q.body || q.content || "No question details.") : (q.text || q.body || q.content || "No question details."))}
    </div>

    <div class="dungeon-options-list">
      `;

        const options = q.options || [];
        const currentSel = this.state.selectedOption; // Valid only if not submitted
        const submittedSel = isSubmitted ? answer.selectedId : null;
        const lastSubmittedId = isSubmitted ? answer.lastSubmittedId : null;



        options.forEach((opt, idx) => {
            let classes = "dungeon-radio-option";
            // Logic for styling
            if (isSubmitted) {
                // Submitted state
                if (showFeedback) {
                    if (String(opt.id) === String(submittedSel)) {
                        classes += " selected"; // Visual selected
                        if (answer.isCorrect) classes += " correct-answer";
                        else classes += " wrong-answer";
                    }
                    if (opt.isCorrect && !answer.isCorrect) {
                        classes += " correct-answer"; // Show missed correct answer
                    }
                } else {
                    // Exam mode, block not revealed yet - just show selected state
                    if (String(opt.id) === String(submittedSel)) classes += " selected";
                }
            } else if (isRevealed) {
                // Revealed state (not submitted but showing answers)
                if (opt.isCorrect) {
                    classes += " correct-answer"; // Highlight correct answer
                }
            } else {
                // Interactive state
                if (String(opt.id) === String(currentSel)) classes += " selected";
            }

            // Check crossed out state
            if (q.crossedOutOptionIds && q.crossedOutOptionIds.includes(String(opt.id))) {
                classes += " crossed-out";
            }

            const letter = String.fromCharCode(65 + idx);
            const optionPercent = opt.percent ?? (opt.isCorrect ? q.answerStats?.percent_correct : null); // 65 is 'A'

            html += `
        <div class="${classes}">
            <div class="dungeon-radio-circle" onclick="${isLocked ? '' : `window.DungeonBase.handleSelectOption('${opt.id}')`}" style="${isLocked ? 'cursor:default;opacity:0.6;' : ''}"></div>
            <div class="dungeon-radio-text" onclick="${isLocked ? '' : `window.DungeonBase.handleStrikeOption(event, this)`}" onmouseup="window.DungeonBase.handleHighlight(event, 'option', '${opt.id}')" style="${isLocked ? 'user-select:none;' : ''}">
                <span class="dungeon-option-letter">${letter}.</span>${q.contentFormat === 'medos-html' ? window.MedicalLibrary.renderContent(q, 'option', opt) : (window.Markdown ? window.Markdown.render(opt.text || "Option") : (opt.text || "Option"))}
            </div>
        </div>
      `;
        });

        html += `</div>`; // End options

        // Inline Submit Button (shown when toolbar is hidden)
        if (!this.state.toolbarVisible) {
            const isSubmittedBtn = (answer && answer.submitted) || isRevealed;
            const alignClass = this.state.contentAlignment === 'center' ? 'align-center' : 'align-left';
            
            // Allow re-submission in Exam mode if choice changed from manual submit
            const isChanged = currentSel && lastSubmittedId && String(currentSel) !== String(lastSubmittedId);
            const canSubmit = !isSubmittedBtn || (isExamMode && isChanged && !isLocked);

            html += `
                <div class="dungeon-inline-submit-wrap ${alignClass}">
                    <button class="dungeon-inline-submit ${isSubmittedBtn && !isChanged ? 'submitted' : ''}" 
                            onclick="${canSubmit ? 'window.DungeonBase.handleSubmit()' : ''}"
                            ${canSubmit ? '' : 'disabled'}>
                        ${isSubmittedBtn && !isChanged ? 'Submitted' : (isChanged ? 'Re-Submit' : 'Submit')}
                    </button>
                </div>
            `;
        }

        // Explanation rendering logic
        let explHtml = '';
        if (showExplanation) {
            const explanationTitle = isSubmitted
                ? (answer.isCorrect ? "Correct" : "Incorrect")
                : "Answer Revealed";

            // Build tag row from spId + optional spTopic
            let tagsHtml = '';
            if (q.spId && window.QuestionBase && typeof window.QuestionBase._ctGetTagsFromNumericId === 'function') {
                const tags = window.QuestionBase._ctGetTagsFromNumericId(q.spId || q.id);
                if (tags) {
                    const items = [];
                    // Joins multiple subjects/systems with &
                    if (tags.subject && tags.subject.length > 0) {
                        items.push(`<div class="dungeon-expl-tag"><span class="dungeon-expl-tag-value">${tags.subject.join(' & ')}</span><span class="dungeon-expl-tag-label">Subject</span></div>`);
                    }
                    if (tags.system  && tags.system.length > 0) {
                        items.push(`<div class="dungeon-expl-tag"><span class="dungeon-expl-tag-value">${tags.system.join(' & ')}</span><span class="dungeon-expl-tag-label">System</span></div>`);
                    }
                    // Topic: prefer explicit spTopic, then fall back to major/minor
                    const topic = q.spTopic || (tags.major && tags.major[0]) || (tags.minor && tags.minor[0]);
                    if (topic) items.push(`<div class="dungeon-expl-tag"><span class="dungeon-expl-tag-value">${topic}</span><span class="dungeon-expl-tag-label">Topic</span></div>`);
                    if (items.length > 0) tagsHtml = `<div class="dungeon-explanation-tags">${items.join('')}</div>`;
                }
            }

            explHtml = `
         <div class="dungeon-explanation">
             <div class="dungeon-feedback ${isSubmitted ? (answer.isCorrect ? 'correct' : 'incorrect') : ''}" role="status"><div><strong>${explanationTitle}</strong><small>Correct answer</small><span>${options.map((o,i) => o.isCorrect ? String.fromCharCode(65+i) : '').filter(Boolean).join(', ') || '—'}</span></div><div class="dungeon-feedback-metric"><svg class="dungeon-feedback-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M3 21h18M6 18v-5M12 18V5M18 18V9"/></svg><span>${q.answerStats?.percent_correct == null ? '—' : Number(q.answerStats.percent_correct) + '%'}</span><small>Answered correctly</small></div><div class="dungeon-feedback-metric"><svg class="dungeon-feedback-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/></svg><span>${Math.floor((q.timerElapsed || 0)/60000)} min, ${Math.floor((q.timerElapsed || 0)/1000)%60} secs</span><small>Time spent</small></div></div>
             ${q.source?.bank?.startsWith('mehlman-') ? '' : '<h3>Explanation</h3>'}
             <div>${q.contentFormat === 'medos-html' ? window.MedicalLibrary.renderContent(q, 'explanation') : (window.Markdown ? window.Markdown.render(q.explanation || "No explanation provided.") : (q.explanation || "No explanation provided."))}</div>
             ${tagsHtml}
         </div>
      `;
        }

        // Handle Split View
        const explContent = document.getElementById('dungeonExplanationContent');
        const expPanel = document.getElementById('dungeonExplanationPanel');
        const resizer = document.getElementById('dungeonSplitResizer');
        
        if (this.state.splitView && showExplanation && explContent && expPanel && resizer) {
            explContent.innerHTML = explHtml;
            expPanel.classList.remove('hidden');
            resizer.classList.remove('hidden');
            // Standard main container
            this.el.main.innerHTML = html;
        } else {
            // Hide split panel if not showing explanation or split view is off
            if (expPanel) expPanel.classList.add('hidden');
            if (resizer) resizer.classList.add('hidden');
            
            // Standard mode: Explanation follows options
            html += explHtml;
            this.el.main.innerHTML = html;
            // Clear side panel if it exists
            if (explContent) explContent.innerHTML = '';
        }

        if(q.contentFormat === 'medos-html') this.layoutTableOptions(this.el.main);

        // Bind click events to images for the viewer
        this.el.main.querySelectorAll('.question-image').forEach(img => {
            img.style.cursor = 'zoom-in';
            img.onclick = (e) => {
                e.stopPropagation();
                this.openImageViewer(img.src);
            };
        });

        this.renderToolbarState(); // Sync toolbar with current question state

        // Re-apply search highlights if active
        if (this.state.search) {
            setTimeout(() => this.highlightSearchTerms(), 10);
        }
    }

    pauseAmbossSession() {
        if(document.getElementById('qaPausedSession'))return;
        this.stopTimer();
        const dialog=document.createElement('dialog');dialog.id='qaPausedSession';dialog.className='qa-pause-dialog';
        dialog.innerHTML='<button type="button" class="qa-pause-close" aria-label="Resume session">×</button><h2>Your question session is paused</h2><img class="qa-pause-art" src="assets/amboss/pause-coffee.png" alt=""><div><button type="button" class="qa-pause-resume">Resume</button></div>';
        if(this.el.container?.classList.contains('qa-dark'))dialog.classList.add('qa-pause-dark');
        document.body.append(dialog);
        dialog.querySelectorAll('button').forEach(button=>button.onclick=()=>dialog.close());
        dialog.onclose=()=>{dialog.remove();if(!this.el.container?.classList.contains('hidden'))this.startTimer();};dialog.showModal();
    }

    updateAmbossClocks(ms=0) {
        const sidebar=this.el.container?.querySelector('.dungeon-sidebar');
        if(!sidebar?.querySelector('.qa-clock-panel'))return;
        const block=document.getElementById('dungeonBlockElapsed')?.textContent;
        const saved=this.state.questions.reduce((total,item)=>total+(Number(item.timerElapsed)||0),0);
        const seconds=block?block.split(':').reduce((total,value)=>total*60+Number(value),0):Math.floor(saved/1000);
        sidebar.querySelector('.qa-session-time').textContent=`${Math.floor(seconds/3600)}h ${String(Math.floor(seconds/60)%60).padStart(2,'0')}m`;
        const qSeconds=Math.floor(Math.max(0,ms)/1000);
        sidebar.querySelector('.qa-question-time').textContent=`${String(Math.floor(qSeconds/60)).padStart(2,'0')}:${String(qSeconds%60).padStart(2,'0')}`;
    }

    renderAmbossSidebar() {
        const sidebar=this.el.container?.querySelector('.dungeon-sidebar');if(!sidebar)return;
        const width=Math.max(220,Math.min(520,Number(localStorage.getItem('qnex-amboss-sidebar-width'))||320));
        if(!this.el.container.style.getPropertyValue('--qa-sidebar-width'))this.el.container.style.setProperty('--qa-sidebar-width',width+'px');
        const current=this.state.questions[this.state.currentIndex];if(current)current._ambossVisited=true;
        const solved=this.state.questions.filter(item=>this.state.answers.get(item.id)?.submitted).length;
        const review=Boolean(this.state.isBlockRevealed || window.MedicalLibrary?.active?.completed);
        sidebar.querySelector('.qa-session-heading')?.remove();sidebar.querySelector('.qa-clock-panel')?.remove();
        const heading=document.createElement('div');heading.className='qa-session-heading';
        heading.innerHTML=`<div class="qa-session-title">${review?'<span class="qa-review-badge">REVIEW</span>':''}<span>${review?'':''}<strong class="qa-session-name"></strong></span><button type="button" class="qa-sidebar-collapse" aria-label="Collapse sidebar"><svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="1"/><path d="M15 4v16"/></svg></button></div><div class="qa-session-progress">${solved}/${this.state.questions.length}</div><div class="qa-progress-track" role="progressbar" aria-label="Questions answered" aria-valuemin="0" aria-valuemax="${this.state.questions.length}" aria-valuenow="${solved}"><span style="width:${100*solved/Math.max(1,this.state.questions.length)}%"></span></div>`;
        const session=window.MedicalLibrary?.active;
        const sessionName=session?.title;
        heading.querySelector('.qa-session-name').textContent=!sessionName||/ · \d+ questions$/.test(sessionName)?window.MedicalLibrary?.defaultSessionTitle?.(session?.date||new Date())||'Custom session':sessionName;
        heading.querySelector('button').onclick=()=>this.toggleSidebar();sidebar.prepend(heading);
        sidebar.querySelectorAll('.dungeon-q-box').forEach((box,index)=>{
            const item=this.state.questions[index];if(!item)return;
            box.querySelector('.dungeon-result-icon')?.remove();
            const recordedAnswer=this.state.answers.get(item.id)||item.submittedAnswer;
            const hadWrongAttempt=(item.ambossAttemptedOptionIds||[]).some(id=>item.options?.some(option=>String(option.id)===String(id)&&!option.isCorrect));
            const incorrect=hadWrongAttempt||Boolean(recordedAnswer?.submitted&&!recordedAnswer.isCorrect);
            if(incorrect){box.classList.remove('correct');box.classList.add('wrong');}
            const hasStatus=item.revealed||box.classList.contains('correct')||box.classList.contains('wrong');
            if(hasStatus){
                const hinted=Boolean(item._ambossHintUsed||item._ambossKeyUsed);
                const wrong=incorrect;
                const path=wrong?'M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16m3.707-11.707a1 1 0 0 1 0 1.414L9.414 8l2.293 2.293a1 1 0 0 1-1.414 1.414L8 9.414l-2.293 2.293a1 1 0 0 1-1.414-1.414L6.586 8 4.293 5.707a1 1 0 0 1 1.414-1.414L8 6.586l2.293-2.293a1 1 0 0 1 1.414 0':'M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16m4.737-10.324a1 1 0 0 0-1.474-1.352L6.5 9.52 4.737 7.597a1 1 0 0 0-1.474 1.351l2.5 2.728a1 1 0 0 0 1.474 0z';
                const status=document.createElement('span');status.className='dungeon-result-icon'+(hinted&&!wrong?' qa-revealed-icon':'');
                status.setAttribute('aria-label',wrong?'Incorrect answer':hinted?'Hint used':'Correct answer');
                status.innerHTML=`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16" focusable="false" aria-hidden="true"><path fill="currentColor" fill-rule="evenodd" d="${path}" clip-rule="evenodd"></path></svg>`;
                box.querySelector('.dungeon-box-status')?.prepend(status);
            }else if(item._ambossVisited||Number(item.timerElapsed)>0){
                const status=document.createElement('span');status.className='dungeon-result-icon qa-unanswered-icon';status.setAttribute('aria-label','Unanswered question');status.innerHTML='<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" focusable="false" aria-hidden="true"><circle cx="8" cy="8" r="4"></circle></svg>';box.querySelector('.dungeon-box-status')?.prepend(status);
            }
            box.querySelector('.qa-sidebar-label')?.remove();box.querySelector('.qa-difficulty')?.remove();
            const visited=item._ambossVisited||hasStatus||this.state.answers.get(item.id)?.submitted||Number(item.timerElapsed)>0;
            if(visited){
                const preview=document.createElement('template');preview.innerHTML=item.richText||'';const stem=preview.content;stem.querySelectorAll('details,script,style').forEach(el=>el.remove());
                const label=document.createElement('span');label.className='qa-sidebar-label';label.textContent=(item.text||stem.textContent||item.title||'Question').replace(/\s+/g,' ').trim();box.append(label);
            }
            box.removeAttribute('title');
            const flag=box.querySelector('.dungeon-flagged-indicator');
            if(flag)flag.innerHTML=this.ambossFlagIcon(true);
        });
        const clocks=document.createElement('div');clocks.className='qa-clock-panel';
        clocks.classList.toggle('qa-clock-collapsed',Boolean(this._ambossClocksHidden));
        clocks.innerHTML=`<button type="button" class="qa-clock-toggle" aria-label="${this._ambossClocksHidden?'Show timers':'Hide timers'}" aria-expanded="${!this._ambossClocksHidden}"><svg viewBox="0 0 24 24"><path d="M9 2h6M12 2v3"/><circle cx="12" cy="14" r="8"/><path d="m12 14 3-4"/><path class="qa-clock-slash" d="M3 3l18 18"/></svg></button><div class="qa-clock-values"><div><strong class="qa-session-time">0h 00m</strong><small>SESSION</small></div><div><strong class="qa-question-time">00:00</strong><small>QUESTION</small></div></div>`;
        clocks.querySelector('button').onclick=event=>{this._ambossClocksHidden=!this._ambossClocksHidden;clocks.classList.toggle('qa-clock-collapsed',this._ambossClocksHidden);event.currentTarget.setAttribute('aria-expanded',!this._ambossClocksHidden);event.currentTarget.setAttribute('aria-label',this._ambossClocksHidden?'Show timers':'Hide timers');};
        sidebar.append(clocks);this.updateAmbossClocks(this.lastTimerMs||0);
        const pause=document.createElement('button');pause.type='button';pause.className='qa-clock-pause';pause.setAttribute('aria-label','Pause session');pause.innerHTML='<svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path stroke="currentColor" stroke-width="1.5" d="M3 2h3v12H3zM10 2h3v12h-3z"/></svg>';pause.onclick=()=>this.pauseAmbossSession();clocks.append(pause);
    }

    renderAmbossHeader(q) {
        const root=this.el.container, top=root?.querySelector('#dungeonTopbar');
        if(!top)return;
        top.style.setProperty('left','0px','important');
        let header=top.querySelector('.qa-header');
        if(!header){
            header=document.createElement('div');header.className='qa-header';
            header.innerHTML=`<form class="qa-library-search" role="search"><input aria-label="Search medical library" placeholder="Find AMBOSS content" autocomplete="off"><kbd>Ctrl+K</kbd><div class="qa-search-status" role="status" hidden>Medical library search will be available when the library is added.</div></form>
              <details class="qa-bank-menu"><summary aria-label="Settings" aria-describedby="qaBankSettingsTip"><span class="qa-bank-avatar">A</span><span><strong class="qa-bank-name"></strong><small>Question bank</small></span></summary><span class="qa-bank-tooltip" id="qaBankSettingsTip" role="tooltip">Settings</span>
                <div class="qa-bank-dropdown"><div class="qa-bank-info"><strong class="qa-bank-fullname"></strong><p>Question bank</p><button type="button" class="qa-open-settings">Settings</button></div>
                <div class="qa-theme-section"><label>THEME</label><div class="qa-theme-segments" role="group" aria-label="Theme"><button type="button" data-qa-theme="light">Light</button><button type="button" data-qa-theme="dark">Dark</button><button type="button" data-qa-theme="system">System</button></div></div>
                <button type="button" class="qa-menu-exit" title="Exit question bank session">LOG OUT</button></div></details>`;
            top.append(header);
            const search=header.querySelector('form'), input=search.querySelector('input'),status=search.querySelector('[role=status]'),menu=header.querySelector('details');
            input.onfocus=()=>status.hidden=false;
            input.onblur=()=>status.hidden=true;
            search.onsubmit=event=>{
                event.preventDefault();status.hidden=false;
                // The future library can register this event without changing the header.
                root.dispatchEvent(new CustomEvent('medical-library-search',{bubbles:true,detail:{query:input.value.trim(),bank:header.dataset.bank}}));
            };
            header.querySelector('.qa-open-settings').onclick=()=>{menu.open=false;this.close();window.QuestionBase?.switchTab('qbank-settings');};
            header.querySelector('.qa-menu-exit').onclick=()=>{menu.open=false;this.close();};
            const applyTheme=()=>{
                const choice=localStorage.getItem('qnex-amboss-theme')||'light';
                root.classList.toggle('qa-dark',choice==='dark'||(choice==='system'&&matchMedia('(prefers-color-scheme: dark)').matches));
                header.querySelectorAll('[data-qa-theme]').forEach(button=>button.setAttribute('aria-pressed',button.dataset.qaTheme===choice));
            };
            header.querySelectorAll('[data-qa-theme]').forEach(button=>button.onclick=()=>{localStorage.setItem('qnex-amboss-theme',button.dataset.qaTheme);applyTheme();});
            matchMedia('(prefers-color-scheme: dark)').addEventListener('change',applyTheme);applyTheme();
            document.addEventListener('pointerdown',event=>{if(!menu.contains(event.target))menu.open=false;});
            document.addEventListener('keydown',event=>{
                if(root.classList.contains('hidden')||!root.classList.contains('amboss-dungeon'))return;
                if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='k'){event.preventDefault();event.stopImmediatePropagation();input.focus();}
                if(event.key==='Escape'){menu.open=false;status.hidden=true;input.blur();}
            },true);
        }
        const bank=window.MedicalLibrary?.banks?.find(item=>item.key===q.source.bank);
        const name=bank?.label||q.source.bank.replace(/^amboss/i,'AMBOSS Step ');
        header.dataset.bank=q.source.bank;
        const profile=window.QbankProfile?.read();
        header.querySelector('.qa-bank-name').textContent=profile?.username||name;
        header.querySelector('.qa-bank-fullname').textContent=profile?.username||name;
        header.querySelector('summary small').textContent=window.MedicalLibrary?.banks?.find(item=>item.key===window.MedicalLibrary.currentBank)?.label||name;
        header.querySelector('.qa-bank-info p').textContent=header.querySelector('summary small').textContent;
        header.querySelector('.qa-bank-avatar').textContent=profile?.username?.slice(0,1).toUpperCase()||'A';
    }

    ambossHintBadge() {
        return '<div class="qa-hint-used"><svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path fill="currentColor" fill-rule="evenodd" d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16m4.737-10.324a1 1 0 0 0-1.474-1.352L6.5 9.52 4.737 7.597a1 1 0 0 0-1.474 1.351l2.5 2.728a1 1 0 0 0 1.474 0z" clip-rule="evenodd"/></svg><span>HINT USED</span></div>';
    }

    ambossFlagIcon(filled=false) {
        return `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3 14V2m0 0c3-2 6 2 10 0v8c-4 2-7-2-10 0" fill="${filled?'currentColor':'none'}" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    }

    syncAmbossExplanationToggle(mount) {
        if(mount.dataset.qaFullAnswer!=='true')return;
        const bodies=[...mount.querySelectorAll('.qa-answer-explanation')];
        const button=mount.querySelector('[data-qa="answer"]');
        if(!bodies.length||!button)return;
        const allOpen=bodies.every(body=>body.dataset.qaOpen?body.dataset.qaOpen==='true':!body.hidden);
        const icon=button.querySelector('svg');
        if(icon)icon.outerHTML=`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16" aria-hidden="true"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="bevel" stroke-width="2" d="M3 6h10M3 10h10"/><path fill="currentColor" d="${allOpen?'m8 12 3 3H5zm0-8L5 1h6z':'m8 16 3-3H5zM8 0 5 3h6z'}"/></svg>`;
        button.lastChild.textContent=allOpen?'Hide all explanations':'Show all explanations';
    }

    async transitionAmbossPanel(panel,open) {
        if(!panel)return false;
        const wasHidden=panel.hidden,current=panel.getBoundingClientRect().height;
        const style=getComputedStyle(panel),opacity=wasHidden?0:Number(style.opacity);
        panel._qaExpansion?.cancel();
        panel.dataset.qaOpen=String(open);
        if(matchMedia('(prefers-reduced-motion: reduce)').matches){panel.hidden=!open;return true;}
        panel.hidden=false;
        const full=panel.getBoundingClientRect().height;
        const expanded=getComputedStyle(panel),top=expanded.paddingTop,bottom=expanded.paddingBottom;
        const animation=panel.animate([
            {height:(wasHidden?0:current)+'px',opacity,paddingTop:wasHidden?'0px':top,paddingBottom:wasHidden?'0px':bottom,overflow:'hidden',boxSizing:'border-box'},
            {height:(open?full:0)+'px',opacity:open?1:0,paddingTop:open?top:'0px',paddingBottom:open?bottom:'0px',overflow:'hidden',boxSizing:'border-box'}
        ],{duration:220,easing:'cubic-bezier(.2,.7,.2,1)',fill:'both'});
        panel._qaExpansion=animation;
        try{await animation.finished;}catch{return false;}
        if(panel._qaExpansion!==animation)return false;
        panel.hidden=!open;animation.cancel();panel._qaExpansion=null;return true;
    }

    ambossNoteId(q) {
        const source=String(q.id),safe=/[<>:"/\\|?*]/.test(source)?'encoded-'+Array.from(new TextEncoder().encode(source),b=>b.toString(16).padStart(2,'0')).join(''):source;
        return 'dungeon_note_'+safe;
    }

    setAmbossNoteStatus(q,button,hasNote) {
        q._ambossHasNote=hasNote;
        if(!button?.isConnected||this.state.questions[this.state.currentIndex]!==q)return;
        button.classList.toggle('qa-has-note',hasNote);
        button.setAttribute('aria-label',hasNote?'Add notes — saved note available':'Add notes');
        const filled='<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="m11.8 1.2 3 3-9 9-4 .8.8-4zM1 15h13v1H1z"/></svg>';
        button.innerHTML=(hasNote?'<span class="qa-note-dot" aria-hidden="true"></span>'+filled:(window.AmbossIcons?.notes||'✎'))+'<span>Add notes</span>';
    }

    async refreshAmbossNoteStatus(q,button) {
        this.setAmbossNoteStatus(q,button,Boolean(q._ambossHasNote));
        if(!window.QBankWorkspace?.loadNotes)return;
        try {
            const notes=await window.QBankWorkspace.loadNotes();
            if(this.state.questions[this.state.currentIndex]!==q||!button.isConnected)return;
            const note=notes.find(item=>item.id===this.ambossNoteId(q));
            this.setAmbossNoteStatus(q,button,Boolean(note&&(note.content||note.contentHtml||'').trim()));
        } catch(error) { console.warn('[Dungeon] Could not refresh saved note status:',error.message); }
    }

    async editAmbossNote() {
        const mount=this.el.main,q=this.state.questions[this.state.currentIndex];
        const existing=mount.querySelector('.qa-note-editor');if(existing){this.transitionAmbossPanel(existing,false).then(done=>{if(done)existing.remove();});return;}
        const noteId=this.ambossNoteId(q);
        try {
            const notes=await window.QBankWorkspace.loadNotes();
            if(this.state.questions[this.state.currentIndex]!==q)return;
            if(mount.querySelector('.qa-note-editor'))return;
            const previous=notes.find(note=>note.id===noteId);
            const panel=document.createElement('div');panel.className='qa-note-editor';
            panel.innerHTML='<div class="qa-note-toolbar" role="toolbar" aria-label="Note formatting"><button type="button" data-command="bold" aria-label="Bold"><b>B</b></button><button type="button" data-command="italic" aria-label="Italic"><i>I</i></button><button type="button" data-command="underline" aria-label="Underline"><u>U</u></button><button type="button" data-command="insertUnorderedList" aria-label="Bulleted list">• ≡</button><button type="button" data-command="insertOrderedList" aria-label="Numbered list">1 ≡</button><button type="button" data-command="undo" aria-label="Undo">↶</button><button type="button" data-command="redo" aria-label="Redo">↷</button></div><div class="qa-note-content" contenteditable="true" role="textbox" aria-label="Question note" aria-multiline="true" data-placeholder="Write your note…"></div><div class="qa-note-actions"><button type="button" data-note="cancel">Cancel</button><button type="button" data-note="save">Save</button></div>';
            const editor=panel.querySelector('.qa-note-content');
            const noteIcons={insertUnorderedList:'<circle cx="3" cy="4" r="1"/><circle cx="3" cy="8" r="1"/><circle cx="3" cy="12" r="1"/><path d="M6 4h8M6 8h8M6 12h8"/>',insertOrderedList:'<path d="M2 2h1v4M2 8h2l-2 3h2M6 4h8M6 8h8M6 12h8"/>',undo:'<path d="M5 3 2 6l3 3M2 6h7a5 5 0 0 1 0 10"/>',redo:'<path d="m11 3 3 3-3 3M14 6H7a5 5 0 0 0 0 10"/>'};
            for(const [command,path] of Object.entries(noteIcons))panel.querySelector(`[data-command="${command}"]`).innerHTML=`<svg width="16" height="16" viewBox="0 0 16 18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;
            const clean=html=>{const template=document.createElement('template');template.innerHTML=html;template.content.querySelectorAll('script,style,iframe,object,embed').forEach(el=>el.remove());template.content.querySelectorAll('*').forEach(el=>{if(!['B','STRONG','I','EM','U','P','BR','DIV','UL','OL','LI','BLOCKQUOTE','SPAN'].includes(el.tagName))el.replaceWith(...el.childNodes);else for(const attr of [...el.attributes])el.removeAttribute(attr.name);});return template.innerHTML;};
            editor.innerHTML=previous?.contentHtml?clean(previous.contentHtml):'';
            if(!previous?.contentHtml&&previous?.content)editor.textContent=previous.content;
            mount.querySelector('.qa-tools').before(panel);
            panel.hidden=true;this.transitionAmbossPanel(panel,true);
            panel.querySelectorAll('[data-command]').forEach(button=>{button.onmousedown=event=>event.preventDefault();button.onclick=()=>{editor.focus();document.execCommand(button.dataset.command,false,null);};});
            panel.querySelector('[data-note="cancel"]').onclick=()=>this.transitionAmbossPanel(panel,false).then(done=>{if(done)panel.remove();});
            const save=panel.querySelector('[data-note="save"]');
            const update=()=>save.disabled=!editor.textContent.trim();editor.oninput=update;update();
            editor.onpaste=event=>{event.preventDefault();document.execCommand('insertText',false,event.clipboardData.getData('text/plain'));update();};
            save.onclick=async()=>{save.disabled=true;try{const now=new Date().toISOString();await window.QBankWorkspace.saveNote({...previous,id:noteId,title:`Dungeon Note - Q${this.state.currentIndex+1} (${q.title||'Question'})`,content:editor.innerText,contentHtml:clean(editor.innerHTML),type:'dungeon-note',bank:q.source?.bank||null,questionId:q.id,questionIndex:this.state.currentIndex,sessionId:this.state.associatedSessionId||this.state.sessionId,isSessionWide:false,folderId:previous?.folderId||null,createdAt:previous?.createdAt||now,updatedAt:now,date:now});this.setAmbossNoteStatus(q,mount.querySelector('[data-qa="notes"]'),true);if(await this.transitionAmbossPanel(panel,false))panel.remove();window.showToast?.('Question note saved.','success');}catch(error){update();window.showToast?.(error.message,'error');}};
            editor.focus();
        } catch(error) { window.showToast?.('Could not open question notes: '+error.message,'error'); }
    }

    async exportAmbossContent(wholeBlock=false) {
        const questions=(wholeBlock?this.state.questions:[this.state.questions[this.state.currentIndex]]).map(q=>{
            const copy=JSON.parse(JSON.stringify(q));for(const key of Object.keys(copy))if(key.startsWith('_')||['revealed','timerElapsed','selectedOption','crossedOutOptionIds'].includes(key))delete copy[key];return copy;
        });
        const title=window.MedicalLibrary?.active?.title||'Qnex question block';
        const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
        const lib=window.MedicalLibrary;
        const body=questions.map((q,index)=>`<section><h2>Question ${wholeBlock?index+1:this.state.currentIndex+1}</h2>${lib.renderContent(q,'question')}<ol type="A">${(q.options||[]).map(opt=>`<li>${lib.renderContent(q,'option',opt)}</li>`).join('')}</ol><h3>Answer and explanation</h3>${lib.renderContent(q,'explanation')}</section>`).join('');
        const documentHtml=document.createElement('div');documentHtml.innerHTML=body;
        documentHtml.querySelectorAll('script,iframe,object,embed,button,audio,video').forEach(el=>el.remove());
        documentHtml.querySelectorAll('*').forEach(el=>{for(const attr of [...el.attributes])if(attr.name.startsWith('on'))el.removeAttribute(attr.name);});
        documentHtml.querySelectorAll('details').forEach(el=>el.setAttribute('open',''));
        documentHtml.querySelectorAll('img').forEach(img=>{img.src=new URL(img.getAttribute('src'),location.href).href;});
        const html=`<!doctype html><html><head><meta charset="utf-8"><title>${escape(title)}</title><style>body{font:14px/1.6 Lato,Arial,sans-serif;color:#14242f}h1{font-size:22px}h2{font-size:18px}h3{font-size:15px}section+section{break-before:page}li{padding:5px 0}img{max-width:100%;height:auto}table{border-collapse:collapse;width:100%;font-size:12px}td,th{border:1px solid #ccd5dc;padding:6px}a{color:#146772}p{orphans:3;widows:3}</style></head><body><h1>${escape(title)}</h1>${documentHtml.innerHTML}</body></html>`;
        if(!window.electronAPI?.createQuestionPdf)throw new Error('PDF export requires the desktop app. Restart Qnex to enable it.');
        const bytes=await window.electronAPI.createQuestionPdf(html);
        const name=wholeBlock?'qnex-question-block.pdf':`qnex-question-${questions[0]?.source?.questionId||'saved'}.pdf`;
        const blob=new Blob([new Uint8Array(bytes)],{type:'application/pdf'});
        if(wholeBlock&&navigator.canShare&&navigator.share){const file=new File([blob],name,{type:'application/pdf'});if(navigator.canShare({files:[file]})){try{await navigator.share({title,files:[file]});return;}catch(error){if(error.name==='AbortError')return;}}}
        const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=name;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);
        window.showToast?.(wholeBlock?'Question block exported for sharing.':'Question saved.','success');
    }

    styleAmbossLabs() {
        const panel=document.getElementById('dungeonLabSidebar');if(!panel)return;
        if(!this.el.container.style.getPropertyValue('--qa-lab-panel-width')){
            const saved=Number(localStorage.getItem('dungeonLabWidth'));
            if(saved>=310)this.el.container.style.setProperty('--qa-lab-panel-width',Math.min(saved,Math.max(310,window.innerWidth-376))+'px');
        }
        const header=panel.querySelector('.lab-sidebar-header'),search=panel.querySelector('.lab-search-container');
        const close=()=>{panel.classList.remove('active');document.getElementById('dungeonLabBtn')?.classList.remove('active');this.updateToolbarPush();};
        if(header&&search&&!header.contains(search))header.prepend(search);
        if(header){header.onclick=null;if(!header.querySelector('.qa-lab-top-close')){
            const topClose=document.createElement('button');topClose.type='button';topClose.className='qa-lab-top-close';topClose.setAttribute('aria-label','Close lab values');topClose.textContent='×';topClose.onclick=close;header.append(topClose);
        }}
        if(!panel.querySelector('.qa-lab-close')){const button=document.createElement('button');button.type='button';button.className='qa-lab-close';button.innerHTML='<span aria-hidden="true">×</span> Close';button.onclick=close;panel.append(button);}
    }

    renderAmbossQuestion(q) {
        this.renderAmbossHeader(q);
        this.el.container?.querySelector(':scope > .qa-navigation')?.remove();
        const lib=window.MedicalLibrary;
        const icons=window.AmbossIcons||{};
        const doctors=['3ab2389014dea442','044cb46fd2d38580','13741dd475cea158','f7be05f97d56c118','a69fa336ff5178fa','7b6df07905703110'];
        if(!q._ambossDoctor)q._ambossDoctor=doctors[Math.floor(Math.random()*doctors.length)];
        const answer=this.state.answers.get(q.id);
        const show=Boolean(q.revealed || (answer?.submitted && (q._tutorMode!==false || this.state.isBlockRevealed)));
        const fullAnswer=Boolean(q.revealed||this.state.isBlockRevealed||(show&&answer?.isCorrect));
        const locked=q._timedOut || answer?.locked;
        const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
        const stem=document.createElement('div');stem.innerHTML=lib.renderContent(q,'question');
        const hints=[...stem.querySelectorAll('details.qbank-hint')];hints.forEach(hint=>hint.remove());
        const pictures=[...stem.querySelectorAll('img')].filter(img=>!img.closest('table'));
        if(pictures.length){
            const layout=document.createElement('div');layout.className='qa-stem-layout';
            const text=document.createElement('div');text.className='qa-stem-text';
            const media=document.createElement('aside');media.className='qa-stem-media';media.setAttribute('aria-label','Question illustrations');
            pictures.forEach(img=>{const figure=document.createElement('figure');figure.className='qa-stem-figure';figure.append(img);const expand=document.createElement('button');expand.type='button';expand.className='qa-picture-expand';expand.setAttribute('aria-label','Expand question image');expand.innerHTML='<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M10 2h4v4M14 2l-5 5M6 14H2v-4M2 14l5-5"/></svg>';figure.append(expand);media.append(figure);});
            while(stem.firstChild)text.append(stem.firstChild);
            text.querySelectorAll('figure').forEach(figure=>{if(!figure.textContent.trim()&&!figure.querySelector('img,video,table'))figure.remove();});
            layout.append(text,media);stem.append(layout);
        }
        const hasKey=Boolean(stem.querySelector('span.selected'));
        const explanation=document.createElement('div');explanation.innerHTML=lib.renderContent(q,'explanation');
        const parts=new Map();
        explanation.querySelectorAll('h4').forEach(heading=>{
            const match=heading.textContent.match(/(?:Correct Answer Is\s+|\[\s*)([A-Z])\s*(?:\]|\[)/i);
            if(!match) return;
            const percent=heading.textContent.match(/(\d+(?:\.\d+)?)\s*%/);
            const block=heading.parentElement;heading.remove();
            parts.set(match[1].toUpperCase(),{html:block.innerHTML,percent:percent?.[1]});block.remove();
        });
        // Unassigned supplementary figures belong to the correct answer's explanation.
        // Figures embedded in an option explanation stay in their original source block.
        const correctLetter=String.fromCharCode(65+(q.options||[]).findIndex(option=>option.isCorrect));
        const supplementary=document.createElement('div');
        explanation.querySelectorAll('figure').forEach(figure=>{
            if(figure.querySelector('img,video,audio'))supplementary.append(figure);
        });
        explanation.querySelectorAll('img,video,audio').forEach(media=>supplementary.append(media));
        if(supplementary.childNodes.length){
            const correctPart=parts.get(correctLetter)||{html:'',percent:null};
            correctPart.html+=supplementary.innerHTML;parts.set(correctLetter,correctPart);
        }
        const selected=answer?.submitted?answer.selectedId:this.state.selectedOption;
        const attempted=new Set((q.ambossAttemptedOptionIds||[]).map(String));
        if(show&&answer?.submitted)attempted.add(String(answer.selectedId));
        const options=(q.options||[]).map((opt,index)=>{
            const letter=String.fromCharCode(65+index),part=parts.get(letter);
            const percentage=part?.percent ?? opt.percent;
            const active=String(selected)===String(opt.id)||(show&&attempted.has(String(opt.id)));
            const crossed=q.crossedOutOptionIds?.includes(String(opt.id));
            const feedback=show&&(fullAnswer||active);
            const state=feedback?(opt.isCorrect?'qa-correct':active?'qa-wrong':'qa-other'):active?'qa-selected':'';
            return `<div class="qa-option dungeon-radio-option ${state}${crossed?' crossed-out':''}" data-option="${escape(opt.id)}">
              <div class="qa-answer-line"><button type="button" class="dungeon-radio-circle qa-letter" aria-label="Select answer ${letter}" aria-pressed="${active}" ${locked?'disabled':''} onclick="window.DungeonBase.handleSelectOption('${opt.id}')">${letter}</button>
              <div class="qa-choice" data-select="${escape(opt.id)}">${lib.renderContent(q,'option',opt)}</div>
              ${feedback?`<small class="qa-percent" aria-label="${letter}: percentage choosing this answer">${percentage==null?'—':escape(percentage)+'%'}</small>`:''}
              <button type="button" class="qa-strike" aria-label="${feedback?'Toggle explanation for':'Cross out answer'} ${letter}" ${locked&&!show?'disabled':''}>${feedback?'−':'×'}</button></div>
              ${feedback&&part?`<div class="qa-answer-explanation" ${!opt.isCorrect&&!active?'hidden':''}>${part.html}</div>`:''}</div>`;
        }).join('');
        this.el.main.innerHTML=`<article class="qa-card"><div class="qa-reading-bar"><span class="qa-question-position">Question ID: ${escape(q.source?.qid ?? q.source?.questionId ?? q.id)}</span><button type="button" data-qa="font" aria-label="Change text size">${icons.font||'AA'}</button></div>
          <div class="qa-stem dungeon-context-box" onmouseup="window.DungeonBase.handleHighlight(event,'main')">${stem.innerHTML}</div>
          <div class="qa-tools">${hasKey?`<button data-qa="key" aria-pressed="false">${icons.key||'☰'} Key info</button>`:''}${hints.length?`<button data-qa="hint" aria-expanded="false">${icons.hint||'ⓘ'} Attending tip</button>`:''}<button data-qa="labs">${icons.labs||'▤'} Labs</button><span></span><button data-qa="notes">${icons.notes||'✎'} Add notes</button><button data-qa="mark" aria-pressed="${Boolean(q.starred)}">${icons.mark||'⚑'} ${q.starred?'Marked':'Mark'}</button></div>
          ${hints.length?`<div class="qa-hint" hidden>${this.ambossHintBadge()}<div class="qa-attending-content"><img src="assets/amboss/doctor-${q._ambossDoctor}.svg" alt="" class="qa-doctor"><div>${hints.map(hint=>hint.querySelector('.qbank-hint-body')?.innerHTML||hint.innerHTML).join('')}</div></div></div>`:''}
          <div class="qa-options">${options}</div></article>
          <div class="qa-bottom-actions"><button data-qa="answer"><svg width="16" height="16" fill="none" viewBox="0 0 16 16" aria-hidden="true"><g stroke="currentColor" stroke-width="2"><path d="M4 2a1 1 0 0 0-1 1v3.222L1.5 7.817a.2.2 0 0 0 0 .366L3 9.778V13a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1z"/><path stroke-linecap="round" stroke-linejoin="round" d="m12 6-4.125 4L6 8.182"/></g></svg>${fullAnswer?'Show all explanations':'Show answer'}</button><div class="qa-bottom-right"><button data-qa="reset" ${!answer?.submitted&&!q.revealed&&!this.state.selectedOption?'disabled':''}><svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1a7 7 0 1 1-7 7 1 1 0 0 1 2 0 5.002 5.002 0 0 0 5.976 4.904A5 5 0 0 0 8 3a5.5 5.5 0 0 0-3.564 1.333h.896a1 1 0 0 1 0 2H2q-.085-.001-.166-.016-.015-.001-.031-.005l-.047-.01-.049-.013a1 1 0 0 1-.257-.121 1 1 0 0 1-.33-.36l-.02-.042a1 1 0 0 1-.1-.433V2a1 1 0 0 1 2 0v.934A7.5 7.5 0 0 1 7.996 1z"/></svg>Reset question</button><button data-qa="stats" ${!show?'disabled':''}><svg width="16" height="16" fill="none" viewBox="0 0 16 16" aria-hidden="true"><path fill="currentColor" fill-rule="evenodd" d="m12.3 12.57 2.286 2.344L16 13.5 2.914.086 1.5 1.5l2.013 2.063c-.537.396-1.007.827-1.407 1.246a13.3 13.3 0 0 0-1.65 2.135 2 2 0 0 0 0 2.112q.079.126.176.275c.332.505.826 1.18 1.474 1.86C3.387 12.531 5.381 14 8 14c1.707 0 3.148-.623 4.3-1.43m-1.42-1.455-.868-.89a3 3 0 0 1-4.187-4.292l-.899-.92A8.6 8.6 0 0 0 3.553 6.19 11.3 11.3 0 0 0 2.155 8l.148.232c.284.432.705 1.007 1.25 1.577C4.66 10.97 6.165 12 8 12c1.078 0 2.043-.355 2.88-.884zM7.225 7.368A1 1 0 0 0 8.613 8.79zm-.016-5.323 2.146 2.146c1.231.35 2.271 1.14 3.092 2A11.3 11.3 0 0 1 13.845 8a11 11 0 0 1-.269.412l1.435 1.435a14 14 0 0 0 .533-.791 2 2 0 0 0 0-2.112 13.3 13.3 0 0 0-1.65-2.135C12.613 3.467 10.619 2 8 2q-.405.001-.79.046z" clip-rule="evenodd"/></svg><span>${q._ambossStatsHidden?'Show stats':'Hide stats'}</span></button></div></div>
          ${fullAnswer&&(explanation.textContent.trim()||explanation.querySelector("img,video,audio"))?`<section class="qa-extra">${explanation.innerHTML}</section>`:''}
          <nav class="qa-navigation" aria-label="Question navigation"><button data-qa="exit">Exit session</button><button data-qa="prev" ${this.state.currentIndex===0?'disabled':''}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14 6-6 6 6 6"/></svg>Previous</button><button data-qa="next">${this.state.currentIndex===this.state.questions.length-1?'See analysis':answer?.submitted?'Next':'Skip'}<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m10 6 6 6-6 6"/></svg></button></nav>`;
        document.getElementById('dungeonExplanationPanel')?.classList.add('hidden');
        document.getElementById('dungeonSplitResizer')?.classList.add('hidden');
        const mount=this.el.main;
        mount.querySelectorAll('.qa-answer-explanation').forEach(body=>{
            const images=[...body.querySelectorAll('img')].filter(img=>!img.closest('table'));
            if(!images.length)return;
            const row=document.createElement('div');row.className='qa-explanation-images';row.setAttribute('aria-label','Explanation images');
            images.forEach(img=>{
                const tile=document.createElement('figure');tile.className='qa-explanation-preview';tile.append(img);
                const expand=document.createElement('button');expand.type='button';expand.className='qa-picture-expand';expand.setAttribute('aria-label','Expand explanation image');
                expand.innerHTML='<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M10 2h4v4M14 2l-5 5M6 14H2v-4M2 14l5-5"/></svg>';
                tile.append(expand);row.append(tile);
            });
            body.querySelectorAll('figure,p').forEach(el=>{if(!el.textContent.trim()&&!el.querySelector('img,video,audio,table'))el.remove();});
            body.append(row);
        });
        mount.querySelectorAll('.qa-picture-expand').forEach(button=>button.onclick=event=>{event.stopPropagation();this.openImageViewer(button.parentElement.querySelector('img').src);});
        mount.dataset.qaFullAnswer=String(fullAnswer);
        if(q._ambossAnimateAnswer&&show){
            delete q._ambossAnimateAnswer;
            if(!matchMedia('(prefers-reduced-motion: reduce)').matches){
                mount.querySelectorAll('.qa-answer-line').forEach(line=>{if(line.closest('.qa-option').dataset.option!==String(selected))return;line.animate([{backgroundColor:this.el.container.classList.contains('qa-dark')?'#1b1d1d':'#fff'},{backgroundColor:getComputedStyle(line).backgroundColor}],{duration:220,easing:'cubic-bezier(.2,.7,.2,1)'});});
                mount.querySelectorAll('.qa-answer-explanation:not([hidden])').forEach(body=>{if(body.closest('.qa-option').dataset.option!==String(selected))return;body.hidden=true;this.transitionAmbossPanel(body,true);});
            }
        }
        const tools=mount.querySelector('.qa-tools');
        tools.insertAdjacentHTML('beforeend','<details class="qa-more-menu"><summary aria-label="More question actions"><svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M5 9H3V7h2zm4 0H7V7h2zm4 0h-2V7h2z"/></svg></summary><div class="qa-more-options"><button type="button" data-export="question"><svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><g stroke="currentColor" stroke-linejoin="round" stroke-width="1.8"><path d="M14 12.667A1.334 1.334 0 0 1 12.667 14H3.333A1.334 1.334 0 0 1 2 12.667V3.333A1.333 1.333 0 0 1 3.333 2H6.5l1.333 2h4.834A1.333 1.333 0 0 1 14 5.333z"/><path stroke-linecap="round" d="M8 7v4M6 9h4"/></g></svg><span>Save question</span></button><button type="button" data-export="block"><svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M8 11V2M5 5l3-3 3 3M2 10v4h12v-4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg><span>Share block</span></button></div></details>');
        const more=tools.querySelector('.qa-more-menu');
        more.querySelectorAll('[data-export]').forEach(button=>button.onclick=()=>{more.open=false;this.exportAmbossContent(button.dataset.export==='block').catch(error=>window.showToast?.(error.message,'error'));});
        if(!this._ambossMenuOutside){this._ambossMenuOutside=true;document.addEventListener('pointerdown',event=>this.el.container?.querySelectorAll('.qa-more-menu[open]').forEach(menu=>{if(!menu.contains(event.target))menu.open=false;}));}
        mount.querySelectorAll('[data-select]').forEach(el=>el.onclick=()=>{if(!fullAnswer&&!locked&&!el.closest('.qa-option').querySelector('.qa-answer-explanation'))this.handleSelectOption(el.dataset.select);});
        if(show)mount.querySelectorAll('.qa-option').forEach(row=>{
            if(q._ambossHintUsed||q._ambossKeyUsed)row.classList.add('qa-hinted');
            const body=row.querySelector('.qa-answer-explanation'),line=row.querySelector('.qa-answer-line');
            if(!body)return;
            line.classList.add('qa-expandable');line.tabIndex=0;line.setAttribute('role','button');line.setAttribute('aria-expanded',String(!body.hidden));
            const toggle=()=>{if(window.getSelection()?.toString())return;const open=body.dataset.qaOpen?body.dataset.qaOpen!=='true':body.hidden;line.setAttribute('aria-expanded',String(open));this.transitionAmbossPanel(body,open);this.syncAmbossExplanationToggle(mount);};
            line.onclick=toggle;line.onkeydown=event=>{if(event.target!==line)return;if(event.key==='Enter'||event.key===' '){event.preventDefault();toggle();}};
        });
        mount.querySelectorAll('.qa-strike').forEach(button=>button.onclick=event=>{
            event.stopPropagation();const row=button.closest('.qa-option');
            if(show&&row.querySelector('.qa-answer-explanation')){const body=row.querySelector('.qa-answer-explanation');const open=body.dataset.qaOpen?body.dataset.qaOpen!=='true':body.hidden;this.transitionAmbossPanel(body,open);row.querySelector('.qa-answer-line').setAttribute('aria-expanded',String(open));this.syncAmbossExplanationToggle(mount);}
            else if(!locked)this.handleStrikeOption(event,button);
        });
        mount.classList.toggle('qa-show-key', Boolean(q._ambossKeyVisible));
        mount.querySelector('[data-qa="key"]')?.setAttribute('aria-pressed',String(mount.classList.contains('qa-show-key')));
        mount.querySelector('[data-qa="key"]')?.addEventListener('click',event=>{const active=mount.classList.toggle('qa-show-key');q._ambossKeyVisible=active;event.currentTarget.setAttribute('aria-pressed',active);if(active){q._ambossKeyUsed=true;q._ambossHintUsed=true;this.renderAmbossSidebar();}this.saveQuestionsToBackend();});
        if(q._ambossHintOpen){const hint=mount.querySelector('.qa-hint');if(hint)hint.hidden=false;mount.querySelector('[data-qa="hint"]')?.setAttribute('aria-expanded','true');}
        mount.querySelector('[data-qa="hint"]')?.addEventListener('click',event=>{const hint=mount.querySelector('.qa-hint'),open=event.currentTarget.getAttribute('aria-expanded')!=='true';q._ambossHintOpen=open;this.transitionAmbossPanel(hint,open);event.currentTarget.setAttribute('aria-expanded',open);if(open){q._ambossHintUsed=true;this.renderAmbossSidebar();this.saveQuestionsToBackend();}});
        mount.querySelector('[data-qa="labs"]').onclick=()=>{this.styleAmbossLabs();document.getElementById('dungeonLabBtn')?.click();};
        this.updateToolbarPush();
        mount.querySelector('[data-qa="notes"]').onclick=()=>this.editAmbossNote();
        this.refreshAmbossNoteStatus(q,mount.querySelector('[data-qa="notes"]'));
        mount.querySelector('[data-qa="mark"]').innerHTML=this.ambossFlagIcon(Boolean(q.starred||q.isStarred))+' Mark';
        mount.querySelector('[data-qa="mark"]').setAttribute('aria-pressed',Boolean(q.starred||q.isStarred));
        mount.querySelector('[data-qa="mark"]').onclick=()=>{this.toggleStar();this.renderQuestion();};
        mount.querySelector('[data-qa="font"]').onclick=()=>{const sizes=['font-small','font-medium','font-large'];const index=sizes.findIndex(size=>mount.classList.contains(size));sizes.forEach(size=>mount.classList.remove(size));mount.classList.add(sizes[(index+1)%3]);};
        mount.querySelector('[data-qa="answer"]').onclick=()=>{if(fullAnswer){const bodies=[...mount.querySelectorAll('.qa-answer-explanation')],open=bodies.some(el=>el.dataset.qaOpen?el.dataset.qaOpen!=='true':el.hidden);bodies.forEach(el=>{this.transitionAmbossPanel(el,open);el.closest('.qa-option').querySelector('.qa-answer-line').setAttribute('aria-expanded',String(open));});this.syncAmbossExplanationToggle(mount);}else this.toggleReveal();};
        if(show)this.syncAmbossExplanationToggle(mount);
        mount.querySelector('[data-qa="reset"]').onclick=()=>document.getElementById('dungeonClearBtn')?.click();
        mount.classList.toggle('qa-stats-hidden',Boolean(q._ambossStatsHidden));
        mount.querySelector('[data-qa="stats"]').onclick=event=>{q._ambossStatsHidden=!q._ambossStatsHidden;mount.classList.toggle('qa-stats-hidden',q._ambossStatsHidden);event.currentTarget.querySelector('span').textContent=q._ambossStatsHidden?'Show stats':'Hide stats';};
        mount.querySelector('[data-qa="prev"]').onclick=()=>this.navPrev();
        mount.querySelector('[data-qa="exit"]').onclick=()=>this.close();
        mount.querySelector('[data-qa="next"]').onclick=()=>{if(this.state.currentIndex===this.state.questions.length-1)this.submitBlock();else this.navNext();};
        // Keep fixed navigation outside the scrolling question panel's clipping boundary.
        this.el.container?.append(mount.querySelector('.qa-navigation'));
        const sidebar=this.el.container?.querySelector('.dungeon-sidebar');
        if(sidebar&&!sidebar.querySelector('.qa-session-heading')){
            const title=document.createElement('div');title.className='qa-session-heading';title.textContent=window.MedicalLibrary.active?.title||'AMBOSS session';sidebar.prepend(title);
        }
        sidebar?.querySelectorAll('.dungeon-q-box').forEach((box,index)=>{
            const item=this.state.questions[index];if(!item)return;
            const label=document.createElement('span');label.className='qa-sidebar-label';label.textContent=(item.text||item.title||'Question').replace(/\s+/g,' ').trim();
            box.querySelector('.qa-sidebar-label')?.remove();box.append(label);
        });
        this.renderToolbarState();
        this.renderAmbossSidebar();
    }

    layoutTableOptions(root) {
        const list=root.querySelector('.dungeon-options-list');
        if(!list) return;
        const rows=[...list.querySelectorAll('.dungeon-radio-option')];
        if(!rows.length) return;
        const tables=rows.map(row=>row.querySelector('.ml-rich-content table'));
        if(tables.some(table=>!table || table.rows.length!==1)) return;
        const columns=tables[0].rows[0].cells.length;
        if(columns<2 || tables.some(table=>table.rows[0].cells.length!==columns || [...table.rows[0].cells].some(cell=>cell.colSpan!==1||cell.rowSpan!==1))) return;
        // Merge only genuine tabular choices, leaving mixed-text answers intact.
        if(rows.some((row,index)=>{
            const clone=row.querySelector('.ml-rich-content').cloneNode(true);
            clone.querySelector('table').remove();
            return clone.textContent.trim() || clone.querySelector('img,video,audio,table');
        })) return;
        const stemTables=[...root.querySelectorAll('.dungeon-context-box table')];
        const header=stemTables.at(-1);
        if(!header || header.rows.length!==1 || header.rows[0].cells.length!==columns) return;
        const wrapper=document.createElement('div');wrapper.className='dungeon-choice-table-scroll';
        const table=document.createElement('table');table.className='dungeon-choice-table';
        const thead=document.createElement('thead'),head=document.createElement('tr');
        const choiceHeading=document.createElement('th');choiceHeading.setAttribute('aria-label','Answer choice');head.append(choiceHeading);
        [...header.rows[0].cells].forEach(cell=>{const th=document.createElement('th');th.scope='col';th.innerHTML=cell.innerHTML;head.append(th);});
        thead.append(head);table.append(thead);
        const body=document.createElement('tbody');
        rows.forEach((row,index)=>{
            const tr=document.createElement('tr');tr.className=row.className;
            const choice=document.createElement('td');choice.className='dungeon-choice-select';
            const circle=row.querySelector('.dungeon-radio-circle'),letter=row.querySelector('.dungeon-option-letter');
            choice.append(circle,letter);
            choice.onclick=event=>{if(!event.target.closest('.dungeon-radio-circle')) circle.click();};
            choice.tabIndex=0;choice.setAttribute('role','radio');choice.setAttribute('aria-label','Option '+letter.textContent.replace('.',''));
            choice.setAttribute('aria-checked',row.classList.contains('selected')?'true':'false');
            choice.onkeydown=event=>{if(event.key===' '||event.key==='Enter'){event.preventDefault();circle.click();}};
            tr.append(choice);
            const text=row.querySelector('.dungeon-radio-text');
            [...tables[index].rows[0].cells].forEach(cell=>{
                const td=document.createElement('td');td.className='dungeon-radio-text';td.innerHTML=cell.innerHTML;
                for(const attr of ['onclick','onmouseup']) if(text.hasAttribute(attr))td.setAttribute(attr,text.getAttribute(attr));
                tr.append(td);
            });body.append(tr);
        });
        table.append(body);wrapper.append(table);
        const headerWrapper=header.closest('.ml-table-scroll');
        if(headerWrapper)headerWrapper.remove();else header.remove();
        list.replaceChildren(wrapper);list.classList.add('has-choice-table');
    }

    handleSelectOption(optionId) {
        const q = this.state.questions[this.state.currentIndex];
        if (q.crossedOutOptionIds && q.crossedOutOptionIds.includes(String(optionId))) return; // Prevent selection if crossed out
        const answer = this.state.answers.get(q.id);

        const retryAmboss=q.contentFormat==='medos-html'&&q.source?.bank?.startsWith('amboss')&&!answer?.isCorrect&&!q.revealed&&!this.state.isBlockRevealed;
        if(retryAmboss&&answer?.submitted&&String(answer.selectedId)===String(optionId))return;
        if (answer && answer.submitted && q._tutorMode !== false && !retryAmboss) return;

        if(q.contentFormat==='medos-html' && q.source?.bank?.startsWith('amboss') && q._tutorMode!==false && !q.revealed) {
            q.ambossAttemptedOptionIds||=[];
            if(answer?.submitted&&!q.ambossAttemptedOptionIds.includes(String(answer.selectedId)))q.ambossAttemptedOptionIds.push(String(answer.selectedId));
            if(!q.ambossAttemptedOptionIds.includes(String(optionId)))q.ambossAttemptedOptionIds.push(String(optionId));
            this.state.selectedOption=optionId;
            q._ambossAnimateAnswer=true;
            this.handleSubmit();
            return;
        }

        this.pushHistoryState();

        if (this.state.selectedOption === optionId) {
            this.state.selectedOption = null;
        } else {
            this.state.selectedOption = optionId;
            // Exam Mode Persistence: Silently record the choice — timer keeps running
            if (q._tutorMode === false) {
                const selectedOpt = q.options?.find(o => String(o.id) === String(this.state.selectedOption));
                const isCorrect = selectedOpt?.isCorrect || false;
                const answerData = {
                    submitted: true,
                    selectedId: this.state.selectedOption,
                    isCorrect,
                    timerStopped: false, // Don't stop timer on silent click
                    examCommitted: true
                };
                this.state.answers.set(q.id, answerData);
                q.submittedAnswer = answerData;
                this.renderSidebar();
            }
        }
        this.renderQuestion();
    }

    handleStrikeOption(e, el) {
        if (this.state.highlightMode) {
            if (window.getSelection().toString().length > 0) return;
        }

        const optionId = el.closest('.dungeon-radio-option').querySelector('.dungeon-radio-circle').getAttribute('onclick').match(/'([^']+)'/)[1];
        const q = this.state.questions[this.state.currentIndex];

        // Initialize if missing
        if (!q.crossedOutOptionIds) q.crossedOutOptionIds = [];

        this.pushHistoryState();

        const idx = q.crossedOutOptionIds.indexOf(optionId);
        if (idx !== -1) {
            q.crossedOutOptionIds.splice(idx, 1);
        } else {
            q.crossedOutOptionIds.push(optionId);
            // If this was selected, deselect it
            if (this.state.selectedOption === optionId) this.state.selectedOption = null;
        }

        // Persist
        this.updateSaveStatus('unsaved');
        this.saveQuestionsToBackend();

        this.renderQuestion();
    }

    showNotification(msg, type = 'info') {
        const saveStatus = document.getElementById('dungeonSaveStatus');
        const footerRight = saveStatus ? saveStatus.closest('.dungeon-footer-right') : null;
        
        // Check for existing notification
        let notif = document.getElementById('dungeonNotification');
        
        if (!notif) {
            notif = document.createElement('div');
            notif.id = 'dungeonNotification';
            notif.className = 'dungeon-notification';
        }

        // Reset any inline styles that might have been set in fallback mode
        notif.style.position = '';
        notif.style.bottom = '';
        notif.style.right = '';

        // Always ensure it's in the correct container
        if (footerRight && saveStatus) {
            if (notif.parentElement !== footerRight) {
                footerRight.insertBefore(notif, saveStatus);
            }
        } else {
            // Fallback fixed position if dungeon is closed/template missing
            document.body.appendChild(notif);
            notif.style.position = 'fixed';
            notif.style.bottom = '20px';
            notif.style.right = '20px';
            notif.style.zIndex = '99999';
        }

        notif.textContent = msg;

        // Apply type class
        notif.classList.remove('success', 'error', 'info');
        if (type !== 'info') notif.classList.add(type);

        // Trigger reflow for animation
        notif.classList.remove('show');
        void notif.offsetWidth;
        notif.classList.add('show');

        // Auto hide
        if (this._notifTimeout) clearTimeout(this._notifTimeout);
        this._notifTimeout = setTimeout(() => {
            notif.classList.remove('show');
        }, 3000);
    }

    async handleSubmit() {
        const q = this.state.questions[this.state.currentIndex];
        if (!this.state.selectedOption) {
            this.showNotification("Please choose an option first");
            return;
        }

        const selectedOpt = q.options.find(o => String(o.id) === String(this.state.selectedOption));
        const isCorrect = selectedOpt && selectedOpt.isCorrect;
        
        // Detect if this is a re-submission
        const previousAnswer = q.submittedAnswer;
        const isNewSubmission = !previousAnswer;

        this.pushHistoryState();

        const answerData = {
            submitted: true,
            selectedId: this.state.selectedOption,
            isCorrect: isCorrect,
            timerStopped: true, // Stop timer on manual submit
            lastSubmittedId: this.state.selectedOption // Record what was manually submitted
        };

        this.state.answers.set(q.id, answerData);

        // Persist to question object
        q.submittedAnswer = answerData;

        const timeSpent = this.timerStart ? Math.floor((Date.now() - this.timerStart) / 1000) : 0;

        // Calculate transition for stats
        let changeType = null;
        let adjustment = null;

        if (!isNewSubmission) {
            if (previousAnswer.isCorrect && !isCorrect) {
                changeType = 'C2I';
                adjustment = { correct: -1, incorrect: 1 };
            } else if (!previousAnswer.isCorrect && isCorrect) {
                changeType = 'I2C';
                adjustment = { correct: 1, incorrect: -1 };
            } else if (!previousAnswer.isCorrect && !isCorrect) {
                 changeType = 'I2I';
                 // incorrect count stays same, but we track the change
            }
        }

        // Sync with global stats
        if (q.contentFormat === 'medos-html' && changeType && previousAnswer.selectedId !== answerData.selectedId) {
            q.answerChanges ||= {};
            q.answerChanges[changeType] = (q.answerChanges[changeType] || 0) + 1;
        }
        if (q.contentFormat !== 'medos-html') window.fileSystemService.makeRequest('/stats', {
            method: 'POST',
            body: JSON.stringify({ 
                type: isCorrect ? 'correct' : 'incorrect',
                timeSpent: timeSpent,
                isNewSubmission: isNewSubmission,
                changeType: changeType,
                adjustment: adjustment
            })
        }).catch(err => console.error("Failed to sync stats:", err));

        this.updateSaveStatus('unsaved');
        // Stop timer for Tutor mode (always) OR for 'up' mode in Exam mode
        if (q._tutorMode !== false || q._timerMode === 'up') {
            this.stopTimer();
        }
        this.saveQuestionsToBackend();
        
        this.render(); // Update sidebar and content
    }

    async toggleReveal() {
        const q = this.state.questions[this.state.currentIndex];
        if (!q) return;

        const revealBtn = document.getElementById('dungeonRevealBtn');
        const answer = this.state.answers.get(q.id);

        // If already submitted, don't allow reveal toggle
        if (answer && answer.submitted && !(q.contentFormat==='medos-html'&&q.source?.bank?.startsWith('amboss')&&!answer.isCorrect&&!q.revealed)) return;

        // Toggle reveal state
        const wasRevealed = q.revealed;
        q.revealed = !q.revealed;

        // If newly revealed and not already answered, count as omitted
        if (q.revealed && !wasRevealed && !answer?.submitted && q.contentFormat!=='medos-html') {
            window.fileSystemService.makeRequest('/stats', {
                method: 'POST',
                body: JSON.stringify({ 
                    type: 'omitted',
                    timeSpent: Math.floor((Date.now() - (this.timerStart || Date.now())) / 1000)
                })
            }).catch(err => console.error("Failed to sync omitted stat:", err));
        }

        // Update button visual state
        if (revealBtn) {
            const cross = revealBtn.querySelector('.reveal-cross');
            if (q.revealed) {
                // Show crossed bulb when revealed
                revealBtn.classList.add('active');
                if (cross) cross.style.display = 'block';
                revealBtn.title = 'Hide Answer';
            } else {
                // Show normal bulb when hidden
                revealBtn.classList.remove('active');
                if (cross) cross.style.display = 'none';
                revealBtn.title = 'Reveal Answer';

                // If question was answered, reset it when hiding
                if (answer && answer.submitted) {
                    this.state.answers.delete(q.id);
                    this.state.selectedOption = null;

                    // Clear any highlights
                    if (q.text && q.text.includes('<span class="highlight">')) {
                        q.text = q.text.replace(/<span class="highlight">(.*?)<\/span>/g, '$1');
                    }

                }
            }
        }

        // Save revealed state changes to backend
        this.updateSaveStatus('unsaved');
        this.saveQuestionsToBackend();

        // Re-render to show/hide the answer and update sidebar
        this.renderQuestion();
        this.renderSidebar();
        
        // Stop timer when revealing
        if (q.revealed) {
            this.stopTimer();
        }
    }

    jumpToQuestion(index) {
        if (index >= 0 && index < this.state.questions.length) {
            if(!this.bauCanNavigate(index))return;
            this.stopTimer();
            this.state.currentIndex = index;
            this.state.selectedOption = null;
            this.render();
            // Ensure we are in view
            if (this.el.main) this.el.main.scrollTop = 0;
        }
    }

    navNext() {
        if (this.state.currentIndex < this.state.questions.length - 1) {
            this.stopTimer();
            this.state.currentIndex++;
            this.state.selectedOption = null;
            this.questionStartTime = 0; // Reset question start time for hiding logic
            this.render();
        }
    }

    navPrev() {
        if (!this.bauCanNavigate(this.state.currentIndex-1)) return;
        if (this.state.currentIndex > 0) {
            this.stopTimer();
            this.state.currentIndex--;
            this.state.selectedOption = null;
            this.questionStartTime = 0; // Reset question start time for hiding logic
            this.render();
        }
    }

    toggleSplitView() {
        this.state.splitView = !this.state.splitView;
        const wrapper = document.getElementById('dungeonScrollWrapper');
        const mainPanel = document.getElementById('dungeonMainPanel');
        const resizer = document.getElementById('dungeonSplitResizer');
        const expPanel = document.getElementById('dungeonExplanationPanel');
        const toggleBtn = document.getElementById('dungeonSplitViewToggle');

        if (this.state.splitView) {
            resizer.classList.remove('hidden');
            expPanel.classList.remove('hidden');
            mainPanel.classList.remove('full-width');
            if (toggleBtn) {
                toggleBtn.classList.add('active');
                const span = toggleBtn.querySelector('span');
                if (span) span.textContent = "Hide Split View";
            }
        } else {
            resizer.classList.add('hidden');
            expPanel.classList.add('hidden');
            mainPanel.classList.add('full-width');
            if (toggleBtn) {
                toggleBtn.classList.remove('active');
                const span = toggleBtn.querySelector('span');
                if (span) span.textContent = "Show Split View";
            }
        }
        
        // Always scroll main panel to top on change
        if (mainPanel) mainPanel.scrollTop = 0;
        
        // Re-render question to correctly move explanation DOM
        this.renderQuestion();
    }

    initSplitResizer() {
        const resizer = document.getElementById('dungeonSplitResizer');
        const wrapper = document.getElementById('dungeonScrollWrapper');
        const expPanel = document.getElementById('dungeonExplanationPanel');
        if (!resizer || !wrapper || !expPanel) return;

        let isResizing = false;

        const startResize = () => {
            isResizing = true;
            resizer.classList.add('active');
            document.body.style.cursor = 'col-resize';
        };

        const doResize = (clientX) => {
            if (!isResizing) return;
            const wrapperRect = wrapper.getBoundingClientRect();
            const offsetRight = wrapperRect.right - clientX;
            const percentage = (offsetRight / wrapperRect.width) * 100;
            if (percentage >= 20 && percentage <= 70) {
                expPanel.style.width = `${percentage}%`;
            }
        };

        const stopResize = () => {
            if (isResizing) {
                isResizing = false;
                resizer.classList.remove('active');
                document.body.style.cursor = '';
            }
        };

        // Mouse events
        resizer.addEventListener('mousedown', (e) => {
            startResize();
            e.preventDefault();
        });
        document.addEventListener('mousemove', (e) => doResize(e.clientX));
        document.addEventListener('mouseup', stopResize);

        // Touch events (iPad / touchscreen)
        resizer.addEventListener('touchstart', (e) => {
            startResize();
            e.preventDefault();
        }, { passive: false });

        document.addEventListener('touchmove', (e) => {
            if (!isResizing) return;
            doResize(e.touches[0].clientX);
            e.preventDefault();
        }, { passive: false });

        document.addEventListener('touchend', stopResize);
        document.addEventListener('touchcancel', stopResize);
    }

    initImageViewer() {
        const viewer = document.getElementById('dungeonImageViewer');
        const img = document.getElementById('viewerImage');
        const content = document.getElementById('viewerContent');
        const closeBtn = document.getElementById('closeViewerBtn');
        
        if (!viewer || !img || !content) return;

        // Toolbar Buttons
        const zoomIn = document.getElementById('zoomInBtn');
        const zoomOut = document.getElementById('zoomOutBtn');
        const rotateLeft = document.getElementById('rotateLeftBtn');
        const rotateRight = document.getElementById('rotateRightBtn');
        const invert = document.getElementById('invertBtn');
        const flipH = document.getElementById('flipHBtn');
        const reset = document.getElementById('resetViewerBtn');

        // Close logic
        const closeViewer = () => {
            viewer.classList.remove('visible');
            document.removeEventListener('keydown', handleEsc);
        };
        const handleEsc = (e) => { if (e.key === 'Escape') closeViewer(); };

        closeBtn.onclick = closeViewer;
        viewer.onclick = (e) => { if (e.target === viewer) closeViewer(); };

        let rafPending = false;
        const requestUpdate = () => {
            if (rafPending) return;
            rafPending = true;
            requestAnimationFrame(() => {
                this.updateViewerTransform();
                rafPending = false;
            });
        };

        // Zoom Logic
        const applyZoom = (delta, e) => {
            const oldZoom = this.state.viewer.zoom;
            // Slightly smaller factor for smoother control, but fast
            const factor = delta > 0 ? 1.08 : 0.92; 
            this.state.viewer.zoom = Math.min(Math.max(oldZoom * factor, 0.1), 10);
            
            if (e && this._imgRect) {
                const mouseX = e.clientX - this._imgRect.left;
                const mouseY = e.clientY - this._imgRect.top;
                
                const relX = (mouseX / this._imgRect.width) - 0.5;
                const relY = (mouseY / this._imgRect.height) - 0.5;
                
                this.state.viewer.x -= relX * this._imgRect.width * (factor - 1);
                this.state.viewer.y -= relY * this._imgRect.height * (factor - 1);
            }
            
            requestUpdate();
        };

        content.onwheel = (e) => {
            if (viewer.classList.contains('showing-exhibit')) return;
            e.preventDefault();
            applyZoom(-e.deltaY, e);
        };

        if (zoomIn) zoomIn.onclick = () => applyZoom(1);
        if (zoomOut) zoomOut.onclick = () => applyZoom(-1);

        // Pan Logic
        content.onmousedown = (e) => {
            if (viewer.classList.contains('showing-exhibit')) return;
            if (e.button !== 0) return;
            this.state.viewer.isDragging = true;
            this.state.viewer.startX = e.clientX - this.state.viewer.x;
            this.state.viewer.startY = e.clientY - this.state.viewer.y;
            e.preventDefault();
        };

        window.addEventListener('mousemove', (e) => {
            if (!this.state.viewer.isDragging) return;
            this.state.viewer.x = e.clientX - this.state.viewer.startX;
            this.state.viewer.y = e.clientY - this.state.viewer.startY;
            requestUpdate();
        });

        window.addEventListener('mouseup', () => {
            this.state.viewer.isDragging = false;
        });

        // Rotate & Tools
        if (rotateLeft) rotateLeft.onclick = () => {
            this.state.viewer.rotation -= 90;
            this.updateViewerTransform();
        };
        if (rotateRight) rotateRight.onclick = () => {
            this.state.viewer.rotation += 90;
            this.updateViewerTransform();
        };
        if (invert) invert.onclick = () => {
            this.state.viewer.inverted = !this.state.viewer.inverted;
            invert.classList.toggle('active', this.state.viewer.inverted);
            this.updateViewerTransform();
        };
        if (flipH) flipH.onclick = () => {
            this.state.viewer.flipped = !this.state.viewer.flipped;
            flipH.classList.toggle('active', this.state.viewer.flipped);
            this.updateViewerTransform();
        };
        if (reset) reset.onclick = () => this.resetViewer();
    }

    initViewerWindow(viewer) {
        if (viewer.dataset.windowReady) return;
        viewer.dataset.windowReady = 'true';
        viewer.setAttribute('role', 'dialog');
        viewer.setAttribute('aria-label', 'Figure viewer');
        const header = viewer.querySelector('.viewer-header');
        if (!header) return;
        const fit = document.createElement('button');
        fit.type = 'button'; fit.className = 'viewer-fit-btn';
        fit.title = 'Fit window'; fit.setAttribute('aria-label', 'Fit window');
        fit.textContent = '↗';
        header.insertBefore(fit, header.querySelector('.viewer-close-btn'));
        const fitWindow = () => {
            viewer.classList.remove('maximized');
            const bounds = viewer.parentElement.getBoundingClientRect();
            const table=viewer.querySelector('.viewer-exhibit table');
            const width = Math.min(table ? Math.max(360,table.scrollWidth+64) : 860, bounds.width - 32);
            const height = Math.min(table ? Math.max(280,table.scrollHeight+112) : 650, bounds.height - 48);
            Object.assign(viewer.style, {width:width+'px', height:height+'px', left:Math.max(0,(bounds.width-width)/2)+'px', top:Math.max(0,(bounds.height-height)/2)+'px'});
        };
        fit.onclick = fitWindow;
        this._viewerFit=fitWindow;
        const controls = document.createElement('div'); controls.className='viewer-window-controls';
        header.insertBefore(controls,fit); controls.append(fit);
        const close = header.querySelector('.viewer-close-btn');
        const minimize = document.createElement('button'), maximize = document.createElement('button');
        minimize.type=maximize.type='button';
        minimize.className=maximize.className='viewer-fit-btn';
        minimize.textContent='—'; minimize.title='Minimize'; minimize.setAttribute('aria-label','Minimize');
        maximize.textContent='❐'; maximize.title='Maximize / restore'; maximize.setAttribute('aria-label','Maximize or restore');
        controls.append(minimize,maximize); if(close) controls.append(close);
        const dock = document.createElement('button'); dock.type='button'; dock.className='viewer-minimized-dock'; dock.hidden=true;
        viewer.parentElement.append(dock); this._viewerDock=dock;
        dock.onclick=()=>{dock.hidden=true;viewer.classList.add('visible');};
        minimize.onclick=()=>{dock.textContent=viewer.querySelector('.viewer-title')?.textContent || 'Figure viewer';dock.hidden=false;viewer.classList.remove('visible');};
        let restoredBounds;
        maximize.onclick=()=>{
            if(viewer.classList.contains('maximized')) {
                viewer.classList.remove('maximized'); Object.assign(viewer.style,restoredBounds);
            } else {
                restoredBounds={left:viewer.style.left,top:viewer.style.top,width:viewer.style.width,height:viewer.style.height};
                const bounds=viewer.parentElement.getBoundingClientRect();
                Object.assign(viewer.style,{left:'12px',top:'12px',width:Math.max(0,bounds.width-24)+'px',height:Math.max(0,bounds.height-24)+'px'});
                viewer.classList.add('maximized');
            }
        };
        header.ondblclick = event => { if (!event.target.closest('button')) maximize.click(); };
        header.addEventListener('pointerdown', event => {
            if (event.button !== 0 || event.target.closest('button') || viewer.classList.contains('maximized')) return;
            event.preventDefault();
            const start = viewer.getBoundingClientRect(), bounds = viewer.parentElement.getBoundingClientRect();
            const x = event.clientX, y = event.clientY;
            header.setPointerCapture(event.pointerId);
            const move = next => {
                viewer.style.left = Math.max(0, Math.min(bounds.width-start.width, start.left-bounds.left+next.clientX-x))+'px';
                viewer.style.top = Math.max(0, Math.min(bounds.height-start.height, start.top-bounds.top+next.clientY-y))+'px';
            };
            const end = () => { header.removeEventListener('pointermove',move); header.removeEventListener('pointerup',end); header.removeEventListener('pointercancel',end); };
            header.addEventListener('pointermove',move); header.addEventListener('pointerup',end); header.addEventListener('pointercancel',end);
        });
        const resize = document.createElement('div'); resize.className = 'viewer-resize-handle';
        resize.title = 'Drag to resize'; viewer.append(resize);
        resize.addEventListener('pointerdown', event => {
            event.preventDefault(); event.stopPropagation();
            const start = viewer.getBoundingClientRect(), bounds = viewer.parentElement.getBoundingClientRect();
            resize.setPointerCapture(event.pointerId);
            const move = next => {
                const availableWidth = bounds.right-start.left, availableHeight = bounds.bottom-start.top;
                viewer.style.width = Math.min(availableWidth, Math.max(Math.min(320,availableWidth),start.width+next.clientX-event.clientX))+'px';
                viewer.style.height = Math.min(availableHeight, Math.max(Math.min(240,availableHeight),start.height+next.clientY-event.clientY))+'px';
            };
            const end = () => { resize.removeEventListener('pointermove',move); resize.removeEventListener('pointerup',end); resize.removeEventListener('pointercancel',end); };
            resize.addEventListener('pointermove',move); resize.addEventListener('pointerup',end); resize.addEventListener('pointercancel',end);
        });
        window.addEventListener('resize', () => { if (viewer.classList.contains('visible')) fitWindow(); });
        fitWindow();
    }

    setupAmbossMediaViewer(viewer,src) {
        const q=this.state.questions[this.state.currentIndex];
        let nav=viewer.querySelector('.qa-media-nav');
        if(!nav){nav=document.createElement('nav');nav.className='qa-media-nav';nav.setAttribute('aria-label','Media viewer');nav.innerHTML='<button type="button" class="qa-media-caption" aria-label="Description" title="Description"><svg width="16" height="16" fill="none" viewBox="0 0 16 16" aria-hidden="true"><path fill="currentColor" fill-rule="evenodd" d="M1 4a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H4a3 3 0 0 1-3-3zm3-1a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1z" clip-rule="evenodd"/><path fill="currentColor" fill-rule="evenodd" d="M4 8a1 1 0 0 1 1-1h6a1 1 0 1 1 0 2H5a1 1 0 0 1-1-1m0 3a1 1 0 0 1 1-1h4a1 1 0 1 1 0 2H5a1 1 0 0 1-1-1" clip-rule="evenodd"/></svg></button><span></span><button type="button" class="qa-media-bookmark" aria-label="Bookmark figure"><svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="m13 14-5-3.333L3 14V3.333C3 2.597 3.64 2 4.429 2h7.142C12.361 2 13 2.597 13 3.333z"/></svg></button><button type="button" class="qa-media-zoom" aria-label="Zoom in"><svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="7" cy="7" r="5"/><path d="m11 11 4 4M4 7h6M7 4v6"/></svg></button><button type="button" class="qa-media-close" aria-label="Close viewer"><svg width="16" height="16" viewBox="0 0 16 16" stroke="currentColor" stroke-width="2"><path d="m3 3 10 10M13 3 3 13"/></svg></button>';viewer.append(nav);}
        viewer.classList.add('qa-media-full');
        viewer.classList.remove('qa-media-docked');
        this.el.container.classList.remove('qa-media-open');
        if(!nav.querySelector('.qa-media-mode')){
            const mode=document.createElement('button');mode.type='button';mode.className='qa-media-mode';mode.innerHTML='<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M1 6h5V1M6 6 1 1M15 10h-5v5M10 10l5 5"/></svg>';nav.querySelector('.qa-media-close').before(mode);
            const close=document.createElement('button');close.type='button';close.className='qa-media-footer-close';close.innerHTML='<span aria-hidden="true">×</span> Close';viewer.append(close);
        }
        const closeMedia=()=>{viewer.classList.remove('visible');this.updateToolbarPush();};
        const mode=nav.querySelector('.qa-media-mode');
        const updateMode=()=>mode.setAttribute('aria-label',viewer.classList.contains('qa-media-docked')?'Expand media viewer':'Minimize media viewer');updateMode();
        mode.onclick=()=>{const docked=viewer.classList.toggle('qa-media-docked');viewer.classList.toggle('qa-media-full',!docked);if(docked){document.getElementById('dungeonLabSidebar')?.classList.remove('active');document.getElementById('dungeonLabBtn')?.classList.remove('active');}this.resetViewer();updateMode();this.updateToolbarPush();};
        viewer.querySelector('.qa-media-footer-close').onclick=closeMedia;
        if(!viewer.querySelector('.qa-media-resizer')) {
            const grip=document.createElement('div');grip.className='qa-media-resizer';grip.setAttribute('role','separator');grip.setAttribute('aria-label','Resize image panel');grip.setAttribute('aria-orientation','vertical');viewer.append(grip);
            grip.onmousedown=event=>{
                event.preventDefault();event.stopPropagation();
                this.el.container.classList.add('qa-lab-resizing');
                const move=event=>{
                    const scale=viewer.getBoundingClientRect().width/viewer.offsetWidth || 1;
                    const sidebar=this.state.sidebarCollapsed?56:parseInt(getComputedStyle(this.el.container).getPropertyValue('--qa-sidebar-width'))||320;
                    const width=Math.max(310,Math.min((window.innerWidth-event.clientX)/scale,Math.max(310,window.innerWidth/scale-sidebar-320)));
                    this.el.container.style.setProperty('--qa-lab-panel-width',width+'px');
                    this.updateToolbarPush();
                };
                const end=()=>{document.removeEventListener('mousemove',move);document.removeEventListener('mouseup',end);this.el.container.classList.remove('qa-lab-resizing');localStorage.setItem('dungeonLabWidth',parseInt(getComputedStyle(viewer).width));};
                document.addEventListener('mousemove',move);document.addEventListener('mouseup',end);
            };
        }
        const image=[...this.el.main.querySelectorAll('img')].find(img=>img.src===src);
        const caption=image?.closest('figure')?.querySelector('figcaption')?.textContent||((image?.alt&&image.alt!=='Question illustration')?image.alt:'');
        const description=nav.querySelector('.qa-media-caption');description.hidden=!caption.trim();description.disabled=!caption.trim();description.setAttribute('aria-expanded','false');viewer.querySelector('.qa-media-description')?.remove();
        description.onclick=()=>{const old=viewer.querySelector('.qa-media-description');if(old){old.remove();description.setAttribute('aria-expanded','false');}else{const panel=document.createElement('div');panel.className='qa-media-description';panel.textContent=caption;viewer.append(panel);description.setAttribute('aria-expanded','true');}};
        const bookmark=nav.querySelector('.qa-media-bookmark');
        const update=()=>{const saved=Boolean(q.savedFigures?.some(figure=>figure.src===src));bookmark.setAttribute('aria-pressed',String(saved));bookmark.querySelector('svg').setAttribute('fill',saved?'currentColor':'none');};update();
        bookmark.onclick=()=>{q.savedFigures||=[];const index=q.savedFigures.findIndex(figure=>figure.src===src);if(index>=0)q.savedFigures.splice(index,1);else q.savedFigures.push({src,caption,bank:q.source?.bank,questionId:q.source?.questionId,savedAt:new Date().toISOString()});update();this.saveQuestionsToBackend();window.dispatchEvent(new CustomEvent('qbank-figure-bookmark',{detail:{questionId:q.id,figures:q.savedFigures}}));};
        nav.querySelector('.qa-media-zoom').onclick=()=>{this.state.viewer.zoom=Math.min(4,this.state.viewer.zoom+0.25);this.updateViewerTransform();};

        nav.querySelector('.qa-media-close').onclick=closeMedia;
    }

    openImageViewer(src, exhibitHtml = null) {
        const viewer = document.getElementById('dungeonImageViewer');
        const img = document.getElementById('viewerImage');
        if (!viewer || !img) return;
        const dungeon = document.querySelector('.dungeon-base');
        if (dungeon && viewer.parentElement !== dungeon) dungeon.append(viewer);
        this.initViewerWindow(viewer);
        if(this._viewerDock) this._viewerDock.hidden=true;
        this._exhibitRequestId = (this._exhibitRequestId || 0) + 1;
        const content = document.getElementById('viewerContent');
        content.querySelector('.viewer-exhibit')?.remove();
        content.querySelector('.ml-media-unavailable')?.remove();img.hidden=false;
        img.hidden = exhibitHtml !== null;
        viewer.classList.toggle('showing-exhibit', exhibitHtml !== null);
        if (exhibitHtml !== null) {
            img.removeAttribute('src');
            const exhibit = document.createElement('div');
            exhibit.className = 'viewer-exhibit';
            exhibit.innerHTML = exhibitHtml;
            content.append(exhibit);
        } else img.src = src;
        if(content.querySelector('table')&&!viewer.classList.contains('maximized')) this._viewerFit?.();
        const title = viewer.querySelector('.viewer-title');
        if (title) title.textContent = exhibitHtml !== null ? (content.querySelector('table') ? 'Table viewer' : 'Exhibit viewer') : 'Image viewer';
        let icon=viewer.querySelector('.viewer-window-icon');
        if(!icon && title) {icon=document.createElement('span');icon.className='viewer-window-icon';title.before(icon);}
        if(icon) icon.innerHTML=content.querySelector('table') ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18"/></svg>' : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8" cy="8" r="1.5"/><path d="m3 17 6-6 4 4 3-3 5 5"/></svg>';
        this.resetViewer();
        viewer.classList.remove('qa-media-full', 'qa-media-docked');
        if(dungeon?.classList.contains('amboss-dungeon')&&exhibitHtml===null)this.setupAmbossMediaViewer(viewer,src);
        viewer.classList.add('visible');
        this.updateToolbarPush();

        // Cache image rect after it might have rendered (short delay)
        setTimeout(() => {
            this._imgRect = img.getBoundingClientRect();
        }, 50);

        // Add Esc listener
        const handleEsc = (e) => {
            if (e.key === 'Escape') {
                viewer.classList.remove('visible');
                this.updateToolbarPush();
                document.removeEventListener('keydown', handleEsc);
            }
        };
        document.addEventListener('keydown', handleEsc);
    }

    resetViewer() {
        this.state.viewer = {
            zoom: 1,
            x: 0,
            y: 0,
            rotation: 0,
            inverted: false,
            flipped: false,
            isDragging: false,
            startX: 0,
            startY: 0
        };
        
        // Reset button states
        const invert = document.getElementById('invertBtn');
        const flipH = document.getElementById('flipHBtn');
        if (invert) invert.classList.remove('active');
        if (flipH) flipH.classList.remove('active');
        
        this.updateViewerTransform();
    }

    updateViewerTransform() {
        const img = document.getElementById('viewerImage');
        const zoomLevel = document.getElementById('zoomLevel');
        if (!img) return;

        const v = this.state.viewer;
        // Use translate3d exclusively and keep the transform string simple
        img.style.transform = `translate3d(${v.x}px, ${v.y}px, 0) scale3d(${v.zoom * (v.flipped ? -1 : 1)}, ${v.zoom}, 1) rotate(${v.rotation}deg)`;
        img.style.filter = v.inverted ? 'invert(1)' : '';
        
        if (zoomLevel) zoomLevel.innerText = `${Math.round(v.zoom * 100)}%`;
    }
}
