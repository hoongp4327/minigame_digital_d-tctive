# Digital Detective — Vụ án tài khoản biến mất

Mini game điều tra an toàn số cho học sinh THCS tại gian hàng.
Mỗi thiết bị là một điểm chơi độc lập: nhận vụ án → đọc 4 bằng chứng → trả lời 8 câu
trong 5 phút → xem kết quả → người phụ trách kiểm tra rồi mở lượt mới.

Bản v1 là **frontend tĩnh thuần**: không backend, không tài khoản, không gọi API khi chơi.

---

## 1. Chạy tại chỗ

Cần Node.js (chỉ để chạy máy chủ tĩnh — dự án **không có bước build**, không có `node_modules`).

```bash
node tools/serve.js 4178
```

Mở `http://localhost:4178`.

Mở bằng `file://` sẽ **không** chạy: app dùng ES modules và service worker, cả hai đều cần HTTP.
Bất kỳ máy chủ tĩnh nào cũng dùng được (`npx serve`, `python -m http.server`, nginx, Netlify, …).

## 2. Build và deploy

Không có bước build. Nội dung thư mục là bản deploy.

```
index.html  manifest.webmanifest  sw.js  assets/  src/
```

Copy các mục trên lên bất kỳ static host **HTTPS** nào. Không cần deploy `tools/` (chỉ dùng để
chạy và nghiệm thu tại chỗ).

Khi phát hành bản mới, tăng `CACHE_VERSION` trong [`sw.js`](sw.js) để iPad tải lại đúng bản mới.

## 3. Sửa nội dung câu hỏi và bằng chứng

**Toàn bộ nội dung nằm trong một file duy nhất: [`src/content.js`](src/content.js).**
Không cần đụng tới CSS hay logic.

| Muốn sửa | Sửa ở |
|---|---|
| Câu hỏi, 3 đáp án, đáp án đúng, lời giải | `QUESTIONS[]` |
| Nội dung 4 thẻ bằng chứng | `EVIDENCE[]` |
| Tiêu đề, câu chuyện, nhiệm vụ, nhãn nút | `CASE` |
| Thời lượng làm bài | `DURATION_SECONDS` (mặc định 300) |

> **Bắt buộc:** mỗi lần đổi câu hỏi / đáp án / bằng chứng phải **tăng `CONTENT_VERSION`**.
> Phiên đang lưu trên máy với `contentVersion` cũ sẽ bị từ chối và app mời người phụ trách
> xóa phiên lỗi, thay vì chấm bài cũ bằng bộ đề mới.

Hai điểm nội dung dễ bị "sửa nhầm", đã ghi chú ngay trong file:

- Tên tài khoản giả mạo `@hocdu0ng.so_official` dùng **chữ số 0**, không phải chữ o.
- Mốc nhận OTP là **20:14** (đã hiệu chỉnh so với bản Word để khớp nhật ký 20:15).
  Phương án A của câu 6 vẫn là **19:48** — đây là đáp án nhiễu, cố ý giữ nguyên.

Khóa đáp án: `1A · 2B · 3B · 4A · 5C · 6B · 7A · 8C`.

## 4. Cấu trúc mã nguồn

```
index.html              khung trang, preload font/ảnh, đăng ký service worker
src/
  content.js            DỮ LIỆU: vụ án, 4 bằng chứng, 8 câu hỏi  ← sửa nội dung ở đây
  session.js            nguồn state duy nhất: đồng hồ, chấm điểm, nộp, khôi phục
  storage.js            localStorage có namespace + xử lý hỏng/không ghi được
  app.js                điều phối màn hình, sự kiện, vòng lặp đồng hồ
  effects.js            lớp hiệu ứng trang trí (mưa mã, nghiêng 3D, glitch…)
  icons.js              bộ icon inline dùng chung
  screens/
    welcome.js briefing.js game.js result.js   markup từng màn
    dialog.js                                  hộp thoại xác nhận dùng chung
assets/
  css/app.css           token màu/cỡ chữ/spacing + toàn bộ layout
  fonts.css fonts/      Be Vietnam Pro đóng gói sẵn (không phụ thuộc CDN)
  img/                  minh họa SVG: logo, hero, briefing, kết quả
sw.js                   cache app shell để reload được khi mất mạng
tools/
  serve.js              máy chủ tĩnh để chạy tại chỗ
  acceptance.html       bộ kiểm thử logic phiên chơi
```

