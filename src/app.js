/**
 * Điều phối màn hình, đồng hồ và các thao tác của lượt chơi.
 *
 * View (không lưu xuống đĩa): welcome | briefing | playing | result | review
 * Status (lưu xuống đĩa, xem session.js): playing | result
 */

import { QUESTIONS, EVIDENCE, CASE } from './content.js';
import { icon } from './icons.js';
import * as S from './session.js';
import { isStorageHealthy } from './storage.js';
import { renderWelcome } from './screens/welcome.js';
import { renderBriefing } from './screens/briefing.js';
import { renderGame, renderTimeWarning } from './screens/game.js';
import { renderResult, renderReview } from './screens/result.js';
import { openDialog, closeDialog, isDialogOpen } from './screens/dialog.js';

const WARN_MS = 60_000;

const root = document.getElementById('app');
let view = 'welcome';
/** Ghi nhớ vị trí cuộn riêng cho từng tab bằng chứng trong lượt chơi. */
const evidenceScroll = new Map();
let tickHandle = null;
let lastClockText = '';
let submitDialogOpen = false;

/* ================================================================
   Khung ứng dụng
   ================================================================ */

function headerHTML() {
  const brand = `
    <div class="brand">
      <img src="assets/img/logo.svg" alt="" width="34" height="34">
      <span class="brand-name">DIGITAL <em>DETECTIVE</em></span>
    </div>`;

  if (view === 'playing') {
    const answered = S.answeredCount();
    const pct = Math.round((answered / QUESTIONS.length) * 100);
    return `
      <header class="app-header">
        ${brand}
        <span class="header-spacer"></span>
        <div class="hud">
          <p class="timer" id="timer" role="timer" aria-live="off">
            ${icon.clock(20)}<span id="timer-value">--:--</span>
            <span class="visually-hidden">thời gian còn lại</span>
          </p>
          <p class="progress-read">
            <span><b id="answered-count">${answered}</b>/${QUESTIONS.length} câu đã trả lời</span>
            <span class="progress-bar" aria-hidden="true"><span id="progress-fill" style="width:${pct}%"></span></span>
          </p>
        </div>
      </header>`;
  }

  const submitted = view === 'result' || view === 'review';
  return `
    <header class="app-header">
      ${brand}
      <span class="header-spacer"></span>
      <span class="file-tag${submitted ? ' is-submitted' : ''}">
        ${submitted ? 'ĐÃ NỘP BÀI' : CASE.fileLabel}
      </span>
    </header>`;
}

function screenHTML() {
  switch (view) {
    case 'briefing':
      return renderBriefing();
    case 'playing':
      return renderGame(S.getSession());
    case 'result':
      return renderResult(S.getResult());
    case 'review':
      return renderResult(S.getResult()) + renderReview(S.getResult());
    default:
      return renderWelcome();
  }
}

function storageBannerHTML() {
  if (isStorageHealthy() && S.lastWriteSucceeded()) return '';
  return `
    <p class="storage-alert" role="alert">
      ${icon.alert(20)}
      Máy này không lưu được tiến độ. Bài vẫn chơi được trong tab hiện tại nhưng sẽ mất nếu tải lại
      — mời người phụ trách xử lý trước khi nhận lượt mới.
    </p>`;
}

function render() {
  root.innerHTML = `
    <div class="shell">
      ${headerHTML()}
      <main class="app-main">
        ${storageBannerHTML()}
        ${screenHTML()}
      </main>
    </div>`;

  if (view === 'playing') {
    restoreEvidenceScroll();
    updateClock(true);
  }
  if (view === 'review') {
    root.querySelector('[data-act="close-review"]')?.focus();
  }
  if (view === 'result') {
    maybeCelebrate();
  }
}

/* ================================================================
   Đồng hồ
   ================================================================ */

function startTicking() {
  stopTicking();
  tickHandle = window.setInterval(onTick, 250);
}

function stopTicking() {
  if (tickHandle !== null) {
    window.clearInterval(tickHandle);
    tickHandle = null;
  }
}

function onTick() {
  if (view !== 'playing') {
    stopTicking();
    return;
  }
  // Kiểm tra hạn nộp ở mỗi nhịp: hết giờ thì tự nộp đúng một lần.
  if (S.enforceDeadline()) {
    if (submitDialogOpen) {
      closeDialog();
      submitDialogOpen = false;
    }
    goToResult();
    return;
  }
  updateClock(false);
}

