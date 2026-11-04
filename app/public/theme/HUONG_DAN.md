# Thư mục giao diện riêng

Bỏ file ảnh, âm thanh, font vào **đúng thư mục này** (`public/theme/`), rồi tạo file **`theme.json`** liệt kê chúng. Mẫu đủ mọi ô: `theme.mau.json` (chép thành `theme.json` rồi xóa những ô không dùng). Ô nào không khai báo thì giữ giao diện mặc định. Tải lại trang là thấy; dòng "Giao diện riêng: …" ở màn Chuẩn bị cho biết app đã nhận bao nhiêu ô và ô nào sai.

Chỉ dùng file bạn có quyền dùng. Khi đưa lên mạng, mọi file trong thư mục này ai cũng tải được.

## Ảnh (`images`)
| Ô | Hiện ở đâu |
|---|---|
| `logo` | thay logo "Ai Là Triệu Phú Toán Học" trên thanh trên cùng, trên điện thoại và ở phòng chờ |
| `background` | nền sân khấu, phủ kín màn hình (ẩn đèn và vòng sáng mặc định) |
| `question` | khung câu hỏi |
| `answer`, `answerChosen`, `answerCorrect`, `answerWrong` | khung đáp án: thường; học sinh đang chọn (điện thoại); đáp án đúng; học sinh chọn sai (điện thoại) |
| `ladder`, `ladderNow` | một bậc của thang câu: thường; bậc đang chơi |
| `fifty`, `advisor` | nút tròn 50:50 và tổ tư vấn (ảnh vuông, nền trong suốt) |

Một ô ảnh viết một trong hai cách:
- `"logo": "logo.png"`: ảnh co giãn theo khung.
- `"answer": { "file": "khung_dap_an.png", "edge": 60, "edgeWidth": 1.2 }`: cho khung dài có hai đầu nhọn hoặc bo. `edge` là bề rộng (px, đo trên file ảnh) của mỗi đầu không được kéo giãn; `edgeWidth` là bề rộng vẽ mỗi đầu trên màn hình, tính bằng em (mặc định 2). Phần giữa kéo giãn theo chiều ngang; cả khung kéo theo chiều cao của ô.

Định dạng: png, jpg, webp, gif, svg, avif. Tên file chỉ gồm chữ không dấu, số, `.`, `_`, `-`, không có thư mục con.

## Âm thanh (`sounds`, chỉ màn giáo viên)
`start` (câu mới hiện, đồng hồ chạy), `countdown` (nhạc lặp lại trong lúc đồng hồ chạy, dừng khi tạm dừng hoặc hết giờ), `drumroll` (trống dồn lúc hết giờ, trước khi lộ đáp án), `tick` (mỗi giây trong 5 giây cuối), `pause`, `timeUp` (hết giờ bình chọn, và lúc chốt), `fifty`, `advisor`, `correct` (lộ đáp án, chốt đúng), `wrong` (lộ đáp án, chốt sai), `final` (màn kết thúc). Ô nào có file thì thay tiếng mặc định. Định dạng: mp3, ogg, wav, m4a, aac, webm.

## Màu (`colors`) và font (`font`)
`text` (chữ), `muted` (chữ phụ), `accent` (chữ A/B/C/D, số bậc, mã phòng), `highlight` (bậc đang chơi, nút chính), `correct`, `wrong`, `line` (viền và vòng đồng hồ). Màu viết dạng `#rrggbb`, `rgb(…)` hoặc `hsl(…)`. `font`: một file ttf, otf, woff hoặc woff2 dùng cho mọi chữ.
