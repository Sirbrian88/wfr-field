import { NextResponse } from "next/server";

const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

const PROMPT = `You are a wilderness medicine assistant (NOLS WFR 7th ed). Analyze this image.
Return ONLY raw JSON, no markdown:
{"suspected":"e.g. bee sting","confidence":"High|Moderate|Low","severity":"Minor|Moderate|Severe|Life-threatening","anaphylaxisRisk":"Low|Moderate|High","findings":"what you observe","treatment":["step 1"],"watchFor":["sign 1"],"evacuation":"Not indicated|Monitor — evacuate if worsens|Urgent — evacuate within hours|Emergency — evacuate immediately","evacuationReason":"","disclaimer":"Field assessment only."}`;

export async function POST(request) {
  try {
    const { imageBase64, mimeType, notes } = await request.json();
    if (!imageBase64) return NextResponse.json({ error: "No image" }, { status: 400 });
    
    const key = process.env.GEMINI_API_KEY;
    if (!key) return NextResponse.json({ error: "GEMINI_API_KEY not set" }, { status: 500 });

    // Strip data URL prefix if present, remove whitespace
    const cleanB64 = imageBase64.replace(/^data:[^;]+;base64,/, "").replace(/\s+/g, "");
    
    const promptText = notes?.trim() ? `${PROMPT}\n\nField notes: ${notes.trim()}` : PROMPT;

    // Correct camelCase format per Gemini REST API spec
    const body = {
      contents: [{
        role: "user",
        parts: [
          { text: promptText },
          { inlineData: { mimeType: mimeType || "image/jpeg", data: cleanB64 } }
        ]
      }],
      generationConfig: { temperature: 0.1, maxOutputTokens: 1024 }
    };

    const res = await fetch(`${GEMINI_URL}?key=${key}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    const responseText = await res.text();
    
    if (!res.ok) {
      // Log full error for debugging
      console.error("Gemini error", res.status, responseText.slice(0, 500));
      return NextResponse.json({ error: `Gemini ${res.status}: ${responseText.slice(0, 300)}` }, { status: 502 });
    }

    const data = JSON.parse(responseText);
    const raw = (data?.candidates?.[0]?.content?.parts?.[0]?.text || "").trim();
    const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();

    let parsed;
    try { parsed = JSON.parse(cleaned); }
    catch { return NextResponse.json({ error: "Parse failed", raw: raw.slice(0, 300) }, { status: 502 }); }

    return NextResponse.json(parsed);
  } catch (err) {
    console.error("Route error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
