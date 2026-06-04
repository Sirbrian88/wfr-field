"use client";

import { useState, useEffect, useCallback } from "react";



const C = {
  bg:          "#f3f5f2",
  surface:     "#ffffff",
  raised:      "#edf0ea",
  border:      "#cdd4c7",
  accent:      "#2a6e22",
  accentLight: "#e6f4e2",
  gold:        "#b8860b",
  goldLight:   "#fff8e1",
  warn:        "#c45000",
  warnLight:   "#fff3e0",
  danger:      "#b71c1c",
  dangerLight: "#ffebee",
  blue:        "#1a5276",
  blueLight:   "#eaf2fb",
  purple:      "#6a1b9a",
  purpleLight: "#f3e5f5",
  text:        "#1c2d1e",
  textDim:     "#4a5c4b",
  textFaint:   "#8a9c8b",
  white:       "#ffffff",
};
const mono = "ui-monospace,'Courier New',monospace";

/* 9-STEP PAS */
const STEPS = [
  { id:"scene", tag:"SCENE", color:"#c45000", triLayer:0, label:"Scene Size-Up",
    checks:[
      "Scene safe — hazards identified and controlled?",
      "Mechanism of Injury (MOI) / Nature of Illness (NOI) determined",
      "Number of patients assessed",
      "Personal Protective Equipment (PPE) donned",
      "Additional resources needed / called?",
    ],
    fields:[
      { key:"numPatients", label:"# Patients",        type:"number",   hint:"e.g. 1" },
      { key:"moi",         label:"MOI / NOI",         type:"text",     hint:"e.g. fall from height, twisted ankle, bee sting" },
      { key:"sceneSafe",   label:"Scene Safety Notes",type:"text",     hint:"e.g. hazards identified, controls in place" },
      { key:"resources",   label:"Resources",         type:"text",     hint:"e.g. kit, litter, comms, other responders" },
    ],
  },
  { id:"initial", tag:"PRIMARY", color:"#b71c1c", triLayer:1, label:"Initial Assessment",
    checks:[
      "General impression — sick or not sick?",
      "Level of Responsiveness (LOR) — AVPU",
      "Airway open and maintained?",
      "Breathing present and adequate?",
      "Severe bleeding controlled?",
      "Circulation / perfusion adequate?",
      "Spine precautions needed?",
    ],
    fields:[
      { key:"lor",      label:"Level of Responsiveness (LOR)", type:"select",
        options:["—","A+Ox4 — Alert, oriented ×4","A+Ox3","A+Ox2","A+Ox1","V — Responds to voice","P — Responds to pain","U — Unresponsive"] },
      { key:"airway",   label:"Airway",   type:"select", options:["—","Open","Compromised — repositioned","Obstructed"] },
      { key:"breathing",label:"Breathing",type:"select", options:["—","Present — normal","Present — labored","Absent"] },
      { key:"bleeding", label:"Severe Bleeding", type:"select", options:["—","None present","Controlled","Uncontrolled"] },
      { key:"spine",    label:"Spine Precautions", type:"select", options:["—","Not indicated","Indicated — immobilized","Cleared"] },
      { key:"notes",    label:"Notes",    type:"text",   hint:"e.g. additional primary findings" },
    ],
  },
  { id:"headtoe", tag:"SECONDARY", color:"#1a5276", triLayer:2, label:"Head-to-Toe Exam",
    checks:[
      "Head / skull / scalp / face examined",
      "Eyes — pupils equal and reactive to light (PEARL)?",
      "Ears / nose — blood or fluid?",
      "Neck / cervical spine — midline tenderness?",
      "Chest — equal expansion, breath sounds bilateral?",
      "Abdomen — soft, tender, or rigid?",
      "Pelvis — stable, no tenderness?",
      "Extremities — CSM (Circulation, Sensation, Motion) in all four?",
      "Posterior / back — spine tenderness along length?",
    ],
    fields:[
      { key:"head",        label:"Head / Skull / Face",   type:"text",     hint:"e.g. DCAP-BTLS, PEARL, facial symmetry" },
      { key:"neck",        label:"Neck / C-Spine",        type:"text",     hint:"e.g. midline pain, JVD, trachea midline?" },
      { key:"chest",       label:"Chest / Breath Sounds", type:"text",     hint:"e.g. equal, clear; paradoxical?" },
      { key:"abdomen",     label:"Abdomen / Pelvis",      type:"text",     hint:"e.g. tenderness, rigidity, stability" },
      { key:"extremities", label:"Extremities",           type:"textarea", hint:"e.g. each limb: CSM, deformity, wounds, swelling" },
      { key:"posterior",   label:"Posterior / Back",      type:"text",     hint:"e.g. spine tenderness, contusions, flanks" },
      { key:"notes",       label:"Additional Findings",   type:"textarea", hint:"" },
    ],
  },
  { id:"vitals", tag:"SECONDARY", color:"#1a5276", triLayer:2, label:"Vital Signs",
    checks:[
      "Level of Responsiveness documented",
      "Heart Rate — rate and quality",
      "Respiratory Rate — rate and quality",
      "Skin — Color, Temperature, Moisture (SCTM)",
      "Blood Pressure / perfusion assessed",
      "Pupils — equal, round, reactive to light?",
      "Temperature estimated",
      "Second set of vitals obtained (trend)?",
    ],
    fields:[],
  },
  { id:"history", tag:"SECONDARY", color:"#1a5276", triLayer:2, label:"Patient History",
    checks:[
      "Chief complaint / OPQRST obtained",
      "Signs & Symptoms documented",
      "Allergies asked",
      "Medications listed",
      "Pertinent past medical history",
      "Last intake (food, water, medications) noted",
      "Events leading to incident documented",
    ],
    fields:[
      { key:"age",     label:"Age / Sex",            type:"text",     hint:"e.g. 34 M" },
      { key:"opqrst",  label:"OPQRST",               type:"textarea", hint:"Onset: / Provocation: / Quality: / Radiation: / Severity: /10 / Time:" },
      { key:"signs",   label:"Signs & Symptoms (S)", type:"textarea", hint:"e.g. chief complaint and objective findings" },
      { key:"allergy", label:"Allergies (A)",         type:"text",     hint:"e.g. NKDA, or list allergies" },
      { key:"meds",    label:"Medications (M)",       type:"text",     hint:"e.g. current medications and doses" },
      { key:"history", label:"Pertinent History (P)", type:"textarea", hint:"e.g. relevant medical / surgical history" },
      { key:"last",    label:"Last Intake (L)",       type:"text",     hint:"e.g. food, water, meds — time and amount" },
      { key:"events",  label:"Events Leading Up (E)", type:"textarea", hint:"e.g. what happened before the incident" },
      { key:"pain",    label:"Pain Scale (0–10)",     type:"pain" },
    ],
  },
  { id:"problems", tag:"ASSESSMENT", color:"#6a1b9a", triLayer:null, label:"Problem List & Plan",
    checks:[
      "Problem list created (most critical first)",
      "Spine injury ruled in or out",
      "Shock ruled in or out",
      "Treatment priorities identified",
      "Evacuation urgency determined",
    ],
    fields:[
      { key:"problems",   label:"Problem List (most critical first)", type:"textarea", hint:"1. [most critical] / 2. ... / 3. ..." },
      { key:"spineRuled", label:"Spine Injury",   type:"select", options:["—","Cleared — no spine precautions","Not cleared — immobilized","Unable to assess"] },
      { key:"shock",      label:"Shock",          type:"select", options:["—","Not present","Suspected — treating","Confirmed — emergency evac"] },
      { key:"evacType",   label:"Evacuation",     type:"select", options:["—","Emergency — call now","Urgent — within hours","Planned walk-out","Monitor in place"] },
      { key:"plan",       label:"Treatment Plan", type:"textarea", hint:"e.g. plan for each identified problem" },
    ],
  },
  { id:"pfa", tag:"PSYCH", color:"#2a6e22", triLayer:null, label:"Psychological First Aid",
    checks:[
      "Safety — physical and psychological safety established",
      "Calm — patient calmed, acute distress reduced",
      "Efficacy — patient involved in own care where possible",
      "Connection — linked to social supports / team",
      "Hope — realistic reassurance provided",
    ],
    fields:[
      { key:"pfaNotes", label:"PFA Notes", type:"textarea", hint:"e.g. patient emotional state, interventions used" },
    ],
  },
  { id:"interventions", tag:"TREATMENT", color:"#c45000", triLayer:null, label:"Interventions",
    checks:[
      "Airway interventions performed if needed",
      "Bleeding / wound care completed",
      "Splinting / immobilization done if needed",
      "Medications administered if applicable",
      "Patient insulated / sheltered",
      "Oral fluids given if appropriate",
    ],
    fields:[
      { key:"interventionNotes", label:"Interventions Performed", type:"textarea",
        hint:"e.g. list each treatment, medication (dose, route, time), and response" },
    ],
  },
  { id:"monitor", tag:"MONITOR", color:"#4a5c4b", triLayer:null, label:"Monitor & Evac",
    checks:[
      "Vital signs trending — improving, stable, or declining?",
      "Anticipated problems identified",
      "Evacuation route / resources confirmed",
      "Communications made (SAR, 911, base camp)?",
      "Ongoing reassessment interval set (every 5 or 15 min)",
    ],
    fields:[
      { key:"trend",       label:"Patient Trend",        type:"select",   options:["—","Improving","Stable","Declining"] },
      { key:"anticipated", label:"Anticipated Problems", type:"textarea", hint:"e.g. what to watch for, and planned responses" },
      { key:"evacPlan",    label:"Evacuation Plan",      type:"textarea", hint:"e.g. route, resources, comms, ETA to care" },
      { key:"comms",       label:"Communications",       type:"textarea", hint:"e.g. who was contacted, when, and response" },
    ],
  },
];

const VITAL_FIELDS = [
  { key:"lor",    label:"LOR",    fullLabel:"Level of Responsiveness",       hint:"e.g. A+Ox4, alert and oriented" },
  { key:"hr",     label:"HR",     fullLabel:"Heart Rate",                    hint:"e.g. 72 bpm, strong/regular" },
  { key:"rr",     label:"RR",     fullLabel:"Resp. Rate",                    hint:"e.g. 16 brpm, unlabored" },
  { key:"sctm",   label:"SCTM",   fullLabel:"Skin (Color/Temp/Moisture)",    hint:"e.g. Pink/Warm/Dry" },
  { key:"bp",     label:"BP",     fullLabel:"Blood Pressure",                hint:"e.g. 120/80 or est. normal" },
  { key:"pupils", label:"Pupils", fullLabel:"Pupils",                        hint:"e.g. PEARL, 3mm equal bilateral" },
  { key:"temp",   label:"Temp",   fullLabel:"Temperature",                   hint:"e.g. Normal est. / Mild hypothermia" },
];

const PROTOCOLS = [
  { id:"shock",  flag:"URGENT",    title:"Shock / Hypoperfusion",
    signs:["Pale, cool, clammy skin","HR > 100 or weak/thready pulse","RR > 24 or labored","Altered Mental Status — restless or anxious","CRT > 2 seconds"],
    tx:["Control bleeding — direct pressure","Supine or legs elevated (no spine concern)","Insulate from ground + overhead","Keep patient still & calm","Nothing by mouth","Evacuate immediately"] },
  { id:"spine",  flag:"PROTOCOL",  title:"Spinal Clearance",
    signs:["Reliable patient? (no AMS, no intoxication, no distracting injury)","Mechanism with axial load?","Midline neck/back pain or tenderness?","Neurological deficit — numbness, tingling, weakness?"],
    tx:["All 4 must be NO to clear spine","Any YES → full immobilization","Immobilize in position found","Pad voids; secure head last","Evacuate — do not walk"] },
  { id:"anaph",  flag:"URGENT",    title:"Anaphylaxis",
    signs:["Hives / flushing / itching","Throat tightness / stridor","Wheezing / shortness of breath","Low BP / weak pulse","Vomiting / cramping"],
    tx:["Epinephrine auto-injector — mid-outer thigh","Repeat epi every 5–15 min if no improvement","Diphenhydramine 25–50 mg if available","Supine if low BP / upright if SOB","Monitor airway closely","Evacuate immediately"] },
  { id:"head",   flag:"MONITOR",   title:"Head Injury / TBI",
    signs:["Loss of consciousness at any point?","Amnesia before or after?","Persistent headache","Repeated vomiting","Pupils unequal or sluggish","Altered mental status"],
    tx:["Any LOC or AMS → spine precautions","Serial neuro checks every 15 min","Any decline → immediate evacuation","NPO if AMS","Keep warm; monitor airway","No NSAIDs or opioids"] },
  { id:"hypo",   flag:"PROTOCOL",  title:"Hypothermia",
    signs:["Mild: shivering, clumsy, poor judgment","Moderate: stops shivering, rigid, confused","Severe: no shivering, rigid, faint pulse"],
    tx:["Handle gently — VFib risk","Remove wet clothing","Insulate: pad + bag + vapor barrier","Heat trunk only","Warm sweet fluids if alert","Severe → horizontal evacuation"] },
  { id:"wound",  flag:"PROTOCOL",  title:"Wound Management",
    signs:["Mechanism: crush / puncture / laceration / avulsion","Contamination level","Time since injury","Distal neurovascular status intact?"],
    tx:["Irrigate: 60 mL syringe, 18g tip, high pressure","60–100 mL per cm wound length","Debride visible debris gently","Pack deep wounds; do NOT close contaminated","Dress & splint if near joint","Evac if: joint involved, infection signs, NV deficit"] },
  { id:"lightning",flag:"URGENT",  title:"Lightning Strike",
    signs:["Scene: active storm? Scatter group first","Entry/exit burns possible","Cardiac arrest common — CPR indicated","Keraunoparalysis (temporary paralysis)","AMS, hearing loss, eye damage"],
    tx:["Safe scene — move from strike zone","Triage REVERSE: treat apparent deaths first","CPR if pulseless — high success rate","Spine precautions","Monitor closely 24 hours","All struck patients must evacuate"] },
];

