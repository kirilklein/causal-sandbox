# Color conventions

Implemented for #20 in the existing lesson and sandbox graphs, treatment-arm
charts, and sandbox estimate markers. Lesson result cards now add continuous
error feedback for #16. Future equation work follows the variable conventions. Light mode keeps the cream
page background and pale node fills; dark mode uses neutral charcoal surfaces, lighter
text and chart strokes, and muted versions of the same variable hues.

Open the [visual examples](color-examples.html) in a browser to compare the palette,
adjustment captions, and an illustrative estimate plot. The examples use inline SVG
and work offline; their numbers are not simulation results.

## Themes and shared palette

`src/theme.css` defines both palettes. Use its semantic CSS properties for page
and panel surfaces, text, borders, accents, warnings, and chart colors. Avoid new
color literals in component styles or JavaScript. The standalone favicon keeps
light fallback colors; when embedded in the app, it inherits the shared palette.
The offline visual examples below illustrate the light palette.

The header offers System, Light, and Dark. System follows the device preference;
an explicit choice persists across lessons, the sandbox, and reloads. The initial
HTML resolves the preference before the app paints. Theme changes update SVG and
CSS directly and redraw the sandbox canvas without resimulating the population.
If browser storage is unavailable, the choice still works for the current page.

Use `--error-surface` for the theme's strongest error color and `--error-tint` for
the existing per-result percentage. The fixed error scale is identical in both
themes. Dark mode applies the same percentage across the full card, mixing a charcoal
surface toward muted burgundy. Truth uses a constant slate-blue background
(`--truth-surface`). Labels and signed differences retain readable contrast at
both ends of the scale. Light-mode cards retain their existing background tints.

`tests/theme-browser.mjs` checks theme persistence, system changes, simulation
state preservation, canvas redraw, mobile overflow, and key palette contrast
pairs. These checks do not establish accessibility of every rendered state.

## Variables

The values below show the light palette; use `--node-A` through `--node-U` in code.

| Variable    | Fill                 | Purpose                                                                   |
| ----------- | -------------------- | ------------------------------------------------------------------------- |
| Treatment A | Soft green `#e6efe9` | Retain treatment's existing identity.                                     |
| Baseline C  | Warm stone `#ece9e2` | Separate baseline variables from treatment without another prominent hue. |
| Outcome Y   | Soft blue `#e5ebf4`  | Retain outcome's existing identity.                                       |
| Mediator M  | Pale sand `#f3ecd9`  | Distinguish the intermediate variable within the warm family.             |
| Collider K  | Soft clay `#f2e3dc`  | Distinguish K from M without making either a warning.                     |
| Hidden U    | Off-white `#f5f4ef`  | Pair with a dashed outline and an explicit unmeasured label.              |

Use `--text` for node text. Preserve existing variable names and symbols; do not
add a second example label inside nodes. C's color applies to the sandbox's
observed covariates too, without implying that the lesson's single C and the
sandbox's pair are interchangeable.

Pale fills are supporting cues, not a test of whether learners can distinguish
every hue. Labels and arrow direction explain causal roles. Color identifies the
variable, not whether it is safe to adjust for it. A variable's fill stays fixed
when an analyst includes or excludes it.

## Graph states

- Use `--causal-path` for causal arrows and their arrowheads. Ordinary
  measured nodes need no border; essential paths and state indicators retain contrast.
- Do not outline, enlarge, or recolor nodes to indicate adjustment or lesson
  focus. Graph geometry and node appearance stay fixed when adjustment changes.
- Show adjustment in the controls and a short caption naming the model and its
  adjustment covariates: “Treatment model: no adjustment” / “Treatment model:
  adjusting for C” in lesson 3; “Outcome model: adjusting for C only” / “Outcome
  model: adjusting for C and M” in the mediator lesson, with K in the collider
  lesson. This describes adjustment covariates, not every regression predictor.
- Use dashed outlines and paths for unmeasured U, with an “Unmeasured” label or
  adjacent explanation. Dashes have this meaning within causal graphs; fitted
  curves use their own explicit legend. At zero influence, retain U's readable
  label and explain inactive paths rather than fading the whole node.
- Identify the model in adjustment captions. The sandbox's “Adjusted methods”
  caption applies to regression adjustment, IPW, and AIPW; raw association and
  naive regression remain unadjusted. Native keyboard focus remains an
  interaction cue on controls, separate from the causal graph.

The old mediator/collider graphs outlined C while lesson 3 did not. Removing
these outlines avoids emphasizing C as the lesson topic and makes adjustment
presentation consistent. C remains in the same fitted models; only its visual
presentation changes.

