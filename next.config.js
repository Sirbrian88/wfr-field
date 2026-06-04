/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // Support Web Workers via webpack 5
    config.output.globalObject = "self";

    // Required for @huggingface/transformers ONNX/WASM files
    config.resolve.alias = {
      ...config.resolve.alias,
    };

    // Allow .wasm and ONNX binary assets
    config.module.rules.push({
      test: /\.wasm$/,
      type: "asset/resource",
    });

    // Exclude heavy node-specific modules from client bundle
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

  // Allow cross-origin isolation headers needed for SharedArrayBuffer (WASM threads)
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
