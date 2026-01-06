import Link from 'next/link';
import { Header, Footer } from '@/components/layout';

const STATS = [
  { value: '500+', label: 'Accounting firms' },
  { value: '99.9%', label: 'Uptime SLA' },
  { value: '50M+', label: 'Returns processed' },
  { value: '<24h', label: 'Support response' },
];

// Mockup Components for Benefits Section
function SecurityMockup() {
  return (
    <div className="bg-card-02 rounded-xs border border-border-01 p-3 mb-4">
      <div className="text-xs text-text-tertiary mb-2">Activity Log</div>
      <div className="space-y-2">
        <div className="flex items-start gap-2">
          <span className="text-ansi-green text-xs">✓</span>
          <div>
            <div className="text-xs text-text">Sarah Chen viewed Form 1040</div>
            <div className="text-xs text-text-tertiary">Today, 2:34 PM</div>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <span className="text-ansi-green text-xs">✓</span>
          <div>
            <div className="text-xs text-text">Mike Ross exported K-1 data</div>
            <div className="text-xs text-text-tertiary">Today, 1:15 PM</div>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <span className="text-ansi-green text-xs">✓</span>
          <div>
            <div className="text-xs text-text">Jane Smith modified client...</div>
            <div className="text-xs text-text-tertiary">Today, 11:42 AM</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SupportMockup() {
  return (
    <div className="bg-card-02 rounded-xs border border-border-01 p-3 mb-4">
      <div className="text-xs text-text-tertiary mb-2">Priority Support</div>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center">
          <span className="text-xs text-accent">JP</span>
        </div>
        <div>
          <div className="text-xs text-text">Jessica Park</div>
          <div className="text-xs text-text-tertiary">Your CSM</div>
        </div>
      </div>
      <div className="flex items-center gap-2 text-xs">
        <span className="bg-ansi-green/20 text-ansi-green px-2 py-0.5 rounded-full">Online</span>
        <span className="text-text-tertiary">Response: &lt;2 hrs</span>
      </div>
    </div>
  );
}

function IntegrationsMockup() {
  return (
    <div className="bg-card-02 rounded-xs border border-border-01 overflow-hidden mb-4">
      <div className="px-3 py-1.5 border-b border-border-01 text-xs text-text-tertiary">
        api/clients.ts
      </div>
      <div className="p-3 font-mono text-xs">
        <div><span className="text-accent">POST</span> <span className="text-text">/api/v1/clients</span></div>
        <div className="mt-2 text-text-tertiary">Authorization: Bearer sk_...</div>
        <div className="mt-2 text-text-secondary">
          {`{`} <span className="text-ansi-green">&quot;name&quot;</span>: <span className="text-accent">&quot;Acme Corp&quot;</span> {`}`}
        </div>
      </div>
    </div>
  );
}

function ScalabilityMockup() {
  return (
    <div className="bg-card-02 rounded-xs border border-border-01 p-3 mb-4">
      <div className="text-xs text-text-tertiary mb-2">Team Activity</div>
      <div className="mb-3">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-text-secondary">Returns processed</span>
          <span className="text-text tabular-nums">847</span>
        </div>
        <div className="h-2 bg-card-03 rounded-full overflow-hidden">
          <div className="h-full bg-accent rounded-full" style={{ width: '72%' }} />
        </div>
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-text-secondary">Active: <span className="text-text">24 members</span></span>
        <span className="text-ansi-green">99.9% uptime</span>
      </div>
    </div>
  );
}

const SECURITY_FEATURES = [
  {
    title: 'SOC 2 Type II',
    description: 'Independently audited security controls covering availability, confidentiality, and data integrity.',
  },
  {
    title: 'Data Encryption',
    description: 'AES-256 encryption at rest. TLS 1.3 in transit. Your client data is never exposed.',
  },
  {
    title: 'Access Controls',
    description: 'Role-based permissions, SSO/SAML integration, and IP allowlisting for your organization.',
  },
  {
    title: 'Audit Logging',
    description: 'Complete audit trail of every action. Export logs for compliance reviews anytime.',
  },
  {
    title: 'Data Residency',
    description: 'Choose where your data lives. US, EU, or custom deployment options available.',
  },
  {
    title: 'Backup & Recovery',
    description: 'Continuous backups with point-in-time recovery. 99.99% durability guarantee.',
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

export default function EnterprisePage() {
  return (
    <>
      <Header />
      <main id="main-content">
        {/* Hero */}
        <section className="pt-[120px] pb-v4 px-g2 ledger-grid">
          <div className="mx-auto max-w-container">
            <div className="grid md:grid-cols-2 gap-v2 items-center">
              <div className="max-w-lg">
                <h1 className="text-xl md:text-2xl text-text mb-v1">
                  Built for scale
                </h1>
                <p className="text-md text-text-secondary mb-v1">
                  Trusted by top accounting firms to accelerate work, securely and at scale.
                  Enterprise-grade security meets AI-powered productivity.
                </p>
                <div className="flex items-center gap-4">
                  <Link href="#contact" className="btn-accent">
                    Talk to sales
                  </Link>
                  <Link href="/pricing" className="btn-secondary">
                    View pricing
                  </Link>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-g1">
                {STATS.map((stat) => (
                  <div key={stat.label} className="card p-6 text-center">
                    <div className="text-2xl text-text mb-1 tabular-nums">{stat.value}</div>
                    <div className="text-sm text-text-tertiary">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Trust Logos */}
        <section className="py-v3 px-g2 border-y border-border-01">
          <div className="mx-auto max-w-container">
            <p className="text-sm text-text-tertiary text-center mb-v1">
              Trusted by leading firms
            </p>
            <div className="flex items-center justify-center gap-12 flex-wrap opacity-60">
              {['Deloitte', 'EY', 'KPMG', 'PwC', 'BDO', 'RSM', 'Grant Thornton', 'Crowe'].map((name) => (
                <span key={name} className="text-text-secondary text-sm font-medium">
                  {name}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits Grid */}
        <section className="py-v4 px-g2">
          <div className="mx-auto max-w-container">
            <h2 className="text-xl text-text mb-v2 text-center">
              Enterprise-grade everything
            </h2>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-g1">
              <div className="card p-6">
                <SecurityMockup />
                <h3 className="text-base font-medium text-text mb-2">Security & Compliance</h3>
                <p className="text-sm text-text-secondary">SOC 2 Type II certified with enterprise-grade encryption at rest and in transit. Full audit trails for every action.</p>
              </div>

              <div className="card p-6">
                <SupportMockup />
                <h3 className="text-base font-medium text-text mb-2">Dedicated Support</h3>
                <p className="text-sm text-text-secondary">Your own customer success manager, priority support queue, and custom onboarding for your team.</p>
              </div>

              <div className="card p-6">
                <IntegrationsMockup />
                <h3 className="text-base font-medium text-text mb-2">Custom Integrations</h3>
                <p className="text-sm text-text-secondary">Connect Margen to your existing tools with our API, webhooks, and pre-built integrations.</p>
              </div>

              <div className="card p-6">
                <ScalabilityMockup />
                <h3 className="text-base font-medium text-text mb-2">Scalability</h3>
                <p className="text-sm text-text-secondary">Handle thousands of returns without slowdowns. Add team members instantly as you grow.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Security Section */}
        <section className="py-v4 px-g2 bg-card">
          <div className="mx-auto max-w-container">
            <div className="max-w-2xl mx-auto text-center mb-v2">
              <h2 className="text-xl text-text mb-v0.5">Security you can trust</h2>
              <p className="text-base text-text-secondary">
                Your clients&apos; data is sensitive. We treat it that way with enterprise-grade
                security controls and compliance certifications.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-g1">
              {SECURITY_FEATURES.map((feature) => (
                <div key={feature.title} className="p-6 border border-border-01 rounded-xs bg-bg">
                  <h3 className="text-base text-text mb-2">{feature.title}</h3>
                  <p className="text-sm text-text-secondary">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Integrations */}
        <section className="py-v4 px-g2">
          <div className="mx-auto max-w-container">
            <div className="max-w-2xl mx-auto text-center mb-v2">
              <h2 className="text-xl text-text mb-v0.5">Works with your stack</h2>
              <p className="text-base text-text-secondary">
                Margen integrates with the tax and accounting software you already use.
              </p>
            </div>

            <div className="flex items-center justify-center gap-g1 flex-wrap">
              {INTEGRATIONS.map((name) => (
                <div key={name} className="card px-6 py-4">
                  <span className="text-sm text-text-secondary">{name}</span>
                </div>
              ))}
            </div>

            <p className="text-sm text-text-tertiary text-center mt-v1">
              Don&apos;t see your software? <Link href="#contact" className="text-accent hover:underline">Request an integration</Link>
            </p>
          </div>
        </section>

        {/* Testimonial */}
        <section className="py-v4 px-g2 bg-card">
          <div className="mx-auto max-w-container">
            <div className="max-w-2xl mx-auto text-center">
              <blockquote className="text-lg text-text mb-v1 italic">
                &ldquo;Margen has transformed how our team handles tax research. What used to take hours
                now takes minutes, with citations we can actually trust. The enterprise security
                features made the decision easy for our compliance team.&rdquo;
              </blockquote>
              <div className="text-base text-text">Sarah Chen</div>
              <div className="text-sm text-text-tertiary">Partner, Tax Advisory — BDO USA</div>
            </div>
          </div>
        </section>

        {/* Contact Form */}
        <section id="contact" className="py-v4 px-g2">
          <div className="mx-auto max-w-container">
            <div className="grid md:grid-cols-2 gap-v2 items-start">
              <div>
                <h2 className="text-xl text-text mb-v0.5">Let&apos;s talk</h2>
                <p className="text-base text-text-secondary mb-v1">
                  Tell us about your firm and we&apos;ll show you how Margen can help.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-center gap-2 text-sm text-text-secondary">
                    <span className="text-ansi-green">✓</span>
                    Custom demo tailored to your workflow
                  </li>
                  <li className="flex items-center gap-2 text-sm text-text-secondary">
                    <span className="text-ansi-green">✓</span>
                    Security review with your IT team
                  </li>
                  <li className="flex items-center gap-2 text-sm text-text-secondary">
                    <span className="text-ansi-green">✓</span>
                    Pricing for your specific needs
                  </li>
                  <li className="flex items-center gap-2 text-sm text-text-secondary">
                    <span className="text-ansi-green">✓</span>
                    Implementation timeline and support
                  </li>
                </ul>
              </div>

              <div className="card p-6">
                <form className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm text-text mb-1">
                      Full name
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      className="w-full px-4 py-3 bg-bg border border-border-02 rounded-xs text-text placeholder:text-text-tertiary focus:border-accent focus:outline-none"
                      placeholder="Jane Smith"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm text-text mb-1">
                      Work email
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      className="w-full px-4 py-3 bg-bg border border-border-02 rounded-xs text-text placeholder:text-text-tertiary focus:border-accent focus:outline-none"
                      placeholder="jane@yourfirm.com"
                    />
                  </div>
                  <div>
                    <label htmlFor="company" className="block text-sm text-text mb-1">
                      Company
                    </label>
                    <input
                      type="text"
                      id="company"
                      name="company"
                      className="w-full px-4 py-3 bg-bg border border-border-02 rounded-xs text-text placeholder:text-text-tertiary focus:border-accent focus:outline-none"
                      placeholder="Your Firm LLP"
                    />
                  </div>
                  <div>
                    <label htmlFor="size" className="block text-sm text-text mb-1">
                      Team size
                    </label>
                    <select
                      id="size"
                      name="size"
                      className="w-full px-4 py-3 bg-bg border border-border-02 rounded-xs text-text focus:border-accent focus:outline-none"
                    >
                      <option value="">Select team size</option>
                      <option value="1-10">1-10 employees</option>
                      <option value="11-50">11-50 employees</option>
                      <option value="51-200">51-200 employees</option>
                      <option value="201-500">201-500 employees</option>
                      <option value="500+">500+ employees</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="message" className="block text-sm text-text mb-1">
                      Tell us about your needs
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      rows={4}
                      className="w-full px-4 py-3 bg-bg border border-border-02 rounded-xs text-text placeholder:text-text-tertiary focus:border-accent focus:outline-none resize-none"
                      placeholder="What are you looking to solve?"
                    />
                  </div>
                  <button type="submit" className="btn-accent w-full justify-center">
                    Schedule a demo
                  </button>
                  <p className="text-xs text-text-tertiary text-center">
                    By submitting, you agree to our{' '}
                    <Link href="/privacy" className="text-accent hover:underline">Privacy Policy</Link>.
                  </p>
                </form>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
