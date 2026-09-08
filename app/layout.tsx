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

const baseUrl = "https://e-teaching.tech";

export const metadata: Metadata = {
  title: {
    default: "e-Teaching — Structured Learning. Measurable Outcomes.",
    template: "%s | e-Teaching",
  },
  description:
    "e-Teaching is a premium learning management platform for administrators, instructors, and students. Modular courses, live cohort tracking, attendance logging, and milestone validation.",
  keywords: [
    "e-Teaching",
    "e-Teaching ELMACHHOUNE",
    "ELMACHHOUNE",
    "e-learning",
    "LMS",
    "learning management system",
    "online courses",
    "education platform",
    "training management",
    "cohort tracking",
    "student management",
    "EdTech",
    "teacher platform",
    "online learning",
  ],
  authors: [{ name: "ELMACHHOUNE" }],
  creator: "ELMACHHOUNE",
  publisher: "e-Teaching",
  metadataBase: new URL(baseUrl),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "e-Teaching — Structured Learning. Measurable Outcomes.",
    description:
      "A premium learning management platform for administrators, instructors, and students.",
    url: baseUrl,
    siteName: "e-Teaching",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/images/cover.png",
        width: 1200,
        height: 630,
        alt: "e-Teaching platform preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "e-Teaching — Structured Learning. Measurable Outcomes.",
    description:
      "A premium learning management platform for administrators, instructors, and students.",
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
  verification: {
    google: "iV1UU0LDwkWCnmlmLn-fpebbGmX0kpdf2l5TPLC2Y-A",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#000000",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "EducationalOrganization",
  name: "e-Teaching",
  alternateName: "e-Teaching ELMACHHOUNE",
  url: baseUrl,
  description:
    "A premium learning management platform for administrators, instructors, and students, created by ELMACHHOUNE.",
  founder: {
    "@type": "Person",
    name: "ELMACHHOUNE",
    url: "https://github.com/ELMACHHOUNE",
  },
  sameAs: ["https://github.com/ELMACHHOUNE"],
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
    category: "Education",
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
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
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
