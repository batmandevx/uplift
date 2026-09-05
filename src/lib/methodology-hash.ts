// Client-side methodology hash utilities — mirrors the seed's FNV-1a helper.
// Used by the MethodologyCard to recompute the hash from the batch's
// pre-registered parameters and confirm it matches the stored value,
// proving the analysis plan was not tampered with after pre-registration.

export interface MethodologyHashInput {
  batchName: string;
  mandateLevel: string;
  holdoutRatio: number;
  analysisPlan: string;
}

/**
 * FNV-1a 32-bit hash, identical to the seed script's implementation.
 * Returns an 8-character uppercase hex string.
 */
export function computeMethodologyHash(input: MethodologyHashInput): string {
  const raw = `${input.batchName}|${input.mandateLevel}|${input.holdoutRatio.toFixed(2)}|${input.analysisPlan}`;
  let h = 0x811c9dc5;
  for (let i = 0; i < raw.length; i++) {
    h ^= raw.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).toUpperCase().padStart(8, "0");
}

/**
 * Compare a recomputed hash against the stored hash.
 * Returns "match" | "mismatch" | "unknown".
 */
export function verifyMethodologyHash(
  stored: string | null | undefined,
  input: MethodologyHashInput,
): "match" | "mismatch" | "unknown" {
  if (!stored || stored === "—") return "unknown";
  const recomputed = computeMethodologyHash(input);
  return recomputed === stored ? "match" : "mismatch";
}
