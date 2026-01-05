'use client';

import { motion } from 'framer-motion';
import { Container, Section, Button } from '@/components/ui';
import { SITE_CONFIG } from '@/lib/constants';

export function CallToAction() {
  return (
    <Section spacing="lg">
      <Container>
        <div className="relative max-w-3xl mx-auto text-center">
          {/* Background glow */}
          <div className="absolute inset-0 bg-gradient-radial from-theme-accent/10 to-transparent blur-3xl -z-10" />

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-display-lg md:text-display-xl font-medium mb-6"
          >
            Try {SITE_CONFIG.name} today.
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-body-lg text-theme-text-secondary mb-10"
          >
            Join thousands of tax professionals who are working smarter with AI.
            Start your free trial today.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Button size="lg">
              Get Started Free
              <ArrowRightIcon />
            </Button>
            <Button variant="text" size="lg">
              Contact Sales
            </Button>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-body-sm text-theme-text-tertiary mt-6"
          >
            No credit card required. Free 14-day trial.
          </motion.p>
        </div>
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
