import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Margen - AI-Powered Tax Preparation for Professionals',
  description:
    'The most advanced AI assistant for tax professionals. Research tax code, analyze documents, and prepare returns faster with AI.',
  keywords: [
    'tax software',
    'AI tax',
    'tax preparation',
    'CPA software',
    'tax research',
    'tax professionals',
    'RAG',
    'tax AI assistant',
  ],
  authors: [{ name: 'Margen' }],
  openGraph: {
    title: 'Margen - AI-Powered Tax Preparation for Professionals',
    description:
      'The most advanced AI assistant for tax professionals. Research tax code, analyze documents, and prepare returns faster with AI.',
    url: 'https://margen.ai',
    siteName: 'Margen',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Margen - AI-Powered Tax Preparation for Professionals',
    description:
      'The most advanced AI assistant for tax professionals. Research tax code, analyze documents, and prepare returns faster with AI.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      data-theme="dark"
      className={`${inter.variable} ${jetbrainsMono.variable}`}
    >
      <body className="min-h-screen bg-theme-bg antialiased">
        <a href="#main-content" className="skip-nav">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
