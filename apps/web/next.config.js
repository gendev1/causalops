/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable environment validation during build
  env: {
    // These will be available on both client and server
    NEXT_PUBLIC_AGENT_URL: process.env.NEXT_PUBLIC_AGENT_URL,
  },
  // Ensure environment is validated during build
  webpack: (config, { dev }) => {
    if (dev) {
      // Validate environment in development
      require('./src/env.ts');
    }
    return config;
  },
};

module.exports = nextConfig;