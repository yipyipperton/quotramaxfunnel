import { Inter, Manrope } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope", display: "swap" });

export const metadata = {
  title: "Quotramax Demo - Roofing Lead Qualification Funnel",
  description: "Interactive demonstration of the Quotramax lead qualification and inspection-booking funnel for residential roofers.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  colorScheme: "dark",
  themeColor: "#0c0d11",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`h-full antialiased ${inter.variable} ${manrope.variable}`}>
      <body className="min-h-full flex flex-col bg-background-alt text-foreground font-sans">{children}</body>
    </html>
  );
}
