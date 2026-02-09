export default class DungeonBase {
  constructor() {
    this.el = {};
    this.state = {
      questions: [],
      currentIndex: 0,
      answers: new Map(), // id -> { isCorrect: boolean, selectedId: string, submitted: boolean }
      selectedOption: null, // Temporary selection before submit
      sidebarCollapsed: false,
      toolbarVisible: true,
      toolbarPosition: 'floating', // 'floating', 'top', 'bottom', 'left', 'right'
      unsavedChanges: false
    };
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
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                      <line x1="9" y1="3" x2="9" y2="21"></line>
                    </svg>
                  </button>
                  <div id="dungeonQuestionTitle" class="dungeon-question-title">Untitled Question</div>
                </div>
                <div class="dungeon-topbar-center">
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
                  <div class="dungeon-toolbar-menu-label">Visibility</div>
                  <button id="dungeonToolbarToggle" data-action="toggle">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                    <span>Toggle Toolbar</span>
                  </button>
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
                  <div class="dungeon-scroll-wrapper">
                      <div id="dungeonMainContent" class="dungeon-question-container"></div>
                  </div>
              </div>
              
              <!-- Footer (Bottom Header) -->
              <div id="dungeonFooter" class="dungeon-footer">
                  <div class="dungeon-footer-left">
                      <div class="dungeon-stat-item" title="Time Elapsed">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                          <span id="dungeonTimer" style="font-weight: 600; color: var(--text-muted); font-variant-numeric: tabular-nums;">00:00</span>
                      </div>
                  </div>
                  <div class="dungeon-footer-center">
                      <div class="dungeon-stat-item" title="Correct Answers">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
                          <span id="dungeonStatCorrect">0</span>
                      </div>
                      <div class="dungeon-stat-item" title="Question Progress">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                              <rect x="3" y="3" width="7" height="7"></rect>
                              <rect x="14" y="3" width="7" height="7"></rect>
                              <rect x="14" y="14" width="7" height="7"></rect>
                              <rect x="3" y="14" width="7" height="7"></rect>
                          </svg>
                          <span id="dungeonStatTotal">0/0</span>
                      </div>
                      <div class="dungeon-stat-item" title="Incorrect Answers">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                          <span id="dungeonStatWrong">0</span>
                      </div>
                  </div>
                  <div class="dungeon-footer-right">
                      <span id="dungeonSaveStatus" class="dungeon-save-status saved">Saved</span>
                      <button id="dungeonRevealBtn" class="dungeon-reveal-btn" title="Reveal Answer">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                              <path d="M9 18h6"></path>
                              <path d="M10 22h4"></path>
                              <path d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z"></path>
                          </svg>
                          <svg class="reveal-cross" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display: none; position: absolute;">
                              <line x1="4" y1="4" x2="20" y2="20"></line>
                          </svg>
                      </button>
                      <button id="dungeonClearBtn" class="dungeon-clear-btn" title="Clear Answer & Start Over" style="display: none;">
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
                      <div class="dungeon-loading-spinner"></div>
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
                    <div class="dungeon-tool-btn" data-tool="star" title="Star Question">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                    </div>
                    <div class="dungeon-tool-btn" data-tool="note" title="Add Note">
                         <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                    </div>
                    <div class="dungeon-tool-btn" data-tool="submit" title="Submit Answer">
                         <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    </div>
                    <div class="dungeon-tool-btn" data-tool="highlight" title="Highlight Mode">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 11-6 6v3h9l3-3z"></path><path d="m22 12-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4l3-3 3 3L24 10z"></path></svg>
                    </div>
                    <div class="dungeon-tool-btn" data-tool="clear" title="Clear Highlights">
                         <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21"></path><path d="M22 21H7"></path><path d="m5 11 9 9"></path></svg>
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
    this.initFooter();
    this.initCalculator();
    this.initSearch();

    this.bindEvents();
  }

  initFooter() {
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
              this.timerStart = Date.now();
              this.updateTimerDisplay(0);
          };
      }
      
      // Initialize Sub-components
      this.initLab();
      
      // Clear Answer Button
      const clearBtn = document.getElementById('dungeonClearBtn');
      if (clearBtn) {
          clearBtn.onclick = () => this.clearAnswer();
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
              } catch(e) {
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

      toolbar.addEventListener('mousedown', onMouseDown);

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
      if (btnPrev) btnPrev.onclick = () => this.navPrev();
      if (btnNext) btnNext.onclick = () => this.navNext();
      
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
      
      // Set initial highlight SVG based on orientation
      this.updateHighlightSVG(toolbar);
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
          const position = btn.dataset.topbarPosition;
          this.setTopbarButtonsPosition(position);
        };
      });
      
      // Theme Carousel Logic
      const themes = ['dark', 'light', 'classic'];
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
      this.updateToolbarVisibility();
    }


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
    this.updateToolbarVisibility();
    localStorage.setItem('dungeonToolbarVisible', this.state.toolbarVisible);
  }

  updateToolbarVisibility() {
    const toolbar = document.getElementById('dungeonToolbar');
    if (toolbar) {
      if (this.state.toolbarVisible) {
        toolbar.style.display = 'flex';
        // Trigger reflow for animation
        toolbar.offsetHeight;
        toolbar.classList.add('visible');
      } else {
        toolbar.classList.remove('visible');
        setTimeout(() => {
          toolbar.style.display = 'none';
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

    switch(position) {
      case 'top':
        toolbar.classList.add('docked-top');
        toolbar.style.top = topbarHeight + 'px';
        toolbar.style.left = '0'; // Start from left edge, above sidebar
        toolbar.style.right = '0';
        toolbar.style.cursor = 'default'; // Not draggable
        
        // Push sidebar down below toolbar
        if (sidebar) {
          sidebar.style.top = (topbarHeight + toolbarHeight) + 'px';
        }
        if (main) {
          main.classList.add('toolbar-docked-top');
          main.style.top = (topbarHeight + toolbarHeight) + 'px';
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
          sidebar.style.bottom = (toolbarHeight + footerHeight) + 'px';
        }
        if (main) {
          main.classList.add('toolbar-docked-bottom');
          main.style.bottom = (toolbarHeight + footerHeight) + 'px';
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
          const contentLeft = sidebarWidth + 50;
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
          } catch(e) {}
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
            } catch(e) {
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
    const saveStatusEl = document.getElementById('dungeonSaveStatus');
    if (!saveStatusEl) return;

    if (this.saveStatusTimeout) {
        clearTimeout(this.saveStatusTimeout);
        this.saveStatusTimeout = null;
    }

    // Ensure visible and layout-occupying when active
    saveStatusEl.style.display = 'inline-block';
    // Trigger reflow if needed for transition, but display:none->block breaks transition usually.
    // For smooth entry, we might accept instant appearance or simple opacity fade in.
    // Since transparency is 0 -> 1, it should fade in if display was already block.
    // If it was none, it appears instantly. That's usually fine.
    requestAnimationFrame(() => {
        saveStatusEl.style.opacity = '1';
    });
    
    saveStatusEl.className = 'dungeon-save-status ' + status;
    
    switch(status) {
      case 'saving':
        saveStatusEl.textContent = 'Saving...';
        break;
      case 'unsaved':
        saveStatusEl.textContent = 'Unsaved';
        this.state.unsavedChanges = true;
        break;
      case 'saved':
      default:
        saveStatusEl.textContent = 'Saved';
        this.state.unsavedChanges = false;
        this.saveStatusTimeout = setTimeout(() => {
            saveStatusEl.style.opacity = '0';
            // Wait for transition to finish (300ms) before hiding layout
            setTimeout(() => {
                if (saveStatusEl.style.opacity === '0') { // Check if still hidden
                    saveStatusEl.style.display = 'none';
                }
            }, 300);
        }, 2000);
        break;
    }
  }

  updateQuestionTitle() {
    const q = this.state.questions[this.state.currentIndex];
    const titleEl = document.getElementById('dungeonQuestionTitle');
    if (titleEl && q) {
      titleEl.textContent = q.title || 'Untitled Question';
    }
  }

  setFontSize(size) {
    const container = document.getElementById('dungeonMainContent');
    if (!container) return;

    // Remove all font size classes
    container.classList.remove('font-small', 'font-medium', 'font-large');
    
    // Add the selected font size class
    container.classList.add(`font-${size}`);
    
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
              document.addEventListener('mousemove', onResize);
              document.addEventListener('mouseup', stopResize);
              sidebar.style.transition = 'none';
          };
          
          const onResize = (e) => {
              let newWidth = window.innerWidth - e.clientX;
              newWidth = Math.max(310, Math.min(newWidth, 550));
              sidebar.style.width = `${newWidth}px`;
              this.updateToolbarPush();
          };
          
          const stopResize = () => {
              document.removeEventListener('mousemove', onResize);
              document.removeEventListener('mouseup', stopResize);
              sidebar.style.transition = '';
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
            
            if(isActive) {
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
    document.body.classList.remove('theme-light', 'theme-classic');
    
    if (theme === 'light') {
        document.body.classList.add('theme-light');
    } else if (theme === 'classic') {
        document.body.classList.add('theme-classic');
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
            
        } catch(e) {
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
      q.starred = !q.starred;
      // remove legacy isStarred if present to avoid confusion
      delete q.isStarred;
      
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
      this.updateSaveStatus('saved');
  }

  handleHighlight(e, type, id) {
      if (!this.state.highlightMode) return;
      
      // Stop highlighting for options entirely (Crossing out is enough)
      if (type === 'option') return;
      
      const q = this.state.questions[this.state.currentIndex];
      const selection = window.getSelection();
      
      // 1. Un-Highlight (Clicking existing highlight)
      if (selection.toString().length === 0) {
          if (e.target.classList.contains('highlight')) {
              const content = e.target.textContent;
              const parent = e.target.parentNode;
              // replace span with text node
              const textNode = document.createTextNode(content);
              parent.replaceChild(textNode, e.target);
              parent.normalize(); // merge text nodes
              
              // Persist Removal
              if (type === 'main') {
                  q.text = e.currentTarget.innerHTML;
              }
              
              this.updateSaveStatus('unsaved');
              this.saveQuestionsToBackend();
          }
          return;
      }

      // 2. Add Highlight (Selection)
      if (selection.toString().length > 0) {
          const range = selection.getRangeAt(0);
          
          // Ensure we are selecting inside the context box
          if (!e.currentTarget.contains(range.commonAncestorContainer)) return;

          const span = document.createElement("span");
          span.className = "highlight";
          try {
              range.surroundContents(span);
              
              // Copy Logic: Keep selection on the new span so Ctrl+C works immediately
              selection.removeAllRanges();
              const newRange = document.createRange();
              newRange.selectNodeContents(span);
              selection.addRange(newRange);
              
              // Persist Addition
              if (type === 'main') {
                  q.text = e.currentTarget.innerHTML;
              }
              
              this.updateSaveStatus('unsaved');
              this.saveQuestionsToBackend();
          } catch(err) {
              console.warn("Highlight failed (crossing tags?)", err);
          }
      }
  }

  saveQuestionsToBackend() {
      // Placeholder for persistence
      this.updateSaveStatus('saving');
      
      // 1. Persist via QuestionBase (Best for FileSystem sync)
      if (window.QuestionBase && window.QuestionBase.state) {
          // Sync current question back to QuestionBase state
          const currentQ = this.state.questions[this.state.currentIndex];
          const qBaseIndex = window.QuestionBase.state.questions.findIndex(item => item.id === currentQ.id);
          
          if (qBaseIndex !== -1) {
               // Update the specific question in the master list
               window.QuestionBase.state.questions[qBaseIndex] = currentQ;
               window.QuestionBase.saveData(); // Triggers JSON file write
          }
      }

      // 2. Fallback / Electron API direct call
      if (window.electronAPI && window.electronAPI.saveQuestions) {
          window.electronAPI.saveQuestions(JSON.parse(JSON.stringify(this.state.questions))); 
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
  }

  addNote() {
      const q = this.state.questions[this.state.currentIndex];
      if (!q) return;
      
      const note = prompt("Add a note for this question:", q.note || "");
      if (note !== null) {
          q.note = note;
          this.updateSaveStatus('unsaved');
          this.saveQuestionsToBackend();
      }
  }

  toggleReveal() {
      const q = this.state.questions[this.state.currentIndex];
      const answer = this.state.answers.get(q.id);
      
      // If already submitted, don't allow reveal toggle
      if (answer && answer.submitted) return;
      
      // Toggle revealed state
      q.revealed = !q.revealed;
      
      // Persist
      this.updateSaveStatus('unsaved');
      this.saveQuestionsToBackend();
      
      // Re-render to show/hide answer
      this.renderQuestion();
      
      // Update reveal button state
      this.updateRevealButton();
      
      // Stop timer when revealing
      if (q.revealed) {
          this.stopTimer();
      }
  }

  startTimer() {
      this.stopTimer(); // Clear existing
      const q = this.state.questions[this.state.currentIndex];
      const timerEl = document.getElementById('dungeonTimer');
      if (!timerEl) return;
      
      // If question has been answered, display saved timer but don't run
      if (q && q.submittedAnswer && q.timerElapsed !== undefined) {
          this.updateTimerDisplay(q.timerElapsed);
          return; // Don't start interval for answered questions
      }
      
      // Start fresh timer for unanswered questions
      this.timerStart = Date.now();
      this.updateTimerDisplay(0);
      
      this.timerInterval = setInterval(() => {
          const elapsed = Date.now() - this.timerStart;
          this.updateTimerDisplay(elapsed);
      }, 1000);
  }

  stopTimer() {
      if (this.timerInterval) {
          clearInterval(this.timerInterval);
          this.timerInterval = null;
      }
  }

  updateTimerDisplay(ms) {
      const timerEl = document.getElementById('dungeonTimer');
      if (!timerEl) return;
      
      const totalSeconds = Math.floor(ms / 1000);
      const m = Math.floor(totalSeconds / 60);
      const s = totalSeconds % 60;
      timerEl.textContent = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  updateFooterStats() {
      // Calculate stats
      let correct = 0;
      let wrong = 0;
      
      this.state.answers.forEach(a => {
          if (a.submitted) {
              if (a.isCorrect) correct++;
              else wrong++;
          }
      });
      
      const correctEl = document.getElementById('dungeonStatCorrect');
      const wrongEl = document.getElementById('dungeonStatWrong');
      const totalEl = document.getElementById('dungeonStatTotal');
      
      if (correctEl) correctEl.textContent = correct;
      if (wrongEl) wrongEl.textContent = wrong;
      if (totalEl) {
          const currentQuestion = this.state.currentIndex + 1;
          const totalQuestions = this.state.questions.length;
          totalEl.textContent = `${currentQuestion}/${totalQuestions}`;
      }
  }
  
  clearAnswer() {
      const q = this.state.questions[this.state.currentIndex];
      const answer = this.state.answers.get(q.id);
      
      // Only allow clearing if answered
      if (!answer || !answer.submitted) return;
      
      // Remove from runtime state
      this.state.answers.delete(q.id);
      
      // Remove from question object
      delete q.submittedAnswer;
      
      // Reset timer
      delete q.timerElapsed;
      
      // Clear revealed state too
      if (q.revealed) {
          q.revealed = false;
      }
      
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
      const answer = this.state.answers.get(q.id);
      const revealBtn = document.getElementById('dungeonRevealBtn');
      const clearBtn = document.getElementById('dungeonClearBtn');
      
      if (!revealBtn) return;
      
      // Show/hide clear button based on answer state
      if (clearBtn) {
          if (answer && answer.submitted) {
              clearBtn.style.display = 'inline-flex';
          } else {
              clearBtn.style.display = 'none';
          }
      }
      
      // If submitted, disable reveal button
      if (answer && answer.submitted) {
          revealBtn.style.opacity = '0.3';
          revealBtn.style.pointerEvents = 'none';
          revealBtn.classList.remove('active');
          return;
      }
      
      // Enable button
      revealBtn.style.opacity = '1';
      revealBtn.style.pointerEvents = 'auto';
      
      // Toggle active state based on revealed
      if (q.revealed) {
          revealBtn.classList.add('active');
      } else {
          revealBtn.classList.remove('active');
      }
  }
  
  clearHighlights() {
      const q = this.state.questions[this.state.currentIndex];
      if (!q) return;
      
      let changed = false;

      // 1. Remove all highlight spans from the main text
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
                  if (newWidth >= 50 && newWidth <= 300) {
                      this.el.sidebar.style.width = newWidth + 'px';
                      
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
    if (closeBtn) closeBtn.onclick = () => this.close();

    // Keyboard nav
    document.addEventListener("keydown", (e) => {
      if (this.el.container.classList.contains("hidden")) return;
      
      const searchWrapper = document.getElementById('dungeonSearchWrapper');
      const calculator = document.getElementById('dungeonCalculator');
      const isSearchActive = searchWrapper && searchWrapper.classList.contains('active');
      const isCalcActive = calculator && !calculator.classList.contains('hidden');

      if (e.key === "ArrowRight") this.navNext();
      if (e.key === "ArrowLeft") this.navPrev();
      if (e.key === "Escape") this.close();
      
      // Enter to Submit (Prevent if search or calculator active)
      if (e.key === "Enter" && !isSearchActive && !isCalcActive) {
          this.handleSubmit();
      }
    });
  }

  open(questions) {
    if (!questions || questions.length === 0) {
      alert("No questions to play!");
      return;
    }
    
    this.state.questions = [...questions];
    
    // Performance: Pre-cache search text to avoid stripping HTML during search loop
    this.state.questions.forEach(q => {
         if (q._searchCached) return;
         q._searchTitle = (q.title || "").toLowerCase();
         q._searchContent = this.stripHtml(q.text || q.body || q.content || "").toLowerCase();
         // Cache options text
         if (q.options) {
             q.options.forEach(opt => {
                 opt._searchText = (opt.text || "").toLowerCase();
             });
         }
         q._searchCached = true;
    });
    this.state.currentIndex = 0;
    this.state.answers.clear();
    
    // Load persisted answers from question objects
    this.state.questions.forEach(q => {
        if (q.submittedAnswer) {
            this.state.answers.set(q.id, q.submittedAnswer);
        }
    });
    
    this.state.selectedOption = null;
    
    // Show container and loading screen
    this.el.container.classList.remove("hidden");
    const loadingScreen = document.getElementById('dungeonLoadingScreen');
    if (loadingScreen) {
      loadingScreen.classList.remove('hidden');
      
      // Hide loading screen and render content after brief delay
      setTimeout(() => {
        loadingScreen.classList.add('hidden');
        this.render();
      }, 400); // Fast loading (400ms)
    } else {
      // Fallback if loading screen doesn't exist
      this.render();
    }
    
    // Ensure Lab is initialized (fixes hot-reload/state issues)
    this.initLab();
  }

  close() {
    this.el.container.classList.add("hidden");
    this.stopTimer();
  }

  render() {
    // 1. Sidebar
    this.renderSidebar();
    
    // 2. Main Question
    this.renderQuestion();
    
    // 3. Update topbar and footer
    this.updateQuestionTitle();
    this.updateStats(); // Keeps old hook just in case
    this.updateFooterStats(); // New Stats
    
    // Update Reveal Button State
    this.updateRevealButton();
    
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
      if (isHidden) box.style.display = "none";
      // Add data-index for fast filtering updates without re-render
      box.dataset.qIndex = index;
      
      if (index === this.state.currentIndex) {
        box.classList.add("active");
      }

      // Check Status
      const answer = this.state.answers.get(q.id);
      let content = `<span class="q-number" style="font-size: 0.9rem;">${index + 1}</span>`;
      
      if (answer && answer.submitted) {
          if (answer.isCorrect) {
              box.classList.add("correct");
          } else {
              box.classList.add("wrong");
          }
      }

      box.title = q.title || `Question ${index + 1}`; // Tooltip
      box.innerHTML = `<span class="dungeon-box-status">${content}</span>`;
      
      // Star Indicator
      if (q.starred || q.isStarred) {
          const star = document.createElement('div');
          star.className = 'dungeon-starred-indicator';
          box.appendChild(star);
          box.style.position = 'relative'; // Ensure relative for abs star
      }
      
      box.onclick = () => {
        // this.saveCurrentSelection(); // Not needed or undefined
        this.state.currentIndex = index;
        this.state.selectedOption = null; // Reset temp selection on switch
        this.render();
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
               if(prev) prev.disabled = true;
               if(next) next.disabled = true;
          } else {
              countEl.classList.remove('hidden');
              countEl.textContent = `${s.results.length ? s.currentIndex + 1 : 0}/${s.results.length}`;
              if(prev) prev.disabled = s.results.length === 0;
              if(next) next.disabled = s.results.length === 0;
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

  renderQuestion() {
  const q = this.state.questions[this.state.currentIndex];
  const answer = this.state.answers.get(q.id);
  const isSubmitted = answer && answer.submitted;
  const isRevealed = q.revealed || false;

  let html = `
    
    <!-- Context Box (Image/Code) - Placeholder if empty -->
    <!-- Context Box (Image/Code) -->
    <!-- Context Box (Image/Code) -->
    <div class="dungeon-context-box" onmouseup="window.DungeonBase.handleHighlight(event, 'main')">
           ${q.text || q.body || q.content || "No question details."}
    </div>

    <div class="dungeon-options-list">
  `;

  const options = q.options || [];
  const currentSel = this.state.selectedOption; // Valid only if not submitted
  const submittedSel = isSubmitted ? answer.selectedId : null;

  options.forEach(opt => {
      let classes = "dungeon-radio-option";
      // Logic for styling
      if (isSubmitted) {
          // Submitted state
          if (String(opt.id) === String(submittedSel)) {
               classes += " selected"; // Visual selected
               if (answer.isCorrect) classes += " correct-answer";
               else classes += " wrong-answer";
          }
          if (opt.isCorrect && !answer.isCorrect) {
               classes += " correct-answer"; // Show missed correct answer
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

      html += `
        <div class="${classes}">
            <div class="dungeon-radio-circle" onclick="window.DungeonBase.handleSelectOption('${opt.id}')"></div>
            <div class="dungeon-radio-text" onclick="window.DungeonBase.handleStrikeOption(event, this)" onmouseup="window.DungeonBase.handleHighlight(event, 'option', '${opt.id}')">${opt.text || "Option"}</div>
        </div>
      `;
  });

  html += `</div>`; // End options

  html += `</div>`; // End actions row

  this.renderToolbarState(); // Sync toolbar with current question state

  // Show explanation if submitted OR revealed
  if (isSubmitted || isRevealed) {
      const explanationTitle = isSubmitted 
          ? (answer.isCorrect ? "Correct!" : "Incorrect")
          : "Answer Revealed";
      
      html += `
         <div class="dungeon-explanation">
             <h3>${explanationTitle}</h3>
             <p>${q.explanation || "No explanation provided."}</p>
         </div>
      `;
  }

  this.el.main.innerHTML = html;
  
  // Re-apply search highlights if active
  if (this.state.search) {
      setTimeout(() => this.highlightSearchTerms(), 10);
  }
}

  handleSelectOption(optionId) {
      const q = this.state.questions[this.state.currentIndex];
      if (q.crossedOutOptionIds && q.crossedOutOptionIds.includes(String(optionId))) return; // Prevent selection if crossed out
      const answer = this.state.answers.get(q.id);
      
      if (answer && answer.submitted) return; // Locked

      if (this.state.selectedOption === optionId) {
          this.state.selectedOption = null;
      } else {
          this.state.selectedOption = optionId;
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

  showNotification(msg) {
      // Find the save status element to position beside
      const saveStatus = document.querySelector('.dungeon-save-status');
      // Fallback container if save status hidden/missing
      let parent = saveStatus ? saveStatus.parentElement : document.body;
      
      // Check for existing notification
      let notif = document.getElementById('dungeonNotification');
      if (!notif) {
          notif = document.createElement('div');
          notif.id = 'dungeonNotification';
          notif.className = 'dungeon-notification';
          
          if (saveStatus && parent) {
              // Insert before save status (to its left)
              parent.insertBefore(notif, saveStatus);
          } else {
              // Fallback fixed position
              notif.style.position = 'fixed';
              notif.style.bottom = '20px';
              notif.style.right = '100px';
              parent.appendChild(notif);
          }
      }
      
      notif.textContent = msg;
      
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

  handleSubmit() {
      const q = this.state.questions[this.state.currentIndex];
      if (!this.state.selectedOption) {
          this.showNotification("Please choose an option first");
          return;
      }

      const selectedOpt = q.options.find(o => String(o.id) === String(this.state.selectedOption));
      const isCorrect = selectedOpt && selectedOpt.isCorrect;

      const answerData = {
          submitted: true,
          selectedId: this.state.selectedOption,
          isCorrect: isCorrect
      };
      
      this.state.answers.set(q.id, answerData);
      
      // Persist to question object
      q.submittedAnswer = answerData;
      
      // Save timer value before stopping
      if (this.timerStart) {
          q.timerElapsed = Date.now() - this.timerStart;
      }
      
      // Clear revealed state when submitting
      if (q.revealed) {
          q.revealed = false;
      }

      // Sync with global stats
      fetch('http://localhost:3001/api/stats', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isCorrect })
      }).catch(err => console.error("Failed to sync stats:", err));

      this.updateSaveStatus('unsaved');
      this.saveQuestionsToBackend();
      this.stopTimer();
      this.render(); // Update sidebar and content
  }

  toggleReveal() {
      const q = this.state.questions[this.state.currentIndex];
      if (!q) return;
      
      const revealBtn = document.getElementById('dungeonRevealBtn');
      const answer = this.state.answers.get(q.id);
      
      // Toggle reveal state
      q.revealed = !q.revealed;
      
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
                  
                  // Save changes
                  this.updateSaveStatus('unsaved');
                  this.saveQuestionsToBackend();
              }
          }
      }
      
      // Re-render to show/hide the answer
      this.renderQuestion();
  }

  navNext() {
    if (this.state.currentIndex < this.state.questions.length - 1) {
      this.state.currentIndex++;
      this.state.selectedOption = null;
      this.render();
    }
  }

  navPrev() {
    if (this.state.currentIndex > 0) {
      this.state.currentIndex--;
      this.state.selectedOption = null;
      this.render();
    }
  }
}
