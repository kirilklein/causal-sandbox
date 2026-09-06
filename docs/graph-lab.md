# Graph lab

Open `?sandbox=graph-lab` or use **Build a graph** in the full sandbox. The lab
is an optional, separate experiment. Its code loads only on that route. The
timing lesson links to the P–K–R preset; K is the score shown as V in that lesson's
diagram. The equations match that example, but the lab uses its own fixed draws.

## Edit and analyze

Start with P–K–R, observed confounding, hidden confounding, mediation, or a blank
A/Y graph. Enter a name and choose **Add variable** to create an observed continuous
variable. Choose **Draw arrow**, then click its source and destination; Escape
cancels. The optional **Connect using menus** disclosure offers the same operation.
Drag nodes to arrange them, or use arrow keys on a focused node. **Auto arrange**
restores automatic placement. Positions affect only the drawing, not simulation
or adjustment. Select a node or arrow to open its inspector. Long names are
abbreviated inside nodes; their full names remain in accessible labels, inspectors,
and analysis controls.

Arrow strength ranges from −3 to 3. Zero leaves an inactive arrow in the drawing;
remove the arrow to remove it from the graph. Treatment arrows act on log odds.
The node inspector changes its intercept and, for continuous variables, its
noise scale and distribution. Changing measured status removes a hidden variable
from adjustment without removing it from the generating world.

The checkboxes above the estimates choose one observed adjustment set for linear
outcome and logistic treatment models, available in both World and Analysis tabs.
Results show raw association, regression, normalized
IPW, and AIPW against the known total ATE. Adjusting for a mediator or collider
is permitted as an experiment, with explanatory text. The lab does not identify
valid adjustment sets or guarantee that main-effect fitted models represent the
relevant conditional relationships.

The error axis remains at ±4 outcome units. Off-scale triangles retain exact
numeric estimates and signed errors. Hollow marks show starting errors relative
to the starting world's truth; solid marks show current errors relative to the
current world's truth. Compact rows use the full sandbox's shared track and
marker styling, with one common axis. Marks use the fixed 0–2 absolute-error scale.
There are no confidence intervals or significance claims.

## Simulation contract

- At most eight variables and twelve directed arrows, with one fixed binary
  treatment A and one continuous outcome Y. Other variables are continuous.
- Every continuous equation is an intercept plus weighted parents plus
  independent noise. Noise is standard normal or uniform on [−√3, √3], scaled
  by a positive value between 0.1 and 3. Intercepts range from −3 to 3.
- A is Bernoulli with probability sigmoid(intercept + weighted parents).
- Graph validation rejects cycles (including zero-strength cycles), duplicate
  arrows, self-loops, invalid coefficients, and missing endpoints. Descendants
  of Y are allowed, including the post-outcome collider A → K ← Y.
- Topological evaluation generates 2,400 records at seed 4217. Each variable
  has its own stream derived from its stable ID. Renaming, reordering, adding
  unrelated nodes, changing measured status, and changing adjustment do not
  reshuffle existing variables' noise. New IDs are not reused after deletion
  within an experiment.
- Truth is the mean paired difference from forcing A=1 and A=0 and recomputing
  downstream variables with identical noise. In this additive model it is a
  constant total effect, also obtainable as the sum of products along causal
  A-to-Y paths. No observed mediator is held fixed during intervention.

Only observed selected columns reach estimation. Covariates are standardized
to improve conditioning along longer paths. The existing estimator's opt-in
`strict` mode checks missing treatment arms, design rank before regularization,
and logistic convergence. If a shared fit fails, all adjusted rows are marked
unavailable with the reason; raw association remains when both arms exist.
This conservatively withholds regression too if the treatment fit fails.
Existing lesson and full-sandbox calls retain their previous fitting behavior.

Clipping and per-arm ESS use existing estimator diagnostics. Warn for any clipped
score or arm ESS below 25% of that arm's size. These are display heuristics,
not tests of exchangeability or positivity.

## State and navigation

Reset and preset selection restore the starting graph and empty adjustment set.
Theme and disclosure changes do not alter results. Custom lab edits are kept
only while the page remains open; reload starts the preset named in the URL.
Versioned custom share links and lab draft persistence are deferred.

Entering through the full sandbox saves that sandbox's scenario, parameters,
adjustment, model choices, selected tab, disclosures, and
overlap setting in session storage. **Return to full sandbox** restores them.
The source history entry also holds a snapshot for Browser Back when storage
is unavailable. A normal `?sandbox` entry still starts its scenario normally.

## Validation

Run `npm test`, `npm run build`, and `npm run test:browser` with a separately
running worktree server. `APP_URL` selects the server; see CONTRIBUTING.md.
The browser suite includes `tests/graph-lab-browser.mjs`.

Unit checks cover intervention propagation and multiple paths, stable noise,
hidden-variable exclusion, numerical failures, independent covariance OLS,
the analytic P–K–R population contrast across 40 seeds, and confounding/mediation
across repeated studies. Browser checks cover the editable loop, invalid arrows,
reset, numerical display, adjustment invariance of graph geometry, keyboard,
themes, narrow-screen layout, timing entry, and full-sandbox restoration.

No nonlinear equations, repeated treatment, binary outcomes, IV estimator,
automatic adjustment checker, data upload, or causal discovery is included.
