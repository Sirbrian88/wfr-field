import { NextResponse } from "next/server";

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;

const PROMPT = `You are a wilderness medicine assistant trained in NOLS WFR protocols (7th edition). Analyze this image of a patient's skin/wound condition.

Respond ONLY with raw JSON (no markdown, no code blocks):
{"suspected":"e.g. Hymenoptera sting — likely bee","confidence":"High|Moderate|Low","severity":"Minor|Moderate|Severe|Life-threatening","anaphylaxisRisk":"Low|Moderate|High","findings":"2-3 sentences describing what you observe","treatment":["step 1","step 2","step 3"],"watchFor":["sign 1","sign 2"],"evacuation":"Not indicated|Monitor — evacuate if worsens|Urgent — evacuate within hours|Emergency — evacuate immediately","evacuationReason":"reason if evacuation needed, else empty string","disclaimer":"Field assessment only — not a substitute for WFR training or professional medical care."}

NOLS rules: anaphylaxis signs (spreading hives, throat tightness) → Life-threatening + Emergency. Snake/spider puncture → Urgent minimum. Wound infection (red streaking, pus, warmth, fever) → Urgent. If cannot identify → confidence=Low.`;

export async function POST(request) {
  try {
    const { imageBase64, mimeType, notes } = await request.json();
    if (!imageBase64) return NextResponse.json({ error: "No image provided" }, { status: 400 });
    if (!ANTHROPIC_KEY) return NextResponse.json({ error: "ANTHROPIC_API_KEY not configured in Vercel env vars" }, { status: 500 });

    const cleanB64 = imageBase64.replace(/^data:[^;]+;base64,/, "").replace(/\s+/g, "");
    const mediaType = (mimeType || "image/jpeg").replace("jpg", "jpeg");

    const userContent = [
      {
        type: "image",
        source: { type: "base64", media_type: mediaType, data: cleanB64 }
      },
      {
        type: "text",
        text: notes?.trim() ? `${PROMPT}\n\nField notes from responder: ${notes.trim()}` : PROMPT
      }
    ];

    const res = await fetch(ANTHROPIC_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_KEY,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true"
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1024,
        messages: [{ role: "user", content: userContent }]
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Anthropic error:", res.status, errText.slice(0, 300));
      return NextResponse.json({ error: `API error ${res.status}: ${errText.slice(0, 200)}` }, { status: 502 });
    }

    const data = await res.json();
    const rawText = (data?.content?.[0]?.text || "").trim();
    const cleaned = rawText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();

    let parsed;
    try { parsed = JSON.parse(cleaned); }
    catch { return NextResponse.json({ error: "Could not parse response", raw: rawText.slice(0, 300) }, { status: 502 }); }

    return NextResponse.json(parsed);
  } catch (err) {
    console.error("Photo assess error:", err);
    return NextResponse.json({ error: err.message || "Internal error" }, { status: 500 });
  }
}
