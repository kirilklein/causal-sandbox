import { defineConfig } from "vite";

export default defineConfig({
  base: "/causal-sandbox/",
  build: {
    rollupOptions: {
      input: {
        main: "index.html",
        confounding: "confounding/index.html",
        colliderBias: "collider-bias/index.html",
        positivity: "positivity/index.html",
        tmleRobustness: "docs/tmle-robustness-preview.html",
      },
    },
  },
});
