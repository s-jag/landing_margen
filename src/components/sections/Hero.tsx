'use client';

import { motion } from 'framer-motion';
import { Container, Section, Button } from '@/components/ui';
import { ProductMockup } from '@/components/features/ProductMockup';
import { SITE_CONFIG } from '@/lib/constants';

export function Hero() {
  return (
    <Section spacing="lg" className="pt-32 md:pt-40 overflow-hidden">
      <Container>
        {/* Hero content */}
        <div className="max-w-4xl mx-auto text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-theme-card border border-theme-border mb-8">
              <span className="inline-block w-2 h-2 rounded-full bg-theme-accent animate-pulse" />
              <span className="text-sm text-theme-text-secondary">
                Now in Beta
              </span>
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-display-lg md:text-display-xl lg:text-display-2xl font-medium text-balance mb-6"
          >
            Built to make you extraordinarily productive,{' '}
            <span className="text-gradient">{SITE_CONFIG.name}</span> is the
            best way to prepare taxes with AI.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-body-lg text-theme-text-secondary max-w-2xl mx-auto mb-10"
          >
            Trusted by tax professionals across the country. Research tax code,
            analyze documents, and complete returns faster than ever before.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Button size="lg">
              Get Started Free
              <ArrowRightIcon />
            </Button>
            <Button variant="ghost" size="lg">
              Watch Demo
              <PlayIcon />
            </Button>
          </motion.div>
        </div>

        {/* Product mockup */}
        <ProductMockup />
      </Container>
    </Section>
  );
}

function ArrowRightIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3.5 8h9M8.5 4l4 4-4 4" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="currentColor"
    >
      <path d="M4 3.5v9l8-4.5-8-4.5z" />
    </svg>
  );
}
