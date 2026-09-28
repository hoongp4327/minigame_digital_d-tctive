import { CASE } from '../content.js';
import { icon } from '../icons.js';

const missionIcons = [icon.doc, icon.question, icon.send];

export function renderBriefing() {
  return `
    <section class="screen briefing" aria-labelledby="briefing-title">
      <div class="briefing-left">
        <h1 class="screen-title" id="briefing-title">${CASE.briefingHeading}</h1>
        <div class="note-wrap">
          <span class="paper-clip" aria-hidden="true"></span>
          <div class="note-paper">${CASE.story}</div>
        </div>
        <div class="briefing-props" aria-hidden="true">
          <img src="assets/img/briefing-props.svg" alt="" width="420" height="200">
        </div>
      </div>

      <div class="briefing-right">
        <div>
          <h2 class="screen-title">${CASE.missionsHeading}</h2>
          <ol class="mission-list">
            ${CASE.missions
              .map(
                (m, i) => `
              <li class="mission">
                <span class="mission-badge" aria-hidden="true">${missionIcons[i](24)}</span>
                <span><span class="mission-index">${i + 1}.</span> ${m}</span>
              </li>`
              )
              .join('')}
          </ol>
        </div>

        <p class="timer-note">${icon.clock(20)}${CASE.timerNote}</p>

        <div>
          <button type="button" class="btn btn-primary btn-lg" style="width:100%"
                  data-act="start-playing">
            ${CASE.briefingCta}${icon.arrowRight(22)}
          </button>
        </div>

        <div class="back-row" style="display:flex;align-items:center;justify-content:space-between;gap:var(--s2)">
          <button type="button" class="btn btn-ghost" data-act="back-welcome">
            ${icon.arrowLeft(20)}Quay lại
          </button>
          <p class="footnote">${CASE.disclaimer}</p>
        </div>
      </div>
    </section>`;
}
