// Better Auth handles server-side auth differently, no server provider needed
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Nizar's Chat - AI-Powered Chat Application",
  description: "Advanced AI chat application supporting multiple models including GPT, Claude, Gemini, and more. Features include file attachments, image generation, conversation sharing, and intelligent search.",
  keywords: ["AI", "Chat", "GPT", "Claude", "Gemini", "OpenAI", "Anthropic", "Google", "Conversation", "AI Assistant"],
  authors: [{ name: "Nizar" }],
  creator: "Nizar",
  publisher: "Nizar",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    title: "Nizar's Chat - AI-Powered Chat Application",
    description: "Advanced AI chat application supporting multiple models including GPT, Claude, Gemini, and more.",
    siteName: "Nizar's Chat",
  },
  twitter: {
    card: "summary_large_image",
    title: "Nizar's Chat - AI-Powered Chat Application",
    description: "Advanced AI chat application supporting multiple models including GPT, Claude, Gemini, and more.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={cn("w-full h-full")}>
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} antialiased w-full h-full flex`}
      >
        {children}
      </body>
    </html>
  );
}
