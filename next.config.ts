import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Đã xóa basePath để web chạy ngay tại link gốc của Vercel
  
  allowedDevOrigins: [
    "192.168.1.250:3001",
    "ailab.siu.edu.vn",
    "http://192.168.1.250:3001",
    "https://ailab.siu.edu.vn"
  ],

  reactStrictMode: true,

  // Tắt trailingSlash để các đường dẫn trông sạch hơn trên Vercel
  trailingSlash: false,

  images: {
    unoptimized: true,
  },
};

export default nextConfig;