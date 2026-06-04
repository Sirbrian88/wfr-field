/** @type {import('next').NextConfig} */
const nextConfig = {
  // Prevent @huggingface/transformers from being bundled by Next.js server
  // The offline worker loads it dynamically at runtime via CDN
  serverExternalPackages: ["@huggingface/transformers"],

  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      };
    }
    return config;
  },
};

module.exports = nextConfig;
