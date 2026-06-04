import { NextResponse } from "next/server";

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;

const PROMPT = `You are a wilderness medicine assistant trained in NOLS WFR protocols (7th edition). A field responder has sent a photo for assessment.

IMPORTANT RULES:
- If the image shows normal, healthy skin or a body part with no signs of injury, envenomation, infection, or rash — say so clearly. "Appears normal" is a valid and important finding.
- Do NOT over-diagnose. Minor redness, normal skin variations, tan lines, freckles, or hair follicles are NOT medical concerns.
- Use PLAIN ENGLISH first. If you must use a medical term, explain it simply in parentheses.
- Be appropriately reassuring when things look fine.

Respond ONLY with raw JSON (no markdown, no code blocks):
{
  "suspected": "Brief description e.g. 'Appears normal — no signs of injury or reaction' OR 'Possible bee sting with local swelling'",
  "confidence": "High|Moderate|Low",
  "severity": "None — appears normal|Minor|Moderate|Severe|Life-threatening",
  "anaphylaxisRisk": "None|Low|Moderate|High",
  "findings": "Plain English description of what you see. If normal, say it looks normal and why. Avoid unnecessary jargon.",
  "treatment": ["Only include steps if treatment is actually needed. If normal, put 'No treatment needed — monitor for any changes'"],
  "watchFor": ["Signs that would warrant concern. If normal, put 'Seek care if you develop redness, swelling, pain, or spreading rash'"],
  "evacuation": "Not indicated|Monitor — evacuate if worsens|Urgent — evacuate within hours|Emergency — evacuate immediately",
  "evacuationReason": "Only fill if evacuation is indicated, otherwise leave empty",
  "plainEnglish": "One sentence in simple everyday language summarizing your assessment, suitable for a non-medical person",
  "disclaimer": "Field assessment only — not a substitute for WFR training or professional medical care."
}

NOLS severity rules (only apply when genuinely present):
- Anaphylaxis signs (hives spreading rapidly, throat tightening, difficulty breathing, dizziness) → Life-threatening + Emergency evac
- Snake or spider bite with puncture marks → Urgent minimum
- Infection signs (red streaking away from wound, pus, significant warmth and swelling) → Urgent
- If image is unclear or you cannot identify anything concerning → confidence=Low, note that image quality limits assessment`;

export async function POST(request) {
  try {
    const { imageBase64, mimeType, notes } = await request.json();
    if (!imageBase64) return NextResponse.json({ error: "No image provided" }, { status: 400 });
    if (!ANTHROPIC_KEY) return NextResponse.json({ error: "ANTHROPIC_API_KEY not configured" }, { status: 500 });

    const cleanB64 = imageBase64.replace(/^data:[^;]+;base64,/, "").replace(/\s+/g, "");
    const mediaType = (mimeType || "image/jpeg").replace("image/jpg", "image/jpeg");

    const userContent = [
      { type: "image", source: { type: "base64", media_type: mediaType, data: cleanB64 } },
      { type: "text", text: notes?.trim() ? `${PROMPT}\n\nField responder notes: ${notes.trim()}` : PROMPT }
    ];

    const res = await fetch(ANTHROPIC_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_KEY,
        "anthropic-version": "2023-06-01"
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
