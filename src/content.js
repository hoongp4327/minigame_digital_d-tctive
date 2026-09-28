/**
 * Nội dung vụ án Digital Detective.
 * Tách hoàn toàn khỏi component giao diện: sửa file này là sửa được đề,
 * không cần đụng tới logic phiên chơi hay CSS.
 *
 * QUAN TRỌNG khi sửa nội dung:
 *  - Tăng CONTENT_VERSION mỗi lần đổi câu hỏi / đáp án / bằng chứng.
 *    Phiên đang chơi dở với contentVersion cũ sẽ được dọn và báo cho
 *    người phụ trách thay vì chấm nhầm bộ đề.
 *  - Giữ nguyên thứ tự thẻ 1–4 và thứ tự câu 1–8, không đảo ngẫu nhiên ở v1.
 */

export const CONTENT_VERSION = '1.0.0';
export const CASE_ID = 'ho-so-01';
export const DURATION_SECONDS = 300;

export const CASE = {
  fileLabel: 'HỒ SƠ 01',
  title: ['VỤ ÁN', 'TÀI KHOẢN', 'BIẾN MẤT'],
  tagline: 'Một tin nhắn lạ. Một tài khoản bị chiếm. Bạn có tìm ra nguyên nhân?',
  chips: ['4 bằng chứng', '8 câu hỏi', '5 phút làm bài'],
  cta: 'Bắt đầu điều tra',
  note: 'Không cần đăng nhập · Chơi độc lập',
  briefingHeading: 'Chuyện gì đã xảy ra?',
  story:
    'Minh quản lý tài khoản CLB Truyền thông. Một tài khoản lạ gửi link bình chọn, ' +
    'tự xưng là ban tổ chức cuộc thi của trường. Minh nhập thông tin theo hướng dẫn. ' +
    'Đến 20:15, Minh mất quyền truy cập.',
  missionsHeading: 'Nhiệm vụ của bạn',
  missions: ['Đọc 4 bằng chứng', 'Trả lời 8 câu hỏi', 'Nộp bài và xem kết quả'],
  timerNote: 'Đồng hồ chỉ chạy khi bạn bắt đầu làm bài.',
  briefingCta: 'Đã hiểu — chơi thôi!',
  disclaimer: 'Tình huống giả lập. Không truy cập link thật.'
};

/**
 * Bốn bằng chứng theo thứ tự thẻ (KHÔNG phải thứ tự thời gian:
 * thẻ 2 là thông tin xác minh sau sự cố).
 * `blocks` là các khối hiển thị; type quyết định cách QuestionPanel render.
 */
export const EVIDENCE = [
  {
    id: 'ev1',
    tabLabel: '1. Tin nhắn lạ',
    title: 'Tin nhắn lạ',
    blocks: [
      { type: 'lead', text: 'Hồ sơ tài khoản gửi tin cho Minh lúc 19:42:' },
      {
        type: 'profile',
        displayName: 'Hội thi Học đường số',
        // Ký tự thứ 6 là CHỮ SỐ KHÔNG, không phải chữ o. Không được tự "sửa".
        handle: '@hocdu0ng.so_official',
        meta: 'Tạo hôm nay · 12 người theo dõi'
      },
      { type: 'message', text: 'Xác nhận trong 5 phút, nếu chậm hồ sơ sẽ bị hủy.' }
    ]
  },
  {
    id: 'ev2',
    tabLabel: '2. Xác minh',
    title: 'Xác minh sau sự cố',
    blocks: [
      {
        type: 'lead',
        text: '20:20, sau khi mất quyền truy cập, Minh báo giáo viên. Giáo viên cùng Minh kiểm tra và xác nhận:'
      },
      {
        type: 'list',
        items: [
          'Nhà trường không tổ chức cuộc thi Học đường số.',
          'Giáo viên không gửi link bình chọn nào.',
          'Nhà trường không yêu cầu học sinh đăng nhập tài khoản Câu lạc bộ để bình chọn.',
          'Tin nhắn và đường link không phải do nhà trường gửi.'
        ]
      }
    ]
  },
  {
    id: 'ev3',
    tabLabel: '3. Mã OTP',
    title: 'Mã OTP',
    blocks: [
      { type: 'lead', text: '20:14, điện thoại của Minh nhận tin:' },
      {
        type: 'list',
        items: [
          'Mã đăng nhập: 381642 — hiệu lực 2 phút.',
          'Cảnh báo: không đưa mã cho người khác.',
          'Chỉ nhập mã trên ứng dụng hoặc trang chính thức.',
          'Minh đã nhập mã vào trang mở từ link trong tin nhắn.'
        ]
      }
    ]
  },
  {
    id: 'ev4',
    tabLabel: '4. Nhật ký',
    title: 'Nhật ký bảo mật',
    blocks: [
      {
        type: 'log',
        items: [
          { time: '20:15', text: 'Android lạ đăng nhập bằng mật khẩu và OTP.' },
          { time: '20:15', text: 'Email khôi phục bị thay đổi.' },
          { time: '20:16', text: 'Mật khẩu bị đổi; các phiên khác bị đăng xuất.' },
          { time: '20:17', text: 'Tài khoản gửi 38 tin nhắn có link bình chọn.' }
        ]
      }
    ]
  }
];

