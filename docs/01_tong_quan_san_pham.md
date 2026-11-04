# Trạng Rùa thi đấu: tổng quan sản phẩm và cách hoạt động

Trò chơi 3 câu đầu giờ theo lối gameshow truyền hình. Tên: **Trạng Rùa thi đấu**. Một **người chơi** đứng trước màn chiếu; học sinh mở đường link trên điện thoại và **bình chọn** trong lúc đồng hồ chạy, màn chiếu hiện **tỉ lệ bình chọn trực tiếp**. Hết giờ, bình chọn khóa lại; người chơi xem tỉ lệ, có thể dùng 50:50 hoặc tổ tư vấn, chọn một ô rồi bấm **"Chốt đáp án"**; chỉ lúc đó đáp án đúng mới hiện. Màn hình không nhắc tới "cô" hay "lớp", không có điểm số, không phân mức dễ/khó, không ghi nguồn đề. App chỉ có **một bộ câu chính thức** (5 câu ôn tập cấp số cộng, mục 5), đóng gói sẵn trong trang, không chọn được bộ khác. Đây là hoạt động độc lập, không gắn với app Trạng Rùa.

- **Giao diện:** trường quay truyền hình ban đêm theo lối gameshow: nền tím than và xanh đêm, chùm đèn rọi từ trên, quầng tím hai bên, vòng sáng dưới sàn; khung câu hỏi và ô đáp án hình chữ nhật dài vát bốn góc, viền bạc, phát sáng; chữ A:/B:/C:/D: vàng; ô người chơi đang chọn viền cam nhấp nháy, ô đã chốt cam, ô đúng xanh lá nháy sáng, ô chốt sai đỏ; bậc đang chơi là thanh cam hai đầu nhọn. Logo riêng: tấm biển vát góc viền bạc, tia vàng tỏa từ dưới, hai dòng "TRẠNG RÙA" / "THI ĐẤU".
- **Triết lý thiết kế giữ theo thể loại:** bóng tối dồn ánh nhìn vào câu hỏi; ánh sáng là phần thưởng; màu báo trạng thái (thường → cam → xanh lá hoặc đỏ); viền kim loại và quầng sáng tạo cảm giác "chương trình lớn"; nhịp chậm hồi hộp trước khi lộ đáp án (đèn tối, trống dồn).
- **Giao diện mặc định không sao chép một chương trình cụ thể:** không có tên, logo, thang tiền thưởng, nhạc hay hình khung đáp án của chương trình truyền hình nào. Ai có bộ nhận diện được cấp phép thì tự thay bằng file của mình qua thư mục giao diện riêng (tài liệu kỹ thuật mục 11); app không tự vẽ lại bộ nhận diện của ai.
- **Người tham gia:** một người chơi (thường là giáo viên, đóng vai người chơi bình thường) điều khiển màn chiếu; học sinh bình chọn trên điện thoại; **tổ tư vấn là một giáo viên khác trong phòng** (trao đổi ngoài đời, màn hình chỉ hiện dải "TỔ TƯ VẤN ĐANG TRỢ GIÚP"). Không tính điểm ai.
- **Không tài khoản:** học sinh chỉ nhập tên hiển thị 1–24 ký tự, dùng trong buổi chơi đó.

## 1. Luồng một buổi

1. **Chuẩn bị:** chỉ có tiêu đề "Ôn tập cấp số cộng" và nút "Tạo phòng" (không danh sách câu, không hướng dẫn luật chơi). Dòng "Giao diện riêng: …" chỉ hiện khi có theme.
2. **Phòng chờ:** logo, đường link, mã QR, "MÃ PHÒNG" 4 chữ số; "N học sinh đang trong phòng"; tên hiện dần thành thẻ. Nút **"Bắt đầu"**.
3. **Bình chọn (20 giây mỗi câu):** câu hiện ("CÂU 1/5", kèm dòng ghi chú in nghiêng dưới đề nếu câu có, như câu 3) và đồng hồ chạy ngay, nhạc nền hồi hộp (nhanh gấp đôi ở 10 giây cuối, tích tắc ở 5 giây cuối). Học sinh bình chọn và đổi được đến khi hết giờ; màn chiếu hiện thanh % và con số % trên từng ô **ngay từ lá phiếu đầu tiên**, cột phải hiện "Đã bình chọn x/y". Trong lúc này người chơi **đã chọn ô được** (ô viền cam) nhưng **chưa chốt được** (nút "Chốt đáp án" và Enter chưa có tác dụng), chưa dùng trợ giúp; "Tạm dừng" thì được. Ô đã chọn được giữ nguyên khi hết giờ.
4. **Hết giờ:** bình chọn khóa (server từ chối mọi phiếu sau đó), dải "HẾT GIỜ BÌNH CHỌN", cột phải "x phiếu bình chọn"; **không có đồng hồ** cho bước này. Người chơi:
   - xem tỉ lệ cuối cùng (điện thoại học sinh cũng thấy);
   - **chọn hoặc đổi ô** (bấm hoặc phím A, B, C, D; có thể đã chọn từ lúc đang bình chọn): ô viền cam nhấp nháy, bấm ô khác để đổi, bấm lại ô đó không làm gì;
   - dùng **50:50** hoặc **Tổ tư vấn** bất cứ lúc nào trước khi chốt, kể cả khi đã chọn ô;
   - bấm **"Chốt đáp án"** (hoặc Enter; nút chỉ bật và sáng cam khi đã chọn ô).
