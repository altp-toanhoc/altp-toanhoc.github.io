# Trạng Rùa thi đấu: tài liệu kỹ thuật

Toàn bộ code ở `~/trangrua_thidau/app/` (không phải git repo). Cách chơi và từng câu chữ trên màn hình: `01_tong_quan_san_pham.md`. Đưa lên mạng: `03_dua_len_mang.md`. Việc nên làm tiếp: `04_de_xuat_tuong_lai.md`.

## 1. Chạy

```bash
cd ~/trangrua_thidau/app
npm install && npm run build   # lần đầu
npm start                      # Firebase emulator (auth, database) + server thử, tất cả ở 127.0.0.1
npm test                       # 7 luật thuần + 10 luật truy cập (cần npm start) + 5 đọc theme + 2 server
bash tool/check_all.sh         # dựng lại, rồi mọi kiểm tra: npm test, e2e, robust, layout, perf, e2e với theme thử (~12 phút)
npm stop
```

Sửa file trong `public/js/` xong phải chạy `npm run build`: hai trang nạp bản đóng gói trong `public/build/`.

**Trình duyệt chạy được:** iPhone/iPad Safari iOS 14.5 trở lên; Android Chrome 64 trở lên; Chrome, Edge, Firefox, Safari bản mới trên máy tính. Máy cũ hơn: sau 8 giây điện thoại hiện "Trình duyệt chưa chạy được trò chơi" kèm hướng dẫn, thay vì trang trắng.

Mở `http://localhost:8790/host.html` (giáo viên) qua chuyển tiếp cổng 8790 của VS Code; học sinh `http://localhost:8790/play.html?room=MÃ`, mỗi tab là một học sinh. Trang chọn: `http://localhost:8790/`.

## 2. Kiến trúc

- **Trang tĩnh** trong `public/` (HTML, CSS, JS module, không framework), đóng vai trang đặt trên GitHub Pages.
- **Firebase Realtime Database + đăng nhập ẩn danh** giữ trạng thái phòng và câu trả lời. Bản thử chạy **Firebase Local Emulator Suite**: auth 127.0.0.1:9099, database 127.0.0.1:9000, hub 4400, logging 4500, UI tắt; project `demo-trangrua` (tiền tố `demo-` = chạy offline, không cần tài khoản), namespace `demo-trangrua-default-rtdb`.
- **`tool/serve.mjs`** phục vụ `public/` ở 127.0.0.1:8790 (`cache-control: no-store`) và chuyển tiếp trên cùng cổng: `/.ws`, `/.lp` (kể cả WebSocket) → 9000; `/identitytoolkit.googleapis.com/…`, `/securetoken.googleapis.com/…`, `/emulator/…` → 9099. Lý do: trình duyệt chỉ cần một cổng chuyển tiếp, đổi số cổng phía máy người dùng vẫn chạy.
- **Server thử chịu yêu cầu xấu:** mỗi yêu cầu chạy trong `try/catch`; đường dẫn có ký tự rỗng hoặc mã hóa hỏng trả 400; luồng đọc file có xử lý lỗi và đóng khi trình duyệt ngắt; chỉ chuyển tiếp hai đường Auth mà trình duyệt cần (`/identitytoolkit…`, `/securetoken…`), không chuyển trang quản trị `/emulator/…`.
- **Mọi cổng chỉ nghe ở loopback.** `ss` hiện 9000 là `[::ffff:127.0.0.1]:9000` (Java), vẫn là 127.0.0.1.
- `IS_LOCAL` (hostname `localhost`/`127.0.0.1`) trong `common.js` bật kết nối emulator theo chính origin của trang; trên tên miền thật thì dùng Firebase thật theo `FIREBASE_CONFIG`.
- **Java 21:** firebase-tools 15 từ chối Java dưới 21. JDK 21 (bản Corretto) nằm ở `~/tools/corretto21` (giải nén không cần sudo, đã so sha256); `start.sh` đặt `JAVA_HOME` về đó (ghi đè bằng `JAVA_HOME_21`). Lần đầu emulator tải JAR vào `~/.cache/firebase/emulators/`.

## 3. Các file