const AILMENTS = [
  { id:"snakebite", cat:"BITES & STINGS", severity:"high", evac:true, photoAssess:true,
    title:"Snakebite",
    signs:["1–2 fang puncture marks","Local pain, swelling, bruising within minutes","Nausea, vomiting, metallic taste","Numbness of mouth/face","Severe: low BP, neuro deficits, coagulopathy"],
    tx:["Keep patient calm and still","Immobilize bitten limb at/below heart","Remove rings/watches near bite","Mark swelling border + time every 15 min","Do NOT cut, suck, tourniquet, or ice","Evacuate immediately — antivenom is definitive"],
    avoid:"No tourniquet. No incisions. No ice." },
  { id:"spider", cat:"BITES & STINGS", severity:"moderate", evac:true, photoAssess:true,
    title:"Spider Bite (Black Widow / Brown Recluse)",
    signs:["Black widow: muscle cramps, rigidity, severe abdominal pain within 1 hr","Brown recluse: painless then spreading necrotic ulcer 24–72 h","Both: nausea, headache, low-grade fever"],
    tx:["Clean wound with soap and water","Ice pack 10 min on/off for black widow","Diphenhydramine for local reaction","Mark lesion border + time","Evacuate — both can progress severely"],
    avoid:"Do not squeeze wound. No heat on brown recluse bite." },
  { id:"tick", cat:"BITES & STINGS", severity:"low", evac:false, photoAssess:false,
    title:"Tick Removal & Disease Watch",
    signs:["Tick found embedded","Bull's-eye rash (Lyme) hours–days later","Flu symptoms post-removal","Tick paralysis: ascending weakness (rare)"],
    tx:["Tweezers: grasp close to skin, pull straight out steadily","Clean site with antiseptic","Save tick in sealed bag","Watch for rash/flu symptoms 3–30 days","Seek care if rash appears"],
    avoid:"No Vaseline, nail polish, or heat." },
  { id:"bee", cat:"BITES & STINGS", severity:"low", evac:false, photoAssess:true,
    title:"Bee / Wasp Sting",
    signs:["Immediate burning pain","Local swelling, redness, itching","Watch for: throat tightness, SOB, dizziness"],
    tx:["Scrape stinger out — do not pinch","Ice pack to reduce swelling","Diphenhydramine 25–50 mg if available","Monitor 30 min for anaphylaxis","Systemic signs → treat as anaphylaxis"],
    avoid:"Do not pinch stinger — injects more venom." },
  { id:"burn_thermal", cat:"BURNS", severity:"moderate", evac:true, photoAssess:false,
    title:"Thermal Burn",
    signs:["Superficial (1st): red, dry, painful — no blisters","Partial thickness (2nd): blisters, very painful, wet","Full thickness (3rd): white/brown/black, leathery — painless","Inhalation: singed nasal hair, hoarse voice, soot"],
    tx:["Cool with room-temp water 10–20 min — no ice","Remove jewelry/clothing if not adhered","Cover loosely with clean dry dressing","Partial thickness > palm size OR face/hands/genitals/joints → evac","Inhalation suspected → immediate evacuation","No blisters popped; no butter/oils"],
    avoid:"No ice, butter, toothpaste, or oil." },
  { id:"sprain", cat:"FALLS & FRACTURES", severity:"low", evac:false, photoAssess:false,
    title:"Sprain / Strain",
    signs:["Mechanism: twist, overstretch","Pain, swelling, bruising around joint","Intact weight-bearing","No bony deformity or crepitus"],
    tx:["RICE: Rest, Ice 20 min on/off, Compression, Elevate","NSAIDs if available","Reassess weight-bearing after 20 min rest","Able to walk with minimal pain — may continue with support","Unable to weight-bear, deformity → splint + evacuate"],
    avoid:"Rule out fracture before assuming sprain." },
  { id:"fracture", cat:"FALLS & FRACTURES", severity:"moderate", evac:true, photoAssess:false,
    title:"Fracture / Suspected Fracture",
    signs:["Significant force mechanism","Point tenderness over bone","Deformity, angulation, or shortening","Crepitus","Unable to bear weight","Open fracture: bone visible"],
    tx:["Splint in position found — immobilize joint above and below","Check CSM before and after splinting","Pad splint well; secure snugly","Open fracture: moist sterile dressing, do not push bone","Femur: treat proactively for shock","Evacuate all fractures"],
    avoid:"Do not straighten unless distal NV compromised and evac delayed." },
  { id:"heat_ex", cat:"ENVIRONMENTAL", severity:"moderate", evac:true, photoAssess:false,
    title:"Heat Exhaustion",
    signs:["Heavy sweating","Pale, cool, clammy skin","Weakness, dizziness, headache, nausea","HR > 100","Normal mental status — AMS = heat stroke"],
    tx:["Move to cool shade","Remove excess clothing","Supine, elevate legs","Cool wet cloths to neck, armpits, groin","Oral rehydration — sips","Improving in 30 min — may monitor carefully","Any AMS → treat as heat stroke immediately"],
    avoid:"Any AMS = heat stroke. Do not delay cooling." },
  { id:"heat_stroke", cat:"ENVIRONMENTAL", severity:"high", evac:true, photoAssess:false,
    title:"Heat Stroke",
    signs:["Hot skin — wet or dry","AMS: confusion, combative, or unresponsive","Core temp > 40°C (104°F)","Rapid HR and RR","Nausea, vomiting, possible seizure"],
    tx:["COOL FIRST, TRANSPORT SECOND","Strip clothing; ice packs to neck/armpits/groin","Fan aggressively — evaporation speeds cooling","Continue active cooling during evacuation","Monitor airway","Emergency evacuation"],
    avoid:"No oral fluids if AMS — aspiration risk." },
  { id:"altitude", cat:"ENVIRONMENTAL", severity:"moderate", evac:true, photoAssess:false,
    title:"Altitude Illness (AMS / HACE / HAPE)",
    signs:["AMS: headache + nausea/fatigue above 2500 m","HACE: AMS + ataxia or severely worsening AMS","HAPE: dry → wet cough, SOB at rest, crackles, blue lips"],
    tx:["AMS: stop ascent, rest, hydrate, ibuprofen for headache","Do not ascend until symptom-free 24 h","HACE or HAPE: DESCEND IMMEDIATELY 300–1000 m","Supplemental O2 if available","Gamow bag if available","HACE/HAPE: emergency evacuation"],
    avoid:"Never ascend with AMS. Descent is definitive treatment." },
  { id:"hypothermia", cat:"ENVIRONMENTAL", severity:"high", evac:true, photoAssess:false,
    title:"Hypothermia",
    signs:["Mild: shivering, clumsy, poor judgment","Moderate: stops shivering, rigid, confused","Severe: no shivering, rigid, faint or absent pulse"],
    tx:["Handle gently — no rough movement (VFib risk)","Remove wet clothing","Insulate: pad + bag + vapor barrier","Heat trunk only","Warm sweet fluids if alert and can swallow","Severe → horizontal evacuation"],
    avoid:"No heat packs on extremities. No rough movement." },
  { id:"frostbite", cat:"ENVIRONMENTAL", severity:"high", evac:true, photoAssess:false,
    title:"Frostbite",
    signs:["Superficial: white/gray waxy skin, firm surface soft underneath","Deep: completely hard, wooden texture","Post-thaw: clear blisters (superficial) or bloody (deep)","Complete numbness"],
    tx:["Do NOT rewarm if refreezing risk","Protect from trauma; pad and wrap loosely","Rewarm only with definitive shelter: 40–42°C water bath 15–30 min","Expect severe pain on rewarming — good sign","Ibuprofen if available","No walking on thawed feet","Evacuate all frostbite"],
    avoid:"Never rewarm if refreezing possible. No dry heat. No rubbing." },
  { id:"dehydration", cat:"ENVIRONMENTAL", severity:"low", evac:false, photoAssess:false,
    title:"Dehydration",
    signs:["Thirst, dry mouth","Dark urine or decreased output","Headache, fatigue","Dizziness on standing","Severe: AMS, rapid HR, low BP"],
    tx:["Oral rehydration — water + electrolytes","500 mL over 30 min for mild","Sports drink, ORS, or dilute juice","Salty snack + water effective field solution","Severe (AMS or can't drink) → IV + evacuation"],
    avoid:"" },
  { id:"seizure", cat:"NEUROLOGICAL", severity:"high", evac:true, photoAssess:false,
    title:"Seizure",
    signs:["Tonic-clonic: whole body stiffening then jerking","Post-ictal: prolonged confusion and fatigue","May bite tongue or be incontinent","First seizure always requires eval"],
    tx:["Protect from injury — clear area; do NOT restrain","Turn on side (recovery position)","Nothing in mouth during seizure","Time the seizure — > 5 min = status epilepticus, emergency","After: recovery position, monitor airway, assess LOR","First seizure, prolonged, or post-ictal AMS → evacuate"],
    avoid:"Never put anything in mouth during seizure." },
  { id:"diabetic", cat:"NEUROLOGICAL", severity:"moderate", evac:true, photoAssess:false,
    title:"Diabetic Emergency / Hypoglycemia",
    signs:["Sudden: shaky, sweaty, pale, anxious","May self-identify early hypoglycemia","Severe: confusion, unresponsive, seizure","History of diabetes; missed meal or over-exerted"],
    tx:["Conscious + can swallow: 15–20 g fast sugar","Recheck in 15 min; repeat if no improvement","Follow with complex carb + protein snack","Unconscious: do NOT give oral fluids","Recovery position; honey/gel inside cheek if barely responsive","Evacuate if unknown cause, unresponsive, or no improvement"],
    avoid:"No oral fluids if unconscious — aspiration risk." },
  { id:"asthma", cat:"RESPIRATORY", severity:"moderate", evac:true, photoAssess:false,
    title:"Asthma / Bronchospasm",
    signs:["Expiratory wheeze or silent chest (critical)","SOB, chest tightness","Use of accessory muscles","Cyanosis in severe cases","Triggers: cold air, exertion, allergen"],
    tx:["Sit upright","Albuterol MDI: 4–8 puffs via spacer every 20 min ×3","Pursed-lip breathing with reassurance","Keep warm","Mild improvement in 20 min in known asthmatic — may monitor","No improvement, silent chest, or cyanosis → emergency evac"],
    avoid:"" },
  { id:"wound_inf", cat:"WOUND & INFECTION", severity:"moderate", evac:true, photoAssess:true,
    title:"Wound Infection / Cellulitis",
    signs:["Redness spreading beyond wound margins","Warmth, swelling, increasing pain","Purulent discharge or foul odor","Streaking redness tracking up limb (lymphangitis)","Fever, chills"],
    tx:["Open wound to allow drainage if fluctuant","Irrigate aggressively","Warm soaks 3–4× daily","Change dressings twice daily","Antibiotics required → evacuate","Spreading cellulitis or systemic symptoms → urgent evac","Lymphangitic streaking = emergency evacuation"],
    avoid:"" },
];

const EVAC_TRIGGERS = {
  emergency:[
    "Uncontrolled airway / respiratory distress",
    "Uncontrolled severe bleeding / shock",
    "Declining or altered mental status",
    "Suspected spinal injury with neuro deficits",
    "Chest trauma with breathing compromise",
    "Anaphylaxis after epinephrine",
    "Severe hypothermia",
    "Open fracture / unreduced dislocation",
    "Lightning strike",
    "Impalement or evisceration",
  ],
  urgent:[
    "Stable vitals but high-energy mechanism",
    "Spreading cellulitis / lymphangitic streaking",
    "Suspected femur fracture",
    "Eye injury / sudden vision loss",
    "Significant AMS without clear cause",
    "Snakebite — all cases",
  ],
  monitor:[
    "Reduced dislocation, CSM intact, ambulating",
    "Mild hypothermia, actively rewarming",
    "Resolved anaphylaxis, 2+ h post-epi, no recurrence",
    "Minor laceration, wound clean, patient stable",
    "Ankle sprain, weight-bearing, no deformity",
  ],
};

const SEARCH_SYNONYMS = {
  snake:["venom","fang","rattlesnake","copperhead","bite"],
  spider:["black widow","brown recluse","necrosis"],
  tick:["lyme","bulls-eye","bullseye","paralysis","removal"],
  bee:["wasp","stinger","sting"],
  burn:["fire","scald","blister","thermal","sunburn"],
  frostbite:["frost","frozen","cold injury","frostnip"],
  hypothermia:["cold","shiver","exposure","freezing","rigid"],
  heat:["hot","sweat","hyperthermia","sun","stroke","exhaustion"],
  altitude:["mountain","AMS","HACE","HAPE","elevation","hypoxia"],
  seizure:["convulsion","epilepsy","tremor","tonic","ictal"],
  fracture:["break","broken","bone","crack","crepitus"],
  sprain:["twist","roll","ankle","strain","RICE"],
  shock:["hypoperfusion","low bp","pale","clammy","perfusion"],
  bleeding:["hemorrhage","blood","wound","laceration","cut"],
  infection:["cellulitis","abscess","pus","fever","streaks"],
  asthma:["wheeze","bronchospasm","inhaler","MDI"],
  allergic:["allergy","hives","urticaria","itching","anaphylaxis"],
  head:["concussion","TBI","skull","brain","LOC","amnesia"],
  diabetic:["hypoglycemia","sugar","glucose","insulin","shaky"],
  dehydration:["thirst","dry","fluid","dark urine","electrolyte"],
};

