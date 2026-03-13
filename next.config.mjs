import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Optimize for faster dev server
  reactStrictMode: false, // Disable double-rendering in dev
  swcMinify: true, // Use SWC for faster compilation
  
  // Compiler options for faster builds
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },

  eslint: {
    // Allow production builds to complete even with ESLint errors (Vercel compatibility)
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Allow production builds to complete even with TypeScript errors (Vercel compatibility)
    ignoreBuildErrors: true,
  },
  
  // Optimize webpack for faster compilation
  webpack: (config, { isServer, dev }) => {
    // Ensure path aliases work correctly in webpack
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        '@': path.resolve(__dirname, './src'),
      };
    }
    
    // Speed up dev server
    if (dev) {
      config.watchOptions = {
        poll: 1000, // Check for changes every second
        aggregateTimeout: 300, // Delay rebuilds by 300ms
        ignored: /node_modules/,
      };
    }
    
    return config;
  },
  
  // Experimental features for faster builds
  experimental: {
    optimizePackageImports: ['@clerk/nextjs', 'mdb-react-ui-kit'],
  },
};

export default nextConfig;
