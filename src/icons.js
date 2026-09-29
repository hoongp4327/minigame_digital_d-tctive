/**
 * Bộ icon dùng chung — cùng một nét (stroke 1.8, linecap round, viewBox 24).
 * Inline SVG để nhận currentColor và không tốn request mạng.
 */

const wrap = (body, size = 24) =>
  `<svg class="icon" viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" ` +
  `stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" ` +
  `aria-hidden="true" focusable="false">${body}</svg>`;

export const icon = {
  doc: (s) =>
    wrap('<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M9 13h6M9 17h4"/>', s),
  question: (s) =>
    wrap('<circle cx="12" cy="12" r="9"/><path d="M9.6 9.2a2.5 2.5 0 1 1 3.2 2.9c-.6.2-.8.7-.8 1.3v.4"/><path d="M12 17.2h.01"/>', s),
  send: (s) => wrap('<path d="M21 3 10.5 13.5"/><path d="M21 3l-6.8 18-3.7-7.5L3 9.8z"/>', s),
  clock: (s) => wrap('<circle cx="12" cy="12" r="9"/><path d="M12 7.2V12l3.2 1.9"/>', s),
  arrowRight: (s) => wrap('<path d="M4.5 12h14"/><path d="M13 6.5 18.5 12 13 17.5"/>', s),
  arrowLeft: (s) => wrap('<path d="M19.5 12h-14"/><path d="M11 6.5 5.5 12 11 17.5"/>', s),
  flag: (s) => wrap('<path d="M5 21V4"/><path d="M5 5h10.5l-1.4 3.5L15.5 12H5z"/>', s),
  users: (s) =>
    wrap('<circle cx="9" cy="8" r="3.2"/><path d="M3.2 19a5.8 5.8 0 0 1 11.6 0"/><path d="M16.2 5.4a3.2 3.2 0 0 1 0 5.2"/><path d="M17.6 13.6A5.8 5.8 0 0 1 20.8 19"/>', s),
  rotate: (s) =>
    wrap('<path d="M20 5.5v5h-5"/><path d="M19.4 10.5a7.8 7.8 0 1 0-.7 5.6"/>', s),
  save: (s) =>
    wrap('<path d="M5 4h11l3 3v13H5z"/><path d="M8.5 4v5h7V4"/><rect x="8" y="13" width="8" height="7"/>', s),
  alert: (s) => wrap('<path d="M12 4.2 21 19.5H3z"/><path d="M12 10v4"/><path d="M12 17h.01"/>', s),
  lock: (s) =>
    wrap(
      '<rect x="4.5" y="10.5" width="15" height="10" rx="2.5"/>' +
        '<path d="M8 10.5V7.8a4 4 0 0 1 8 0v2.7"/>',
      s
    ),
  folder: (s) =>
    wrap(
      '<path d="M3.5 7.6a2 2 0 0 1 2-2h3.1l2 2.4h7.9a2 2 0 0 1 2 2v8.4a2 2 0 0 1-2 2H5.5a2 2 0 0 1-2-2z"/>',
      s
    ),
  clipboard: (s) =>
    wrap(
      '<path d="M9 4.5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-12a2 2 0 0 0-2-2h-2"/>' +
        '<rect x="9" y="2.8" width="6" height="3.4" rx="1.2"/>' +
        '<path d="M8.6 11h6.8"/><path d="M8.6 15h4.6"/>',
      s
    ),
  chevron: (s) => wrap('<path d="M9.5 5.5 16 12l-6.5 6.5"/>', s)
};
