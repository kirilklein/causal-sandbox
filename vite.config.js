import { defineConfig } from "vite";

export default defineConfig({
  base: "/causal-sandbox/",
  build: {
    rollupOptions: {
      input: {
        main: "index.html",
        methodology: "methodology/index.html",
        confounding: "confounding/index.html",
        colliderBias: "collider-bias/index.html",
        positivity: "positivity/index.html",
        inverseProbabilityWeighting: "inverse-probability-weighting/index.html",
        aipwDoubleRobustness: "aipw-double-robustness/index.html",
        mediatorAdjustment: "mediator-adjustment/index.html",
        tmle: "tmle/index.html",
        propensityScoreClippingTrimming:
          "propensity-score-clipping-trimming/index.html",
        tmleRobustness: "docs/tmle-robustness-preview.html",
      },
    },
  },
});
