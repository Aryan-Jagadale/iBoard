/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
          {
            protocol: "https",
            hostname: "img.clerk.com"
          }
        ]
    },
    webpack: (config) => {
      config.resolve.fallback = {
          ...config.resolve.fallback,
          fs: false,
          path: false,
      };
      return config;
  }
};

export default nextConfig;
