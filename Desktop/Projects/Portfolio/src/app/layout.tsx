import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { siteMetadata } from "@/data/metadata";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
});

const pageTitle = `${siteMetadata.name} | ${siteMetadata.title}`;

export const metadata: Metadata = {
  title: pageTitle,
  description: siteMetadata.description,
  keywords: siteMetadata.keywords,
  authors: [{ name: siteMetadata.name }],
  creator: siteMetadata.name,
  publisher: siteMetadata.name,
  metadataBase: new URL(siteMetadata.url),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: pageTitle,
    description: siteMetadata.description,
    url: siteMetadata.url,
    siteName: `${siteMetadata.name} Portfolio`,
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: pageTitle,
    description: siteMetadata.description,
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-L4J7CCTJVB"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-L4J7CCTJVB');
          `}
        </Script>
      </head>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased bg-background text-text-primary`}
      >
        {children}
      </body>
    </html>
  );
}
