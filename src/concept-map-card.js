import { mapPreview } from "./concept-map-art.js";
import { campaignHref } from "./events.js";
import { conceptMap } from "./lesson-catalog.js";
import "./concept-map-card.css";

export function conceptMapCard() {
  return `<a class="concept-map-card" href="${campaignHref(`${import.meta.env.BASE_URL}${conceptMap.href}`)}" aria-label="See the big picture: explore the concept map">
    <div><span class="map-kicker">A map before the journey</span><h2>See the big picture.</h2><p>Four questions connect the whole course. Discover where each idea belongs.</p><span class="map-card-action">Explore the concept map <span aria-hidden="true">↗</span></span></div>
    ${mapPreview()}
  </a>`;
}