function fuzzyScoreAilment(a, query) {
  if (!query) return 1;
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  const titleLower = a.title.toLowerCase();
  const bodyText = [a.cat,...(a.signs||[]),...(a.tx||[])].join(" ").toLowerCase();
  let score = 0;
  for (const word of words) {
    const syns = Object.entries(SEARCH_SYNONYMS)
      .filter(([k])=>k.includes(word)||word.includes(k))
      .flatMap(([,v])=>v);
    if (titleLower.includes(word)) score+=10;
    else if (syns.some(s=>titleLower.includes(s))) score+=6;
    else if (bodyText.includes(word)) score+=3;
    else if (syns.some(s=>bodyText.includes(s))) score+=2;
  }
  return score;
}

/* PATIENT ASSESSMENT TRIANGLE — JPEG image with invisible tap overlays per band */
function PatientAssessmentTriangle({ activeStep, onStepClick }) {
  // The JPEG (triangle.jpeg) has the exact handbook pyramid.
  // SVG overlay uses a 100×100 viewBox (% coordinates) mapped over the image.
  // Triangle tip ≈ (50, 6.4%), base ≈ y 85.9%, half-width at base ≈ 46.3%.
  // 7 equal bands, band 2 split into 3 sub-columns.

  const activeFill = "rgba(80,80,80,0.28)";

  // Precomputed trapezoid points (% coords) for each band
  const bands = [
    { step:0, pts:"50,6.4 50,6.4 56.6,17.75 43.4,17.75" },
    { step:1, pts:"43.4,17.75 56.6,17.75 63.2,29.1 36.8,29.1" },
    { step:5, pts:"30.2,40.45 69.8,40.45 76.4,51.8 23.6,51.8" },
    { step:6, pts:"23.6,51.8 76.4,51.8 83.0,63.15 17.0,63.15" },
    { step:7, pts:"17.0,63.15 83.0,63.15 89.6,74.5 10.4,74.5" },
    { step:8, pts:"10.4,74.5 89.6,74.5 96.2,85.85 3.8,85.85" },
  ];
  // Band 2 sub-columns
  const subBands = [
    { step:2, pts:"36.8,29.1 45.6,29.1 43.4,40.45 30.2,40.45" },
    { step:3, pts:"45.6,29.1 54.4,29.1 56.6,40.45 43.4,40.45" },
    { step:4, pts:"54.4,29.1 63.2,29.1 69.8,40.45 56.6,40.45" },
  ];

  return (
    <div style={{position:"relative",maxWidth:340,margin:"0 auto",borderRadius:"6px",overflow:"hidden"}}>
      <img src="/triangle.jpeg" alt="Patient Assessment System"
        style={{width:"100%",display:"block"}} />
      <svg viewBox="0 0 100 100" preserveAspectRatio="none"
        style={{position:"absolute",top:0,left:0,width:"100%",height:"100%"}}>
        {[...bands,...subBands].map(({step,pts})=>(
          <polygon key={step} points={pts}
            fill={activeStep===step ? activeFill : "transparent"}
            onClick={()=>onStepClick(step)}
            style={{cursor:"pointer"}} />
        ))}
      </svg>
    </div>
  );
}

/* LOCATION */
async function resolveLocation(lat,lng,deviceAlt) {
  try {
    const [eR,gR]=await Promise.all([
      fetch("https://api.open-meteo.com/v1/elevation?latitude="+lat+"&longitude="+lng),
      fetch("https://nominatim.openstreetmap.org/reverse?lat="+lat+"&lon="+lng+"&format=json",{headers:{"User-Agent":"FieldMed-WFR/1.0"}}),
    ]);
    const eD=await eR.json(), gD=await gR.json();
    const elevM=eD?.elevation?.[0]??deviceAlt??null;
    const elevStr=elevM!=null?" · "+Math.round(elevM)+"m elev.":"";
    const addr=gD?.address||{};
    const place=[addr.city||addr.town||addr.village||addr.county,addr.state].filter(Boolean).join(", ");
    const coordStr=Math.abs(lat).toFixed(4)+"°"+(lat>=0?"N":"S")+", "+Math.abs(lng).toFixed(4)+"°"+(lng>=0?"E":"W");
    return place?place+elevStr+"  ("+coordStr+")":coordStr+elevStr;
  } catch { return lat.toFixed(4)+", "+lng.toFixed(4); }
}

