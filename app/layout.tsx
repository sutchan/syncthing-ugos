import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Syncthing for UGOS Pro",
  description:
    "Syncthing packaging, configuration manager, and documentation workstation for UGREEN NAS (UGOS Pro)",
  openGraph: {
    title: "Syncthing for UGOS Pro",
    description:
      "Syncthing packaging, configuration manager, and documentation workstation for UGREEN NAS (UGOS Pro)",
    images: ["/icon.png"],
  },
  icons: {
    icon: "/icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased selection:bg-cyan-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
