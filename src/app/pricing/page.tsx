'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Header, Footer } from '@/components/layout';

const PRICING_TIERS = [
  {
    name: 'Starter',
    description: 'For individual preparers getting started',
    monthlyPrice: 29,
    annualPrice: 24,
    features: [
      'Single user',
      'Basic tax research (100 queries/mo)',
      'Document storage (5GB)',
      'Email support',
      'Standard response time',
    ],
    cta: 'Start free trial',
    ctaStyle: 'secondary',
    popular: false,
  },
  {
    name: 'Professional',
    description: 'For growing firms that need the full suite',
    monthlyPrice: 99,
    annualPrice: 79,
    perSeat: true,
    features: [
      'Everything in Starter',
      'Unlimited tax research',
      'Full CRM functionality',
      'AI agent workflows',
      'Client portal',
      'Priority support',
      'Team collaboration',
    ],
    cta: 'Get started',
    ctaStyle: 'primary',
    popular: true,
  },
  {
    name: 'Enterprise',
    description: 'For large firms with custom needs',
    monthlyPrice: null,
    annualPrice: null,
    features: [
      'Everything in Professional',
      'Custom integrations',
      'SSO / SAML',
      'Dedicated success manager',
      'SLA guarantees',
      'On-premise deployment',
      'Custom training',
      'Audit compliance tools',
    ],
    cta: 'Contact sales',
    ctaStyle: 'secondary',
    popular: false,
  },
];

const FAQS = [
  {
    question: 'Can I try Margen before committing?',
    answer: 'Yes! All plans include a 14-day free trial with full access to features. No credit card required to start.',
  },
  {
    question: 'How does per-seat pricing work?',
    answer: 'Each seat allows one team member to access Margen. You can add or remove seats at any time, and billing adjusts automatically.',
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'We accept all major credit cards (Visa, Mastercard, American Express) and ACH bank transfers for annual plans.',
  },
  {
    question: 'Can I switch plans later?',
    answer: 'Absolutely. You can upgrade or downgrade your plan at any time. When upgrading, you\'ll get immediate access to new features. Downgrades take effect at the next billing cycle.',
  },
  {
    question: 'Is there a discount for annual billing?',
    answer: 'Yes, annual plans save you 20% compared to monthly billing. The annual price shown reflects this discount.',
  },
  {
    question: 'What happens to my data if I cancel?',
    answer: 'Your data remains accessible for 30 days after cancellation. You can export everything during this period. After 30 days, data is securely deleted per our retention policy.',
  },
];

const COMPARISON_FEATURES = [
  { name: 'Users', starter: '1', professional: 'Unlimited', enterprise: 'Unlimited' },
  { name: 'Tax research queries', starter: '100/mo', professional: 'Unlimited', enterprise: 'Unlimited' },
  { name: 'Document storage', starter: '5 GB', professional: '100 GB', enterprise: 'Unlimited' },
  { name: 'CRM & client management', starter: false, professional: true, enterprise: true },
  { name: 'AI agent workflows', starter: false, professional: true, enterprise: true },
  { name: 'Client portal', starter: false, professional: true, enterprise: true },
  { name: 'E-filing integration', starter: false, professional: true, enterprise: true },
  { name: 'Team collaboration', starter: false, professional: true, enterprise: true },
  { name: 'Priority support', starter: false, professional: true, enterprise: true },
  { name: 'Custom integrations', starter: false, professional: false, enterprise: true },
  { name: 'SSO / SAML', starter: false, professional: false, enterprise: true },
  { name: 'Dedicated success manager', starter: false, professional: false, enterprise: true },
  { name: 'SLA guarantees', starter: false, professional: false, enterprise: true },
  { name: 'On-premise deployment', starter: false, professional: false, enterprise: true },
];

