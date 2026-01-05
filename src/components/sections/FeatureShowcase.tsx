'use client';

import { motion } from 'framer-motion';
import { Container, Section, Card } from '@/components/ui';
import { FEATURES } from '@/lib/constants';

export function FeatureShowcase() {
  return (
    <Section id="features" background="gradient">
      <Container>
        {/* Section header */}
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-display-md md:text-display-lg font-medium mb-4"
          >
            Everything you need to prepare taxes smarter
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-body-lg text-theme-text-secondary max-w-2xl mx-auto"
          >
            Margen combines powerful AI with deep tax knowledge to help you
            research faster, prepare accurately, and serve more clients.
          </motion.p>
        </div>

        {/* Feature grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {FEATURES.map((feature, index) => (
            <motion.div
              key={feature.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card variant="hover" padding="lg" className="h-full">
                <FeatureIcon id={feature.id} />
                <h3 className="text-display-sm font-medium mt-4 mb-2">
                  {feature.title}
                </h3>
                <p className="text-body-md text-theme-text-secondary">
                  {feature.description}
                </p>
              </Card>
            </motion.div>
          ))}
        </div>
      </Container>
    </Section>
  );
}

function FeatureIcon({ id }: { id: string }) {
  const icons: Record<string, React.ReactNode> = {
    'ai-chat': (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" className="text-theme-accent">
        <rect width="40" height="40" rx="10" fill="currentColor" fillOpacity="0.1" />
        <path
          d="M12 16C12 14.8954 12.8954 14 14 14H26C27.1046 14 28 14.8954 28 16V22C28 23.1046 27.1046 24 26 24H22L18 28V24H14C12.8954 24 12 23.1046 12 22V16Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="16" cy="19" r="1" fill="currentColor" />
        <circle cx="20" cy="19" r="1" fill="currentColor" />
        <circle cx="24" cy="19" r="1" fill="currentColor" />
      </svg>
    ),
    'document-analysis': (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" className="text-theme-accent">
        <rect width="40" height="40" rx="10" fill="currentColor" fillOpacity="0.1" />
        <path
          d="M14 12H22L28 18V28C28 29.1046 27.1046 30 26 30H14C12.8954 30 12 29.1046 12 28V14C12 12.8954 12.8954 12 14 12Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M22 12V18H28" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M16 22H24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M16 26H20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    'smart-autocomplete': (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" className="text-theme-accent">
        <rect width="40" height="40" rx="10" fill="currentColor" fillOpacity="0.1" />
        <path
          d="M12 20H18M22 20H28"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M20 12V18M20 22V28"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <circle cx="20" cy="20" r="8" stroke="currentColor" strokeWidth="1.5" />
        <path d="M26 26L30 30" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    'research-assistant': (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" className="text-theme-accent">
        <rect width="40" height="40" rx="10" fill="currentColor" fillOpacity="0.1" />
        <path
          d="M28 28L23.5 23.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <circle cx="18" cy="18" r="6" stroke="currentColor" strokeWidth="1.5" />
        <path d="M15 18H21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M18 15V21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  };

  return icons[id] || null;
}
