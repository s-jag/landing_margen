'use client';

import { motion } from 'framer-motion';
import { Container, Section, Card } from '@/components/ui';
import { TESTIMONIALS } from '@/lib/constants';

export function SocialProof() {
  return (
    <Section>
      <Container>
        {/* Section header */}
        <div className="text-center mb-16">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-body-sm text-theme-accent font-medium uppercase tracking-wider mb-4"
          >
            Trusted by Professionals
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-display-md md:text-display-lg font-medium mb-4"
          >
            Tax professionals love Margen
          </motion.h2>
        </div>

        {/* Logo garden placeholder */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-16"
        >
          <div className="grid grid-cols-4 md:grid-cols-8 gap-8 items-center justify-items-center opacity-40">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="w-20 h-8 bg-theme-text-tertiary/20 rounded"
              />
            ))}
          </div>
          <p className="text-center text-body-sm text-theme-text-tertiary mt-4">
            Trusted by leading accounting firms and tax professionals
          </p>
        </motion.div>

        {/* Testimonials */}
        <div className="grid md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((testimonial, index) => (
            <motion.div
              key={testimonial.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 * index }}
            >
              <Card padding="lg" className="h-full flex flex-col">
                {/* Quote */}
                <blockquote className="text-body-md text-theme-text mb-6 flex-1">
                  "{testimonial.quote}"
                </blockquote>

                {/* Author */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-theme-accent/20 flex items-center justify-center text-theme-accent font-medium">
                    {testimonial.author.charAt(0)}
                  </div>
                  <div>
                    <div className="text-body-sm font-medium text-theme-text">
                      {testimonial.author}
                    </div>
                    <div className="text-body-xs text-theme-text-secondary">
                      {testimonial.role}, {testimonial.company}
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </Container>
    </Section>
  );
}
