/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Warning: This allows production builds to successfully complete even if
    // your project has type errors.
    ignoreBuildErrors: false, // Set to true if you also want to ignore TypeScript errors
  },
  // Disable static optimization for pages that use client-side only features
  output: 'standalone',
};

export default nextConfig;
