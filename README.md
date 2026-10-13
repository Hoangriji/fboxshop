# 🛍️ Uside Shop (Fbox Shop) - E-Commerce Platform

> Nền tảng thương mại điện tử hiện đại chuyên cung cấp **Gaming Gear** (bàn phím cơ, switch, tai nghe, màn hình...) và **sản phẩm số (Digital Products)** với bảng điều khiển quản trị (Admin Dashboard) toàn diện và tích hợp Firebase realtime.

---

## 📑 Mục lục
- [Giới thiệu](#-giới-thiệu)
- [Tính năng nổi bật](#-tính-năng-nổi-bật)
  - [Giao diện người dùng (Storefront)](#1-giao-diện-người-dùng-storefront)
  - [Hệ thống quản trị (Admin Dashboard)](#2-hệ-thống-quản-trị-admin-dashboard)
- [Công nghệ sử dụng (Tech Stack)](#-công-nghệ-sử-dụng-tech-stack)
- [Cấu trúc thư mục](#-cấu-trúc-thư-mục)
- [Cài đặt & Khởi chạy](#-cài-đặt--khởi-chạy)
- [Biến môi trường (.env)](#-biến-môi-trường-env)
- [Scripts có sẵn](#-scripts-có-sẵn)
- [Kiến trúc & Luồng xử lý](#-kiến-trúc--luồng-xử-lý)

---

## 🌟 Giới thiệu

**Uside Shop** được xây dựng với mục tiêu mang lại trải nghiệm mua sắm trực tuyến mượt mà, tốc độ cao và thân thiện cho cộng đồng game thủ & người dùng yêu thích công nghệ. Hệ thống kết hợp giữa mô hình thương mại điện tử hiện đại với tính năng đặt hàng nhanh chóng qua Zalo và tự động phát hành hóa đơn qua email.

---

## ✨ Tính năng nổi bật

### 1. Giao diện người dùng (Storefront)
- **Trang chủ tương tác (Home Slide Presentation):** Thiết kế dạng slide cuộn mượt mà với Hero Banner động, danh mục nổi bật, sản phẩm hot và phần giới thiệu.
- **Bộ lọc sản phẩm thông minh (Advanced Filtering):**
  - Lọc theo phân loại vật lý (bàn phím cơ, switch, tai nghe, màn hình, thẻ nhớ/USB...) và sản phẩm kỹ thuật số.
  - Lọc chuyên sâu: Loại kết nối, form factor, LED, tấm nền màn hình, tần số quét, độ phân giải, thương hiệu...
- **Chi tiết sản phẩm (Product Details):**
  - Thư viện ảnh sản phẩm độ phân giải cao.
  - Bảng thông số kỹ thuật (Specs) chi tiết.
  - Đánh giá & review sản phẩm.
- **Phương thức thanh toán & Đặt hàng đa dạng:**
  - Mua hàng bằng VNĐ hoặc tiền tệ ảo nội bộ (Virtual currency).
  - Tải xuống trực tiếp đối với sản phẩm số miễn phí.
  - Đặt hàng & tư vấn nhanh qua Zalo một chạm (`openZaloImmediate`).
- **Danh sách yêu thích (Wishlist):** Lưu trữ trên `localStorage`, đồng bộ realtime với icon huy hiệu trên Header.
- **Hiệu ứng & Trải nghiệm (UI/UX):**
  - Hiệu ứng tương tác Click Spark sinh động.
  - Skeleton loading chống giật bố cục (CLS).
  - Tối ưu hóa Web Vitals với Vercel Speed Insights.

### 2. Hệ thống quản trị (Admin Dashboard - `/dashboard`)
- **Bảo mật truy cập:** Phân quyền đăng nhập quản trị viên qua `DashboardLogin`.
- **Tổng quan số liệu (Overview Analytics):** Thống kê đơn hàng, doanh số, trạng thái kho hàng với biểu đồ Ant Design Charts.
- **Quản lý sản phẩm (Product CRUD):** Thêm mới, chỉnh sửa thông số kỹ thuật động, tải ảnh trực tiếp lên Cloudinary/Firebase Storage.
- **Quản lý sản phẩm nổi bật & Hero:** Tùy chỉnh danh sách hiển thị trên trang chủ và thay đổi ảnh banner Hero ngay trên giao diện mà không cần sửa code.
- **Quản lý đơn hàng (Order Management):** Theo dõi trạng thái đơn hàng, xuất hóa đơn tự động và gửi hóa đơn HTML qua Email.
- **Công cụ nhập dữ liệu (Import Tools):**
  - Import sản phẩm hàng loạt từ file Excel (`.xlsx`).
  - Đồng bộ và cập nhật thông số bàn phím Akko tự động (`AkkoKeyboardUpdater`).

---

## 🛠 Công nghệ sử dụng (Tech Stack)

### Frontend
- **Core:** [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Vite](https://vitejs.dev/)
- **Routing:** [React Router v7](https://reactrouter.com/) (Code-splitting bằng `React.lazy` & `Suspense`)
- **State Management:** [Zustand](https://github.com/pmndrs/zustand)
- **Data Caching & Fetching:** [TanStack React Query v5](https://tanstack.com/query), [SWR](https://swr.vercel.app/)
- **Animation & UI:**
  - [Framer Motion (`motion`)](https://motion.dev/) & [GSAP](https://greensock.com/gsap/)
  - [Swiper](https://swiperjs.com/) (Product Sliders & Carousels)
  - [@ant-design/charts](https://ant-design-charts.antgroup.com/) (Biểu đồ thống kê)

### Backend & Cloud Services
- **Cơ sở dữ liệu:** [Firebase Cloud Firestore](https://firebase.google.com/docs/firestore) (Realtime subscriptions & pagination)
- **Lưu trữ file:** [Firebase Storage](https://firebase.google.com/docs/storage) & [Cloudinary](https://cloudinary.com/) (Tối ưu hóa ảnh & thumbnail CDN)
- **Email Service:** [Resend](https://resend.com/) kết hợp [@react-email/components](https://react.email/)
- **Serverless API:** [Vercel Functions](https://vercel.com/docs/functions)

---

## 📁 Cấu trúc thư mục

```text
fbox_shop/
├── api/                             # Serverless API endpoints (Vercel)
│   ├── send-invoice.ts              # API gửi hóa đơn qua email bằng Resend
│   └── akko-keyboard-import.ts      # API xử lý đồng bộ dữ liệu bàn phím Akko
├── public/                          # Static assets
├── src/
│   ├── assets/                      # Hình ảnh & icon tĩnh
│   ├── components/                  # UI Components dùng chung
│   │   ├── Button/                  # Nút bấm tái sử dụng
│   │   ├── Header/                  # Header thanh điều hướng, giỏ hàng/wishlist
│   │   ├── Footer/                  # Chân trang
│   │   ├── ProductCard/             # Card hiển thị sản phẩm
│   │   ├── ProductSlider/           # Slider hiển thị sản phẩm bằng Swiper
│   │   ├── Skeleton/                # Loading skeleton components
│   │   └── ClickSpark/              # Hiệu ứng spark click
│   ├── config/                      # Cấu hình Firebase & Cloudinary
│   ├── emails/                      # Template email hóa đơn viết bằng React Email
│   ├── hooks/                       # Custom React hooks (useCategories, useFeaturedProducts, v.v.)
│   ├── pages/                       # Các trang chính của ứng dụng
│   │   ├── HomePage/                # Trang chủ trình diễn slide
│   │   ├── ProductsPage/            # Danh sách & bộ lọc sản phẩm
│   │   ├── ProductDetailPage/       # Chi tiết sản phẩm & đặt mua
│   │   ├── WishlistPage/            # Trang danh sách yêu thích
│   │   ├── ContactPage/             # Trang liên hệ
│   │   └── DashboardPage/           # Phân hệ quản trị Admin Dashboard
│   ├── services/                    # Tầng giao tiếp Firebase, Cloudinary, Logs
│   ├── store/                       # Global state stores (authStore, productStore)
│   ├── styles/                      # Thiết lập theme & biến CSS toàn cục
│   ├── types/                       # TypeScript interfaces & types
│   ├── utils/                       # Hàm tiện ích (Zalo helper, Wishlist, Formatters)
│   ├── App.tsx                      # Root Component & cấu hình Router
│   └── main.tsx                     # Entry point
├── .env.example                     # Mẫu biến môi trường
├── package.json                     # Quản lý dependencies & scripts
├── tsconfig.json                    # Cấu hình TypeScript
├── vercel.json                      # Cấu hình rewrite & routing Vercel
└── vite.config.ts                   # Cấu hình Vite bundler & nén tài nguyên
```

---

## 🚀 Cài đặt & Khởi chạy

### 1. Yêu cầu hệ thống
- **Node.js**: Phiên bản 18+ (khuyên dùng Node.js 20 LTS)
- **Trình quản lý gói**: `npm` hoặc `pnpm` / `yarn`

### 2. Cài đặt các gói phụ thuộc
```bash
npm install
```

### 3. Cấu hình biến môi trường
Tạo file `.env.local` ở thư mục gốc (tham khảo mục bên dưới):
```bash
cp .env.example .env.local
```

### 4. Khởi chạy môi trường phát triển (Dev)
```bash
npm run dev
```
Truy cập ứng dụng tại: `http://localhost:5173`

---

## 🔑 Biến môi trường (.env)

Tạo file `.env.local` với các thông tin sau:

```env
# --- Firebase Client Config ---
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id

# --- Cloudinary Image CDN ---
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
VITE_CLOUDINARY_API_KEY=your_cloudinary_api_key
VITE_CLOUDINARY_UPLOAD_PRESET=your_unsigned_upload_preset

# --- Serverless / Email (Resend) ---
RESEND_API_KEY=re_your_resend_api_key
EMAIL_FROM=onboarding@resend.dev
TEST_RECEIVER=your_admin_or_test_email@example.com
```

---

## 📜 Scripts có sẵn

| Lệnh | Ý nghĩa |
| :--- | :--- |
| `npm run dev` | Khởi chạy Vite dev server với Hot Module Replacement (HMR) |
| `npm run build` | Kiểm tra kiểu dữ liệu với TypeScript (`tsc -b`) và đóng gói bản phát hành (`vite build`) |
| `npm run preview` | Xem trước bản build local trên môi trường production mô phỏng |
| `npm run lint` | Chạy ESLint để kiểm tra và định dạng mã nguồn |
| `npm run import-data` | Thực thi script nhập dữ liệu ban đầu lên Firebase (`src/scripts/import-firebase-data.ts`) |

---

## 💡 Kiến trúc & Luồng xử lý

1. **Quản trị cấu hình động (SiteConfig):** Toàn bộ logo, banner hero, bảng màu theme và thông tin mạng xã hội được nạp động từ collection `site_config` trên Firestore, cho phép thay đổi giao diện theo thời gian thực mà không cần deploy lại.
2. **Realtime Updates & Pagination:** Hỗ trợ lắng nghe sự thay đổi (`onSnapshot`) từ Firestore khi quản trị viên cập nhật sản phẩm, kết hợp phân trang `startAfter` giúp tải dữ liệu nhanh chóng và tiết kiệm chi phí đọc database.
3. **Email Hóa đơn Resend:** Khi có đơn hàng mới, serverless function biên dịch mẫu React Email sang HTML và gửi trực tiếp qua Resend API bảo mật.