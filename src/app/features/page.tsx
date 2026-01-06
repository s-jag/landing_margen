'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Header, Footer } from '@/components/layout';

const ADDITIONAL_FEATURES = [
  {
    title: 'Model Selection',
    description: 'Choose from GPT-4, Claude, Gemini, and more. Always use the best model for the task.',
    icon: '🧠',
  },
  {
    title: 'Multi-State Support',
    description: 'Handle returns across all 50 states with jurisdiction-specific guidance.',
    icon: '🗺️',
  },
  {
    title: 'Audit Trail',
    description: 'Complete history of every action. Know who did what, when, and why.',
    icon: '📋',
  },
  {
    title: 'Client Portal',
    description: 'Secure document collection and delivery. Clients can upload and sign from anywhere.',
    icon: '🔐',
  },
  {
    title: 'Secure Sharing',
    description: 'Share documents with expiring links, watermarks, and download tracking.',
    icon: '🔗',
  },
  {
    title: 'Mobile Access',
    description: 'Review and approve from your phone. Push notifications for urgent items.',
    icon: '📱',
  },
];

const INTEGRATIONS = [
  'CCH Axcess',
  'Drake Software',
  'Lacerte',
  'ProSeries',
  'UltraTax CS',
  'QuickBooks',
  'Xero',
  'Salesforce',
];

