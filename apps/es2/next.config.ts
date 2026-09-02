import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    WSE_SITE_CONFIG_JSON: "{\"id\":\"es2\",\"label\":\"Event Structure v2\",\"templateId\":\"eventstructure-v2\",\"plugins\":[]}",
  },
  /* config options here */
  output: "standalone",
  reactCompiler: true,
  /** Monorepo: engine packages are compiled from source via tsconfig paths. */
  outputFileTracingRoot: path.join(__dirname, "../.."),
  experimental: {
    externalDir: true,
  },
  // Keep Mongoose out of Turbopack bundles for API routes (avoids multi-second compiles on /api/media).
  serverExternalPackages: ["mongoose", "mongodb", "handlebars", "nodemailer"],
  images: {
    qualities: [75, 90],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "picsum.photos",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.pexels.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "i.pravatar.cc",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "media.tenor.com",
        port: "",
        pathname: "/**",
      }
    ],
  },
};

export default nextConfig;
