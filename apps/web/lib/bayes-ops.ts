// Bayes' rule for an inspection system: prior defect rate, detection rate, false-alarm rate. For BayesLab (Chapter 5.8). Unit-tested.

export type Counts = { tp: number; fn: number; fp: number; tn: number };

/** Expected counts for n parts. */
export function counts(n: number, prior: number, sensitivity: number, falseAlarm: number): Counts {
  const d = n * prior, g = n - d;
  return { tp: d * sensitivity, fn: d * (1 - sensitivity), fp: g * falseAlarm, tn: g * (1 - falseAlarm) };
}

/** P(defect | alarm) and P(defect | no alarm). */
export function posterior(prior: number, sensitivity: number, falseAlarm: number) {
  const pa = sensitivity * prior + falseAlarm * (1 - prior);
  return {
    pAlarm: pa,
    defectGivenAlarm: pa === 0 ? 0 : (sensitivity * prior) / pa,
    defectGivenPass: pa === 1 ? 0 : ((1 - sensitivity) * prior) / (1 - pa),
  };
}

/** Posterior after k independent alarms, via odds × likelihood ratio^k. */
export function afterAlarms(prior: number, sensitivity: number, falseAlarm: number, k: number): number {
  const odds = (prior / (1 - prior)) * (sensitivity / falseAlarm) ** k;
  return odds / (1 + odds);
}
