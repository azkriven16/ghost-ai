import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/ui/themes";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ghost AI",
  description: "AI-powered system design canvas",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      appearance={{
        theme: dark,
        variables: {
          colorBackground: "var(--bg-surface)",
          colorForeground: "var(--text-primary)",
          colorMutedForeground: "var(--text-secondary)",
          colorPrimary: "var(--accent-primary)",
          colorPrimaryForeground: "var(--bg-base)",
          colorInput: "var(--bg-elevated)",
          colorInputForeground: "var(--text-primary)",
          colorNeutral: "var(--text-muted)",
          colorDanger: "var(--state-error)",
          colorSuccess: "var(--state-success)",
          colorWarning: "var(--state-warning)",
          borderRadius: "0.75rem",
        },
      }}
    >
      <html
        lang="en"
        className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      >
        <body className="h-full bg-base text-copy-primary">{children}</body>
      </html>
    </ClerkProvider>
  );
}
