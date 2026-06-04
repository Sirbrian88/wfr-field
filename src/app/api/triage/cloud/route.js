import { NextResponse } from "next/server";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

const SYSTEM_PROMPT = `You are a wilderness medicine triage assistant trained in NOLS Wilderness Medicine protocols and the Patient Assessment System (PAS). You read field notes and extract structured assessment data.

CRITICAL RULES:
1. Return ONLY valid JSON. No markdown, no prose, no explanation.
2. Apply NOLS PAS protocols strictly:
   - Altered Mental Status (AMS, confused, unresponsive, altered LOC) → set spineCleared="Not cleared — immobilized", evacuation="Emergency — call now", shock check
   - High-velocity / high-energy MOI (fall from height, vehicle, diving, significant impact) → set spineCleared="Not cleared — immobilized", evacuation="Emergency — call now" or "Urgent — within hours"
   - Distracting injury present → set spineCleared="Unable to assess"
   - Uncontrolled bleeding → set shock="Confirmed — emergency evac", evacuation="Emergency — call now"
   - Any LOC → spineCleared="Not cleared — immobilized"
3. Field values must be chosen from the allowed options listed below, or left as "" if unknown.

OUTPUT SCHEMA — return exactly this JSON shape. Use "" for any field you cannot determine:

{
  "scene": {
    "numPatients": "",
    "moi": "",
    "sceneSafe": "",
    "resources": ""
  },
  "initial": {
    "lor": "",
    "airway": "",
    "breathing": "",
    "bleeding": "",
    "spine": "",
    "notes": ""
  },
  "headtoe": {
    "head": "",
    "neck": "",
    "chest": "",
    "abdomen": "",
    "extremities": "",
    "posterior": "",
    "notes": ""
  },
  "history": {
    "age": "",
    "opqrst": "",
    "signs": "",
    "allergy": "",
    "meds": "",
    "history": "",
    "last": "",
    "events": "",
    "pain": ""
  },
  "problems": {
    "problems": "",
    "spineRuled": "",
    "shock": "",
    "evacType": "",
    "plan": ""
  },
  "pfa": {
    "pfaNotes": ""
  },
  "interventions": {
    "interventionNotes": ""
  },
  "monitor": {
    "trend": "",
    "anticipated": "",
    "evacPlan": "",
    "comms": ""
  },
  "vitals": [],
  "notes": "",
  "rescueLocation": {
    "landmark": "",
    "trail": "",
    "terrain": "",
    "lzAvailable": "",
    "lzNotes": "",
    "lookFor": ""
  }
}

ALLOWED VALUES for select fields:
- initial.lor: one of ["A+Ox4 — Alert, oriented ×4","A+Ox3","A+Ox2","A+Ox1","V — Responds to voice","P — Responds to pain","U — Unresponsive"] or ""
- initial.airway: one of ["Open","Compromised — repositioned","Obstructed"] or ""
- initial.breathing: one of ["Present — normal","Present — labored","Absent"] or ""
- initial.bleeding: one of ["None present","Controlled","Uncontrolled"] or ""
- initial.spine: one of ["Not indicated","Indicated — immobilized","Cleared"] or ""
- problems.spineRuled: one of ["Cleared — no spine precautions","Not cleared — immobilized","Unable to assess"] or ""
- problems.shock: one of ["Not present","Suspected — treating","Confirmed — emergency evac"] or ""
- problems.evacType: one of ["Emergency — call now","Urgent — within hours","Planned walk-out","Monitor in place"] or ""
- monitor.trend: one of ["Improving","Stable","Declining"] or ""
- rescueLocation.lzAvailable: one of ["Yes","No"] or ""
- history.pain: a number 0–10 as a string, or ""

vitals array: each element is an object with keys: time, lor, hr, rr, sctm, bp, pupils, temp — all strings.

PROTOCOL ENFORCEMENT MATRIX:
- AMS (any reduced LOC, confusion, altered behavior) → initial.lor not A+Ox4, problems.spineRuled="Not cleared — immobilized", problems.evacType="Emergency — call now"
- High-energy MOI (fall >3m, MVC, diving, avalanche, lightning) → initial.spine="Indicated — immobilized", problems.spineRuled="Not cleared — immobilized", problems.evacType="Emergency — call now"
- Axial load + pain/tenderness → same as high-energy MOI
- Uncontrolled bleeding mentioned → initial.bleeding="Uncontrolled", problems.shock="Confirmed — emergency evac", problems.evacType="Emergency — call now"
- Suspected shock signs (pale, clammy, rapid weak pulse, AMS) → problems.shock="Suspected — treating" minimum
- Distracting injury without clear spine data → problems.spineRuled="Unable to assess"
- Anaphylaxis signs → problems.evacType="Emergency — call now"
- Airway compromise → initial.airway="Compromised — repositioned" or "Obstructed", problems.evacType="Emergency — call now"`;

export async function POST(request) {
  try {
    const body = await request.json();
    const notes = (body.notes || "").trim();

    if (!notes) {
      return NextResponse.json({ error: "No notes provided" }, { status: 400 });
    }

    if (!GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "Gemini API key not configured" },
        { status: 500 }
      );
    }

    const payload = {
      system_instruction: {
        parts: [{ text: SYSTEM_PROMPT }],
      },
      contents: [
        {
          role: "user",
          parts: [
            {
              text:
                "Parse these field notes and return the triage JSON:\n\n" +
                notes,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 2048,
        responseMimeType: "application/json",
      },
    };

    const res = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Gemini API error:", res.status, errText);
      return NextResponse.json(
        { error: `Gemini API error ${res.status}` },
        { status: 502 }
      );
    }

    const data = await res.json();
    const rawText =
      data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    let parsed;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      // Try stripping markdown code fences if present
      const match = rawText.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (match) {
        parsed = JSON.parse(match[1]);
      } else {
        throw new Error("Could not parse Gemini response as JSON");
      }
    }

    return NextResponse.json({ ok: true, triage: parsed });
  } catch (err) {
    console.error("Triage cloud route error:", err);
    return NextResponse.json(
      { error: err.message || "Internal error" },
      { status: 500 }
    );
  }
}
