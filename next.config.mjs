/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "*.supabase.in" },
    ],
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
