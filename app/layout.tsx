import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import '../src/index.css';

const SITE_URL = 'https://elegantbarbershop.solok.id';
const TITLE = 'ELEGANT BARBERSHOP SOLOK — Tempat Pangkas Rambut Pria Profesional Sumatera Barat';
const DESCRIPTION =
  'Elegant Barbershop Solok di Jl. Perwira, VI Suku, Kota Solok, Sumatera Barat. Tempat cukur rambut pria terbaik dengan konsep Masuak Cayah Kalua Cogah. Layanan pangkas premium, Korean perming, bleaching, dan hair coloring.';

const FONT_URL =
  'https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700;800;900&family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&family=Playfair+Display:ital,wght@0,500;0,600;0,700;1,400;1,600&display=swap';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    'barbershop solok',
    'pangkas rambut solok',
    'cukur rambut solok',
    'salon pria solok',
    'perming rambut solok',
    'barbershop sumatera barat',
    'elegant barbershop solok',
    'potong rambut jl perwira solok',
    'potong rambut pria solok',
  ],
  authors: [{ name: 'Elegant Barbershop Solok' }],
  robots: { index: true, follow: true },
  alternates: { canonical: `${SITE_URL}/` },
  applicationName: 'Elegant Barbershop Solok',
  appleWebApp: {
    capable: true,
    title: 'Elegant Barbershop Solok',
    statusBarStyle: 'black-translucent',
  },
  openGraph: {
    type: 'website',
    url: `${SITE_URL}/`,
    locale: 'id_ID',
    siteName: 'Elegant Barbershop Solok',
    title: 'ELEGANT BARBERSHOP SOLOK — Masuak Cayah Kalua Cogah',
    description:
      'Tempat pangkas rambut pria terkemuka di Kota Solok, Sumatera Barat. Nikmati ruang ber-AC nyaman, barber profesional, dan hasil presisi mulai Rp 20.000.',
    images: [
      {
        url: '/images/og-banner.jpg',
        width: 1200,
        height: 630,
        alt: 'Suasana Dalam Elegant Barbershop Solok Sumatera Barat',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ELEGANT BARBERSHOP SOLOK — Masuak Cayah Kalua Cogah',
    description:
      'Barbershop pria profesional di Kota Solok, Sumatera Barat. Buka setiap hari 10.00 - 22.00 WIB di Jl. Perwira.',
    images: ['/images/og-banner.jpg'],
  },
};

export const viewport: Viewport = {
  themeColor: '#0A0A0E',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BarberShop',
  name: 'Elegant Barbershop Solok',
  image: [
    `${SITE_URL}/images/og-banner.jpg`,
    `${SITE_URL}/android-chrome-512x512.png`,
  ],
  description:
    'Barbershop pria profesional di Kota Solok, Sumatera Barat. Menghadirkan pangkas rambut presisi, perming, pewarnaan, dan perawatan rambut berkualitas dengan semboyan Masuak Cayah Kalua Cogah.',
  slogan: 'Masuak Cayah Kalua Cogah',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Jl. Perwira',
    addressLocality: 'VI Suku, Kec. Lubuk Sikarah',
    addressRegion: 'Sumatera Barat',
    postalCode: '27311',
    addressCountry: 'ID',
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: -0.7925,
    longitude: 100.6586,
  },
  url: SITE_URL,
  telephone: '+6281270008910',
  priceRange: 'Rp 20.000 - Rp 120.000',
  currenciesAccepted: 'IDR',
  paymentAccepted: 'Cash, QRIS, Bank Transfer',
  openingHoursSpecification: [
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      opens: '10:00',
      closes: '22:00',
    },
  ],
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.9',
    reviewCount: '128',
    bestRating: '5',
    worstRating: '1',
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="id" className="dark scroll-smooth">
      <head>
        {/* Geo Local SEO (Solok, Sumatera Barat) */}
        <meta name="geo.region" content="ID-SB" />
        <meta name="geo.placename" content="Kota Solok, Sumatera Barat" />
        <meta name="geo.position" content="-0.7925;100.6586" />
        <meta name="ICBM" content="-0.7925, 100.6586" />

        {/* PWA Manifest & Icons */}
        <link rel="manifest" href="/site.webmanifest" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />

        {/* Performance Hints */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/* LCP: pre-load hero background before JS/CSS executes */}
        <link rel="preload" as="image" href="/images/hero-atmosphere.webp" fetchPriority="high" />

        {/* Fonts (Google Fonts) */}
        <link rel="stylesheet" href={FONT_URL} />

        {/* Schema.org Structured Data */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </head>
      <body className="bg-[#0A0A0E] text-stone-100 antialiased overflow-x-hidden">{children}</body>
    </html>
  );
}