5. **Lộ đáp án:** ô chốt chuyển cam, sân khấu tối lại, trống dồn **1,6 giây**; ô đúng bừng xanh lá; chốt sai thì ô đó chuyển đỏ. Cột phải "Chính xác!" (xanh) hoặc "Chưa chính xác" (đỏ). Chỉ hiện đáp án đúng, không có lời giải thích.
6. **"Câu tiếp"** (chỉ bấm được sau khi đã lộ đáp án). Sau câu 5 nút đổi thành **"Tiếp"**.
7. **Dẫn vào bài mới** (giáo viên tự bấm, không tự chuyển): màn **"CÂU HỎI MỞ"** với dãy \(2 \longrightarrow 4 \longrightarrow 8\) cỡ lớn và câu "Đây không phải cấp số cộng. Vậy các số hạng được tạo ra theo quy luật nào?"; nút **"Bài mới"** chuyển sang màn tiêu đề **"BÀI MỚI: CẤP SỐ NHÂN"**. Điện thoại học sinh hiện cùng nội dung. Đây không phải câu thứ 6. (Bộ câu không có phần dẫn nhập thì cuối buổi là màn "KẾT THÚC" kèm đáp án từng câu.)
8. **"Phòng mới":** kết thúc phòng (có hỏi lại).

**Nút của giáo viên** chỉ có: "Bắt đầu" / "Câu tiếp" / "Kết thúc" (phím N), "Tạm dừng" / "Tiếp tục" (phím Space, chỉ khi đang bình chọn), "Chốt đáp án" (Enter), bốn ô đáp án (bấm hoặc phím A–D, sau khi hết giờ), hai nút trợ giúp tròn ở cột phải (phím F, T, sau khi hết giờ), "Phòng mới"; trên thanh trên cùng có nút toàn màn hình và nút bật tắt âm thanh. Bản thử có thêm "Thêm 30 học sinh ảo".

**Chịu lỗi trong lớp thật:**
- Mất mạng trên 1,5 giây: cả hai màn hiện dải đỏ "MẤT KẾT NỐI · ĐANG KẾT NỐI LẠI…"; có mạng lại thì tự ẩn và đồng bộ lại.
- Giáo viên hoặc học sinh tải lại trang: vào lại đúng phòng, đúng câu, học sinh giữ phiếu, người chơi giữ ô đang chọn; đồng hồ chạy tiếp; nếu máy giáo viên tải lại đúng lúc trống dồn thì đáp án vẫn được công bố.
- Học sinh vào muộn thấy ngay câu đang chạy và bình chọn được.
- Câu hỏi dài: chữ câu hỏi và đáp án cùng co lại cho vừa màn chiếu (tối thiểu 45% cỡ gốc); điện thoại thì cuộn dọc, chữ co theo bề rộng.
- Màn hình không tự tắt trong lúc chơi (Wake Lock, nếu trình duyệt hỗ trợ); điện thoại rung nhẹ khi chọn.
- Số học sinh ("N học sinh đang trong phòng", "Đã bình chọn x/y") chỉ đếm điện thoại đang kết nối: tab đã đóng không làm sai mẫu số; thẻ tên của em đã thoát mờ đi.
- Mạng chập chờn lúc mở trang: đăng nhập tự thử lại (1, 2, 4… tối đa 10 giây một lần); máy giáo viên tải lại mà chưa đọc được phòng thì giữ phòng và báo kiểm tra mạng, không mất phòng.
- Giữ phím Space không làm tạm dừng/tiếp tục liên tục.

