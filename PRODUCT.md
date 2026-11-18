# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Static HTML, CSS, and vanilla JavaScript (`index.html`, `manifest.webmanifest`, `sw.js`, `icon.svg`), zero external runtime dependencies, deployable directly to Netlify or Vercel.

## Users

- **Chủ sở hữu trang web (cá nhân người Việt):** sử dụng hằng ngày trên máy tính và điện thoại như một trung tâm quản lý thời gian cá nhân (xem giờ, âm lịch, ngày lễ, đếm ngược sự kiện, hẹn giờ tập trung, ghi chú nhanh, theo dõi thói quen) đồng thời là trang web cá nhân định danh trên Internet.
- **Khách ghé thăm qua đường dẫn công khai:** xem hồ sơ giới thiệu, dự án, liên kết liên hệ của chủ trang và trải nghiệm trực tiếp bộ công cụ thời gian Việt – Quốc tế ngay trên trình duyệt.

## Product Purpose

Kết hợp **trung tâm thời gian cá nhân toàn diện cho người Việt** với **không gian hiện diện cá nhân trên web (Personal Hub & Portfolio)**. Thành công nghĩa là trang tải tức thì trên mọi thiết bị, dùng được cả khi mất mạng (PWA), giữ dữ liệu cá nhân an toàn kèm khả năng sao lưu/khôi phục giữa các máy, và thể hiện rõ cá tính của chủ sở hữu.

## Positioning

Khác với trang bio-link tĩnh hay các ứng dụng lịch rời rạc cần đăng nhập tài khoản đám mây, **Mốc** tích hợp thuật toán Âm lịch Hồ Ngọc Đức, ngày lễ đa quốc gia, đếm ngược, thói quen, tiện ích tính ngày và hồ sơ cá nhân trong một ứng dụng web siêu nhẹ duy nhất, hoạt động tức thì không cần backend.

## Operating Context

- Mở thường xuyên như trang khởi đầu trình duyệt (new tab / start page) hoặc cài làm ứng dụng PWA trên màn hình chính điện thoại.
- Tra cứu nhanh ngày âm/dương, giờ họp đa múi giờ, đếm ngược Tết và các cột mốc quan trọng.
- Chia sẻ đường link công khai (`.netlify.app` / `.vercel.app`) cho bạn bè, đồng nghiệp hoặc đối tác.

## Capabilities and Constraints

- Giữ nguyên cấu trúc siêu nhẹ thuần HTML + CSS + JS, không dùng framework hay thư viện ngoài; font chữ tải từ Google Fonts (`Space Grotesk` và `Fraunces`).
- Hỗ trợ song ngữ **Tiếng Việt (mặc định)** và **English** thông qua cơ chế dịch trực tiếp trên giao diện.
- Lưu dữ liệu cá nhân bằng `localStorage` (tiền tố `moc_`), bổ sung tính năng **Sao lưu / Khôi phục file `.json`** và **Xuất bản HTML mang hồ sơ mặc định** để chủ trang dễ dàng cập nhật thông tin cá nhân cố định khi đưa lên mạng.
- 12 bộ giao diện màu (cả sáng và tối) đảm bảo độ tương phản dễ đọc trên mọi thẻ.
- Nội dung mẫu trong phần Hồ sơ / Dự án phải được ghi chú rõ là nội dung minh họa có thể chỉnh sửa trực tiếp, không tự ý bịa đặt thành tích hay thông tin cá nhân chưa xác nhận.

## Brand Commitments

- Tên gọi: **Mốc – Trung tâm thời gian & Không gian cá nhân**.
- Ngôn ngữ thị giác Neo-brutalism thân thiện: đường viền mực đậm rõ nét, đổ bóng khối sắc sảo, bảng màu giàu cá tính, hệ thống biểu tượng vector đồng bộ nét vẽ với biểu tượng đồng hồ Mốc và chiếc ghim đỏ đặc trưng.

## Evidence on Hand

- Mã nguồn gốc: `Mốc – Trung tâm thời gian (1).html` và tài liệu kỹ thuật `MOC_README.md`.
- Thông tin cá nhân chi tiết của chủ trang (tiểu sử, danh sách dự án thật, liên kết mạng xã hội thật) chưa được cung cấp cố định: trang cung cấp trình chỉnh sửa trực tiếp ngay trên giao diện kèm dữ liệu mẫu được gắn nhãn rõ ràng để người dùng điền nội dung thật.

## Product Principles

1. **Mở là dùng ngay:** Không màn hình chờ, không bắt đăng nhập; mọi thông tin quan trọng nhất trong ngày hiện diện ngay khung nhìn đầu tiên.
2. **Bản sắc Việt chuẩn xác:** Âm lịch, can chi, ngày lễ truyền thống và câu trích dẫn văn hóa luôn hiển thị tự nhiên, hài hòa cùng chuẩn giờ quốc tế.
3. **Cá nhân hóa bền vững:** Dữ liệu thuộc về người dùng — dễ tùy biến trên trình duyệt, dễ sao lưu sang thiết bị khác, và dễ đóng gói thành trang cá nhân công khai.
4. **Rõ ràng trên mọi giao diện:** Dù ở giao diện pastel ấm áp hay giao diện tối (Đêm neon, Terminal, Giấy mono), chữ và số liệu thời gian luôn sắc nét, thẳng hàng và dễ đọc trên cả máy tính lẫn điện thoại.
