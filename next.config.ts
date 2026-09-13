import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: "/__owner/:path*",
          destination: "/owner-portal/:path*",
        },
      ],
    };
  },
};

export default nextConfig;
