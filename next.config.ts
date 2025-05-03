import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        // port: '', // ポート指定が必要なら
        // pathname: '/a/**', // 特定のパスパターンだけ許可する場合
      },
      // 他に許可したいドメインがあればここに追加
    ],
  },
  /* config options here */
};

export default nextConfig;
