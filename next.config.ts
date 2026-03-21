import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    resolveAlias: {
      'jspdf': 'jspdf/dist/jspdf.es.min.js',
    },
  },
};

export default nextConfig;
