import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  // Chạy ứng dụng dưới subpath /certificate
  basePath: "/certificate",

  // Next.js tự động handle assetPrefix khi dùng basePath, gỡ bỏ assetPrefix thủ công
  // assetPrefix: isProd ? "/certificate" : undefined,

  allowedDevOrigins: [
    "192.168.1.250:3001",
    "ailab.siu.edu.vn",
    "http://192.168.1.250:3001",
    "https://ailab.siu.edu.vn"
  ],

  reactStrictMode: true,

  // Đồng bộ trailing slash với cấu hình Nginx location /certificate/
  trailingSlash: true,

  images: {
    unoptimized: true,
  },
};

export default nextConfig;