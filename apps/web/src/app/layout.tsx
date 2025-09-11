import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Playfair_Display } from "next/font/google";
import { headers } from 'next/headers';
import "./globals.css";
import { Providers } from "@/lib/providers";
import { ServiceWorkerRegister } from "@/components/service-worker-register";

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
  title: "neversatisfiedxo | Video Vault",
  description: "Exclusive premium content gallery by neversatisfiedxo",
  keywords: ["premium", "gallery", "exclusive", "content"],
  robots: "noindex, nofollow",
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' }
    ],
    apple: [
      { url: '/apple-icon.svg', type: 'image/svg+xml' }
    ]
  },
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
  // Get nonce from middleware for CSP compatibility following Next.js best practices
  // Next.js automatically uses this for scripts and styles when present in x-nonce header
  await headers()

  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        {/* Next.js automatically handles script nonces via the nonce from x-nonce header */}
      </head>
      <body
        className={`${inter.variable} ${jetBrainsMono.variable} ${playfairDisplay.variable} antialiased min-h-screen bg-background text-foreground`}
        suppressHydrationWarning
      >
        <Providers>
          {children}
          <ServiceWorkerRegister />
        </Providers>
      </body>
    </html>
  );
}