| File | Vai trò |
|---|---|
| `package.json` | `type: module`; build, start, stop, test |
| `firebase.json`, `.firebaserc` | luật = `database.rules.json`; host/cổng emulator (127.0.0.1); UI tắt; project `demo-trangrua` |
| `database.rules.json` | luật truy cập (mục 4); emulator tự nạp lại khi file đổi |
| `bo_cau/cap_so_cong.json` | bộ câu chính thức (tổng quan sản phẩm mục 5), đóng gói vào `host.js` |
| `tool/make_bank.py` | tạo lại bộ câu từ tài liệu chốt nội dung |
| `src/vendor.js` | điểm vào gói thư viện (Firebase app/auth/database, QRCode); `tool/build.sh` gói thành `public/vendor/vendor.js` |
| `public/index.html` | trang chọn màn giáo viên / học sinh |
| `public/host.html`, `public/js/host.js` | màn giáo viên (mục 5) |
| `public/play.html`, `public/js/play.js` | màn học sinh (mục 6) |
| `public/js/logic.js` | luật thuần, không Firebase, không DOM (mục 7) |
| `public/js/common.js` | `FIREBASE_CONFIG`, `IS_LOCAL`, `connect(name, persistence)`, `serverClock(db)` (giờ server = `Date.now()` + `.info/serverTimeOffset`), `$`, `esc`, `setRich` (`**đậm**` + `$LaTeX$`, bọc trong một `span.rich`), `show` |
| `public/js/sound.js` | hiệu ứng Web Audio tự tạo (bắt đầu câu, chọn ô, tích tắc 5 giây cuối, tạm dừng, khóa (hết giờ, chốt), trống dồn, 50:50, tổ tư vấn, lộ đáp án đúng/sai, kết thúc); ô âm thanh của theme có file thì phát file thay tiếng tự tạo; `countdown()` phát nhạc nền (của theme, hoặc nhịp bass tự tạo nhanh gấp đôi ở 10 giây cuối) khi đang bình chọn; bật tắt lưu ở `lop3cau.sound` |
| `public/js/lop_ao.js` | lớp ảo của bản thử (mục 8) |
| `public/js/theme.js` | giao diện riêng (mục 11): `parseTheme` (thuần, kiểm từng ô), `themeCss`, `applyTheme`, `describeTheme` |
| `public/theme/` | thư mục giao diện riêng: `HUONG_DAN.md`, `theme.mau.json`; người dùng thêm `theme.json` và file của mình |
| `tool/make_test_theme.py` | tạo bộ theme thử trung tính (SVG, WAV) để kiểm mọi ô |
| `public/css/style.css` | giao diện hai màn (mục 9) |
| `tool/build.sh` | esbuild `src/vendor.js`; chép KaTeX (css, js, auto-render, fonts); chép 5 file Be Vietnam Pro + giấy phép OFL từ `~/turtor_app/assets/fonts/` |
| `tool/start.sh`, `tool/stop.sh` | bật/tắt emulator và `serve.mjs` bằng `nohup`; chờ đủ 3 cổng; log và pid ở `/tmp/trangrua_lop/` |
| `tool/serve.mjs` | mục 2; `THEME_DIR` phục vụ `/theme/` từ thư mục khác (dùng cho lượt chạy thử theme) |
| `tool/cdp.mjs` | bộ điều khiển Chrome qua DevTools Protocol dùng chung cho các script kiểm tra |
| `tool/e2e.mjs` | chạy trọn một buổi trong Chrome không màn hình (mục 10) |
| `tool/robust.mjs`, `tool/layout.mjs`, `tool/perf.mjs` | tình huống lỗi trong lớp, bố cục 8 cỡ màn hình, độ mượt khi CPU chậm (mục 10) |
| `tool/check_all.sh` | dựng lại rồi chạy mọi kiểm tra một lượt |
| `public/build/` | bản đóng gói của hai màn (esbuild, `--splitting`, target Safari 14.1 / Chrome 64 / Firefox 67 / Edge 79; Firefox 67 là bản đầu có import() động); `tool/build.sh` tạo lại |
| `test/serve.test.mjs` | server thử: yêu cầu xấu không làm sập, không đọc được ngoài `public/`, không tới được trang quản trị của emulator |
| `test/logic.test.mjs`, `test/rules.test.mjs`, `test/theme.test.mjs` | mục 10 |

## 4. Dữ liệu và luật truy cập

Mọi thứ nằm dưới `rooms/{mã}` (đúng 4 chữ số); ngoài `rooms` không ai đọc ghi được.

