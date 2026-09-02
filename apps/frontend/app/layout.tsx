import "./globals.css";
import type { Metadata } from "next";
import { Fraunces, Hanken_Grotesk, IBM_Plex_Mono } from "next/font/google";
import { Toaster } from "react-hot-toast";
import { ThemeProvider } from "@/components/theme/ThemeProvider";

const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: ["400", "500", "600"],
});

const sans = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
  weight: ["400", "500", "600"],
});

const siteUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : "http://localhost:3000";

const title = "Rolio — the job hunt, under control";
const description =
  "Track every job application from applied to offer, with AI-generated interview prep for each role. Light and dark.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: title, template: "%s · Rolio" },
  description,
  applicationName: "Rolio",
  openGraph: {
    type: "website",
    siteName: "Rolio",
    title,
    description,
    url: siteUrl,
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${display.variable} ${sans.variable} ${mono.variable}`}
    >
      <body>
        <ThemeProvider>
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              duration: 3200,
              style: {
                background: "var(--surface)",
                color: "var(--fg)",
                border: "1px solid var(--border-strong)",
                borderRadius: "12px",
                boxShadow: "var(--shadow-pop)",
                fontSize: "14px",
                fontFamily: "var(--font-sans)",
              },
              success: { iconTheme: { primary: "var(--st-accepted)", secondary: "var(--surface)" } },
              error: { iconTheme: { primary: "var(--st-rejected)", secondary: "var(--surface)" } },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
