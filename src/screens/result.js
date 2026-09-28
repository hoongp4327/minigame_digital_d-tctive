import { QUESTIONS } from '../content.js';
import { icon } from '../icons.js';
import { esc } from './game.js';

export function renderResult(result) {
  const perfect = result.score === result.total;
  const heading = perfect ? 'Hoàn thành xuất sắc!' : 'Đã hoàn thành điều tra!';
  const timedOut = result.submissionReason === 'timeout';

  return `
    <section class="screen result" aria-labelledby="result-heading">
      <div class="result-main">
        <h1 class="result-heading" id="result-heading">${heading}</h1>

        ${
          timedOut
            ? `<p class="timeout-note">${icon.alert(20)}Đã hết giờ — bài được nộp tự động</p>`
            : ''
        }

        <div class="score-card">
          <p class="score-value" aria-hidden="true">${result.score}/${result.total}</p>
          <p class="score-label">Câu trả lời đúng</p>
          <span class="visually-hidden">Bạn trả lời đúng ${result.score} trên ${result.total} câu.</span>
        </div>

        <p class="staff-banner">${icon.users(24)}Mời người phụ trách kiểm tra kết quả.</p>

        <div>
          <button type="button" class="btn btn-secondary" data-act="open-review">
            ${icon.doc(20)}Xem lời giải
          </button>
        </div>

        <div class="staff-zone">
          <p class="staff-zone-label">Dành cho người phụ trách</p>
          <button type="button" class="btn btn-secondary hold-btn" data-act="hold-reset"
                  aria-describedby="hold-hint">
            <span class="hold-fill" aria-hidden="true"></span>
            <span>${icon.rotate(20)}Giữ để bắt đầu lượt mới</span>
          </button>
          <p class="footnote" id="hold-hint" style="margin-top:var(--s1)">
            Nhấn giữ 1,5 giây — hoặc giữ phím Enter / Space khi nút đang được chọn.
            Điểm được giữ nguyên khi xem lời giải.
          </p>
        </div>
      </div>

      <div class="result-art paper-tint" aria-hidden="true">
        <img src="assets/img/result-props.svg" alt="" width="420" height="340">
      </div>
    </section>`;
}

export function renderReview(result) {
  return `
    <div class="review-panel" role="dialog" aria-modal="true" aria-labelledby="review-title">
      <div class="review-head">
        <button type="button" class="btn btn-secondary" data-act="close-review">
          ${icon.arrowLeft(20)}Về kết quả
        </button>
        <h2 id="review-title">Lời giải chi tiết</h2>
        <span style="flex:1"></span>
        <span class="file-tag" style="border-color:var(--border-strong);color:var(--navy)">
          ${result.score}/${result.total} câu đúng
        </span>
      </div>
      <div class="review-body">
        ${QUESTIONS.map((q, i) => {
          const given = result.submittedAnswers[q.id] || null;
          const correct = given === q.correctOption;
          const badge = !given
            ? '<span class="review-badge blank">Chưa trả lời</span>'
            : correct
              ? '<span class="review-badge ok">Đúng</span>'
              : '<span class="review-badge no">Chưa đúng</span>';
          const givenRow = !given
            ? '<div class="review-row is-blank"><dt>Bạn đã chọn</dt><dd>Chưa trả lời</dd></div>'
            : `<div class="review-row ${correct ? 'is-correct' : 'is-wrong'}">
                 <dt>Bạn đã chọn</dt><dd>${given}. ${esc(q.options[given])}</dd>
               </div>`;
          return `
            <article class="review-item">
              <header class="review-item-head">
                <span class="review-num">Câu ${i + 1}</span>
                <h3 class="review-q">${esc(q.prompt)}</h3>
                ${badge}
              </header>
              <dl class="review-rows">
                ${givenRow}
                <div class="review-row is-correct">
                  <dt>Đáp án đúng</dt>
                  <dd>${q.correctOption}. ${esc(q.options[q.correctOption])}</dd>
                </div>
              </dl>
              <p class="review-explain">${esc(q.explanation)}</p>
            </article>`;
        }).join('')}
      </div>
    </div>`;
}
