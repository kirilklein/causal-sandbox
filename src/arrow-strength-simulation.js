import { makeNoise, estimate } from "./simulation.js";

const sigmoid = (x) => 1 / (1 + Math.exp(-x));

export function mediatedZEffect(treatmentStrength = 2) {
  return (
    ([
      sigmoid(-0.8 - 1.2 + treatmentStrength) - sigmoid(-0.8 - 1.2),
      sigmoid(-0.8 + 1.2 + treatmentStrength) - sigmoid(-0.8 + 1.2),
    ].reduce((sum, change) => sum + change, 0) /
      2) *
    2
  );
}

export function cancellationDirectEffect(treatmentStrength = 2) {
  return -mediatedZEffect(treatmentStrength);
}

export function populationZEffect({
  treatmentStrength = 2,
  directEffect = 0,
} = {}) {
  return directEffect + mediatedZEffect(treatmentStrength);
}

export function meanDifference(data, key, outcome) {
  const groups = [0, 1].map((value) => {
    const rows = data.filter((row) => row[key] === value);
    return rows.reduce((sum, row) => sum + row[outcome], 0) / rows.length;
  });
  return groups[1] - groups[0];
}

export function arrowStrengthSimulation({
  seed = 4217,
  treatmentStrength = 2,
  directEffect = 0,
} = {}) {
  const data = makeNoise(2400, seed).map(({ C1, Z, a, eY }) => {
    const C = C1 > 0 ? 1 : -1;
    const probability = sigmoid(-0.8 + 1.2 * C + treatmentStrength * Z);
    const A = +(a < probability);
    return { C, Z, A, Y: 2 * A + 1.5 * C + directEffect * Z + eY };
  });
  return {
    data,
    fits: [estimate(data, ["C"]), estimate(data, ["C", "Z"])],
    zAssociation: meanDifference(data, "Z", "Y"),
    totalZEffect: populationZEffect({ treatmentStrength, directEffect }),
  };
}
