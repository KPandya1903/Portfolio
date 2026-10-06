import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { siteMetadata } from "@/data/metadata";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains-mono" });
const pageTitle = `${siteMetadata.name} | ${siteMetadata.title}`;

export const metadata: Metadata = {
  title: pageTitle,
  description: siteMetadata.description,
  keywords: siteMetadata.keywords,
  authors: [{ name: siteMetadata.name }],
  creator: siteMetadata.name,
  metadataBase: new URL(siteMetadata.url),
  alternates: { canonical: "/" },
  openGraph: {
    title: pageTitle,
    description: siteMetadata.description,
    url: siteMetadata.url,
    siteName: `${siteMetadata.name} Portfolio`,
    locale: "en_US",
    type: "website",
  },
  twitter: { card: "summary", title: pageTitle, description: siteMetadata.description },
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg", apple: "/favicon.svg" },
};

// String twin of setRailFreed(true) in guide/environment.ts; keep them in sync.
// Runs before paint so a visitor who turned the guide off never sees the rail padding flash (CLS 0).
const guidePrefScript = `try{if(localStorage.getItem("guide:enabled")==="0")document.documentElement.dataset.guide="off"}catch(e){}`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: guidePrefScript }} />
      </head>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased bg-background text-text-primary`}
      >
        {children}
      </body>
    </html>
  );
}
