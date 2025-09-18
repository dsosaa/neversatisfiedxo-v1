import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Playfair_Display } from "next/font/google";
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        {/* Performance: speed up first image fetch by preconnecting */}
        <link rel="preconnect" href="https://videodelivery.net" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://iframe.videodelivery.net" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://videodelivery.net" />
        <link rel="dns-prefetch" href="https://iframe.videodelivery.net" />
        
        {/* Preload critical resources */}
        <link rel="preload" href="/icon.svg" as="image" type="image/svg+xml" />
        
        {/* Resource hints for faster navigation */}
        <link rel="prefetch" href="/gallery" />
        <link rel="prefetch" href="/enter" />
      </head>
      <body
        className={`${inter.variable} ${jetBrainsMono.variable} ${playfairDisplay.variable} antialiased min-h-screen bg-background text-foreground scrollbar-blue`}
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
