import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "plus.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "dodptt9f4zk9h.cloudfront.net",
      },
      {
        protocol: "https",
        hostname: "chatgpt.com",
      },
    ],
  },
};

export default nextConfig;
