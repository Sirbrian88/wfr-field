import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const SYSTEM_PROMPT = `You are a wilderness medicine expert trained in NOLS WFR protocols (7th ed). Parse field notes and return ONLY valid JSON matching this exact schema — no markdown, no code blocks:
{"scene":{"numPatients":"","moi":"","sceneSafe":"","resources":""},"initial":{"lor":"","airway":"","breathing":"","bleeding":"","spine":"","notes":""},"headtoe":{"head":"","neck":"","chest":"","abdomen":"","extremities":"","posterior":"","notes":""},"history":{"age":"","opqrst":"","signs":"","allergy":"","meds":"","history":"","last":"","events":"","pain":""},"problems":{"problems":"","spineRuled":"","shock":"","evacType":"","plan":""},"pfa":{"pfaNotes":""},"interventions":{"interventionNotes":""},"monitor":{"trend":"","anticipated":"","evacPlan":"","comms":""},"vitals":[],"notes":"","rescueLocation":{"landmark":"","trail":"","terrain":"","lzAvailable":"","lzNotes":"","lookFor":""}}
NOLS enforcement rules — apply strictly:
- Altered mental status OR LOC unknown → spine="Indicated — immobilized", spineRuled="Not cleared — immobilized", evacType="Emergency — call now"
- High-velocity MOI (fall >2x height, MVC, lightning, avalanche) → spine="Indicated — immobilized", evacType="Emergency — call now"
- Distracting injury present → spineRuled="Unable to assess"
- Uncontrolled bleeding → bleeding="Uncontrolled", shock="Confirmed — emergency evac", evacType="Emergency — call now"
- Shock signs (pale/cold/clammy, tachycardia, hypotension) → shock="Suspected — treating", evacType="Urgent — within hours" (if not already Emergency)
- Fill only fields you can extract from the notes. Leave others as empty strings.`;

export async function POST(request) {
  try {
    const { notes } = await request.json();
    if (!notes?.trim()) return NextResponse.json({ error: "No notes provided" }, { status: 400 });
    if (!process.env.GEMINI_API_KEY) return NextResponse.json({ error: "GEMINI_API_KEY not configured" }, { status: 500 });

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: [
        { role: "user", parts: [{ text: `${SYSTEM_PROMPT}\n\nFIELD NOTES:\n${notes.trim()}` }] },
      ],
      config: { temperature: 0.1, maxOutputTokens: 2048 },
    });

    const rawText = (response.text || "").trim();
    const cleaned = rawText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();

    let triage;
    try { triage = JSON.parse(cleaned); }
    catch { return NextResponse.json({ error: "Could not parse AI response", raw: rawText.slice(0,300) }, { status: 502 }); }

    return NextResponse.json({ ok: true, triage });
  } catch (err) {
    console.error("Triage cloud error:", err);
    return NextResponse.json({ error: err.message || "Internal error" }, { status: 500 });
  }
}
