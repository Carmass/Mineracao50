import type { NextConfig } from "next";
import path from "path";

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3004";

const nextConfig: NextConfig = {
  output: "standalone",
  experimental: {
    // Required for monorepo: traces root node_modules into the standalone bundle
    outputFileTracingRoot: path.join(process.cwd(), "../../"),
  } as Record<string, unknown>,
  devIndicators: false,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.aliexpress.com" },
      { protocol: "https", hostname: "**.alicdn.com" },
      { protocol: "https", hostname: "**.shopee.com.br" },
      { protocol: "https", hostname: "**.shopeecdn.com" },
      { protocol: "https", hostname: "**.susercontent.com" },
      { protocol: "https", hostname: "down-br.img.susercontent.com" },
      { protocol: "https", hostname: "m.media-amazon.com" },
      { protocol: "https", hostname: "images-na.ssl-images-amazon.com" },
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "placehold.co" },
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "**.cloudinary.com" },
      { protocol: "https", hostname: "fakestoreapi.com" },
      { protocol: "https", hostname: "cf.shopee.com.br" },
      { protocol: "https", hostname: "**.mlstatic.com" },
      { protocol: "https", hostname: "http2.mlstatic.com" },
      { protocol: "https", hostname: "**.aliexpress-media.com" },
      { protocol: "https", hostname: "ae-pic-a1.aliexpress-media.com" },
    ],
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 86400,
  },

  headers: async () => [
    {
      source: "/(.*)",
      headers: [
        { key: "X-Frame-Options", value: "DENY" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        {
          key: "Content-Security-Policy",
          value: [
            "default-src 'self'",
            "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com",
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data: blob: https:",
            "font-src 'self'",
            `connect-src 'self' https://*.supabase.co wss://*.supabase.co https://projetosai-supabase.cbunsn.easypanel.host wss://projetosai-supabase.cbunsn.easypanel.host ${appUrl} https://api.openai.com https://api.stripe.com`,
            "frame-src https://js.stripe.com",
          ].join("; "),
        },
      ],
    },
  ],
};

export default nextConfig;
