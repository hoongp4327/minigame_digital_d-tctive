/**
 * Hộp thoại xác nhận dùng chung (nộp bài, reset, phiên lỗi).
 * Đồng hồ KHÔNG dừng khi hộp thoại mở — phía gọi tự đóng bằng close()
 * nếu hết giờ trong lúc chờ.
 */

let current = null;

/**
 * @param {{title:string, body:string, cancelLabel?:string, confirmLabel:string,
 *          confirmKind?:'primary'|'secondary', onConfirm:Function, onCancel?:Function,
 *          dismissible?:boolean}} opts
 * @returns {{close:Function}}
 */
export function openDialog(opts) {
  closeDialog();

  const overlay = document.createElement('div');
  overlay.className = 'overlay';
  overlay.innerHTML = `
    <div class="dialog" role="alertdialog" aria-modal="true"
         aria-labelledby="dlg-title" aria-describedby="dlg-body">
      <h2 id="dlg-title"></h2>
      <p id="dlg-body"></p>
      <div class="dialog-actions">
        ${opts.cancelLabel ? '<button type="button" class="btn btn-secondary" data-act="cancel"></button>' : ''}
        <button type="button" class="btn btn-${opts.confirmKind || 'primary'}" data-act="confirm"></button>
      </div>
    </div>`;

  // textContent: nội dung là dữ liệu, không phải markup.
  overlay.querySelector('#dlg-title').textContent = opts.title;
  overlay.querySelector('#dlg-body').textContent = opts.body;
  const confirmBtn = overlay.querySelector('[data-act="confirm"]');
  confirmBtn.textContent = opts.confirmLabel;
  const cancelBtn = overlay.querySelector('[data-act="cancel"]');
  if (cancelBtn) cancelBtn.textContent = opts.cancelLabel;

  const lastFocused = document.activeElement;

  const finish = (fn) => {
    closeDialog();
    if (typeof fn === 'function') fn();
  };

  confirmBtn.addEventListener('click', () => finish(opts.onConfirm));
  cancelBtn?.addEventListener('click', () => finish(opts.onCancel));

  overlay.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && opts.dismissible !== false && cancelBtn) {
      e.preventDefault();
      finish(opts.onCancel);
      return;
    }
    if (e.key !== 'Tab') return;
    // Giữ focus trong hộp thoại
    const items = [...overlay.querySelectorAll('button')];
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });

  document.body.appendChild(overlay);
  (cancelBtn || confirmBtn).focus();

  current = {
    el: overlay,
    restoreFocus: () => {
      if (lastFocused instanceof HTMLElement && document.contains(lastFocused)) lastFocused.focus();
    }
  };
  return { close: closeDialog };
}

export function closeDialog() {
  if (!current) return;
  const { el, restoreFocus } = current;
  current = null;
  el.remove();
  restoreFocus();
}

export function isDialogOpen() {
  return current !== null;
}
