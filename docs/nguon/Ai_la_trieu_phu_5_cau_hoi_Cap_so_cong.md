# AI LÀ TRIỆU PHÚ – ÔN TẬP CẤP SỐ CỘNG

> **Tài liệu chốt nội dung** dành cho AI xây dựng website tương tác phục vụ hoạt động mở đầu (khoảng 10 phút) của bài **Cấp số nhân**.
>
> **Trạng thái:** Đã chốt đủ 5 câu hỏi và đáp án. **Không tự ý sửa nội dung toán học, thứ tự đáp án hoặc đáp án đúng.**

## 1. Ý tưởng và cách tổ chức

- **Hình thức:** Trò chơi theo phong cách chương trình *Ai là triệu phú*.
- **Người chơi trên ghế nóng:** Giáo viên.
- **Khán giả trường quay:** Toàn bộ học sinh trong lớp.
- **Cách tham gia:** Ở mỗi câu hỏi, giáo viên sử dụng quyền **“Hỏi ý kiến khán giả”**. Mỗi học sinh suy nghĩ và đồng loạt giơ thẻ A/B/C/D; giáo viên dựa trên ý kiến khán giả để **chốt đáp án**.
- **Mục tiêu kiến thức:** Ôn tập định nghĩa/nhận diện cấp số cộng, công sai, hệ thức truy hồi, số hạng tổng quát và tính chất ba số hạng liên tiếp.
- **Yêu cầu về độ khó:** Câu hỏi ngắn, mức nhận biết–thông hiểu, có phương án nhiễu hợp lý; **không cần giấy nháp**, không yêu cầu giải bài toán nhiều bước.
- **Mốc thưởng:** 50.000đ → 100.000đ → 250.000đ → 500.000đ → 1.000.000đ. Đây là **tiền thưởng giả định trong trò chơi**, không phải tiền thật.

### Luồng tương tác cho từng câu trên website

1. Hiển thị mốc thưởng, câu hỏi và bốn phương án A/B/C/D; **chưa hiển thị đáp án đúng**.
2. Giáo viên bấm nút **“Hỏi ý kiến khán giả”**; học sinh chọn và giơ thẻ đáp án cùng lúc.
3. Giáo viên quan sát, có thể hỏi nhanh một học sinh giải thích nếu cần, sau đó chọn phương án muốn **chốt** trên website.
4. Giáo viên bấm **“Chốt đáp án”**, rồi **“Công bố đáp án”** để hiện đáp án đúng và lời giải thích ngắn.
5. Giáo viên chủ động bấm **“Câu tiếp theo”**; không tự động chuyển câu.

**Lưu ý:** Không tự tạo tỷ lệ bình chọn phần trăm giả. Nếu website không thu phiếu trực tiếp từ thiết bị của học sinh, chỉ hiển thị thông báo “Khán giả hãy giơ thẻ A/B/C/D”, không mô phỏng kết quả thống kê. Nếu người chơi chốt sai, trò chơi vẫn tiếp tục để phục vụ mục tiêu ôn tập.

---

## 2. Bộ 5 câu hỏi đã chốt

### Câu 1 – 50.000 đồng

**Chủ đề:** Nhận diện cấp số cộng.

**Câu hỏi:** Dãy số nào dưới đây là một cấp số cộng?

- **A.** \(1;\ 2;\ 4;\ 8;\ 16\)
- **B.** \(1;\ 4;\ 9;\ 16;\ 25\)
- **C.** \(8;\ 5;\ 2;\ -1;\ -4\)
- **D.** \(2;\ 3;\ 5;\ 8;\ 13\)

**Đáp án đúng: C.**

**Giải thích sau khi công bố:** Hiệu của hai số hạng liên tiếp luôn bằng \(-3\), nên dãy ở phương án C là một cấp số cộng.

---

### Câu 2 – 100.000 đồng

**Chủ đề:** Công sai (chú ý thứ tự phép trừ).

**Câu hỏi:** Cho cấp số cộng \((u_n)\) thỏa mãn

\[
u_n-u_{n+1}=5,\quad \forall n\ge 1.
\]

Công sai của cấp số cộng này bằng bao nhiêu?

- **A.** \(5\)
- **B.** \(-5\)
- **C.** \(\dfrac{1}{5}\)
- **D.** Không xác định được

**Đáp án đúng: B.**

**Giải thích sau khi công bố:** Công sai là \(d=u_{n+1}-u_n\). Vì \(u_n-u_{n+1}=5\) nên \(d=-5\).

**Dụng ý sư phạm:** Phương án A là bẫy khi học sinh không để ý thứ tự phép trừ.

---

### Câu 3 – 250.000 đồng

**Chủ đề:** Hệ thức truy hồi.

**Câu hỏi:** Dãy số \(10;\ 7;\ 4;\ 1;\ -2;\ldots\) được xác định bởi hệ thức truy hồi nào dưới đây?

- **A.** \(u_1=10;\quad u_{n+1}=u_n+3\)
- **B.** \(u_1=7;\quad u_{n+1}=u_n-3\)
- **C.** \(u_1=10;\quad u_{n+1}=3u_n\)
- **D.** \(u_1=10;\quad u_{n+1}=u_n-3\)

