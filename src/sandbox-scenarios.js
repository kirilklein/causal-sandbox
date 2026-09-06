import { defaults, presets, worlds } from "./simulation.js";

export const scenarios = [
  ...presets.map((preset, i) => ({
    ...preset,
    id: ["randomized", "observed", "hidden", "collider", "mediator"][i],
    name: [
      "Randomized treatment",
      "Observed confounding",
      "Hidden confounding",
      "Adjusting for a collider",
      "Adjusting for a mediator",
    ][i],
    group: "Confounding and causal roles",
    world: "additive",
    models: { outcome: false, treatment: false },
    question: [
      "Can an unadjusted comparison recover the effect?",
      "Can adjustment remove the difference from truth?",
      "What if a common cause is unmeasured?",
      "Can adjusting for another variable make things worse?",
      "What happens when we adjust away part of the effect?",
    ][i],
    action: [
      "Change A → Y and compare the estimates with the known effect.",
      "Check C under Adjust for, then compare with the starting estimates.",
      "Change U → A or U → Y. Adjusting for C cannot remove confounding through U.",
      "Uncheck K under Adjust for and compare with the starting estimates.",
      "Uncheck M under Adjust for, then change the mediator pathway.",
    ][i],
  })),
  ...[
    [
      "outcome-model",
      "Outcome model is too simple",
      false,
      true,
      "Can the treatment model compensate when the outcome model is too simple?",
      "Choose a more flexible outcome model. Compare regression, IPW, and AIPW.",
    ],
    [
      "treatment-model",
      "Treatment model is too simple",
      true,
      false,
      "Can the outcome model compensate when the treatment model is too simple?",
      "Choose a more flexible treatment model. Compare IPW and AIPW with regression.",
    ],
    [
      "both-models",
      "Both models are too simple",
      false,
      false,
      "What does double robustness protect against?",
      "Make either model more flexible, then both. Compare each estimate with truth.",
    ],
    [
      "correct-models",
      "Both models capture C’s relationships",
      true,
      true,
      "What changes when a model omits a real relationship?",
      "Choose a simple model for one relationship at a time. A single sample need not favor AIPW.",
    ],
  ].map(([id, name, outcome, treatment, question, action]) => ({
    id,
    name,
    question,
    action,
    group: "Model specification",
    p: { ...defaults },
    adjust: ["C"],
    world: "both",
    models: { outcome, treatment },
  })),
  {
    id: "overlap",
    name: "Poor overlap",
    group: "Support and weights",
    question:
      "What happens when comparable people rarely receive the opposite treatment?",
    action:
      "Increase treatment selection strength. Compare estimates, fitted scores, and weight diagnostics.",
  },
];

export function scenarioState(scenario) {
  return {
    p: { ...scenario.p },
    graphVisible: new Set([
      "A",
      "Y",
      "C",
      "M",
      "K",
      ...(scenario.id === "hidden" ? ["U"] : []),
    ]),
    adjust: new Set(scenario.adjust),
    world: worlds.find((world) => world.id === scenario.world),
    models: { ...scenario.models },
  };
}
