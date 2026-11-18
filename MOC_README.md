# Mốc – Trung tâm thời gian

> File này dành cho AI/trợ lý đọc để hiểu app **Mốc** là gì, hoạt động ra sao và sửa ở đâu.

## 1. Tổng quan

- **Mốc** là một trang web một file (`moc.html`), chạy hoàn toàn trên trình duyệt, không cần server.
- Mục đích: trung tâm quản lý thời gian cá nhân cho người Việt. App có đồng hồ, lịch dương/âm, ngày lễ nhiều nước, đếm ngược, hẹn giờ, ghi chú, theo dõi thói quen và các tiện ích nhỏ.
- Giao diện kiểu "neo-brutalism dễ thương": viền đen dày, đổ bóng cứng, màu pastel, font **Space Grotesk** (giao diện) và **Fraunces** (câu trích dẫn).
- Hai ngôn ngữ: **Tiếng Việt (mặc định)** và **English**, đổi bằng nút `VI | EN` dưới menu trái.
- Trang đã xuất bản dạng artifact: https://claude.ai/artifact/QNU3RLYvYdDhHgQK9srn7L

## 2. Công nghệ và ràng buộc

- HTML + CSS + JavaScript thuần, **không dùng framework hay thư viện ngoài**. Chỉ tải font từ Google Fonts.
- Toàn bộ code nằm trong một file. Việc vẽ giao diện bằng template literal rồi gán `innerHTML`.
- Lưu dữ liệu bằng `localStorage`, key có tiền tố `moc_` (xem mục 6). Dữ liệu chỉ nằm trong trình duyệt của từng người.
- Trang xuất bản bị chặn gọi mạng ra ngoài. Nút "Đồng bộ online" (gọi `date.nager.at`) sẽ báo lỗi và quay về dữ liệu offline. Đây là hành vi bình thường.
- Không dùng `window.storage`, API Anthropic hay `window.claude`.
- Responsive: dưới 760px, menu chuyển thành thanh cuộn ngang ở đáy màn hình.

## 3. Các tab

| Tab | Chức năng |
|---|---|
| **Hôm nay** | Giờ lớn, ngày dương và âm, ngày lễ sắp tới (có đếm ngược), mốc đếm ngược gần nhất, giờ thế giới, câu ca dao/tục ngữ ngẫu nhiên (nút "Câu khác"), ghi chú đã ghim |
| **Giờ thế giới** | Thêm/xóa thành phố, tìm theo tên (bỏ dấu cũng được), hiện giờ, ngày và chênh lệch giờ |
| **Lịch** | Lịch tháng, mỗi ô có ngày âm. Ô có sự kiện có chấm đỏ. Bấm ngày để xem chi tiết, ghim đếm ngược, thêm sự kiện riêng |
| **Ngày lễ** | Chọn nước (VN, Anh, Pháp, Đức, Mỹ, Nhật, Hàn, Trung, Quốc tế), danh sách ngày lễ sắp tới, nút Ghim |
| **Đếm ngược** | Thêm mốc có giờ, có nhắc trước (đúng giờ, 1 giờ, 1 ngày, 1 tuần), có âm báo |
| **Hẹn giờ** | Hẹn giờ lùi, có các nút chọn nhanh 1/5/10/25/45 phút |
| **Ghi chú** | Ghi chú có ngày tùy chọn, có thể ghim lên tab Hôm nay |
| **Thói quen** | Theo dõi 7 ngày gần nhất, tính chuỗi liên tiếp (streak) |
| **Tiện ích** | Đổi dương ↔ âm, tính khoảng cách và cộng/trừ ngày, tính tuổi (kèm can chi, cung hoàng đạo), bấm giờ, giờ họp đa múi giờ, xúc xắc và đồng xu, đếm ngược đến Tết |
| **Cài đặt** | 12 giao diện màu, chọn file âm báo (mp3), âm lượng, bật thông báo hệ thống |

## 4. Cấu trúc code (trong `moc.html`)

Thứ tự gần đúng từ trên xuống:

1. **CSS** trong thẻ `<style>`. Biến màu ở `:root` (`--bg --paper --ink --line --c1..c4 --spot`).
2. **Tiện ích**: `$`, `pad`, `esc`, `LS` (bọc `localStorage` có try/catch).
3. **`THEMES` / `applyTheme`**: 12 bộ màu, mỗi bộ gồm 10 giá trị `bg,paper,ink,line,c1,c2,c3,c4,spot,dot`.
4. **Âm lịch**: thuật toán Hồ Ngọc Đức (múi giờ +7). Hàm chính `lunar(d,m,y)` trả `[ngày, tháng, năm, nhuận]`. Có `canchi()` cho can chi.
5. **Ngày lễ**:
   - `FIX`: ngày lễ cố định, mỗi dòng dạng `"ngày-tháng Tên"`.
   - `LUN`: ngày lễ âm lịch của Việt Nam.
   - `movable(y)`: ngày lễ di động (Phục sinh, Thanksgiving, Labor Day, MLK Day…).
   - `holidaysOn(date)`, `upcoming(n, days)`: lấy ngày lễ theo ngày và theo khoảng sắp tới.
6. **Dữ liệu người dùng và âm thanh**: `cds` (đếm ngược), `notes`, `pins` (thành phố), `habits`, `beep()`, `ring()`, `toast()`.
7. **Giao diện**: `TABS`, `nav()`, và đối tượng `V` chứa mỗi tab là một hàm trả về chuỗi HTML (`today, world, cal, hol, cd, tm, note, habit, tool, set`). `draw()` vẽ lại tab hiện tại, `tick()` chạy mỗi giây để cập nhật đồng hồ và đếm ngược.
8. **Trình xử lý sự kiện**: một `document.addEventListener('click')` lớn, phân nhánh theo thuộc tính `data-*` của nút (ví dụ `data-pin`, `data-addcd`, `data-lang`). Thêm nút mới thì thêm một nhánh `else if(d.xxx)`.
9. **Khối cuối file** (thêm sau): ngôn ngữ VI/EN, ô nhập ngày giờ, tooltip, thẻ vui (`funCards`).