function updateClock(force) {
  const el = document.getElementById('timer-value');
  if (!el) return;
  const ms = S.remainingMs();
  const text = S.formatClock(ms);
  if (force || text !== lastClockText) {
    el.textContent = text;
    lastClockText = text;
  }
  const timer = document.getElementById('timer');
  timer?.classList.toggle('is-warning', ms <= WARN_MS);

  const warnBox = document.getElementById('time-warning');
  if (warnBox) {
    const shouldWarn = ms <= WARN_MS;
    if (shouldWarn && warnBox.hidden) {
      warnBox.innerHTML = renderTimeWarning();
      warnBox.hidden = false;
    } else if (!shouldWarn && !warnBox.hidden) {
      warnBox.innerHTML = '';
      warnBox.hidden = true;
    }
  }
}

/** Mỗi lần app được nhìn lại (đổi tab, mở khóa máy, bfcache) đều kiểm tra hạn nộp. */
function recheckDeadline() {
  if (view !== 'playing') return;
  if (S.enforceDeadline()) {
    if (submitDialogOpen) {
      closeDialog();
      submitDialogOpen = false;
    }
    goToResult();
  } else {
    updateClock(true);
  }
}

/* ================================================================
   Chuyển màn
   ================================================================ */

function go(next) {
  view = next;
  render();
  if (next === 'playing') startTicking();
  else stopTicking();
}

function goToResult() {
  submitDialogOpen = false;
  go('result');
}

/* ================================================================
   Cập nhật tại chỗ khi chọn đáp án (không vẽ lại cả màn)
   ================================================================ */

function applyAnswerToDOM(questionId, option, saved) {
  document.querySelectorAll('.option').forEach((btn) => {
    if (btn.dataset.question !== questionId) return;
    const on = btn.dataset.option === option;
    btn.setAttribute('aria-checked', String(on));
    btn.tabIndex = on ? 0 : -1;
  });

  const navBtn = document.querySelector(`.q-nav-btn[data-goto="${questionId}"]`);
  if (navBtn) {
    navBtn.classList.add('is-answered');
    const num = navBtn.textContent.trim();
    const current = navBtn.getAttribute('aria-current') === 'true';
    navBtn.setAttribute('aria-label', `Câu ${num}, ${current ? 'câu đang xem' : 'đã trả lời'}`);
  }

  const answered = S.answeredCount();
  const countEl = document.getElementById('answered-count');
  if (countEl) countEl.textContent = String(answered);
  const fill = document.getElementById('progress-fill');
  if (fill) fill.style.width = `${Math.round((answered / QUESTIONS.length) * 100)}%`;

  const hint = document.getElementById('save-hint');
  if (hint) {
    hint.classList.toggle('is-error', !saved);
    // Chữ trung tính + icon lưu: KHÔNG dùng dấu tích xanh gây hiểu là đáp án đúng.
    hint.innerHTML = saved
      ? `${icon.save(18)}Đã lưu lựa chọn`
      : `${icon.alert(18)}Chưa lưu được — báo người phụ trách`;
  }
}

function restoreEvidenceScroll() {
  const card = document.getElementById('evidence-card');
  if (!card) return;
  const id = S.getSession()?.progress.activeEvidenceId;
  card.scrollTop = evidenceScroll.get(id) || 0;
}

function rememberEvidenceScroll() {
  const card = document.getElementById('evidence-card');
  if (!card) return;
  const id = S.getSession()?.progress.activeEvidenceId;
  if (id) evidenceScroll.set(id, card.scrollTop);
}

/* ================================================================
   Hành động
   ================================================================ */

function selectAnswer(questionId, option) {
  const res = S.setAnswer(questionId, option);
  if (res.expired) {
    goToResult();
    return;
  }
  if (!res.accepted) return;
  applyAnswerToDOM(questionId, option, res.saved);
}

/**
 * Đổi câu đang xem. Màn được vẽ lại nên focus bị mất — `focusSelector` trả focus
 * về đúng nút người dùng vừa bấm để thao tác bàn phím không bị đứt mạch.
 */
function gotoQuestion(questionId, focusSelector) {
  rememberEvidenceScroll();
  S.setCurrentQuestion(questionId);
  render();
  const target = document.querySelector(focusSelector || `.q-nav-btn[data-goto="${questionId}"]`);
  // Ở câu 1 nút "Quay lại" bị vô hiệu, ở câu 8 không còn "Câu tiếp" — lùi về dãy 1–8.
  if (target && !target.disabled) target.focus();
  else document.querySelector(`.q-nav-btn[data-goto="${questionId}"]`)?.focus();
}

