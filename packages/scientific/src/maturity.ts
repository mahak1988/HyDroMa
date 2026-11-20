/**
 * Scientific model maturity.
 *
 * Maturity is a claim about evidence, not about the existence of a file or a
 * passing unit test. `checkPromotion` is deliberately strict: a model may
 * advance one level at a time and only when the evidence for that level has
 * been recorded as passing.
 */
export const MODEL_MATURITY = [
  "stub",
  "implemented",
  "tested",
  "verified",
  "validated",
  "production_approved",
] as const;

export type ModelMaturity = (typeof MODEL_MATURITY)[number];

export const MATURITY_EVIDENCE_KINDS = [
  "implementation",
  "unit_test",
  "reference",
  "observational",
  "independent_review",
  "owner_approval",
] as const;

export type MaturityEvidenceKind = (typeof MATURITY_EVIDENCE_KINDS)[number];

export type EvidenceStatus = "pass" | "fail" | "not_performed";

export type MaturityEvidence = Readonly<{
  kind: MaturityEvidenceKind;
  status: EvidenceStatus;
  /** Citation, dataset id, test id, review record or approval reference. */
  reference?: string;
  notes?: string;
  recordedAt?: string;
}>;

export type ModelValidationMetadata = Readonly<{
  maturity: ModelMaturity;
  evidence: readonly MaturityEvidence[];
  lastReviewedAt?: string;
  notes?: string;
}>;

const RANK: Readonly<Record<ModelMaturity, number>> = {
  stub: 0,
  implemented: 1,
  tested: 2,
  verified: 3,
  validated: 4,
  production_approved: 5,
};

export function maturityRank(maturity: ModelMaturity): number {
  return RANK[maturity];
}

/**
 * Evidence required to enter a level. `stub` has no entry requirement; it is
 * the starting point. `production_approved` additionally requires the model to
 * already be `validated` (checked by `checkPromotion`).
 */
const REQUIRED_EVIDENCE: Readonly<
  Record<Exclude<ModelMaturity, "stub">, readonly MaturityEvidenceKind[]>
> = {
  implemented: ["implementation"],
  tested: ["unit_test"],
  verified: ["reference"],
  validated: ["observational", "independent_review"],
  production_approved: ["owner_approval"],
};

export type PromotionCheck =
  | { ok: true; maturity: ModelMaturity }
  | { ok: false; reason: string };

export function checkPromotion(
  current: ModelMaturity,
  target: ModelMaturity,
  evidence: readonly MaturityEvidence[],
): PromotionCheck {
  const from = maturityRank(current);
  const to = maturityRank(target);

  if (to <= from) return { ok: true, maturity: target };
  if (target === "stub") return { ok: true, maturity: target };
  if (to > from + 1) {
    return { ok: false, reason: "maturity must advance one level at a time" };
  }
  if (target === "production_approved" && current !== "validated") {
    return { ok: false, reason: "production_approved requires validated first" };
  }

  const required = REQUIRED_EVIDENCE[target];
  const missing = required.filter(
    (kind) => !evidence.some((entry) => entry.kind === kind && entry.status === "pass"),
  );

  if (missing.length > 0) {
    return { ok: false, reason: `missing passing evidence: ${missing.join(", ")}` };
  }

  return { ok: true, maturity: target };
}