import { defineConfig } from "vite";

export default defineConfig({
  base: "/causal-sandbox/",
  build: {
    rollupOptions: {
      input: {
        main: "index.html",
        tmleRobustness: "docs/tmle-robustness-preview.html",
      },
    },
  },
});
