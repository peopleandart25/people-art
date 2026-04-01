/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async redirects() {
    return [
      {
        source: "/partnership",
        destination: "/partners",
        permanent: true,
      },
    ]
  },
}

export default nextConfig
