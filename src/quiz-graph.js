export function graphMarkup(question) {
  if (!question.graph) return "";
  const { nodes, edges, description } = question.graph;
  return `<figure class="quiz-figure"><svg viewBox="0 0 500 290" role="img" aria-label="${description}" focusable="false"><defs><marker id="quiz-arrow-${question.id}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M1 1 9 5 1 9"/></marker></defs>
    ${edges
      .map(([from, to, bend]) => {
        const [, x1, y1] = nodes.find(([id]) => id === from);
        const [, x2, y2] = nodes.find(([id]) => id === to);
        const dx = x2 - x1,
          dy = y2 - y1,
          length = Math.hypot(dx, dy);
        return `<path d="M${x1 + (dx * 28) / length} ${y1 + (dy * 28) / length} ${bend ? `Q${(x1 + x2) / 2} ${(y1 + y2) / 2 + bend}` : "L"} ${x2 - (dx * 32) / length} ${y2 - (dy * 32) / length}" marker-end="url(#quiz-arrow-${question.id})"/>`;
      })
      .join("")}
    ${nodes.map(([id, x, y]) => `<circle cx="${x}" cy="${y}" r="27" fill="var(--node-${id}, var(--node-C))"/><text x="${x}" y="${y}">${id}</text>`).join("")}</svg></figure>`;
}
