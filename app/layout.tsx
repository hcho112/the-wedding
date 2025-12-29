import type { Metadata } from "next";
import { Inter, Cormorant_Garamond } from "next/font/google";
import localFont from "next/font/local";
import SmoothScroll from "@/components/providers/SmoothScroll";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-serif",
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
});

// Load complete Aileron font family with all weights
const aileron = localFont({
  src: [
    // Normal weights
    { path: "./fonts/Aileron-Thin.otf", weight: "100", style: "normal" },
    { path: "./fonts/Aileron-UltraLight.otf", weight: "200", style: "normal" },
    { path: "./fonts/Aileron-Light.otf", weight: "300", style: "normal" },
    { path: "./fonts/Aileron-Regular.otf", weight: "400", style: "normal" },
    { path: "./fonts/Aileron-SemiBold.otf", weight: "600", style: "normal" },
    { path: "./fonts/Aileron-Bold.otf", weight: "700", style: "normal" },
    { path: "./fonts/Aileron-Heavy.otf", weight: "800", style: "normal" },
    { path: "./fonts/Aileron-Black.otf", weight: "900", style: "normal" },
    // Italic weights
    { path: "./fonts/Aileron-ThinItalic.otf", weight: "100", style: "italic" },
    { path: "./fonts/Aileron-UltraLightItalic.otf", weight: "200", style: "italic" },
    { path: "./fonts/Aileron-LightItalic.otf", weight: "300", style: "italic" },
    { path: "./fonts/Aileron-Italic.otf", weight: "400", style: "italic" },
    { path: "./fonts/Aileron-SemiBoldItalic.otf", weight: "600", style: "italic" },
    { path: "./fonts/Aileron-BoldItalic.otf", weight: "700", style: "italic" },
    { path: "./fonts/Aileron-HeavyItalic.otf", weight: "800", style: "italic" },
    { path: "./fonts/Aileron-BlackItalic.otf", weight: "900", style: "italic" },
  ],
  variable: "--font-aileron",
  display: "swap",
});

export const metadata: Metadata = {
  title: "The Wedding",
  description: "A collection of moments and work.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${aileron.variable} ${inter.variable} ${cormorant.variable} antialiased bg-background text-foreground`}
      >
        <SmoothScroll>{children}</SmoothScroll>
      </body>
    </html>
  );
}