function stepQuestion(delta) {
  const s = S.getSession();
  const i = QUESTIONS.findIndex((q) => q.id === s.progress.currentQuestionId);
  const next = QUESTIONS[i + delta];
  if (next) gotoQuestion(next.id, delta < 0 ? '[data-act="prev"]' : '[data-act="next"]');
}

function selectEvidence(evidenceId) {
  rememberEvidenceScroll();
  S.setActiveEvidence(evidenceId);
  render();
  document.getElementById(`tab-${evidenceId}`)?.focus();
}

function askSubmit() {
  if (S.isLocked()) return;
  const blanks = S.unansweredCount();
  submitDialogOpen = true;
  openDialog({
    title: 'Nộp bài?',
    body:
      blanks > 0
        ? `Bạn còn ${blanks} câu chưa trả lời. Vẫn nộp bài?`
        : `Bạn đã trả lời đủ ${QUESTIONS.length} câu. Nộp bài và xem kết quả?`,
    cancelLabel: 'Quay lại',
    confirmLabel: 'Nộp bài',
    onCancel: () => {
      submitDialogOpen = false;
    },
    onConfirm: () => {
      submitDialogOpen = false;
      S.submit('manual');
      goToResult();
    }
  });
}

function askReset() {
  openDialog({
    title: 'Bắt đầu lượt mới?',
    body: 'Đã kiểm tra kết quả và sẵn sàng cho người tiếp theo?',
    cancelLabel: 'Hủy',
    confirmLabel: 'Bắt đầu lượt mới',
    onConfirm: () => {
      S.clear();
      evidenceScroll.clear();
      lastClockText = '';
      go('welcome');
    }
  });
}

function maybeCelebrate() {
  const result = S.getResult();
  if (!result || result.score !== result.total) return;
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

  const host = document.querySelector('.app-main');
  if (!host) return;
  const layer = document.createElement('div');
  layer.className = 'confetti';
  layer.setAttribute('aria-hidden', 'true');
  const colors = ['#F16A36', '#54D7E5', '#10243A', '#FBBF24'];
  for (let i = 0; i < 18; i += 1) {
    const piece = document.createElement('i');
    piece.style.left = `${6 + Math.random() * 88}%`;
    piece.style.background = colors[i % colors.length];
    piece.style.animationDelay = `${Math.random() * 350}ms`;
    layer.appendChild(piece);
  }
  host.appendChild(layer);
  window.setTimeout(() => layer.remove(), 2200);
}

/* ================================================================
   Nhấn giữ 1,5 giây để mở lượt mới
   ================================================================ */

const hold = { timer: null, btn: null };

function beginHold(btn) {
  if (hold.timer !== null) return;
  hold.btn = btn;
  btn.classList.add('is-holding');
  hold.timer = window.setTimeout(() => {
    endHold(false);
    askReset();
  }, 1500);
}

function endHold(cancelVisual = true) {
  if (hold.timer !== null) {
    window.clearTimeout(hold.timer);
    hold.timer = null;
  }
  if (hold.btn) {
    hold.btn.classList.remove('is-holding');
    if (cancelVisual) {
      // Đưa thanh tiến trình về 0 ngay, không chạy ngược.
      const fill = hold.btn.querySelector('.hold-fill');
      if (fill) {
        fill.style.transition = 'none';
        fill.style.width = '0';
        requestAnimationFrame(() => {
          fill.style.transition = '';
          fill.style.width = '';
        });
      }
    }
    hold.btn = null;
  }
}

/* ================================================================
   Gắn sự kiện (ủy quyền ở gốc)
   ================================================================ */

