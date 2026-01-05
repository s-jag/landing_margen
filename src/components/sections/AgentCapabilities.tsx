'use client';

import { motion } from 'framer-motion';
import { Container, Section, Card } from '@/components/ui';
import { AGENT_FEATURES } from '@/lib/constants';

export function AgentCapabilities() {
  return (
    <Section background="card">
      <Container>
        <div className="max-w-4xl mx-auto">
          {/* Section header */}
          <div className="text-center mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-theme-bg border border-theme-accent/30 mb-6"
            >
              <span className="text-sm text-theme-accent font-medium">
                Coming Soon
              </span>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-display-md md:text-display-lg font-medium mb-4"
            >
              Agents turn ideas into completed returns
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-body-lg text-theme-text-secondary"
            >
              Our next-generation AI agents will handle complex tax scenarios
              autonomously, from research to preparation.
            </motion.p>
          </div>

          {/* Agent features */}
          <div className="grid md:grid-cols-3 gap-6">
            {AGENT_FEATURES.map((feature, index) => (
              <motion.div
                key={feature.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 * index }}
              >
                <Card
                  padding="lg"
                  className="h-full bg-theme-bg border-theme-accent/20 relative overflow-hidden group"
                >
                  {/* Glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-theme-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                  <div className="relative">
                    <AgentIcon />
                    <h3 className="text-body-lg font-medium mt-4 mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-body-sm text-theme-text-secondary">
                      {feature.description}
                    </p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </Container>
    </Section>
  );
}

function AgentIcon() {
  return (
    <div className="w-10 h-10 rounded-lg bg-theme-accent/10 flex items-center justify-center">
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        className="text-theme-accent"
      >
        <path
          d="M12 2L2 7L12 12L22 7L12 2Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M2 17L12 22L22 17"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M2 12L12 17L22 12"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
