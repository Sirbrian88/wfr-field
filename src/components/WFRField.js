"use client";

import { useState, useReducer } from "react";

/* ─── PALETTE ────────────────────────────────────────────────────────────── */
const C = {
  bg: "#0a0c0b", surface: "#111410", raised: "#181c16",
  border: "#252b22", accent: "#6db85c", accentDim: "#3a5e31",
  warn: "#e8a838", warnDim: "#5c3d08",
  danger: "#d64f3a", dangerDim: "#4a1209",
  blue: "#4a9fd4", purple: "#9b6dca",
  text: "#d4dbc8", textDim: "#7a8a6e", textFaint: "#3a4535", white: "#eef2e8",
};
const mono = "'Courier New', 'Lucida Console', monospace";
const sans = "'Georgia', 'Times New Roman', serif";

/* ─── PAS STEPS ──────────────────────────────────────────────────────────── */
const PAS = [
  { id:"ssu",    tag:"SCENE",     color:C.warn,    label:"Scene Size-Up",
    items:["Scene safe?","MOI / NOI","# patients","PPE on","Resources?"] },
  { id:"resp",   tag:"PRIMARY",   color:C.danger,  label:"Responsiveness",
    items:["Tap & shout","AVPU level","Airway open?","Breathing present?"] },
  { id:"abc",    tag:"PRIMARY",   color:C.danger,  label:"ABCs + Bleeding",
    items:["Severe bleeding controlled","Pulses present","Skin color / temp / moisture","Shock signs?"] },
  { id:"sample", tag:"SECONDARY", color:C.blue,    label:"SAMPLE History",
    items:["Signs & symptoms","Allergies","Medications","Pertinent history","Last food/drink","Events leading up"] },
  { id:"vitals", tag:"SECONDARY", color:C.blue,    label:"Vital Signs",
    items:["HR rate & quality","RR rate & quality","Blood pressure / perfusion","SCTM","LOR (A+O×?)"] },
  { id:"exam",   tag:"SECONDARY", color:C.blue,    label:"Head-to-Toe Exam",
    items:["Head / skull / face","Neck / c-spine","Chest / breath sounds","Abdomen / pelvis","Extremities DCAP-BTLS","Posterior"] },
  { id:"evac",   tag:"EVAC",      color:C.purple,  label:"Evac Decision",
    items:["Stable or unstable?","Walk-out capable?","Distance to care","Weather window","Emergency or planned?"] },
];

