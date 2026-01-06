import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Margen - The best way to professionally prep taxes with AI',
  description: 'Built for speed and accuracy. Margen is the best way to professioanlly prep taxes with AI.',
  openGraph: {
    title: 'Margen - The best way to professionally prep taxes with AI',
    description: 'Built for speed and accuracy. Margen is the best way to professioanlly prep taxes with AI.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="dark">
      <body>
        <a href="#main-content" className="skip-nav">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
