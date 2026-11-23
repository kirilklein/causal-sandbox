# Causal Inference from Scratch · Curriculum v2

*How can a treatment help patients recover when the patients who receive it do worse on average?* Open with the lower day-12 health score among treated patients. By the end of the course, a learner should be able to explain that result, estimate the effect under stated assumptions, and make the same decisions in an unfamiliar study.

The foundations branch already implements six modules. V2 keeps the routes, patient simulation, saved progress and optional topic library. It moves five minutes from Module 2 to the independent case, puts outcome regression immediately after standardization, and makes an unaided explanation the test of the pilot. The required path has a **240-minute design budget**. Actual beginner completion time is still to be measured. The readings below guide course authors and can appear after each module as optional “Read more” links. [Original curriculum](education.md) · [Delivery tracker](foundations-status.md) · [Current module catalog](../src/foundations-catalog.js)

## The study learners carry forward

Follow 100 simulated patients across ten baseline severity groups. Treatment starts on day 4. Higher day-12 health scores mean better recovery. The question throughout is how much higher or lower the cohort’s mean day-12 score would be if everyone received treatment compared with nobody receiving it. The simulator knows both possible scores for each patient. An analyst sees only the score under the treatment each patient received. Label every reveal that draws on simulator knowledge. [Patient model](../src/trajectory-model.js) · [Study comparisons](../src/foundations-study.js)

### 1. What does it mean for a treatment to work? · 30 min

Reuse **What if?** and **A randomized experiment**. Show one patient whose health declines after treatment. Ask whether treatment helped before revealing the untreated path. Read the distance between the two paths on day 12. In this simulation a patient can decline under both choices and still finish 12 points healthier with treatment.

Move from that pair of outcomes to the cohort. Hide each unobserved outcome, randomly assign treatment, and compare the observed arm means. Let learners reassign the same patients several times and retain the last few estimates beside the fixed average treatment effect. Ask them to name the population, treatment choices, outcome and day, then explain why another assignment can give a different estimate. Randomization makes the arms comparable on average across assignments.

