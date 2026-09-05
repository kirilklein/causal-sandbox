import "./style.css";
import { setupTheme } from "./theme.js";

setupTheme();

if (new URLSearchParams(location.search).has("sandbox")) {
  await import("./sandbox.js");
} else {
  await import("./lessons.js");
}
