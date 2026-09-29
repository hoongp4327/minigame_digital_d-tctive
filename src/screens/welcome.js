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
            .map(
              (c, i) => `
            <li class="chip" style="--i:${i}">
              <span class="chip-icon tone-${c.tone}" aria-hidden="true">${chipIcons[i](22)}</span>
              <span class="chip-text">
                <b>${c.value}</b>
                <small>${c.label}</small>
              </span>
            </li>`
            )
            .join('')}
        </ul>

        <div>
          <button type="button" class="btn btn-primary btn-lg btn-cta" data-act="start-briefing">
            ${CASE.cta}
            <span class="btn-arrow" aria-hidden="true">${icon.arrowRight(22)}</span>
          </button>
        </div>

        <p class="hero-note">${icon.lock(17)}${CASE.note}</p>
      </div>
    </section>`;
}
