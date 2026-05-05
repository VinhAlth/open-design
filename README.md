<div align="center">
  <h1>✨ Design AI</h1>
  <p><strong>Nền tảng Thiết kế và Lập trình Giao diện (UI) dựa trên Trí tuệ Nhân tạo</strong></p>
  <p><em>Một phiên bản tối giản và chuyên biệt hóa từ dự án mã nguồn mở <a href="https://github.com/nexu-io/open-design">Open Design</a></em></p>
</div>

---

## 🌟 Giới thiệu Dự án & Mục đích

**Design AI** là một hệ thống mạnh mẽ giúp chuyển đổi ngôn ngữ tự nhiên thành mã nguồn giao diện (HTML/CSS/JS/React) ngay lập tức. Dự án này là một bản phân nhánh (fork) và tùy biến sâu từ dự án gốc **[Open Design](https://github.com/nexu-io/open-design)**. 

**Tại sao phiên bản này ra đời?**
Thay vì giữ lại toàn bộ hệ sinh thái đa tác vụ phức tạp của bản gốc, phiên bản này được tạo ra dành riêng cho những ai muốn tự host (triển khai cá nhân/doanh nghiệp) một công cụ AI tạo UI cực kỳ đơn giản. Những thay đổi chính mà chúng tôi đã thực hiện trên mã nguồn gốc bao gồm:
1. **Lược bỏ các thành phần dư thừa:** Dẹp bỏ hệ thống luồng Agent phức tạp, chỉ tập trung 100% vào việc Thiết kế Web UI.
2. **Đơn giản hóa giao diện (Clean UI):** Loại bỏ các nút bấm và menu không cần thiết để tạo ra trải nghiệm tối giản nhất.
3. **Bản địa hóa (Localization):** Dịch thuật và tích hợp giao diện Tiếng Việt hoàn chỉnh.
4. **Hệ thống "My Team" (Mặc định):** Bổ sung cấu hình nhà cung cấp AI trung tâm (My AI / Proxy), giấu API Key ở Backend để chủ server có thể chia sẻ công cụ cho đội nhóm sử dụng chung mà không lộ Key.
5. **Cài đặt 1-Click (1-Click Deploy):** Tích hợp Script tự động cấu hình Nginx, SSL, SystemD, giúp bất kỳ ai cũng có thể triển khai hệ thống Open Design thu gọn này lên Domain riêng chỉ với một câu lệnh.

Chúng tôi không nhận quyền sở hữu lõi kiến trúc, dự án này chỉ đóng vai trò là một **bản tinh chỉnh chuyên biệt** để phục vụ tốt nhất cho cộng đồng thiết kế UI và những người muốn tự host máy chủ riêng.

---

## 🚀 Các Tính Năng Cốt Lõi

- **Tối Ưu Hóa Cho UI/UX:** Giao diện người dùng được tinh chỉnh, thân thiện và bằng Tiếng Việt.
- **Bảo Mật Bằng Proxy Phía Máy Chủ:** Khóa API của nhà cung cấp (OpenAI, Anthropic, v.v.) được lưu trữ an toàn trong biến môi trường tại Backend. Trình duyệt của người dùng cuối hoàn toàn không có quyền truy cập vào thông tin này.
- **Thiết Lập "My AI":** Cấu hình nhà cung cấp AI trung tâm với quyền ưu tiên cao nhất, hỗ trợ các mô hình ngôn ngữ hàng đầu (`gpt-5.4-nano`, `gpt-4o`, `claude-3-5-sonnet-latest`). Hỗ trợ người dùng tự nhập ID Model mong muốn.
- **Triển Khai Tự Động (1-Click Deploy):** Tích hợp sẵn Script Bash tự động cài đặt từ A-Z (Node.js, Pnpm, Nginx, SSL Let's Encrypt, và Systemd Service) chỉ với một dòng lệnh duy nhất.

---

## 🛠 Hướng dẫn Triển khai (Production Deployment)

Hệ thống được thiết kế để có thể được đưa lên môi trường Internet một cách cực kỳ nhanh chóng. Vui lòng làm theo các hướng dẫn chi tiết dưới đây.

### 1. Yêu cầu Hệ thống
- Máy chủ / VPS chạy hệ điều hành **Ubuntu Linux** (Khuyến nghị bản 20.04 LTS hoặc 22.04 LTS).
- Quyền quản trị tối cao (**Root**) trên máy chủ.
- Một **Tên miền (Domain)** đã được cấu hình bản ghi A trỏ về địa chỉ IP của máy chủ (VD: `design.your-domain.com`).

### 2. Tải Mã Nguồn
Truy cập vào máy chủ thông qua SSH và tiến hành tải mã nguồn:
```bash
git clone https://github.com/your-username/design-ai.git /root/design-ai
cd /root/design-ai
```

### 3. Cấu hình Tham số Cài đặt
Trước khi chạy cài đặt, bạn cần cấu hình tên miền của mình vào script tự động.
Mở tệp cài đặt:
```bash
nano deploy/setup_design_ai.sh
```
Tìm đến đoạn `# --- CONFIGURATION ---` và điều chỉnh:
- `DOMAIN="your-domain.com"` (Thay bằng tên miền thực tế của bạn).
- `APP_DIR="/root/design-ai"` (Thư mục bạn vừa clone mã nguồn về).

Lưu file bằng cách nhấn `Ctrl + O` $\rightarrow$ `Enter` $\rightarrow$ `Ctrl + X`.

### 4. Khởi chạy Cài đặt Tự động
Chỉ cần chạy một lệnh duy nhất dưới đây:
```bash
sudo bash deploy/setup_design_ai.sh
```
**Quy trình tự động sẽ thực hiện:**
- Cài đặt `pnpm` và các thư viện cần thiết.
- Biên dịch (Build) toàn bộ ứng dụng Frontend.
- Cài đặt Nginx và đăng ký chứng chỉ SSL HTTPS miễn phí.
- Tạo và kích hoạt dịch vụ hệ thống `design-ai.service` để đảm bảo ứng dụng luôn trực tuyến.

---

## 🔒 Hướng dẫn Thay đổi API Key (Bảo mật)

Sau khi cài đặt xong, ứng dụng đã chạy nhưng chưa có API Key để gọi AI. Việc cấu hình API Key được thực hiện bảo mật trên Server.

**Bước 1:** Mở tệp dịch vụ (SystemD Service) vừa được tạo:
```bash
sudo nano /etc/systemd/system/design-ai.service
```

**Bước 2:** Di chuyển xuống cuối tệp, tìm khu vực `Environment=` và thay thế bằng khóa thực tế của bạn:
```ini
Environment=DEFAULT_OPENAI_API_KEY="sk-nhap-key-thuc-te-cua-ban-vao-day"
Environment=DEFAULT_OPENAI_BASE_URL="https://api.openai.com/v1"
Environment=DEFAULT_OPENAI_MODEL="gpt-5.4-nano"
```

**Bước 3:** Tải lại cấu hình hệ thống và khởi động lại dịch vụ:
```bash
sudo systemctl daemon-reload
sudo systemctl restart design-ai
```

Hoàn tất! Bạn có thể truy cập `https://your-domain.com` và tận hưởng hệ thống Design AI an toàn tuyệt đối.

---

## 📁 Cấu trúc Thư mục Triển khai (Dành cho Lập trình viên)

Các kỹ sư muốn tùy biến thêm có thể tham khảo cấu trúc các tệp tin hệ thống trong thư mục `deploy/`:
- `deploy/setup_design_ai.sh`: Mã kịch bản điều phối cài đặt hệ thống tổng thể.
- `deploy/nginx-design-ai.conf`: Mẫu cấu hình tường lửa Nginx, Routing và WebSocket Proxy.
- `deploy/design-ai.service`: Khai báo dịch vụ hệ thống, nơi định nghĩa cách thức ứng dụng khởi chạy và nạp biến môi trường.
- `apps/daemon/src/server.ts`: Trái tim Backend, chịu trách nhiệm nhận diện các kết nối "My AI" và tự động đính kèm API Key cấu hình phía máy chủ.

---

## 🙏 Ghi nhận & Lời cảm ơn (Acknowledgements)

Như đã đề cập, **Design AI** sẽ không thể thành hiện thực nếu thiếu đi nền tảng kiến trúc vững chắc từ dự án gốc. Chúng tôi muốn gửi lời tri ân sâu sắc nhất đến những nhà phát triển tại **Nexu IO**. 

Nếu bạn quan tâm đến dự án nền tảng với đầy đủ các tính năng phức tạp và hệ sinh thái đa tác vụ (Agents/Skills), vui lòng ghé thăm và ủng hộ dự án gốc tại:
🔗 **[nexu-io/open-design (Bản Gốc)](https://github.com/nexu-io/open-design)**