| Nhánh | Ghi | Đọc | Nội dung |
|---|---|---|---|
| (cả phòng) | tạo khi mã còn trống hoặc phòng cũ đã quá 24 giờ; `host` = uid người ghi; `createdAt` = giờ server | — | `{host, createdAt, meta, state}` |
| `meta` | giáo viên | đã đăng nhập | `title`, `topic`, `total`, `levels[]` |
| `state` | giáo viên | đã đăng nhập | `phase` (lobby, open = đang bình chọn, paused, decide = hết giờ bình chọn, người chơi đang quyết, closed = đã chốt, end), `q`, `durationMs`, `endsAt` (giờ server, khi open), `remainingMs` (khi paused), `removed` (`{i: true}` của 50:50; có thể về dạng mảng), `pick` (ô người chơi đang chọn), `advisor` (true khi tổ tư vấn đang trợ giúp), `final` (ô đã chốt) |
| `questions/{i}` | giáo viên, lúc mở câu | đã đăng nhập | `text`, `options`, `source` (không hiển thị), `seconds`, `openedAt`, `final` (ô đã chốt); không có đáp án |
| `players/{uid}` | chính học sinh khi phòng tồn tại; `name` chuỗi 1–24 ký tự, `joinedAt` = giờ server, `online` true/false, không nhận trường khác | học sinh đó; giáo viên đọc cả nhánh | `name`, `joinedAt`, `online` |
| `answers/{i}/{uid}` | chính học sinh đã vào phòng; `i` = `state/q`; phase paused, hoặc open và giờ server ≤ `endsAt` + 1500 ms; `choice` nguyên 0–3, không nằm trong `removed`; `at` = giờ server; cách lần ghi trước ít nhất 250 ms; không nhận trường khác | học sinh đó; giáo viên đọc cả nhánh | `choice`, `at` |
| `results/{i}` | giáo viên, lúc lộ đáp án | đã đăng nhập | `counts[4]` (phiếu cuối của lớp) |
| `keys/{i}` | giáo viên, lúc lộ đáp án (cả bộ lúc tổng kết) | đã đăng nhập | chỉ số đáp án |
| `lifelines` | giáo viên | đã đăng nhập | `fifty`, `tuvan` = câu dùng gần nhất (quyền bị khóa khi bằng câu hiện tại) |
| `final` | giáo viên | đã đăng nhập | `rows[{final, key, correct, top, topPct, votes}]`, `correct`, `total` |

Lưu trên trình duyệt: `localStorage` `lop3cau.host.bank`, `lop3cau.sound`; `sessionStorage` `lop3cau.host.room` (tải lại trang vẫn giữ phòng), `lop3cau.play.{mã}`. Đăng nhập ẩn danh lưu theo session của từng tab (mỗi tab một uid); lớp ảo dùng bộ nhớ.

## 5. Màn giáo viên (`host.js`)

