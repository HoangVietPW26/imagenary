import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { IBM_Plex_Sans } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ClerkProvider } from "@clerk/nextjs";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const IBMPlex = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ['400', '500', '600', '700'],
  variable: "--font-ibm-plex",
})

export const metadata: Metadata = {
  title: "Imagenary",
  description: "AI-power image generator",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider 
      afterSignOutUrl="/"
      appearance={{
        variables: {
          colorPrimary: '#624cf5'
        }
      }}
    >
    <html lang="en">
      <body
        className={cn('font-IBMPlex antialiased', IBMPlex.variable)}
      >
        {children}
      </body>
    </html>
    </ClerkProvider>
      
  );
}
