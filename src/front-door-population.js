// The introductory population represents exact A/M/Y cell proportions. It is
// separate from the worlds explored later, and contains no hidden U or futures.
export function frontDoorStudents(cells) {
  const students = [];
  for (const { a, m, y, mass } of cells) {
    const count = Math.round(mass * 1000);
    if (Math.abs(count - mass * 1000) > 1e-8)
      throw new RangeError("The teaching population needs whole students");
    for (let i = 0; i < count; i++)
      students.push({ id: students.length + 1, a, m, y });
  }
  return students;
}

export function studentPanels(students, result, stage, balanced = false) {
  return [0, 1].map((panel) => {
    const members =
      stage < 2
        ? students.filter(({ a }) => a === panel)
        : stage === 2
          ? students.filter(({ m }) => m === panel)
          : students;
    const groups = (stage === 0 ? [null] : [0, 1]).map((group) => {
      const rows = members.filter(
        (person) => group === null || person[stage === 2 ? "a" : "m"] === group,
      );
      const weighted = rows.map((person) => {
        let weight = 1;
        if (stage === 2 && balanced)
          weight = (result.pA[person.a] * members.length) / rows.length;
        if (stage === 3)
          weight = result.pM[panel][person.m] / result.pM[person.a][person.m];
        return { person, weight };
      });
      return {
        group,
        rows: weighted,
        mass: weighted.reduce((sum, { weight }) => sum + weight, 0),
      };
    });
    const mass = groups.reduce((sum, group) => sum + group.mass, 0);
    const passed = groups.reduce(
      (sum, group) =>
        sum +
        group.rows.reduce(
          (subtotal, { person, weight }) => subtotal + weight * person.y,
          0,
        ),
      0,
    );
    return { panel, groups, mass, rate: passed / mass, count: members.length };
  });
}

// Positions encode group membership; only symbol area encodes a record's weight.
// Each panel is normalized independently, just like its weighted pass rate.
export function studentLayout(panels, width) {
  const stacked = width < 640;
  const panelWidth = stacked ? width : (width - 24) / 2;
  const panelHeight = 410;
  const marks = [];
  const boxes = [];
  for (const panel of panels) {
    const x = stacked ? 0 : panel.panel * (panelWidth + 24);
    const y = stacked ? panel.panel * (panelHeight + 18) : 0;
    const groupHeight = (panelHeight - 98) / panel.groups.length;
    const usableWidth = panelWidth - 32;
    // One radius-to-weight scale per panel keeps areas comparable between groups.
    const spacing = Math.min(
      ...panel.groups.map(({ rows }) => {
        const cols = Math.max(
          1,
          Math.ceil(
            Math.sqrt((rows.length * usableWidth) / (groupHeight - 35)),
          ),
        );
        return (
          Math.min(
            usableWidth / cols,
            (groupHeight - 35) / Math.ceil(rows.length / cols),
          ) / Math.sqrt(Math.max(...rows.map(({ weight }) => weight)))
        );
      }),
    );
    panel.groups.forEach(({ rows, group, mass }, index) => {
      const top = y + 64 + index * groupHeight;
      const cols = Math.max(
        1,
        Math.ceil(Math.sqrt((rows.length * usableWidth) / (groupHeight - 35))),
      );
      const dx = usableWidth / cols;
      const dy = (groupHeight - 35) / Math.ceil(rows.length / cols);
      boxes.push({
        panel: panel.panel,
        group,
        x: x + 10,
        y: top - 8,
        width: panelWidth - 20,
        height: groupHeight - 6,
        share: mass / panel.mass,
      });
      rows.forEach(({ person, weight }, i) =>
        marks.push({
          id: person.id,
          panel: panel.panel,
          x: x + 16 + ((i % cols) + 0.5) * dx,
          y: top + 22 + (Math.floor(i / cols) + 0.5) * dy,
          radius: spacing * 0.25 * Math.sqrt(weight),
          weight,
        }),
      );
    });
  }
  return {
    marks,
    boxes,
    panelWidth,
    panelHeight,
    height: stacked ? panelHeight * 2 + 18 : panelHeight,
  };
}
