"use client";

import { useState, useEffect } from "react";

/* ══════════════════════════════════════════════════════════════════════════════
   PALETTE — light clinical theme
══════════════════════════════════════════════════════════════════════════════ */
const C = {
  bg:           "#f3f5f2",
  surface:      "#ffffff",
  raised:       "#edf0ea",
  border:       "#cdd4c7",
  accent:       "#2a6e22",
  accentLight:  "#e6f4e2",
  warn:         "#c45000",
  warnLight:    "#fff3e0",
  danger:       "#b71c1c",
  dangerLight:  "#ffebee",
  blue:         "#1a5276",
  blueLight:    "#eaf2fb",
  purple:       "#6a1b9a",
  purpleLight:  "#f3e5f5",
  text:         "#1c2d1e",
  textDim:      "#4a5c4b",
  textFaint:    "#8a9c8b",
  white:        "#ffffff",
};
const mono = "ui-monospace,'Courier New',monospace";

/* ══════════════════════════════════════════════════════════════════════════════
   PAS STEPS
══════════════════════════════════════════════════════════════════════════════ */
const PAS = [
  { id:"ssu",    tag:"SCENE",     color:C.warn,   label:"Scene Size-Up",
    items:["Scene safe?","MOI / NOI identified","# patients","PPE on","Resources assessed"] },
  { id:"resp",   tag:"PRIMARY",   color:C.danger, label:"Responsiveness",
    items:["Tap & shout response","AVPU level determined","Airway open?","Breathing present?"] },
  { id:"abc",    tag:"PRIMARY",   color:C.danger, label:"ABCs + Bleeding",
    items:["Severe bleeding controlled","Pulses present","Skin color / temp / moisture","Shock signs assessed"] },
  { id:"sample", tag:"SECONDARY", color:C.blue,   label:"SAMPLE History",
    items:["Signs & symptoms","Allergies","Medications","Pertinent history","Last food/drink","Events leading up"] },
  { id:"vitals", tag:"SECONDARY", color:C.blue,   label:"Vital Signs",
    items:["HR rate & quality","RR rate & quality","Blood pressure / perfusion","SCTM","LOR (A+O×?)"] },
  { id:"exam",   tag:"SECONDARY", color:C.blue,   label:"Head-to-Toe Exam",
    items:["Head / skull / face","Neck / c-spine","Chest / breath sounds","Abdomen / pelvis","Extremities DCAP-BTLS","Posterior"] },
  { id:"evac",   tag:"EVAC",      color:C.purple, label:"Evac Decision",
    items:["Stable or unstable?","Walk-out capable?","Distance to care","Weather window","Emergency or planned?"] },
];

/* ══════════════════════════════════════════════════════════════════════════════
   PAS DATA ENTRY FIELDS
══════════════════════════════════════════════════════════════════════════════ */
const PAS_FIELDS = {
  ssu: [
    { key:"numPatients", label:"# Patients",      type:"number",   placeholder:"1" },
    { key:"moi",         label:"MOI / NOI",        type:"text",     placeholder:"mechanism or nature of injury" },
    { key:"sceneSafe",   label:"Scene Safety",     type:"text",     placeholder:"hazards present, control measures" },
    { key:"resources",   label:"Resources",        type:"text",     placeholder:"kit, litter, comms, other responders" },
  ],
  resp: [
    { key:"avpu",      label:"AVPU Level",   type:"select",   options:["—","Alert","Verbal","Pain","Unresponsive"] },
    { key:"airway",    label:"Airway",        type:"select",   options:["—","Open","Compromised","Obstructed"] },
    { key:"breathing", label:"Breathing",     type:"select",   options:["—","Present — normal","Present — labored","Absent"] },
    { key:"notes",     label:"Notes",         type:"text",     placeholder:"additional findings" },
  ],
  abc: [
    { key:"bleeding",  label:"Bleeding Controlled",         type:"select", options:["—","Yes","No","N/A"] },
    { key:"pulse",     label:"Pulse",                       type:"select", options:["—","Strong","Weak","Thready","Absent"] },
    { key:"sctm",      label:"Skin (Color / Temp / Moisture)", type:"text", placeholder:"pink / warm / dry" },
    { key:"shock",     label:"Shock Signs",                 type:"select", options:["—","None","Present"] },
    { key:"notes",     label:"Notes",                       type:"text",   placeholder:"" },
  ],
  sample: [
    { key:"signs",   label:"Signs & Symptoms",  type:"textarea", placeholder:"chief complaint and objective findings" },
    { key:"allergy", label:"Allergies",          type:"text",     placeholder:"NKDA or list allergens" },
    { key:"meds",    label:"Medications",        type:"text",     placeholder:"current medications and doses" },
    { key:"history", label:"Pertinent History",  type:"textarea", placeholder:"relevant medical history" },
    { key:"last",    label:"Last Food / Drink",  type:"text",     placeholder:"time and what" },
    { key:"events",  label:"Events Leading Up",  type:"textarea", placeholder:"what happened before the incident" },
  ],
  vitals: [],
  exam: [
    { key:"head",        label:"Head / Skull / Face",   type:"text",     placeholder:"DCAP-BTLS, pupils PEARL?" },
    { key:"neck",        label:"Neck / C-spine",        type:"text",     placeholder:"midline pain, JVD, trachea" },
    { key:"chest",       label:"Chest / Breath Sounds", type:"text",     placeholder:"equal, clear; paradoxical?" },
    { key:"abdomen",     label:"Abdomen / Pelvis",      type:"text",     placeholder:"tenderness, rigidity, instability" },
    { key:"extremities", label:"Extremities",           type:"textarea", placeholder:"each limb: CSM, DCAP-BTLS" },
    { key:"posterior",   label:"Posterior",             type:"text",     placeholder:"spine TTP, contusions, back" },
    { key:"notes",       label:"Additional Findings",   type:"textarea", placeholder:"" },
  ],
  evac: [
    { key:"status",   label:"Patient Status",   type:"select",   options:["—","Stable","Unstable"] },
    { key:"walkout",  label:"Walk-Out Capable", type:"select",   options:["—","Yes","No","Unknown"] },
    { key:"distance", label:"Distance to Care", type:"text",     placeholder:"miles or travel time to hospital" },
    { key:"weather",  label:"Weather",          type:"text",     placeholder:"current and forecast window" },
    { key:"type",     label:"Evacuation Type",  type:"select",   options:["—","Emergency — call now","Urgent — within hours","Planned walk-out","Monitor in place"] },
    { key:"plan",     label:"Evacuation Plan",  type:"textarea", placeholder:"route, resources, comms plan" },
  ],
};

/* ══════════════════════════════════════════════════════════════════════════════
   VITAL FIELDS
══════════════════════════════════════════════════════════════════════════════ */
const VITAL_FIELDS = [
  { key:"lor",  label:"LOR",  placeholder:"A+O×4" },
  { key:"hr",   label:"HR",   placeholder:"bpm" },
  { key:"rr",   label:"RR",   placeholder:"brpm" },
  { key:"bp",   label:"BP",   placeholder:"sys/dia" },
  { key:"sctm", label:"SCTM", placeholder:"P/W/D" },
];

/* ══════════════════════════════════════════════════════════════════════════════
   PROTOCOLS
══════════════════════════════════════════════════════════════════════════════ */
const PROTOCOLS = [
  { id:"shock", flag:"URGENT", title:"Shock / Hypoperfusion",
    signs:["Pale, cool, clammy skin","HR > 100 or weak/thready","RR > 24 or labored","AMS / restless / anxious","CRT > 2 sec"],
    tx:["Control bleeding — direct pressure","Supine or legs elevated (no spine concern)","Insulate from ground + overhead","Keep patient still & calm","NPO","Evacuate immediately"] },
  { id:"spine", flag:"PROTOCOL", title:"Spinal Clearance",
    signs:["Reliable patient? (no AMS, no intox, no distracting injury)","Mechanism with axial load?","Midline neck/back pain or tenderness?","Neuro deficit (numbness/tingling/weakness)?"],
    tx:["ALL 4 must be NO to clear spine","Any YES → full immobilization","Immobilize in position found","Pad voids; secure head last","Evacuate — do not walk"] },
  { id:"anaph", flag:"URGENT", title:"Anaphylaxis",
    signs:["Hives / flushing / itching","Throat tightness / stridor","Wheezing / SOB","Hypotension / weak pulse","Vomiting / cramping"],
    tx:["Epi auto-injector IM mid-outer thigh","Repeat epi q5–15 min if no improvement","Diphenhydramine 25–50 mg if available","Supine if hypotensive / upright if SOB","Monitor airway closely","Evacuate immediately after epi"] },
  { id:"head", flag:"MONITOR", title:"Head Injury / TBI",
    signs:["LOC at any point?","Amnesia before or after?","Persistent headache","Repeated vomiting","Pupils unequal / sluggish","AMS / combative / personality change"],
    tx:["Any LOC or AMS → spine precautions","Serial neuro checks q15 min","Any decline → immediate evac","NPO if AMS","Keep warm; monitor airway","Do NOT give NSAIDs or opioids"] },
  { id:"hypo", flag:"PROTOCOL", title:"Hypothermia",
    signs:["Mild: shivering, clumsy, poor judgment","Moderate: stops shivering, rigid, confused","Severe: no shivering, rigid, faint pulse"],
    tx:["Handle gently — no rough movement (VFib risk)","Remove wet clothing; cut if needed","Insulate: pad + bag + vapor barrier","Heat trunk only — no extremity heat packs","Warm sweet fluids if alert + can swallow","Severe → horizontal evac"] },
  { id:"wound", flag:"PROTOCOL", title:"Wound Management",
    signs:["Mechanism: crush / puncture / lac / avulsion","Contamination level","Time since injury","Distal NV intact?"],
    tx:["Irrigate: 60 mL syringe, 18g tip, high pressure, clean water","60–100 mL per cm wound length","Debride visible debris gently","Pack deep wounds; do NOT close contaminated","Dress & splint if near joint","Evac if: joint involved, infection signs, NV deficit"] },
  { id:"lightning", flag:"URGENT", title:"Lightning Strike",
    signs:["Scene: active storm? Scatter group first","Entry/exit burns possible","Cardiac arrest common — CPR indicated","Keraunoparalysis (temp paralysis)","AMS, deafness, eye damage"],
    tx:["Safe scene — move from strike zone","Triage REVERSE: treat apparent deaths first","CPR if pulseless — high success rate","Spine precautions","Monitor closely 24 h","All struck patients evacuate"] },
];

