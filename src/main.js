import "./style.css";

if (new URLSearchParams(location.search).has("sandbox")) {
  await import("./sandbox.js");
} else {
  await import("./lessons.js");
}