Nguyên tắc đã áp dụng:

- **Dữ liệu tách khỏi giao diện** — `content.js` không biết gì về DOM.
- **Một nguồn state** — `session.js`; các màn chỉ đọc, không giữ bản sao `answers`.
- **Đồng hồ theo hạn tuyệt đối** — `deadlineAt = startedAt + 300000`, mỗi lần vẽ tính
  `remaining = max(0, deadlineAt − Date.now())`. Không có biến đếm ngược nào là nguồn dữ liệu,
  nên chuyển tab, khóa máy, reload hay xoay màn hình đều không làm dừng giờ.
- **Chấm đúng một lần** — `submit()` idempotent: vừa hết giờ vừa bấm nộp vẫn chỉ ra một kết quả.
- **Bằng chứng là ảnh** — bốn thẻ bằng chứng hiển thị bằng ảnh minh họa, kèm bản chữ
  ẩn cho trình đọc màn hình (xem 4.1). Chữ giao diện (đề bài, đáp án, nút) vẫn là HTML thật.

### 4.1 Ảnh và cách tối ưu

| File | Kích thước | Dung lượng | Dùng ở đâu |
|---|---|---|---|
| `background-main.jpg` | 1600×900 | 118 KB | Nền màn chào mừng |
| `background-2.jpg` | 1100×1096 | 141 KB | Hình minh họa màn nhận vụ án |
| `evidence-1..4.webp` | 1200×1200 | 129–147 KB | Bốn thẻ bằng chứng |
| `evidence-1..4.jpg` | 1200×1200 | 168–202 KB | Bản dự phòng khi máy không đọc được WebP |

Ảnh gốc gửi sang là PNG 2048×2048, mỗi tấm khoảng 6 MB (tổng 24 MB). Sau khi đổi cỡ
và nén lại bằng ffmpeg, **toàn bộ thư mục ảnh còn 1,6 MB**.

Muốn nén lại sau khi thay ảnh mới, chạy:

```bash
ffmpeg -i nguon.png -vf "scale=1200:-1:flags=lanczos" -c:v libwebp -quality 80 -compression_level 6 evidence-1.webp
ffmpeg -i nguon.png -vf "scale=1200:-1:flags=lanczos" -c:v mjpeg -q:v 6 -huffman optimal evidence-1.jpg
```

Vài điểm đã cân nhắc:

- **Vì sao có cả WebP lẫn JPEG.** Toàn bộ nội dung bằng chứng giờ nằm trong ảnh. Nếu chỉ
  dùng WebP mà máy chạy iPadOS cũ hơn 14 thì ảnh không hiện, và học sinh **không có gì để
  đọc mà làm bài**. `<picture>` tự chọn WebP khi máy đọc được, rơi về JPEG khi không.
- **Service worker chỉ tải sẵn bản WebP.** Máy đời mới (gần như toàn bộ) vừa nhẹ vừa chạy
  offline đầy đủ. Máy quá cũ sẽ tải JPEG qua mạng ở lần xem đầu rồi mới có bản offline —
  người phụ trách nên bấm thử cả 4 thẻ một lượt lúc cài máy.
- **Ảnh bằng chứng dùng `object-fit: contain`, không phải `cover`.** Trong ảnh có chữ học
  sinh phải đọc (tên tài khoản, mã OTP, mốc giờ); `cover` sẽ cắt mép và mất nội dung bài.
- **Mép trên hình màn nhận vụ án được làm mờ dần** (`mask-image`). Ảnh gốc vuông còn khung
  hiển thị nằm ngang nên khung cắt đổi theo cỡ máy; không có lớp mờ này thì ở 1024px ảnh
  bị cắt ngang tấm bảng ghim thành một đường thẳng rất gắt.
