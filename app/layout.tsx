import type { Metadata, Viewport } from "next";
import { Inter_Tight } from "next/font/google";
import { ThemeProvider } from "next-themes";
import Providers from "@/components/shared/session-provider";
import { AlertContainer } from "@/components/ui/alert";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import "./globals.css";

const interTight = Inter_Tight({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const baseUrl = "https://e-learning-msc.vercel.app";

export const metadata: Metadata = {
  title: {
    default: "e-learning-msc — Structured Learning. Measurable Outcomes.",
    template: "%s | e-learning-msc",
  },
  description:
    "A premium three-role e-learning management system for administrators, instructors, and students. Modular courses, live cohort tracking, attendance logging, and milestone validation.",
  keywords: [
    "e-learning",
    "LMS",
    "learning management system",
    "online courses",
    "education platform",
    "training management",
    "cohort tracking",
    "student management",
    "EdTech",
    "MSc",
    "enterprise architecture",
  ],
  authors: [{ name: "ELMACHHOUNE" }],
  creator: "ELMACHHOUNE",
  publisher: "e-learning-msc",
  metadataBase: new URL(baseUrl),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "e-learning-msc — Structured Learning. Measurable Outcomes.",
    description:
      "A premium three-role e-learning management system for administrators, instructors, and students.",
    url: baseUrl,
    siteName: "e-learning-msc",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/images/cover.png",
        width: 1200,
        height: 630,
        alt: "e-learning-msc platform preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "e-learning-msc — Structured Learning. Measurable Outcomes.",
    description:
      "A premium three-role e-learning management system for administrators, instructors, and students.",
    images: ["/images/cover.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/images/icon.png",
    apple: "/images/icon.png",
  },
  manifest: "/manifest.json",
  category: "education",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#000000",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "EducationalApplication",
  name: "e-learning-msc",
  url: baseUrl,
  description:
    "A premium three-role e-learning management system for administrators, instructors, and students.",
  applicationCategory: "EducationalApplication",
  operatingSystem: "Web",
  author: {
    "@type": "Person",
    name: "ELMACHHOUNE",
  },
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={interTight.variable}
      suppressHydrationWarning
      data-scroll-behavior="smooth"
    >
      <body
        className="min-h-full bg-canvas text-ink antialiased"
        suppressHydrationWarning
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <Providers>
            {children}
            <AlertContainer />
            <ConfirmDialog />
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
