# Bảng Tuần Hoàn Hóa Học — 118 Nguyên Tố IUPAC

Ứng dụng web tĩnh (React + TypeScript + Vite + Tailwind CSS + Framer Motion) tra cứu 118 nguyên tố hóa học, cấu hình electron, mô hình Bohr, sơ đồ ô orbital (quy tắc Hund) và bộ chuyển đổi cấu hình electron. Không cần backend hay API key.

## Đưa lên GitHub Pages (tránh lỗi màn hình trắng)

> **Lưu ý quan trọng**: Không chọn *Deploy from a branch (`main` / `(root)`)* vì GitHub sẽ chạy file `index.html` gốc chưa build (chứa `/src/main.tsx`) gây màn hình trắng. Hãy dùng **GitHub Actions** hoặc upload thư mục `dist/` sau khi build.

### Cách 1: Tự động bằng GitHub Actions (khuyên dùng)
1. Đẩy toàn bộ mã nguồn lên repository GitHub (nhánh `main` hoặc `master`), bao gồm cả thư mục `.github/workflows/deploy.yml`.
2. Vào **Settings → Pages → Build and deployment → Source** và chọn **GitHub Actions**.
3. Mở tab **Actions** để xem workflow **Deploy to GitHub Pages** chạy xong (màu xanh).
4. Truy cập link GitHub Pages của bạn (`https://<ten-tai-khoan>.github.io/` hoặc `https://<ten-tai-khoan>.github.io/<ten-repo>/`).

### Cách 2: Upload thủ công file tĩnh đã build
1. Chạy `npm install && npm run build`.
2. Đưa toàn bộ **nội dung bên trong thư mục `dist/`** (gồm `index.html`, `.nojekyll`, và thư mục `assets/`) lên nhánh phát hành GitHub Pages.

## Chạy và build cục bộ

```bash
npm install
npm run dev     # Chạy môi trường phát triển tại http://localhost:3000
npm run lint    # Kiểm tra kiểu TypeScript
npm run build   # Xuất bản tĩnh vào thư mục dist/
```
