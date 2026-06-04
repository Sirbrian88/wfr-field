/**
 * Offline Triage Web Worker
 * Uses Transformers.js v3 with a small text2text model for offline inference.
 * Posts progress messages back to the main thread.
 */

// Transformers.js v3 — loaded via CDN import or bundler
import { pipeline, env } from "@huggingface/transformers";

// Allow model caching via Cache API
env.useBrowserCache = true;
env.allowLocalModels = false;

const MODEL_ID = "Xenova/LaMini-Flan-T5-248M";
let generator = null;
let isLoading = false;

/**
 * Post a typed message back to main thread
 */
function post(type, payload) {
  self.postMessage({ type, ...payload });
}

/**
 * Load the model if not already loaded.
 * Posts progress events during download.
 */
async function loadModel() {
  if (generator) return generator;
  if (isLoading) {
    // Wait for the load in progress
    await new Promise((resolve) => {
      const check = setInterval(() => {
        if (!isLoading) {
          clearInterval(check);
          resolve();
        }
      }, 200);
    });
    return generator;
  }

  isLoading = true;
  post("progress", { stage: "Initializing model…", percent: 0 });

  try {
    generator = await pipeline("text2text-generation", MODEL_ID, {
      progress_callback: (progressInfo) => {
        // progressInfo shape: { status, name, file, loaded, total, progress }
        if (progressInfo.status === "downloading") {
          const pct = progressInfo.progress
            ? Math.round(progressInfo.progress)
            : 0;
          const mb = progressInfo.total
            ? `${Math.round(progressInfo.loaded / 1e6)}/${Math.round(
                progressInfo.total / 1e6
              )} MB`
            : "";
          post("progress", {
            stage: `Downloading model ${mb}`,
            percent: pct,
          });
        } else if (progressInfo.status === "loading") {
          post("progress", { stage: "Loading model into memory…", percent: 95 });
        }
      },
    });

    post("progress", { stage: "Model ready", percent: 100 });
    post("ready", {});
    return generator;
  } catch (err) {
    post("error", { message: `Failed to load model: ${err.message}` });
    isLoading = false;
    generator = null;
    throw err;
  } finally {
    isLoading = false;
  }
}

/**
 * Build a constrained prompt for the small model.
 * Small models can't do complex JSON reliably, so we extract fields one by one
 * via simple yes/no + extraction prompts, then assemble the JSON.
 */
