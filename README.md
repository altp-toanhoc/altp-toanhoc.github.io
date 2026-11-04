# Ai Là Triệu Phú Toán Học

Trò chơi khởi động đầu giờ theo lối gameshow truyền hình, kèm bộ 5 câu ôn tập cấp số cộng dẫn vào bài Cấp số nhân. Một người chơi đứng trước màn chiếu; học sinh bình chọn trên điện thoại; hết giờ, người chơi xem tỉ lệ, dùng 50:50 hoặc tổ tư vấn, rồi chốt đáp án.

| Thư mục / file | Nội dung |
|---|---|
| `app/` | Toàn bộ code: trang tĩnh `public/`, luật Firebase `database.rules.json`, bộ câu `bo_cau/cap_so_cong.json`, công cụ `tool/`, kiểm thử `test/` |
| `docs/01_tong_quan_san_pham.md` | Trò chơi là gì, luồng một buổi, trợ giúp, luật tính, từng câu chữ trên màn hình, bộ câu, các quyết định đã chốt |
| `docs/02_tai_lieu_ky_thuat.md` | Chạy và kiểm thử, kiến trúc, từng file, dữ liệu và luật truy cập, cách từng màn hoạt động, giao diện, theme |
| `docs/03_dua_len_mang.md` | Từng bước đưa lên mạng (Firebase Hosting hoặc GitHub Pages + Firebase), giới hạn và chi phí, bảo vệ, việc làm trước mỗi buổi học |
| `docs/04_de_xuat_tuong_lai.md` | Việc nên làm trước khi dùng rộng, điểm chờ quyết, tính năng và kỹ thuật đáng làm, rủi ro |
| `docs/nguon/` | Tài liệu chốt nội dung 5 câu hỏi (bản gốc) |
| `docs/anh/` | Ảnh màn hình |

**Chạy thử trên máy này:**

```bash
cd ~/trangrua_thidau/app
npm start          # rồi mở http://localhost:8790/host.html (chuyển tiếp cổng 8790 qua VS Code)
npm stop
```