## 5. Các cơ chế đặc biệt

### 5.1 Hai ngôn ngữ (VI/EN)

- Mã nguồn **viết bằng tiếng Việt**. Khi `lang=='en'`, hàm `tr(document.body)` duyệt các text node và thuộc tính `placeholder/aria-label/title`, rồi dịch **sau khi** vẽ (gọi trong `draw()` và mỗi giây trong `setInterval`).
- Dịch bằng hai thứ: bảng `EN` (khớp nguyên chuỗi tiếng Việt → tiếng Anh) và mảng `RX` (regex cho chuỗi có số, ví dụ `còn N ngày`).
- Riêng chú thích ngày lễ dùng `DESC` (VI) và `DEN` (EN), khóa là tên ngày lễ. Câu trích dẫn dùng `QUOTES` (VI, hơn 90 câu) và `QEN` (EN, khoảng 40 câu). Hàm `QL()` chọn mảng theo ngôn ngữ.
- Ngày tháng dùng `LOC()` trả `'vi-VN'` hoặc `'en-US'`.
- **Khi thêm chữ mới trong giao diện**: viết tiếng Việt trong code, rồi thêm cặp tương ứng vào `EN` (hoặc `RX` nếu chuỗi có biến). Nếu quên, chữ đó sẽ vẫn là tiếng Việt khi ở chế độ EN.

### 5.2 Ô nhập ngày và giờ

- Hàm `dfix()` thay mọi `<input type=date|time|datetime-local>` bằng ô gõ tay `dd/mm/yyyy` và `HH:MM` (24 giờ), vì ô gốc của trình duyệt hiện sai định dạng và cho nhập năm 6 chữ số.
- Ô thay thế được gắn lại thuộc tính `.value` để trả về dạng chuẩn `YYYY-MM-DD` (hoặc `HH:MM`, hoặc `YYYY-MM-DDTHH:MM`), nên code cũ đọc `$('#id').value` vẫn chạy. Nhập sai thì `.value` là chuỗi rỗng.
- Khi thêm ô ngày/giờ mới, cứ viết `<input type="date">` bình thường trong template, `dfix` sẽ tự thay.

### 5.3 Tooltip chú thích

- Phần tử có thuộc tính `data-tip` (chuỗi JSON `[[tên, mô tả, nước],…]`) sẽ hiện ô chú thích nhỏ theo con trỏ. Tạo thuộc tính bằng `tipAttr(danhSáchNgàyLễ, coTabindex)`.
- Hỗ trợ chuột, bàn phím (focus, Esc) và chạm (tự tắt sau 3,5 giây).

### 5.4 Ghim

- `PIN` (biểu tượng nhỏ trong nút) và `STICK` (ghim lớn cắm ở góc thẻ) là SVG vẽ tay, màu đỏ cố định, dùng ở mọi nơi có chữ "Ghim".

## 6. Dữ liệu lưu trong localStorage

Mỗi key có tiền tố `moc_`:

| Key | Nội dung |
|---|---|
| `theme` | Tên giao diện màu đang dùng |
| `lang` | `vi` hoặc `en` |
| `tab` | Tab đang mở |
| `ctry` | Mảng mã nước đã chọn xem ngày lễ (`VN, GB, FR, DE, US, JP, KR, CN, WW`) |
| `custom` | Sự kiện riêng: `{date, name, online?}` |
| `cds` | Đếm ngược: `{id, name, t(ms), lead(ms), fired}` |
| `notes` | Ghi chú: `{text, date, pin}` |
| `cities` | Danh sách múi giờ IANA đã ghim |
| `habits` | Thói quen: `{id, name, days:[YYYY-MM-DD]}` |
| `vol`, `mp3` | Âm lượng và file âm báo (dạng data URL) |

## 7. Cách sửa an toàn

- Thêm ngày lễ: thêm vào `FIX` (cố định) hoặc `LUN` (âm lịch) và `movable()` (di động). Nhớ thêm mô tả vào `DESC` và `DEN`, tên tiếng Việt vào `EN` nếu cần.
- Thêm câu trích dẫn: thêm `['nội dung', 'xuất xứ']` vào `QUOTES` (VI), và nếu có bản tiếng Anh thì thêm vào `QEN`.
- Thêm giao diện màu: thêm dòng vào `THEMES` (10 giá trị theo thứ tự ở mục 4.3), và tên vào `EN` nếu là tiếng Việt.
- Thêm tab: thêm vào `TABS`, thêm hàm cùng tên trong `V`, thêm chuỗi vào `EN`.
- Không dùng thư viện hay mạng ngoài. Không nhét dữ liệu nhạy cảm vào hash URL.
- Quy tắc chữ: dùng dấu nháy cong ’ và ngoặc kép cong “ ” trong **văn bản hiển thị**. Dùng nháy thẳng trong cú pháp code.

## 8. Việc còn dang dở / hạn chế đã biết

- Chế độ EN chỉ có khoảng 40 câu trích dẫn (trên 90 câu VI).
- Tên can chi (ví dụ "Bính Ngọ") giữ nguyên trong EN.
- Nút "Đồng bộ online" không chạy được trên trang xuất bản (bị chặn mạng).
- Dữ liệu chỉ lưu theo từng trình duyệt, không đồng bộ giữa các thiết bị.
