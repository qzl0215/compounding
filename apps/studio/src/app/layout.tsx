import type { Metadata } from "next";
import { IBM_Plex_Sans, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/shell/app-shell";

const sans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"]
});

const display = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "700"]
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "600"]
});

export const metadata: Metadata = {
  title: "Compounding AI-Native Repo Portal",
  description: "Read-only portal for AI-native rules, memory, tasks, and code index"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body className={`${sans.className} ${display.variable} ${mono.variable}`}>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
