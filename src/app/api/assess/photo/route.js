import { NextResponse } from "next/server";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

const PROMPT = `You are a wilderness medicine assistant (NOLS WFR 7th ed). Analyze this image of a skin/wound condition.
Respond ONLY with raw JSON (no markdown, no code blocks):
{"suspected":"e.g. Hymenoptera sting — likely bee","confidence":"High|Moderate|Low","severity":"Minor|Moderate|Severe|Life-threatening","anaphylaxisRisk":"Low|Moderate|High","findings":"2-3 sentences on what you observe","treatment":["step 1","step 2","step 3"],"watchFor":["sign 1","sign 2"],"evacuation":"Not indicated|Monitor — evacuate if worsens|Urgent — evacuate within hours|Emergency — evacuate immediately","evacuationReason":"reason if evac needed, else empty","disclaimer":"Field assessment only — not a substitute for WFR training or professional medical care."}
Enforce NOLS rules: anaphylaxis signs → Life-threatening + Emergency. Snake/spider puncture → Urgent min. Infection signs (streaking, pus, warmth) → Urgent.`;

export async function POST(request) {
  try {
    const { imageBase64, mimeType, notes } = await request.json();
    if (!imageBase64) return NextResponse.json({ error: "No image provided" }, { status: 400 });
    if (!GEMINI_API_KEY) return NextResponse.json({ error: "GEMINI_API_KEY not set in Vercel env vars" }, { status: 500 });

    // Clean base64 — remove data URL prefix if accidentally included, strip whitespace
    const cleanB64 = imageBase64.replace(/^data:[^;]+;base64,/, "").replace(/\s/g, "");

    const textPart = notes?.trim()
      ? `${PROMPT}\n\nField notes: ${notes.trim()}`
      : PROMPT;

    const payload = {
      contents: [{
        role: "user",
        parts: [
          { text: textPart },
          { inline_data: { mime_type: mimeType || "image/jpeg", data: cleanB64 } },
        ],
      }],
      generationConfig: { temperature: 0.1, maxOutputTokens: 1024 },
    };

    const res = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": GEMINI_API_KEY },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json({ error: `Gemini ${res.status}: ${errText.slice(0, 300)}` }, { status: 502 });
    }

    const data = await res.json();
    const rawText = (data?.candidates?.[0]?.content?.parts?.[0]?.text || "").trim();
    const cleaned = rawText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();

    let parsed;
    try { parsed = JSON.parse(cleaned); }
    catch { return NextResponse.json({ error: "Could not parse AI response", raw: rawText.slice(0, 300) }, { status: 502 }); }

    return NextResponse.json(parsed);
  } catch (err) {
    return NextResponse.json({ error: err.message || "Internal error" }, { status: 500 });
  }
}
