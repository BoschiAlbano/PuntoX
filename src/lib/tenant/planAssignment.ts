export function buildPlanChangePayload(
  planId: number | string | null | undefined,
) {
  const normalized = Number(planId);

  if (!Number.isFinite(normalized) || normalized <= 0) {
    throw new Error("planId inválido");
  }

  return {
    PlanId: BigInt(normalized),
  };
}
