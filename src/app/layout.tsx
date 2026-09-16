import type { Metadata } from "next";
import { Inter, Noto_Sans_Bengali } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const notoBengali = Noto_Sans_Bengali({
  subsets: ["bengali"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-noto-bengali",
  display: "swap",
});

export const metadata: Metadata = {
  title: "School Management OS",
  description: "Isolated school operations dashboard",
  icons: {
    icon: [{ url: "/icon", type: "image/png" }],
    apple: [{ url: "/apple-icon", type: "image/png" }],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="bn"
      translate="no"
      className={`notranslate ${inter.variable} ${notoBengali.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full bg-canvas font-sans text-foreground" suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
