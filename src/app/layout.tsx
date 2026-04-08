import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: "Boly's — Bolis Artesanales en San Bartolo Tutotepec",
  description:
    'Bolis artesanales hechos con cariño. Sabores de agua, leche y gourmet. ¡Pide el tuyo por WhatsApp!',
  keywords: ['bolis', 'san bartolo tutotepec', 'helados', 'artesanales', 'hidalgo'],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: "Boly's",
  },
  icons: {
    icon: '/icons/icon-192.png',
    apple: '/icons/icon-192.png',
  },
  openGraph: {
    title: "Boly's — Bolis Artesanales",
    description: 'Bolis artesanales hechos con cariño en San Bartolo Tutotepec.',
    type: 'website',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#FFD93D',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="bg-white min-h-screen">
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js');
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