/* ─── PROTOCOLS ──────────────────────────────────────────────────────────── */
const PROTOCOLS = [
  { id:"shock", flag:"URGENT", title:"Shock / Hypoperfusion",
    signs:["Pale, cool, clammy skin","HR > 100 or weak/thready","RR > 24 or labored","AMS / restless / anxious","CRT > 2 sec"],
    tx:["Control bleeding — direct pressure","Supine or legs elevated (no spine concern)","Insulate from ground + overhead","Keep patient still & calm","NPO","Evacuate immediately"] },
  { id:"spine", flag:"PROTOCOL", title:"Spinal Clearance",
    signs:["Reliable patient? (no AMS, no intox, no distracting inj)","Mechanism with axial load?","Midline neck/back pain or tenderness?","Neuro deficit (numbness/tingling/weakness)?"],
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

/* ─── AILMENTS DATABASE ──────────────────────────────────────────────────── */
const AILMENTS = [
  { id:"snakebite", cat:"BITES & STINGS", severity:"high", evac:true,
    title:"Snakebite",
    signs:["1–2 fang puncture marks","Local pain, swelling, bruising within minutes","Nausea, vomiting, metallic taste","Numbness of mouth/face","Severe: hypotension, neuro deficits, coagulopathy"],
    tx:["Keep patient calm and still — movement spreads venom","Immobilize bitten limb at or below heart level","Remove rings/watches/tight clothing near bite","Mark swelling border + time every 15 min","Do NOT cut, suck, tourniquet, or apply ice","Evacuate immediately — antivenom is definitive treatment"],
    avoid:"No tourniquet. No electric shock. No incisions. No ice." },
  { id:"spider", cat:"BITES & STINGS", severity:"moderate", evac:true,
    title:"Spider Bite (Black Widow / Brown Recluse)",
    signs:["Black widow: muscle cramps, rigidity, severe abdominal pain, sweating within 1 hr","Brown recluse: painless initially then spreading necrotic ulcer over 24-72 h","Both: nausea, headache, low-grade fever"],
    tx:["Clean wound with soap and water","Ice pack 10 min on / 10 min off for black widow","Diphenhydramine for local reaction if available","Mark lesion border + time","Evacuate — both can progress severely"],
    avoid:"Do not squeeze wound. Do not apply heat to brown recluse bite." },
  { id:"tick", cat:"BITES & STINGS", severity:"low", evac:false,
    title:"Tick Removal & Disease Watch",
    signs:["Tick found embedded in skin","Bull's-eye rash (Lyme) appearing hours-days later","Flu symptoms post-removal: fever, chills, muscle ache","Tick paralysis: ascending weakness (rare)"],
    tx:["Fine-tipped tweezers: grasp as close to skin as possible","Pull straight out with steady even pressure — do not twist","Clean site with antiseptic","Save tick in sealed bag for identification","Watch for rash or flu symptoms 3-30 days post-bite","Seek care if rash appears or symptoms develop"],
    avoid:"No Vaseline, nail polish, or heat to encourage tick removal." },
  { id:"bee", cat:"BITES & STINGS", severity:"low", evac:false,
    title:"Bee / Wasp Sting",
    signs:["Immediate burning pain at sting site","Local swelling, redness, itching","Watch for systemic: throat tightness, SOB, dizziness"],
    tx:["Scrape stinger out — do not pinch or squeeze","Ice pack to reduce swelling","Diphenhydramine 25-50 mg for local reaction if available","Monitor 30 min for anaphylaxis","If systemic signs: treat as anaphylaxis immediately"],
    avoid:"Do not pinch stinger — injects more venom." },
  { id:"aquatic", cat:"BITES & STINGS", severity:"moderate", evac:false,
    title:"Aquatic Puncture (Stingray / Catfish / Sea Urchin)",
    signs:["Immediate intense pain at puncture site","Local swelling and redness","Stingray: barb may be embedded","Sea urchin: spines may break off under skin"],
    tx:["Immerse in hot water (~45C) for 30-90 min — denatures protein toxin","Remove visible spines/barbs with tweezers","Irrigate wound thoroughly after heat soak","Monitor for infection 24-48 h","Evac if barb deeply embedded or systemic reaction"],
    avoid:"Do not break off sea urchin spines — may shatter deeper into tissue." },
  { id:"scorpion", cat:"BITES & STINGS", severity:"moderate", evac:true,
    title:"Scorpion Sting",
    signs:["Immediate burning pain at sting site","Local numbness/tingling spreading from site","Systemic (bark scorpion): muscle twitching, drooling, abnormal eye movement","Children and elderly at highest risk"],
    tx:["Clean wound; ice pack for local pain","Monitor closely for systemic symptoms 1-2 hr","Diphenhydramine for local allergic reaction if available","Any systemic signs — evacuate immediately","Children stung in scorpion-endemic areas — evacuate as precaution"],
    avoid:"Do not apply tourniquet or attempt to suck out venom." },
  { id:"burn_thermal", cat:"BURNS", severity:"moderate", evac:true,
    title:"Thermal Burn (Fire / Scalding)",
    signs:["Superficial (1st): red, dry, painful — no blisters","Partial thickness (2nd): blisters, very painful, wet appearance","Full thickness (3rd): white/brown/black, leathery — painless center","Inhalation: singed nasal hair, hoarse voice, soot in mouth"],
    tx:["Cool with room-temp water 10-20 min — do NOT use ice","Remove jewelry/clothing from burned area if not adhered","Cover loosely with clean dry dressing","Partial thickness > palm size OR face/hands/genitals/joints — evacuate","Inhalation suspected — immediate evacuation","Do NOT pop blisters or apply butter/oils"],
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
    signs:["Hot skin — may be wet or dry","Altered mental status: confusion, combative, or unresponsive","Core temp > 40C (104F) if measurable","Rapid HR and RR","Nausea, vomiting, possible seizure"],
    tx:["COOL FIRST, TRANSPORT SECOND — cooling is definitive treatment","Strip clothing; immerse in cold water or ice packs to neck/axilla/groin","Fan aggressively — evaporation dramatically speeds cooling","Continue active cooling during evacuation","Monitor airway — vomiting risk if AMS","Emergency evacuation — heat stroke is life-threatening"],
    avoid:"Do not give oral fluids if AMS present — aspiration risk." },
  { id:"altitude", cat:"ENVIRONMENTAL", severity:"moderate", evac:true,
    title:"Altitude Illness (AMS / HACE / HAPE)",
    signs:["AMS: headache + nausea/fatigue/dizziness at > 2500 m","HACE: AMS + ataxia (stumbling) and/or severe AMS","HAPE: dry cough progressing to wet cough, SOB at rest, crackles, cyanosis"],
    tx:["AMS: stop ascent, rest, hydrate, ibuprofen for headache","Do not ascend until symptom-free for 24 h","HACE/HAPE: DESCEND IMMEDIATELY — minimum 300-1000 m","Supplemental O2 if available","Gamow bag if available","Dexamethasone (HACE) or Nifedipine (HAPE) if trained and available","HACE/HAPE: emergency evacuation"],
    avoid:"Never ascend with AMS symptoms. Descent is the only definitive treatment." },
  { id:"frostnip", cat:"ENVIRONMENTAL", severity:"low", evac:false,
    title:"Frostnip",
    signs:["Skin pale, cold, and numb","Tissue remains soft and pliable throughout","Rewarms quickly with body heat","No blisters form"],
    tx:["Rewarm with body heat — axilla, abdomen, or warm hands of rescuer","Do NOT rub — mechanical damage to tissue","Cover and insulate well after rewarming","Prevent re-exposure","Monitor closely for progression to frostbite"] },
  { id:"frostbite", cat:"ENVIRONMENTAL", severity:"high", evac:true,
    title:"Frostbite",
    signs:["Superficial: white/gray waxy skin, firm surface but soft underneath","Deep: white/gray skin, completely hard, wooden texture","Post-thaw: clear blisters (superficial) or bloody blisters (deep)","Complete numbness in affected area"],
    tx:["Do NOT rewarm if any risk of refreezing — refrozen tissue causes far greater damage","Protect from trauma; pad and wrap loosely","Rewarm only with definitive shelter guaranteed: 40-42C water bath for 15-30 min","Expect severe pain on rewarming — pain is a good sign","Ibuprofen if available","Do NOT walk on thawed feet","Evacuate all frostbite cases"],
    avoid:"Never rewarm if refreezing is possible. No dry heat. No rubbing." },
  { id:"dehydration", cat:"ENVIRONMENTAL", severity:"low", evac:false,
    title:"Dehydration",
    signs:["Thirst, dry mouth and lips","Dark urine or decreased urine output","Headache, fatigue, decreased performance","Dizziness on standing","Skin tenting on pinch test","Severe: AMS, rapid HR, hypotension"],
    tx:["Oral rehydration — water + electrolytes","500 mL over 30 min for mild dehydration","Sports drink, ORS, or dilute juice if available","Salty snack + water is an effective field solution","Severe (AMS or unable to drink) — IV fluids + evacuation","Monitor urine output and color to guide ongoing rehydration"] },
  { id:"gi_illness", cat:"GI ILLNESS", severity:"moderate", evac:false,
    title:"GI Illness / Gastroenteritis",
    signs:["Nausea, vomiting, diarrhea","Cramping abdominal pain","Possible low-grade fever","Onset 1-6 h: likely toxin; 6-24 h: likely bacterial"],
    tx:["Oral rehydration — small frequent sips of water or ORS","BRAT diet when tolerated: banana, rice, applesauce, toast","Ondansetron (Zofran) for vomiting if available","Rest and monitor vitals","Evac if: cannot keep fluids down 24 h, blood in stool, high fever, severe pain, or AMS"],
    avoid:"Do not give anti-diarrheals if bloody diarrhea or high fever present." },
  { id:"giardia", cat:"GI ILLNESS", severity:"moderate", evac:true,
    title:"Giardia / Waterborne Illness",
    signs:["Onset 1-3 weeks after exposure to untreated water","Explosive, watery, foul-smelling diarrhea","Bloating, cramping, gas","No fever typically","Prolonged course without treatment"],
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
    tx:["Sit upright — do not lay patient down","Albuterol MDI: 4-8 puffs via spacer every 20 min x3 if available","Pursed-lip breathing with calm reassurance","Keep warm — cold air worsens bronchospasm","Mild improvement in 20 min in known asthmatic — may monitor","No improvement, silent chest, or cyanosis — emergency evacuation"] },
  { id:"plant_contact", cat:"SKIN & ALLERGIC", severity:"low", evac:false,
    title:"Contact Dermatitis (Poison Ivy / Oak / Sumac)",
    signs:["Linear streaks of intense itching redness along contact lines","Vesicles and blisters in streaks or patches","Onset 12-72 h after plant contact","Fluid from blisters does NOT spread the rash"],
    tx:["Wash skin with soap and water ASAP — within 10 min is most effective","Rinse very thoroughly; wash all clothing and gear","Hydrocortisone cream to affected areas if available","Diphenhydramine orally for itch","Cool compresses for relief","Evac if: face or eye involvement, widespread rash, or severe swelling"],
    avoid:"Urushiol oil on gear can re-expose. Wash everything." },
  { id:"allergic_rx", cat:"SKIN & ALLERGIC", severity:"moderate", evac:true,
    title:"Allergic Reaction (Non-Anaphylactic)",
    signs:["Hives (urticaria) — raised, itchy welts on skin","Flushing and itching without airway or blood pressure symptoms","No wheezing, throat tightness, or hypotension","May progress to anaphylaxis — monitor closely"],
    tx:["Diphenhydramine 25-50 mg orally if available","Remove suspected allergen (food, plant, insect product)","Monitor every 15 min for 1 hour for systemic progression","Keep epinephrine immediately accessible","If worsening or any systemic signs develop — treat as anaphylaxis immediately"] },
  { id:"blister", cat:"MUSCULOSKELETAL", severity:"low", evac:false,
    title:"Blister Management",
    signs:["Friction hotspot progressing to fluid-filled blister","Pain with continued activity","Risk of rupture and infection if untreated"],
    tx:["Donut pad (moleskin or foam) around the blister — NOT directly over it","Large, tense blister: sterilize needle, drain at edge only, do NOT remove blister roof","Apply antibiotic ointment + non-stick dressing","Change dressing daily; watch for infection signs","Ruptured blister: trim loose skin carefully, treat as open wound"] },
  { id:"overuse", cat:"MUSCULOSKELETAL", severity:"low", evac:false,
    title:"Overuse / Tendinopathy",
    signs:["Gradual onset pain that increases with activity","Morning stiffness or stiffness after rest","Point tenderness along tendon","No acute mechanism of injury"],
    tx:["Rest from aggravating activity","Ice 20 min on/off x3 during acute phase","Ibuprofen if available","Gentle stretching and eccentric loading if tolerated","Tape or brace for continued activity if necessary","Evac if: unable to weight-bear, severe pain, or swelling suggesting rupture"] },
  { id:"seizure", cat:"NEUROLOGICAL", severity:"high", evac:true,
    title:"Seizure",
    signs:["Tonic-clonic: whole body stiffening followed by jerking","Post-ictal phase: prolonged confusion and fatigue after episode","May bite tongue or be incontinent","First seizure always requires medical evaluation"],
    tx:["Protect from injury — clear area of hazards; do NOT restrain patient","Turn on side (recovery position) during and after","Do NOT put anything in mouth during seizure","Time the seizure — > 5 min = status epilepticus, emergency","After: recovery position, monitor airway, assess LOR","First seizure, prolonged, or post-ictal AMS — evacuate"] },
  { id:"diabetic", cat:"NEUROLOGICAL", severity:"moderate", evac:true,
    title:"Diabetic Emergency / Hypoglycemia",
    signs:["Sudden onset: shaky, sweaty, pale, anxious","Patient may self-identify early hypoglycemia","Severe: confusion, unresponsive, or seizure","History of diabetes; may have missed meal or over-exerted"],
    tx:["Conscious + able to swallow: 15-20 g fast sugar (glucose tabs, juice, candy, honey)","Recheck in 15 min — repeat if no improvement","Follow with complex carb + protein snack once improving","Unconscious: do NOT give oral fluids — aspiration risk","Recovery position; monitor airway","Honey or glucose gel inside cheek if barely responsive","Evacuate if: unknown cause, unresponsive, or no improvement after treatment"] },
  { id:"infection", cat:"WOUND & INFECTION", severity:"moderate", evac:true,
    title:"Wound Infection / Cellulitis",
    signs:["Wound redness spreading beyond wound margins","Warmth, swelling, increasing pain after initial improvement","Purulent discharge or foul odor","Streaking redness tracking up limb (lymphangitis)","Fever, chills (systemic spread)"],
    tx:["Open wound to allow drainage if fluctuant (abscess)","Irrigate aggressively with clean water at high pressure","Warm soaks 3-4x daily if water available","Change dressings twice daily","Antibiotics required — evacuate for prescription","Spreading cellulitis or systemic symptoms — urgent evacuation","Lymphangitic streaking = emergency evacuation"] },
  { id:"impalement", cat:"WOUND & INFECTION", severity:"high", evac:true,
    title:"Impalement / Embedded Object",
    signs:["Object penetrating skin and remaining in place","May have entered body cavity (chest, abdomen)","Significant risk of major vessel or organ injury","Minimal external bleeding does not rule out internal injury"],
    tx:["Do NOT remove impaled object — it may be tamponading a vessel","Stabilize object in place with bulky dressings on both sides","Cut object to manageable length if necessary for transport","Monitor for signs of internal bleeding / shock","Cover any chest wound with occlusive dressing (3-sided tape)","Emergency evacuation"] },
];

/* ─── EVAC TRIGGERS ──────────────────────────────────────────────────────── */
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

/* ─── VITALS ─────────────────────────────────────────────────────────────── */
const VITAL_FIELDS = [
  { key:"lor",  label:"LOR",  placeholder:"A+O×4" },
  { key:"hr",   label:"HR",   placeholder:"bpm" },
  { key:"rr",   label:"RR",   placeholder:"brpm" },
  { key:"bp",   label:"BP",   placeholder:"sys" },
  { key:"sctm", label:"SCTM", placeholder:"PWD" },
];

function vitalsReducer(state, action) {
  if (action.type === "LOG")   return [...state, { ...action.entry, time: new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}) }];
  if (action.type === "CLEAR") return [];
  return state;
}

