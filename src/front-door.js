const binary = [0, 1];

// Integrate the specified population exactly, so identification is separate
// from sampling error. Only the observed A/M/Y cells go to the reconstruction.
export function frontDoorPopulation({ world = "valid", selection = 0.6 } = {}) {
  if (!["valid", "direct", "mediator", "support"].includes(world))
    throw new RangeError(`Unknown front-door world: ${world}`);
  if (!Number.isFinite(selection) || selection < 0 || selection > 0.8)
    throw new RangeError("Selection must be between 0 and 0.8");
  const cells = [];
  const truth = [0, 0];
  for (const u of binary) {
    const pA = 0.5 + selection * (u - 0.5);
    for (const a of binary) {
      const pM =
        world === "support"
          ? a
          : 0.2 + 0.5 * a + (world === "mediator" ? 0.2 * u : 0);
      for (const m of binary) {
        const pY =
          0.1 + 0.4 * m + 0.3 * u + (world === "direct" ? 0.15 * a : 0);
        const mediatorMass = m ? pM : 1 - pM;
        truth[a] += 0.5 * mediatorMass * pY;
        for (const y of binary) {
          const mass =
            0.5 * (a ? pA : 1 - pA) * mediatorMass * (y ? pY : 1 - pY);
          const cell = cells.find(
            (cell) => cell.a === a && cell.m === m && cell.y === y,
          );
          if (cell) cell.mass += mass;
          else cells.push({ a, m, y, mass });
        }
      }
    }
  }
  return { cells, truth, effect: truth[1] - truth[0] };
}

export function reconstructFrontDoor(cells) {
  const mass = (predicate) =>
    cells.reduce((sum, cell) => sum + (predicate(cell) ? cell.mass : 0), 0);
  const total = mass(() => true);
  const armMass = binary.map((a) => mass((cell) => cell.a === a));
  if (!(total > 0) || armMass.some((value) => !(value > 0)))
    throw new RangeError("Both treatment groups must be present");
  const pA = armMass.map((value) => value / total);
  const observed = binary.map(
    (a) => mass((cell) => cell.a === a && cell.y === 1) / armMass[a],
  );
  const pM = binary.map((a) =>
    binary.map(
      (m) => mass((cell) => cell.a === a && cell.m === m) / armMass[a],
    ),
  );
  const outcome = binary.map((a) =>
    binary.map((m) => {
      const denominator = mass((cell) => cell.a === a && cell.m === m);
      return denominator > 0
        ? mass((cell) => cell.a === a && cell.m === m && cell.y === 1) /
            denominator
        : null;
    }),
  );
  const supported = outcome.every((row) =>
    row.every((value) => value !== null),
  );
  const response = supported
    ? binary.map((m) =>
        binary.reduce((sum, a) => sum + pA[a] * outcome[a][m], 0),
      )
    : null;
  const rebuilt = response
    ? pM.map((row) =>
        row.reduce((sum, probability, m) => sum + probability * response[m], 0),
      )
    : null;
  return {
    pA,
    pM,
    outcome,
    response,
    rebuilt,
    observed,
    rawEffect: observed[1] - observed[0],
    effect: rebuilt ? rebuilt[1] - rebuilt[0] : null,
    supported,
  };
}
