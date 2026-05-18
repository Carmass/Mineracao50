import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { QueryProvider } from "@/components/providers/query-provider";
import { Toaster } from "sonner";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: {
    default: "MineraçãoProdutos — Descubra Produtos Virais",
    template: "%s | MineraçãoProdutos",
  },
  description: "Plataforma SaaS premium de mineração de produtos para e-commerce, dropshipping e afiliados. Descubra produtos virais no AliExpress, Shopee e Amazon.",
  keywords: ["dropshipping", "produtos virais", "aliexpress", "shopee", "amazon", "mineração de produtos", "e-commerce"],
  authors: [{ name: "MineraçãoProdutos" }],
  creator: "MineraçãoProdutos",
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: process.env.NEXT_PUBLIC_APP_URL,
    siteName: "MineraçãoProdutos",
    title: "MineraçãoProdutos — Descubra Produtos Virais",
    description: "Plataforma premium de mineração de produtos para e-commerce e dropshipping.",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "MineraçãoProdutos",
    description: "Descubra produtos virais com IA",
    images: ["/og-image.png"],
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0b0e" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <QueryProvider>
            {children}
            <Toaster position="bottom-right" theme="dark" richColors />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
