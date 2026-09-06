<h1>
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="docs/brand-mark-dark.svg">
    <source media="(prefers-color-scheme: light)" srcset="docs/brand-mark-light.svg">
    <img src="docs/brand-mark-light.svg" alt="" width="86" height="72" align="left">
  </picture>
  Causal Sandbox<br>
  <small>An Interactive Causal Inference Simulator</small>
</h1>

A free, browser-based causal inference simulator and teaching tool. Increase confounding, hide a confounder, condition on a collider, or break positivity, and watch regression adjustment, propensity score IPW, AIPW, and TMLE estimates succeed or fail against the known true effect. Start with guided lessons, then explore the full sandbox. Nothing to install.

## Guided lessons

**[Start the lessons →](https://kirilklein.github.io/causal-sandbox/?lesson=randomization)**

Start with randomization and introduce one concept at a time: confounding, adjustment, causal roles, and model assumptions. Change a setting and compare the estimate with the known effect.

[![First lesson: treatment and outcome, an effect slider, and estimates beside the truth](docs/lessons.png)](https://kirilklein.github.io/causal-sandbox/?lesson=randomization)

## Interactive concept guides

- [Confounding and sample size](https://kirilklein.github.io/causal-sandbox/confounding/)
- [Collider bias](https://kirilklein.github.io/causal-sandbox/collider-bias/)
- [Positivity and overlap](https://kirilklein.github.io/causal-sandbox/positivity/)
- [Inverse probability weighting](https://kirilklein.github.io/causal-sandbox/inverse-probability-weighting/)
- [AIPW and double robustness](https://kirilklein.github.io/causal-sandbox/aipw-double-robustness/)
- [Mediator adjustment](https://kirilklein.github.io/causal-sandbox/mediator-adjustment/)
- [Targeted minimum loss-based estimation](https://kirilklein.github.io/causal-sandbox/tmle/)
- [Propensity-score clipping and trimming](https://kirilklein.github.io/causal-sandbox/propensity-score-clipping-trimming/)

Each guide opens a preconfigured experiment, gives specific actions to try, and explains the result against the known true effect.

## Full sandbox

**[Explore the full sandbox →](https://kirilklein.github.io/causal-sandbox/?sandbox)**

Choose a scenario, then customize its world and analysis in separate tabs. Each scenario restores a complete starting setup with two baseline covariates. “Guided lessons” in the header returns to the tutorial.

[![Full sandbox: scenario selection, analysis controls, and estimates compared with truth](docs/screenshot.png)](https://kirilklein.github.io/causal-sandbox/?sandbox)

- **Edit the causal world.** Sliders set every arrow strength in a DAG with treatment A, outcome Y, observed covariates C (C₁, C₂), hidden confounder U, mediator M, and collider K.
- **Play analyst.** Choose adjustment variables beside the estimates and configure the outcome and propensity models in the Analysis tab. Graph display controls only fade nodes and arrows; they never change adjustment or estimates.
- **Compare estimates against the truth.** Unadjusted, regression adjustment, IPW, and AIPW use a fixed error scale with starting markers. The unadjusted row combines raw association and the equivalent naive regression.
- **Switch worlds** to add interactions to the outcome, the treatment, or both — and see which estimators break when the model is misspecified.
- **Explore ten scenarios:** randomization, observed or hidden confounding, collider or mediator adjustment, four model-specification comparisons, and an isolated poor-overlap experiment. Restart the selected scenario or share its starting setup through its link.
- **Look up terms as you explore.** Pause over an underlined term, or tap or click it, for a short definition, or open the collapsed glossary in “How this world works.” Help supports keyboard navigation and Escape to close, without changing the simulation.

The true effect is always known, so every estimate can be compared with it. All simulations run in the browser; the static site uses GoatCounter for visit analytics.

[Curriculum and learner walkthrough](docs/education.md).

## For developers

See [CONTRIBUTING.md](CONTRIBUTING.md) for local setup and development. The
[methodology notes](https://kirilklein.github.io/causal-sandbox/methodology/)
describe the causal world, estimators, and important limitations.

## Acknowledgments

The contextual glossary and guided experiments take inspiration from Carlos Mendez’s [Treatment Effects in Stata — Interactive Lab](https://carlos-mendez.org/post/stata_matching/web_app/). The explanations here are original and describe this sandbox’s causal world and estimators.

The treatment of TMLE draws on Katherine Hoffman’s [An Illustrated Guide to TMLE](https://www.khstats.com/blog/tmle/tutorial), especially the [visual guide](https://www.khstats.com/blog/tmle/tutorial-pt2) (also on [GitHub](https://github.com/kathoffman/causal-inference-visual-guides)), an excellent walkthrough of the targeting step.

## Contributing

Ideas, corrections, and contributions are welcome. Open an [issue](https://github.com/kirilklein/causal-sandbox/issues/new/choose) to report a bug, correct an explanation, or propose a lesson, scenario, or estimator. For anything beyond a small fix, open an issue first so we can agree on scope before you write code. See [CONTRIBUTING.md](CONTRIBUTING.md) for setup and what a good PR looks like.

To the theorists: apologies in advance. Here we lead with intuition, starting from simple settings. For a full and rigorous theoretical coverage, see van der Laan and Rose, _Targeted Learning_ (Springer, 2011), and Hernán and Robins, [_Causal Inference: What If_](https://miguelhernan.org/whatifbook).

## License

MIT
