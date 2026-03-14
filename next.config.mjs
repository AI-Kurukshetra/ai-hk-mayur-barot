/** @type {import('next').NextConfig} */
const nextConfig = {
  typedRoutes: true,
  distDir: process.env.VERCEL === "1" ? ".next" : ".next-work",
};

export default nextConfig;