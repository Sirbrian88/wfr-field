import { NextResponse } from "next/server";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

const SYSTEM_PROMPT = `You are an expert wilderness medicine assistant trained in NOLS Wilderness First Responder protocols (7th edition). Analyze the image and respond ONLY with valid JSON in this exact structure (no markdown, no code blocks, raw JSON only):
{"suspected":"brief ID e.g. Hymenoptera sting","confidence":"High|Moderate|Low","severity":"Minor|Moderate|Severe|Life-threatening","anaphylaxisRisk":"Low|Moderate|High","findings":"2-3 sentences describing what you observe","treatment":["step 1","step 2"],"watchFor":["symptom 1","symptom 2"],"evacuation":"Not indicated|Monitor — evacuate if worsens|Urgent — evacuate within hours|Emergency — evacuate immediately","evacuationReason":"reason or empty string","disclaimer":"Field assessment only. Not a substitute for professional medical care."}
NOLS rules: anaphylaxis signs → Life-threatening + Emergency. Snake/spider puncture → Urgent minimum. Wound infection (red streaking, pus) → Urgent. Cannot ID → confidence=Low.`;

export async function POST(request) {
  try {
    const { imageBase64, mimeType, notes } = await request.json();

    if (!imageBase64) return NextResponse.json({ error: "No image provided" }, { status: 400 });
    if (!GEMINI_API_KEY) return NextResponse.json({ error: "API key not configured" }, { status: 500 });

    const userParts = [
      { text: SYSTEM_PROMPT + (notes?.trim() ? `\n\nField responder notes: ${notes.trim()}` : "") },
      { inline_data: { mime_type: mimeType || "image/jpeg", data: imageBase64 } },
    ];

    const payload = {
      contents: [{ role: "user", parts: userParts }],
      generationConfig: { temperature: 0.1, maxOutputTokens: 1024 },
    };

    const res = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": GEMINI_API_KEY },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Gemini error:", res.status, errText);
      return NextResponse.json({ error: `Gemini API error ${res.status}: ${errText.slice(0,200)}` }, { status: 502 });
    }

    const data = await res.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    let parsed;
    try {
      // Strip markdown code blocks if present
      const cleaned = rawText.replace(/```(?:json)?\s*/g, "").replace(/```\s*/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      return NextResponse.json({ error: "Could not parse AI response", raw: rawText.slice(0, 500) }, { status: 502 });
    }

    return NextResponse.json(parsed);
  } catch (err) {
    console.error("Photo assess error:", err);
    return NextResponse.json({ error: err.message || "Internal error" }, { status: 500 });
  }
}
