import { CASE } from '../content.js';
import { icon } from '../icons.js';

const chipIcons = [icon.doc, icon.question, icon.clock];

export function renderWelcome() {
  const [line1, line2, line3] = CASE.title;
  return `
    <section class="screen welcome" aria-labelledby="welcome-title">
      <div class="welcome-copy">
        <h1 class="hero-title" id="welcome-title">
          <span>${line1}</span>
          <span class="accent">${line2}</span>
          <span class="accent">${line3}</span>
        </h1>
        <p class="hero-tagline">${CASE.tagline}</p>
        <ul class="chip-row">
          ${CASE.chips
            .map((c, i) => `<li class="chip">${chipIcons[i](20)}${c}</li>`)
            .join('')}
        </ul>
        <div>
          <button type="button" class="btn btn-primary btn-lg" data-act="start-briefing">
            ${CASE.cta}${icon.arrowRight(22)}
          </button>
        </div>
        <p class="hero-note">${CASE.note}</p>
      </div>
      <div class="welcome-art paper-tint" aria-hidden="true">
        <img src="assets/img/hero.svg" alt="" width="620" height="560">
      </div>
    </section>`;
}
