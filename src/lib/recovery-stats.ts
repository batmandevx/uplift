// Shared statistics + stop-rule detection helpers used by API routes.
// Kept framework-agnostic (no Next imports) so it is easy to unit-test.

/**
 * Wilson score interval for a binomial proportion.
 * Returns [lower, upper] bounds.
 *
 * Used for the "measured money recovered" pillar: we treat a debtor as a
 * "success" if they recovered > 0, and report the recovery-rate CI per arm.
 * For the mean-rupee CI we use a normal approximation with the t-correction
 * for small samples (see `meanCI`).
 */
export function wilsonCI(
  successes: number,
  total: number,
  z = 1.959963984540054, // 95%
): [number, number] {
  if (total <= 0) return [0, 0];
  const p = successes / total;
  const denom = 1 + (z * z) / total;
  const center = (p + (z * z) / (2 * total)) / denom;
  const margin = (z * Math.sqrt((p * (1 - p)) / total + (z * z) / (4 * total * total))) / denom;
  return [Math.max(0, center - margin), Math.min(1, center + margin)];
}

/**
 * Normal-approximation CI for a sample mean with small-sample t correction.
 * Returns [lower, upper].
 */
export function meanCI(
  values: number[],
  z = 1.959963984540054,
): [number, number] {
  const n = values.length;
  if (n === 0) return [0, 0];
  if (n === 1) return [values[0], values[0]];
  const mean = values.reduce((a, b) => a + b, 0) / n;
  const variance =
    values.reduce((acc, v) => acc + (v - mean) * (v - mean), 0) / (n - 1);
  const se = Math.sqrt(variance / n);
  // Slightly widen for small samples (t-distribution tail), capped.
  const tAdjust = n < 30 ? 1 + 0.5 / Math.sqrt(n) : 1;
  const margin = z * se * tAdjust;
  return [mean - margin, mean + margin];
}

/** Round to 2 decimals (rupees). */
export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Round to integer rupees. */
export function round0(n: number): number {
  return Math.round(n);
}

// ---------------------------------------------------------------------------
// Stop-rule detection — supports English + Hinglish stop phrases.
// ---------------------------------------------------------------------------

export type DetectedLanguage = "en" | "hi" | "hinglish";

export interface StopRuleMatch {
  matched: boolean;
  language: DetectedLanguage;
  rule: string; // STOP_EN | STOP_HI | STOP_HINGLISH | NONE
  confidence: number;
}

// Curated phrase lists. Order matters: most-specific Hinglish first so that
// mixed-script phrases (e.g. "please stop calling mat karo") classify as
// Hinglish rather than English.
const STOP_HINGLISH = [
  "mujhe call mat karo",
  "mujhe call mat karna",
  "call mat karo",
  "call mat karna",
  "calls band karo",
  "call band karo",
  "phone mat karo",
  "phone mat karna",
  "ab phone mat karna",
  "chhodo mujhe",
  "chodo mujhe",
  "mujhe chhodo",
  "mujhe mat tang karo",
  "tang mat karo",
  "pareshan mat karo",
];

const STOP_HI = [
  "मुझे कॉल मत करो",
  "कॉल मत करो",
  "फ़ोन मत करो",
  "मुझे छोड़ो",
  "परेशान मत करो",
];

const STOP_EN = [
  "stop calling me",
  "stop calling",
  "do not call me",
  "don't call me",
  "dont call me",
  "don't call again",
  "dont call again",
  "please stop",
  "stop it",
  "no more calls",
  "take me off your list",
  "remove my number",
  "unsubscribe",
  "quit calling",
  "cease and desist",
];

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s']/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function detectStopPhrase(phrase: string): StopRuleMatch {
  const n = normalize(phrase);
  if (!n) return { matched: false, language: "en", rule: "NONE", confidence: 0 };

  // Hinglish first (latin script + Hindi vocabulary)
  const hitHi = STOP_HINGLISH.find((p) => n.includes(normalize(p)));
  if (hitHi) {
    return {
      matched: true,
      language: "hinglish",
      rule: "STOP_HINGLISH",
      // confidence scales with phrase length specificity
      confidence: Math.min(0.99, 0.9 + normalize(hitHi).length / 200),
    };
  }

  // Devanagari Hindi
  const hitDev = STOP_HI.find((p) => n.includes(normalize(p)));
  if (hitDev) {
    return {
      matched: true,
      language: "hi",
      rule: "STOP_HI",
      confidence: Math.min(0.99, 0.9 + normalize(hitDev).length / 200),
    };
  }

  // English
  const hitEn = STOP_EN.find((p) => n.includes(normalize(p)));
  if (hitEn) {
    return {
      matched: true,
      language: "en",
      rule: "STOP_EN",
      confidence: Math.min(0.99, 0.9 + normalize(hitEn).length / 200),
    };
  }

  // Heuristic fallback: contains "stop" or "mat" + "call/phone"
  if (/\bstop\b/.test(n) && /(call|phone|ring)/.test(n)) {
    return { matched: true, language: "en", rule: "STOP_EN", confidence: 0.7 };
  }
  if (/\bmat\b/.test(n) && /(call|phone)/.test(n)) {
    return { matched: true, language: "hinglish", rule: "STOP_HINGLISH", confidence: 0.72 };
  }

  return { matched: false, language: "en", rule: "NONE", confidence: 0 };
}

// ---------------------------------------------------------------------------
// Ladder definition (shared between compliance-rules and escalation-funnel).
// ---------------------------------------------------------------------------

export const LADDER = [
  { level: 0, label: "Soft Reminder", description: "Automated SMS / IVR nudge. No human agent." },
  { level: 1, label: "Standard Call", description: "Trained agent call within business hours." },
  { level: 2, label: "Enhanced Outreach", description: "Requires human-approval gate. Multi-channel." },
  { level: 3, label: "Legal Referral", description: "Mandate-gated. Hand-off to legal partner." },
] as const;

export const QUIET_HOURS = { start: "21:00", end: "08:00" };
export const DAILY_ATTEMPT_CAP = 3;
export const TOTAL_ATTEMPT_CAP = 8;
export const HUMAN_APPROVAL_FROM_RUNG = 2;