export default function FeaturesPage() {
  return (
    <>
      <Header />
      <main id="main-content">
        {/* Hero */}
        <section className="pt-[120px] pb-v4 px-g2 ledger-grid">
          <div className="mx-auto max-w-container">
            <div className="max-w-2xl">
              <h1 className="text-xl md:text-2xl text-text mb-v0.5">
                Everything you need to prepare taxes faster
              </h1>
              <p className="text-md text-text-secondary mb-v1">
                AI-powered tools built for tax professionals. Research, organize, and file with confidence.
              </p>
              <Link href="/chat" className="btn-accent inline-flex">
                Try the research assistant
              </Link>
            </div>
          </div>
        </section>

        {/* Feature 1: CRM & Practice Management */}
        <section className="py-v4 px-g2 bg-card">
          <div className="mx-auto max-w-container">
            <div className="grid md:grid-cols-2 gap-v2 items-center">
              <div className="max-w-md">
                <div className="text-sm text-accent mb-2">Practice Management</div>
                <h2 className="text-xl text-text mb-v0.5">
                  Never lose track of a client again
                </h2>
                <p className="text-base text-text-secondary mb-v1">
                  Your entire practice in one place. Track every client, document, and deadline
                  with AI that works the way you do.
                </p>
                <ul className="space-y-3 mb-v1">
                  <li className="flex items-center gap-2 text-sm text-text-secondary">
                    <span className="text-accent">→</span>
                    Client database with smart search
                  </li>
                  <li className="flex items-center gap-2 text-sm text-text-secondary">
                    <span className="text-accent">→</span>
                    Document management with OCR
                  </li>
                  <li className="flex items-center gap-2 text-sm text-text-secondary">
                    <span className="text-accent">→</span>
                    Workflow automation and templates
                  </li>
                  <li className="flex items-center gap-2 text-sm text-text-secondary">
                    <span className="text-accent">→</span>
                    Team collaboration and assignments
                  </li>
                </ul>
                <Link href="/chat" className="link-accent inline-flex items-center gap-1">
                  Try the demo
                  <span>→</span>
                </Link>
              </div>

              {/* CRM Mockup */}
              <div className="mockup-window">
                <div className="mockup-titlebar">
                  <div className="mockup-dots">
                    <span className="mockup-dot" />
                    <span className="mockup-dot" />
                    <span className="mockup-dot" />
                  </div>
                  <span className="text-xs text-text-tertiary">Margen — Clients</span>
                  <div className="w-16" />
                </div>
                <div className="p-4 space-y-2">
                  <ClientRow name="Johnson, Michael" status="In Progress" returns={2} color="accent" />
                  <ClientRow name="Chen, Sarah" status="Ready for Review" returns={1} color="ansi-green" />
                  <ClientRow name="Williams Corp" status="Awaiting Documents" returns={3} color="text-tertiary" />
                  <ClientRow name="Patel Family Trust" status="Complete" returns={2} color="ansi-green" />
                  <ClientRow name="Martinez, Elena" status="In Progress" returns={1} color="accent" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature 2: Tax Research Pipeline */}
        <section className="py-v4 px-g2">
          <div className="mx-auto max-w-container">
            <div className="grid md:grid-cols-2 gap-v2 items-center">
              {/* Research Mockup */}
              <div className="mockup-window order-2 md:order-1">
                <div className="mockup-titlebar">
                  <div className="mockup-dots">
                    <span className="mockup-dot" />
                    <span className="mockup-dot" />
                    <span className="mockup-dot" />
                  </div>
                  <span className="text-xs text-text-tertiary">Margen — Research</span>
                  <div className="w-16" />
                </div>
                <div className="p-4">
                  <SearchDemo />
                </div>
              </div>

              <div className="max-w-md order-1 md:order-2">
                <div className="text-sm text-accent mb-2">Tax Research</div>
                <h2 className="text-xl text-text mb-v0.5">
                  Answers you can trust, citations included
                </h2>
                <p className="text-base text-text-secondary mb-v1">
                  Ask any tax question in plain English. Get accurate answers with citations
                  to the IRC, regulations, and case law — verified to prevent hallucination.
                </p>
                <ul className="space-y-3 mb-v1">
                  <li className="flex items-center gap-2 text-sm text-text-secondary">
                    <span className="text-accent">→</span>
                    Regulatory Q&A with source citations
                  </li>
                  <li className="flex items-center gap-2 text-sm text-text-secondary">
                    <span className="text-accent">→</span>
                    Automatic citation verification
                  </li>
                  <li className="flex items-center gap-2 text-sm text-text-secondary">
                    <span className="text-accent">→</span>
                    Multi-source search (IRS, courts, state)
                  </li>
                  <li className="flex items-center gap-2 text-sm text-text-secondary">
                    <span className="text-accent">→</span>
                    Hallucination detection built-in
                  </li>
                </ul>
                <Link href="/indexing" className="link-accent inline-flex items-center gap-1">
                  How it works
                  <span>→</span>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Feature 3: E-Filing & Workflow */}
        <section className="py-v4 px-g2 bg-card">
          <div className="mx-auto max-w-container">
            <div className="grid md:grid-cols-2 gap-v2 items-center">
              <div className="max-w-md">
                <div className="text-sm text-accent mb-2">E-Filing</div>
                <h2 className="text-xl text-text mb-v0.5">
                  From intake to e-file, all in one place
                </h2>
                <p className="text-base text-text-secondary mb-v1">
                  Combine CRM and research into a seamless e-filing workflow. AI auto-fills forms,
                  flags issues, and guides you through review — so you can file with confidence.
                </p>
                <ul className="space-y-3 mb-v1">
                  <li className="flex items-center gap-2 text-sm text-text-secondary">
                    <span className="text-accent">→</span>
                    AI-powered form auto-fill
                  </li>
                  <li className="flex items-center gap-2 text-sm text-text-secondary">
                    <span className="text-accent">→</span>
                    Direct e-file integration
                  </li>
                  <li className="flex items-center gap-2 text-sm text-text-secondary">
                    <span className="text-accent">→</span>
                    Multi-level review workflows
                  </li>
                  <li className="flex items-center gap-2 text-sm text-text-secondary">
                    <span className="text-accent">→</span>
                    Client delivery and signatures
                  </li>
                </ul>
                <Link href="/enterprise" className="link-accent inline-flex items-center gap-1">
                  Contact sales
                  <span>→</span>
                </Link>
              </div>

              {/* E-Filing Mockup */}
              <div className="mockup-window">
                <div className="mockup-titlebar">
                  <div className="mockup-dots">
                    <span className="mockup-dot" />
                    <span className="mockup-dot" />
                    <span className="mockup-dot" />
                  </div>
                  <span className="text-xs text-text-tertiary">Margen — Form 1040</span>
                  <div className="w-16" />
                </div>
                <div className="p-4 space-y-4">
                  <EFileRow label="Filing Status" value="Married Filing Jointly" auto />
                  <EFileRow label="Wages (W-2)" value="$185,450" auto />
                  <EFileRow label="Interest Income" value="$2,340" auto />
                  <EFileRow label="QBI Deduction" value="$12,500" auto />
                  <div className="flex items-center gap-2 p-2 rounded bg-accent/10 border border-accent/20">
                    <span className="text-accent text-sm">⚡</span>
                    <span className="text-sm text-text">
                      AI suggests Schedule C attachment based on 1099-NEC
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Additional Features Grid */}
        <section className="py-v4 px-g2">
          <div className="mx-auto max-w-container">
            <h2 className="text-xl text-text mb-v2 text-center">
              And everything else you need
            </h2>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-g1">
              {ADDITIONAL_FEATURES.map((feature) => (
                <div key={feature.title} className="card p-6">
                  <div className="text-2xl mb-3">{feature.icon}</div>
                  <h3 className="text-base font-medium text-text mb-2">{feature.title}</h3>
                  <p className="text-sm text-text-secondary">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Integrations */}
        <section className="py-v4 px-g2 bg-card">
          <div className="mx-auto max-w-container">
            <div className="max-w-2xl mx-auto text-center mb-v2">
              <h2 className="text-xl text-text mb-v0.5">Works with your tools</h2>
              <p className="text-base text-text-secondary">
                Margen integrates with the tax and accounting software you already use.
              </p>
            </div>

            <div className="flex items-center justify-center gap-g1 flex-wrap">
              {INTEGRATIONS.map((name) => (
                <div key={name} className="px-6 py-4 bg-bg border border-border-01 rounded-xs">
                  <span className="text-sm text-text-secondary">{name}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-v4 px-g2">
          <div className="mx-auto max-w-container text-center">
            <h2 className="text-lg text-text mb-v0.5">Ready to work faster?</h2>
            <p className="text-base text-text-secondary mb-v1">
              Start your free trial today. No credit card required.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link href="/chat" className="btn-accent">
                Start free trial
              </Link>
              <Link href="/pricing" className="btn-secondary">
                View pricing
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

// Mockup Components
function ClientRow({
  name,
  status,
  returns,
  color,
}: {
  name: string;
  status: string;
  returns: number;
  color: string;
}) {
  return (
    <div className="flex items-center justify-between p-3 bg-card-02 rounded-xs">
      <div>
        <div className="text-sm text-text">{name}</div>
        <div className={`text-xs text-${color}`}>{status}</div>
      </div>
      <div className="text-xs text-text-tertiary">{returns} return{returns !== 1 ? 's' : ''}</div>
    </div>
  );
}

function SearchDemo() {
  const [displayedText, setDisplayedText] = useState('');
  const [showResults, setShowResults] = useState(false);
  const fullText = 'What are the QBI deduction limitations for specified service trades?';

  useEffect(() => {
    let i = 0;
    setDisplayedText('');
    setShowResults(false);

    const startDelay = setTimeout(() => {
      const typeInterval = setInterval(() => {
        if (i < fullText.length) {
          setDisplayedText(fullText.slice(0, i + 1));
          i++;
        } else {
          clearInterval(typeInterval);
          setTimeout(() => setShowResults(true), 500);
        }
      }, 40);

      return () => clearInterval(typeInterval);
    }, 800);

    return () => clearTimeout(startDelay);
  }, []);

  return (
    <div className="space-y-3">
      <div className="bg-card rounded-xs border border-border-01 px-3 py-2">
        <span className="text-sm text-text-secondary">
          {displayedText || 'Ask any tax question...'}
          {displayedText && displayedText.length < fullText.length && (
            <span className="typing-cursor" />
          )}
        </span>
      </div>

      {showResults && (
        <div className="space-y-2">
          <div className="text-xs text-text-tertiary">Found 3 relevant sources</div>
          <SearchResult
            title="IRC § 199A - Qualified Business Income Deduction"
            source="26 U.S.C. § 199A(d)(2)"
            excerpt="For specified service trades or businesses, the deduction phases out for taxpayers with taxable income exceeding $170,050 (single) or $340,100 (MFJ)..."
          />
          <SearchResult
            title="Treas. Reg. § 1.199A-5"
            source="Treasury Regulations"
            excerpt="A specified service trade or business (SSTB) means any trade or business involving the performance of services in health, law, accounting..."
          />
        </div>
      )}
    </div>
  );
}

function SearchResult({
  title,
  source,
  excerpt,
}: {
  title: string;
  source: string;
  excerpt: string;
}) {
  return (
    <div className="p-3 bg-card-02 rounded-xs border border-border-01">
      <div className="text-sm text-text mb-1">{title}</div>
      <div className="text-xs text-accent mb-1">{source}</div>
      <div className="text-xs text-text-tertiary line-clamp-2">{excerpt}</div>
    </div>
  );
}

function EFileRow({
  label,
  value,
  auto,
}: {
  label: string;
  value: string;
  auto?: boolean;
}) {
  return (
    <div className="flex items-center justify-between p-2 border-b border-border-01">
      <span className="text-sm text-text-secondary">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-sm text-text tabular-nums">{value}</span>
        {auto && (
          <span className="text-xs text-ansi-green">✓ Auto</span>
        )}
      </div>
    </div>
  );
}
