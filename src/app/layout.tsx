import type { Metadata } from "next";
import { Hind_Siliguri, Source_Sans_3 } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const hind = Hind_Siliguri({
  weight: ["400", "500", "600", "700"],
  subsets: ["bengali", "latin"],
  variable: "--font-hind",
});

const source = Source_Sans_3({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-source",
});

export const metadata: Metadata = {
  title: "School Management OS",
  description: "Isolated school operations dashboard",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="bn"
      translate="no"
      className={`notranslate ${hind.variable} ${source.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full bg-canvas font-sans text-foreground" suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