- **Khởi động:** nạp theme, đăng nhập ẩn danh (tự thử lại), hiện bộ câu chính thức (`showBank`); nếu `sessionStorage` có phòng của đúng uid thì vào lại phòng đó. Chỉ bỏ phòng khi đọc được chắc chắn phòng không còn hoặc thuộc người khác.
- **Tạo phòng:** sau 25 mã trùng hoặc lỗi mạng thì báo "Chưa tạo được phòng…". Đường link vào phòng tính theo địa chỉ trang (`new URL('play.html?room=…', location.href)`), nên vẫn đúng khi trang nằm trong thư mục con (GitHub Pages dạng `/ten-repo/`).
- **Tạo phòng:** mã ngẫu nhiên 1000–9999, thử tới 25 lần (mã đã có thì luật từ chối).
- **`startQuestion(i)`:** một lần ghi gồm `questions/{i}` (có `openedAt`) và cả `state` = open, `endsAt` = giờ server + số giây; mọi cờ của câu trước bị xóa.
- **`togglePause`**, **`fifty`** (`pickFifty` với đáp án giữ trên máy), **`advisor`** (tạm dừng lý do `tuvan`), **`next`**.
- **`reveal`** (tự chạy khi đồng hồ về 0, một lần nhờ cờ `revealing`): (1) ghi `state` = closed, từ đây server từ chối mọi lựa chọn; (2) thêm lớp `suspense` vào trang và đánh trống dồn trong `REVEAL_DELAY_MS` = 1600 ms; (3) **`publish(q)`**: đọc lại `answers/{q}` sau khi khóa, ghi `results/{q}` và `keys/{q}` cùng lúc, ghi nhớ câu vào `published`. Thứ tự này bảo đảm % đúng với các lựa chọn cuối và không ai chọn được sau khi thấy đáp án. Màn giáo viên chỉ tô đáp án và "Câu tiếp" chỉ bấm được khi câu đã nằm trong `published`.
- **Khôi phục (`ensurePublished`):** gọi mỗi lần `state` về và trong vòng đồng hồ; câu ở decide/closed mà chưa có `results/{q}` thì `publishVotes(q)`, câu ở closed mà chưa có `keys/{q}` (máy tải lại giữa lúc trống dồn, hoặc lỗi mạng) thì `publishKey(q)`; lỗi thì thử lại sau 2 giây, không bật hộp thoại.
- **Bình chọn → quyết → chốt:** hết giờ (`renderClock` thấy còn 0 ms, một lần nhờ cờ `revealing`) gọi `endVote`: ghi `state` = decide, rồi `publishVotes(q)` đọc `answers/{q}` sau khi khóa và ghi `results/{q}`. `pick(i)` (bấm ô hoặc A–D, chỉ trong decide) ghi `state/pick`; bấm lại ô đang chọn không làm gì. `fifty` bỏ 2 ô sai (bỏ luôn `pick` nếu trùng); `advisor` ghi `state/advisor` = true. "Chốt đáp án"/Enter gọi `lockAnswer(pick)`: ghi `state` = closed, `state/final`, `questions/{q}/final`; trống dồn 1,6 giây; `publishKey(q)` ghi `keys/{q}`. Âm thanh khi lộ: `correct` nếu đúng, `wrong` nếu sai.
- **Kết thúc (`finish`):** ghi `keys` cả bộ, `final` = `{rows: [{key, text}], total}` (đáp án và chữ của đáp án từng câu), `state` = end.
- **`fitQuestion`:** sau mỗi câu mới và khi đổi cỡ cửa sổ, giảm biến `--fit` (bước 0,05, tối thiểu 0,45) cho tới khi tổng chiều cao các khối trong cột câu hỏi vừa chiều cao cột.
- **Hàng đợi lệnh:** mọi lệnh qua `act()` nối vào một chuỗi Promise; bấm nhanh liên tiếp không mất lệnh; mỗi lệnh tự kiểm phase. `act()` bỏ focus khỏi nút vừa bấm để Space không bấm lại nút đó.
- **Đồng hồ:** logic chạy 100 ms một lần (tích tắc, nhạc nhanh ở ≤ 10 giây, tự lộ đáp án), nhưng chỉ ghi vào trang khi giá trị hiển thị đổi: vòng `stroke-dashoffset` (chu vi 2π·52) đổi theo bước 250 ms và CSS chuyển mượt; đỏ và nảy nhịp ở ≤ 5 giây. Thanh thời gian trên điện thoại làm tương tự bằng `transform: scaleX`.
- **Phòng chờ:** một thẻ tên cho mỗi uid (`chipOf`), vì database trả `players` theo thứ tự khóa chứ không theo thứ tự vào.

## 6. Màn học sinh (`play.js`)

- Vào lớp: kiểm mã và tên; đọc `host` để biết phòng có thật; ghi `players/{uid}`; lưu tên; đặt `?room=`. Tải lại thì vào lại nếu `players/{uid}` còn.
- Theo dõi `meta`, `state`, `final`; theo câu: `questions/{q}`, `results/{q}`, `keys/{q}`, `answers/{q}/{uid}`.
- Chọn: ô được tô cam ngay; ghi `{choice, at: serverTimestamp()}` (gom chạm trong 400 ms, bỏ qua nếu trùng lựa chọn đang có). Server từ chối thì database tự rút lại lựa chọn và dòng ghi chú `#note` (dưới dòng trạng thái, không che kết quả) ghi "Chưa ghi được lựa chọn. Hãy chọn lại." (còn giờ) hoặc "Hết giờ, lựa chọn này không được ghi.".
- Có mặt: khi kết nối, điện thoại đặt `onDisconnect` ghi `players/{uid}/online` = false rồi ghi true.
- Kết quả hiện khi phase = closed và đã có `keys/{q}`; % hiện khi đã có `results/{q}`.
- Đồng hồ về 0 trước khi giáo viên kịp khóa thì các nút tự tắt.
- Cuối buổi đọc `keys` và câu trả lời của mình để tính "x/3"; hạng lấy từ `final.top` theo uid.

