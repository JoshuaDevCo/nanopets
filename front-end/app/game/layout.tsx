"use client";

import { TonConnectUIProvider } from "@tonconnect/ui-react";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <TonConnectUIProvider manifestUrl='https://nanopets.vercel.app/manifest.json'>
        {children}
      </TonConnectUIProvider>
    </>
  );
}