/* ══════════════════════════════════════════════════════════════════════════════
   AILMENTS DATABASE
══════════════════════════════════════════════════════════════════════════════ */
const AILMENTS = [
  { id:"snakebite", cat:"BITES & STINGS", severity:"high", evac:true, img:"snake",
    title:"Snakebite",
    signs:["1–2 fang puncture marks","Local pain, swelling, bruising within minutes","Nausea, vomiting, metallic taste","Numbness of mouth/face","Severe: hypotension, neuro deficits, coagulopathy"],
    tx:["Keep patient calm and still — movement spreads venom","Immobilize bitten limb at or below heart level","Remove rings/watches/tight clothing near bite","Mark swelling border + time every 15 min","Do NOT cut, suck, tourniquet, or apply ice","Evacuate immediately — antivenom is definitive treatment"],
    avoid:"No tourniquet. No electric shock. No incisions. No ice." },
  { id:"spider", cat:"BITES & STINGS", severity:"moderate", evac:true, img:"spider",
    title:"Spider Bite (Black Widow / Brown Recluse)",
    signs:["Black widow: muscle cramps, rigidity, severe abdominal pain, sweating within 1 hr","Brown recluse: painless initially then spreading necrotic ulcer over 24–72 h","Both: nausea, headache, low-grade fever"],
    tx:["Clean wound with soap and water","Ice pack 10 min on / 10 min off for black widow","Diphenhydramine for local reaction if available","Mark lesion border + time","Evacuate — both can progress severely"],
    avoid:"Do not squeeze wound. Do not apply heat to brown recluse bite." },
  { id:"tick", cat:"BITES & STINGS", severity:"low", evac:false, img:"tick",
    title:"Tick Removal & Disease Watch",
    signs:["Tick found embedded in skin","Bull's-eye rash (Lyme) appearing hours–days later","Flu symptoms post-removal: fever, chills, muscle ache","Tick paralysis: ascending weakness (rare)"],
    tx:["Fine-tipped tweezers: grasp as close to skin as possible","Pull straight out with steady even pressure — do not twist","Clean site with antiseptic","Save tick in sealed bag for identification","Watch for rash or flu symptoms 3–30 days post-bite","Seek care if rash appears or symptoms develop"],
    avoid:"No Vaseline, nail polish, or heat to encourage tick removal." },
  { id:"bee", cat:"BITES & STINGS", severity:"low", evac:false, img:"bee",
    title:"Bee / Wasp Sting",
    signs:["Immediate burning pain at sting site","Local swelling, redness, itching","Watch for systemic: throat tightness, SOB, dizziness"],
    tx:["Scrape stinger out — do not pinch or squeeze","Ice pack to reduce swelling","Diphenhydramine 25–50 mg for local reaction if available","Monitor 30 min for anaphylaxis","If systemic signs: treat as anaphylaxis immediately"],
    avoid:"Do not pinch stinger — injects more venom." },
  { id:"aquatic", cat:"BITES & STINGS", severity:"moderate", evac:false,
    title:"Aquatic Puncture (Stingray / Catfish / Sea Urchin)",
    signs:["Immediate intense pain at puncture site","Local swelling and redness","Stingray: barb may be embedded","Sea urchin: spines may break off under skin"],
    tx:["Immerse in hot water (~45°C) for 30–90 min — denatures protein toxin","Remove visible spines/barbs with tweezers","Irrigate wound thoroughly after heat soak","Monitor for infection 24–48 h","Evac if barb deeply embedded or systemic reaction"],
    avoid:"Do not break off sea urchin spines — may shatter deeper into tissue." },
  { id:"scorpion", cat:"BITES & STINGS", severity:"moderate", evac:true, img:"scorpion",
    title:"Scorpion Sting",
    signs:["Immediate burning pain at sting site","Local numbness/tingling spreading from site","Systemic (bark scorpion): muscle twitching, drooling, abnormal eye movement","Children and elderly at highest risk"],
    tx:["Clean wound; ice pack for local pain","Monitor closely for systemic symptoms 1–2 hr","Diphenhydramine for local allergic reaction if available","Any systemic signs — evacuate immediately","Children stung in scorpion-endemic areas — evacuate as precaution"],
    avoid:"Do not apply tourniquet or attempt to suck out venom." },
  { id:"burn_thermal", cat:"BURNS", severity:"moderate", evac:true, img:"burn",
    title:"Thermal Burn (Fire / Scalding)",
    signs:["Superficial (1st): red, dry, painful — no blisters","Partial thickness (2nd): blisters, very painful, wet appearance","Full thickness (3rd): white/brown/black, leathery — painless center","Inhalation: singed nasal hair, hoarse voice, soot in mouth"],
    tx:["Cool with room-temp water 10–20 min — do NOT use ice","Remove jewelry/clothing from burned area if not adhered","Cover loosely with clean dry dressing","Partial thickness > palm size OR face/hands/genitals/joints — evacuate","Inhalation suspected — immediate evacuation","Do NOT pop blisters or apply butter/oils"],
    avoid:"No ice, butter, toothpaste, or oil on burns." },
  { id:"burn_sun", cat:"BURNS", severity:"low", evac:false,
    title:"Sunburn",
    signs:["Red, painful, warm skin","Blistering in severe cases","Sun poisoning: fever, chills, nausea, headache"],
    tx:["Get out of sun; cover with lightweight clothing","Cool compresses to affected areas","Oral hydration — sun poisoning causes significant fluid loss","Ibuprofen for pain + inflammation if available","Aloe vera if available","Blistering + fever — treat as partial thickness burn and evacuate"],
    avoid:"Do not pop blisters. Avoid further sun exposure." },
  { id:"burn_chem", cat:"BURNS", severity:"high", evac:true,
    title:"Chemical Burn",
    signs:["Burning pain on skin contact","Skin discoloration — red, white, or brown","May worsen over minutes to hours","Eye involvement: tearing, severe pain, vision change"],
    tx:["Irrigate immediately with large amounts of clean water — minimum 20 min","Remove contaminated clothing (use gloves)","Do NOT attempt to neutralize","Cover loosely with clean dressing after irrigation","Eyes involved: irrigate continuously; evacuate immediately","All significant chemical burns: evacuate"],
    avoid:"Never neutralize chemicals on skin. No vinegar or baking soda on contact burns." },
  { id:"sprain", cat:"FALLS & FRACTURES", severity:"low", evac:false,
    title:"Sprain / Strain",
    signs:["Mechanism: twist, overstretch, or awkward landing","Pain, swelling, bruising around joint","Intact weight-bearing distinguishes sprain from fracture","No bony deformity or crepitus"],
    tx:["RICE: Rest, Ice (20 min on/off), Compression wrap, Elevate","NSAIDs (ibuprofen) if available","Reassess weight-bearing after 20 min rest","Able to walk with minimal pain — may continue with support","Unable to weight-bear, deformity, or significant swelling — splint + evacuate"],
    avoid:"Rule out fracture before assuming sprain. Do not tape over severe swelling." },
  { id:"fracture", cat:"FALLS & FRACTURES", severity:"moderate", evac:true,
    title:"Fracture / Suspected Fracture",
    signs:["Significant force mechanism: fall, crush, impact","Point tenderness directly over bone","Deformity, angulation, or shortening","Crepitus (grinding sensation)","Unable to bear weight","Open fracture: bone visible or wound near break site"],
    tx:["Splint in position found — immobilize joint above and below fracture","Check and document CSM before and after splinting","Pad splint well; secure snugly but not tight","Open fracture: cover with moist sterile dressing, do not push bone back","Femur fracture: significant blood loss risk — treat proactively for shock","Evacuate all fractures"],
    avoid:"Do not straighten angulated fracture unless distal NV is compromised and evac is delayed." },
  { id:"dislocation", cat:"FALLS & FRACTURES", severity:"moderate", evac:true,
    title:"Joint Dislocation",
    signs:["Significant force or awkward fall mechanism","Visible deformity at joint","Severe pain with muscle spasm","Loss of normal range of motion","Check distal CSM — nerve/vessel compromise is emergency"],
    tx:["Check distal CSM immediately and document","Shoulder: if trained, attempt reduction with traction-countertraction within 30 min","Patella: gentle extension if trained","All others: splint in position found","Post-reduction: recheck CSM, splint, evacuate","Do not attempt if fracture suspected or over 30 min old"],
    avoid:"Do not reduce knee, hip, elbow, or ankle dislocations without specific training." },
  { id:"headfall", cat:"FALLS & FRACTURES", severity:"high", evac:true,
    title:"Fall from Height / High-Energy Trauma",
    signs:["Fall > standing height or high-speed impact","AMS or LOC at any point","Midline spine pain or tenderness","Chest or abdominal tenderness","Multiple injuries common"],
    tx:["Full spine precautions until cleared","Primary survey first — manage life threats","Assume multi-system injury until proven otherwise","Serial vitals q5 min","Treat proactively for shock","Emergency evacuation"] },
  { id:"heat_ex", cat:"ENVIRONMENTAL", severity:"moderate", evac:true,
    title:"Heat Exhaustion",
    signs:["Heavy sweating","Pale, cool, clammy skin","Weakness, dizziness, headache, nausea","HR > 100, RR elevated","Normal mental status — if AMS, treat as heat stroke"],
    tx:["Move to cool shade immediately","Remove excess clothing","Lay supine, elevate legs","Cool wet cloths to neck, armpits, and groin","Oral rehydration — sips not gulps","Improving in 30 min + normal MS — may monitor carefully","Any AMS — treat as heat stroke immediately"],
    avoid:"Any altered mental status = heat stroke. Do not delay cooling." },
  { id:"heat_stroke", cat:"ENVIRONMENTAL", severity:"high", evac:true,
    title:"Heat Stroke",
    signs:["Hot skin — may be wet or dry","Altered mental status: confusion, combative, or unresponsive","Core temp > 40°C (104°F) if measurable","Rapid HR and RR","Nausea, vomiting, possible seizure"],
    tx:["COOL FIRST, TRANSPORT SECOND — cooling is definitive treatment","Strip clothing; immerse in cold water or ice packs to neck/axilla/groin","Fan aggressively — evaporation dramatically speeds cooling","Continue active cooling during evacuation","Monitor airway — vomiting risk if AMS","Emergency evacuation — heat stroke is life-threatening"],
    avoid:"Do not give oral fluids if AMS present — aspiration risk." },
  { id:"altitude", cat:"ENVIRONMENTAL", severity:"moderate", evac:true,
    title:"Altitude Illness (AMS / HACE / HAPE)",
    signs:["AMS: headache + nausea/fatigue/dizziness at > 2500 m","HACE: AMS + ataxia (stumbling) and/or severe AMS","HAPE: dry cough progressing to wet cough, SOB at rest, crackles, cyanosis"],
    tx:["AMS: stop ascent, rest, hydrate, ibuprofen for headache","Do not ascend until symptom-free for 24 h","HACE/HAPE: DESCEND IMMEDIATELY — minimum 300–1000 m","Supplemental O2 if available","Gamow bag if available","Dexamethasone (HACE) or Nifedipine (HAPE) if trained and available","HACE/HAPE: emergency evacuation"],
    avoid:"Never ascend with AMS symptoms. Descent is the only definitive treatment." },
  { id:"frostnip", cat:"ENVIRONMENTAL", severity:"low", evac:false,
    title:"Frostnip",
    signs:["Skin pale, cold, and numb","Tissue remains soft and pliable throughout","Rewarms quickly with body heat","No blisters form"],
    tx:["Rewarm with body heat — axilla, abdomen, or warm hands of rescuer","Do NOT rub — mechanical damage to tissue","Cover and insulate well after rewarming","Prevent re-exposure","Monitor closely for progression to frostbite"] },
  { id:"frostbite", cat:"ENVIRONMENTAL", severity:"high", evac:true, img:"frostbite",
    title:"Frostbite",
    signs:["Superficial: white/gray waxy skin, firm surface but soft underneath","Deep: white/gray skin, completely hard, wooden texture","Post-thaw: clear blisters (superficial) or bloody blisters (deep)","Complete numbness in affected area"],
    tx:["Do NOT rewarm if any risk of refreezing — refrozen tissue causes far greater damage","Protect from trauma; pad and wrap loosely","Rewarm only with definitive shelter guaranteed: 40–42°C water bath for 15–30 min","Expect severe pain on rewarming — pain is a good sign","Ibuprofen if available","Do NOT walk on thawed feet","Evacuate all frostbite cases"],
    avoid:"Never rewarm if refreezing is possible. No dry heat. No rubbing." },
  { id:"dehydration", cat:"ENVIRONMENTAL", severity:"low", evac:false,
    title:"Dehydration",
    signs:["Thirst, dry mouth and lips","Dark urine or decreased urine output","Headache, fatigue, decreased performance","Dizziness on standing","Skin tenting on pinch test","Severe: AMS, rapid HR, hypotension"],
    tx:["Oral rehydration — water + electrolytes","500 mL over 30 min for mild dehydration","Sports drink, ORS, or dilute juice if available","Salty snack + water is an effective field solution","Severe (AMS or unable to drink) — IV fluids + evacuation","Monitor urine output and color to guide ongoing rehydration"] },
  { id:"gi_illness", cat:"GI ILLNESS", severity:"moderate", evac:false,
    title:"GI Illness / Gastroenteritis",
    signs:["Nausea, vomiting, diarrhea","Cramping abdominal pain","Possible low-grade fever","Onset 1–6 h: likely toxin; 6–24 h: likely bacterial"],
    tx:["Oral rehydration — small frequent sips of water or ORS","BRAT diet when tolerated: banana, rice, applesauce, toast","Ondansetron (Zofran) for vomiting if available","Rest and monitor vitals","Evac if: cannot keep fluids down 24 h, blood in stool, high fever, severe pain, or AMS"],
    avoid:"Do not give anti-diarrheals if bloody diarrhea or high fever present." },
  { id:"giardia", cat:"GI ILLNESS", severity:"moderate", evac:true,
    title:"Giardia / Waterborne Illness",
    signs:["Onset 1–3 weeks after exposure to untreated water","Explosive, watery, foul-smelling diarrhea","Bloating, cramping, gas","No fever typically","Prolonged course without treatment"],
    tx:["Aggressive oral rehydration throughout","Treat all water going forward: boil, filter, or chemically treat","Requires prescription antibiotics (metronidazole or tinidazole) — seek care","Evacuate for treatment","Preventable: treat all backcountry water regardless of source appearance"] },
  { id:"eye_foreign", cat:"EYE INJURIES", severity:"low", evac:false,
    title:"Foreign Body in Eye",
    signs:["Gritty or scratchy sensation in eye","Tearing, redness, photophobia","Visible foreign body on conjunctiva","Pain worsened with blinking"],
    tx:["Do NOT rub eye","Irrigate with clean water or saline — tilt head, flush from inner to outer corner","Lift upper lid and inspect; use moist cotton swab for visible loose debris","If pain persists after irrigation — patch, protect, evacuate"],
    avoid:"Never attempt to remove embedded objects from the cornea or globe." },
  { id:"eye_trauma", cat:"EYE INJURIES", severity:"high", evac:true,
    title:"Eye Trauma / Open Globe",
    signs:["Mechanism: stick, branch, sharp object, or projectile","Visible laceration on eye or irregular pupil shape","Prolapsing tissue from globe","Sudden vision loss","Severe pain or unexpected painlessness"],
    tx:["Do NOT touch, irrigate, or apply any pressure to the globe","Place rigid eye shield over eye — no direct contact","Tape shield in place; do not compress","Cover other eye to reduce consensual movement","Keep patient calm — avoid Valsalva","Emergency evacuation"],
    avoid:"No pressure patching. No irrigation of open globe. No eye drops." },
  { id:"asthma", cat:"RESPIRATORY", severity:"moderate", evac:true,
    title:"Asthma Attack / Bronchospasm",
    signs:["Expiratory wheeze or silent chest (critical — no air movement)","Difficulty breathing, chest tightness, SOB","Use of accessory muscles","Cyanosis in severe cases","Triggers: cold air, exertion, allergen, smoke"],
    tx:["Sit upright — do not lay patient down","Albuterol MDI: 4–8 puffs via spacer every 20 min ×3 if available","Pursed-lip breathing with calm reassurance","Keep warm — cold air worsens bronchospasm","Mild improvement in 20 min in known asthmatic — may monitor","No improvement, silent chest, or cyanosis — emergency evacuation"] },
  { id:"plant_contact", cat:"SKIN & ALLERGIC", severity:"low", evac:false, img:"rash",
    title:"Contact Dermatitis (Poison Ivy / Oak / Sumac)",
    signs:["Linear streaks of intense itching redness along contact lines","Vesicles and blisters in streaks or patches","Onset 12–72 h after plant contact","Fluid from blisters does NOT spread the rash"],
    tx:["Wash skin with soap and water ASAP — within 10 min is most effective","Rinse very thoroughly; wash all clothing and gear","Hydrocortisone cream to affected areas if available","Diphenhydramine orally for itch","Cool compresses for relief","Evac if: face or eye involvement, widespread rash, or severe swelling"],
    avoid:"Urushiol oil on gear can re-expose. Wash everything." },
  { id:"allergic_rx", cat:"SKIN & ALLERGIC", severity:"moderate", evac:true,
    title:"Allergic Reaction (Non-Anaphylactic)",
    signs:["Hives (urticaria) — raised, itchy welts on skin","Flushing and itching without airway or blood pressure symptoms","No wheezing, throat tightness, or hypotension","May progress to anaphylaxis — monitor closely"],
    tx:["Diphenhydramine 25–50 mg orally if available","Remove suspected allergen (food, plant, insect product)","Monitor every 15 min for 1 hour for systemic progression","Keep epinephrine immediately accessible","If worsening or any systemic signs develop — treat as anaphylaxis immediately"] },
  { id:"blister", cat:"MUSCULOSKELETAL", severity:"low", evac:false,
    title:"Blister Management",
    signs:["Friction hotspot progressing to fluid-filled blister","Pain with continued activity","Risk of rupture and infection if untreated"],
    tx:["Donut pad (moleskin or foam) around the blister — NOT directly over it","Large, tense blister: sterilize needle, drain at edge only, do NOT remove blister roof","Apply antibiotic ointment + non-stick dressing","Change dressing daily; watch for infection signs","Ruptured blister: trim loose skin carefully, treat as open wound"] },
  { id:"overuse", cat:"MUSCULOSKELETAL", severity:"low", evac:false,
    title:"Overuse / Tendinopathy",
    signs:["Gradual onset pain that increases with activity","Morning stiffness or stiffness after rest","Point tenderness along tendon","No acute mechanism of injury"],
    tx:["Rest from aggravating activity","Ice 20 min on/off ×3 during acute phase","Ibuprofen if available","Gentle stretching and eccentric loading if tolerated","Tape or brace for continued activity if necessary","Evac if: unable to weight-bear, severe pain, or swelling suggesting rupture"] },
  { id:"seizure", cat:"NEUROLOGICAL", severity:"high", evac:true,
    title:"Seizure",
    signs:["Tonic-clonic: whole body stiffening followed by jerking","Post-ictal phase: prolonged confusion and fatigue after episode","May bite tongue or be incontinent","First seizure always requires medical evaluation"],
    tx:["Protect from injury — clear area of hazards; do NOT restrain patient","Turn on side (recovery position) during and after","Do NOT put anything in mouth during seizure","Time the seizure — > 5 min = status epilepticus, emergency","After: recovery position, monitor airway, assess LOR","First seizure, prolonged, or post-ictal AMS — evacuate"] },
  { id:"diabetic", cat:"NEUROLOGICAL", severity:"moderate", evac:true,
    title:"Diabetic Emergency / Hypoglycemia",
    signs:["Sudden onset: shaky, sweaty, pale, anxious","Patient may self-identify early hypoglycemia","Severe: confusion, unresponsive, or seizure","History of diabetes; may have missed meal or over-exerted"],
    tx:["Conscious + able to swallow: 15–20 g fast sugar (glucose tabs, juice, candy, honey)","Recheck in 15 min — repeat if no improvement","Follow with complex carb + protein snack once improving","Unconscious: do NOT give oral fluids — aspiration risk","Recovery position; monitor airway","Honey or glucose gel inside cheek if barely responsive","Evacuate if: unknown cause, unresponsive, or no improvement after treatment"] },
  { id:"infection", cat:"WOUND & INFECTION", severity:"moderate", evac:true,
    title:"Wound Infection / Cellulitis",
    signs:["Wound redness spreading beyond wound margins","Warmth, swelling, increasing pain after initial improvement","Purulent discharge or foul odor","Streaking redness tracking up limb (lymphangitis)","Fever, chills (systemic spread)"],
    tx:["Open wound to allow drainage if fluctuant (abscess)","Irrigate aggressively with clean water at high pressure","Warm soaks 3–4× daily if water available","Change dressings twice daily","Antibiotics required — evacuate for prescription","Spreading cellulitis or systemic symptoms — urgent evacuation","Lymphangitic streaking = emergency evacuation"] },
  { id:"impalement", cat:"WOUND & INFECTION", severity:"high", evac:true,
    title:"Impalement / Embedded Object",
    signs:["Object penetrating skin and remaining in place","May have entered body cavity (chest, abdomen)","Significant risk of major vessel or organ injury","Minimal external bleeding does not rule out internal injury"],
    tx:["Do NOT remove impaled object — it may be tamponading a vessel","Stabilize object in place with bulky dressings on both sides","Cut object to manageable length if necessary for transport","Monitor for signs of internal bleeding / shock","Cover any chest wound with occlusive dressing (3-sided tape)","Emergency evacuation"] },
];

