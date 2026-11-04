# Trạng Rùa thi đấu: đưa lên mạng

Bản đang chạy trên Cloud Desktop là bản thử. Nó dùng **Firebase Emulator** và chỉ nghe ở `127.0.0.1`, nên điện thoại thật chưa vào được. Code đã viết sẵn cho bản thật: trang tĩnh, cộng với Firebase Realtime Database và đăng nhập ẩn danh. Đưa lên mạng chỉ cần tạo project Firebase, điền cấu hình, triển khai luật truy cập và đặt thư mục `app/public/` lên một chỗ phục vụ trang tĩnh.

Thời gian ước tính: khoảng 1–2 giờ cho lần đầu.

## 0. Trước khi bắt đầu

| Việc | Vì sao |
|---|---|
| Quyền dùng nội dung câu hỏi | 5 câu hiện tại lấy từ tài liệu chốt nội dung của bạn (`docs/nguon/`). Nếu sau này thêm câu từ đề của Sở hay trường, cần xin phép nguồn. |
| **Xóa ảnh trong `app/public/theme/`** trừ `HUONG_DAN.md` và `theme.mau.json` | Thư mục này đang có ảnh chương trình truyền hình tải từ mạng. Mọi thứ trong `public/` đều bị đăng công khai. |

## 1. Chọn chỗ đặt trang

| | **Firebase Hosting (khuyên dùng)** | GitHub Pages |
|---|---|---|
| Thao tác | Một lệnh `firebase deploy`, cùng project với database | Tạo repo, bật Pages, đẩy code lên |
| Mã nguồn | Không phải công khai repo (người dùng vẫn tải được JavaScript của trang) | Repo miễn phí phải công khai |
| Địa chỉ | `https://<project-id>.web.app` | `https://<tên>.github.io/<repo>/` |
| Kiểm soát cache | Đặt được header trong `firebase.json` | Không đặt được header; trình duyệt có thể giữ bản cũ khoảng 10 phút |
| Chi phí | Gói miễn phí đủ dùng (trang chỉ khoảng 3,6 MB) | Miễn phí |

App chạy được ở cả hai. Link vào phòng được tính theo địa chỉ trang, nên vẫn đúng khi trang nằm trong thư mục con như `/repo/`.

## 2. Tạo project Firebase (một lần)

1. Vào https://console.firebase.google.com, tạo project, ví dụ `trangrua-thidau`. Không cần Google Analytics.
2. **Build → Authentication → Get started → Sign-in method → Anonymous → Enable.**
3. **Authentication → Settings → Authorized domains:** thêm tên miền sẽ đặt trang, ví dụ `<tên>.github.io`. Nếu dùng Firebase Hosting thì `<project-id>.web.app` đã có sẵn.
4. **Build → Realtime Database → Create database:**
   - Vị trí: **Singapore (asia-southeast1)**, gần Việt Nam nhất nên độ trễ thấp.
   - Chọn **locked mode**. Luật thật sẽ được triển khai ở bước 4.
5. **Project settings → General → Your apps → Web (</>):** đăng ký app, rồi chép đoạn `firebaseConfig`.

## 3. Điền cấu hình vào code

Mở `app/public/js/common.js` và thay `FIREBASE_CONFIG`:

```js
export const FIREBASE_CONFIG = {
  apiKey: '…',                       // từ firebaseConfig
  authDomain: '<project-id>.firebaseapp.com',
  projectId: '<project-id>',
  databaseURL: 'https://<project-id>-default-rtdb.asia-southeast1.firebasedatabase.app', // đúng URL ở trang Realtime Database
};
```

Cấu hình web của Firebase **được thiết kế để công khai**. Dữ liệu được bảo vệ bằng luật truy cập (`database.rules.json`), không phải bằng việc giấu đoạn này.

Ngoài localhost, trang tự bỏ phần emulator và nút "Thêm 30 học sinh ảo" (`IS_LOCAL` trong `common.js`).

## 4. Triển khai luật truy cập

```bash
cd ~/trangrua_thidau/app
npx firebase login                     # đăng nhập tài khoản Google sở hữu project
npx firebase use --add <project-id>    # đặt project mặc định (ghi vào .firebaserc)
npx firebase deploy --only database    # đẩy database.rules.json
```

Database ở khu vực Singapore có thể cần ghi rõ instance:

```json
"database": [{ "instance": "<project-id>-default-rtdb", "rules": "database.rules.json" }]
```

Trong Firebase Console → Realtime Database → Rules, kiểm tra luật đã đổi đúng. Luật mặc định là chặn hết; luật của app chỉ mở các nhánh `rooms/{mã}/…`.

## 5. Dựng và đặt trang

```bash
cd ~/trangrua_thidau/app
npm install
npm run build        # tạo public/build/ và public/vendor/
```

`tool/build.sh` chép font từ `~/turtor_app/assets/fonts`. Khi dựng ở máy khác thì font đã có sẵn trong `public/fonts/`; hãy bỏ dòng chép font đó, hoặc chép tay một lần.

### Cách A: Firebase Hosting

Thêm vào `firebase.json`:

```json
"hosting": {
  "public": "public",
  "ignore": ["theme/**/*.png", "theme/**/*.jpg", "theme/**/*.jpeg", "theme/**/*.webp", "**/.*"],
  "headers": [
    { "source": "**/*.@(html|js)", "headers": [{ "key": "Cache-Control", "value": "no-cache" }] }
  ]
}
```

Rồi chạy `npx firebase deploy --only hosting`. Trang sẽ ở `https://<project-id>.web.app/host.html`.

Header `no-cache` buộc trình duyệt hỏi lại server mỗi lần mở trang. Nhờ vậy, sửa xong deploy lại là giáo viên thấy bản mới ngay. Các file trong `build/` chưa có mã băm trong tên, nên header này là cần thiết.

