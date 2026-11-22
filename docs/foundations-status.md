# Causal Inference Foundations delivery tracker

**2026-11-22 · `causal-inference-from-scratch` · implementation reviewed at `0cc9ed5`**

All six planned modules are implemented on the branch. A simulated walkthrough reached the final report and resumed interrupted work. The production build and all 256 automated unit and model tests passed. The full rendered browser journey, physical-phone usability, beginner learning outcomes and actual completion time are still open. See the [curriculum and design budgets](education.md).

## Curriculum delivered

| Module | What a learner can do today | Required time budget |
| --- | --- | ---: |
| 1. Define the effect | Predict from one observed patient, reveal the other trajectory, run a randomized trial and identify the population contrast. A wrong answer gives a retry. Completing the trial and identifying the effect unlocks module 2. | 30 min |
| 2. Explain a misleading difference | Change who receives treatment while keeping patients and potential outcomes fixed. Compare severity groups, run repeated studies at two sample sizes and explain the result at a second hospital. | 40 min |
| 3. Choose what to adjust for | Select an adjustment set on three graphs and explain how conditioning on a mediator or collider changes the comparison. | 40 min |
| 4. Estimate the effect | Compare within severity, standardize for a different clinic, calculate a weight, average model predictions and interpret an estimate. | 50 min |
| 5. Decide when to trust the result | Inspect sparse and empty comparison groups, reveal a hidden common cause, and compare fitted and observed outcomes in a separate misspecified-model exercise. | 45 min |
| 6. Solve a new study | Analyze a job-training offer, justify adjustment, calculate an employment difference and write a conclusion with a limitation. The report retains first submissions. Written reasoning is self-reviewed. | 35 min |

The course reuses the patient trajectory model with 100 patients, ten severities and a +12-point benefit. This supplies the sign reversal and within-group comparisons proposed in the original two-severity example. The final study introduces a different population, treatment and outcome. The extended final quiz remains an optional resource. [Module catalog](../src/foundations-catalog.js) · [Patient experiments](../src/foundations-study.js) · [Later activities and capstone](../src/foundations-activities.js)

## Product and verification status

| Original commitment | Current evidence | Check still open |
| --- | --- | --- |
| One course for beginners, returning learners and people skipping ahead | Home offers Start or Continue. The outline opens any module. Placement recommends a module. The scenario sandbox, graph builder, concept map and topic library remain reachable. | Walk each entry and return route in a rendered browser, including a placement result and an optional experiment mid-module. |
| Preserve existing links and progress | Topic URLs, legacy numeric IDs and shared graph presets still have handlers. The course extends the pilot record. Legacy lesson progress and placement have separate records. | Run compatibility tests with an old numeric link, a shared preset and pre-existing progress. Verify the destination and saved answers. |
| Optional depth and source attribution | Adjustment links to longitudinal treatment, estimation to AIPW and TMLE, and trust to front-door. The curriculum maps Berkeley labs and the lessons name optional chapters from What If, Neal and Facure. Foundations uses original exercises and synthetic cases. | Spot-check chapter destinations. Record provenance, licenses and required notices if directly adapting any external code, figure or dataset. |
| Usable phone and desktop journey | The browser suite specifies 320, 390, 430 and 1280 CSS pixels. The simulated walkthrough exercised retry, navigation and resume. The suite passed at all four widths in headless Chrome on 2026-11-22. | Run the rendered suite and inspect touch, keyboard, reduced motion, chart values, overflow and obscured controls. Record emulation and physical devices separately. |

[Course browser checks](../tests/foundations-browser.mjs) · [Progress handling](../src/foundations-progress.js) · [Legacy lesson checks](../tests/lessons-browser.mjs) · [Browser setup](../CONTRIBUTING.md#browser-checks)

## Next reviewable work

1. **Verify the handoff that blocked module 1.** On a phone, open the course, run the trial, choose the before-and-after answer, reload, correct it, and enter module 2. Repeat by leaving immediately after the correct answer and using Continue on home. Record whether the retry instruction and next action were visible without searching. Then run the full course and compatibility checks above.
2. **Observe beginners doing the pilot without coaching.** Use physical iOS Safari and Android Chrome where available. Ask learners to change assignment, explain the reversal and the effect of a larger sample, answer the transfer question, close the browser and resume. Record where they needed help. Check whether the severity comparison and its control fit together and whether graph choices work by tap or keyboard.
3. **Check that module 5 no longer gives away the answer.** Done: the step names no hidden cause, and frailty appears only after the learner reveals it. Check the revised order with a beginner.
4. **Validate transfer and duration.** Observe full-course learners with basic statistics and no causal inference background. Review their capstone writing for a defined contrast, justified comparison, interpreted estimate and credible limitation. Log active required minutes by module, optional reading, optional exploration and breaks separately. Report the number of learners, median and range before publishing a duration. Current budgets are 240 required minutes, 30–45 optional reading and 45–90 optional exploration.

## Review log

| Date | Evidence | Outcome |
| --- | --- | --- |
| 2026-11-22 | User reported a dead end after the module 1 randomized trial. Fix `0cc9ed5`. | Retry feedback now sits beside the choices and onward control. Completion is saved before leaving. The retry and home-resume paths passed in the simulated walkthrough. Rendered retest pending. |
| 2026-11-22 | User could not click "Compare with simulator truth" in module 2. The locked button looked active, the wrong answer gave no retry cue and the step showed only the last slider position, not the reversal. | Locked buttons now look disabled, wrong answers start with "Try again" and the step shows both rules (−2.93 and +12.00). `tests/foundations-browser.mjs` passed at 320, 390, 430 and 1280 px in headless Chrome against the built site. User retested module 2 and confirmed. |

Add a dated row after each review with the branch revision, device or test environment, observed result and remaining blocker. Update the matching item above when its acceptance check passes.