/* ══════════════════════════════════════════════════════════════════════════════
   EVAC TRIGGERS
══════════════════════════════════════════════════════════════════════════════ */
const EVAC_TRIGGERS = {
  emergency: [
    "Uncontrolled airway / respiratory distress",
    "Uncontrolled severe bleeding / shock",
    "Declining or altered mental status",
    "Suspected spinal injury with deficits",
    "Chest trauma with breathing compromise",
    "Anaphylaxis post-epi",
    "Severe hypothermia",
    "Open fracture / joint dislocation (unreduced)",
    "Lightning strike",
    "Abdominal evisceration or impalement",
  ],
  urgent: [
    "Stable vitals but high-energy mechanism",
    "Spreading cellulitis / lymphangitic streaking",
    "Suspected femur fracture",
    "Eye injury / sudden vision loss",
    "Significant AMS without clear cause",
    "Snakebite (all cases)",
  ],
  monitor: [
    "Reduced dislocation, NV intact, ambulating",
    "Mild hypothermia, actively rewarming",
    "Resolved anaphylaxis, 2+ hrs post-epi, no recurrence",
    "Minor laceration, wound clean, patient stable",
    "Ankle sprain, able to weight-bear, no deformity",
  ],
};

/* ══════════════════════════════════════════════════════════════════════════════
   SVG ILLUSTRATIONS
══════════════════════════════════════════════════════════════════════════════ */
function AilmentIllustration({ id }) {
  const svgs = {
    snake: (
      <svg viewBox="0 0 160 80" width="160" height="80" aria-hidden="true">
        <path d="M20 65 Q30 30 55 28 Q80 26 85 40 Q90 54 70 56 Q55 58 53 48 Q51 38 62 36 Q73 34 74 42" stroke={C.warn} strokeWidth="5" fill="none" strokeLinecap="round"/>
        <ellipse cx="20" cy="67" rx="9" ry="5.5" fill={C.warn}/>
        <path d="M14 67 L6 63 M14 67 L6 71" stroke={C.danger} strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        <rect x="108" y="28" width="40" height="26" rx="5" fill="#fdecea" stroke={C.border} strokeWidth="1"/>
        <circle cx="120" cy="41" r="2.5" fill={C.danger} opacity="0.9"/>
        <circle cx="130" cy="41" r="2.5" fill={C.danger} opacity="0.9"/>
        <path d="M120 43 L120 50 M130 43 L130 50" stroke={C.danger} strokeWidth="1" strokeDasharray="2,2" opacity="0.6"/>
        <text x="128" y="62" textAnchor="middle" fontSize="8" fill={C.textFaint} fontFamily={mono}>fang marks</text>
      </svg>
    ),
    spider: (
      <svg viewBox="0 0 160 80" aria-hidden="true" width="160" height="80">
        <ellipse cx="55" cy="46" rx="11" ry="8" fill="#3a3a3a"/>
        <ellipse cx="55" cy="34" rx="8" ry="7" fill="#4a4a4a"/>
        <circle cx="52" cy="32" r="1.5" fill="white" opacity="0.8"/>
        <circle cx="58" cy="32" r="1.5" fill="white" opacity="0.8"/>
        {[[-1,-1],[-1,0],[-1,1],[1,-1],[1,0],[1,1]].map(([sx,si],i) => (
          <path key={i} d={`M${55+sx*11} ${40+si*5} Q${55+sx*24} ${38+si*6} ${55+sx*30} ${36+si*4}`} stroke="#2a2a2a" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        ))}
        <rect x="100" y="28" width="48" height="28" rx="5" fill="#fdecea" stroke={C.border} strokeWidth="1"/>
        <circle cx="116" cy="42" r="4" fill={C.danger} opacity="0.25"/>
        <circle cx="116" cy="42" r="2" fill={C.danger} opacity="0.7"/>
        <circle cx="130" cy="42" r="4" fill={C.danger} opacity="0.25"/>
        <circle cx="130" cy="42" r="2" fill={C.danger} opacity="0.7"/>
        <text x="124" y="64" textAnchor="middle" fontSize="8" fill={C.textFaint} fontFamily={mono}>bite site</text>
      </svg>
    ),
    tick: (
      <svg viewBox="0 0 160 80" aria-hidden="true" width="160" height="80">
        <path d="M10 62 Q50 52 90 55 Q120 57 150 50" stroke={C.border} strokeWidth="2" fill="none"/>
        <path d="M10 62 Q50 52 90 55 Q120 57 150 50 L150 80 L10 80 Z" fill="#fdecea" opacity="0.4"/>
        <ellipse cx="75" cy="53" rx="13" ry="10" fill="#2c2c2c"/>
        <ellipse cx="75" cy="45" rx="8" ry="6" fill="#3d3d3d"/>
        {[[-12,-4],[-14,0],[-12,4],[12,-4],[14,0],[12,4]].map(([dx,dy],i)=>(
          <path key={i} d={`M${75+dx*0.5} ${45+dy*0.5} Q${75+dx} ${45+dy} ${75+dx*1.4} ${44+dy*1.2}`} stroke="#1a1a1a" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        ))}
        <path d="M75 63 L75 68" stroke="#2c2c2c" strokeWidth="3" strokeLinecap="round"/>
        <circle cx="120" cy="42" r="14" fill="none" stroke={C.danger} strokeWidth="1.5" opacity="0.5"/>
        <circle cx="120" cy="42" r="8" fill="#fdecea" stroke={C.danger} strokeWidth="1" opacity="0.6"/>
        <circle cx="120" cy="42" r="2.5" fill={C.danger} opacity="0.8"/>
        <text x="120" y="62" textAnchor="middle" fontSize="7" fill={C.textFaint} fontFamily={mono}>bulls-eye</text>
      </svg>
    ),
    bee: (
      <svg viewBox="0 0 120 80" aria-hidden="true" width="120" height="80">
        <ellipse cx="50" cy="24" rx="16" ry="7" fill="#e8f5e5" stroke={C.border} strokeWidth="1" opacity="0.85"/>
        <ellipse cx="63" cy="24" rx="16" ry="7" fill="#e8f5e5" stroke={C.border} strokeWidth="1" opacity="0.85"/>
        <ellipse cx="56" cy="40" rx="11" ry="15" fill="#c45000"/>
        <rect x="45" y="33" width="22" height="4" fill="#1a1a1a" rx="1"/>
        <rect x="45" y="41" width="22" height="4" fill="#1a1a1a" rx="1"/>
        <rect x="45" y="49" width="22" height="4" fill="#1a1a1a" rx="1"/>
        <circle cx="56" cy="22" r="7" fill="#c45000"/>
        <path d="M53 16 Q48 10 46 6" stroke="#1a1a1a" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        <path d="M59 16 Q64 10 66 6" stroke="#1a1a1a" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        <circle cx="44" cy="5" r="2" fill="#1a1a1a"/>
        <circle cx="68" cy="5" r="2" fill="#1a1a1a"/>
        <path d="M56 55 L56 64" stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round"/>
        <path d="M56 64 L52 70 M56 64 L60 70" stroke="#1a1a1a" strokeWidth="1.5" strokeLinecap="round"/>
        <rect x="85" y="38" width="28" height="20" rx="4" fill="#fff3e0" stroke={C.border} strokeWidth="1"/>
        <circle cx="99" cy="48" r="6" fill={C.warn} opacity="0.2"/>
        <circle cx="99" cy="48" r="2.5" fill={C.warn} opacity="0.7"/>
      </svg>
    ),
    burn: (
      <svg viewBox="0 0 160 80" aria-hidden="true" width="160" height="80">
        <path d="M32 70 Q22 45 38 30 Q30 42 46 32 Q38 20 52 8 Q56 24 46 32 Q62 18 58 34 Q70 20 66 36 Q78 22 70 42 Q76 55 58 70 Z" fill={C.warn} opacity="0.85"/>
        <path d="M38 70 Q30 52 42 40 Q38 46 48 40 Q46 30 54 22 Q56 34 50 40 Q58 30 58 42 Q64 36 62 50 Q66 58 52 70 Z" fill="#fef3e0" opacity="0.8"/>
        <rect x="94" y="14" width="52" height="52" rx="6" fill="white" stroke={C.border} strokeWidth="1"/>
        <rect x="94" y="14" width="52" height="17" rx="0" fill="#fdecea"/>
        <text x="120" y="27" textAnchor="middle" fontSize="9" fill={C.danger} fontFamily={mono} fontWeight="700">3rd°</text>
        <rect x="94" y="31" width="52" height="17" fill="#fff3e0"/>
        <text x="120" y="44" textAnchor="middle" fontSize="9" fill={C.warn} fontFamily={mono} fontWeight="700">2nd°</text>
        <rect x="94" y="48" width="52" height="11" fill="#e6f4e2"/>
        <text x="120" y="57" textAnchor="middle" fontSize="9" fill={C.accent} fontFamily={mono} fontWeight="700">1st°</text>
        <rect x="94" y="59" width="52" height="7" rx="0" fill="#edf0ea"/>
        <text x="120" y="65" textAnchor="middle" fontSize="7" fill={C.textFaint} fontFamily={mono}>skin</text>
      </svg>
    ),
    frostbite: (
      <svg viewBox="0 0 160 80" aria-hidden="true" width="160" height="80">
        <path d="M22 72 Q20 52 24 38 Q28 26 36 26 Q42 26 42 34 L42 24 Q42 16 48 16 Q54 16 54 24 L54 18 Q54 10 60 10 Q66 10 66 18 L66 22 Q66 14 72 14 Q78 14 78 24 L78 38 Q85 30 90 32 Q97 36 90 46 L78 60 Q76 66 72 72 Z" fill={C.blueLight} stroke={C.blue} strokeWidth="1.5"/>
        <rect x="39" y="16" width="8" height="18" rx="4" fill="#c8d8e8" opacity="0.8"/>
        <rect x="51" y="10" width="8" height="18" rx="4" fill="#b8c8d8" opacity="0.8"/>
        <rect x="63" y="14" width="8" height="16" rx="4" fill="#c8d8e8" opacity="0.8"/>
        <g transform="translate(122,40)">
          <line x1="-13" y1="0" x2="13" y2="0" stroke={C.blue} strokeWidth="2"/>
          <line x1="0" y1="-13" x2="0" y2="13" stroke={C.blue} strokeWidth="2"/>
          <line x1="-9" y1="-9" x2="9" y2="9" stroke={C.blue} strokeWidth="2"/>
          <line x1="9" y1="-9" x2="-9" y2="9" stroke={C.blue} strokeWidth="2"/>
          <circle cx="0" cy="-13" r="2.5" fill={C.blue}/>
          <circle cx="0" cy="13" r="2.5" fill={C.blue}/>
          <circle cx="-13" cy="0" r="2.5" fill={C.blue}/>
          <circle cx="13" cy="0" r="2.5" fill={C.blue}/>
        </g>
      </svg>
    ),
    rash: (
      <svg viewBox="0 0 160 80" aria-hidden="true" width="160" height="80">
        <path d="M18 58 Q40 44 80 46 Q120 48 142 40 L142 72 Q120 72 80 72 Q40 72 18 72 Z" fill="#fdecea" stroke={C.border} strokeWidth="1"/>
        {[[30,52,7],[50,46,5],[68,49,8],[88,44,6],[106,47,7],[124,42,5],[40,60,5],[62,58,7],[85,56,6],[108,55,5],[130,52,4]].map(([x,y,r],i)=>(
          <circle key={i} cx={x} cy={y} r={r} fill={C.danger} opacity="0.3" stroke={C.danger} strokeWidth="0.5"/>
        ))}
        <text x="80" y="76" textAnchor="middle" fontSize="8" fill={C.textFaint} fontFamily={mono}>urticaria / contact dermatitis</text>
      </svg>
    ),
    scorpion: (
      <svg viewBox="0 0 140 80" aria-hidden="true" width="140" height="80">
        <path d="M72 58 Q80 45 90 42 Q100 39 106 30 Q112 20 106 13 Q103 8 108 5" stroke={C.textDim} strokeWidth="4" fill="none" strokeLinecap="round"/>
        <path d="M108 5 L114 1 L112 8" fill={C.warn} stroke={C.warn} strokeWidth="1"/>
        <ellipse cx="55" cy="55" rx="20" ry="11" fill={C.textDim}/>
        <ellipse cx="44" cy="44" rx="14" ry="11" fill={C.textDim}/>
        {[[-1,-1],[-1,0],[-1,1],[1,-1],[1,0],[1,1]].map(([sx,sy],i)=>(
          <path key={i} d={`M${44+sx*14} ${44+sy*4} Q${44+sx*26} ${44+sy*6} ${44+sx*32} ${43+sy*4}`} stroke="#2c2c2c" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        ))}
        <path d="M36 42 Q24 36 18 30 Q15 27 19 24 Q23 21 26 26" stroke={C.textDim} strokeWidth="3" fill="none" strokeLinecap="round"/>
        <path d="M26 26 Q24 19 30 20 Q36 21 32 27 Z" fill={C.textDim}/>
        <path d="M36 48 Q22 48 16 44 Q11 40 14 35 Q17 30 22 35" stroke={C.textDim} strokeWidth="3" fill="none" strokeLinecap="round"/>
      </svg>
    ),
  };
  const svg = svgs[id];
  if (!svg) return null;
  return (
    <div style={{ background: C.raised, borderRadius: "6px", padding: "10px 12px", marginBottom: "12px", display: "flex", justifyContent: "center", alignItems: "center" }}>
      {svg}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   LOG UTILITIES
══════════════════════════════════════════════════════════════════════════════ */
function makeLog() {
  const now = new Date();
  return {
    id: `log_${now.getTime()}`,
    name: "",
    datetime: now.toISOString(),
    location: { lat: null, lng: null, display: "" },
    data: { ssu:{}, resp:{}, abc:{}, sample:{}, exam:{}, evac:{} },
    vitals: [],
    checks: {},
    notes: "",
  };
}

function fmtDateTime(iso) {
  try {
    return new Date(iso).toLocaleString([], { month:"short", day:"numeric", year:"numeric", hour:"2-digit", minute:"2-digit" });
  } catch { return iso; }
}

function exportText(log) {
  const lines = [
    "FIELD MED — PATIENT ENCOUNTER LOG",
    "====================================",
    `Log      : ${log.name || "(unnamed)"}`,
    `Date/Time: ${fmtDateTime(log.datetime)}`,
    `Location : ${log.location.display || "Not recorded"}`,
    "",
  ];
  const sectionLabels = { ssu:"Scene Size-Up", resp:"Responsiveness", abc:"ABCs + Bleeding", sample:"SAMPLE History", exam:"Head-to-Toe Exam", evac:"Evac Decision" };
  Object.entries(sectionLabels).forEach(([sec, title]) => {
    const fields = PAS_FIELDS[sec] || [];
    const data = log.data[sec] || {};
    const entries = fields.filter(f => data[f.key] && data[f.key] !== "—");
    if (!entries.length) return;
    lines.push(`── ${title} ──`);
    entries.forEach(f => lines.push(`  ${f.label}: ${data[f.key]}`));
    lines.push("");
  });
  if (log.vitals.length) {
    lines.push("── Vitals Log ──");
    log.vitals.forEach(v => {
      const parts = VITAL_FIELDS.map(f => `${f.label}:${v[f.key]||"—"}`).join("  ");
      lines.push(`  ${v.time} | ${parts}`);
    });
    lines.push("");
  }
  if (log.notes) { lines.push("── Notes ──"); lines.push(`  ${log.notes}`); lines.push(""); }
  lines.push("────────────────────────────────────");
  lines.push("Generated by Field Med — WFR Backcountry Reference");
  lines.push("NOT A SUBSTITUTE FOR WFR TRAINING");
  return lines.join("\n");
}

/* ══════════════════════════════════════════════════════════════════════════════
   SHARED STYLE HELPERS
══════════════════════════════════════════════════════════════════════════════ */
const inputSt = {
  background: C.surface, border: `1px solid ${C.border}`, borderRadius: "6px",
  padding: "9px 11px", color: C.text, fontFamily: mono, fontSize: "13px",
  outline: "none", width: "100%", boxSizing: "border-box", WebkitAppearance: "none",
};
const btnPrimary = {
  background: C.accent, border: "none", borderRadius: "6px", padding: "12px 18px",
  color: C.white, fontFamily: mono, fontSize: "12px", fontWeight: 700,
  letterSpacing: "0.06em", cursor: "pointer", WebkitAppearance: "none",
};

/* ══════════════════════════════════════════════════════════════════════════════
   FIELD RENDERER
══════════════════════════════════════════════════════════════════════════════ */
function FieldInput({ f, section, logData, onChange }) {
  const val = (logData[section] || {})[f.key] || "";
  const handleChange = e => onChange(section, f.key, e.target.value);
  const labelEl = <label style={{ display:"block", fontSize:"10px", color:C.textDim, marginBottom:"4px", letterSpacing:"0.05em" }}>{f.label}</label>;
  if (f.type === "select") return (
    <div style={{ marginBottom:"8px" }}>
      {labelEl}
      <select value={val} onChange={handleChange} style={{ ...inputSt, cursor:"pointer" }}>
        {f.options.map(o => <option key={o} value={o === "—" ? "" : o}>{o}</option>)}
      </select>
    </div>
  );
  if (f.type === "textarea") return (
    <div style={{ marginBottom:"8px" }}>
      {labelEl}
      <textarea value={val} onChange={handleChange} placeholder={f.placeholder} rows={3}
        style={{ ...inputSt, resize:"vertical", minHeight:"60px" }} />
    </div>
  );
  return (
    <div style={{ marginBottom:"8px" }}>
      {labelEl}
      <input type={f.type || "text"} value={val} onChange={handleChange}
        placeholder={f.placeholder} style={inputSt} />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════════════════════ */
export default function WFRField() {
  const [screen, setScreen]           = useState("home");  // "home" | "log" | "view"
  const [logs, setLogs]               = useState([]);
  const [activeLog, setActiveLog]     = useState(null);
  const [viewLog, setViewLog]         = useState(null);
  const [tab, setTab]                 = useState("pas");
  const [openStep, setOpenStep]       = useState(0);
  const [openProtocol, setOpenProtocol] = useState(null);
  const [openAilment, setOpenAilment] = useState(null);
  const [protoSearch, setProtoSearch] = useState("");
  const [ailSearch, setAilSearch]     = useState("");
  const [activeCat, setActiveCat]     = useState("ALL");
  const [vitalDraft, setVitalDraft]   = useState({});
  const [copyMsg, setCopyMsg]         = useState("");

  // Load from localStorage
  useEffect(() => {
    try {
      const s = localStorage.getItem("fieldmed_logs");
      if (s) setLogs(JSON.parse(s));
    } catch {}
  }, []);

  // Persist logs
  useEffect(() => {
    try { localStorage.setItem("fieldmed_logs", JSON.stringify(logs)); } catch {}
  }, [logs]);

  // ── Log mutations ──────────────────────────────────────────────────────────
  const patchLog = (id, changes) => {
    setLogs(ls => ls.map(l => l.id === id ? { ...l, ...changes } : l));
    if (activeLog?.id === id) setActiveLog(prev => ({ ...prev, ...changes }));
  };

  const patchLogData = (id, section, key, value) => {
    setLogs(ls => ls.map(l => {
      if (l.id !== id) return l;
      return { ...l, data: { ...l.data, [section]: { ...l.data[section], [key]: value } } };
    }));
    if (activeLog?.id === id) {
      setActiveLog(prev => ({
        ...prev,
        data: { ...prev.data, [section]: { ...prev.data[section], [key]: value } },
      }));
    }
  };

  const startNewLog = () => {
    const log = makeLog();
    setLogs(ls => [log, ...ls]);
    setActiveLog(log);
    setTab("pas");
    setOpenStep(0);
    setScreen("log");
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(pos => {
        const display = `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`;
        patchLog(log.id, { location: { lat: pos.coords.latitude, lng: pos.coords.longitude, display } });
      }, () => {});
    }
  };

  const openLog = (log) => {
    setActiveLog(log);
    setTab("pas");
    setOpenStep(0);
    setScreen("log");
  };

  const deleteLog = (id) => {
    if (typeof window !== "undefined" && !window.confirm("Delete this log?")) return;
    setLogs(ls => ls.filter(l => l.id !== id));
  };

  const copyExport = (log) => {
    const text = exportText(log);
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        setCopyMsg("Copied!");
        setTimeout(() => setCopyMsg(""), 2000);
      });
    }
  };

  const addVitals = () => {
    if (!Object.values(vitalDraft).some(v => v)) return;
    const entry = { ...vitalDraft, time: new Date().toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" }) };
    const vitals = [...(activeLog.vitals || []), entry];
    patchLog(activeLog.id, { vitals });
    setVitalDraft({});
  };

  const toggleCheck = (sid, item) => {
    const key = `${sid}::${item}`;
    const checks = { ...(activeLog.checks || {}), [key]: !activeLog.checks?.[key] };
    patchLog(activeLog.id, { checks });
  };

  const stepProg = s => {
    const d = s.items.filter(i => activeLog?.checks?.[`${s.id}::${i}`]).length;
    return { d, t: s.items.length, pct: (d / s.items.length) * 100 };
  };
  const flagColor = f => f === "URGENT" ? C.danger : f === "MONITOR" ? C.warn : C.blue;

  const AILMENT_CATS = ["ALL", ...new Set(AILMENTS.map(a => a.cat))];
  const filteredAilments = AILMENTS.filter(a => {
    const catOk = activeCat === "ALL" || a.cat === activeCat;
    const q = ailSearch.toLowerCase();
    const textOk = !q || a.title.toLowerCase().includes(q) || a.signs.some(s => s.toLowerCase().includes(q));
    return catOk && textOk;
  });
  const filteredProtocols = PROTOCOLS.filter(p => {
    const q = protoSearch.toLowerCase();
    return !q || p.title.toLowerCase().includes(q) || p.signs.some(s => s.toLowerCase().includes(q));
  });

  /* ── SHARED WRAPPER ──────────────────────────────────────────────────────── */
  const Wrap = ({ children }) => (
    <div style={{ background:C.bg, minHeight:"100vh", color:C.text, fontFamily:mono, maxWidth:"480px", margin:"0 auto", display:"flex", flexDirection:"column" }}>
      {children}
    </div>
  );

  /* ══════════════════════════════════════════════════════════════════════════
     HOME SCREEN
  ══════════════════════════════════════════════════════════════════════════ */
  if (screen === "home") return (
    <Wrap>
      <div style={{ padding:"20px 16px 16px", borderBottom:`1px solid ${C.border}`, background:C.surface, boxShadow:"0 1px 4px rgba(0,0,0,0.06)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"12px" }}>
          <svg width="36" height="36" viewBox="0 0 36 36">
            <rect width="36" height="36" rx="8" fill={C.accent}/>
            <rect x="16" y="7" width="4" height="22" rx="1.5" fill="white"/>
            <rect x="7" y="16" width="22" height="4" rx="1.5" fill="white"/>
          </svg>
          <div>
            <div style={{ fontSize:"20px", fontWeight:700, color:C.text, letterSpacing:"-0.02em", lineHeight:"1.1" }}>Field Med</div>
            <div style={{ fontSize:"9px", color:C.textFaint, letterSpacing:"0.2em", marginTop:"1px" }}>WFR BACKCOUNTRY REFERENCE</div>
          </div>
        </div>
      </div>

      <div style={{ padding:"16px" }}>
        <button onClick={startNewLog} style={{ ...btnPrimary, width:"100%", padding:"16px", fontSize:"14px", letterSpacing:"0.08em" }}>
          + NEW PATIENT LOG
        </button>
      </div>

      <div style={{ flex:1, padding:"0 16px 24px" }}>
        {logs.length === 0 ? (
          <div style={{ textAlign:"center", padding:"48px 20px", color:C.textFaint }}>
            <svg width="48" height="48" viewBox="0 0 48 48" style={{ marginBottom:"12px", opacity:0.4 }}>
              <rect x="8" y="4" width="32" height="40" rx="4" fill="none" stroke={C.textFaint} strokeWidth="2"/>
              <line x1="16" y1="16" x2="32" y2="16" stroke={C.textFaint} strokeWidth="2"/>
              <line x1="16" y1="22" x2="32" y2="22" stroke={C.textFaint} strokeWidth="2"/>
              <line x1="16" y1="28" x2="26" y2="28" stroke={C.textFaint} strokeWidth="2"/>
            </svg>
            <div style={{ fontSize:"14px", fontWeight:600, color:C.textDim }}>No patient logs yet</div>
            <div style={{ fontSize:"12px", marginTop:"6px" }}>Tap "New Patient Log" to start a patient encounter</div>
          </div>
        ) : (
          <div>
            <div style={{ fontSize:"9px", color:C.textFaint, letterSpacing:"0.15em", marginBottom:"12px" }}>PAST LOGS — {logs.length}</div>
            <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
              {logs.map(log => (
                <div key={log.id} style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:"10px", overflow:"hidden", boxShadow:"0 1px 3px rgba(0,0,0,0.05)" }}>
                  <button onClick={() => openLog(log)} style={{ width:"100%", padding:"14px 16px", background:"transparent", border:"none", textAlign:"left", cursor:"pointer" }}>
                    <div style={{ fontSize:"15px", fontWeight:700, color:C.text, marginBottom:"5px" }}>
                      {log.name || <span style={{ color:C.textFaint }}>(unnamed encounter)</span>}
                    </div>
                    <div style={{ fontSize:"11px", color:C.textDim }}>{fmtDateTime(log.datetime)}</div>
                    {log.location.display && (
                      <div style={{ fontSize:"11px", color:C.textFaint, marginTop:"3px" }}>📍 {log.location.display}</div>
                    )}
                    {log.vitals.length > 0 && (
                      <div style={{ fontSize:"10px", color:C.accent, marginTop:"4px" }}>{log.vitals.length} vitals set{log.vitals.length !== 1 ? "s" : ""} recorded</div>
                    )}
                  </button>
                  <div style={{ display:"flex", borderTop:`1px solid ${C.border}` }}>
                    {[
                      { label:"OPEN",   action: () => openLog(log),                  color: C.accent },
                      { label:"EXPORT", action: () => copyExport(log),               color: C.textDim },
                      { label:"DELETE", action: () => deleteLog(log.id),             color: C.danger },
                    ].map((btn, i) => (
                      <button key={btn.label} onClick={btn.action} style={{ flex:1, padding:"9px", background:"transparent", border:"none", borderLeft: i > 0 ? `1px solid ${C.border}` : "none", color:btn.color, fontFamily:mono, fontSize:"10px", fontWeight:700, cursor:"pointer", letterSpacing:"0.05em" }}>{btn.label}</button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div style={{ padding:"10px 16px", borderTop:`1px solid ${C.border}`, background:C.surface, textAlign:"center" }}>
        <span style={{ fontSize:"9px", color:C.textFaint, letterSpacing:"0.1em" }}>NOT A SUBSTITUTE FOR WFR TRAINING</span>
      </div>
    </Wrap>
  );

  /* ══════════════════════════════════════════════════════════════════════════
     VIEW LOG (read-only export text)
  ══════════════════════════════════════════════════════════════════════════ */
  if (screen === "view" && viewLog) {
    const text = exportText(viewLog);
    return (
      <Wrap>
        <div style={{ padding:"12px 16px", borderBottom:`1px solid ${C.border}`, background:C.surface, display:"flex", alignItems:"center", gap:"12px" }}>
          <button onClick={() => setScreen("home")} style={{ background:"transparent", border:"none", color:C.accent, fontFamily:mono, fontSize:"13px", cursor:"pointer", padding:"0", fontWeight:700 }}>← Logs</button>
          <span style={{ fontWeight:700, flex:1, color:C.text, fontSize:"14px" }}>{viewLog.name || "Patient Log"}</span>
          <button onClick={() => copyExport(viewLog)} style={{ ...btnPrimary, padding:"7px 14px", fontSize:"10px" }}>
            {copyMsg || "COPY"}
          </button>
        </div>
        <div style={{ flex:1, overflowY:"auto", padding:"16px" }}>
          <pre style={{ fontFamily:mono, fontSize:"11px", color:C.text, lineHeight:"1.8", whiteSpace:"pre-wrap", margin:0 }}>{text}</pre>
        </div>
      </Wrap>
    );
  }

  /* ══════════════════════════════════════════════════════════════════════════
     ACTIVE LOG SCREEN
  ══════════════════════════════════════════════════════════════════════════ */
  if (!activeLog) return null;

  return (
    <Wrap>
      {/* ── Log header ──────────────────────────────────────────────────── */}
      <div style={{ padding:"10px 14px 10px", borderBottom:`1px solid ${C.border}`, background:C.surface, boxShadow:"0 1px 3px rgba(0,0,0,0.05)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"10px", marginBottom:"8px" }}>
          <button onClick={() => setScreen("home")} style={{ background:"transparent", border:"none", color:C.accent, fontFamily:mono, fontSize:"13px", cursor:"pointer", padding:"0", flexShrink:0, fontWeight:700 }}>← Logs</button>
          <input
            value={activeLog.name}
            onChange={e => patchLog(activeLog.id, { name: e.target.value })}
            placeholder="Log name (e.g. Jane — ankle injury)"
            style={{ flex:1, background:"transparent", border:"none", fontFamily:mono, fontSize:"13px", fontWeight:700, color:C.text, outline:"none", minWidth:0 }}
          />
          <button onClick={() => copyExport(activeLog)} style={{ background: copyMsg ? C.accentLight : C.raised, border:`1px solid ${C.border}`, borderRadius:"5px", padding:"6px 10px", color: copyMsg ? C.accent : C.textDim, fontFamily:mono, fontSize:"9px", cursor:"pointer", flexShrink:0, letterSpacing:"0.06em", fontWeight:700 }}>
            {copyMsg || "EXPORT"}
          </button>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:"8px", fontSize:"10px", color:C.textFaint, flexWrap:"wrap" }}>
          <span>{fmtDateTime(activeLog.datetime)}</span>
          <span>·</span>
          {activeLog.location.display ? (
            <span style={{ display:"flex", alignItems:"center", gap:"3px" }}>
              <span>📍</span>
              <input
                value={activeLog.location.display}
                onChange={e => patchLog(activeLog.id, { location: { ...activeLog.location, display: e.target.value } })}
                style={{ background:"transparent", border:"none", fontFamily:mono, fontSize:"10px", color:C.textFaint, outline:"none", minWidth:0, width:`${Math.max(activeLog.location.display.length + 2, 12)}ch` }}
              />
            </span>
          ) : (
            <button onClick={() => {
              if (typeof navigator !== "undefined" && navigator.geolocation)
                navigator.geolocation.getCurrentPosition(pos => {
                  patchLog(activeLog.id, { location: { lat:pos.coords.latitude, lng:pos.coords.longitude, display:`${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}` } });
                }, () => {});
            }} style={{ background:"transparent", border:"none", color:C.blue, fontFamily:mono, fontSize:"10px", cursor:"pointer", padding:0, textDecoration:"underline" }}>
              📍 Get location
            </button>
          )}
        </div>
      </div>

      {/* ── Tabs ────────────────────────────────────────────────────────── */}
      <div style={{ display:"flex", borderBottom:`1px solid ${C.border}`, background:C.surface, overflowX:"auto", flexShrink:0 }}>
        {[{id:"pas",label:"PAS"},{id:"vitals",label:"VITALS"},{id:"protocols",label:"PROTOCOLS"},{id:"ailments",label:"AILMENTS"},{id:"evac",label:"EVAC"}].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ flex:"0 0 auto", padding:"11px 13px", border:"none", background: tab===t.id ? C.accentLight : "transparent", color: tab===t.id ? C.accent : C.textDim, fontFamily:mono, fontSize:"10px", fontWeight:700, letterSpacing:"0.08em", cursor:"pointer", borderBottom: tab===t.id ? `2px solid ${C.accent}` : "2px solid transparent", WebkitAppearance:"none" }}>{t.label}</button>
        ))}
      </div>

      {/* ── Content ─────────────────────────────────────────────────────── */}
      <div style={{ flex:1, overflowY:"auto", padding:"12px" }}>

        {/* ════ PAS TAB ════ */}
        {tab === "pas" && (
          <div style={{ display:"flex", flexDirection:"column", gap:"6px" }}>
            <div style={{ fontSize:"9px", color:C.textFaint, letterSpacing:"0.15em", marginBottom:"4px" }}>PATIENT ASSESSMENT SYSTEM</div>
            {PAS.map((step, idx) => {
              const { d, t, pct } = stepProg(step);
              const isOpen = openStep === idx;
              const complete = d === t;
              const fields = PAS_FIELDS[step.id] || [];
              const hasData = fields.some(f => (activeLog.data[step.id] || {})[f.key]);
              return (
                <div key={step.id} style={{ background:C.surface, border:`1px solid ${complete ? C.accent+"70" : C.border}`, borderRadius:"8px", overflow:"hidden", boxShadow: isOpen ? "0 2px 8px rgba(0,0,0,0.07)" : "none" }}>
                  <button onClick={() => setOpenStep(isOpen ? -1 : idx)} style={{ width:"100%", padding:"13px 14px", background:"transparent", border:"none", display:"flex", alignItems:"center", gap:"10px", cursor:"pointer", textAlign:"left" }}>
                    <div style={{ width:"10px", height:"10px", borderRadius:"50%", flexShrink:0, background: complete ? C.accent : d > 0 ? C.warn : C.border, boxShadow: complete ? `0 0 6px ${C.accent}50` : "none" }} />
                    <span style={{ fontSize:"8px", fontWeight:700, letterSpacing:"0.14em", color:step.color, flexShrink:0 }}>{step.tag}</span>
                    <span style={{ fontSize:"13px", fontWeight:700, color:C.text, flex:1 }}>{step.label}</span>
                    {hasData && !isOpen && <span style={{ fontSize:"8px", color:C.accent, background:C.accentLight, padding:"2px 6px", borderRadius:"3px", fontWeight:700 }}>DATA</span>}
                    <span style={{ fontSize:"10px", color:C.textFaint, flexShrink:0 }}>{d}/{t}</span>
                  </button>
                  <div style={{ height:"2px", background:C.raised }}>
                    <div style={{ height:"100%", width:`${pct}%`, background: complete ? C.accent : C.warn, transition:"width 0.3s" }} />
                  </div>
                  {isOpen && (
                    <div style={{ padding:"12px 14px 16px" }}>
                      {/* Checklist */}
                      <div style={{ display:"flex", flexDirection:"column", gap:"4px", marginBottom: fields.length && step.id !== "vitals" ? "14px" : 0 }}>
                        {step.items.map(item => {
                          const checked = !!activeLog.checks?.[`${step.id}::${item}`];
                          return (
                            <button key={item} onClick={() => toggleCheck(step.id, item)} style={{ display:"flex", alignItems:"center", gap:"10px", padding:"10px 10px", borderRadius:"6px", background: checked ? C.accentLight : C.raised, border:`1px solid ${checked ? C.accent+"60" : C.border}`, cursor:"pointer", textAlign:"left", width:"100%", WebkitAppearance:"none" }}>
                              <div style={{ width:"16px", height:"16px", borderRadius:"4px", flexShrink:0, background: checked ? C.accent : "transparent", border:`2px solid ${checked ? C.accent : C.border}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"10px", color:C.white, fontWeight:900 }}>{checked ? "✓" : ""}</div>
                              <span style={{ fontSize:"12px", color: checked ? C.textFaint : C.text, textDecoration: checked ? "line-through" : "none" }}>{item}</span>
                            </button>
                          );
                        })}
                      </div>
                      {/* Data entry for this step */}
                      {fields.length > 0 && step.id !== "vitals" && (
                        <div style={{ borderTop:`1px solid ${C.border}`, paddingTop:"12px" }}>
                          <div style={{ fontSize:"9px", color:C.textFaint, letterSpacing:"0.12em", marginBottom:"10px" }}>RECORD DATA</div>
                          {fields.map(f => (
                            <FieldInput key={f.key} f={f} section={step.id} logData={activeLog.data} onChange={(sec, key, val) => patchLogData(activeLog.id, sec, key, val)} />
                          ))}
                        </div>
                      )}
                      {step.id === "vitals" && (
                        <div style={{ borderTop:`1px solid ${C.border}`, paddingTop:"12px" }}>
                          <div style={{ fontSize:"11px", color:C.textDim }}>Record serial vitals in the <strong>VITALS</strong> tab</div>
                          <div style={{ fontSize:"10px", color:C.textFaint, marginTop:"4px" }}>{activeLog.vitals.length} vitals set{activeLog.vitals.length !== 1 ? "s" : ""} logged</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            {/* General notes */}
            <div style={{ marginTop:"6px" }}>
              <label style={{ display:"block", fontSize:"9px", color:C.textFaint, letterSpacing:"0.12em", marginBottom:"6px" }}>GENERAL NOTES</label>
              <textarea value={activeLog.notes || ""} onChange={e => patchLog(activeLog.id, { notes: e.target.value })} placeholder="Free-text notes for this encounter..." rows={4} style={{ ...inputSt, resize:"vertical" }} />
            </div>
          </div>
        )}

        {/* ════ VITALS TAB ════ */}
        {tab === "vitals" && (
          <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
            <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:"8px", padding:"14px", boxShadow:"0 1px 3px rgba(0,0,0,0.04)" }}>
              <div style={{ fontSize:"10px", color:C.textFaint, letterSpacing:"0.12em", marginBottom:"12px" }}>NEW VITALS SET</div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:"6px", marginBottom:"12px" }}>
                {VITAL_FIELDS.map(f => (
                  <div key={f.key}>
                    <label style={{ display:"block", fontSize:"9px", color:C.textDim, marginBottom:"4px", textAlign:"center" }}>{f.label}</label>
                    <input value={vitalDraft[f.key] || ""} onChange={e => setVitalDraft(p => ({ ...p, [f.key]:e.target.value }))} placeholder={f.placeholder}
                      style={{ background:C.raised, border:`1px solid ${C.border}`, borderRadius:"6px", padding:"8px 2px", color:C.text, fontFamily:mono, fontSize:"12px", width:"100%", textAlign:"center", outline:"none", boxSizing:"border-box", WebkitAppearance:"none" }} />
                  </div>
                ))}
              </div>
              <button onClick={addVitals} style={{ ...btnPrimary, width:"100%" }}>+ LOG VITALS SET</button>
            </div>

            {/* Vitals trend */}
            {activeLog.vitals.length > 0 && (
              <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:"8px", padding:"12px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"10px" }}>
                  <span style={{ fontSize:"10px", color:C.textFaint, letterSpacing:"0.12em", fontWeight:700 }}>TREND — {activeLog.vitals.length} SET{activeLog.vitals.length !== 1 ? "S" : ""}</span>
                  <button onClick={() => patchLog(activeLog.id, { vitals:[] })} style={{ background:"transparent", border:"none", color:C.danger, fontSize:"10px", cursor:"pointer", fontFamily:mono }}>CLEAR ALL</button>
                </div>
                <div style={{ overflowX:"auto" }}>
                  <table style={{ width:"100%", borderCollapse:"collapse", fontSize:"11px" }}>
                    <thead>
                      <tr>{["TIME", ...VITAL_FIELDS.map(f => f.label)].map(h => (
                        <th key={h} style={{ padding:"5px 6px", color:C.textDim, fontWeight:700, textAlign:"center", borderBottom:`1px solid ${C.border}`, fontSize:"9px", letterSpacing:"0.06em" }}>{h}</th>
                      ))}</tr>
                    </thead>
                    <tbody>
                      {[...activeLog.vitals].reverse().map((e, i) => (
                        <tr key={i} style={{ background: i % 2 === 0 ? C.raised : C.surface }}>
                          <td style={{ padding:"7px 6px", color:C.textDim, fontSize:"10px", textAlign:"center" }}>{e.time}</td>
                          {VITAL_FIELDS.map(f => (
                            <td key={f.key} style={{ padding:"7px 6px", color: e[f.key] ? C.text : C.textFaint, textAlign:"center", fontWeight: e[f.key] ? 600 : 400 }}>{e[f.key] || "—"}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* SCTM ref */}
            <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:"8px", padding:"12px" }}>
              <div style={{ fontSize:"9px", color:C.textFaint, letterSpacing:"0.12em", marginBottom:"10px" }}>SCTM QUICK REF</div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"6px" }}>
                {[{l:"Normal",v:"Pink / Warm / Dry",c:C.accent},{l:"Shock",v:"Pale / Cool / Clammy",c:C.danger},{l:"Heat ill.",v:"Red / Hot / Wet or Dry",c:C.warn},{l:"Hypo.",v:"Gray / Cold / Dry",c:C.blue}].map(s => (
                  <div key={s.l} style={{ padding:"9px 11px", background:C.raised, borderRadius:"6px", borderLeft:`3px solid ${s.c}` }}>
                    <div style={{ fontSize:"9px", color:C.textDim, marginBottom:"3px" }}>{s.l}</div>
                    <div style={{ fontSize:"11px", color:s.c, fontWeight:600 }}>{s.v}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Normal ranges */}
            <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:"8px", padding:"12px" }}>
              <div style={{ fontSize:"9px", color:C.textFaint, letterSpacing:"0.12em", marginBottom:"8px" }}>NORMAL ADULT RANGES</div>
              {[{l:"HR",n:"60–100 bpm",b:"<50 or >130"},{l:"RR",n:"12–20 brpm",b:"<8 or >24"},{l:"SYS BP",n:">90 mmHg",b:"<80"},{l:"SpO2",n:">94%",b:"<90%"},{l:"CRT",n:"<2 sec",b:">2 sec"}].map(r => (
                <div key={r.l} style={{ display:"flex", alignItems:"center", padding:"7px 0", borderBottom:`1px solid ${C.raised}`, gap:"10px" }}>
                  <span style={{ fontSize:"11px", color:C.textDim, width:"50px", flexShrink:0 }}>{r.l}</span>
                  <span style={{ fontSize:"12px", color:C.accent, flex:1, fontWeight:600 }}>{r.n}</span>
                  <span style={{ fontSize:"10px", color:C.danger }}>{r.b}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ════ PROTOCOLS TAB ════ */}
        {tab === "protocols" && (
          <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
            <input value={protoSearch} onChange={e => setProtoSearch(e.target.value)} placeholder="Search protocols..." style={inputSt} />
            {filteredProtocols.map(p => {
              const isOpen = openProtocol === p.id;
              const fc = flagColor(p.flag);
              return (
                <div key={p.id} style={{ background:C.surface, border:`1px solid ${isOpen ? fc+"60" : C.border}`, borderRadius:"8px", overflow:"hidden" }}>
                  <button onClick={() => setOpenProtocol(isOpen ? null : p.id)} style={{ width:"100%", padding:"14px", background:"transparent", border:"none", display:"flex", alignItems:"center", gap:"10px", cursor:"pointer", textAlign:"left", WebkitAppearance:"none" }}>
                    <span style={{ fontSize:"8px", fontWeight:700, letterSpacing:"0.12em", color:fc, background:fc+"18", padding:"3px 7px", borderRadius:"3px", flexShrink:0 }}>{p.flag}</span>
                    <span style={{ fontSize:"13px", fontWeight:700, color:C.text, flex:1 }}>{p.title}</span>
                    <span style={{ color:C.textFaint, fontSize:"12px" }}>{isOpen ? "▲" : "▼"}</span>
                  </button>
                  {isOpen && (
                    <div style={{ padding:"0 14px 16px" }}>
                      <div style={{ fontSize:"9px", color:C.textFaint, letterSpacing:"0.12em", marginBottom:"8px" }}>RECOGNIZE</div>
                      {p.signs.map((s,i) => <div key={i} style={{ display:"flex", gap:"8px", alignItems:"flex-start", padding:"5px 0", borderBottom:`1px solid ${C.raised}` }}><span style={{ color:C.warn, flexShrink:0, marginTop:"1px" }}>◆</span><span style={{ fontSize:"12px", color:C.text, lineHeight:"1.5" }}>{s}</span></div>)}
                      <div style={{ fontSize:"9px", color:C.textFaint, letterSpacing:"0.12em", margin:"12px 0 8px" }}>TREAT</div>
                      {p.tx.map((t,i) => <div key={i} style={{ display:"flex", gap:"8px", alignItems:"flex-start", padding:"7px 9px", marginBottom:"4px", background:C.raised, borderRadius:"5px", borderLeft:`3px solid ${fc}50` }}><span style={{ color:fc, flexShrink:0, fontSize:"10px", marginTop:"2px", fontWeight:700, minWidth:"14px" }}>{i+1}</span><span style={{ fontSize:"12px", color:C.text, lineHeight:"1.5" }}>{t}</span></div>)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ════ AILMENTS TAB ════ */}
        {tab === "ailments" && (
          <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
            <input value={ailSearch} onChange={e => setAilSearch(e.target.value)} placeholder="Search by condition or symptom..." style={inputSt} />
            <div style={{ display:"flex", gap:"5px", flexWrap:"wrap" }}>
              {AILMENT_CATS.map(cat => (
                <button key={cat} onClick={() => setActiveCat(cat)} style={{ padding:"5px 9px", border:`1px solid ${activeCat===cat ? C.accent : C.border}`, borderRadius:"4px", background: activeCat===cat ? C.accentLight : "transparent", color: activeCat===cat ? C.accent : C.textDim, fontFamily:mono, fontSize:"9px", fontWeight:700, letterSpacing:"0.05em", cursor:"pointer", whiteSpace:"nowrap", WebkitAppearance:"none" }}>{cat}</button>
              ))}
            </div>
            <div style={{ fontSize:"9px", color:C.textFaint, letterSpacing:"0.1em" }}>{filteredAilments.length} CONDITION{filteredAilments.length !== 1 ? "S" : ""}</div>
            {filteredAilments.map(a => {
              const isOpen = openAilment === a.id;
              const sc = a.severity === "high" ? C.danger : a.severity === "moderate" ? C.warn : C.accent;
              const sb = a.severity === "high" ? C.dangerLight : a.severity === "moderate" ? C.warnLight : C.accentLight;
              return (
                <div key={a.id} style={{ background:C.surface, border:`1px solid ${isOpen ? sc+"60" : C.border}`, borderRadius:"8px", overflow:"hidden" }}>
                  <button onClick={() => setOpenAilment(isOpen ? null : a.id)} style={{ width:"100%", padding:"13px 14px", background:"transparent", border:"none", display:"flex", alignItems:"center", gap:"10px", cursor:"pointer", textAlign:"left", WebkitAppearance:"none" }}>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:"8px", color:C.textFaint, fontWeight:700, letterSpacing:"0.1em", marginBottom:"3px" }}>{a.cat}</div>
                      <span style={{ fontSize:"13px", fontWeight:700, color:C.text }}>{a.title}</span>
                    </div>
                    <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:"5px", flexShrink:0 }}>
                      <div style={{ display:"flex", gap:"4px" }}>
                        <span style={{ fontSize:"8px", fontWeight:700, color:sc, background:sb, padding:"2px 6px", borderRadius:"3px" }}>{a.severity.toUpperCase()}</span>
                        {a.evac && <span style={{ fontSize:"8px", fontWeight:700, color:C.purple, background:C.purpleLight, padding:"2px 5px", borderRadius:"3px" }}>EVAC</span>}
                      </div>
                      <span style={{ color:C.textFaint, fontSize:"12px" }}>{isOpen ? "▲" : "▼"}</span>
                    </div>
                  </button>
                  {isOpen && (
                    <div style={{ padding:"0 14px 16px" }}>
                      {a.img && <AilmentIllustration id={a.img} />}
                      <div style={{ marginBottom:"12px" }}>
                        <div style={{ fontSize:"9px", color:C.textFaint, letterSpacing:"0.12em", marginBottom:"8px" }}>RECOGNIZE</div>
                        {a.signs.map((s,i) => <div key={i} style={{ display:"flex", gap:"8px", alignItems:"flex-start", padding:"5px 0", borderBottom:`1px solid ${C.raised}` }}><span style={{ color:sc, flexShrink:0, fontSize:"9px", marginTop:"3px" }}>◆</span><span style={{ fontSize:"12px", color:C.text, lineHeight:"1.5" }}>{s}</span></div>)}
                      </div>
                      <div style={{ marginBottom: a.avoid ? "10px" : 0 }}>
                        <div style={{ fontSize:"9px", color:C.textFaint, letterSpacing:"0.12em", marginBottom:"8px" }}>TREAT</div>
                        {a.tx.map((t,i) => <div key={i} style={{ display:"flex", gap:"8px", alignItems:"flex-start", padding:"7px 9px", marginBottom:"4px", background:C.raised, borderRadius:"5px", borderLeft:`3px solid ${sc}50` }}><span style={{ color:sc, flexShrink:0, fontSize:"10px", marginTop:"2px", fontWeight:700, minWidth:"14px" }}>{i+1}</span><span style={{ fontSize:"12px", color:C.text, lineHeight:"1.5" }}>{t}</span></div>)}
                      </div>
                      {a.avoid && <div style={{ padding:"9px 11px", background:C.dangerLight, border:`1px solid ${C.danger}25`, borderRadius:"6px", marginBottom:"8px" }}><span style={{ fontSize:"9px", color:C.danger, fontWeight:700, letterSpacing:"0.08em" }}>⚠ AVOID: </span><span style={{ fontSize:"11px", color:C.danger, opacity:0.8, lineHeight:"1.5" }}>{a.avoid}</span></div>}
                      {a.evac && <div style={{ padding:"8px 11px", background:C.purpleLight, border:`1px solid ${C.purple}25`, borderRadius:"6px", fontSize:"10px", color:C.purple, fontWeight:700, letterSpacing:"0.06em" }}>↑ EVACUATION INDICATED</div>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ════ EVAC TAB ════ */}
        {tab === "evac" && (
          <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
            {[
              { label:"EMERGENCY EVACUATION", sub:"Fastest possible — call for help now", color:C.danger, items:EVAC_TRIGGERS.emergency },
              { label:"URGENT EVACUATION",    sub:"Within hours — monitor closely en route", color:C.warn, items:EVAC_TRIGGERS.urgent },
              { label:"MONITOR / PLANNED",    sub:"May walk out — reassess frequently", color:C.accent, items:EVAC_TRIGGERS.monitor },
            ].map(cat => (
              <div key={cat.label} style={{ background:C.surface, border:`1px solid ${cat.color}35`, borderRadius:"8px", overflow:"hidden" }}>
                <div style={{ padding:"12px 14px", background:cat.color+"0f", borderBottom:`1px solid ${cat.color}20` }}>
                  <div style={{ fontSize:"12px", fontWeight:700, color:cat.color, letterSpacing:"0.04em" }}>{cat.label}</div>
                  <div style={{ fontSize:"10px", color:C.textDim, marginTop:"2px" }}>{cat.sub}</div>
                </div>
                <div style={{ padding:"10px 14px 14px" }}>
                  {cat.items.map((item,i) => <div key={i} style={{ display:"flex", gap:"10px", alignItems:"flex-start", padding:"6px 0", borderBottom:`1px solid ${C.raised}` }}><span style={{ color:cat.color, flexShrink:0, fontSize:"8px", marginTop:"4px" }}>■</span><span style={{ fontSize:"12px", color:C.text, lineHeight:"1.5" }}>{item}</span></div>)}
                </div>
              </div>
            ))}
            <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:"8px", padding:"14px" }}>
              <div style={{ fontSize:"9px", color:C.textFaint, letterSpacing:"0.12em", marginBottom:"10px" }}>FIELD RULES</div>
              {["When in doubt — evacuate","Declining vitals = emergency evac","Unstable AMS = immediate evac","No diagnosis needed to evacuate","Document vitals + time before leaving"].map((r,i) => (
                <div key={i} style={{ padding:"9px 11px", marginBottom:"5px", background:C.raised, borderRadius:"6px", borderLeft:`3px solid ${C.accent}45`, fontSize:"12px", color:C.text, lineHeight:"1.5" }}>{r}</div>
              ))}
            </div>
          </div>
        )}

      </div>

      <div style={{ padding:"8px 16px", borderTop:`1px solid ${C.border}`, background:C.surface, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <span style={{ fontSize:"9px", color:C.textFaint, letterSpacing:"0.1em" }}>NOLS WFR REFERENCE</span>
        <span style={{ fontSize:"9px", color:C.textFaint, letterSpacing:"0.1em" }}>NOT A SUBSTITUTE FOR TRAINING</span>
      </div>
    </Wrap>
  );
}
