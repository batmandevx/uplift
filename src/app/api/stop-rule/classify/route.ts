import { NextRequest, NextResponse } from "next/server";
import { detectStopPhrase, type DetectedLanguage } from "@/lib/recovery-stats";

// POST /api/stop-rule/classify
// Body: { phrase: string }
//
// Uses the z-ai-web-dev-sdk LLM to classify whether a spoken/typed phrase is a
// stop-outreach request — including FUZZY / colloquial Hinglish that the
// phrase-list matcher cannot catch (e.g. "bas ab aur mat phone karna yaar",
// "yaar please leave me alone na", "bahut pareshan kar rahe ho").
//
// The LLM returns strict JSON: { isStopRequest, language, confidence, intent,
// reasoning, rule }. We first try the deterministic phrase-list matcher; only
// if that fails do we call the LLM (cost + latency saving). The LLM result is
// tagged with rule "LLM_FUZZY" so the audit trail distinguishes fuzzy matches
// from exact ones.

interface LLMResult {
  isStopRequest: boolean;
  language: "en" | "hi" | "hinglish";
  confidence: number;
  intent: string;
  reasoning: string;
}

const SYSTEM_PROMPT = `You are a compliance classifier for a debt-recovery contact center.
You receive a short phrase spoken or typed by a debtor and must decide whether
it is a request to STOP outreach (calls/SMS/WhatsApp) or not.

You MUST respond with ONLY a compact JSON object and nothing else, in exactly
this shape:
{"isStopRequest": <true|false>, "language": "en"|"hi"|"hinglish", "confidence": <0..1>, "intent": "<short label>", "reasoning": "<one short sentence>"}

Rules:
- "language" is the SCRIPT/lexicon: "en" = English, "hi" = Devanagari Hindi,
  "hinglish" = Roman-script Hindi/Urdu mixed with English (e.g. "mat karo",
  "band karo", "phone mat karna", "pareshan mat karo", "chhodo mujhe").
- Treat any clear or implied request to cease contact as isStopRequest=true,
  even if phrased colloquially ("bas ab aur mat karna yaar", "please leave me
  alone", "bahut ho gaya", "enough now", "no more please").
- "intent" is a short label: "stop outreach" | "payment query" | "request
  callback" | "abuse" | "greeting" | "other".
- "confidence" is your confidence the debtor wants outreach to stop (0..1).
- Keep "reasoning" under 18 words. No markdown. No code fences. JSON only.`;

async function classifyWithLLM(phrase: string): Promise<LLMResult | null> {
  try {
    const ZAIModule = await import("z-ai-web-dev-sdk");
    const ZAI = (ZAIModule as unknown as { default: { create: () => Promise<unknown> } })
      .default;
    const zai = await ZAI.create();
    const completion = await (
      zai as {
        chat: {
          completions: {
            create: (args: {
              messages: { role: string; content: string }[];
              thinking?: { type: string };
            }) => Promise<{
              choices?: { message?: { content?: string } }[];
            }>;
          };
        };
      }
    ).chat.completions.create({
      messages: [
        { role: "assistant", content: SYSTEM_PROMPT },
        { role: "user", content: phrase },
      ],
      thinking: { type: "disabled" },
    });
    const raw = completion.choices?.[0]?.message?.content?.trim() ?? "";
    if (!raw) return null;
    // Strip any accidental code fences / prose around the JSON.
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    if (start === -1 || end === -1 || end <= start) return null;
    const jsonStr = raw.slice(start, end + 1);
    const parsed = JSON.parse(jsonStr) as LLMResult;
    // Normalise language to the allowed enum.
    const lang: DetectedLanguage =
      parsed.language === "hi"
        ? "hi"
        : parsed.language === "hinglish"
          ? "hinglish"
          : "en";
    return {
      isStopRequest: !!parsed.isStopRequest,
      language: lang,
      confidence: Math.max(0, Math.min(1, Number(parsed.confidence) || 0)),
      intent: String(parsed.intent || "other").slice(0, 60),
      reasoning: String(parsed.reasoning || "").slice(0, 200),
    };
  } catch (err) {
    console.error("[stop-rule/classify] LLM error:", err);
    return null;
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null) as
    | { phrase?: string }
    | null;
  if (!body || !body.phrase || typeof body.phrase !== "string") {
    return NextResponse.json(
      { ok: false, error: "Missing 'phrase' in body" },
      { status: 400 },
    );
  }
  const phrase = body.phrase.trim();
  if (!phrase) {
    return NextResponse.json({ ok: false, error: "Empty phrase" }, { status: 400 });
  }

  // 1) Fast path: deterministic phrase-list + heuristic matcher.
  const local = detectStopPhrase(phrase);
  if (local.matched) {
    return NextResponse.json({
      ok: true,
      isStopRequest: true,
      language: local.language,
      confidence: local.confidence,
      intent: "stop outreach",
      reasoning: "Matched by deterministic phrase-list rule " + local.rule + ".",
      rule: local.rule,
      matchedBy: "phrase-list",
    });
  }

  // 2) Slow path: LLM fuzzy classification for colloquial / mixed-script input.
  const llm = await classifyWithLLM(phrase);
  if (!llm) {
    return NextResponse.json({
      ok: true,
      isStopRequest: false,
      language: "en",
      confidence: 0,
      intent: "unknown",
      reasoning:
        "Phrase-list did not match and the LLM classifier was unavailable.",
      rule: "NONE",
      matchedBy: "none",
    });
  }

  return NextResponse.json({
    ok: true,
    isStopRequest: llm.isStopRequest,
    language: llm.language,
    confidence: llm.confidence,
    intent: llm.intent,
    reasoning: llm.reasoning,
    rule: llm.isStopRequest ? "LLM_FUZZY" : "NONE",
    matchedBy: llm.isStopRequest ? "llm" : "none",
  });
}
