/**
 * Đo xem cả 5 màn có vừa khung nhìn hiện tại không.
 *
 * Dán vào console (hoặc chạy qua công cụ tự động) khi đang mở app. Trả về,
 * với từng màn, danh sách phần tử bị cắt: nằm ngoài khung nhìn, hoặc bị
 * vùng cuộn/overflow của cha che mất một phần.
 *
 * Xoá sạch phiên chơi hiện tại trước khi đo.
 */
(async () => {
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const q = (s) => document.querySelector(s);

  // Phần tử bị che nếu nó thò ra ngoài khung nhìn hoặc ngoài bất kỳ cha
  // nào có overflow khác "visible".
  function clipped(el) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) return 'khong hien';
    if (r.top < -1 || r.bottom > innerHeight + 1 || r.left < -1 || r.right > innerWidth + 1) {
      return 'ngoai khung nhin';
    }
    for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
      const cs = getComputedStyle(p);
      if (cs.overflowY === 'visible' && cs.overflowX === 'visible') continue;
      const pr = p.getBoundingClientRect();
      if (r.top < pr.top - 1 || r.bottom > pr.bottom + 1) {
        return 'bi cat boi .' + (p.className || p.tagName).toString().split(' ')[0];
      }
    }
    return null;
  }

  function report(name, selectors) {
    const bad = [];
    for (const s of selectors) {
      const els = document.querySelectorAll(s);
      if (!els.length) { bad.push(s + ': khong tim thay'); continue; }
      els.forEach((el, i) => {
        const why = clipped(el);
        if (why) bad.push(s + (els.length > 1 ? '#' + i : '') + ': ' + why);
      });
    }
    const pageScroll = document.documentElement.scrollHeight > innerHeight + 1;
    return { man: name, cuonTrang: pageScroll, loi: bad };
  }

  localStorage.clear();
  window.__dd.session.clear?.();
  const out = [];

  // Về màn chào mừng bằng cách tải lại trạng thái sạch
  if (window.__dd.getView() !== 'welcome') { location.reload(); return 'dang tai lai, chay lai'; }
  await wait(500);
  out.push(report('welcome', ['.hero-title', '.hero-tagline', '.chip', '[data-act="start-briefing"]', '.hero-note']));

  q('[data-act="start-briefing"]').click(); await wait(700);
  out.push(report('briefing', ['#briefing-title', '.note-paper', '.mission', '.timer-note', '[data-act="start-playing"]', '[data-act="back-welcome"]', '.back-row .footnote']));

  q('[data-act="start-playing"]').click(); await wait(700);
  out.push(report('playing', ['.pane-title', '.evidence-tab', '.evidence-img', '.q-label', '.q-prompt', '.option', '.q-nav-btn', '[data-act="prev"]', '[data-act="next"]', '[data-act="submit"]', '#timer']));

  // Nộp bằng đường HẾT GIỜ: màn kết quả có thêm dòng "Đã hết giờ", là
  // trường hợp cao nhất cần vừa khung.
  for (let i = 1; i <= 8; i++) window.__dd.session.setAnswer('q' + i, 'A');
  window.__dd.session.getSession().deadlineAt = Date.now() - 1;
  await wait(2500);
  out.push(report('result', ['.result-heading', '.timeout-note', '.score-card', '.score-value', '.staff-banner', '[data-act="open-review"]', '.staff-zone-label', '.hold-btn', '#hold-hint']));

  q('[data-act="open-review"]').click(); await wait(600);
  out.push(report('review', ['[data-act="close-review"]', '#review-title', '.review-body']));
  q('[data-act="close-review"]').click();

  return { khung: innerWidth + 'x' + innerHeight, ketQua: out };
})();
