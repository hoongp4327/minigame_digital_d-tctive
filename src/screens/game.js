import { EVIDENCE, QUESTIONS } from '../content.js';
import { icon } from '../icons.js';

export function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* ---------------- Bằng chứng ---------------- */

function renderBlock(block) {
  switch (block.type) {
    case 'lead':
      return `<p class="ev-lead">${esc(block.text)}</p>`;

    case 'profile':
      return `
        <div class="ev-profile">
          <span class="ev-avatar" aria-hidden="true">${icon.users(26)}</span>
          <span>
            <span class="ev-profile-name">${esc(block.displayName)}</span><br>
            <span class="ev-profile-handle">${esc(block.handle)}</span><br>
            <span class="ev-profile-meta">${esc(block.meta)}</span>
          </span>
        </div>`;

    case 'message':
      return `
        <div class="ev-message">
          ${esc(block.text)}
          <span class="ev-typing" aria-hidden="true"><i></i><i></i><i></i></span>
        </div>`;

    case 'list':
      return `<ul class="ev-list">${block.items.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>`;

    case 'log':
      return `<ul class="ev-log">${block.items
        .map((e) => `<li><time>${esc(e.time)}</time><span>${esc(e.text)}</span></li>`)
        .join('')}</ul>`;

    default:
      return '';
  }
}

function renderEvidencePane(activeId) {
  const active = EVIDENCE.find((e) => e.id === activeId) || EVIDENCE[0];
  return `
    <div class="evidence-pane">
      <h2 class="pane-title">Bằng chứng</h2>
      <div class="evidence-tabs" role="tablist" aria-label="Bốn bằng chứng">
        ${EVIDENCE.map(
          (e) => `
          <button type="button" class="evidence-tab" role="tab"
                  id="tab-${e.id}" data-evidence="${e.id}"
                  aria-selected="${e.id === active.id}"
                  aria-controls="evidence-card"
                  tabindex="${e.id === active.id ? '0' : '-1'}">
            ${esc(e.tabLabel)}
          </button>`
        ).join('')}
      </div>
      <div class="evidence-card" id="evidence-card" role="tabpanel"
           aria-labelledby="tab-${active.id}" tabindex="0">
        <h3 class="evidence-card-title">${esc(active.title)}</h3>
        ${active.blocks.map(renderBlock).join('')}
      </div>
    </div>`;
}

/* ---------------- Câu hỏi ---------------- */

function renderQuestionPane(session) {
  const answers = session.progress.answers;
  const index = Math.max(
    0,
    QUESTIONS.findIndex((q) => q.id === session.progress.currentQuestionId)
  );
  const q = QUESTIONS[index];
  const chosen = answers[q.id] || null;
  const isFirst = index === 0;
  const isLast = index === QUESTIONS.length - 1;

  return `
    <div class="question-pane">
      <p class="q-label" id="q-label">Câu ${index + 1} / ${QUESTIONS.length}</p>
      <h2 class="q-prompt" id="q-prompt">${esc(q.prompt)}</h2>

      <div class="options" role="radiogroup" aria-labelledby="q-prompt" id="options">
        ${['A', 'B', 'C']
          .map(
            (key) => `
          <button type="button" class="option" role="radio"
                  data-option="${key}" data-question="${q.id}"
                  aria-checked="${chosen === key}"
                  tabindex="${chosen === key || (!chosen && key === 'A') ? '0' : '-1'}">
            <span class="option-radio" aria-hidden="true"></span>
            <span class="option-key" aria-hidden="true">${key}.</span>
            <span class="option-text">${esc(q.options[key])}</span>
          </button>`
          )
          .join('')}
      </div>

      <p class="save-hint" id="save-hint" role="status" aria-live="polite"></p>

      <div class="q-nav" role="group" aria-label="Chuyển nhanh giữa các câu">
        ${QUESTIONS.map((item, i) => {
          const answered = !!answers[item.id];
          const current = item.id === q.id;
          const state = current
            ? 'câu đang xem'
            : answered
              ? 'đã trả lời'
              : 'chưa trả lời';
          return `<button type="button" class="q-nav-btn${answered ? ' is-answered' : ''}${
            current ? ' is-current' : ''
          }" data-goto="${item.id}" aria-current="${current ? 'true' : 'false'}"
                  aria-label="Câu ${i + 1}, ${state}">${i + 1}</button>`;
        }).join('')}
      </div>

      <div class="action-bar">
        <button type="button" class="btn btn-secondary" data-act="prev" ${isFirst ? 'disabled' : ''}>
          ${icon.arrowLeft(20)}Quay lại
        </button>
        <span class="spacer"></span>
        ${
          isLast
            ? ''
            : `<button type="button" class="btn btn-primary" data-act="next">Câu tiếp${icon.arrowRight(20)}</button>`
        }
        <button type="button" class="btn ${isLast ? 'btn-primary' : 'btn-secondary'}" data-act="submit">
          ${icon.flag(20)}Nộp bài
        </button>
      </div>

      <div id="time-warning" hidden></div>
    </div>`;
}

export function renderGame(session) {
  return `
    <section class="screen game" aria-label="Màn điều tra">
      ${renderEvidencePane(session.progress.activeEvidenceId)}
      ${renderQuestionPane(session)}
    </section>`;
}

export function renderTimeWarning() {
  return `<p class="time-warning">${icon.alert(20)}Còn dưới 1 phút — hãy hoàn tất phần trả lời.</p>`;
}

export { renderEvidencePane, renderQuestionPane };