## 7. Luật thuần (`logic.js`)

`countAnswers` (bỏ lựa chọn bị loại), `percentages` (phần dư lớn nhất, tổng 100, bằng nhau thì phương án trước được làm tròn lên), `pickFifty` (Fisher–Yates trên các phương án sai, lấy 2), `remainingMs` (open: `endsAt` − giờ server; paused: `remainingMs`), `newRoomCode`, `validateBank`, `LETTERS`, `PHASE`.

## 8. Lớp ảo (`lop_ao.js`, chỉ bản thử)

Nút hiện khi `IS_LOCAL`. 30 app Firebase riêng, đăng nhập ẩn danh trong bộ nhớ, tên lần lượt từ 35 tên Việt. Mỗi câu: trả lời sau 1,2 giây + ngẫu nhiên tới 80% thời gian còn lại, theo `demoSpread` (trọng số đáp án đúng nhân 0,6–1,5 theo "năng lực" từng em); bị 50:50 loại thì chọn lại sau 0,8–4,8 giây; khi có tổ tư vấn, 35% số em đang sai đổi sang đáp án đúng sau 1,5–6,5 giây; ghi trễ bị từ chối thì bỏ qua.

## 9. Giao diện (`style.css`)

- Màu: nền `#05031a` → `#0c0838` → `#1d1466` với quầng tím `rgba(124, 58, 237)` hai bên và `rgba(130, 90, 255)` phía trên; viền bạc `#eef3ff` → `#8ea6e6`; lòng khung `#1d2678` → `#0e1352` → `#070a33`; chữ `#ffffff` / `#d6e0ff` / `#a9b6e8`; vàng `#ffc93c` / `#e0a412`; cam `#ffab2e` / `#e06a00`; xanh lá `#43d66b` → `#0f7f31`; đỏ `#ef4444` / `#a3141d`. Font Be Vietnam Pro 400–900.
- Sân khấu: chùm tia `repeating-conic-gradient` lắc chậm 30 giây (`will-change: transform`), vòng sáng elip dưới sàn, vài đốm sao nhấp nháy. Khi `body.suspense`: nền tối còn 35%, các ô đáp án nhấp nháy độ sáng.
- **Khung vát góc** (`.question`, `.ans`, `.badge`): chính phần tử là gradient bạc, `::before` cách mép 2 px là lòng khung, cả hai cắt bằng cùng `clip-path` 8 cạnh (góc `--c`: câu hỏi 22 px, đáp án 14 px, điện thoại 12–14 px). Quầng sáng đặt trên phần tử cha (`.main-col`, `.qwrap`, `.answers`) bằng `filter: drop-shadow`, vì `clip-path` cắt mất bóng của chính phần tử.
- Ô đáp án: nhãn "A:" vàng; trạng thái `removed` (mờ, giấu chữ), `chosen` (cam), `correct` (xanh lá, nháy 4 lần, chữ trắng có bóng), `wrong-mine` (đỏ); `.fill` chạy theo % bằng `transform: scaleX` trong 1 giây (không làm trình duyệt dàn trang lại).
- Thang câu: dòng chữ không khung, số vàng; bậc đang chơi là thanh cam hai đầu nhọn (`clip-path` 6 cạnh).
- Dải mất kết nối `.net-banner` đỏ ở đáy màn hình. Nút trên điện thoại: `touch-action: manipulation`, không chọn chữ. `prefers-reduced-motion` tắt các chuyển động lặp.
- Màn giáo viên co theo `font-size: clamp(14px, 1.15vw, 22px)`; lưới hai cột (câu hỏi | cột 17em: đồng hồ, "Đã bình chọn x/y" rồi "x phiếu bình chọn" rồi "Chính xác!"/"Chưa chính xác", trợ giúp, thang câu "Câu 1–3") với hàng `minmax(0, 1fr)` để cột câu hỏi không tự giãn quá màn hình. Phòng chờ co theo chiều cao (`vh`): logo, mã QR, mã phòng, danh sách tên (tối đa 14vh, cuộn). Màn kết thúc: 3 dòng, mỗi dòng một câu.
- Bẫy đã gặp: `.stage-bg` phải nằm ngoài luật `body > *` (nếu không nó chiếm một hàng lưới và đẩy cả màn xuống); khung câu hỏi là grid nên nội dung phải bọc một `span` (nếu không mỗi đoạn chữ và công thức thành một hàng); chữ dùng `background-clip: text` cần `line-height` 1.3 để dấu không bị cắt; biểu tượng âm thanh là SVG (không có font emoji thì emoji hiện ô trống).

