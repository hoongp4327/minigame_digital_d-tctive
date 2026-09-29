/**
 * Hiệu ứng trang trí còn lại sau khi bỏ lớp "mưa mã".
 * Toàn bộ đều không bắt buộc: gỡ file này thì app vẫn chạy đủ chức năng.
 */

export const prefersReducedMotion = () =>
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

/** Hàm dọn dẹp rỗng, dùng khi hiệu ứng bị tắt. */
const noop = () => {};

/**
 * Đếm điểm từ 0 lên `to` khi vào màn kết quả, mỗi nhịp lật một cái
 * (phần lật do CSS đảm nhiệm qua lớp `is-ticking`).
 *
 * @param {HTMLElement} el phần tử chứa con số
 * @param {number} to điểm cuối
 * @param {number} total tổng số câu
 * @returns {() => void} hàm dừng
 */
export function countUpScore(el, to, total) {
  if (!el) return noop;
  if (prefersReducedMotion() || to === 0) {
    el.textContent = `${to}/${total}`;
    return noop;
  }

  let value = 0;
  el.textContent = `0/${total}`;
  const stepMs = Math.max(90, Math.min(220, 900 / Math.max(to, 1)));
  const id = window.setInterval(() => {
    value += 1;
    el.textContent = `${value}/${total}`;
    el.classList.remove('is-ticking');
    // Ép trình duyệt chạy lại animation cho từng nhịp đếm.
    void el.offsetWidth;
    el.classList.add('is-ticking');
    if (value >= to) {
      window.clearInterval(id);
      window.setTimeout(() => el.classList.remove('is-ticking'), 360);
    }
  }, stepMs);

  return () => window.clearInterval(id);
}
