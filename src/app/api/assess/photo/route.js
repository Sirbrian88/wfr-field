import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const PROMPT = `You are a wilderness medicine assistant (NOLS WFR 7th ed). Analyze this image of a skin/wound condition.
Respond ONLY with raw JSON (no markdown, no code blocks):
{"suspected":"e.g. Hymenoptera sting — likely bee","confidence":"High|Moderate|Low","severity":"Minor|Moderate|Severe|Life-threatening","anaphylaxisRisk":"Low|Moderate|High","findings":"2-3 sentences on what you observe","treatment":["step 1","step 2","step 3"],"watchFor":["sign 1","sign 2"],"evacuation":"Not indicated|Monitor — evacuate if worsens|Urgent — evacuate within hours|Emergency — evacuate immediately","evacuationReason":"reason if evac needed, else empty","disclaimer":"Field assessment only — not a substitute for WFR training or professional medical care."}
NOLS rules: anaphylaxis signs → Life-threatening + Emergency. Snake/spider puncture → Urgent min. Infection signs (streaking, pus, warmth) → Urgent.`;

export async function POST(request) {
  try {
    const { imageBase64, mimeType, notes } = await request.json();
    if (!imageBase64) return NextResponse.json({ error: "No image provided" }, { status: 400 });
    if (!process.env.GEMINI_API_KEY) return NextResponse.json({ error: "GEMINI_API_KEY not configured" }, { status: 500 });

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    // Clean base64 — strip data URL prefix if accidentally included
    const cleanB64 = imageBase64.replace(/^data:[^;]+;base64,/, "").replace(/\s/g, "");

    const promptText = notes?.trim()
      ? `${PROMPT}\n\nField responder notes: ${notes.trim()}`
      : PROMPT;

    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            { text: promptText },
            {
              inlineData: {
                mimeType: mimeType || "image/jpeg",
                data: cleanB64,
              },
            },
          ],
        },
      ],
      config: { temperature: 0.1, maxOutputTokens: 1024 },
    });

    const rawText = (response.text || "").trim();
    const cleaned = rawText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/,"").trim();

    let parsed;
    try { parsed = JSON.parse(cleaned); }
    catch { return NextResponse.json({ error: "Could not parse AI response", raw: rawText.slice(0,300) }, { status: 502 }); }

    return NextResponse.json(parsed);
  } catch (err) {
    console.error("Photo assess error:", err);
    return NextResponse.json({ error: err.message || "Internal error" }, { status: 500 });
  }
}
