const dot = (x, y, r, cls = "") =>
  `<circle class="${cls}" cx="${x}" cy="${y}" r="${r}"/>`;

export function mapIllustration(region) {
  const art = {
    question: `<path class="map-art-guide" d="M45 160H360M65 155V25"/>
      <path class="map-art-ribbon map-art-treated" d="M75 140C150 140 150 64 327 45L327 68C170 76 165 146 75 146Z"/>
      <path class="map-art-ribbon map-art-untreated" d="M75 140C170 140 205 121 327 114L327 134C190 137 165 146 75 146Z"/>
      <path class="map-art-line map-art-treated" d="M75 143C150 143 155 72 327 56"/>
      <path class="map-art-line map-art-untreated" d="M75 143C170 143 205 129 327 124"/>
      <g class="map-art-treated">${dot(327, 56, 7)}</g><g class="map-art-untreated">${dot(327, 124, 7)}</g>
      <circle class="map-art-person" cx="75" cy="122" r="7"/><path class="map-art-line" d="M64 146v-5a11 11 0 0 1 22 0v5"/>
      <text x="196" y="40">With treatment</text><text x="206" y="156">Without treatment</text>
      <text class="map-art-caption" x="200" y="189">One person · two possible futures</text>`,
    comparison: `<path class="map-art-guide" d="M50 159H350"/>
      <path class="map-art-line" d="M180 60 117 110m8-1-8 1 1-8M220 60l63 50m-1-8 1 8-8-1"/>
      <rect class="map-art-context" x="147" y="25" width="106" height="39" rx="20"/><text x="200" y="49" text-anchor="middle">Health before</text>
      <rect class="map-art-treatment-node" x="55" y="115" width="100" height="39" rx="20"/>
      <rect class="map-art-outcome-node" x="245" y="115" width="100" height="39" rx="20"/>
      <text x="105" y="139" text-anchor="middle">Treatment</text><text x="295" y="139" text-anchor="middle">Recovery</text>
      <text class="map-art-caption" x="200" y="189">A common cause can distort the comparison</text>
      <path class="map-art-line" d="M158 135h79m-7-5 7 5-7 5"/>`,
    methods: `<text x="55" y="48">Before</text><text x="259" y="48">Weighted</text>
      <path class="map-art-guide" d="M45 157h310"/>
      <path class="map-art-line" d="M173 103h48m-7-5 7 5-7 5"/>
      <g class="map-art-treated">${[0, 1, 2, 3].map((i) => dot(55 + i * 26, 86, 6)).join("")}${[5, 7, 10, 13].map((r, i) => dot(259 + i * 26, 86, r)).join("")}</g>
      <g class="map-art-untreated">${[0, 1, 2, 3].map((i) => dot(55 + i * 26, 125, 6)).join("")}${[13, 10, 7, 5].map((r, i) => dot(259 + i * 26, 125, r)).join("")}</g>
      <text x="48" y="72">Treated</text><text x="48" y="147">Untreated</text>
      <text class="map-art-caption" x="200" y="189">Same people · different contributions</text>`,
    evidence: `<path class="map-art-guide" d="M45 153H355"/>
      <path class="map-art-truth" d="M200 31v124"/>
      <g class="map-art-estimates">${[1, 2, 3, 5, 7, 8, 7, 5, 3, 2, 1].flatMap((n, i) => Array.from({ length: n }, (_, j) => dot(80 + i * 24, 142 - j * 13, 4.5))).join("")}</g>
      <text x="210" y="31">Truth</text><text class="map-art-caption" x="200" y="189">Different samples · different estimates</text>`,
  };
  return `<svg class="map-art" viewBox="0 0 400 205" aria-hidden="true" focusable="false">${art[region]}</svg>`;
}

export function mapPreview() {
  return `<svg class="map-preview" viewBox="0 0 340 145" aria-hidden="true" focusable="false">
    <path class="map-preview-path" d="M35 105C55 105 60 35 115 35S170 111 215 111 270 40 305 40"/>
    ${[
      [35, 105, "01"],
      [115, 35, "02"],
      [215, 111, "03"],
      [305, 40, "04"],
    ]
      .map(
        ([x, y, n]) =>
          `<circle cx="${x}" cy="${y}" r="18"/><text x="${x}" y="${y + 4}">${n}</text>`,
      )
      .join("")}
  </svg>`;
}
