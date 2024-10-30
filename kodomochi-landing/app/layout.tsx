import type { Metadata } from "next";
import { Micro_5 } from "next/font/google";
import "./globals.css";

const micro = Micro_5({ subsets: ["latin"], weight: ["400"] });

export const metadata: Metadata = {
  title: "Create Next App",
  description: "Generated by create next app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en'>
      <body className={`${micro.className} antialiased`}>{children}</body>
    </html>
  );
}