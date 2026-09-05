# Color conventions

Implemented for #20 in the existing lesson and sandbox graphs, treatment-arm
charts, and sandbox estimate markers. Future equation and lesson estimate-plot
work follows the same conventions. Keep the cream page
background, pale node fills, dark text, and restrained green interface accents.

Open the [visual examples](color-examples.html) in a browser to compare the palette,
adjustment captions, and an illustrative estimate plot. The examples use inline SVG
and work offline; their numbers are not simulation results.

## Variables

| Variable    | Fill                 | Purpose                                                                   |
| ----------- | -------------------- | ------------------------------------------------------------------------- |
| Treatment A | Soft green `#e6efe9` | Retain treatment's existing identity.                                     |
| Baseline C  | Warm stone `#ece9e2` | Separate baseline variables from treatment without another prominent hue. |
| Outcome Y   | Soft blue `#e5ebf4`  | Retain outcome's existing identity.                                       |
| Mediator M  | Pale sand `#f3ecd9`  | Distinguish the intermediate variable within the warm family.             |
| Collider K  | Soft clay `#f2e3dc`  | Distinguish K from M without making either a warning.                     |
| Hidden U    | Off-white `#f5f4ef`  | Pair with a dashed outline and an explicit unmeasured label.              |

Use `#273d33` for node text. Preserve existing variable names and symbols; do not
add a second example label inside nodes. C's color applies to the sandbox's
observed covariates too, without implying that the lesson's single C and the
sandbox's pair are interchangeable.

Pale fills are supporting cues, not a test of whether learners can distinguish
every hue. Labels and arrow direction explain causal roles. Color identifies the
variable, not whether it is safe to adjust for it. A variable's fill stays fixed
when an analyst includes or excludes it.

## Graph states

- Use the existing `#537565` for causal arrows and their arrowheads. Ordinary
  measured nodes need no border; essential paths and state indicators remain dark.
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

- Keep mathematical text dark. Optional variable highlights reuse the pale node
  backgrounds. Distinguish treatment probabilities, weights, observed outcomes,
  and fitted predictions with notation and nearby labels; do not introduce a hue
  for each quantity. A prediction of Y may share Y's background, but must retain
  prediction notation and a label.
- For the planned estimate plot, use dark neutral `#273d33` markers, separate
  named method rows, and readable numeric estimates. Do not allocate a hue to
  every estimator or change marker color with its distance from truth.
- Use `#315e48` for truth with an explicit “Truth” label. In estimate plots, use a
  dashed vertical reference line; in model comparisons, preserve the existing
  solid truth curve versus dashed fitted curve (`#ad562e`), with a local legend.
  Line patterns distinguish references from estimates within each plot type.
- Treatment-arm charts use green untreated A=0 (`#286648`) and blue treated A=1
  (`#315d8c`), retaining the sandbox's existing group convention. Label the groups
  directly or in a legend; use circles for untreated and triangles for treated
  where points share a plot. These colors identify arm membership, not graph
  variables. Do not recolor a Y-axis label blue to imply it belongs to A=1.
- Show bias through distance from the labeled truth reference and numeric values.
  The sandbox no longer uses its `abs(estimate - truth) < 0.15` green/orange classification; it is not a validity threshold. Keep actual warnings
  explicit in text, separate from variable identity. Do not add uncertainty
  intervals without implemented inference.

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
model-specific adjustment captions, consistent treatment-arm colors, and neutral
sandbox estimates against labeled truth. The examples document these choices.

Remaining application: equation rendering and worked formulas (#19/#17), and
lesson estimate visualization (#16). They must reuse these conventions without
changing estimator calculations or adding unsupported intervals.

No dependencies, public APIs, or calculations change. Shared CSS custom
properties in `src/style.css` supply the existing SVG renderers and canvas arm
colors; future consumers should reuse them.
