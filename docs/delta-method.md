# Delta Method and ratio uncertainty

The optional chapter at `?lesson=delta-method` follows uncertainty without changing
the core Continue sequence. It is linked from uncertainty, Contents, topics, and
search. Visual inspiration is credited beside the opening and in the references to
[Anton Bugaev](https://www.linkedin.com/posts/aabugaev_statistics-abtesting-datascience-activity-7503052275343552512-tKCT). Graphics are independently implemented;
the original video is linked, not republished. The bootstrap-comparison comment
informed the scope, but its author has not been identified.

An optional opening disclosure describes a shop comparing two randomized checkout versions. An
explicitly illustrative €10 versus €12 per order motivates a confidence interval
for the difference before introducing the method. The later experiment uses
fresh simulated users rather than treating those illustrative values as data.

The misconception is that a symmetric input must give a symmetric output, or that
bootstrapping automatically guarantees accurate confidence intervals. Learners
predict the output shape for `y = 20/x`: x is estimated average orders per visitor,
y is revenue per order in euros, and average revenue is held at €20 per visitor.
At x = 2 this recovers the opening A value of €10 per order. The distribution
represents repeated-study estimates, not individual visitors. The illustration
isolates denominator uncertainty before introducing joint numerator/denominator
uncertainty and finally the B−A difference.

The input is an illustrative symmetric Beta(4,4) bell scaled to the chosen mean
and SE, with support mean ± 3 SE. The controls keep its entire support positive.
The input bell sits below the horizontal axis and the output bell to the left
of the vertical axis in a single diagram. The output density and ratio curve use
the exact same vertical scale; guides map the input values onto the curve and
across to that shared output axis. Densities have open strokes, avoiding a
colored closing baseline. The viewBox follows the available width to keep labels
legible on phones. Both curves transform this same input; the tangent distribution preserves its
symmetric shape, while the actual ratio distribution is right-skewed. Densities
use change of variables, and actual moments use 2048 midpoint integration steps.
The tangent SE is absolute slope × input SE. This first illustration does not
claim an exactly normal input or output. The inference section separately uses
the Delta normal approximation. Axes rescale and readouts retain units. Dashed
and solid paths distinguish approximation from actual transformation.

The opening reveals one idea per action: move a single estimate along the curve;
introduce the sampling bell and predict its transformed shape; reveal the actual
output; then reveal the tangent and SE comparison. The tangent never appears with
the first output reveal. Native buttons and sliders support keyboard interaction.

The two-input explanation opens as a separate card, replacing the one-input card.
Six reader-controlled steps reveal the 3D input frame and ellipse, the ratio
surface, vertical mappings, the revenue tangent, the orders tangent, and finally
covariance. The input ellipse is centered at (20 euros, 2 orders) per visitor,
with marginal SEs (2, 0.2). It is an illustrative radius-two covariance contour,
not a calibrated confidence region. The highlighted pair lies on that contour;
it is not a random sample.

Each surface vertex rises from height zero to revenue/orders over 1.1 seconds.
This movement constructs the mapping; it does not represent changes over time or
new data. Projection lines and tangents reveal over 0.7 seconds. Previous removes
later elements; replay can be finished early. Reduced motion shows the completed
step immediately. Navigation, resize and preference changes finish/cancel motion.
The SVG scene supports pointer/touch dragging and arrow-key rotation, with Home
and a Reset view button restoring the initial angle. Camera orientation persists
across steps and changes no data. Rotation finishes any active reveal. Frame
corners determine a uniform fit, and surface cells are sorted by camera depth.

Each tangent reveals a matching colored variance term. Blue is revenue and
orange is orders, in the geometry, sigma labels, and MathML formula. Arrows run
from the center to one input SE along the corresponding tangent; they are not
variance vectors. Pending terms are explicitly marked until the covariance term
appears in the final step. Numeric terms are 1 + 1 - 2 rho in (euros/order)^2.

Both tangents meet at (20, 2, 10). Their slopes are 0.5 with respect to revenue
and -5 with respect to orders. Changing correlation in the final step changes the
ellipse and Delta SE, sqrt(2 - 2 rho), while the surface and slopes remain fixed.
The A/B comparison opens as another separate card, with a return path.

Ratio study and bootstrap actions precede their results; the coverage
question precedes its run button and graphs. Equations use native MathML with
spoken labels and wrapping at mathematical terms on narrow screens. The longer
Taylor approximation and model assumptions remain in the final reference disclosure.

The ratio experiment estimates `E(revenue|B)/E(orders|B) -
E(revenue|A)/E(orders|A)` using ratios of totals. It is not the mean of per-user
ratios. Fixed-size arms contain independent users. Purchase probability is 0.8 or
0.08; buyers have 1 or 5 orders with equal probability. Revenue follows
`orders * (10 + 2A + b*(orders-1)) * exp(sZ-s²/2)` with independent standard-normal
Z, b in {0,2}, and s in {0.5,1.3}. Each population ratio is `10+2A+10b/3`, giving
known true difference +2. The target is distinct from the average treatment effect
on user revenue. Randomization/no interference and inference assumptions are
explained separately from this particular generating model.

The Delta variance per arm is `sum((X-rY)^2) / ((n-1)*n*mean(Y)^2)`, which includes
numerator–denominator covariance. Arm variances add. The normal interval uses
the standard-normal 97.5th percentile. Bootstrap resamples paired user rows within
each arm, with 499 replicates and linearly interpolated 2.5/97.5 percentiles.
No-order arms, no estimated variation, and bootstrap zero denominators produce
explicit unavailable results. Undefined bootstrap draws are never silently dropped.

The coverage experiment runs 100 independent studies, each with its own bootstrap.
All attempted studies remain in the denominator; unavailable counts are separate.
Graphs preserve row pairing and use a fixed axis with overflow arrows. Work yields
every five studies, with cancellation and invalidation on setting/sample changes.
The lesson names Monte Carlo error at both levels and makes no universal ranking
claim. Restart resets the page. No automatic animation is needed.

References: [Deng et al. (2018)](https://arxiv.org/abs/1803.06336),
[Zepeda-Tello et al. (2022)](https://arxiv.org/abs/2206.15310), and
[Shalizi's bootstrap notes](https://www.stat.cmu.edu/~cshalizi/dst/18/lectures/18/lecture-18.html).

Tracking: [issue #296](https://github.com/kirilklein/causal-sandbox/issues/296).