*Các hệ thức truy hồi được xét với \(n\ge 1\).*

**Đáp án đúng: D.**

**Giải thích sau khi công bố:** Dãy bắt đầu bằng \(u_1=10\); mỗi số hạng sau ít hơn số hạng trước \(3\) đơn vị nên \(u_{n+1}=u_n-3\).

---

### Câu 4 – 500.000 đồng

**Chủ đề:** Công thức số hạng tổng quát.

**Câu hỏi:** Cho cấp số cộng có số hạng đầu \(u_1=5\) và công sai \(d=-2\). Công thức số hạng tổng quát của cấp số cộng là:

- **A.** \(u_n=5-2(n-1)\)
- **B.** \(u_n=5-2n\)
- **C.** \(u_n=5\cdot(-2)^{n-1}\)
- **D.** \(u_n=5+2(n-1)\)

**Đáp án đúng: A.**

**Giải thích sau khi công bố:** Áp dụng \(u_n=u_1+(n-1)d\), ta được \(u_n=5-2(n-1)\).

---

### Câu 5 – 1.000.000 đồng

**Chủ đề:** Tính chất của ba số hạng liên tiếp.

**Câu hỏi:** Cho ba số hạng liên tiếp \(u_4,u_5,u_6\) của một cấp số cộng. Đẳng thức nào dưới đây luôn đúng?

- **A.** \(u_5^2=u_4\cdot u_6\)
- **B.** \(u_5=u_4+u_6\)
- **C.** \(2u_5=u_4+u_6\)
- **D.** \(u_6=u_4+u_5\)

**Đáp án đúng: C.**

**Giải thích sau khi công bố:** Trong cấp số cộng, mỗi số hạng ở giữa bằng trung bình cộng của hai số hạng liền kề: \(u_5=\dfrac{u_4+u_6}{2}\).

**Chi tiết để dẫn bài mới:** Giữ lại phương án A \(u_5^2=u_4u_6\) làm yếu tố gợi mở, **không nói rằng phương án A là tính chất của cấp số cộng**.

---

## 3. Bảng đáp án nhanh (chỉ dành cho giáo viên / cấu hình website)

| Câu | Mốc thưởng | Chủ đề | Đáp án đúng |
|---|---:|---|:---:|
| 1 | 50.000đ | Nhận diện cấp số cộng | **C** |
| 2 | 100.000đ | Công sai | **B** |
| 3 | 250.000đ | Hệ thức truy hồi | **D** |
| 4 | 500.000đ | Số hạng tổng quát | **A** |
| 5 | 1.000.000đ | Tính chất ba số hạng liên tiếp | **C** |

**Yêu cầu triển khai:** Bảng này và tất cả các lời giải thích phải được ẩn trong giao diện học sinh cho đến khi giáo viên chủ động công bố đáp án của từng câu.

## 4. Màn chuyển tiếp vào bài mới (sau câu 5)

Sau khi công bố đáp án **C** ở câu 5, giáo viên có thể nhắc lại lựa chọn **A**:

> “Chúng ta vừa biết trong cấp số cộng, số hạng đứng giữa bằng trung bình cộng của hai số hạng hai bên. Vậy đẳng thức ở phương án A, \(u_5^2=u_4u_6\), có gợi ra một quy luật khác không?”

Website hiển thị dãy số:

\[
2\quad\longrightarrow\quad4\quad\longrightarrow\quad8
\]

**Câu hỏi mở:** “Đây không phải cấp số cộng. Vậy các số hạng được tạo ra theo quy luật nào?”

**Dự kiến phản hồi học sinh:** Mỗi số hạng bằng số hạng ngay trước nhân với \(2\); đồng thời \(4^2=2\cdot8\).

Website chuyển sang màn tiêu đề:

# BÀI MỚI: CẤP SỐ NHÂN

> Đây là màn dẫn nhập, không tính là câu hỏi thứ 6 và không có tiền thưởng. Chỉ hiển thị sau khi giáo viên chủ động chuyển màn.

## 5. Lưu ý khi giao cho AI lập trình website

- Giữ nguyên **từng chữ, ký hiệu toán, bốn phương án A/B/C/D, thứ tự câu hỏi, đáp án và mốc thưởng** trong Mục 2.
- Sử dụng hiển thị công thức toán học rõ nét (chẳng hạn KaTeX/MathJax); chỉ số dưới, số mũ, dấu trừ và phân số phải chính xác.
- Giao diện trình chiếu **16:9**, chữ lớn, tương phản tốt, phong cách gameshow *Ai là triệu phú*; không cần tái tạo nguyên xi logo/thương hiệu chương trình.
- Các nút cần có: **Hỏi ý kiến khán giả**, **Chọn A/B/C/D**, **Chốt đáp án**, **Công bố đáp án**, **Câu tiếp theo**, **Quay lại**, **Bắt đầu lại**.
- **Không hiển thị trước đáp án đúng**, không tự động nhảy câu, không tự tạo số liệu thăm dò.
- Thời lượng mục tiêu: khoảng **10 phút** cho cả phần ôn tập và dẫn nhập bài mới.