- **Ảnh nền màn chào mừng neo về mép phải** — ảnh 16:9 còn màn iPad 4:3, neo phải khiến
  phần bị cắt rơi vào khoảng trống bên trái, giữ nguyên cụm tang vật bên phải.

## 5. Nghiệm thu

### 5.1 Kiểm thử logic (tự động)

Mở `http://localhost:4178/tools/acceptance.html`.

**Kết quả lần chạy ngày 28/09/2026: 15/15 ca ĐẠT.**

| # | Ca kiểm tra | Kết quả |
|---|---|---|
| 1 | Trả lời đúng cả 8 câu → 8/8 | ĐẠT |
| 2 | Trả lời sai cả 8 câu → 0/8 | ĐẠT |
| 3 | Bỏ trống toàn bộ → 0/8, giữ dấu vết câu trống | ĐẠT |
| 4 | Chọn A rồi đổi sang B → chỉ giữ lựa chọn cuối | ĐẠT |
| 5 | Chạm lại đáp án đang chọn không bỏ lựa chọn | ĐẠT |
| 6 | Đổi câu và đổi bằng chứng không mất lựa chọn, chưa nộp thì chưa có lời giải | ĐẠT |
| 7 | Đồng hồ khởi tạo đúng 300 giây | ĐẠT |
| 8 | Hết 300 giây → tự nộp đúng một lần từ đáp án đã lưu | ĐẠT |
| 9 | Hết giờ thì không nhận lựa chọn mới | ĐẠT |
| 10 | Bấm Nộp bài nhiều lần chỉ tạo một kết quả | ĐẠT |
| 11 | Reload giữa lượt → khôi phục thời gian thật và đáp án | ĐẠT |
| 12 | Reload tại màn kết quả → điểm không đổi | ĐẠT |
| 13 | Dữ liệu hỏng → báo lỗi, không im lặng làm mất bài | ĐẠT |
| 14 | Phiên thuộc bộ đề cũ → không chấm bằng đề mới | ĐẠT |
| 15 | Reset → xóa phiên, về lượt trống, đồng hồ chưa chạy | ĐẠT |

### 5.2 Kiểm thử giao diện và tương tác (đã chạy trên Chromium)

| Ca kiểm tra | Kết quả |
|---|---|
| 1024×768 — 4 tab bằng chứng, cả 3 đáp án, dãy 1–8 và thanh nút đều nhìn thấy | ĐẠT |
| 1024×768 / 1180×820 / 1440×900 — không cuộn ngang, không cuộn dọc cả trang | ĐẠT |
| Thẻ bằng chứng dài (thẻ 2) chỉ cuộn trong vùng thẻ | ĐẠT |
| Câu 1 vô hiệu "Quay lại"; câu 8 không có "Câu tiếp", "Nộp bài" là CTA chính | ĐẠT |
| Nộp khi thiếu câu → hộp thoại ghi đúng số câu trống; Hủy vẫn tiếp tục bài | ĐẠT |
| Hết 300 giây khi hộp thoại đang mở → tự nộp một lần, đóng hộp thoại, vào kết quả | ĐẠT |
| Reload giữa lượt → về đúng câu, đúng tab, đúng đáp án, đồng hồ chạy tiếp | ĐẠT |
| Mở lời giải rồi quay lại → không sửa được bài, điểm giữ nguyên | ĐẠT |
| Nhấn giữ 1,5 giây (chuột/cảm ứng) → nhả sớm thì hủy, giữ đủ thì mở xác nhận | ĐẠT |
| Giữ phím Enter / Space → cùng hành vi (thao tác tương đương bàn phím) | ĐẠT |
| Xác nhận lượt mới → xóa phiên, về chào mừng, đồng hồ chưa chạy | ĐẠT |
| Viewport dọc 768×1024 → hiện "Xoay iPad ngang để chơi", bài và đồng hồ vẫn giữ | ĐẠT |
| Sau khi tải xong, chơi hết một lượt → **0 request mạng** (kể cả với lớp hiệu ứng) | ĐẠT |
| Mưa mã thực sự vẽ ra pixel (đo trực tiếp trên canvas) | ĐẠT |
| Đổi màn nhiều vòng → số canvas và số interval về đúng mức cũ, không rò rỉ | ĐẠT |
| Phiên biến mất giữa lượt → lùi về màn chào mừng thay vì kẹt màn trắng | ĐẠT |