## Equations, methods, and truth

- Use `--text` for mathematical text. Optional variable highlights reuse the pale node
  backgrounds. Distinguish treatment probabilities, weights, observed outcomes,
  and fitted predictions with notation and nearby labels; do not introduce a hue
  for each quantity. A prediction of Y may share Y's background, but must retain
  prediction notation and a label.
- Sandbox estimate markers and connecting bars use the lesson error scale:
  blend `--estimate` toward `--error-mark` as absolute error grows from 0 to 2
  outcome units. Keep named rows, numeric estimates, and signed errors. The mark
  color is a stronger red than the card surface so thin graphics retain contrast.
  This replaces the earlier neutral-marker decision at the user’s request.
- Use `--truth` for truth with an explicit “Truth” label. In estimate plots, use a
  dashed vertical reference line; in model comparisons, preserve the existing
  solid truth curve versus dashed fitted curve (`--fitted`), with a local legend.
  Line patterns distinguish references from estimates within each plot type.
- Treatment-arm charts use green untreated A=0 (`--arm-0`) and blue treated A=1
  (`--arm-1`), retaining the sandbox's existing group convention. Label the groups
  directly or in a legend; use circles for untreated and triangles for treated
  where points share a plot. These colors identify arm membership, not graph
  variables. Do not recolor a Y-axis label blue to imply it belongs to A=1.
- Show bias through distance from the labeled truth reference and numeric values.
  The sandbox no longer uses its `abs(estimate - truth) < 0.15` green/orange classification; it is not a validity threshold. Keep actual warnings
  explicit in text, separate from variable identity. Do not add uncertainty
  intervals without implemented inference.

## Lesson result cards

The true total effect uses the constant Outcome Y fill (`--node-Y`). Estimates
blend from neutral `--page` at zero absolute error to muted red `--error-surface` at an
absolute error of 2 outcome units, saturating beyond 2. This fixed scale applies
across lessons, estimators, slider changes, and redraws. It is a display scale,
not a statistical threshold; it never divides by truth or rescales to other
estimates. Equal errors above and below truth receive equal tint.

Each theme pairs its result backgrounds with contrasting text. Each estimate retains its numeric value and a
signed difference from the lesson's total-effect target. Differences use the
unrounded results, displayed to two decimals without negative zero. Stronger red
means farther from truth in this sample; it does not establish bias, significance,
or invalidity. Missing/non-finite results are labeled Unavailable. The sandbox's
plot uses the same error scale for its marks and bars; intervals remain separate
inference work. The independent overlap card uses the lesson background tints.

### Instrument adjustment pairs

The instrument follow-on section retains the lesson’s fixed 0–2 absolute-error
background tint and signed differences. A darker strip uses `--error-mark` to
show only the extra absolute error versus the other estimate in that method’s
pair. Strip length uses a fixed 0–0.5 outcome-unit scale, saturating above 0.5;
its exact value remains in the cell tooltip. The closer estimate has no strip.
This distinguishes the pair even when both backgrounds reach full red. Equal
absolute errors receive equal tint and no strip, regardless of sign. Unavailable
comparisons have neither a tint suggesting success nor an extra-error strip.
Repeated-study mean estimates use the same display, where the error estimates
bias. Both scales are explained beneath the paired results.

## Acceptance and application

Require at least 4.5:1 for ordinary text against its background and at least 3:1
for essential graphical indicators against adjacent colors. These follow
[WCAG text contrast](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)
and [non-text contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html).
Decorative pale fills do not need to contrast with one another at 3:1; labels,
arrows, and adjustment captions carry the information.

Calculated contrast for `#273d33` text exceeds 9:1 on all six fills; `#537565`
exceeds 4:1 against them. Check rendered backgrounds and opacity when applying
the palette, particularly transparent population points and inactive paths.
Do not assume these calculations validate every existing app element.

Review the examples at desktop and phone widths, in grayscale and with
protanopia, deuteranopia, and tritanopia simulations. Names, adjustment status,
hidden status, and estimates must remain understandable without hue differences.
Simulations support inspection; they do not establish learner comprehension.

Implemented here: shared CSS node colors, stable lesson and sandbox graphs,
model-specific adjustment captions, consistent treatment-arm colors, and continuous
error colors for sandbox estimates against labeled truth. The static examples
predate the sandbox error-color update.

Remaining application: equation rendering and worked formulas (#19/#17).
They must reuse these conventions without
changing estimator calculations or adding unsupported intervals.

No dependencies, public APIs, or calculations change. Shared CSS custom
properties in `src/theme.css` supply the existing SVG renderers and canvas arm
colors; future consumers should reuse them.
