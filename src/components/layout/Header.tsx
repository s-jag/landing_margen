'use client';

import { useState } from 'react';
import Link from 'next/link';

const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'Enterprise', href: '#enterprise' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Resources', href: '#resources' },
];

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-bg">
      <div className="mx-auto max-w-container px-g2">
        <nav className="flex h-[52px] items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <MargenLogo />
            <span className="text-base font-medium text-text">Margen</span>
          </Link>

          {/* Desktop Navigation - centered */}
          <div className="hidden md:flex items-center gap-g0.5">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-g1.5 py-1 text-sm text-text-secondary hover:text-text transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* CTAs */}
          <div className="hidden md:flex items-center gap-g1">
            <Link
              href="/login"
              className="px-g1.5 py-1 text-sm text-text-secondary hover:text-text transition-colors"
            >
              Sign in
            </Link>
            <Link href="/chat" className="btn">
              Try for Free
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-text-secondary"
            aria-label="Toggle menu"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M3 5h14M3 10h14M3 15h14" />
            </svg>
          </button>
        </nav>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-bg border-t border-border-01 px-g2 py-v1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block py-2 text-sm text-text-secondary"
              onClick={() => setMobileMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <div className="mt-v1 pt-v1 border-t border-border-01 flex flex-col gap-2">
            <Link href="/login" className="text-sm text-text-secondary">Sign in</Link>
            <Link href="/download" className="btn w-full justify-center">Download</Link>
          </div>
        </div>
      )}
    </header>
  );
}

function MargenLogo() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path
        d="M2 4h3l5 8 5-8h3v12h-3V8l-5 8-5-8v8H2V4z"
        fill="currentColor"
        className="text-text"
      />
    </svg>
  );
}
