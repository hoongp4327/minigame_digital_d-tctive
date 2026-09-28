/**
 * Nguồn state duy nhất cho một lượt chơi.
 *
 * Nguyên tắc thời gian: deadline tuyệt đối.
 *   deadlineAt = startedAt + durationSeconds * 1000
 *   remaining  = max(0, deadlineAt - Date.now())
 * Không có biến đếm ngược nào là nguồn dữ liệu. Chuyển tab, khóa máy,
 * reload hay xoay màn hình đều không làm dừng giờ.
 */

import { CONTENT_VERSION, CASE_ID, DURATION_SECONDS, QUESTIONS } from './content.js';
import { SESSION_KEY, readJSON, writeJSON, removeKey } from './storage.js';

export const SCHEMA_VERSION = 1;

/** Trạng thái phiên được lưu xuống đĩa. welcome/briefing/review là view, không lưu. */
export const STATUS = { PLAYING: 'playing', RESULT: 'result' };

const listeners = new Set();

/** @type {object|null} */
let session = null;
/** Cờ báo lần ghi gần nhất có thành công không — UI dùng để quyết định
 *  có được nói "Đã lưu lựa chọn" hay không. */
let lastWriteOk = true;

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function emit() {
  for (const fn of listeners) fn(session);
}

function newId() {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID();
  return `s-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function persist() {
  if (!session) return true;
  const res = writeJSON(SESSION_KEY, session);
  lastWriteOk = res.ok;
  return res.ok;
}

export function lastWriteSucceeded() {
  return lastWriteOk;
}

export function getSession() {
  return session;
}

export function hasSession() {
  return session !== null;
}

/* ------------------------------------------------------------------ *
 * Khởi tạo / khôi phục
 * ------------------------------------------------------------------ */

/**
 * Đọc phiên đã lưu (nếu có) và kiểm tra hạn nộp ngay lập tức.
 * @returns {{restored:boolean, corrupt:boolean, autoSubmitted:boolean}}
 */
export function restore() {
  const out = { restored: false, corrupt: false, autoSubmitted: false };
  const read = readJSON(SESSION_KEY);

  if (read.status === 'corrupt') {
    out.corrupt = true;
    return out;
  }
  if (read.status === 'empty') return out;

  const data = read.value;
  if (!isShapeValid(data)) {
    out.corrupt = true;
    return out;
  }
  // Bản build khác bộ đề: không chấm phiên cũ bằng đề mới.
  if (data.schemaVersion !== SCHEMA_VERSION || data.contentVersion !== CONTENT_VERSION) {
    out.corrupt = true;
    return out;
  }

  session = data;
  out.restored = true;

  // Kiểm tra deadline NGAY khi khôi phục: quá hạn thì tự nộp từ đáp án cuối đã lưu.
  if (session.status === STATUS.PLAYING && remainingMs() <= 0) {
    submit('timeout');
    out.autoSubmitted = true;
  }
  emit();
  return out;
}

function isShapeValid(d) {
  return (
    d &&
    typeof d === 'object' &&
    typeof d.sessionId === 'string' &&
    typeof d.startedAt === 'number' &&
    typeof d.deadlineAt === 'number' &&
    Number.isFinite(d.startedAt) &&
    Number.isFinite(d.deadlineAt) &&
    (d.status === STATUS.PLAYING || d.status === STATUS.RESULT) &&
    d.progress &&
    typeof d.progress === 'object' &&
    d.progress.answers &&
    typeof d.progress.answers === 'object'
  );
}

/** Tạo phiên mới 300 giây và lưu ngay. */
export function start() {
  const now = Date.now();
  session = {
    schemaVersion: SCHEMA_VERSION,
    contentVersion: CONTENT_VERSION,
    caseId: CASE_ID,
    sessionId: newId(),
    status: STATUS.PLAYING,
    startedAt: now,
    deadlineAt: now + DURATION_SECONDS * 1000,
    progress: {
      answers: {},
      currentQuestionId: QUESTIONS[0].id,
      activeEvidenceId: 'ev1'
    },
    result: null
  };
  persist();
  emit();
  return session;
}

/** Xóa sạch phiên — chỉ gọi từ thao tác reset của người phụ trách. */
export function clear() {
  session = null;
  removeKey(SESSION_KEY);
  emit();
}

/* ------------------------------------------------------------------ *
 * Đồng hồ
 * ------------------------------------------------------------------ */

export function remainingMs() {
  if (!session) return DURATION_SECONDS * 1000;
  return Math.max(0, session.deadlineAt - Date.now());
}

export function isExpired() {
  return !!session && remainingMs() <= 0;
}

export function formatClock(ms) {
  const total = Math.ceil(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/* ------------------------------------------------------------------ *
 * Tiến độ
 * ------------------------------------------------------------------ */

/**
 * Ghi nhận lựa chọn. Chạm lại đáp án đang chọn KHÔNG bỏ lựa chọn.
 * @returns {{accepted:boolean, saved:boolean, expired:boolean}}
 */
export function setAnswer(questionId, option) {
  if (!session || session.status !== STATUS.PLAYING) {
    return { accepted: false, saved: false, expired: false };
  }
  // Kiểm tra hạn nộp TRƯỚC mỗi thao tác chọn đáp án.
  if (remainingMs() <= 0) {
    submit('timeout');
    return { accepted: false, saved: false, expired: true };
  }
  session.progress.answers[questionId] = option;
  const saved = persist();
  emit();
  return { accepted: true, saved, expired: false };
}

export function setCurrentQuestion(questionId) {
  if (!session || session.status !== STATUS.PLAYING) return;
  session.progress.currentQuestionId = questionId;
  persist();
  emit();
}

export function setActiveEvidence(evidenceId) {
  if (!session) return;
  session.progress.activeEvidenceId = evidenceId;
  persist();
  emit();
}

export function answeredCount() {
  if (!session) return 0;
  return QUESTIONS.filter((q) => session.progress.answers[q.id]).length;
}

export function unansweredCount() {
  return QUESTIONS.length - answeredCount();
}

/* ------------------------------------------------------------------ *
 * Nộp bài và chấm
 * ------------------------------------------------------------------ */

/**
 * Hoàn tất phiên. Idempotent: một phiên chỉ chấm đúng một lần, dù vừa hết
 * giờ vừa bấm nộp hay bấm nhiều lần.
 * @param {'manual'|'timeout'} reason
 * @returns {object|null} result snapshot
 */
export function submit(reason) {
  if (!session) return null;
  if (session.status === STATUS.RESULT) return session.result; // đã chấm rồi

  const submittedAnswers = { ...session.progress.answers };
  let score = 0;
  for (const q of QUESTIONS) {
    if (submittedAnswers[q.id] === q.correctOption) score += 1;
  }

  session.result = {
    submittedAnswers,
    score,
    total: QUESTIONS.length,
    submittedAt: Date.now(),
    submissionReason: reason === 'timeout' ? 'timeout' : 'manual'
  };
  session.status = STATUS.RESULT;
  persist();
  emit();
  return session.result;
}

/** Tự nộp nếu đã quá hạn. Gọi từ tick đồng hồ và các điểm vào lại app. */
export function enforceDeadline() {
  if (session && session.status === STATUS.PLAYING && remainingMs() <= 0) {
    submit('timeout');
    return true;
  }
  return false;
}

export function getResult() {
  return session?.result ?? null;
}

export function isLocked() {
  return !session || session.status === STATUS.RESULT;
}
