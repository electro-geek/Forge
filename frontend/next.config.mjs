/** @type {import('next').NextConfig} */
const nextConfig = {
  // Required for the multi-stage Docker build (copies .next/standalone)
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "googleusercontent.com",
      },
    ],
  },
};

export default nextConfig;
