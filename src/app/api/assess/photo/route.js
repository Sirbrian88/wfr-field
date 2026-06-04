import { NextResponse } from "next/server";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

const SYSTEM_PROMPT = `You are an expert wilderness medicine assistant trained in NOLS Wilderness First Responder protocols (7th edition). 
A field responder has uploaded a photo of a patient's skin condition.
Analyze the image carefully and respond ONLY with valid JSON in this exact structure:
{
  "suspected": "brief identification (e.g. 'Hymenoptera sting — likely bee')",
  "confidence": "High | Moderate | Low",
  "severity": "Minor | Moderate | Severe | Life-threatening",
  "anaphylaxisRisk": "Low | Moderate | High",
  "findings": "2-3 sentences describing what you observe in the image",
  "treatment": ["step 1", "step 2"],
  "watchFor": ["symptom 1", "symptom 2"],
  "evacuation": "Not indicated | Monitor — evacuate if worsens | Urgent — evacuate within hours | Emergency — evacuate immediately",
  "evacuationReason": "brief reason if evacuation indicated, else empty string",
  "disclaimer": "Field assessment only. Not a substitute for professional medical care."
}

NOLS protocol rules you MUST enforce:
- Any signs of anaphylaxis (urticaria spreading, throat tightness, hypotension) → severity = Life-threatening, anaphylaxisRisk = High, evacuation = Emergency — evacuate immediately
- Puncture wounds from snakes or spiders → evacuation = Urgent — evacuate within hours minimum
- Wound infection signs (red streaking, warmth, pus, fever) → evacuation = Urgent — evacuate within hours
- If you cannot confidently identify the condition → confidence = Low, note in findings
- Never diagnose definitively — use language like "consistent with", "suspected", "may indicate"`;

export async function POST(request) {
  try {
    const body = await request.json();
    const { imageBase64, mimeType, notes } = body;

    if (!imageBase64) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    if (!GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "Gemini API key not configured" },
        { status: 500 }
      );
    }

    const userParts = [
      {
        inline_data: {
          mime_type: mimeType || "image/jpeg",
          data: imageBase64,
        },
      },
    ];

    if (notes && notes.trim()) {
      userParts.push({
        text: "Additional context from field responder: " + notes.trim(),
      });
    }

    const payload = {
      system_instruction: {
        parts: [{ text: SYSTEM_PROMPT }],
      },
      contents: [
        {
          role: "user",
          parts: userParts,
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
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    let parsed;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      const match = rawText.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (match) {
        parsed = JSON.parse(match[1]);
      } else {
        throw new Error("Could not parse Gemini response as JSON");
      }
    }

    return NextResponse.json(parsed);
  } catch (err) {
    console.error("Photo assess route error:", err);
    return NextResponse.json(
      { error: err.message || "Internal error" },
      { status: 500 }
    );
  }
}
