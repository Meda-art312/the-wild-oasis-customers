/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: process.env.SUPABASE_URL
      ? [
          {
            protocol: "https",
            hostname: new URL(process.env.SUPABASE_URL).hostname,
            pathname: "/storage/v1/object/public/cabin-images/**",
          },
        ]
      : [],
    qualities: [75, 80],
  },
};
export default nextConfig;