async function runOfflineInference(notes) {
  const gen = await loadModel();
  post("progress", { stage: "Analyzing notes…", percent: 50 });

  const ask = async (prompt, maxNew = 80) => {
    const result = await gen(prompt, {
      max_new_tokens: maxNew,
      do_sample: false,
    });
    return (result[0]?.generated_text || "").trim();
  };

  const lc = notes.toLowerCase();

  // --- Heuristic fast-path for critical flags ---
  const hasAMS =
    /\b(altered|ams|unresponsive|confused|disoriented|unconscious|lethargic|altered mental)\b/i.test(
      notes
    );
  const hasHighMOI =
    /\b(fall|fell|height|impact|vehicle|mvc|diving|avalanche|lightning|struck|rollover)\b/i.test(
      notes
    );
  const hasUncontrolledBleeding =
    /uncontrolled\s+bleeding|won'?t\s+stop\s+bleeding|bleeding\s+uncontrolled/i.test(
      notes
    );
  const hasShockSigns =
    /\b(pale|clammy|weak\s+pulse|thready|rapid\s+pulse|diaphoretic|dizzy|syncope)\b/i.test(
      notes
    );
  const hasSpinePain =
    /\b(neck\s+pain|back\s+pain|spine|midline|cervical|c-spine|thoracic|lumbar)\b/i.test(
      notes
    );

  // --- Extract key fields via model ---
  const moiRaw = await ask(
    `Summarize the mechanism of injury or nature of illness in one sentence: ${notes.slice(0, 400)}`
  );

  const chiefComplaint = await ask(
    `What is the chief complaint in these notes? Answer in one sentence: ${notes.slice(0, 400)}`
  );

  const problemsRaw = await ask(
    `List the top medical problems identified in these notes, one per line: ${notes.slice(0, 400)}`,
    120
  );

  const planRaw = await ask(
    `What treatment or care was given or should be given based on these notes? One sentence: ${notes.slice(0, 400)}`
  );

  post("progress", { stage: "Applying protocols…", percent: 75 });

  // --- Apply NOLS protocol rules ---
  let spineRuled = "";
  let evacType = "";
  let shock = "";
  let spineField = "";
  let lorField = "";
  let bleedingField = "";

  if (hasAMS) {
    lorField = "V — Responds to voice";
    spineRuled = "Not cleared — immobilized";
    spineField = "Indicated — immobilized";
    evacType = "Emergency — call now";
  }

  if (hasHighMOI) {
    spineRuled = spineRuled || "Not cleared — immobilized";
    spineField = spineField || "Indicated — immobilized";
    evacType = evacType || "Emergency — call now";
  }

  if (hasSpinePain && !hasHighMOI && !hasAMS) {
    spineRuled = spineRuled || "Unable to assess";
    evacType = evacType || "Urgent — within hours";
  }

  if (hasUncontrolledBleeding) {
    bleedingField = "Uncontrolled";
    shock = "Confirmed — emergency evac";
    evacType = "Emergency — call now";
  } else if (hasShockSigns) {
    shock = "Suspected — treating";
    evacType = evacType || "Urgent — within hours";
  }

  // Extract pain scale
  const painMatch = notes.match(/\b(\d{1,2})\s*\/\s*10\b|\bpain[:\s]+(\d{1,2})\b/i);
  const painVal = painMatch
    ? String(parseInt(painMatch[1] || painMatch[2], 10))
    : "";

  // Airway / breathing
  let airway = "";
  let breathing = "";
  if (/\bairway\s+(open|clear|patent)\b/i.test(notes)) airway = "Open";
  else if (/\bairway\s+(compromised|obstructed|blocked)\b/i.test(notes))
    airway = "Compromised — repositioned";

  if (/\bbreathing\s+(normal|present|adequate)\b/i.test(notes))
    breathing = "Present — normal";
  else if (/\bbreathing\s+(labored|difficulty|laboured)\b/i.test(notes))
    breathing = "Present — labored";
  else if (/\bno\s+breathing|apnea|absent\s+breath/i.test(notes))
    breathing = "Absent";

  // Alert / LOC
  if (!lorField) {
    if (/\ba\+ox4|alert.*orient.*x\s*4|axo4/i.test(notes)) lorField = "A+Ox4 — Alert, oriented ×4";
    else if (/\ba\+ox3|axo3/i.test(notes)) lorField = "A+Ox3";
    else if (/\ba\+ox2|axo2/i.test(notes)) lorField = "A+Ox2";
    else if (/\ba\+ox1|axo1/i.test(notes)) lorField = "A+Ox1";
    else if (/\bresponds\s+to\s+voice\b/i.test(notes)) lorField = "V — Responds to voice";
    else if (/\bresponds\s+to\s+pain\b/i.test(notes)) lorField = "P — Responds to pain";
    else if (/\bunresponsive\b/i.test(notes)) lorField = "U — Unresponsive";
  }

  // Age/sex
  const ageMatch = notes.match(/\b(\d{1,3})\s*(year|yo|y\/o|y\.o\.?)?[\s\-]*(male|female|m|f)\b/i);
  const ageField = ageMatch ? ageMatch[0] : "";

  // Allergy
  const allergyMatch = notes.match(/allergies?[:\s]+([^.\n]+)/i);
  const allergyField = allergyMatch ? allergyMatch[1].trim() : "";

  // Medications
  const medsMatch = notes.match(/medications?[:\s]+([^.\n]+)/i);
  const medsField = medsMatch ? medsMatch[1].trim() : "";

  // Last intake
  const lastMatch = notes.match(/last\s+(ate|drink|intake|meal|food)[:\s]+([^.\n]+)/i);
  const lastField = lastMatch ? lastMatch[2].trim() : "";

  post("progress", { stage: "Building assessment…", percent: 90 });

  const triage = {
    scene: {
      numPatients: "1",
      moi: moiRaw,
      sceneSafe: "",
      resources: "",
    },
    initial: {
      lor: lorField,
      airway: airway,
      breathing: breathing,
      bleeding: bleedingField || (hasShockSigns ? "Controlled" : ""),
      spine: spineField,
      notes: chiefComplaint,
    },
    headtoe: {
      head: "",
      neck: hasSpinePain ? "Midline tenderness noted" : "",
      chest: "",
      abdomen: "",
      extremities: "",
      posterior: "",
      notes: "",
    },
    history: {
      age: ageField,
      opqrst: "",
      signs: chiefComplaint,
      allergy: allergyField,
      meds: medsField,
      history: "",
      last: lastField,
      events: moiRaw,
      pain: painVal,
    },
    problems: {
      problems: problemsRaw,
      spineRuled: spineRuled,
      shock: shock,
      evacType: evacType,
      plan: planRaw,
    },
    pfa: { pfaNotes: "" },
    interventions: { interventionNotes: "" },
    monitor: {
      trend: "",
      anticipated: "",
      evacPlan: "",
      comms: "",
    },
    vitals: [],
    notes: "",
    rescueLocation: {
      landmark: "",
      trail: "",
      terrain: "",
      lzAvailable: "",
      lzNotes: "",
      lookFor: "",
    },
  };

  post("progress", { stage: "Done", percent: 100 });
  return triage;
}

// Message handler
self.onmessage = async (event) => {
  const { type, payload } = event.data;

  if (type === "init") {
    try {
      await loadModel();
    } catch {
      // error already posted
    }
    return;
  }

  if (type === "triage") {
    const notes = payload?.notes || "";
    try {
      const result = await runOfflineInference(notes);
      post("result", { triage: result });
    } catch (err) {
      post("error", { message: err.message || "Offline inference failed" });
    }
    return;
  }
};
