import { NextResponse } from "next/server";

const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

const SYSTEM = `You are a WFR field assistant (NOLS 7th ed). Parse field notes and return ONLY raw JSON matching this schema exactly:
{"scene":{"numPatients":"","moi":"","sceneSafe":"","resources":""},"initial":{"lor":"","airway":"","breathing":"","bleeding":"","spine":"","notes":""},"headtoe":{"head":"","neck":"","chest":"","abdomen":"","extremities":"","posterior":"","notes":""},"history":{"age":"","opqrst":"","signs":"","allergy":"","meds":"","history":"","last":"","events":"","pain":""},"problems":{"problems":"","spineRuled":"","shock":"","evacType":"","plan":""},"pfa":{"pfaNotes":""},"interventions":{"interventionNotes":""},"monitor":{"trend":"","anticipated":"","evacPlan":"","comms":""},"vitals":[],"notes":"","rescueLocation":{"landmark":"","trail":"","terrain":"","lzAvailable":"","lzNotes":"","lookFor":""}}
Rules: AMS or LOC unknown→spine immobilized+Emergency evac. High-velocity MOI→immobilize+Emergency. Uncontrolled bleed→shock confirmed+Emergency. Shock signs→Urgent.`;

export async function POST(request) {
  try {
    const { notes } = await request.json();
    if (!notes?.trim()) return NextResponse.json({ error: "No notes" }, { status: 400 });
    
    const key = process.env.GEMINI_API_KEY;
    if (!key) return NextResponse.json({ error: "GEMINI_API_KEY not set" }, { status: 500 });

    const body = {
      contents: [{ role: "user", parts: [{ text: `${SYSTEM}\n\nFIELD NOTES:\n${notes.trim()}` }] }],
      generationConfig: { temperature: 0.1, maxOutputTokens: 2048 }
    };

    const res = await fetch(`${GEMINI_URL}?key=${key}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    const responseText = await res.text();
    if (!res.ok) {
      console.error("Triage Gemini error", res.status, responseText.slice(0, 500));
      return NextResponse.json({ error: `Gemini ${res.status}: ${responseText.slice(0, 300)}` }, { status: 502 });
    }

    const data = JSON.parse(responseText);
    const raw = (data?.candidates?.[0]?.content?.parts?.[0]?.text || "").trim();
    const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();

    let triage;
    try { triage = JSON.parse(cleaned); }
    catch { return NextResponse.json({ error: "Parse failed", raw: raw.slice(0, 300) }, { status: 502 }); }

    return NextResponse.json({ ok: true, triage });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