### Cách B: GitHub Pages

1. Tạo repo, ví dụ `trangrua-thidau`, rồi đẩy nội dung `app/`. Không đẩy `node_modules/` (có thể dùng `.gitignore` với `node_modules/`, `public/theme/*.png`, `*.log`).
2. Repo → Settings → Pages → Source: **GitHub Actions**, rồi thêm file `.github/workflows/pages.yml`:

```yaml
name: pages
on: { push: { branches: [main] } }
permissions: { pages: write, id-token: write, contents: read }
jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: { name: github-pages }
    steps:
      - uses: actions/checkout@v4
      - uses: actions/upload-pages-artifact@v3
        with: { path: public }
      - uses: actions/deploy-pages@v4
```

`public/build/` và `public/vendor/` phải được commit, vì workflow này không chạy build. Nếu muốn CI tự build, thêm các bước `actions/setup-node` (Node 22), `npm ci` và `npm run build` (sau khi bỏ dòng chép font).

3. Thêm `<tên>.github.io` vào Authorized domains (bước 2.3). Trang sẽ ở `https://<tên>.github.io/trangrua-thidau/host.html`.

## 6. Thử trước khi dùng trong lớp

1. Máy tính mở `host.html` bằng Chrome, bấm "Tạo phòng".
2. Hai điện thoại, một dùng Wi-Fi trường và một dùng 4G, quét mã QR, nhập tên rồi bình chọn. Màn chiếu phải thấy % thay đổi ngay.
3. Tắt Wi-Fi một điện thoại vài giây: dải "MẤT KẾT NỐI" phải hiện rồi tự ẩn.
4. Chơi hết 5 câu, qua màn câu hỏi mở và màn bài mới.
5. Thử một iPhone (Safari) và một Android đời cũ. App chạy được từ iOS 14.5 và Android Chrome 64 trở lên.

Một số mạng trường chặn WebSocket. Firebase tự chuyển sang cách gọi thường (long polling) nên vẫn chạy, chỉ chậm hơn một chút.

## 7. Giới hạn và chi phí của Firebase

Các con số dưới đây có thể thay đổi; xem bảng giá hiện hành tại https://firebase.google.com/pricing trước khi quảng bá rộng.

| Hạng mục | Gói miễn phí (Spark) | Ý nghĩa với app |
|---|---|---|
| Kết nối Realtime Database cùng lúc | **100** | Mỗi học sinh, mỗi màn giáo viên là 1 kết nối, nên tối đa khoảng 2 lớp chơi cùng lúc. Đây là giới hạn chạm đầu tiên khi nhiều giáo viên dùng. |
| Dung lượng lưu | 1 GB | Mỗi phòng chỉ vài KB; phòng cũ không tự xóa nhưng mã phòng được dùng lại sau 24 giờ. |
| Tải xuống mỗi tháng | 10 GB | Một buổi chơi khoảng vài MB. |
| Hosting | 10 GB lưu, khoảng 360 MB tải mỗi ngày | Mỗi lượt mở trang tải khoảng 1–2 MB (font, KaTeX, mã). |

- **Nhiều lớp cùng lúc:** chuyển sang gói **Blaze** (trả theo mức dùng, cần thẻ). Giới hạn kết nối tăng lên 200.000 mỗi database. Với trò 5 câu, chi phí dự kiến rất thấp. Nên đặt cảnh báo ngân sách trong Google Cloud Billing.
- **Đăng nhập ẩn danh:** Firebase giới hạn số tài khoản tạo mới theo địa chỉ IP. Cả trường dùng chung một IP có thể chạm giới hạn khi nhiều lớp vào cùng lúc. Xem phần Quotas trong Authentication settings, và xin nâng nếu cần.

## 8. Bảo vệ khi đã công khai

- **Luật truy cập** (đã có và đã kiểm thử):
  - Học sinh không đọc được phiếu của người khác.
  - Không ghi được trạng thái trò chơi, và không bầu được sau khi khóa.
  - Không nhét được dữ liệu lạ, không ghi dồn dập (tối đa một lần mỗi 250 ms).
  - Không chiếm được phòng chưa quá 24 giờ.
- **Nên bật App Check** (reCAPTCHA v3) để chỉ trang của bạn gọi được database, chặn script phá phòng. Cách bật: Firebase Console → App Check → đăng ký web app → thêm `initializeAppCheck` vào `common.js` → bật "Enforce" cho Realtime Database.
- **Đáp án:** điện thoại học sinh chỉ nhận đáp án lúc công bố. Nhưng bộ câu được đóng gói trong `build/host.js`, nên ai mở mã nguồn trang giáo viên vẫn đọc được. Với trò khởi động 5 phút thì chấp nhận được. Muốn giấu hẳn thì xem `04_de_xuat_tuong_lai.md`, mục "Giấu đáp án".
- **Ai cũng mở được trang giáo viên và tạo phòng.** Phù hợp cho công cụ công khai. Muốn giới hạn thì thêm đăng nhập Google cho giáo viên (mục 04).

## 9. Trước mỗi buổi học (cho giáo viên)

1. Mở `host.html` bằng Chrome trên máy nối máy chiếu, bấm nút toàn màn hình, bật loa.
2. Bấm "Tạo phòng", để học sinh quét QR hoặc nhập mã 4 chữ số.
3. Chờ số học sinh trên màn chiếu đủ rồi bấm "Bắt đầu" (hoặc phím N).
4. Phím tắt:
   - Space: tạm dừng.
   - A–D: chọn ô.
   - Enter: chốt.
   - F: 50:50.
   - T: tổ tư vấn.
   - N: câu tiếp.