function bindEvents() {
  root.addEventListener('click', (e) => {
    const target = e.target instanceof Element ? e.target : null;
    if (!target) return;

    const option = target.closest('.option');
    if (option && !option.disabled) {
      selectAnswer(option.dataset.question, option.dataset.option);
      return;
    }

    const tab = target.closest('[data-evidence]');
    if (tab) {
      selectEvidence(tab.dataset.evidence);
      return;
    }

    const navBtn = target.closest('[data-goto]');
    if (navBtn) {
      gotoQuestion(navBtn.dataset.goto);
      return;
    }

    const act = target.closest('[data-act]')?.dataset.act;
    switch (act) {
      case 'start-briefing':
        go('briefing');
        break;
      case 'back-welcome':
        go('welcome');
        break;
      case 'start-playing':
        S.start();
        lastClockText = '';
        go('playing');
        break;
      case 'prev':
        stepQuestion(-1);
        break;
      case 'next':
        stepQuestion(1);
        break;
      case 'submit':
        askSubmit();
        break;
      case 'open-review':
        go('review');
        break;
      case 'close-review':
        go('result');
        break;
      default:
        break;
    }
  });

  /* --- Nhấn giữ: chuột / cảm ứng --- */
  root.addEventListener('pointerdown', (e) => {
    const btn = e.target instanceof Element ? e.target.closest('[data-act="hold-reset"]') : null;
    if (!btn) return;
    e.preventDefault();
    btn.focus();
    beginHold(btn);
  });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach((evt) =>
    root.addEventListener(evt, (e) => {
      if (e.target instanceof Element && e.target.closest('[data-act="hold-reset"]')) endHold();
    })
  );

  /* --- Nhấn giữ: bàn phím (thao tác tương đương) --- */
  root.addEventListener('keydown', (e) => {
    const btn = e.target instanceof Element ? e.target.closest('[data-act="hold-reset"]') : null;
    if (btn && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault(); // chặn click mặc định của button
      if (!e.repeat) beginHold(btn);
      return;
    }

    // Điều hướng bàn phím trong radiogroup đáp án
    if (view === 'playing' && e.target instanceof Element) {
      const opt = e.target.closest('.option');
      if (opt && ['ArrowDown', 'ArrowRight', 'ArrowUp', 'ArrowLeft'].includes(e.key)) {
        e.preventDefault();
        const all = [...document.querySelectorAll('.option')];
        const i = all.indexOf(opt);
        const dir = e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : -1;
        const nextEl = all[(i + dir + all.length) % all.length];
        nextEl.focus();
        selectAnswer(nextEl.dataset.question, nextEl.dataset.option);
        return;
      }

      // Mũi tên trái/phải trên dải tab bằng chứng
      const tab = e.target.closest('[data-evidence]');
      if (tab && ['ArrowRight', 'ArrowLeft'].includes(e.key)) {
        e.preventDefault();
        const i = EVIDENCE.findIndex((ev) => ev.id === tab.dataset.evidence);
        const dir = e.key === 'ArrowRight' ? 1 : -1;
        selectEvidence(EVIDENCE[(i + dir + EVIDENCE.length) % EVIDENCE.length].id);
      }
    }
  });
  root.addEventListener('keyup', (e) => {
    if (e.target instanceof Element && e.target.closest('[data-act="hold-reset"]')) endHold();
  });
  window.addEventListener('blur', () => endHold());

  /* --- Ghi nhớ vị trí cuộn của tab bằng chứng --- */
  root.addEventListener(
    'scroll',
    (e) => {
      if (e.target instanceof Element && e.target.id === 'evidence-card') rememberEvidenceScroll();
    },
    true
  );

  /* --- Quay lại app: kiểm tra hạn nộp ngay --- */
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) recheckDeadline();
  });
  window.addEventListener('focus', recheckDeadline);
  window.addEventListener('pageshow', recheckDeadline);
  window.addEventListener('orientationchange', () => window.setTimeout(recheckDeadline, 120));

  /* --- Chặn thoát nhầm khi đang làm bài --- */
  window.addEventListener('beforeunload', (e) => {
    if (view === 'playing') {
      e.preventDefault();
      e.returnValue = '';
    }
  });
}

/* ================================================================
   Khởi động
   ================================================================ */

function boot() {
  bindEvents();

  const r = S.restore();

  if (r.corrupt) {
    view = 'welcome';
    render();
    openDialog({
      title: 'Dữ liệu lượt chơi bị lỗi',
      body:
        'Không đọc được phiên đã lưu trên máy này (dữ liệu hỏng hoặc thuộc bản đề cũ). ' +
        'Xác nhận xóa phiên lỗi để bắt đầu lại từ màn chào mừng.',
      confirmLabel: 'Xóa phiên lỗi và về đầu',
      dismissible: false,
      onConfirm: () => {
        S.clear();
        go('welcome');
      }
    });
    return;
  }

  if (r.restored) {
    const s = S.getSession();
    view = s.status === S.STATUS.RESULT ? 'result' : 'playing';
  } else {
    view = 'welcome';
  }

  render();
  if (view === 'playing') startTicking();
}

boot();

// Chỉ dùng cho kịch bản nghiệm thu trong README — không phải API của app.
window.__dd = { session: S, getView: () => view, isDialogOpen };
