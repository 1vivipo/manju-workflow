import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "对话类漫剧工作流 | AI漫画创作平台",
  description: "用AI将你的对话脚本变成精彩动画漫剧，支持200+角色、40+情绪动作、多种风格场景",
  manifest: "/manju-workflow/manifest.json",
  themeColor: "#7c3aed",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <meta name="theme-color" content="#7c3aed" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="漫剧工作流" />
        <link rel="icon" href="/manju-workflow/icon-192.png" />
        <link rel="apple-touch-icon" href="/manju-workflow/icon-192.png" />
      </head>
      <body>{children}</body>
    </html>
  );
}