/** Khóa đáp án: 1A · 2B · 3B · 4A · 5C · 6B · 7A · 8C */
export const QUESTIONS = [
  {
    id: 'q1',
    prompt: 'Chi tiết nào cho thấy tên tài khoản có thể giả mạo?',
    options: { A: 'Dùng số 0 thay chữ o', B: 'Tên hiển thị viết hoa', C: 'Có ảnh đại diện' },
    correctOption: 'A',
    explanation: 'Số 0 thay chữ o là kiểu giả mạo tên tài khoản.'
  },
  {
    id: 'q2',
    prompt: 'Câu nào tạo áp lực để Minh làm nhanh?',
    options: { A: '“Chào Minh”', B: '“Xác nhận trong 5 phút...”', C: '“Bình chọn giúp mình”' },
    correctOption: 'B',
    explanation: 'Giới hạn 5 phút và dọa hủy hồ sơ làm người nhận mất bình tĩnh.'
  },
  {
    id: 'q3',
    prompt: 'Sau khi mất tài khoản, Minh hỏi giáo viên và biết được điều gì?',
    options: {
      A: 'Trường có cuộc thi',
      B: 'Trường không tổ chức cuộc thi này',
      C: 'Cuộc thi chỉ dành cho lớp 8'
    },
    correctOption: 'B',
    explanation: 'Sau khi sự cố xảy ra, giáo viên xác nhận nhà trường không tổ chức cuộc thi này.'
  },
  {
    id: 'q4',
    prompt: 'Minh lẽ ra nên làm gì ngay khi nhận tin nhắn?',
    options: { A: 'Dừng lại và hỏi thầy cô', B: 'Đăng nhập thử', C: 'Chuyển link cho bạn' },
    correctOption: 'A',
    explanation: 'Minh lẽ ra phải dừng lại và hỏi thầy cô trước khi bấm link hoặc đăng nhập.'
  },
  {
    id: 'q5',
    prompt: 'Khi trang từ link lạ hỏi OTP, Minh nên làm gì?',
    options: {
      A: 'Nhập thật nhanh',
      B: 'Gửi mã cho bạn kiểm tra',
      C: 'Đóng trang và tự mở kênh chính thức'
    },
    correctOption: 'C',
    explanation: 'Không nhập OTP vào trang mở từ link lạ; hãy tự mở kênh chính thức.'
  },
  {
    id: 'q6',
    prompt: 'Tài khoản thực sự bị chiếm quyền lúc nào?',
    // 19:48 là đáp án nhiễu theo đề gốc, không phải mốc OTP đã hiệu chỉnh (20:14).
    options: { A: '19:48', B: '20:15', C: '20:17' },
    correctOption: 'B',
    explanation: '20:15 là lúc thiết bị lạ đăng nhập và thay đổi cài đặt.'
  },
  {
    id: 'q7',
    prompt: 'Vì sao người lạ có thể đăng nhập tài khoản của Minh?',
    options: {
      A: 'Minh đã nhập mật khẩu và OTP vào trang lạ',
      B: 'Điện thoại của Minh tự hỏng',
      C: 'Minh đọc tin nhắn quá chậm'
    },
    correctOption: 'A',
    explanation:
      'Minh đã nhập mật khẩu và OTP vào trang lạ nên người xấu có đủ thông tin để đăng nhập.'
  },
  {
    id: 'q8',
    prompt: 'Việc đầu tiên cần làm sau khi phát hiện là gì?',
    options: {
      A: 'Tiếp tục trả lời kẻ xấu',
      B: 'Im lặng và xóa hết',
      C: 'Báo người phụ trách, khôi phục tài khoản và cảnh báo người nhận'
    },
    correctOption: 'C',
    explanation: 'Báo sớm, khôi phục tài khoản và cảnh báo người nhận để chặn thiệt hại.'
  }
];
