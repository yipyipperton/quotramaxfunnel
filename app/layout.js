import "./globals.css";

export const metadata = {
  title: "Quotramax - 21-Point Roof Assessment & Priority Inspection Booking",
  description: "High-converting pre-qualification funnel and direct calendar booking engine for residential roofers.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-[#070a13] text-slate-100 font-sans">{children}</body>
    </html>
  );
}
