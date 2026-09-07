# How strong is a causal arrow?

The optional lesson opens at `?lesson=arrow-strength`, directly after
“Instruments and adjustment.” It asks whether a causal relationship can exist
when a marginal regression finds no association.

## World and analysis

Each sample contains 2,400 people. The treatment effect is 2. The two lesson
controls set the strength of Z → A and the direct effect Z → Y:

```text
C = +1 if C1 > 0, otherwise -1
Z ~ Bernoulli(0.5), independent of C and all other background draws
A = 1[a < sigmoid(-0.8 + 1.2 C + za Z)]
Y = 2 A + 1.5 C + zy Z + eY
```

The same exogenous draws are retained while either slider moves. The analysis
shows the true direct Z → Y effect, the population total effect of intervening
on Z, and the sample coefficient from a marginal regression of Y on binary Z.
That coefficient equals the difference in mean outcomes between Z groups.

“Paths cancel” sets `zy` to the negative of Z’s population-mediated effect
through treatment. The total effect of Z is then exactly zero although its
direct effect is nonzero. Because Z is randomized, the mean marginal association
across studies is also zero. In this setting Z is a common cause of A and Y, so
omitting it from the treatment analysis leaves confounding.

IPW, outcome regression, and AIPW compare adjustment for C alone with adjustment
for C + Z. Numeric point estimates stay visible. Estimate cells use the shared
fixed 0–2 outcome-unit error tint. Changing controls clears repeated-study
results; redraw changes only the sample; restart restores seed 4217, Z → A
strength 2, and direct effect zero.

## References

The visible introduction links the two central claims inline: an absent DAG
arrow encodes a causal assumption, and causal paths can cancel to produce weak
or zero associations. The expanded reading list adds work on plausibly exogenous
instruments, testability, and Mendelian randomization.

## Validation

Run `node --test src/arrow-strength-simulation.test.js` and
`node tests/arrow-strength-browser.mjs` against a separately running built app.
The browser suite is included in `npm run test:browser`.