### 5.3 Còn phải kiểm tra trên thiết bị thật trước khi bàn giao

Những mục này **chưa** được xác nhận và không thể xác nhận trong môi trường dev hiện tại:

- **Safari trên iPad thật**: chạm tab, chọn đáp án, cuộn thẻ dài, nhấn giữ reset, xoay màn hình.
- **Service worker / chạy offline.** Mã đã có trong `sw.js` nhưng **chưa chạy thử được**:
  môi trường xem trước dùng khi phát triển chặn đăng ký service worker. App vẫn chạy bình thường
  khi đăng ký thất bại (chỉ ghi cảnh báo ra console). Theo đúng yêu cầu của brief, **chỉ xác nhận
  hỗ trợ offline sau khi kiểm tra trên iPad thật**. Lưu ý app đã preload toàn bộ font và hình của
  cả 4 màn ngay lần tải đầu, nên kể cả khi service worker không hoạt động, mất mạng giữa lượt
  vẫn không ảnh hưởng tới lượt đang chơi — chỉ ảnh hưởng tới việc reload.
- **Hiệu ứng nghiêng 3D theo con trỏ** (`mountTilt`) dùng `requestAnimationFrame`.
  Môi trường xem trước khi phát triển không cấp frame cho rAF (đo được 0 tick/giây),
  nên phần này chưa chạy thử được — cần mở trên máy thật để xác nhận. Các hiệu ứng
  còn lại (mưa mã, glitch, lật thẻ, đếm điểm) đã kiểm tra chạy đúng.
- **Nhịp khung hình trên iPad thật** với lớp hiệu ứng bật: mưa mã chạy 18fps trên hai
  canvas nhỏ và chỉ animate `transform`/`opacity`, nhưng vẫn nên soát lại trên iPad
  đời thấp nhất sẽ dùng tại gian hàng. Nếu giật, hạ `RAIN_FPS` trong `src/effects.js`
  hoặc bỏ canvas ở header.
- **Chụp ảnh nghiệm thu 4 màn** ở 1024×768, 1180×820 và 1440×900 để đính kèm hồ sơ bàn giao.
- Kiểm tra bằng chuột và bàn phím trên desktop (focus rõ, radio có nhãn) — đã đúng về mặt
  markup (`role="radiogroup"`/`radio`, `aria-checked`, `aria-label` cho dãy 1–8, focus ring
  3px) nhưng nên soát lại bằng trình đọc màn hình thật.

## 6. Vận hành tại gian hàng

Trên mỗi iPad, trước giờ mở cửa:

1. Mở URL, đợi tải xong (hero, font và hình của cả 4 màn tải ngay ở màn đầu).
2. Chạy thử trọn một lượt, kiểm tra màn kết quả.
3. Nhấn giữ **"Giữ để bắt đầu lượt mới"** 1,5 giây → xác nhận → app về màn chào mừng.

Trong lượt chơi, người phụ trách **không thao tác gì**. Cuối lượt chỉ làm hai việc:
kiểm tra điểm trên màn kết quả, rồi nhấn giữ để mở lượt tiếp theo.

Nếu app hiện dải cảnh báo vàng **"Máy này không lưu được tiến độ"**, nghĩa là trình duyệt
đang chặn bộ nhớ cục bộ (ví dụ Safari ở chế độ riêng tư). Lượt hiện tại vẫn chơi được nhưng
sẽ mất nếu tải lại trang — hãy xử lý trước khi nhận người chơi tiếp theo.

## 7. Nằm ngoài phạm vi v1

Đăng nhập / họ tên / lớp / QR tham gia · AI sinh câu hỏi hoặc AI chấm · câu trả lời tự luận ·
phòng chơi, đồng bộ nhiều máy, bảng xếp hạng · thi đấu theo nhóm, câu phụ ·
quản lý quà, thống kê học sinh, hệ thống quản trị · giao diện riêng cho điện thoại.
