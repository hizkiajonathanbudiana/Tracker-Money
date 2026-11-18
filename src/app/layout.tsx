import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import StoreProvider from "@/components/Store";
import Shell from "@/components/Shell";
export const metadata: Metadata = {
  title: "Money Tracker — Small habits, better days",
  description:
    "Budget bulanan, daily challenges, dan poin yang terus bertumbuh.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "Money Tracker",
    statusBarStyle: "default",
  },
  icons: { icon: "/icon-192x192.png", apple: "/icon-192x192.png" },
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f8f5" },
    { media: "(prefers-color-scheme: dark)", color: "#151e1a" },
  ],
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          storageKey="money-tracker-theme"
        >
          <StoreProvider>
            <Shell>{children}</Shell>
          </StoreProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
