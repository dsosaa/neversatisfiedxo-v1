import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Playfair_Display } from "next/font/google";
import { headers } from 'next/headers';
import "./globals.css";
import { Providers } from "@/lib/providers";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetBrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

const playfairDisplay = Playfair_Display({
  variable: "--font-playfair-display",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "neversatisfiedxo | Premium Gallery",
  description: "Exclusive premium content gallery by neversatisfiedxo",
  keywords: ["premium", "gallery", "exclusive", "content"],
  robots: "noindex, nofollow",
  other: {
    // Prevent iOS automatic format detection to avoid hydration mismatches
    'format-detection': 'telephone=no, date=no, email=no, address=no',
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Get nonce from middleware for CSP compatibility
  const nonce = (await headers()).get('x-nonce') || undefined;

  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        {/* CSP-compatible meta tags with nonce if available */}
        {nonce && (
          <script
            nonce={nonce}
            dangerouslySetInnerHTML={{
              __html: `
                // CSP-compatible hydration preparation
                window.__CSP_NONCE__ = '${nonce}';
              `,
            }}
          />
        )}
      </head>
      <body
        className={`${inter.variable} ${jetBrainsMono.variable} ${playfairDisplay.variable} antialiased min-h-screen bg-background text-foreground`}
        suppressHydrationWarning
      >
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
