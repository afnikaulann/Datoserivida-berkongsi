import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return {
      beforeFiles: [
        // Serve the static giveaway landing page at the root URL
        { source: "/", destination: "/index.html" },
      ],
    };
  },
};

export default nextConfig;