## 2. Quyền trợ giúp

**Dùng ở mọi câu, không giới hạn trong buổi:** mỗi câu, mỗi quyền 1 lần (50:50 lần thứ hai không còn ý nghĩa vì chỉ còn 2 phương án), dùng sau khi hết giờ bình chọn và trước khi chốt; sang câu sau cả hai quyền dùng lại được.
- **50:50:** bỏ ngẫu nhiên 2 phương án sai trên mọi máy (ô bị bỏ mờ đi, chữ và % biến mất), không bao giờ bỏ đáp án đúng; nếu người chơi đang chọn một ô bị bỏ thì ô đó bị bỏ chọn. Hai ô còn lại giữ nguyên % gốc (tổng có thể dưới 100%).
- **Tổ tư vấn:** dải "TỔ TƯ VẤN ĐANG TRỢ GIÚP" trên màn chiếu và điện thoại, đến khi người chơi chọn ô khác hoặc chốt.
- Quyền đã dùng ở câu hiện tại hiện mờ với gạch chéo đỏ; câu sau trở lại bình thường.

## 3. Luật tính

- **%** tính trên phiếu cuối của mỗi học sinh; bốn số luôn cộng đúng 100 (làm tròn theo phần dư lớn nhất), ô không ai chọn là 0%.
- **Khóa phiếu:** ngay khi hết giờ, màn giáo viên khóa câu, từ đó server từ chối mọi phiếu (kể cả phiếu trễ trên đường truyền); số phiếu cuối được đọc sau khi khóa rồi công bố. Phiếu bị từ chối: "Hết giờ, lựa chọn này không được ghi.".
- **Chính xác** khi ô người chơi chốt là đáp án.
- **Chạm liên tiếp:** server nhận mỗi học sinh tối đa một lần ghi trong 250 ms; điện thoại gom các lần chạm nhanh hơn thế và ghi lựa chọn cuối (trễ tối đa 0,4 giây; ô vẫn tô cam ngay), nên không lần chạm nào bị từ chối. Chạm lại đúng ô đang chọn không ghi lại.

## 4. Màn học sinh

- **Vào lớp:** "Mã phòng" (điền sẵn khi mở bằng link/QR), "Tên hiển thị", "Vào lớp" (không có dòng giải thích). Lỗi: "Mã phòng gồm 4 chữ số.", "Hãy nhập tên hiển thị.", "Không tìm thấy phòng này. Kiểm tra lại mã."
- **Chờ:** vòng xoay, "Đã vào phòng", "Chờ giáo viên bắt đầu."
- **Bình chọn:** "CÂU 1/3", số giây, thanh thời gian, câu hỏi, 4 nút xếp dọc. "Bình chọn đáp án bạn cho là đúng." → "Bạn chọn B. Đổi được đến khi hết giờ." (ô chọn tô cam).
- **Hết giờ:** dải "HẾT GIỜ BÌNH CHỌN" (hoặc "TỔ TƯ VẤN ĐANG TRỢ GIÚP"), % trên từng nút, "Hết giờ bình chọn. Chờ chốt đáp án…", dòng dưới "Bạn đã chọn B." / "Bạn chưa bình chọn câu này.".
- **Đã chốt:** ô chốt tô cam, "Đã chốt đáp án C. Chờ công bố…", nền tối lại trong lúc trống dồn.
- **Lộ đáp án:** "Chính xác! Đáp án là B." (xanh) hoặc "Chưa chính xác. Đáp án đúng là B." (đỏ); ô chốt sai chuyển đỏ; dòng dưới "Bạn đã chọn B, đúng rồi." / "Bạn đã chọn C." / "Bạn chưa bình chọn câu này.".
- **Cuối buổi:** cúp, "KẾT THÚC", "Cảm ơn bạn đã tham gia!", đáp án từng câu.

## 5. Bộ câu chính thức: ôn tập cấp số cộng (`bo_cau/cap_so_cong.json`)

Nguồn: tài liệu chốt nội dung của người sáng lập, bản sao ở `nguon/Ai_la_trieu_phu_5_cau_hoi_Cap_so_cong.md` (giữ nguyên từng chữ, ký hiệu toán, thứ tự phương án, đáp án và lời giải thích). Khi tài liệu gốc đổi, tạo lại bằng `cd ~/trangrua_thidau/app && python3 -E tool/make_bank.py ../docs/nguon/Ai_la_trieu_phu_5_cau_hoi_Cap_so_cong.md bo_cau/cap_so_cong.json && npm run build`. `host.js` nhập file này lúc đóng gói (`import QUESTIONS from '../../bo_cau/cap_so_cong.json'`).

