import type { Metadata } from "next";
import { Bebas_Neue, Source_Sans_3, Roboto } from "next/font/google";
import "./globals.css";

const bebas = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bebas",
});

const sourceSans = Source_Sans_3({
  weight: ["300", "400", "600"],
  subsets: ["latin"],
  variable: "--font-source-sans",
});

const roboto = Roboto({
  weight: ["300", "400", "500", "700"],
  subsets: ["latin"],
  variable: "--font-roboto",
});

export const metadata: Metadata = {
  title: "File Explorer",
  description: "An app to browse your files",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${bebas.variable} ${sourceSans.variable} ${roboto.variable}`}
      >
        {children}
      </body>
    </html>
  );
}
