/**
 * Offline Triage Web Worker — loaded as a static file from /public/workers/
 * Uses Transformers.js v3 via CDN so Next.js never tries to bundle it.
 */

// Load Transformers.js from CDN
importScripts("https://cdn.jsdelivr.net/npm/@huggingface/transformers@3/dist/transformers.min.js");

const { pipeline, env } = self.transformers;

env.useBrowserCache = true;
env.allowLocalModels = false;

const MODEL_ID = "Xenova/LaMini-Flan-T5-248M";
let generator = null;
let isLoading = false;

function post(type, payload) {
  self.postMessage({ type, ...payload });
}

async function loadModel() {
  if (generator) return generator;
  if (isLoading) {
    await new Promise((resolve) => {
      const check = setInterval(() => { if (!isLoading) { clearInterval(check); resolve(); } }, 200);
    });
    return generator;
  }
  isLoading = true;
  post("progress", { stage: "Initializing model…", percent: 0 });
  try {
    generator = await pipeline("text2text-generation", MODEL_ID, {
      progress_callback: (info) => {
        if (info.status === "downloading") {
          const pct = info.progress ? Math.round(info.progress) : 0;
          const mb = info.total ? `${Math.round(info.loaded/1e6)}/${Math.round(info.total/1e6)} MB` : "";
          post("progress", { stage: `Downloading model ${mb}`, percent: pct });
        } else if (info.status === "loading") {
          post("progress", { stage: "Loading model…", percent: 95 });
        }
      },
    });
    post("progress", { stage: "Model ready", percent: 100 });
    post("ready", {});
    return generator;
  } catch (err) {
    post("error", { message: `Failed to load model: ${err.message}` });
    generator = null;
    throw err;
  } finally {
    isLoading = false;
  }
}

async function runOfflineInference(notes) {
  const gen = await loadModel();
  post("progress", { stage: "Analyzing notes…", percent: 50 });

  const ask = async (prompt, maxNew = 80) => {
    const result = await gen(prompt, { max_new_tokens: maxNew, do_sample: false });
    return (result[0]?.generated_text || "").trim();
  };

  const lc = notes.toLowerCase();
  const hasAMS = /\b(altered|ams|unresponsive|confused|disoriented|unconscious|lethargic)\b/i.test(notes);
  const hasHighMOI = /\b(fall|fell|height|impact|vehicle|mvc|diving|avalanche|lightning|struck)\b/i.test(notes);
  const hasUncontrolledBleeding = /uncontrolled\s+bleeding|won'?t\s+stop\s+bleeding/i.test(notes);
  const hasShockSigns = /\b(pale|clammy|weak\s+pulse|thready|rapid\s+pulse|diaphoretic)\b/i.test(notes);
  const hasSpinePain = /\b(neck\s+pain|back\s+pain|spine|midline|cervical|c-spine)\b/i.test(notes);

  const moiRaw = await ask(`Summarize the mechanism of injury or nature of illness in one sentence: ${notes.slice(0, 400)}`);
  const chiefComplaint = await ask(`What is the chief complaint in these notes? One sentence: ${notes.slice(0, 400)}`);
  const problemsRaw = await ask(`List the top medical problems identified in these notes, one per line: ${notes.slice(0, 400)}`, 120);
  const planRaw = await ask(`What treatment should be given based on these notes? One sentence: ${notes.slice(0, 400)}`);

  post("progress", { stage: "Applying protocols…", percent: 75 });

  let spineRuled = "", evacType = "", shock = "", spineField = "", lorField = "", bleedingField = "";

  if (hasAMS) { lorField = "V — Responds to voice"; spineRuled = "Not cleared — immobilized"; spineField = "Indicated — immobilized"; evacType = "Emergency — call now"; }
  if (hasHighMOI) { spineRuled = spineRuled || "Not cleared — immobilized"; spineField = spineField || "Indicated — immobilized"; evacType = evacType || "Emergency — call now"; }
  if (hasSpinePain && !hasHighMOI && !hasAMS) { spineRuled = spineRuled || "Unable to assess"; evacType = evacType || "Urgent — within hours"; }
  if (hasUncontrolledBleeding) { bleedingField = "Uncontrolled"; shock = "Confirmed — emergency evac"; evacType = "Emergency — call now"; }
  else if (hasShockSigns) { shock = "Suspected — treating"; evacType = evacType || "Urgent — within hours"; }

  const painMatch = notes.match(/\b(\d{1,2})\s*\/\s*10\b|\bpain[:\s]+(\d{1,2})\b/i);
  const painVal = painMatch ? String(parseInt(painMatch[1] || painMatch[2], 10)) : "";

  let airway = "", breathing = "";
  if (/airway\s+(open|clear|patent)/i.test(notes)) airway = "Open";
  else if (/airway\s+(compromised|obstructed)/i.test(notes)) airway = "Compromised — repositioned";
  if (/breathing\s+(normal|present|adequate)/i.test(notes)) breathing = "Present — normal";
  else if (/breathing\s+(labored|difficulty)/i.test(notes)) breathing = "Present — labored";
  else if (/no\s+breathing|apnea/i.test(notes)) breathing = "Absent";

  if (!lorField) {
    if (/a\+ox4|alert.*orient.*x\s*4/i.test(notes)) lorField = "A+Ox4 — Alert, oriented ×4";
    else if (/a\+ox3/i.test(notes)) lorField = "A+Ox3";
    else if (/unresponsive/i.test(notes)) lorField = "U — Unresponsive";
  }

  const ageMatch = notes.match(/\b(\d{1,3})\s*(year|yo|y\/o)?[\s\-]*(male|female|m|f)\b/i);
  const allergyMatch = notes.match(/allergies?[:\s]+([^.\n]+)/i);
  const medsMatch = notes.match(/medications?[:\s]+([^.\n]+)/i);
  const lastMatch = notes.match(/last\s+(ate|drink|intake|meal)[:\s]+([^.\n]+)/i);

  post("progress", { stage: "Building assessment…", percent: 90 });

  const triage = {
    scene: { numPatients: "1", moi: moiRaw, sceneSafe: "", resources: "" },
    initial: { lor: lorField, airway, breathing, bleeding: bleedingField || (hasShockSigns ? "Controlled" : ""), spine: spineField, notes: chiefComplaint },
    headtoe: { head: "", neck: hasSpinePain ? "Midline tenderness noted" : "", chest: "", abdomen: "", extremities: "", posterior: "", notes: "" },
    history: { age: ageMatch ? ageMatch[0] : "", opqrst: "", signs: chiefComplaint, allergy: allergyMatch ? allergyMatch[1].trim() : "", meds: medsMatch ? medsMatch[1].trim() : "", history: "", last: lastMatch ? lastMatch[2].trim() : "", events: moiRaw, pain: painVal },
    problems: { problems: problemsRaw, spineRuled, shock, evacType, plan: planRaw },
    pfa: { pfaNotes: "" },
    interventions: { interventionNotes: "" },
    monitor: { trend: "", anticipated: "", evacPlan: "", comms: "" },
    vitals: [],
    notes: "",
    rescueLocation: { landmark: "", trail: "", terrain: "", lzAvailable: "", lzNotes: "", lookFor: "" },
  };

  post("progress", { stage: "Done", percent: 100 });
  return triage;
}

self.onmessage = async (event) => {
  const { type, payload } = event.data;
  if (type === "init") { try { await loadModel(); } catch {} return; }
  if (type === "triage") {
    try { post("result", { triage: await runOfflineInference(payload?.notes || "") }); }
    catch (err) { post("error", { message: err.message || "Offline inference failed" }); }
  }
};
