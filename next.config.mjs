/** @type {import('next').NextConfig} */
const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || "https://<tu-function>.azurewebsites.net";

const nextConfig = {
  experimental: { appDir: true },
  async rewrites() {
    return [{ source: "/_api/:path*", destination: `${API_BASE}/:path*` }];
  },
};
export default nextConfig;
