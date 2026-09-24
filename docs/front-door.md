# The front-door criterion (#251)

The advanced lesson at `?lesson=front-door` follows hidden confounding. It is
registered in Contents, topics, search, and the hidden-confounding lesson's
optional links. Prerequisites: mediators and hidden confounding.

**Takeaway:** a suitable mediator can identify the total effect despite hidden
treatment–outcome confounding. Measuring a mediator alone is insufficient.

## One causal story

The main question is: how many extra students pass because tutoring changes
practice? One persistent causal graph carries the argument:

- Tutoring → practice: a 50 percentage-point rise in regular practice.
- Practice → passing: a 40-point adjusted pass-rate contrast.
- Together: 20 extra passes per 100 students, on average.

Changing how strongly hidden readiness selects students into tutoring moves the
observed difference while leaving the valid reconstruction fixed. The graph,
controls, and shared result boxes remain visible together. Simulator truth is
explicitly labeled and available immediately; real data do not reveal it.

Changing the causal story adds a direct tutoring → passing path, a hidden
readiness → practice path, or missing tutoring/practice combinations. The same
graph and result boxes expose the failure. In the hidden mediator-cause world,
link annotations explicitly say observed difference and confounded association.
Unavailable outcome comparisons are not filled in.

Optional explanations show the within-tutoring comparisons, averaging, full
formula, model, source, and a transfer question. At the default settings the
within-group pass rates are 16% → 56% and 34% → 74%. Averaging over this
population's 50/50 tutoring mix gives 25% and 65%; the full reconstruction gives
33% and 53%. The main view leads with the mechanism rather than these averages.

For binary practice, the front-door contrast factors into the change in practice
probability times the standardized practice-response contrast. This identity
holds for the observational functional even in the invalid worlds; identifying
it with the total causal effect requires the front-door assumptions. It is not
a general instruction to multiply regression coefficients.

## Visual and interaction conventions

The graph retains the A/M/Y/U palette and dashed unmeasured paths. It uses a
horizontal chain on desktop and a vertical chain on narrow phones. Geometry
stays fixed within each layout as selection and causal assumptions change.
Zero selection dims the readiness → tutoring edge and names it as inactive.

Effect results use the shared error tint in raw risk units, with displayed
values and differences in percentage points. Truth has a constant background.
The readiness slider has a visible track and keyboard controls. Open disclosures
stay open while controls update their contents. Restart resets the world,
selection, transfer answer, and disclosures.

## Population and identification

The fictional binary model has independent background randomness:

- P(U=1)=0.5.
- P(A=1 | U)=0.5+s(U−0.5), with s from 0 to 0.8, initially 0.6.
- P(M=1 | A)=0.2+0.5A.
- P(Y=1 | M,U)=0.1+0.4M+0.3U.

Enumeration gives eight observed A/M/Y cells. Only these cells enter
`reconstructFrontDoor`; hidden U and intervention truth do not. Exact population
proportions isolate identification from sampling and fitted-model error.

The direct-path world adds 0.15A to the outcome probability: truth is 35 points
and the reconstruction is 20. The hidden-mediator-cause world adds 0.2U to the
practice probability. At nonzero selection both identification stages are
confounded; at zero selection the practice–outcome stage remains confounded.
The no-overlap world sets M=A, leaving required conditional outcomes undefined.

Source: [Pearl, Glymour & Jewell, Causal Inference in Statistics: A Primer,
§3.4](https://bayes.cs.ucla.edu/PRIMER/primer-ch3.pdf), definition and theorem 3.4.1.

## Validation

`node --test src/front-door.test.js src/effect-comparison.test.js src/search-index.test.js`
checks the model, selection sweep, graph violations, missing support, unequal
averaging weights, binary contrast identity, shared tints, and discovery.
`APP_URL=... node tests/front-door-browser.mjs` checks the integrated mechanism,
controls, changing evidence, disclosures, reset, discovery, both themes, and
1440/700/390/320px layouts. Screenshots are saved to `test-results/front-door/`.

Learner comprehension still needs a walkthrough: can someone explain why the
observed difference changes, why the reconstruction stays fixed, and why adding
a direct route breaks their agreement?
