/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: 10485760, // 10MB in bytes
    },
  },
  // Restore other settings
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    // Allow images from Supabase storage
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'zzapbmpqkqeqsrqwttzd.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
    // Keep unoptimized if it was needed before, otherwise remove/comment out
    // unoptimized: true, 
  },
};

export default nextConfig;
