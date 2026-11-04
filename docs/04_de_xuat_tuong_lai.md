# Trạng Rùa thi đấu: đề xuất cho tương lai

Tài liệu này xếp các việc theo mức đáng làm, việc nên làm trước đứng đầu. Mỗi mục ghi lý do và cách làm gợi ý, nhưng chưa việc nào được làm.

## 1. Cần làm trước khi dùng rộng

| Việc | Lý do | Cách làm |
|---|---|---|
| Xóa ảnh trong `public/theme/` | Mọi thứ trong `public/` sẽ bị đăng công khai | `03_dua_len_mang.md` mục 0 |
| Thử trên điện thoại thật: iPhone đời cũ, Android giá rẻ, mạng trường | Mọi kiểm thử hiện tại chạy trên Chrome không màn hình | Một buổi thử với 5–10 học sinh, ghi lại máy nào lỗi |
| Bật App Check | Chặn script phá phòng khi link bị chia sẻ rộng | `03_dua_len_mang.md` mục 8 |
| Đặt cảnh báo chi phí và theo dõi số kết nối | Gói miễn phí giới hạn 100 kết nối cùng lúc | Firebase Console → Usage; Google Cloud Billing → Budget alerts |
| Tên file có mã băm (`host.3f9a.js`) | Đảm bảo bản mới luôn được tải sau mỗi lần sửa, kể cả trên GitHub Pages (không đặt được header cache) | esbuild `--entry-names=[name]-[hash]`, rồi sinh `host.html`/`play.html` trỏ đúng tên |

## 2. Các điểm tài liệu chốt nội dung mô tả khác với bản hiện tại

Tài liệu gốc (`nguon/Ai_la_trieu_phu_5_cau_hoi_Cap_so_cong.md`) mô tả vài điểm khác luồng đã chốt trong buổi làm việc. Cần người sáng lập quyết:

| Điểm | Tài liệu gốc | Hiện tại |
|---|---|---|
| Mở bình chọn | Giáo viên bấm "Hỏi ý kiến khán giả" | Bình chọn mở ngay khi câu hiện |
| Công bố | Hai bước: "Chốt đáp án" rồi "Công bố đáp án" | Chốt xong là trống dồn và công bố |
| Lời giải thích | Hiện sau khi công bố | Không hiện (người sáng lập bỏ ngày 04/11) |
| Nút "Quay lại", "Bắt đầu lại" | Có | Chưa có "Quay lại"; "Phòng mới" thay cho "Bắt đầu lại" |
| Mốc thưởng 50.000đ → 1.000.000đ | Có | Không hiện, vì thang tiền thưởng là dấu hiệu riêng của chương trình truyền hình |

Phần còn lại đều đã theo tài liệu gốc: 5 câu giữ nguyên từng chữ, không lộ đáp án trước khi chốt, không tự chuyển câu, sai vẫn chơi tiếp, có màn dẫn vào bài mới.

## 3. Tính năng đáng làm

1. **Giáo viên điều khiển bằng điện thoại.** Máy chiếu chỉ để hiển thị; giáo viên đi lại trong lớp, bấm chọn và chốt trên điện thoại của mình. Cách làm: thêm trang `remote.html` dùng cùng tài khoản ẩn danh với `host.html` (mã điều khiển hiện trên màn chiếu); luật cho phép uid điều khiển ghi `state`.
2. **Ẩn % trong vài giây đầu.** Tránh học sinh chạy theo số đông; hiện % sau khoảng 5 giây hoặc khi còn 10 giây. Cách làm: một ngưỡng thời gian trong `renderQuestion` của `host.js`.
3. **Nút "Quay lại"** để mở lại câu trước khi lỡ bấm "Câu tiếp". Cách làm: `startQuestion(q - 1)` và xóa `answers/{q-1}`, `results/{q-1}`, `keys/{q-1}` (chỉ giáo viên ghi được).
4. **Mời một học sinh ra khỏi phòng** (tên không phù hợp, tab ma). Cách làm: giáo viên ghi `players/{uid}/kicked = true`; luật từ chối phiếu của uid bị mời ra; điện thoại hiện thông báo.
5. **Nhiều bộ câu, giáo viên tự soạn.** Hiện app chỉ có một bộ câu theo yêu cầu. Nếu sau này cần thêm: đăng nhập Google cho giáo viên, lưu bộ câu ở `teachers/{uid}/sets` (chỉ chủ đọc được), có ô soạn câu với xem trước công thức.
6. **Xuất kết quả buổi chơi** (tỉ lệ từng câu) ra CSV, để giáo viên biết lớp nhầm ở đâu. Dữ liệu đã có sẵn trong `results/{q}`.
7. **Bộ âm thanh có bản quyền.** Thư mục theme đã có sẵn 11 ô âm thanh (`02_tai_lieu_ky_thuat.md` mục 11).

## 4. Kỹ thuật

- **Giấu đáp án khỏi mã trang.**
  - Cách 1: bộ câu có đáp án lưu ở `teachers/{uid}/sets` và chỉ tải sau khi giáo viên đăng nhập.
  - Cách 2: chỉ lưu mã băm của đáp án trong trang; giáo viên nhập "mã mở khóa" trước buổi.
  - Cả hai đều phức tạp hơn nhiều so với lợi ích của trò khởi động 5 phút.
- **Dọn phòng cũ.** Cloud Function chạy định kỳ xóa phòng quá 7 ngày (cần gói Blaze); hoặc mỗi tháng xóa tay `rooms` trong Console.
- **CI chạy kiểm thử.** GitHub Actions cài Java 21, chạy `firebase emulators:exec "npm test && node tool/e2e.mjs"` trên mỗi lần đẩy code. Chrome không màn hình có sẵn qua `npx playwright install chromium-headless-shell`.
- **Kiểm thử trên máy thật.** Dùng BrowserStack hoặc mượn máy. Đặc biệt kiểm tra Safari iOS 14–15 với `clip-path` của khung vát góc và `conic-gradient` của ánh đèn.
- **Khả năng tiếp cận.** Thêm `aria-live` cho dòng trạng thái trên điện thoại; kiểm tra tương phản chữ trên ô cam và xanh.
- **Đo thật trên máy yếu.** Bài đo `tool/perf.mjs` mới đo phần JavaScript và dàn trang. Phần vẽ hiệu ứng (ánh đèn, quầng sáng) nên đo trên một laptop cũ thật; nếu giật, thêm nút tắt hiệu ứng hoặc dựa vào `prefers-reduced-motion` (đã hỗ trợ).

## 5. Rủi ro cần nhớ

| Rủi ro | Mức | Giảm nhẹ |
|---|---|---|
| Vượt 100 kết nối của gói miễn phí khi nhiều lớp chơi cùng lúc | Cao khi quảng bá | Gói Blaze kèm cảnh báo chi phí |
| Mạng trường chặn hoặc chậm | Trung bình | Firebase tự chuyển long polling; có dải báo mất kết nối; thử trước buổi học |
| Học sinh mở nhiều tab hoặc dùng script bầu ảo | Thấp (trò khởi động, không tính điểm) | App Check; tính năng mời ra khỏi phòng |
| Nhầm lẫn với chương trình truyền hình (tên, giao diện) | Trung bình | Giữ tên và logo riêng; chỉ dùng bộ nhận diện có giấy phép qua thư mục theme |
| Trình duyệt quá cũ | Thấp | Có thông báo "Trình duyệt chưa chạy được trò chơi" sau 8 giây |