function SevBadge({ severity, evac }) {
  const s = severity==="high" ? {color:C.danger,label:"HIGH"} : severity==="moderate" ? {color:C.warn,label:"MOD"} : {color:C.accent,label:"LOW"};
  return (
    <div style={{ display:"flex", gap:"4px", alignItems:"center", flexShrink:0 }}>
      <span style={{ fontSize:"8px", fontWeight:700, letterSpacing:"0.12em", color:s.color, background:s.color+"22", padding:"2px 6px", borderRadius:"2px" }}>{s.label}</span>
      {evac && <span style={{ fontSize:"8px", fontWeight:700, letterSpacing:"0.1em", color:C.purple, background:C.purple+"22", padding:"2px 5px", borderRadius:"2px" }}>EVAC</span>}
    </div>
  );
}

export default function WFRField() {
  const [tab, setTab]                     = useState("pas");
  const [pasChecks, setPasChecks]         = useState({});
  const [openStep, setOpenStep]           = useState(0);
  const [openProtocol, setOpenProtocol]   = useState(null);
  const [openAilment, setOpenAilment]     = useState(null);
  const [vitalsLog, dispVitals]           = useReducer(vitalsReducer, []);
  const [vitalDraft, setVitalDraft]       = useState({});
  const [protoSearch, setProtoSearch]     = useState("");
  const [ailmentSearch, setAilmentSearch] = useState("");
  const [activeCat, setActiveCat]         = useState("ALL");

  const AILMENT_CATS = [...new Set(AILMENTS.map(a => a.cat))];
  const toggleCheck = (sid, item) => setPasChecks(p => ({ ...p, [`${sid}::${item}`]: !p[`${sid}::${item}`] }));
  const stepProg = s => { const d = s.items.filter(i => pasChecks[`${s.id}::${i}`]).length; return { d, t: s.items.length, pct: (d / s.items.length) * 100 }; };
  const logVitals = () => { if (Object.values(vitalDraft).some(v => v)) { dispVitals({ type:"LOG", entry:{ ...vitalDraft } }); setVitalDraft({}); } };

  const filteredAilments = AILMENTS.filter(a => {
    const catOk = activeCat === "ALL" || a.cat === activeCat;
    const q = ailmentSearch.toLowerCase();
    const textOk = !q || a.title.toLowerCase().includes(q) || a.signs.some(s => s.toLowerCase().includes(q)) || a.tx.some(t => t.toLowerCase().includes(q));
    return catOk && textOk;
  });

  const filteredProtocols = PROTOCOLS.filter(p => {
    const q = protoSearch.toLowerCase();
    return !q || p.title.toLowerCase().includes(q) || p.signs.some(s => s.toLowerCase().includes(q)) || p.tx.some(t => t.toLowerCase().includes(q));
  });

  const flagColor = f => f==="URGENT" ? C.danger : f==="MONITOR" ? C.warn : C.blue;
  const inputStyle = { background:C.surface, border:`1px solid ${C.border}`, borderRadius:"4px", padding:"12px 14px", color:C.white, fontFamily:mono, fontSize:"13px", outline:"none", width:"100%", boxSizing:"border-box" };

  return (
    <div style={{ background:C.bg, minHeight:"100vh", color:C.text, fontFamily:mono, maxWidth:"480px", margin:"0 auto", display:"flex", flexDirection:"column" }}>

      <div style={{ padding:"14px 16px 10px", borderBottom:`1px solid ${C.border}`, background:C.surface }}>
        <div style={{ display:"flex", alignItems:"baseline", gap:"10px" }}>
          <span style={{ fontSize:"18px", fontWeight:700, color:C.accent, letterSpacing:"-0.02em", fontFamily:sans }}>FIELD MED</span>
          <span style={{ fontSize:"9px", color:C.textDim, letterSpacing:"0.2em" }}>WFR BACKCOUNTRY REFERENCE</span>
        </div>
      </div>

      <div style={{ display:"flex", borderBottom:`1px solid ${C.border}`, background:C.surface, flexShrink:0, overflowX:"auto" }}>
        {[{id:"pas",label:"PAS"},{id:"vitals",label:"VITALS"},{id:"protocols",label:"PROTOCOLS"},{id:"ailments",label:"AILMENTS"},{id:"evac",label:"EVAC"}].map(t => (
          <button key={t.id} onClick={()=>setTab(t.id)} style={{ flex:"0 0 auto", padding:"12px 14px", border:"none", background:tab===t.id?C.raised:"transparent", color:tab===t.id?C.accent:C.textDim, fontFamily:mono, fontSize:"11px", fontWeight:700, letterSpacing:"0.08em", cursor:"pointer", borderBottom:tab===t.id?`2px solid ${C.accent}`:"2px solid transparent" }}>{t.label}</button>
        ))}
      </div>

      <div style={{ flex:1, overflowY:"auto", padding:"12px" }}>

        {tab==="pas" && (
          <div style={{ display:"flex", flexDirection:"column", gap:"6px" }}>
            <div style={{ fontSize:"9px", color:C.textFaint, letterSpacing:"0.15em", marginBottom:"4px" }}>PATIENT ASSESSMENT SYSTEM — TAP ITEMS TO CHECK OFF</div>
            {PAS.map((step, idx) => {
              const { d, t, pct } = stepProg(step);
              const isOpen = openStep === idx;
              const complete = d === t;
              return (
                <div key={step.id} style={{ background:C.surface, border:`1px solid ${complete?C.accentDim:isOpen?C.border:C.textFaint+"40"}`, borderRadius:"4px", overflow:"hidden" }}>
                  <button onClick={()=>setOpenStep(isOpen?-1:idx)} style={{ width:"100%", padding:"13px 14px", background:"transparent", border:"none", display:"flex", alignItems:"center", gap:"10px", cursor:"pointer", textAlign:"left" }}>
                    <div style={{ width:"10px", height:"10px", borderRadius:"50%", flexShrink:0, background:complete?C.accent:d>0?C.warn:C.textFaint, boxShadow:complete?`0 0 8px ${C.accent}60`:"none" }} />
                    <span style={{ fontSize:"8px", fontWeight:700, letterSpacing:"0.12em", color:step.color, flexShrink:0 }}>{step.tag}</span>
                    <span style={{ fontSize:"13px", fontWeight:700, color:complete?C.textDim:C.white, flex:1 }}>{step.label}</span>
                    <span style={{ fontSize:"10px", color:complete?C.accent:C.textDim, flexShrink:0 }}>{d}/{t}</span>
                  </button>
                  <div style={{ height:"2px", background:C.border }}><div style={{ height:"100%", width:`${pct}%`, background:complete?C.accent:C.warn, transition:"width 0.3s" }} /></div>
                  {isOpen && (
                    <div style={{ padding:"10px 14px 14px", display:"flex", flexDirection:"column", gap:"4px" }}>
                      {step.items.map(item => {
                        const checked = !!pasChecks[`${step.id}::${item}`];
                        return (
                          <button key={item} onClick={()=>toggleCheck(step.id, item)} style={{ display:"flex", alignItems:"center", gap:"12px", padding:"11px 10px", borderRadius:"3px", background:checked?C.accentDim+"60":C.raised, border:`1px solid ${checked?C.accentDim:C.border}`, cursor:"pointer", textAlign:"left", width:"100%" }}>
                            <div style={{ width:"18px", height:"18px", borderRadius:"3px", flexShrink:0, background:checked?C.accent:"transparent", border:`2px solid ${checked?C.accent:C.textFaint}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"11px", color:C.bg, fontWeight:900 }}>{checked?"✓":""}</div>
                            <span style={{ fontSize:"13px", color:checked?C.textDim:C.text, textDecoration:checked?"line-through":"none" }}>{item}</span>
                          </button>
                        );
                      })}
                      <button onClick={()=>{ const ks=step.items.map(i=>`${step.id}::${i}`); const all=ks.every(k=>pasChecks[k]); const u={}; ks.forEach(k=>u[k]=!all); setPasChecks(p=>({...p,...u})); }} style={{ marginTop:"6px", padding:"9px", background:"transparent", border:`1px dashed ${C.textFaint}`, borderRadius:"3px", color:C.textDim, fontFamily:mono, fontSize:"10px", cursor:"pointer", letterSpacing:"0.05em" }}>
                        {step.items.every(i=>pasChecks[`${step.id}::${i}`])?"↩ UNCHECK ALL":"✓ CHECK ALL"}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
            <button onClick={()=>{ setPasChecks({}); setOpenStep(0); }} style={{ marginTop:"6px", padding:"11px", background:"transparent", border:`1px solid ${C.dangerDim}`, borderRadius:"4px", color:C.danger, fontFamily:mono, fontSize:"10px", cursor:"pointer", letterSpacing:"0.1em" }}>✕ RESET ASSESSMENT</button>
          </div>
        )}

        {tab==="vitals" && (
          <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
            <div style={{ fontSize:"9px", color:C.textFaint, letterSpacing:"0.15em" }}>VITALS LOG</div>
            <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:"4px", padding:"12px" }}>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(5, 1fr)", gap:"6px", marginBottom:"10px" }}>
                {VITAL_FIELDS.map(f => (
                  <div key={f.key} style={{ display:"flex", flexDirection:"column", gap:"4px" }}>
                    <label style={{ fontSize:"9px", color:C.textDim, letterSpacing:"0.1em" }}>{f.label}</label>
                    <input value={vitalDraft[f.key]||""} onChange={e=>setVitalDraft(p=>({...p,[f.key]:e.target.value}))} placeholder={f.placeholder} style={{ background:C.raised, border:`1px solid ${C.border}`, borderRadius:"3px", padding:"8px 4px", color:C.white, fontFamily:mono, fontSize:"12px", width:"100%", textAlign:"center", outline:"none", boxSizing:"border-box" }} />
                  </div>
                ))}
              </div>
              <button onClick={logVitals} style={{ width:"100%", padding:"12px", background:C.accentDim, border:`1px solid ${C.accent}`, borderRadius:"3px", color:C.accent, fontFamily:mono, fontSize:"12px", fontWeight:700, letterSpacing:"0.1em", cursor:"pointer" }}>+ LOG VITALS</button>
            </div>
            <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:"4px", padding:"12px" }}>
              <div style={{ fontSize:"9px", color:C.textFaint, letterSpacing:"0.12em", marginBottom:"8px" }}>SCTM QUICK REF</div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"6px" }}>
                {[{label:"Normal",val:"Pink / Warm / Dry",color:C.accent},{label:"Shock",val:"Pale / Cool / Clammy",color:C.danger},{label:"Heat ill.",val:"Red / Hot / Wet or Dry",color:C.warn},{label:"Hypo.",val:"Gray / Cold / Dry",color:C.blue}].map(s=>(
                  <div key={s.label} style={{ padding:"8px 10px", background:C.raised, borderRadius:"3px", borderLeft:`3px solid ${s.color}` }}>
                    <div style={{ fontSize:"9px", color:C.textDim }}>{s.label}</div>
                    <div style={{ fontSize:"11px", color:s.color, marginTop:"2px" }}>{s.val}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:"4px", padding:"12px" }}>
              <div style={{ fontSize:"9px", color:C.textFaint, letterSpacing:"0.12em", marginBottom:"8px" }}>NORMAL ADULT RANGES</div>
              {[{l:"HR",n:"60-100 bpm",b:"<50 or >130"},{l:"RR",n:"12-20 brpm",b:"<8 or >24"},{l:"SYS BP",n:">90 mmHg",b:"<80"},{l:"SpO2",n:">94%",b:"<90%"},{l:"CRT",n:"<2 sec",b:">2 sec"}].map(r=>(
                <div key={r.l} style={{ display:"flex", alignItems:"center", padding:"7px 0", borderBottom:`1px solid ${C.border}`, gap:"10px" }}>
                  <span style={{ fontSize:"11px", color:C.textDim, width:"50px", flexShrink:0 }}>{r.l}</span>
                  <span style={{ fontSize:"12px", color:C.accent, flex:1 }}>{r.n}</span>
                  <span style={{ fontSize:"10px", color:C.danger }}>{r.b}</span>
                </div>
              ))}
            </div>
            {vitalsLog.length > 0 && (
              <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:"4px", padding:"12px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"8px" }}>
                  <span style={{ fontSize:"9px", color:C.textFaint, letterSpacing:"0.12em" }}>TREND LOG ({vitalsLog.length})</span>
                  <button onClick={()=>dispVitals({type:"CLEAR"})} style={{ background:"transparent", border:"none", color:C.danger, fontSize:"10px", cursor:"pointer", fontFamily:mono }}>CLEAR</button>
                </div>
                <div style={{ overflowX:"auto" }}>
                  <table style={{ width:"100%", borderCollapse:"collapse", fontSize:"11px" }}>
                    <thead><tr>{["TIME",...VITAL_FIELDS.map(f=>f.label)].map(h=><th key={h} style={{ padding:"4px 6px", color:C.textDim, fontWeight:700, textAlign:"center", borderBottom:`1px solid ${C.border}`, fontSize:"9px", letterSpacing:"0.08em" }}>{h}</th>)}</tr></thead>
                    <tbody>{[...vitalsLog].reverse().map((e,i)=><tr key={i}><td style={{ padding:"6px", color:C.textDim, fontSize:"10px", textAlign:"center" }}>{e.time}</td>{VITAL_FIELDS.map(f=><td key={f.key} style={{ padding:"6px", color:e[f.key]?C.white:C.textFaint, textAlign:"center" }}>{e[f.key]||"—"}</td>)}</tr>)}</tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {tab==="protocols" && (
          <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
            <input value={protoSearch} onChange={e=>setProtoSearch(e.target.value)} placeholder="Search protocols..." style={inputStyle} />
            {filteredProtocols.map(p => {
              const isOpen = openProtocol===p.id;
              const fc = flagColor(p.flag);
              return (
                <div key={p.id} style={{ background:C.surface, border:`1px solid ${isOpen?fc+"60":C.border}`, borderRadius:"4px", overflow:"hidden" }}>
                  <button onClick={()=>setOpenProtocol(isOpen?null:p.id)} style={{ width:"100%", padding:"14px", background:"transparent", border:"none", display:"flex", alignItems:"center", gap:"10px", cursor:"pointer", textAlign:"left" }}>
                    <span style={{ fontSize:"8px", fontWeight:700, letterSpacing:"0.15em", color:fc, background:fc+"20", padding:"3px 7px", borderRadius:"2px", flexShrink:0 }}>{p.flag}</span>
                    <span style={{ fontSize:"14px", fontWeight:700, color:C.white, flex:1 }}>{p.title}</span>
                    <span style={{ color:C.textFaint, fontSize:"11px" }}>{isOpen?"▲":"▼"}</span>
                  </button>
                  {isOpen && (
                    <div style={{ padding:"0 14px 16px" }}>
                      <div style={{ fontSize:"9px", color:C.textFaint, letterSpacing:"0.15em", marginBottom:"8px" }}>RECOGNIZE</div>
                      {p.signs.map((s,i)=><div key={i} style={{ display:"flex", gap:"8px", alignItems:"flex-start", padding:"5px 0", borderBottom:`1px solid ${C.border}` }}><span style={{ color:C.warn, flexShrink:0 }}>◆</span><span style={{ fontSize:"12px", color:C.text, lineHeight:"1.4" }}>{s}</span></div>)}
                      <div style={{ fontSize:"9px", color:C.textFaint, letterSpacing:"0.15em", margin:"12px 0 8px" }}>TREAT</div>
                      {p.tx.map((t,i)=><div key={i} style={{ display:"flex", gap:"8px", alignItems:"flex-start", padding:"6px 8px", marginBottom:"4px", background:C.raised, borderRadius:"3px", borderLeft:`3px solid ${fc}40` }}><span style={{ color:fc, flexShrink:0, fontSize:"10px", marginTop:"2px", fontWeight:700 }}>{i+1}</span><span style={{ fontSize:"12px", color:C.text, lineHeight:"1.4" }}>{t}</span></div>)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {tab==="ailments" && (
          <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
            <input value={ailmentSearch} onChange={e=>setAilmentSearch(e.target.value)} placeholder="Search by condition or symptom..." style={inputStyle} />
            <div style={{ display:"flex", gap:"5px", flexWrap:"wrap" }}>
              {["ALL",...AILMENT_CATS].map(cat => (
                <button key={cat} onClick={()=>setActiveCat(cat)} style={{ padding:"5px 9px", border:`1px solid ${activeCat===cat?C.accent:C.border}`, borderRadius:"3px", background:activeCat===cat?C.accentDim:"transparent", color:activeCat===cat?C.accent:C.textDim, fontFamily:mono, fontSize:"9px", fontWeight:700, letterSpacing:"0.06em", cursor:"pointer", whiteSpace:"nowrap" }}>{cat}</button>
              ))}
            </div>
            <div style={{ fontSize:"9px", color:C.textFaint, letterSpacing:"0.1em" }}>{filteredAilments.length} CONDITION{filteredAilments.length!==1?"S":""}</div>
            {filteredAilments.map(a => {
              const isOpen = openAilment===a.id;
              const sevColor = a.severity==="high"?C.danger:a.severity==="moderate"?C.warn:C.accent;
              return (
                <div key={a.id} style={{ background:C.surface, border:`1px solid ${isOpen?sevColor+"50":C.border}`, borderRadius:"4px", overflow:"hidden" }}>
                  <button onClick={()=>setOpenAilment(isOpen?null:a.id)} style={{ width:"100%", padding:"13px 14px", background:"transparent", border:"none", display:"flex", alignItems:"center", gap:"10px", cursor:"pointer", textAlign:"left" }}>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:"8px", color:C.textFaint, fontWeight:700, letterSpacing:"0.1em", marginBottom:"3px" }}>{a.cat}</div>
                      <span style={{ fontSize:"14px", fontWeight:700, color:C.white }}>{a.title}</span>
                    </div>
                    <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:"5px", flexShrink:0 }}>
                      <SevBadge severity={a.severity} evac={a.evac} />
                      <span style={{ color:C.textFaint, fontSize:"11px" }}>{isOpen?"▲":"▼"}</span>
                    </div>
                  </button>
                  {isOpen && (
                    <div style={{ padding:"0 14px 16px" }}>
                      <div style={{ marginBottom:"12px" }}>
                        <div style={{ fontSize:"9px", color:C.textFaint, letterSpacing:"0.15em", marginBottom:"8px" }}>RECOGNIZE</div>
                        {a.signs.map((s,i)=><div key={i} style={{ display:"flex", gap:"8px", alignItems:"flex-start", padding:"5px 0", borderBottom:`1px solid ${C.border}` }}><span style={{ color:sevColor, flexShrink:0, fontSize:"9px", marginTop:"3px" }}>◆</span><span style={{ fontSize:"12px", color:C.text, lineHeight:"1.4" }}>{s}</span></div>)}
                      </div>
                      <div style={{ marginBottom:a.avoid?"10px":0 }}>
                        <div style={{ fontSize:"9px", color:C.textFaint, letterSpacing:"0.15em", marginBottom:"8px" }}>TREAT</div>
                        {a.tx.map((t,i)=><div key={i} style={{ display:"flex", gap:"8px", alignItems:"flex-start", padding:"6px 8px", marginBottom:"4px", background:C.raised, borderRadius:"3px", borderLeft:`3px solid ${sevColor}40` }}><span style={{ color:sevColor, flexShrink:0, fontSize:"10px", marginTop:"2px", fontWeight:700 }}>{i+1}</span><span style={{ fontSize:"12px", color:C.text, lineHeight:"1.4" }}>{t}</span></div>)}
                      </div>
                      {a.avoid && <div style={{ padding:"8px 10px", background:C.dangerDim+"50", border:`1px solid ${C.danger}40`, borderRadius:"3px", marginBottom:"8px" }}><span style={{ fontSize:"9px", color:C.danger, fontWeight:700, letterSpacing:"0.1em" }}>⚠ AVOID: </span><span style={{ fontSize:"11px", color:"#e8a0a0", lineHeight:"1.4" }}>{a.avoid}</span></div>}
                      {a.evac && <div style={{ padding:"7px 10px", background:C.purple+"15", border:`1px solid ${C.purple}40`, borderRadius:"3px", fontSize:"10px", color:C.purple, fontWeight:700, letterSpacing:"0.08em" }}>↑ EVACUATION INDICATED</div>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {tab==="evac" && (
          <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
            <div style={{ fontSize:"9px", color:C.textFaint, letterSpacing:"0.15em", marginBottom:"2px" }}>EVACUATION DECISION GUIDE</div>
            {[
              {label:"EMERGENCY EVACUATION",sub:"Fastest possible — call for help now",color:C.danger,items:EVAC_TRIGGERS.emergency},
              {label:"URGENT EVACUATION",sub:"Within hours — monitor closely en route",color:C.warn,items:EVAC_TRIGGERS.urgent},
              {label:"MONITOR / PLANNED",sub:"May walk out — reassess frequently",color:C.accent,items:EVAC_TRIGGERS.monitor},
            ].map(cat=>(
              <div key={cat.label} style={{ background:C.surface, border:`1px solid ${cat.color}40`, borderRadius:"4px", overflow:"hidden" }}>
                <div style={{ padding:"12px 14px", background:cat.color+"15", borderBottom:`1px solid ${cat.color}30` }}>
                  <div style={{ fontSize:"12px", fontWeight:700, color:cat.color, letterSpacing:"0.05em" }}>{cat.label}</div>
                  <div style={{ fontSize:"10px", color:C.textDim, marginTop:"2px" }}>{cat.sub}</div>
                </div>
                <div style={{ padding:"10px 14px 14px" }}>
                  {cat.items.map((item,i)=><div key={i} style={{ display:"flex", gap:"10px", alignItems:"flex-start", padding:"6px 0", borderBottom:`1px solid ${C.border}` }}><span style={{ color:cat.color, flexShrink:0, fontSize:"8px", marginTop:"4px" }}>■</span><span style={{ fontSize:"12px", color:C.text, lineHeight:"1.4" }}>{item}</span></div>)}
                </div>
              </div>
            ))}
            <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:"4px", padding:"14px" }}>
              <div style={{ fontSize:"9px", color:C.textFaint, letterSpacing:"0.15em", marginBottom:"10px" }}>FIELD RULES</div>
              {["When in doubt — evacuate","Declining vitals = emergency evac","Unstable AMS = immediate evac","No diagnosis needed to evacuate","Document vitals + time before leaving"].map((r,i)=>(
                <div key={i} style={{ padding:"8px 10px", marginBottom:"6px", background:C.raised, borderRadius:"3px", borderLeft:`3px solid ${C.accentDim}`, fontSize:"12px", color:C.text, lineHeight:"1.4" }}>{r}</div>
              ))}
            </div>
          </div>
        )}

      </div>

      <div style={{ padding:"8px 16px", borderTop:`1px solid ${C.border}`, background:C.surface, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <span style={{ fontSize:"9px", color:C.textFaint, letterSpacing:"0.1em" }}>NOLS WFR REFERENCE</span>
        <span style={{ fontSize:"9px", color:C.textFaint, letterSpacing:"0.1em" }}>NOT A SUBSTITUTE FOR TRAINING</span>
      </div>
    </div>
  );
}