| Câu | Chủ đề | Đáp án |
|---|---|:---:|
| 1 | Nhận diện cấp số cộng | C |
| 2 | Công sai (thứ tự phép trừ; đề có công thức hiển thị riêng dòng) | B |
| 3 | Hệ thức truy hồi (có ghi chú "Các hệ thức truy hồi được xét với \(n\ge 1\).") | D |
| 4 | Công thức số hạng tổng quát | A |
| 5 | Tính chất ba số hạng liên tiếp | C |

Mỗi câu 20 giây bình chọn. Định dạng: `{ title, topic, questions: [ { seconds, text, options: [4], answer: 0–3, explain, note? } ], outro: { sequence, question, title } }`. `explain` giữ nguyên từ tài liệu gốc nhưng **không hiển thị** (người sáng lập chỉ muốn hiện đáp án đúng). Công thức viết `\(…\)` (cùng dòng) hoặc `\[…\]` (riêng dòng), `$…$` cũng được. **Không hiển thị:** mốc thưởng (50.000đ → 1.000.000đ) trong tài liệu gốc, vì thang tiền thưởng là dấu hiệu riêng của chương trình truyền hình; thang câu chỉ ghi "Câu 1–5". Ghi chú sư phạm ("Dụng ý sư phạm", "Chi tiết để dẫn bài mới") dành cho giáo viên, không đưa lên màn hình.

Các script kiểm tra trên localhost thay bộ câu ngắn qua `localStorage` `lop3cau.test.bank` (chỉ có tác dụng khi `IS_LOCAL`).

## 6. Quyết định đã chốt (04/11/2026)

| Điểm | Quyết định |
|---|---|
| Người chơi | Một người chơi trước màn chiếu (giáo viên đóng vai người chơi bình thường); học sinh chỉ bình chọn. Màn hình không nhắc "cô", "lớp". |
| Bình chọn | 20 giây mỗi câu, % hiện trực tiếp; người chơi được chọn ô từ lúc đang bình chọn nhưng chỉ chốt được sau khi hết giờ. |
| Hết giờ | Dừng, không đồng hồ; người chơi xem %, dùng trợ giúp, chọn ô; chỉ nút "Chốt đáp án" (hoặc Enter) mới lộ đáp án. |
| Trợ giúp | 50:50 và tổ tư vấn; mỗi câu mỗi quyền 1 lần, câu nào cũng dùng lại được. Tổ tư vấn là một giáo viên khác, trao đổi ngoài đời. |
| Công bố | Chỉ hiện đáp án đúng (và ô chốt sai chuyển đỏ); không lời giải thích. |
| Điểm số, mức độ, nguồn | Không điểm số, không mức dễ/vừa/khó, không ghi nguồn đề. |
| Bộ câu | Chỉ 5 câu ôn tập cấp số cộng trong tài liệu chốt nội dung (`nguon/`), không chọn bộ khác. |
| Sau câu 5 | Màn câu hỏi mở (2 → 4 → 8) rồi màn "BÀI MỚI: CẤP SỐ NHÂN", giáo viên tự chuyển. |
| Màn đầu | Chỉ tiêu đề và nút "Tạo phòng"; không danh sách câu, không hướng dẫn. |
| Giao diện | Lối gameshow truyền hình (trường quay tím đêm, khung vát góc viền bạc, trống dồn); logo riêng "Trạng Rùa thi đấu". Không dùng tên, logo, thang tiền thưởng, khung lục giác, nhạc của chương trình truyền hình nào; ai có giấy phép thì tự thay qua thư mục theme. |
| Tên | "Trạng Rùa thi đấu". Tên "Ai là triệu phú toán học" không được dùng vì là tên chương trình truyền hình; chờ người sáng lập chọn tên khác nếu muốn đổi. |
| Còn chờ quyết | Các điểm tài liệu gốc mô tả khác (nút "Hỏi ý kiến khán giả", tách "Công bố đáp án", nút "Quay lại", mốc thưởng): xem `04_de_xuat_tuong_lai.md` mục 2. |

## 7. Ảnh màn hình

Thư mục `anh/` (chụp từ lượt chạy kiểm thử, màn chiếu 1600 × 900 và điện thoại 390 × 844): màn đầu, phòng chờ, đang bình chọn, hết giờ, đã chọn ô, lộ đáp án, câu hỏi mở, bài mới.