Author references for potential outcomes, random assignment and a worked comparison. [Hernán & Robins, *What If*, chapters 1–2](https://miguelhernan.org/whatifbook) · [Facure, Randomised Experiments](https://matheusfacure.github.io/python-causality-handbook/02-Randomised-Experiments.html)

### 2. Why do treated patients look worse? · 35 min

Reuse **Why a helpful treatment can look harmful** and the pilot’s repeated-study plot. Keep the patients and both potential outcomes fixed. Ask learners to predict what will happen if the hospital gives treatment more often to sicker patients. On one phone screen, put the assignment control next to the two arms’ severity distributions, means and signed crude difference (treated minus untreated). With equal shares treated at every severity, the difference is +12 points. Favoring the sickest changes it to about −2.93 points. Let the learner tap a severity group and see that treated patients still score 12 points higher within it. Keeping the two rule results visible makes the reversal legible after the slider stops.

Now hold the hospital’s assignment rule fixed. Plot the crude differences from 60 studies of 100 patients and 60 of 1,600 patients on the same scale, with zero and the simulated effect marked. Ask which feature changed when the sample grew. Learners should see the estimates clustering more tightly around the hospital’s crude contrast while the gap from the causal effect persists. Use the fresh example below to check their explanation. [Existing pilot](../src/foundations-pilot.js) · [Optional uncertainty lesson](uncertainty.md)

Author references for the distinction between who receives treatment and how much an estimate varies across samples. [Facure, Introduction to Causality](https://matheusfacure.github.io/python-causality-handbook/01-Introduction-To-Causality.html) · [*What If*, chapters 7 and 10](https://miguelhernan.org/whatifbook)

### 3. What should we adjust for? · 40 min

Reuse the three supplied graphs and the **Mediator adjustment** and **Collider bias** lessons. Keep the total effect in the question on screen. On the first graph, tap baseline severity and trace the common-cause path it closes. On the second, try adjusting for day-7 recovery and trace the treatment benefit that choice blocks. On the registry variant, two arrows enter registry membership. Select it and trace the path that opens between referral tendency and prognosis.

After each choice, highlight the affected path and ask what comparison the analyst just made. Finish when learners can defend a sufficient set on the supplied graph and explain a tempting extra variable they would leave out. Tapping a labeled node or using its keyboard equivalent completes the exercise. Graph editing stays optional. [Course graphs and activities](../src/foundations-activities.js) · [Graph lab](graph-lab.md)

Author references for forks, chains, colliders and the backdoor criterion. [Facure, Graphical Causal Models](https://matheusfacure.github.io/python-causality-handbook/04-Graphical-Causal-Models.html) · [Neal, chapters 3–4](https://www.bradyneal.com/Introduction_to_Causal_Inference-Dec17_2020-Neal.pdf)

### 4. How do we estimate the effect? · 50 min

1. **Standardize.** Compare treated and untreated means within severity. Give each severity group its share of the target population in both arms, then subtract the two averages. Use the existing clinic example to make the arithmetic tangible. If three quarters of patients are at severity 0 and one quarter at severity 9, the untreated mean is 0.75 × 78 + 0.25 × 30 = 66 points.
2. **Extend the same operation to outcome regression.** Move the existing prediction activity here. Predict each patient’s score under each treatment, then average each set of predictions over the same patients. Keep the target mix visible as learners switch from observed group means to fitted predictions.
3. **Weight.** Reuse the IPW activity to show a second way to recover the target mix. At severity 9, one of ten patients is untreated. Select that patient to see why a weight of ten gives their observed score more influence. Show the severity distributions in both arms before and after weighting.

Finish with the crude, standardized, regression and weighted estimates side by side in health points. Ask why the adjusted estimates recover +12 here and which assumptions justify interpreting them. The study supplies a well-defined treatment, comparability within severity and both treatment choices at every severity. The fitted model also needs to represent the outcome relationship for the regression calculation. [Existing estimation activities](../src/foundations-activities.js) · [Weighting and prediction calculations](../src/foundations-analysis.js)

Author references for comparing estimators on a shared example and inspecting treatment probabilities. [*What If*, chapters 12–13](https://miguelhernan.org/whatifbook) · [Berkeley, steps 6A–6B](https://ctml.berkeley.edu/introduction-causal-inference) · [Facure, Propensity Score](https://matheusfacure.github.io/python-causality-handbook/11-Propensity-Score.html)

### 5. When should we distrust the estimate? · 45 min

Reset the patient study between three challenges. For each, show the evidence first, ask for a diagnosis and a defensible next step, then reveal what the simulator changed. Reuse **Too little overlap**, **A hidden common cause** and **When a model is too simple**. [Existing study variants](../src/foundations-analysis.js) · [Experiment displays](../src/foundations-experiments.js)

| Change one thing | What the learner can inspect | Decision to defend |
| --- | --- | --- |
| Make treatment increasingly likely at high severity, then remove the untreated comparison there. | Counts by severity and arm, the largest weight, and the empty cell. | Identify where the full-population estimate needs extrapolation. Seek comparison data or name the narrower population a supported estimate would describe. |
| Hide frailty, which influences both treatment and health. | The measured severity distributions already balance. Reveal frailty after learners say what the measured data establish. | Explain how bias could remain. Identify a baseline measurement or sensitivity analysis that would address the concern. |
| Fit a straight line to a curved outcome relationship. | Both arms have support. Overlay observed and fitted scores over severity, then compare two fits on the same data. | Identify where predictions miss and try a model that captures the curve. Explain which assumption this check addresses. |

Author references for overlap, unobserved confounding and model fit. [Facure, Propensity Score](https://matheusfacure.github.io/python-causality-handbook/11-Propensity-Score.html) · [Neal, chapter 8](https://www.bradyneal.com/Introduction_to_Causal_Inference-Dec17_2020-Neal.pdf#page=81) · [Berkeley, step 6A](https://ctml.berkeley.edu/introduction-causal-inference)

### 6. Can you solve a new study? · 40 min

Use the existing case of 200 eligible job-training applicants. Give learners the offer policy, the proposed graph and employment counts at six months. Ask them to define the effect, justify their adjustment set, inspect offer and no-offer counts within each experience group, and calculate a percentage-point difference for all eligible applicants. End with a two-sentence report. The first sentence gives the population, contrast, estimate and time horizon. The second gives a condition or limitation that matters for the city’s decision.

Keep the first submission for review. In the independent attempt, defer corrective feedback and the worked interpretation until the learner commits the report. The existing counts yield a standardized estimate of +16 percentage points. For the v2 truth reveal, define both potential employment outcomes in the simulator and calculate the eligible population’s true effect from them. Show that benchmark alongside the learner’s estimate and reasoning. The current grouped counts alone determine only the observed-data calculation.

Adapt the final quiz’s adjustment, standardization and support decisions to this case. Keep AIPW and TMLE questions in the optional continuation. Score the structured decisions and calculation automatically. Give learners a worked report for self-review of the writing. [Current assessment design](final-quiz.md) · [Job-training data and estimate](../src/foundations-analysis.js)

Author reference for taking one study from its research question through interpretation and limitations. [Berkeley Causal Roadmap and final project](https://ctml.berkeley.edu/introduction-causal-inference)

## First pilot decision

Start with the existing Module 2 route, `?lesson=observed-difference`. Give a first-time learner the phone and ask them to find two assignment rules that produce opposite signs. Observe whether they can see the control, both groups and the signed result together, inspect one severity, and proceed after an incorrect prediction. Check on a physical phone, including closing the browser and resuming at the same decision. Record where scrolling, unclear labels or a disabled button interrupted the comparison.

Before showing answer choices, give a fresh prompt: *A school offers extra tutoring mainly to pupils with low baseline scores. Tutored pupils improve more within each starting-score group, yet their average final score is lower than that of other pupils. How could that happen? What would enrolling ten times as many pupils under the same rule change?* Ask for the explanation in the learner’s own words. Listen for three things: starting score influences selection and final score, the groups therefore average different mixes of pupils, and a larger sample can narrow the spread while preserving the misleading comparison.

Record first unaided explanations separately from answers after a hint. If learners can move the slider but cannot explain the school result, revise the severity comparison and retest Module 2 before polishing later modules. Once learners can transfer the idea, test the reordered estimation sequence and independent capstone. Log active required time per module, optional exploration, reading and breaks separately before publishing a completion estimate.
