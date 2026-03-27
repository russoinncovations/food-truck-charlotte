import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { site } from "@/lib/site";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  icons: {
    icon: "/icon.png",
    shortcut: "/favicon.ico",
  },
  title: {
    default: "Food Truck Charlotte | Food Trucks, Events, and Booking Inquiries",
    template: "%s | Food Truck Charlotte",
  },
  description: site.description,
  alternates: {
    canonical: site.url,
  },
  keywords: [
    "Charlotte food trucks",
    "food truck events Charlotte",
    "book a food truck Charlotte",
    "Charlotte event catering",
    "local food guide Charlotte",
  ],
  openGraph: {
    title: "Food Truck Charlotte",
    description: site.description,
    type: "website",
    url: site.url,
    siteName: "Food Truck Charlotte",
    locale: "en_US",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Food Truck Charlotte local guide",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Food Truck Charlotte",
    description: site.description,
    images: ["/opengraph-image"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#faf6f0]">
        <Navbar />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
