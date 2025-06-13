import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    reactCompiler: true,
  },
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
    resolveAlias: {
      canvas: './empty-module.ts',
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'strong-mammoth-432.convex.cloud',
      },
    ],
  },
};

export default nextConfig;
