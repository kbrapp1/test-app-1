import bundleAnalyzer from '@next/bundle-analyzer';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

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
  
  // Note: Bundle optimization for Phase 5 is handled by:
  // 1. Turbopack in development (faster builds)
  // 2. Next.js default webpack config in production (automatic code splitting)
  // 3. package.json sideEffects: false (tree shaking)
  // 4. React lazy() API (component-level code splitting)
};

// Only apply bundle analyzer in production builds (webpack) to avoid Turbopack conflicts
export default process.env.ANALYZE === 'true' 
  ? withBundleAnalyzer(nextConfig)
  : nextConfig;
