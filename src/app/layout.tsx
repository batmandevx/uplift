import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { Providers } from "@/components/providers";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "SealedRecovery — Compliant Collections Ops",
  description:
    "Compliant AI debt-recovery batch orchestration dashboard with pre-registered holdout, mandate-gated escalation, and Hinglish stop-rule detection.",
  keywords: [
    "debt recovery",
    "collections",
    "compliance",
    "holdout",
    "escalation",
    "stop rule",
    "Hinglish NLP",
  ],
  authors: [{ name: "SealedRecovery" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <Providers>
          {children}
          <SonnerToaster richColors position="top-right" />
        </Providers>
      </body>
    </html>
  );
}
