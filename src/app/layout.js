import { Manrope, Space_Mono } from "next/font/google";
import ThemeRegistry from "../components/ThemeRegistry";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const spaceMono = Space_Mono({
  variable: "--font-space-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata = {
  title: "DocBook",
  description: "Secure, beautiful note-taking with cloud sync.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "DocBook",
  },
  icons: {
    icon: "/favicon.png",
    apple: "/icons/icon-192x192.png",
  },
};

export const viewport = {
  themeColor: "#5c3d2e",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${manrope.variable} ${spaceMono.variable}`}>
        <ThemeRegistry>{children}</ThemeRegistry>
      </body>
    </html>
  );
}
