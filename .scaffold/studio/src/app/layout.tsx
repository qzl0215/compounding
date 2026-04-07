import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/shell/app-shell";

export const metadata: Metadata = {
  title: "Compounding Project Overview",
  description: "Human-first project overview with evidence, execution, and release detail workbenches"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const runtimeChannel = process.env.AI_OS_RUNTIME_PROFILE === "dev" ? "dev" : "prod";
  return (
    <html lang="zh-CN">
      <body>
        <AppShell runtimeChannel={runtimeChannel}>{children}</AppShell>
      </body>
    </html>
  );
}
