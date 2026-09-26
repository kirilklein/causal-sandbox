import { random } from "./simulation.js";

export const upliftWorlds = {
  different: "Frequent buyers benefit less",
  aligned: "Frequent buyers benefit more",
  null: "Contact changes nothing",
};
export const upliftRules = {
  conversion: "Highest purchase chance",
  uplift: "Highest uplift",
  random: "Random contacts",
};

export function upliftPopulation(world = "different") {
  if (!Object.hasOwn(upliftWorlds, world))
    throw new RangeError(`Unknown uplift world: ${world}`);
  const treated = {
    different: [0.1, 0.65, 0.72, 0.9],
    aligned: [0.1, 0.36, 0.67, 0.99],
    null: [0.1, 0.35, 0.65, 0.95],
  }[world];
  return ["New visitors", "Browsing", "Returning", "Frequent buyers"].map(
    (name, group) => ({
      group,
      name,
      size: 100,
      p0: [0.1, 0.35, 0.65, 0.95][group],
      p1: treated[group],
    }),
  );
}

// Each study is a separate cohort, randomized 1:1 within each customer group.
// Independent Bernoulli draws give the observed outcomes in each arm.
export function upliftStudy(population, seed, perArm = 400) {
  if (!Number.isInteger(perArm) || perArm < 2)
    throw new RangeError("Each arm needs at least two people per group");
  const rng = random(seed);
  return population.map(({ group, p0, p1 }) => ({
    group,
    arms: [p0, p1].map((p) => ({
      n: perArm,
      purchases: Array.from({ length: perArm }, () => +(rng() < p)).reduce(
        (sum, y) => sum + y,
        0,
      ),
    })),
  }));
}

// A saturated categorical T-learner: fit each arm's group mean separately.
// Input contains observed counts only, never the simulator's probabilities.
export function fitUplift(study) {
  return study.map(({ group, arms }) => {
    const rates = arms.map(({ n, purchases }) => (n ? purchases / n : null));
    return {
      group,
      p0: rates[0],
      p1: rates[1],
      effect: rates.includes(null) ? null : rates[1] - rates[0],
    };
  });
}

export function allocateContacts(population, estimates, rule, budget) {
  const total = population.reduce((sum, row) => sum + row.size, 0);
  if (!Object.hasOwn(upliftRules, rule))
    throw new RangeError(`Unknown targeting rule: ${rule}`);
  if (!Number.isFinite(budget) || budget < 0 || budget > total)
    throw new RangeError("Budget must be between zero and population size");
  if (rule === "random")
    return population.map(({ size }) => (budget * size) / total);
  const scores = population.map(({ group }, i) => {
    const fit = estimates.find((row) => row.group === group);
    if (!fit || fit.p0 === null || fit.p1 === null)
      throw new Error(
        "Targeting requires estimates for both arms in every group",
      );
    return { i, score: rule === "conversion" ? fit.p0 : fit.p1 - fit.p0 };
  });
  scores.sort((a, b) => b.score - a.score || a.i - b.i);
  const counts = population.map(() => 0);
  let remaining = budget;
  for (const { i } of scores) {
    counts[i] = Math.min(remaining, population[i].size);
    remaining -= counts[i];
  }
  return counts;
}

export function campaignTruth(population, contacts) {
  const without = population.reduce(
    (sum, row, i) => sum + contacts[i] * row.p0,
    0,
  );
  const withContact = population.reduce(
    (sum, row, i) => sum + contacts[i] * row.p1,
    0,
  );
  return { without, withContact, effect: withContact - without };
}

// Evaluate a fixed allocation on independent study data. Counts weight each
// group's difference in means. Bernoulli sample variance / n = p(1-p)/(n-1).
export function evaluateCampaign(study, contacts) {
  let effect = 0;
  let variance = 0;
  for (let i = 0; i < study.length; i++) {
    if (contacts[i] === 0) continue;
    const { arms } = study[i];
    if (arms.some(({ n }) => n < 2)) return null;
    const rates = arms.map(({ n, purchases }) => purchases / n);
    effect += contacts[i] * (rates[1] - rates[0]);
    variance +=
      contacts[i] ** 2 *
      arms.reduce(
        (sum, { n }, arm) => sum + (rates[arm] * (1 - rates[arm])) / (n - 1),
        0,
      );
  }
  const se = Math.sqrt(variance);
  return { effect, se, lower: effect - 1.96 * se, upper: effect + 1.96 * se };
}
