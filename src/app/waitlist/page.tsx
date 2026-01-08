import { Header, Footer } from '@/components/layout';
import { WaitlistForm } from '@/components/waitlist';

export const metadata = {
  title: 'Join the Waitlist | Margen',
  description: 'Get early access to Margen - the complete tax practice management platform with AI-powered research, client management, and efiling.',
};

export default function WaitlistPage() {
  return (
    <>
      <Header />
      <main id="main-content">
        {/* Hero */}
        <section className="pt-[120px] pb-v4 px-g2 ledger-grid">
          <div className="mx-auto max-w-container">
            <div className="max-w-2xl mx-auto text-center">
              <h1 className="text-xl md:text-2xl text-text mb-v0.5">
                The complete tax practice platform
              </h1>
              <p className="text-md text-text-secondary mb-v1">
                Margen combines AI-powered tax research with full client management and efiling capabilities.
                Right now, you're seeing our research assistant demo. The full platform is coming soon.
              </p>
              <div className="flex flex-wrap justify-center gap-4 text-sm text-text-tertiary">
                <span className="flex items-center gap-2">
                  <CheckIcon />
                  AI Research Assistant
                </span>
                <span className="flex items-center gap-2">
                  <CheckIcon />
                  Client Management
                </span>
                <span className="flex items-center gap-2">
                  <CheckIcon />
                  E-filing Integration
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Waitlist Form Section */}
        <section className="py-v4 px-g2">
          <div className="mx-auto max-w-container">
            <div className="max-w-md mx-auto">
              <div className="bg-card border border-border-01 rounded-xs p-6 md:p-8">
                <h2 className="text-lg text-text mb-2 text-center">
                  Get early access
                </h2>
                <p className="text-sm text-text-secondary mb-6 text-center">
                  Join the waitlist to be first in line when we launch.
                </p>
                <WaitlistForm />
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

function CheckIcon() {
  return (
    <svg className="w-4 h-4 text-ansi-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}