function fmtDateTime(iso) {
  try{return new Date(iso).toLocaleString([],{month:"short",day:"numeric",year:"numeric",hour:"2-digit",minute:"2-digit"});}catch{return iso;}
}
function nowTime(){return new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"});}

/* LOG FACTORY */
function makeLog(){
  const now=new Date();
  return {
    id:"log_"+now.getTime(), name:"", datetime:now.toISOString(),
    location:{lat:null,lng:null,display:""},
    checks:{}, fields:{}, vitals:[], notes:"",
    rescueLocation:{landmark:"",trail:"",terrain:"",lzAvailable:"",lzNotes:"",lookFor:""},
  };
}

/* REPORT GENERATORS */
function generateVerbalReport(log){
  const f=(stepId,key)=>(log.fields[stepId]||{})[key]||"";
  const lines=[];
  const push=l=>lines.push(l);
  const sec=t=>{push("");push(t);push("─".repeat(t.length));};
  push("📞 VERBAL SOAP REPORT");
  push("━".repeat(42));
  sec("SUBJECTIVE — Who, What, Where");
  const name=log.name||"[caller name]";
  push('  "This is '+name+' with a patient report."');
  if(log.location.display) push('  "We are currently located at: '+log.location.display+'."');
  const age=f("history","age")||"[age/sex]";
  const chief=f("history","signs")||f("initial","notes")||"[chief complaint]";
  push('  "I have a '+age+' patient whose chief complaint is: '+chief+'."');
  const moi=f("scene","moi");
  if(moi) push('  "The MOI/HPI is: '+moi+'."');
  const lor=f("initial","lor");
  if(lor) push('  "The patient is currently: '+lor+'."');
  sec("OBJECTIVE — Head to Toe, Vitals, Hx");
  const examParts=[
    f("headtoe","head")&&"Head: "+f("headtoe","head"),
    f("headtoe","neck")&&"Neck: "+f("headtoe","neck"),
    f("headtoe","chest")&&"Chest: "+f("headtoe","chest"),
    f("headtoe","abdomen")&&"Abdomen: "+f("headtoe","abdomen"),
    f("headtoe","extremities")&&"Extremities: "+f("headtoe","extremities"),
    f("headtoe","posterior")&&"Posterior: "+f("headtoe","posterior"),
  ].filter(Boolean);
  if(examParts.length){push('  "Patient exam reveals:"');examParts.forEach(e=>push("    "+e));}
  if(log.vitals.length){
    const v=log.vitals[log.vitals.length-1];
    const vStr=VITAL_FIELDS.filter(vf=>v[vf.key]).map(vf=>vf.label+": "+v[vf.key]).join(", ");
    push('  "Vital signs at '+(v.time||"[time]")+' are: '+vStr+'."');
    if(log.vitals.length>1){push('  "Trend ('+log.vitals.length+' sets):"');log.vitals.forEach(vs=>{const s=VITAL_FIELDS.filter(vf=>vs[vf.key]).map(vf=>vf.label+":"+vs[vf.key]).join(" ");push("    "+(vs.time||"")+"  "+s);});}
  }
  const allergy=f("history","allergy"),meds=f("history","meds"),hx=f("history","history"),last=f("history","last"),events=f("history","events");
  if(allergy||meds||hx||last||events){
    push('  "Pertinent SAMPLE history:"');
    if(allergy) push("    Allergies: "+allergy);
    if(meds)    push("    Medications: "+meds);
    if(hx)      push("    History: "+hx);
    if(last)    push("    Last intake: "+last);
    if(events)  push("    Events: "+events);
  }
  sec("ASSESSMENT — Problem List");
  const spineRuled=f("problems","spineRuled");
  if(spineRuled&&spineRuled!=="—") push('  "Spine: '+spineRuled+'."');
  const problems=f("problems","problems");
  if(problems){push('  "We suspect the following problems:"');problems.split("\n").filter(Boolean).forEach(p=>push("    "+p));}
  sec("PLAN");
  const interventions=f("interventions","interventionNotes");
  if(interventions){push("  Treatment:");push('  "Our treatment has included: '+interventions+'"');}
  const evacType=f("problems","evacType"),evacPlan=f("monitor","evacPlan")||f("problems","plan");
  if(evacType||evacPlan){
    push("  Evacuation:");
    if(evacType&&evacType!=="—") push('  "Evacuation type: '+evacType+'."');
    if(evacPlan) push('  "Our evacuation plan is: '+evacPlan+'."');
  }
  const anticipated=f("monitor","anticipated");
  if(anticipated){push("  Anticipated Problems:");push('  "We will monitor for: '+anticipated+'"');}
  push("");push("━".repeat(42));push("  NOT A SUBSTITUTE FOR WFR TRAINING");
  return lines.join("\n");
}

function generateWrittenSOAP(log){
  const f=(stepId,key)=>(log.fields[stepId]||{})[key]||"";
  const lines=[];
  const push=l=>lines.push(l);
  const sec=t=>{push("");push(t);push("─".repeat(t.length));};
  push("📋 WRITTEN SOAP NOTE");
  push("━".repeat(42));
  push("Name: "+(log.name||"[patient/responder]")+"    Date: "+fmtDateTime(log.datetime));
  if(log.location.display) push("Location: "+log.location.display);
  sec("S — SUBJECTIVE / SUMMARY / STORY");
  const age=f("history","age")||"[age/sex]";
  const chief=f("history","signs")||f("initial","notes")||"[chief complaint]";
  const moi=f("scene","moi")||"[MOI/HPI]";
  const lor=f("initial","lor")||"[LOR]";
  push("I have a "+age+" patient whose chief complaint is: "+chief+".");
  push("Patient states (MOI/HPI): "+moi+".");
  push("Patient status: "+lor+".");
  const opqrst=f("history","opqrst");
  if(opqrst){push("");push("OPQRST:");opqrst.split("\n").filter(Boolean).forEach(l=>push("  "+l));}
  sec("O — OBJECTIVE / OBSERVATIONS / FINDINGS");
  push("Patient exam reveals:");
  const examMap=[["head","Head/Face"],["neck","Neck/C-Spine"],["chest","Chest"],["abdomen","Abdomen/Pelvis"],["extremities","Extremities"],["posterior","Posterior"],["notes","Other"]];
  examMap.forEach(([k,lbl])=>{const v=f("headtoe",k);if(v) push("  "+lbl+": "+v);});
  push("");push("Vital Signs:");
  if(log.vitals.length){
    log.vitals.forEach(v=>{const row=VITAL_FIELDS.map(vf=>vf.label+": "+(v[vf.key]||"—")).join("  |  ");push("  ["+( v.time||"—")+"]  "+row);});
  } else { push("  TIME: —  LOR: —  HR: —  RR: —  SCTM: —  BP: —  Pupils: —  Temp: —"); }
  push("");push("History (SAMPLE):");
  [["Symptoms/Signs (S)",f("history","signs")],["Allergies (A)",f("history","allergy")],["Medications (M)",f("history","meds")],["History (P)",f("history","history")],["Last intake (L)",f("history","last")],["Events (E)",f("history","events")]].forEach(([lbl,val])=>push("  "+lbl+": "+(val||"—")));
  sec("A — ASSESSMENT (Problem List)");
  const problems=f("problems","problems");
  if(problems) problems.split("\n").filter(Boolean).forEach(p=>push("  "+p));
  else push("  [problem list]");
  const spineRuled=f("problems","spineRuled");
  if(spineRuled&&spineRuled!=="—") push("  Spine: "+spineRuled);
  const shock=f("problems","shock");
  if(shock&&shock!=="—") push("  Shock: "+shock);
  sec("P — PLAN");
  const plan=f("problems","plan");
  if(plan){push("Treatment:");plan.split("\n").filter(Boolean).forEach(l=>push("  "+l));}
  const interventions=f("interventions","interventionNotes");
  if(interventions){push("Interventions:");interventions.split("\n").filter(Boolean).forEach(l=>push("  "+l));}
  const evacType=f("problems","evacType"),evacPlan=f("monitor","evacPlan");
  if(evacType&&evacType!=="—") push("Evacuation type: "+evacType);
  if(evacPlan) push("Evacuation plan: "+evacPlan);
  const anticipated=f("monitor","anticipated");
  if(anticipated){push("");push("Anticipated Problems:");anticipated.split("\n").filter(Boolean).forEach(l=>push("  "+l));}
  push("");push("━".repeat(42));push("NOT A SUBSTITUTE FOR WFR TRAINING  |  © NOLS Wilderness Medicine");
  return lines.join("\n");
}

/* STYLE CONSTANTS */
const inputSt={background:"#ffffff",border:"1px solid #cdd4c7",borderRadius:"6px",padding:"9px 11px",color:"#1c2d1e",fontFamily:mono,fontSize:"13px",outline:"none",width:"100%",boxSizing:"border-box",WebkitAppearance:"none"};
const btnPrimary={background:"#2a6e22",border:"none",borderRadius:"6px",padding:"12px 18px",color:"#ffffff",fontFamily:mono,fontSize:"12px",fontWeight:700,letterSpacing:"0.06em",cursor:"pointer",WebkitAppearance:"none"};

/* HINT TEXT STYLE */
const hintSt={fontSize:"10px",color:"#9aab9b",fontFamily:"ui-monospace,'Courier New',monospace",marginTop:"3px",paddingLeft:"2px",letterSpacing:"0.02em",lineHeight:1.3,pointerEvents:"none"};

/* STABLE INPUTS */
function LogInput({value,onSave,style,hint,...props}){
  const [local,setLocal]=useState(value??"");
  useEffect(()=>{setLocal(value??"");},[value]);
  return (
    <div>
      <input {...props} placeholder="" style={style} value={local} onChange={e=>setLocal(e.target.value)} onBlur={()=>onSave(local)}/>
      {hint&&<div style={hintSt}>{hint}</div>}
    </div>
  );
}
function LogTextarea({value,onSave,style,rows,hint}){
  const [local,setLocal]=useState(value??"");
  useEffect(()=>{setLocal(value??"");},[value]);
  return (
    <div>
      <textarea value={local} rows={rows} placeholder="" style={style} onChange={e=>setLocal(e.target.value)} onBlur={()=>onSave(local)}/>
      {hint&&<div style={hintSt}>{hint}</div>}
    </div>
  );
}

/* PAIN SCALE */
function PainScale({value,onChange}){
  const val=parseInt(value,10);
  return (
    <div style={{display:"flex",gap:"4px",flexWrap:"wrap",marginTop:"4px"}}>
      {[0,1,2,3,4,5,6,7,8,9,10].map(n=>(
        <button key={n} onClick={()=>onChange(String(n))}
          style={{width:"34px",height:"34px",borderRadius:"50%",border:"none",
            background:val===n?(n<=3?"#2a6e22":n<=6?"#c45000":"#b71c1c"):"#edf0ea",
            color:val===n?"#ffffff":"#4a5c4b",fontFamily:mono,fontSize:"12px",
            fontWeight:val===n?"700":"400",cursor:"pointer",WebkitAppearance:"none"}}>
          {n}
        </button>
      ))}
    </div>
  );
}

/* STEP PILLS */
function StepPills({steps,activeStep,checks,onStepClick}){
  return (
    <div style={{display:"flex",gap:"4px",flexWrap:"wrap",marginBottom:"12px"}}>
      {steps.map((step,i)=>{
        const sc=checks[step.id]||{};
        const total=step.checks.length;
        const done=step.checks.filter((_,idx)=>sc[idx]).length;
        const allDone=total>0&&done===total;
        const isActive=i===activeStep;
        return (
          <button key={step.id} onClick={()=>onStepClick(i)}
            style={{background:isActive?"#b8860b":allDone?"#2a6e22":"#edf0ea",
              color:(isActive||allDone)?"#ffffff":"#4a5c4b",border:"none",borderRadius:"12px",
              padding:"4px 9px",fontFamily:mono,fontSize:"11px",fontWeight:isActive?"700":"500",
              cursor:"pointer",WebkitAppearance:"none",
              outline:isActive?"2px solid #b8860b":"none",outlineOffset:"1px"}}>
            {i+1}.{allDone?" ✓":""}
          </button>
        );
      })}
    </div>
  );
}

/* SEVERITY / EVAC COLOR HELPERS */
function severityColor(severity) {
  if (!severity) return "#4a5c4b";
  const s = severity.toLowerCase();
  if (s.includes("life")) return "#b71c1c";
  if (s.includes("severe")) return "#c45000";
  if (s.includes("moderate")) return "#b8860b";
  return "#2a6e22";
}

function evacColor(evac) {
  if (!evac) return "#4a5c4b";
  const e = evac.toLowerCase();
  if (e.includes("emergency")) return "#b71c1c";
  if (e.includes("urgent")) return "#c45000";
  if (e.includes("monitor")) return "#b8860b";
  return "#2a6e22";
}


/* CHECKBOX FIELD GATES
   Maps stepId → { checkIdx: fieldKey | null }
   null means the checkbox is standalone (always freely checkable).
   A string fieldKey means: only allow checking if that field has content.
   Select fields gate on value !== "" && value !== "—".
*/
const CHECKBOX_GATES = {
  scene: {
    0: null,           // Scene safe — standalone
    1: "moi",          // MOI/NOI → moi field
    2: "numPatients",  // # patients → numPatients field
    3: null,           // PPE — standalone
    4: null,           // Additional resources — standalone
  },
  initial: {
    0: null,           // General impression — standalone
    1: "lor",          // LOR → lor select
    2: "airway",       // Airway → airway select
    3: "breathing",    // Breathing → breathing select
    4: "bleeding",     // Severe bleeding → bleeding select
    5: null,           // Circulation — standalone
    6: "spine",        // Spine → spine select
  },
  headtoe: {
    0: "head",         // Head/skull → head field
    1: null,           // Eyes — standalone (no separate field)
    2: null,           // Ears/nose — standalone
    3: "neck",         // Neck → neck field
    4: "chest",        // Chest → chest field
    5: "abdomen",      // Abdomen → abdomen field
    6: null,           // Pelvis — standalone
    7: "extremities",  // Extremities → extremities field
    8: "posterior",    // Posterior → posterior field
  },
  vitals: {},          // vitals checks are all standalone
  history: {
    0: "opqrst",       // OPQRST → opqrst field
    1: "signs",        // Signs & Symptoms → signs field
    2: "allergy",      // Allergies → allergy field
    3: "meds",         // Medications → meds field
    4: "history",      // Past history → history field
    5: "last",         // Last intake → last field
    6: "events",       // Events → events field
  },
  problems: {
    0: "problems",     // Problem list → problems field
    1: null,           // Spine ruled — standalone (select)
    2: null,           // Shock ruled — standalone (select)
    3: null,           // Treatment priorities — standalone
    4: null,           // Evac urgency — standalone
  },
  pfa: {},             // PFA checks all standalone
  interventions: {},   // interventions checks all standalone
  monitor: {
    0: null,           // Vital signs trending — standalone
    1: "anticipated",  // Anticipated problems → anticipated field
    2: "evacPlan",     // Evac route → evacPlan field
    3: "comms",        // Communications → comms field
    4: null,           // Reassessment interval — standalone
  },
};

/* Returns true if a gated checkbox should be disabled */
function isCheckboxDisabled(stepId, idx, fields) {
  const gates = CHECKBOX_GATES[stepId] || {};
  const fieldKey = gates[idx];
  if (fieldKey === undefined || fieldKey === null) return false; // standalone
  const val = (fields[stepId] || {})[fieldKey] || "";
  // Select fields: disabled if value is "" or "—"
  return !val.trim() || val === "—";
}

/* MAIN COMPONENT */
export default function WFRField(){
  const [screen,setScreen]=useState("home");
  const [logs,setLogs]=useState([]);
  const [activeLog,setActiveLog]=useState(null);
  const [tab,setTab]=useState("pas");
  const [activeStep,setActiveStep]=useState(0);
  const [openProtocol,setOpenProtocol]=useState(null);
  const [openAilment,setOpenAilment]=useState(null);
  const [ailSearch,setAilSearch]=useState("");
  const [ailSearchQ,setAilSearchQ]=useState("");
  const [activeCat,setActiveCat]=useState("ALL");
  const [vitalDraft,setVitalDraft]=useState({});
  const [locating,setLocating]=useState(false);
  const [verbalCopy,setVerbalCopy]=useState("");
  const [writtenCopy,setWrittenCopy]=useState("");
  const [rescuePanelOpen,setRescuePanelOpen]=useState(false);

  /* AI AUTO-FILL STATE */
  const [aiModalOpen,setAiModalOpen]=useState(false);
  const [aiNotes,setAiNotes]=useState("");
  const [aiProcessing,setAiProcessing]=useState(false);
  const [aiError,setAiError]=useState("");
  const [aiResult,setAiResult]=useState(null);
  const [aiFilled,setAiFilled]=useState([]);
  const [aiOnline,setAiOnline]=useState(true);

  /* PHOTO ASSESSMENT STATE */
  const [photoModalOpen,setPhotoModalOpen]=useState(false);
  const [photoPreview,setPhotoPreview]=useState(null);
  const [photoBase64,setPhotoBase64]=useState(null);
  const [photoMime,setPhotoMime]=useState("image/jpeg");
  const [photoNotes,setPhotoNotes]=useState("");
  const [photoResult,setPhotoResult]=useState(null);
  const [photoLoading,setPhotoLoading]=useState(false);
  const [photoError,setPhotoError]=useState("");

  const runOffline=null,offlineLoading=false,offlineReady=false,offlineProgress={stage:"",percent:0};

  /* Track online status */
  useEffect(()=>{
    const update=()=>setAiOnline(typeof navigator!=="undefined"?navigator.onLine:true);
    update();
    window.addEventListener("online",update);
    window.addEventListener("offline",update);
    return()=>{window.removeEventListener("online",update);window.removeEventListener("offline",update);};
  },[]);

  useEffect(()=>{try{const s=localStorage.getItem("fieldmed_logs_v2");if(s)setLogs(JSON.parse(s));}catch{}},[]);
  useEffect(()=>{try{localStorage.setItem("fieldmed_logs_v2",JSON.stringify(logs));}catch{}},[logs]);
  useEffect(()=>{const t=setTimeout(()=>setAilSearchQ(ailSearch),300);return()=>clearTimeout(t);},[ailSearch]);

  const patchLog=useCallback((id,changes)=>{
    setLogs(ls=>ls.map(l=>l.id===id?{...l,...changes}:l));
    setActiveLog(prev=>prev?.id===id?{...prev,...changes}:prev);
  },[]);

  const setCheck=useCallback((logId,stepId,idx,val)=>{
    const upd=l=>{if(l.id!==logId)return l;const sc={...(l.checks[stepId]||{}),[idx]:val};return{...l,checks:{...l.checks,[stepId]:sc}};};
    setLogs(ls=>ls.map(upd));
    setActiveLog(prev=>prev?upd(prev):prev);
  },[]);

  const setField=useCallback((logId,stepId,key,value)=>{
    const upd=l=>{if(l.id!==logId)return l;return{...l,fields:{...l.fields,[stepId]:{...(l.fields[stepId]||{}),[key]:value}}};};
    setLogs(ls=>ls.map(upd));
    setActiveLog(prev=>prev?upd(prev):prev);
  },[]);

  const addVital=useCallback((logId)=>{
    const v={...vitalDraft,time:vitalDraft.time||nowTime()};
    const upd=l=>l.id===logId?{...l,vitals:[...l.vitals,v]}:l;
    setLogs(ls=>ls.map(upd));
    setActiveLog(prev=>prev?upd(prev):prev);
    setVitalDraft({});
  },[vitalDraft]);

  const removeVital=useCallback((logId,idx)=>{
    const upd=l=>l.id===logId?{...l,vitals:l.vitals.filter((_,i)=>i!==idx)}:l;
    setLogs(ls=>ls.map(upd));
    setActiveLog(prev=>prev?upd(prev):prev);
  },[]);

  /* AI AUTO-FILL: apply triage result to the active log */
  const applyTriageToLog=useCallback((logId,triage)=>{
    const filled=[];
    const sf=(stepId,key,val)=>{
      if(val&&val!=="—"&&val!==""){
        setField(logId,stepId,key,val);
        filled.push({stepId,key,val});
      }
    };

    // scene
    if(triage.scene){
      sf("scene","numPatients",triage.scene.numPatients);
      sf("scene","moi",triage.scene.moi);
      sf("scene","sceneSafe",triage.scene.sceneSafe);
      sf("scene","resources",triage.scene.resources);
    }
    // initial
    if(triage.initial){
      sf("initial","lor",triage.initial.lor);
      sf("initial","airway",triage.initial.airway);
      sf("initial","breathing",triage.initial.breathing);
      sf("initial","bleeding",triage.initial.bleeding);
      sf("initial","spine",triage.initial.spine);
      sf("initial","notes",triage.initial.notes);
    }
    // headtoe
    if(triage.headtoe){
      sf("headtoe","head",triage.headtoe.head);
      sf("headtoe","neck",triage.headtoe.neck);
      sf("headtoe","chest",triage.headtoe.chest);
      sf("headtoe","abdomen",triage.headtoe.abdomen);
      sf("headtoe","extremities",triage.headtoe.extremities);
      sf("headtoe","posterior",triage.headtoe.posterior);
      sf("headtoe","notes",triage.headtoe.notes);
    }
    // history
    if(triage.history){
      sf("history","age",triage.history.age);
      sf("history","opqrst",triage.history.opqrst);
      sf("history","signs",triage.history.signs);
      sf("history","allergy",triage.history.allergy);
      sf("history","meds",triage.history.meds);
      sf("history","history",triage.history.history);
      sf("history","last",triage.history.last);
      sf("history","events",triage.history.events);
      sf("history","pain",triage.history.pain);
    }
    // problems
    if(triage.problems){
      sf("problems","problems",triage.problems.problems);
      sf("problems","spineRuled",triage.problems.spineRuled);
      sf("problems","shock",triage.problems.shock);
      sf("problems","evacType",triage.problems.evacType);
      sf("problems","plan",triage.problems.plan);
    }
    // pfa
    if(triage.pfa){
      sf("pfa","pfaNotes",triage.pfa.pfaNotes);
    }
    // interventions
    if(triage.interventions){
      sf("interventions","interventionNotes",triage.interventions.interventionNotes);
    }
    // monitor
    if(triage.monitor){
      sf("monitor","trend",triage.monitor.trend);
      sf("monitor","anticipated",triage.monitor.anticipated);
      sf("monitor","evacPlan",triage.monitor.evacPlan);
      sf("monitor","comms",triage.monitor.comms);
    }
    // vitals — add each vital set
    if(triage.vitals&&Array.isArray(triage.vitals)&&triage.vitals.length>0){
      triage.vitals.forEach(v=>{
        const vObj={...v,time:v.time||nowTime()};
        const upd=l=>l.id===logId?{...l,vitals:[...l.vitals,vObj]}:l;
        setLogs(ls=>ls.map(upd));
        setActiveLog(prev=>prev?upd(prev):prev);
      });
      filled.push({stepId:"vitals",key:"sets",val:triage.vitals.length+" vital set(s)"});
    }
    // encounter notes
    if(triage.notes&&triage.notes.trim()){
      patchLog(logId,{notes:triage.notes});
      filled.push({stepId:"notes",key:"notes",val:triage.notes});
    }
    // rescue location
    if(triage.rescueLocation){
      const rl=triage.rescueLocation;
      const hasRL=Object.values(rl).some(v=>v&&v!=="—"&&v!=="");
      if(hasRL){
        patchLog(logId,{rescueLocation:{...((activeLog||{}).rescueLocation||{}),...rl}});
        filled.push({stepId:"rescueLocation",key:"details",val:"Rescue location fields"});
      }
    }
    return filled;
  },[setField,patchLog,setLogs,setActiveLog,activeLog]);

  const handleAiProcess=useCallback(async()=>{
    if(!aiNotes.trim()||!activeLog)return;
    setAiProcessing(true);
    setAiError("");
    setAiResult(null);
    setAiFilled([]);
    try{
      const runTriage=async(notes)=>{const res=await fetch("/api/triage/cloud",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({notes})});const d=await res.json();if(!d?.ok||!d?.triage)throw new Error(d?.error||"Cloud error");return d.triage;};
      const triage=await runTriage(aiNotes);
      const filled=applyTriageToLog(activeLog.id,triage);
      setAiResult(triage);
      setAiFilled(filled);
    }catch(err){
      setAiError(err.message||"Triage failed. Check your connection or notes.");
    }finally{
      setAiProcessing(false);
    }
  },[aiNotes,activeLog,runOffline,applyTriageToLog]);

  /* PHOTO ASSESSMENT HANDLERS */
  const handlePhotoSelect=useCallback((e)=>{
    const file=e.target.files?.[0];
    if(!file)return;
    setPhotoMime(file.type||"image/jpeg");
    const reader=new FileReader();
    reader.onload=(ev)=>{
      const dataUrl=ev.target.result;
      setPhotoPreview(dataUrl);
      setPhotoBase64(dataUrl.split(",")[1]);
    };
    reader.readAsDataURL(file);
  },[]);

  const handlePhotoAssess=useCallback(async()=>{
    if(!photoBase64)return;
    setPhotoLoading(true);
    setPhotoError("");
    setPhotoResult(null);
    try{
      const res=await fetch("/api/assess/photo",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({imageBase64:photoBase64,mimeType:photoMime,notes:photoNotes}),
      });
      const data=await res.json();
      if(data.error)throw new Error(data.error);
      setPhotoResult(data);
    }catch(err){
      setPhotoError(err.message||"Assessment failed. Check connection.");
    }finally{
      setPhotoLoading(false);
    }
  },[photoBase64,photoMime,photoNotes]);

  const handleAttachToLog=useCallback(()=>{
    if(!photoResult||!activeLog)return;
    const summary=`PHOTO ASSESSMENT (${new Date().toLocaleTimeString()}):\nSuspected: ${photoResult.suspected}\nSeverity: ${photoResult.severity}\nFindings: ${photoResult.findings}\nTreatment: ${photoResult.treatment?.join("; ")}\nWatch for: ${photoResult.watchFor?.join("; ")}\nEvacuation: ${photoResult.evacuation}`;
    patchLog(activeLog.id,{notes:(activeLog.notes?activeLog.notes+"\n\n":"")+summary});
    setPhotoModalOpen(false);
  },[photoResult,activeLog,patchLog]);

  const openPhotoModal=useCallback(()=>{
    setPhotoModalOpen(true);
    setPhotoPreview(null);
    setPhotoBase64(null);
    setPhotoNotes("");
    setPhotoResult(null);
    setPhotoError("");
  },[]);

  const startNewLog=()=>{
    const log=makeLog();
    setLogs(ls=>[log,...ls]);
    setActiveLog(log);setTab("pas");setActiveStep(0);setScreen("log");
    if(typeof navigator!=="undefined"&&navigator.geolocation){
      setLocating(true);
      navigator.geolocation.getCurrentPosition(async pos=>{
        const{latitude:lat,longitude:lng,altitude}=pos.coords;
        const display=await resolveLocation(lat,lng,altitude);
        patchLog(log.id,{location:{lat,lng,display}});setLocating(false);
      },()=>setLocating(false),{enableHighAccuracy:true,timeout:15000});
    }
  };

  const openLog=(log)=>{setActiveLog(log);setTab("pas");setActiveStep(0);setScreen("log");};
  const deleteLog=(id)=>{
    if(typeof window!=="undefined"&&!window.confirm("Delete this log?"))return;
    setLogs(ls=>ls.filter(l=>l.id!==id));
    if(activeLog?.id===id){setActiveLog(null);setScreen("home");}
  };
  const copyText=(text,setter)=>{
    if(typeof navigator!=="undefined"&&navigator.clipboard){
      navigator.clipboard.writeText(text).then(()=>{setter("Copied!");setTimeout(()=>setter(""),2000);});
    }
  };

  const log=activeLog;
  const currentStep=STEPS[activeStep];

  /* PHOTO MODAL */
  const photoModal=photoModalOpen&&(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",zIndex:1100,display:"flex",alignItems:"flex-end",justifyContent:"center"}}
      onClick={e=>{if(e.target===e.currentTarget){setPhotoModalOpen(false);}}}>
      <div style={{background:"#1c2d1e",border:"1px solid #2a6e22",borderRadius:"14px 14px 0 0",padding:"20px 16px 36px",width:"100%",maxWidth:480,maxHeight:"92vh",overflowY:"auto"}}>

        {/* Header */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"16px"}}>
          <div>
            <div style={{fontSize:"14px",fontWeight:700,color:"#ffffff",letterSpacing:"0.06em"}}>📷 PHOTO ASSESSMENT</div>
            <div style={{fontSize:"11px",color:"#8a9c8b",marginTop:"2px"}}>Gemini Vision — WFR Protocol Analysis</div>
          </div>
          <button onClick={()=>setPhotoModalOpen(false)}
            style={{background:"none",border:"none",color:"#8a9c8b",fontSize:"22px",cursor:"pointer",lineHeight:1}}>×</button>
        </div>

        {/* Photo input */}
        <div style={{marginBottom:"12px"}}>
          <label style={{fontSize:"11px",color:"#8a9c8b",display:"block",marginBottom:"6px",letterSpacing:"0.06em"}}>PHOTO / CAMERA</label>
          <label style={{display:"block",cursor:"pointer"}}>
            <div style={{background:"#0d1f10",border:"2px dashed #2a6e22",borderRadius:"8px",padding:"16px",textAlign:"center",color:"#4caf50",fontSize:"12px",fontFamily:mono}}>
              {photoPreview?"📷 Photo selected — tap to change":"📷 Tap to take photo or select from library"}
            </div>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePhotoSelect}
              style={{display:"none"}}
            />
          </label>
        </div>

        {/* Preview */}
        {photoPreview&&(
          <div style={{marginBottom:"12px",textAlign:"center"}}>
            <img src={photoPreview} alt="Selected photo"
              style={{maxHeight:"200px",maxWidth:"100%",borderRadius:"8px",border:"1px solid #2a6e22",objectFit:"contain"}}/>
          </div>
        )}

        {/* Notes */}
        <div style={{marginBottom:"12px"}}>
          <label style={{fontSize:"11px",color:"#8a9c8b",display:"block",marginBottom:"6px",letterSpacing:"0.06em"}}>CONTEXT (OPTIONAL)</label>
          <textarea
            value={photoNotes}
            onChange={e=>setPhotoNotes(e.target.value)}
            placeholder="Add context (location on body, duration, symptoms...)"
            rows={3}
            style={{...inputSt,background:"#0d1f10",color:"#e8f5e9",border:"1px solid #2a6e22",resize:"vertical",fontSize:"12px",lineHeight:"1.5"}}
          />
        </div>

        {/* Assess button */}
        <button
          onClick={handlePhotoAssess}
          disabled={!photoBase64||photoLoading}
          style={{...btnPrimary,width:"100%",padding:"12px",fontSize:"13px",marginBottom:"12px",
            opacity:(!photoBase64||photoLoading)?0.5:1,
            background:photoLoading?"#4a5c4b":"#2a6e22"}}>
          {photoLoading?"Analyzing with Gemini Vision…":"Assess Photo"}
        </button>

        {/* Error */}
        {photoError&&(
          <div style={{padding:"10px 12px",background:"#3d0000",border:"1px solid #b71c1c",borderRadius:"6px",marginBottom:"12px",fontSize:"12px",color:"#ef9a9a",fontFamily:mono}}>
            {photoError}
          </div>
        )}

        {/* Results */}
        {photoResult&&(
          <div style={{background:"#0d1f10",border:"1px solid #2a6e22",borderRadius:"10px",padding:"14px",marginBottom:"12px"}}>

            {/* Anaphylaxis risk banner */}
            {photoResult.anaphylaxisRisk==="High"&&(
              <div style={{
                background:"#b71c1c",border:"2px solid #ff1744",borderRadius:"8px",
                padding:"12px 14px",marginBottom:"14px",
              }}>
                <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.7}}`}</style>
                <div style={{fontSize:"13px",fontWeight:700,color:"#ffffff",letterSpacing:"0.04em",animation:"pulse 1.5s ease-in-out infinite"}}>
                  ⚠️ HIGH ANAPHYLAXIS RISK
                </div>
                <div style={{fontSize:"11px",color:"rgba(255,255,255,0.9)",marginTop:"4px"}}>
                  Check for Epi-Pen. Prepare for emergency evacuation.
                </div>
              </div>
            )}

            {/* Suspected condition */}
            <div style={{marginBottom:"12px"}}>
              <div style={{fontSize:"11px",color:"#8a9c8b",letterSpacing:"0.08em",marginBottom:"4px"}}>SUSPECTED</div>
              <div style={{fontSize:"15px",fontWeight:700,color:"#ffffff",lineHeight:"1.3"}}>{photoResult.suspected}</div>
            </div>

            {/* Badges */}
            <div style={{display:"flex",gap:"8px",flexWrap:"wrap",marginBottom:"12px"}}>
              <span style={{background:"#1a3a1c",border:"1px solid #2a6e22",borderRadius:"10px",padding:"3px 10px",fontSize:"11px",fontFamily:mono,color:"#a5d6a7"}}>
                Confidence: {photoResult.confidence}
              </span>
              <span style={{
                background:"rgba(0,0,0,0.3)",
                border:"1px solid "+severityColor(photoResult.severity),
                borderRadius:"10px",padding:"3px 10px",fontSize:"11px",fontFamily:mono,
                color:severityColor(photoResult.severity),fontWeight:700,
              }}>
                {photoResult.severity}
              </span>
              {photoResult.anaphylaxisRisk&&photoResult.anaphylaxisRisk!=="Low"&&(
                <span style={{background:"rgba(183,28,28,0.3)",border:"1px solid #b71c1c",borderRadius:"10px",padding:"3px 10px",fontSize:"11px",fontFamily:mono,color:"#ef9a9a"}}>
                  Anaphylaxis: {photoResult.anaphylaxisRisk}
                </span>
              )}
            </div>

            {/* Findings */}
            {photoResult.findings&&(
              <div style={{marginBottom:"12px"}}>
                <div style={{fontSize:"11px",color:"#8a9c8b",letterSpacing:"0.08em",marginBottom:"4px"}}>FINDINGS</div>
                <div style={{fontSize:"12px",color:"#e8f5e9",lineHeight:"1.6"}}>{photoResult.findings}</div>
              </div>
            )}

            {/* Treatment */}
            {photoResult.treatment&&photoResult.treatment.length>0&&(
              <div style={{marginBottom:"12px"}}>
                <div style={{fontSize:"11px",color:"#8a9c8b",letterSpacing:"0.08em",marginBottom:"6px"}}>TREATMENT</div>
                {photoResult.treatment.map((t,i)=>(
                  <div key={i} style={{fontSize:"12px",color:"#e8f5e9",marginBottom:"4px",display:"flex",gap:"8px"}}>
                    <span style={{color:"#4caf50",flexShrink:0,fontWeight:700}}>{i+1}.</span>
                    <span>{t}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Watch for */}
            {photoResult.watchFor&&photoResult.watchFor.length>0&&(
              <div style={{marginBottom:"12px"}}>
                <div style={{fontSize:"11px",color:"#8a9c8b",letterSpacing:"0.08em",marginBottom:"6px"}}>WATCH FOR</div>
                {photoResult.watchFor.map((w,i)=>(
                  <div key={i} style={{fontSize:"12px",color:"#ffe082",marginBottom:"4px",paddingLeft:"8px"}}>• {w}</div>
                ))}
              </div>
            )}

            {/* Evacuation */}
            {photoResult.evacuation&&(
              <div style={{marginBottom:"12px",padding:"10px 12px",borderRadius:"8px",
                background:"rgba(0,0,0,0.3)",
                border:"1px solid "+evacColor(photoResult.evacuation)}}>
                <div style={{fontSize:"11px",color:"#8a9c8b",letterSpacing:"0.08em",marginBottom:"4px"}}>EVACUATION</div>
                <div style={{fontSize:"13px",fontWeight:700,color:evacColor(photoResult.evacuation)}}>{photoResult.evacuation}</div>
                {photoResult.evacuationReason&&(
                  <div style={{fontSize:"11px",color:"#8a9c8b",marginTop:"4px"}}>{photoResult.evacuationReason}</div>
                )}
              </div>
            )}

            {/* Disclaimer */}
            {photoResult.disclaimer&&(
              <div style={{fontSize:"10px",color:"#4a5c4b",borderTop:"1px solid #1a3a1c",paddingTop:"10px",marginBottom:"12px",lineHeight:"1.5"}}>
                {photoResult.disclaimer}
              </div>
            )}

            {/* Attach to log */}
            {activeLog&&(
              <button onClick={handleAttachToLog}
                style={{...btnPrimary,width:"100%",padding:"11px",fontSize:"12px"}}>
                Attach to Patient Log
              </button>
            )}
          </div>
        )}

        <div style={{fontSize:"10px",color:"#4a5c4b",textAlign:"center",marginTop:"8px",lineHeight:"1.4"}}>
          AI vision analysis — always apply WFR training and clinical judgment.
        </div>
      </div>
    </div>
  );


  /* HOME */
  if(screen==="home") return (
    <div style={{fontFamily:mono,background:"#f3f5f2",minHeight:"100vh",padding:"16px"}}>
      {photoModal}
      <div style={{maxWidth:480,margin:"0 auto"}}>
        <div style={{textAlign:"center",marginBottom:"20px"}}>
          <div style={{fontSize:"22px",fontWeight:700,color:"#2a6e22",letterSpacing:"0.08em"}}>FIELD MED</div>
          <div style={{fontSize:"11px",color:"#8a9c8b",letterSpacing:"0.12em",marginTop:"2px"}}>WFR BACKCOUNTRY REFERENCE</div>
        </div>
        <button onClick={startNewLog} style={{...btnPrimary,width:"100%",fontSize:"14px",marginBottom:"10px",padding:"14px"}}>
          + NEW PATIENT LOG
        </button>
        {/* Photo Assess quick action */}
        <button onClick={openPhotoModal}
          style={{width:"100%",background:"#ffffff",border:"2px solid #2a6e22",borderRadius:"10px",padding:"14px 16px",marginBottom:"16px",display:"flex",alignItems:"center",gap:"12px",cursor:"pointer",WebkitAppearance:"none",textAlign:"left"}}>
          <div style={{fontSize:"26px",lineHeight:1}}>📷</div>
          <div>
            <div style={{fontSize:"13px",fontWeight:700,color:"#2a6e22",fontFamily:mono}}>Assess Bite / Sting / Rash</div>
            <div style={{fontSize:"11px",color:"#8a9c8b",marginTop:"2px",fontFamily:mono}}>Gemini Vision — instant WFR analysis</div>
          </div>
          <div style={{marginLeft:"auto",color:"#2a6e22",fontSize:"16px"}}>→</div>
        </button>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px",marginBottom:"16px"}}>
          {[
            {label:"Protocols",sub:"Critical care guides",color:"#b71c1c",onClick:()=>setScreen("protocols")},
            {label:"Ailments",sub:"Signs & treatment",color:"#1a5276",onClick:()=>setScreen("ailments")},
            {label:"Evac Guide",sub:"Decision criteria",color:"#6a1b9a",onClick:()=>setScreen("evac")},
            {label:"About",sub:"WFR reference tool",color:"#4a5c4b",onClick:()=>setScreen("about")},
          ].map(tile=>(
            <button key={tile.label} onClick={tile.onClick}
              style={{background:"#ffffff",border:"1px solid #cdd4c7",borderRadius:"10px",padding:"14px 12px",textAlign:"left",cursor:"pointer",WebkitAppearance:"none"}}>
              <div style={{fontSize:"13px",fontWeight:700,color:tile.color}}>{tile.label}</div>
              <div style={{fontSize:"11px",color:"#8a9c8b",marginTop:"2px"}}>{tile.sub}</div>
            </button>
          ))}
        </div>
        {logs.length>0&&(
          <div>
            <div style={{fontSize:"11px",color:"#8a9c8b",letterSpacing:"0.1em",marginBottom:"6px"}}>PAST LOGS</div>
            {logs.map(l=>(
              <div key={l.id} style={{background:"#ffffff",border:"1px solid #cdd4c7",borderRadius:"8px",padding:"10px 12px",marginBottom:"6px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div onClick={()=>openLog(l)} style={{cursor:"pointer",flex:1}}>
                  <div style={{fontSize:"13px",fontWeight:600,color:"#1c2d1e"}}>{l.name||"(unnamed)"}</div>
                  <div style={{fontSize:"11px",color:"#8a9c8b",marginTop:"1px"}}>{fmtDateTime(l.datetime)}</div>
                  {l.location.display&&<div style={{fontSize:"10px",color:"#8a9c8b"}}>{l.location.display}</div>}
                </div>
                <button onClick={()=>deleteLog(l.id)} style={{background:"none",border:"none",color:"#8a9c8b",cursor:"pointer",fontSize:"16px",padding:"4px 8px"}}>×</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  /* PROTOCOLS */
  if(screen==="protocols") return (
    <div style={{fontFamily:mono,background:"#f3f5f2",minHeight:"100vh",padding:"16px"}}>
      <div style={{maxWidth:480,margin:"0 auto"}}>
        <div style={{display:"flex",alignItems:"center",gap:"12px",marginBottom:"16px"}}>
          <button onClick={()=>setScreen("home")} style={{background:"none",border:"none",color:"#2a6e22",fontFamily:mono,fontSize:"13px",cursor:"pointer",padding:0}}>← Back</button>
          <div style={{fontWeight:700,color:"#1c2d1e",fontSize:"15px",letterSpacing:"0.06em"}}>PROTOCOLS</div>
        </div>
        {PROTOCOLS.map(p=>(
          <div key={p.id} style={{background:"#ffffff",border:"1px solid #cdd4c7",borderRadius:"8px",marginBottom:"8px",overflow:"hidden"}}>
            <button onClick={()=>setOpenProtocol(openProtocol===p.id?null:p.id)}
              style={{width:"100%",background:"none",border:"none",padding:"12px 14px",display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer",WebkitAppearance:"none"}}>
              <div style={{textAlign:"left"}}>
                <span style={{fontSize:"10px",fontWeight:700,letterSpacing:"0.1em",color:p.flag==="URGENT"?"#b71c1c":p.flag==="PROTOCOL"?"#1a5276":"#c45000",marginRight:"8px"}}>{p.flag}</span>
                <span style={{fontSize:"13px",fontWeight:600,color:"#1c2d1e"}}>{p.title}</span>
              </div>
              <span style={{color:"#8a9c8b"}}>{openProtocol===p.id?"▲":"▼"}</span>
            </button>
            {openProtocol===p.id&&(
              <div style={{padding:"0 14px 14px"}}>
                <div style={{fontSize:"11px",fontWeight:700,color:"#4a5c4b",marginBottom:"4px",letterSpacing:"0.08em"}}>SIGNS / INDICATORS</div>
                {p.signs.map((s,i)=><div key={i} style={{fontSize:"12px",color:"#1c2d1e",marginBottom:"3px",paddingLeft:"8px"}}>• {s}</div>)}
                <div style={{fontSize:"11px",fontWeight:700,color:"#4a5c4b",marginTop:"10px",marginBottom:"4px",letterSpacing:"0.08em"}}>TREATMENT</div>
                {p.tx.map((t,i)=><div key={i} style={{fontSize:"12px",color:"#1c2d1e",marginBottom:"3px",paddingLeft:"8px"}}>• {t}</div>)}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  /* AILMENTS */
  if(screen==="ailments"){
    const cats=["ALL",...Array.from(new Set(AILMENTS.map(a=>a.cat)))];
    const filtered=AILMENTS
      .map(a=>({a,score:fuzzyScoreAilment(a,ailSearchQ)}))
      .filter(({a,score})=>score>0&&(activeCat==="ALL"||a.cat===activeCat))
      .sort((x,y)=>y.score-x.score).map(({a})=>a);
    return (
      <div style={{fontFamily:mono,background:"#f3f5f2",minHeight:"100vh",padding:"16px"}}>
        {photoModal}
        <div style={{maxWidth:480,margin:"0 auto"}}>
          <div style={{display:"flex",alignItems:"center",gap:"12px",marginBottom:"12px"}}>
            <button onClick={()=>{setScreen("home");setOpenAilment(null);}} style={{background:"none",border:"none",color:"#2a6e22",fontFamily:mono,fontSize:"13px",cursor:"pointer",padding:0}}>← Back</button>
            <div style={{fontWeight:700,color:"#1c2d1e",fontSize:"15px",letterSpacing:"0.06em"}}>AILMENTS</div>
          </div>
          {/* Photo assess button at top of ailments */}
          <button onClick={openPhotoModal}
            style={{width:"100%",background:"#e6f4e2",border:"1px solid #2a6e22",borderRadius:"8px",padding:"11px 14px",marginBottom:"12px",display:"flex",alignItems:"center",gap:"10px",cursor:"pointer",WebkitAppearance:"none",textAlign:"left"}}>
            <span style={{fontSize:"18px"}}>📷</span>
            <div>
              <div style={{fontSize:"12px",fontWeight:700,color:"#2a6e22",fontFamily:mono}}>Photo Assessment</div>
              <div style={{fontSize:"11px",color:"#4a5c4b",fontFamily:mono}}>Analyze a bite, sting, or rash with Gemini Vision</div>
            </div>
            <div style={{marginLeft:"auto",color:"#2a6e22",fontSize:"14px"}}>→</div>
          </button>
          <input value={ailSearch} onChange={e=>setAilSearch(e.target.value)} placeholder="Search ailments..." style={{...inputSt,marginBottom:"8px"}}/>
          <div style={{display:"flex",gap:"6px",flexWrap:"wrap",marginBottom:"12px"}}>
            {cats.map(c=><button key={c} onClick={()=>setActiveCat(c)}
              style={{background:activeCat===c?"#1a5276":"#edf0ea",color:activeCat===c?"#ffffff":"#4a5c4b",border:"none",borderRadius:"12px",padding:"4px 10px",fontFamily:mono,fontSize:"11px",cursor:"pointer",WebkitAppearance:"none"}}>{c}</button>)}
          </div>
          {filtered.map(a=>(
            <div key={a.id} style={{background:"#ffffff",border:"1px solid #cdd4c7",borderRadius:"8px",marginBottom:"8px",overflow:"hidden"}}>
              <button onClick={()=>setOpenAilment(openAilment===a.id?null:a.id)}
                style={{width:"100%",background:"none",border:"none",padding:"12px 14px",display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer",WebkitAppearance:"none"}}>
                <div style={{textAlign:"left",flex:1}}>
                  <span style={{fontSize:"10px",color:"#8a9c8b",marginRight:"8px"}}>{a.cat}</span>
                  <span style={{fontSize:"13px",fontWeight:600,color:"#1c2d1e"}}>{a.title}</span>
                  {a.evac&&<span style={{fontSize:"10px",fontWeight:700,color:"#b71c1c",marginLeft:"8px"}}>EVAC</span>}
                </div>
                <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
                  {a.photoAssess&&(
                    <button
                      onClick={e=>{e.stopPropagation();openPhotoModal();}}
                      style={{background:"#e6f4e2",border:"1px solid #2a6e22",borderRadius:"6px",padding:"3px 8px",fontSize:"10px",fontFamily:mono,color:"#2a6e22",fontWeight:700,cursor:"pointer",WebkitAppearance:"none",whiteSpace:"nowrap"}}>
                      📷 Assess
                    </button>
                  )}
                  <span style={{color:"#8a9c8b"}}>{openAilment===a.id?"▲":"▼"}</span>
                </div>
              </button>
              {openAilment===a.id&&(
                <div style={{padding:"0 14px 14px"}}>
                  <div style={{fontSize:"11px",fontWeight:700,color:"#4a5c4b",marginBottom:"4px",letterSpacing:"0.08em"}}>SIGNS & SYMPTOMS</div>
                  {a.signs.map((s,i)=><div key={i} style={{fontSize:"12px",color:"#1c2d1e",marginBottom:"3px",paddingLeft:"8px"}}>• {s}</div>)}
                  <div style={{fontSize:"11px",fontWeight:700,color:"#4a5c4b",marginTop:"10px",marginBottom:"4px",letterSpacing:"0.08em"}}>TREATMENT</div>
                  {a.tx.map((t,i)=><div key={i} style={{fontSize:"12px",color:"#1c2d1e",marginBottom:"3px",paddingLeft:"8px"}}>• {t}</div>)}
                  {a.avoid&&<div style={{marginTop:"10px",background:"#ffebee",borderRadius:"6px",padding:"8px 10px",fontSize:"11px",fontWeight:700,color:"#b71c1c"}}>⚠ {a.avoid}</div>}
                  {a.photoAssess&&(
                    <button onClick={openPhotoModal}
                      style={{...btnPrimary,marginTop:"12px",width:"100%",padding:"9px",fontSize:"11px",background:"#1a3a1c",border:"1px solid #2a6e22"}}>
                      📷 Assess with Photo — Gemini Vision
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* EVAC */
  if(screen==="evac") return (
    <div style={{fontFamily:mono,background:"#f3f5f2",minHeight:"100vh",padding:"16px"}}>
      <div style={{maxWidth:480,margin:"0 auto"}}>
        <div style={{display:"flex",alignItems:"center",gap:"12px",marginBottom:"16px"}}>
          <button onClick={()=>setScreen("home")} style={{background:"none",border:"none",color:"#2a6e22",fontFamily:mono,fontSize:"13px",cursor:"pointer",padding:0}}>← Back</button>
          <div style={{fontWeight:700,color:"#1c2d1e",fontSize:"15px",letterSpacing:"0.06em"}}>EVAC DECISION GUIDE</div>
        </div>
        {[{key:"emergency",label:"🚨 EMERGENCY — Call Now",color:"#b71c1c",bg:"#ffebee"},
          {key:"urgent",label:"⚠ URGENT — Within Hours",color:"#c45000",bg:"#fff3e0"},
          {key:"monitor",label:"👁 MONITOR — May Wait",color:"#2a6e22",bg:"#e6f4e2"}].map(sec=>(
          <div key={sec.key} style={{background:sec.bg,border:"1px solid "+sec.color,borderRadius:"8px",padding:"12px 14px",marginBottom:"12px"}}>
            <div style={{fontSize:"13px",fontWeight:700,color:sec.color,marginBottom:"8px"}}>{sec.label}</div>
            {EVAC_TRIGGERS[sec.key].map((t,i)=><div key={i} style={{fontSize:"12px",color:"#1c2d1e",marginBottom:"4px",paddingLeft:"8px"}}>• {t}</div>)}
          </div>
        ))}
      </div>
    </div>
  );

  /* ABOUT */
  if(screen==="about") return (
    <div style={{fontFamily:mono,background:"#f3f5f2",minHeight:"100vh",padding:"16px"}}>
      <div style={{maxWidth:480,margin:"0 auto"}}>
        <div style={{display:"flex",alignItems:"center",gap:"12px",marginBottom:"16px"}}>
          <button onClick={()=>setScreen("home")} style={{background:"none",border:"none",color:"#2a6e22",fontFamily:mono,fontSize:"13px",cursor:"pointer",padding:0}}>← Back</button>
          <div style={{fontWeight:700,color:"#1c2d1e",fontSize:"15px"}}>ABOUT</div>
        </div>
        <div style={{background:"#ffffff",border:"1px solid #cdd4c7",borderRadius:"8px",padding:"16px",fontSize:"12px",color:"#1c2d1e",lineHeight:"1.7"}}>
          <div style={{fontWeight:700,marginBottom:"8px"}}>Field Med — WFR Backcountry Reference</div>
          <p>Built for Wilderness First Responders. Follows the Patient Assessment System from the NOLS Wilderness Medicine Handbook.</p>
          <p style={{marginTop:"8px",color:"#b71c1c",fontWeight:700}}>⚠ NOT A SUBSTITUTE FOR WFR TRAINING.</p>
          <p style={{marginTop:"8px"}}>This tool supports — it does not replace — proper WFR certification and sound clinical judgment in the field.</p>
          <div style={{marginTop:"12px",color:"#8a9c8b",fontSize:"11px"}}>Protocol content based on NOLS Wilderness Medicine, 7th edition. © 2026 NOLS.</div>
        </div>
      </div>
    </div>
  );

  /* LOG SCREEN */
  if(!log) return null;
  const verbalReport=generateVerbalReport(log);
  const writtenReport=generateWrittenSOAP(log);

  /* Evac urgency for AI alert banner */
  const evacFromAI=aiResult?.problems?.evacType||"";
  const isEmergencyEvac=evacFromAI==="Emergency — call now";
  const isUrgentEvac=evacFromAI==="Urgent — within hours";


  /* AI MODAL */
  const aiModal=aiModalOpen&&(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:1000,display:"flex",alignItems:"flex-end",justifyContent:"center"}}
      onClick={e=>{if(e.target===e.currentTarget){setAiModalOpen(false);setAiResult(null);setAiFilled([]);setAiError("");}}}>
      <div style={{background:"#1c2d1e",border:"1px solid #2a6e22",borderRadius:"14px 14px 0 0",padding:"20px 16px 32px",width:"100%",maxWidth:480,maxHeight:"90vh",overflowY:"auto"}}>

        {/* Modal header */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"16px"}}>
          <div>
            <div style={{fontSize:"14px",fontWeight:700,color:"#ffffff",letterSpacing:"0.06em"}}>AI AUTO-FILL</div>
            <div style={{fontSize:"11px",color:"#8a9c8b",marginTop:"2px"}}>
              {aiOnline
                ?"Online — Gemini 1.5 Flash"
                :`Offline — Local model${offlineReady?" ready":offlineLoading?" loading…":" unavailable"}`}
            </div>
          </div>
          <button onClick={()=>{setAiModalOpen(false);setAiResult(null);setAiFilled([]);setAiError("");}}
            style={{background:"none",border:"none",color:"#8a9c8b",fontSize:"20px",cursor:"pointer",lineHeight:1}}>×</button>
        </div>

        {/* Connectivity badge */}
        <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"12px",padding:"8px 10px",borderRadius:"6px",
          background:aiOnline?"#1a3a1c":"#3a2000",border:"1px solid "+(aiOnline?"#2a6e22":"#c45000")}}>
          <div style={{width:"8px",height:"8px",borderRadius:"50%",background:aiOnline?"#4caf50":"#ff9800"}}/>
          <span style={{fontSize:"11px",color:aiOnline?"#a5d6a7":"#ffb74d",fontFamily:mono}}>
            {aiOnline?"ONLINE — Cloud AI (Gemini)":"OFFLINE — Local model (Transformers.js)"}
          </span>
        </div>

        {/* Offline model loading progress */}
        {!aiOnline&&offlineLoading&&(
          <div style={{marginBottom:"12px",padding:"10px",background:"#0d1f10",borderRadius:"6px",border:"1px solid #2a6e22"}}>
            <div style={{fontSize:"11px",color:"#a5d6a7",marginBottom:"6px"}}>{offlineProgress.stage||"Loading…"}</div>
            <div style={{height:"4px",background:"#2a3d2c",borderRadius:"2px",overflow:"hidden"}}>
              <div style={{height:"100%",background:"#2a6e22",width:(offlineProgress.percent||0)+"%",transition:"width 0.3s"}}/>
            </div>
            <div style={{fontSize:"10px",color:"#4a5c4b",marginTop:"4px"}}>{offlineProgress.percent||0}% — First load downloads ~250 MB and caches locally</div>
          </div>
        )}

        {/* Notes textarea */}
        <div style={{marginBottom:"12px"}}>
          <label style={{fontSize:"11px",color:"#8a9c8b",display:"block",marginBottom:"6px",letterSpacing:"0.06em"}}>FIELD NOTES</label>
          <textarea
            value={aiNotes}
            onChange={e=>setAiNotes(e.target.value)}
            placeholder={"Paste or type your field notes here.\n\nExample: 28F fell from ~5m while rock climbing. LOC for ~30 seconds. Now A+Ox3, confused. C/o neck pain. HR 110, RR 20, skin pale/diaphoretic. Possible C-spine injury. Uncontrolled bleeding from scalp lac..."}
            rows={7}
            style={{...inputSt,background:"#0d1f10",color:"#e8f5e9",border:"1px solid #2a6e22",resize:"vertical",minHeight:"120px",lineHeight:"1.5",fontSize:"12px"}}
          />
        </div>

        {/* Process button */}
        <button
          onClick={handleAiProcess}
          disabled={aiProcessing||!aiNotes.trim()||(!aiOnline&&!offlineReady)}
          style={{...btnPrimary,width:"100%",padding:"12px",fontSize:"13px",marginBottom:"12px",
            opacity:(aiProcessing||!aiNotes.trim()||(!aiOnline&&!offlineReady))?0.5:1,
            background:aiProcessing?"#4a5c4b":"#2a6e22"}}>
          {aiProcessing?"Processing…":"Process Notes"}
        </button>

        {/* Error */}
        {aiError&&(
          <div style={{padding:"10px 12px",background:"#3d0000",border:"1px solid #b71c1c",borderRadius:"6px",marginBottom:"12px",fontSize:"12px",color:"#ef9a9a"}}>
            {aiError}
          </div>
        )}

        {/* Evac alert banner */}
        {aiResult&&(isEmergencyEvac||isUrgentEvac)&&(
          <div style={{padding:"12px 14px",borderRadius:"8px",marginBottom:"12px",
            background:isEmergencyEvac?"#b71c1c":"#c45000",
            border:"2px solid "+(isEmergencyEvac?"#ff1744":"#ff6d00")}}>
            <div style={{fontSize:"14px",fontWeight:700,color:"#ffffff",letterSpacing:"0.06em"}}>
              {isEmergencyEvac?"🚨 EMERGENCY EVACUATION":"⚠ URGENT EVACUATION"}
            </div>
            <div style={{fontSize:"12px",color:"rgba(255,255,255,0.9)",marginTop:"4px"}}>
              {isEmergencyEvac
                ?"Call 911 / SAR now. Do not delay evacuation."
                :"Evacuate within hours. Monitor closely during transport."}
            </div>
          </div>
        )}

        {/* Success summary */}
        {aiResult&&aiFilled.length>0&&(
          <div style={{padding:"12px",background:"#0d1f10",border:"1px solid #2a6e22",borderRadius:"8px",marginBottom:"12px"}}>
            <div style={{fontSize:"12px",fontWeight:700,color:"#4caf50",marginBottom:"8px"}}>
              {aiFilled.length} field{aiFilled.length!==1?"s":""} auto-filled
            </div>
            <div style={{maxHeight:"160px",overflowY:"auto"}}>
              {aiFilled.map((f,i)=>(
                <div key={i} style={{fontSize:"11px",color:"#8a9c8b",marginBottom:"3px",display:"flex",gap:"6px"}}>
                  <span style={{color:"#4caf50",flexShrink:0}}>✓</span>
                  <span><span style={{color:"#a5d6a7"}}>{f.stepId}/{f.key}</span>{" — "}{String(f.val).slice(0,50)}{String(f.val).length>50?"…":""}</span>
                </div>
              ))}
            </div>
            <button onClick={()=>{setAiModalOpen(false);setAiResult(null);setAiFilled([]);setAiError("");setAiNotes("");}}
              style={{...btnPrimary,width:"100%",marginTop:"10px",padding:"10px",fontSize:"12px"}}>
              Done — View Filled Fields
            </button>
          </div>
        )}

        {aiFilled.length===0&&aiResult&&!aiError&&(
          <div style={{padding:"10px",background:"#1a3a1c",borderRadius:"6px",fontSize:"12px",color:"#8a9c8b",textAlign:"center"}}>
            No mappable fields found in notes. Try providing more clinical detail.
          </div>
        )}

        <div style={{fontSize:"10px",color:"#4a5c4b",textAlign:"center",marginTop:"8px",lineHeight:"1.4"}}>
          AI output is a decision-support tool only. Always apply WFR training and clinical judgment.
        </div>
      </div>
    </div>
  );

  return (
    <div style={{fontFamily:mono,background:"#f3f5f2",minHeight:"100vh",padding:"16px"}}>
      {aiModal}
      {photoModal}
      <div style={{maxWidth:480,margin:"0 auto"}}>

        {/* Header */}
        <div style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:"12px"}}>
          <button onClick={()=>setScreen("home")} style={{background:"none",border:"none",color:"#2a6e22",fontFamily:mono,fontSize:"13px",cursor:"pointer",padding:0}}>← Home</button>
          <LogInput value={log.name} onSave={v=>patchLog(log.id,{name:v})} placeholder="Log name / patient ID" style={{...inputSt,flex:1,fontSize:"13px"}}/>
          <button onClick={openPhotoModal}
            style={{background:"#1a3a1c",border:"1px solid #2a6e22",borderRadius:"8px",padding:"8px 10px",color:"#4caf50",
              fontFamily:mono,fontSize:"11px",fontWeight:700,cursor:"pointer",whiteSpace:"nowrap",
              letterSpacing:"0.04em",WebkitAppearance:"none"}}>
            📷
          </button>
          <button onClick={()=>{setAiModalOpen(true);setAiResult(null);setAiFilled([]);setAiError("");}}
            style={{background:"#2a6e22",border:"none",borderRadius:"8px",padding:"8px 10px",color:"#ffffff",
              fontFamily:mono,fontSize:"11px",fontWeight:700,cursor:"pointer",whiteSpace:"nowrap",
              letterSpacing:"0.04em",WebkitAppearance:"none"}}>
            AI Fill
          </button>
        </div>

        {/* Location */}
        <div style={{background:"#ffffff",border:"1px solid #cdd4c7",borderRadius:"8px",padding:"8px 12px",marginBottom:"10px",fontSize:"11px",color:"#4a5c4b",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span>{locating?"📍 Getting location…":log.location.display||"📍 Location not recorded"}</span>
          <button onClick={()=>setRescuePanelOpen(!rescuePanelOpen)} style={{background:"none",border:"none",color:"#1a5276",fontFamily:mono,fontSize:"11px",cursor:"pointer"}}>{rescuePanelOpen?"▲ Rescue":"▼ Rescue"}</button>
        </div>

        {rescuePanelOpen&&(
          <div style={{background:"#eaf2fb",border:"1px solid #1a5276",borderRadius:"8px",padding:"12px",marginBottom:"10px"}}>
            <div style={{fontSize:"11px",fontWeight:700,color:"#1a5276",marginBottom:"8px",letterSpacing:"0.08em"}}>RESCUE LOCATION DETAILS</div>
            {[{key:"landmark",label:"Nearest landmark",placeholder:"trail junction, peak name, lake"},
              {key:"trail",label:"Trail / Route",placeholder:"trail name and number"},
              {key:"terrain",label:"Terrain description",placeholder:"open meadow, dense forest, cliff band"},
              {key:"lookFor",label:"Look for / Identify us by",placeholder:"color of gear, signal fire, waving"},
            ].map(({key,label,placeholder})=>(
              <div key={key} style={{marginBottom:"6px"}}>
                <label style={{fontSize:"11px",color:"#4a5c4b",display:"block",marginBottom:"2px"}}>{label}</label>
                <LogInput value={(log.rescueLocation||{})[key]||""} onSave={v=>patchLog(log.id,{rescueLocation:{...log.rescueLocation,[key]:v}})} placeholder={placeholder} style={{...inputSt,fontSize:"12px"}}/>
              </div>
            ))}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"6px"}}>
              <div>
                <label style={{fontSize:"11px",color:"#4a5c4b",display:"block",marginBottom:"2px"}}>Helicopter LZ</label>
                <select value={(log.rescueLocation||{}).lzAvailable||""} onChange={e=>patchLog(log.id,{rescueLocation:{...log.rescueLocation,lzAvailable:e.target.value}})} style={{...inputSt,fontSize:"12px"}}>
                  {["—","Yes","No"].map(o=><option key={o}>{o}</option>)}
                </select>
              </div>
              {log.rescueLocation?.lzAvailable==="Yes"&&(
                <div>
                  <label style={{fontSize:"11px",color:"#4a5c4b",display:"block",marginBottom:"2px"}}>LZ Notes</label>
                  <LogInput value={(log.rescueLocation||{}).lzNotes||""} onSave={v=>patchLog(log.id,{rescueLocation:{...log.rescueLocation,lzNotes:v}})} placeholder="size, surface, obstacles" style={{...inputSt,fontSize:"12px"}}/>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div style={{display:"flex",gap:"6px",marginBottom:"12px"}}>
          {[{key:"pas",label:"Assessment"},{key:"vitals",label:"Vitals"},{key:"reports",label:"Reports"},{key:"ref",label:"Reference"}].map(t=>(
            <button key={t.key} onClick={()=>setTab(t.key)}
              style={{flex:1,background:tab===t.key?"#2a6e22":"#edf0ea",color:tab===t.key?"#ffffff":"#4a5c4b",border:"none",borderRadius:"8px",padding:"8px 4px",fontFamily:mono,fontSize:"11px",fontWeight:tab===t.key?"700":"400",cursor:"pointer",WebkitAppearance:"none"}}>
              {t.label}
            </button>
          ))}
        </div>

        {/* PAS TAB */}
        {tab==="pas"&&(
          <div>
            <div style={{background:"#ffffff",border:"1px solid #cdd4c7",borderRadius:"10px",padding:"12px",marginBottom:"12px"}}>
              <PatientAssessmentTriangle activeStep={activeStep} onStepClick={setActiveStep}/>
            </div>
            <StepPills steps={STEPS} activeStep={activeStep} checks={log.checks} onStepClick={setActiveStep}/>
            <div style={{background:"#ffffff",border:"2px solid "+currentStep.color,borderRadius:"10px",padding:"14px"}}>
              <div style={{display:"flex",alignItems:"baseline",gap:"10px",marginBottom:"12px"}}>
                <span style={{fontSize:"10px",fontWeight:700,letterSpacing:"0.1em",color:currentStep.color}}>{currentStep.tag}</span>
                <span style={{fontSize:"16px",fontWeight:700,color:"#1c2d1e"}}>Step {activeStep+1}: {currentStep.label}</span>
              </div>
              {currentStep.checks.length>0&&(
                <div style={{marginBottom:"14px"}}>
                  <div style={{fontSize:"11px",fontWeight:700,color:"#4a5c4b",letterSpacing:"0.08em",marginBottom:"6px"}}>CHECKLIST</div>
                  {currentStep.checks.map((item,idx)=>{
                    const checked=!!((log.checks[currentStep.id]||{})[idx]);
                    const disabled=isCheckboxDisabled(currentStep.id,idx,log.fields);
                    return (
                      <label key={idx} style={{display:"flex",alignItems:"flex-start",gap:"10px",marginBottom:"8px",cursor:disabled?"default":"pointer"}}>
                        <div onClick={()=>!disabled&&setCheck(log.id,currentStep.id,idx,!checked)}
                          style={{width:"20px",height:"20px",minWidth:"20px",borderRadius:"4px",marginTop:"1px",
                            background:checked?currentStep.color:disabled?"#f0f0ee":"#edf0ea",
                            border:"2px solid "+(checked?currentStep.color:disabled?"#d0d4cc":"#cdd4c7"),
                            display:"flex",alignItems:"center",justifyContent:"center",
                            cursor:disabled?"not-allowed":"pointer",
                            opacity:disabled?0.55:1}}>
                          {checked&&<span style={{color:"#ffffff",fontSize:"13px",lineHeight:1}}>✓</span>}
                        </div>
                        <span style={{fontSize:"13px",color:checked?"#8a9c8b":disabled?"#b0bcb1":"#1c2d1e",textDecoration:checked?"line-through":"none",lineHeight:"1.4"}}>
                          {item}
                          {disabled&&!checked&&<span style={{fontSize:"9px",color:"#aaa",marginLeft:"5px"}}>— fill field first</span>}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
              {currentStep.fields.length>0&&(
                <div>
                  <div style={{fontSize:"11px",fontWeight:700,color:"#4a5c4b",letterSpacing:"0.08em",marginBottom:"8px"}}>FINDINGS</div>
                  {currentStep.fields.map(f=>{
                    const val=((log.fields[currentStep.id]||{})[f.key])||"";
                    const labelEl=<label style={{display:"block",fontSize:"12px",color:"#4a5c4b",marginBottom:"4px"}}>{f.label}</label>;
                    if(f.type==="pain") return(
                      <div key={f.key} style={{marginBottom:"10px"}}>{labelEl}<PainScale value={val} onChange={v=>setField(log.id,currentStep.id,f.key,v)}/></div>
                    );
                    if(f.type==="select") return(
                      <div key={f.key} style={{marginBottom:"8px"}}>{labelEl}
                        <select value={val} onChange={e=>setField(log.id,currentStep.id,f.key,e.target.value)} style={{...inputSt,cursor:"pointer"}}>
                          {f.options.map(o=><option key={o}>{o}</option>)}
                        </select>
                      </div>
                    );
                    if(f.type==="textarea") return(
                      <div key={f.key} style={{marginBottom:"8px"}}>{labelEl}
                        <LogTextarea value={val} onSave={v=>setField(log.id,currentStep.id,f.key,v)} hint={f.hint} rows={3} style={{...inputSt,resize:"vertical",minHeight:"64px"}}/>
                      </div>
                    );
                    return(
                      <div key={f.key} style={{marginBottom:"8px"}}>{labelEl}
                        <LogInput type={f.type||"text"} value={val} onSave={v=>setField(log.id,currentStep.id,f.key,v)} hint={f.hint} style={inputSt}/>
                      </div>
                    );
                  })}
                </div>
              )}
              <div style={{display:"flex",gap:"8px",marginTop:"14px"}}>
                {activeStep>0&&(
                  <button onClick={()=>setActiveStep(s=>s-1)}
                    style={{flex:1,background:"#edf0ea",border:"none",borderRadius:"8px",padding:"10px",fontFamily:mono,fontSize:"12px",color:"#4a5c4b",cursor:"pointer",WebkitAppearance:"none"}}>
                    ← Previous
                  </button>
                )}
                {activeStep<STEPS.length-1&&(
                  <button onClick={()=>setActiveStep(s=>s+1)}
                    style={{flex:1,background:currentStep.color,border:"none",borderRadius:"8px",padding:"10px",fontFamily:mono,fontSize:"12px",color:"#ffffff",fontWeight:700,cursor:"pointer",WebkitAppearance:"none"}}>
                    Next Step →
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* VITALS TAB */}
        {tab==="vitals"&&(
          <div>
            {log.vitals.map((v,i)=>(
              <div key={i} style={{background:"#ffffff",border:"1px solid #cdd4c7",borderRadius:"8px",padding:"12px",marginBottom:"8px"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"8px"}}>
                  <div style={{fontSize:"12px",fontWeight:700,color:"#1c2d1e"}}>Set {i+1} — {v.time||"—"}</div>
                  <button onClick={()=>removeVital(log.id,i)} style={{background:"none",border:"none",color:"#8a9c8b",cursor:"pointer",fontSize:"14px"}}>×</button>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"6px"}}>
                  {VITAL_FIELDS.map(vf=>(
                    <div key={vf.key}>
                      <div style={{fontSize:"10px",color:"#8a9c8b",marginBottom:"1px"}}>{vf.fullLabel}</div>
                      <div style={{fontSize:"13px",color:v[vf.key]?"#1c2d1e":"#8a9c8b",fontFamily:mono}}>{v[vf.key]||"—"}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <div style={{background:"#ffffff",border:"2px dashed #cdd4c7",borderRadius:"8px",padding:"12px",marginBottom:"8px"}}>
              <div style={{fontSize:"12px",fontWeight:700,color:"#4a5c4b",marginBottom:"10px",letterSpacing:"0.06em"}}>NEW VITAL SET</div>
              <div style={{marginBottom:"8px"}}>
                <label style={{fontSize:"11px",color:"#4a5c4b",display:"block",marginBottom:"3px"}}>Time</label>
                <input value={vitalDraft.time||""} onChange={e=>setVitalDraft(v=>({...v,time:e.target.value}))} placeholder="" style={{...inputSt,fontSize:"12px"}}/>
                <div style={hintSt}>e.g. 07:35 AM</div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"6px",marginBottom:"10px"}}>
                {VITAL_FIELDS.map(vf=>(
                  <div key={vf.key}>
                    <label style={{fontSize:"11px",color:"#4a5c4b",display:"block",marginBottom:"2px"}}>{vf.label} — {vf.fullLabel}</label>
                    <input value={vitalDraft[vf.key]||""} onChange={e=>setVitalDraft(v=>({...v,[vf.key]:e.target.value}))} placeholder="" style={{...inputSt,fontSize:"12px"}}/>
                    {vf.hint&&<div style={hintSt}>{vf.hint}</div>}
                  </div>
                ))}
              </div>
              <button onClick={()=>addVital(log.id)} style={{...btnPrimary,width:"100%",fontSize:"12px",padding:"10px"}}>+ ADD VITAL SET</button>
            </div>
            {log.vitals.length>=2&&(
              <div style={{background:"#e6f4e2",border:"1px solid #2a6e22",borderRadius:"8px",padding:"10px 12px",fontSize:"11px",color:"#2a6e22"}}>
                ✓ {log.vitals.length} vital sets recorded — trend data available for reports.
              </div>
            )}
          </div>
        )}

        {/* REPORTS TAB */}
        {tab==="reports"&&(
          <div>
            <div style={{background:"#ffffff",border:"1px solid #cdd4c7",borderRadius:"8px",marginBottom:"12px",overflow:"hidden"}}>
              <div style={{background:"#ffebee",padding:"10px 14px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div>
                  <div style={{fontSize:"13px",fontWeight:700,color:"#b71c1c"}}>📞 Verbal SOAP Report</div>
                  <div style={{fontSize:"11px",color:"#4a5c4b",marginTop:"1px"}}>Radio / rescue call script</div>
                </div>
                <button onClick={()=>copyText(verbalReport,setVerbalCopy)}
                  style={{background:"#b71c1c",border:"none",borderRadius:"6px",padding:"6px 12px",color:"#ffffff",fontFamily:mono,fontSize:"11px",fontWeight:700,cursor:"pointer",WebkitAppearance:"none"}}>
                  {verbalCopy||"Copy"}
                </button>
              </div>
              <pre style={{margin:0,padding:"12px 14px",fontSize:"11px",fontFamily:mono,color:"#1c2d1e",whiteSpace:"pre-wrap",lineHeight:"1.6",maxHeight:"320px",overflowY:"auto",background:"#ffffff"}}>
                {verbalReport}
              </pre>
            </div>
            <div style={{background:"#ffffff",border:"1px solid #cdd4c7",borderRadius:"8px",overflow:"hidden"}}>
              <div style={{background:"#eaf2fb",padding:"10px 14px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div>
                  <div style={{fontSize:"13px",fontWeight:700,color:"#1a5276"}}>📋 Written SOAP Note</div>
                  <div style={{fontSize:"11px",color:"#4a5c4b",marginTop:"1px"}}>Structured patient record</div>
                </div>
                <button onClick={()=>copyText(writtenReport,setWrittenCopy)}
                  style={{background:"#1a5276",border:"none",borderRadius:"6px",padding:"6px 12px",color:"#ffffff",fontFamily:mono,fontSize:"11px",fontWeight:700,cursor:"pointer",WebkitAppearance:"none"}}>
                  {writtenCopy||"Copy"}
                </button>
              </div>
              <pre style={{margin:0,padding:"12px 14px",fontSize:"11px",fontFamily:mono,color:"#1c2d1e",whiteSpace:"pre-wrap",lineHeight:"1.6",maxHeight:"320px",overflowY:"auto",background:"#ffffff"}}>
                {writtenReport}
              </pre>
            </div>
          </div>
        )}

        {/* REFERENCE TAB */}
        {tab==="ref"&&(
          <div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px",marginBottom:"8px"}}>
              {[{label:"Protocols",sub:PROTOCOLS.length+" critical guides",color:"#b71c1c",bg:"#ffebee",border:"#b71c1c",onClick:()=>setScreen("protocols")},
                {label:"Ailments",sub:AILMENTS.length+" conditions",color:"#1a5276",bg:"#eaf2fb",border:"#1a5276",onClick:()=>setScreen("ailments")},
                {label:"Evac Guide",sub:"Emergency / urgent / monitor",color:"#6a1b9a",bg:"#f3e5f5",border:"#6a1b9a",onClick:()=>setScreen("evac")},
                {label:"About",sub:"Version & disclaimer",color:"#4a5c4b",bg:"#edf0ea",border:"#cdd4c7",onClick:()=>setScreen("about")},
              ].map(tile=>(
                <button key={tile.label} onClick={tile.onClick}
                  style={{background:tile.bg,border:"1px solid "+tile.border,borderRadius:"8px",padding:"14px 10px",textAlign:"left",cursor:"pointer",WebkitAppearance:"none"}}>
                  <div style={{fontSize:"12px",fontWeight:700,color:tile.color}}>{tile.label}</div>
                  <div style={{fontSize:"10px",color:"#8a9c8b",marginTop:"2px"}}>{tile.sub}</div>
                </button>
              ))}
            </div>
            <div style={{background:"#ffffff",border:"1px solid #cdd4c7",borderRadius:"8px",padding:"12px",marginTop:"4px"}}>
              <div style={{fontSize:"11px",fontWeight:700,color:"#4a5c4b",letterSpacing:"0.08em",marginBottom:"6px"}}>ENCOUNTER NOTES</div>
              <LogTextarea value={log.notes} onSave={v=>patchLog(log.id,{notes:v})} placeholder="Free-text notes, observations, anything not captured above..." rows={5} style={{...inputSt,resize:"vertical",minHeight:"80px"}}/>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