## 10. Kiểm thử

- `test/logic.test.mjs` (7): % cộng 100 (cả 1/3), phương án 0 lượt không được làm tròn lên, không ai bình chọn thì 0%, phiếu cho ô bị loại không được đếm, 50:50 luôn bỏ đúng 2 phương án sai, đồng hồ đứng khi dừng, bộ câu mẫu hợp lệ và giữ đáp án của đề, hết giờ bình chọn thì đồng hồ hiện 0.
- `test/rules.test.mjs` (8, trên emulator): không chiếm được phòng hay đặt mã sai dạng; học sinh không ghi được `state`, `questions`, `keys`, `results`, `lifelines`, `final`; không đọc được danh sách lớp và câu trả lời của bạn, không ghi hộ; chỉ trả lời khi open (trong giờ) hoặc paused, đúng câu hiện tại; không chọn được phương án bị loại; `choice` nguyên 0–3, `at` là giờ server, tên 1–24 ký tự, phải vào phòng mới trả lời; đáp án không có trên server trước khi hết giờ; chưa đăng nhập không đọc được gì. Nới luật 50:50 thì bài tương ứng báo hỏng. Test gọi `process.exit()` cuối cùng vì Auth giữ bộ hẹn giờ làm mới token.
- `test/rules.test.mjs` thêm 2 bài: không nhét được trường lạ vào câu trả lời hay tên, không ghi lại câu trả lời trong vòng 250 ms, `online` phải true/false; phòng chưa quá một ngày không chiếm được, `createdAt` giả bị từ chối.
- `test/serve.test.mjs` (2): `/%00`, mã hóa hỏng, `..` không làm sập hay lọt ra ngoài; trang quản trị emulator trả 404.
- `test/theme.test.mjs` (5): không có theme thì không đổi gì; ô hợp lệ trỏ đúng vào `theme/`; tên file có thư mục, đường dẫn ngược, dấu ngoặc, địa chỉ web hay đuôi lạ bị từ chối (nên không chèn được CSS); ô lạ và màu sai bị báo, không áp dụng; file theme hỏng bị báo.
- `tool/robust.mjs` (9 tình huống, 62 học sinh): tên chứa HTML hiện nguyên chữ; 62 thẻ tên; điện thoại tải lại giữa câu giữ lựa chọn; học sinh vào muộn trả lời được; mất mạng hiện và tự ẩn dải báo; máy giáo viên tải lại giữa câu, rồi tải lại đúng lúc trống dồn, đáp án vẫn được công bố; chọn lúc mất mạng rồi có mạng lại sau giờ thì bị từ chối và không làm sai số đếm; điểm học sinh vào muộn đúng; không có hộp thoại nào bật lên.
- `tool/layout.mjs`: câu hỏi rất dài, đáp án có phân số, câu rất ngắn, tên học sinh 25 ký tự; màn chiếu 1280 × 720, 1366 × 768, 1600 × 900, 1920 × 1080 và điện thoại 320 × 568, 360 × 640, 390 × 844, 768 × 1024; cả lúc đang chạy và lúc hiện kết quả, cả phòng chờ và tổng kết: không khối nào tràn xuống thanh nút, không cuộn ngang, chữ không tràn khung, logo điện thoại không vỡ dòng.
- `tool/perf.mjs`: CPU chậm 4 lần (máy giáo viên) và 6 lần (điện thoại), 30 học sinh: luồng chính bận dưới 50% cả lúc đếm giờ và lúc lộ đáp án (đo được khoảng 12–25%, phần JavaScript 0–6%).
- Lượt chạy thử theme: `python3 tool/make_test_theme.py /tmp/trangrua_lop/theme_test`, `THEME_DIR=/tmp/trangrua_lop/theme_test PORT=8791 node tool/serve.mjs`, rồi `BASE=http://127.0.0.1:8791 EXPECT_THEME=1 node tool/e2e.mjs /tmp/trangrua_lop/shots_theme`. Kiểm thêm: dòng "Giao diện riêng: 11 ảnh, 9 âm thanh, 2 màu.", logo thay chữ tiêu đề và hiện ở phòng chờ, khung câu hỏi/đáp án/bậc/nút trợ giúp/nền lấy từ theme trên cả hai màn, và 9 âm thanh của theme đều được phát đúng lúc (trang ghi lại mọi file âm thanh được gọi).
- `tool/e2e.mjs`: màn giáo viên 1600 × 900, một điện thoại 390 × 844 tên "Minh Anh", 30 học sinh ảo. Kiểm: màn chuẩn bị không lộ đáp án và không có mức dễ/khó; phòng chờ mỗi học sinh một thẻ; nút giáo viên chỉ gồm Bắt đầu, (Tạm dừng, Chốt đáp án, Câu tiếp), lớp ảo, Phòng mới; khi đang bình chọn chưa chọn ô và chưa dùng trợ giúp được. Câu 1: % trực tiếp, tạm dừng (đồng hồ đứng), học sinh đổi phiếu lúc dừng; hết giờ: dải "HẾT GIỜ BÌNH CHỌN", chưa lộ đáp án, nút chốt tắt; người chơi chọn B, rồi vẫn dùng 50:50 (không bỏ B) và tổ tư vấn, ô B vẫn được chọn; bấm lại B không chốt; không có dòng nguồn đề; "Chốt đáp án" → "Chính xác!", điện thoại "Chính xác! Đáp án là B.". Câu 2: chọn B bằng phím, chốt bằng Enter → B đỏ, "Chưa chính xác. Đáp án đúng là A.". Câu 3: chọn C rồi đổi B, chốt. "Kết thúc": "KẾT THÚC", 3 dòng đáp án; trên màn kết thúc và màn điện thoại không có chữ "cô" hay "lớp"; không có lỗi JavaScript nào.

