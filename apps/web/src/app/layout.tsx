import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "CyclingApp - Track Your Rides, Connect with Cyclists",
    template: "%s | CyclingApp",
  },
  description: "Join CyclingApp to track your cycling activities, connect with fellow cyclists, join challenges, and share your riding journey with the community.",
  keywords: "cycling, bike tracking, cycling app, cyclist community, bike rides, cycling challenges, fitness tracking, cycling stats",
  authors: [{ name: "CyclingApp" }],
  creator: "CyclingApp",
  publisher: "CyclingApp",
  robots: "index, follow",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
    siteName: "CyclingApp",
    title: "CyclingApp - Track Your Rides, Connect with Cyclists",
    description: "Join CyclingApp to track your cycling activities, connect with fellow cyclists, join challenges, and share your riding journey with the community.",
    images: [
      {
        url: "/og-default.png",
        width: 1200,
        height: 630,
        alt: "CyclingApp",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CyclingApp - Track Your Rides, Connect with Cyclists",
    description: "Join CyclingApp to track your cycling activities, connect with fellow cyclists, join challenges, and share your riding journey.",
    images: ["/og-default.png"],
  },
  themeColor: "#4F46E5", // Indigo color matching the app theme
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