export default function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(true);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <>
      <Header />
      <main id="main-content">
        {/* Hero */}
        <section className="pt-[120px] pb-v3 px-g2">
          <div className="mx-auto max-w-container">
            <div className="max-w-2xl mx-auto text-center">
              <h1 className="text-xl md:text-2xl text-text mb-v0.5">
                Simple, transparent pricing
              </h1>
              <p className="text-md text-text-secondary">
                Start free. Upgrade as you grow.
              </p>
            </div>
          </div>
        </section>

        {/* Billing Toggle */}
        <section className="pb-v2 px-g2">
          <div className="mx-auto max-w-container">
            <div className="flex items-center justify-center gap-4">
              <span className={`text-sm ${!isAnnual ? 'text-text' : 'text-text-tertiary'}`}>
                Monthly
              </span>
              <button
                onClick={() => setIsAnnual(!isAnnual)}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  isAnnual ? 'bg-accent' : 'bg-card-03'
                }`}
                aria-label={`Switch to ${isAnnual ? 'monthly' : 'annual'} billing`}
              >
                <span
                  className={`absolute top-1 left-1 w-4 h-4 bg-text rounded-full transition-transform ${
                    isAnnual ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
              <span className={`text-sm ${isAnnual ? 'text-text' : 'text-text-tertiary'}`}>
                Annual
                <span className="ml-1 text-accent text-xs">(Save 20%)</span>
              </span>
            </div>
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="pb-v4 px-g2">
          <div className="mx-auto max-w-container">
            <div className="grid md:grid-cols-3 gap-g1">
              {PRICING_TIERS.map((tier) => (
                <div
                  key={tier.name}
                  className={`card flex flex-col p-6 relative ${
                    tier.popular ? 'border-accent' : ''
                  }`}
                >
                  {tier.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-bg text-xs px-3 py-1 rounded-full">
                      Most popular
                    </div>
                  )}

                  <div className="mb-6">
                    <h3 className="text-lg text-text mb-1">{tier.name}</h3>
                    <p className="text-sm text-text-secondary">{tier.description}</p>
                  </div>

                  <div className="mb-6">
                    {tier.monthlyPrice !== null ? (
                      <>
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl text-text tabular-nums">
                            ${isAnnual ? tier.annualPrice : tier.monthlyPrice}
                          </span>
                          <span className="text-sm text-text-tertiary">
                            /{tier.perSeat ? 'seat/' : ''}mo
                          </span>
                        </div>
                        {isAnnual && (
                          <p className="text-xs text-text-tertiary mt-1">
                            Billed annually
                          </p>
                        )}
                      </>
                    ) : (
                      <div className="text-xl text-text">Custom pricing</div>
                    )}
                  </div>

                  <ul className="space-y-3 mb-8 flex-1">
                    {tier.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                        <span className="text-ansi-green mt-0.5">✓</span>
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <Link
                    href={tier.name === 'Enterprise' ? '/enterprise' : '/chat'}
                    className={tier.ctaStyle === 'primary' ? 'btn-accent w-full justify-center' : 'btn-secondary w-full justify-center'}
                  >
                    {tier.cta}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Feature Comparison */}
        <section className="py-v4 px-g2 bg-card">
          <div className="mx-auto max-w-container">
            <h2 className="text-xl text-text mb-v2 text-center">Compare plans</h2>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className="border-b border-border-02">
                    <th className="text-left text-sm text-text-secondary font-normal py-4 pr-4">
                      Feature
                    </th>
                    <th className="text-center text-sm text-text font-normal py-4 px-4 w-32">
                      Starter
                    </th>
                    <th className="text-center text-sm text-text font-normal py-4 px-4 w-32 bg-accent/5">
                      Professional
                    </th>
                    <th className="text-center text-sm text-text font-normal py-4 pl-4 w-32">
                      Enterprise
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON_FEATURES.map((feature, i) => (
                    <tr key={i} className="border-b border-border-01">
                      <td className="text-sm text-text-secondary py-4 pr-4">
                        {feature.name}
                      </td>
                      <td className="text-center text-sm py-4 px-4">
                        {typeof feature.starter === 'boolean' ? (
                          feature.starter ? (
                            <span className="text-ansi-green">✓</span>
                          ) : (
                            <span className="text-text-tertiary">—</span>
                          )
                        ) : (
                          <span className="text-text-secondary">{feature.starter}</span>
                        )}
                      </td>
                      <td className="text-center text-sm py-4 px-4 bg-accent/5">
                        {typeof feature.professional === 'boolean' ? (
                          feature.professional ? (
                            <span className="text-ansi-green">✓</span>
                          ) : (
                            <span className="text-text-tertiary">—</span>
                          )
                        ) : (
                          <span className="text-text-secondary">{feature.professional}</span>
                        )}
                      </td>
                      <td className="text-center text-sm py-4 pl-4">
                        {typeof feature.enterprise === 'boolean' ? (
                          feature.enterprise ? (
                            <span className="text-ansi-green">✓</span>
                          ) : (
                            <span className="text-text-tertiary">—</span>
                          )
                        ) : (
                          <span className="text-text-secondary">{feature.enterprise}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-v4 px-g2">
          <div className="mx-auto max-w-container">
            <h2 className="text-xl text-text mb-v2 text-center">
              Frequently asked questions
            </h2>

            <div className="max-w-2xl mx-auto">
              {FAQS.map((faq, i) => (
                <div key={i} className="border-b border-border-01">
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full py-4 flex items-center justify-between text-left"
                  >
                    <span className="text-base text-text">{faq.question}</span>
                    <span className="text-text-tertiary ml-4 flex-shrink-0">
                      {openFaq === i ? '−' : '+'}
                    </span>
                  </button>
                  {openFaq === i && (
                    <div className="pb-4 text-sm text-text-secondary leading-relaxed">
                      {faq.answer}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-v4 px-g2 bg-card">
          <div className="mx-auto max-w-container text-center">
            <h2 className="text-lg text-text mb-v0.5">Ready to get started?</h2>
            <p className="text-base text-text-secondary mb-v1">
              Join hundreds of tax professionals using Margen to work faster.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link href="/chat" className="btn-accent">
                Start free trial
              </Link>
              <Link href="/enterprise" className="btn-secondary">
                Contact sales
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