## 11. Giao diện riêng (theme)

Hướng dẫn cho người dùng: `public/theme/HUONG_DAN.md`; mẫu đủ mọi ô: `public/theme/theme.mau.json`.

- **Cách nạp:** cả hai màn tải `theme/theme.json` (`cache: no-store`) lúc mở trang; không có file thì giữ giao diện mặc định. Màn Chuẩn bị hiện "Giao diện: mặc định." hoặc "Giao diện riêng: x ảnh, y âm thanh, z màu[, 1 font]." kèm lỗi của từng ô sai.
- **11 ô ảnh:** `logo`, `background`, `question`, `answer`, `answerChosen`, `answerCorrect`, `answerWrong`, `ladder`, `ladderNow`, `fifty`, `advisor`. Ảnh viết dạng tên file (co giãn 100% × 100% theo khung) hoặc `{file, edge, edgeWidth}` (CSS `border-image`: hai đầu rộng `edge` px trên ảnh gốc giữ nguyên hình, vẽ rộng `edgeWidth` em, phần giữa kéo giãn). Logo chèn vào `.brand.site` và `img.theme-logo` ở phòng chờ, thay logo "Trạng Rùa thi đấu". Nền ẩn `.stage-bg`.
- **11 ô âm thanh** (chỉ màn giáo viên): `start`, `countdown` (lặp, chạy khi phase open), `drumroll` (trống dồn trước khi lộ đáp án), `tick`, `pause`, `timeUp` (khóa: hết giờ bình chọn hoặc chốt), `fifty`, `advisor`, `correct` (lộ đáp án, chốt đúng), `wrong` (lộ đáp án, chốt sai), `final` (kết thúc). Không khai báo thì dùng tiếng tự tạo.
- **7 ô màu** ghi đè biến CSS: `text` → `--text`, `muted` → `--muted`, `accent` → `--gold`, `highlight` → `--amber`, `correct` → `--green`, `wrong` → `--red`, `line` → `--line`. **Font:** một file, đặt tên họ `ThemeFont`.
- **An toàn:** tên file chỉ chấp nhận chữ, số, `.`, `_`, `-` và đuôi đúng loại, không thư mục con; màu chỉ chấp nhận `#…`, `rgb(…)`, `hsl(…)`. Vì vậy nội dung `theme.json` không chèn được CSS hay trỏ ra ngoài thư mục.
