/**
 * Lớp bọc localStorage với namespace riêng của app.
 *
 * Hai tình huống hỏng được xử lý tường minh (không im lặng làm mất bài):
 *  - Không ghi được (Safari private mode, hết quota): trả về ok:false để
 *    UI hiện cảnh báo và KHÔNG hiện "Đã lưu lựa chọn".
 *  - Dữ liệu lỗi / sai schema: trả về status 'corrupt' để UI mời người
 *    phụ trách xác nhận xóa phiên lỗi.
 */

const NS = 'digital-detective:v1';
export const SESSION_KEY = `${NS}:session`;

/** Bộ nhớ dự phòng khi localStorage không dùng được — giữ được lượt đang chơi
 *  trong lúc tab còn mở, nhưng không sống qua reload. */
const memoryFallback = new Map();

let storageHealthy = null;

/** Kiểm tra một lần xem localStorage có ghi được không. */
function probeStorage() {
  if (storageHealthy !== null) return storageHealthy;
  try {
    const probe = `${NS}:probe`;
    window.localStorage.setItem(probe, '1');
    window.localStorage.removeItem(probe);
    storageHealthy = true;
  } catch (err) {
    console.warn('[storage] localStorage không dùng được:', err);
    storageHealthy = false;
  }
  return storageHealthy;
}

export function isStorageHealthy() {
  return probeStorage();
}

/**
 * @returns {{ok: boolean}} ok=false nghĩa là chỉ ghi được vào bộ nhớ tạm.
 */
export function writeJSON(key, value) {
  const text = JSON.stringify(value);
  memoryFallback.set(key, text);
  if (!probeStorage()) return { ok: false };
  try {
    window.localStorage.setItem(key, text);
    return { ok: true };
  } catch (err) {
    console.warn('[storage] ghi thất bại:', err);
    storageHealthy = false;
    return { ok: false };
  }
}

/**
 * @returns {{status:'empty'|'ok'|'corrupt', value?:any}}
 */
export function readJSON(key) {
  let text = null;
  if (probeStorage()) {
    try {
      text = window.localStorage.getItem(key);
    } catch (err) {
      console.warn('[storage] đọc thất bại:', err);
    }
  }
  if (text === null && memoryFallback.has(key)) text = memoryFallback.get(key);
  if (text === null || text === undefined) return { status: 'empty' };
  try {
    const value = JSON.parse(text);
    if (value === null || typeof value !== 'object') return { status: 'corrupt' };
    return { status: 'ok', value };
  } catch (err) {
    console.warn('[storage] dữ liệu hỏng:', err);
    return { status: 'corrupt' };
  }
}

export function removeKey(key) {
  memoryFallback.delete(key);
  if (!probeStorage()) return;
  try {
    window.localStorage.removeItem(key);
  } catch (err) {
    console.warn('[storage] xóa thất bại:', err);
  }
}
