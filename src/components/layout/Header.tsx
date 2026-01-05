'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui';
import { NAV_LINKS, SITE_CONFIG } from '@/lib/constants';
import { MobileNav } from './MobileNav';

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <header
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
          isScrolled
            ? 'bg-theme-bg/80 backdrop-blur-xl border-b border-theme-border'
            : 'bg-transparent'
        )}
      >
        <div className="mx-auto max-w-container px-6">
          <nav className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link
              href="/"
              className="flex items-center gap-2 text-xl font-semibold text-theme-fg"
            >
              <MargenLogo />
              <span>{SITE_CONFIG.name}</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm text-theme-text-secondary hover:text-theme-text transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* CTAs */}
            <div className="hidden md:flex items-center gap-3">
              <Button variant="ghost" size="sm">
                Sign In
              </Button>
              <Button size="sm">Get Started</Button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileNavOpen(true)}
              className="md:hidden p-2 text-theme-text-secondary hover:text-theme-text"
              aria-label="Open menu"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
          </nav>
        </div>
      </header>

      <MobileNav isOpen={isMobileNavOpen} onClose={() => setIsMobileNavOpen(false)} />
    </>
  );
}

function MargenLogo() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="text-theme-accent"
    >
      <rect width="28" height="28" rx="6" fill="currentColor" />
      <path
        d="M7 9h2.5l4.5 7 4.5-7H21v10h-2.5v-6l-4 6h-1l-4-6v6H7V9z"
        fill="var(--color-theme-bg)"
      />
    </svg>
  );
}
