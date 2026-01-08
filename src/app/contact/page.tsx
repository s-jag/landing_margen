import { Header, Footer } from '@/components/layout';
import { ContactForm } from '@/components/contact';

export const metadata = {
  title: 'Contact Us | Margen',
  description: 'Get in touch with the Margen team. We\'d love to hear from you.',
};

export default function ContactPage() {
  return (
    <>
      <Header />
      <main id="main-content">
        {/* Hero */}
        <section className="pt-[120px] pb-v4 px-g2 ledger-grid">
          <div className="mx-auto max-w-container">
            <div className="max-w-2xl mx-auto text-center">
              <h1 className="text-xl md:text-2xl text-text mb-v0.5">
                Get in touch
              </h1>
              <p className="text-md text-text-secondary">
                Have a question or want to learn more about Margen? We'd love to hear from you.
              </p>
            </div>
          </div>
        </section>

        {/* Contact Form Section */}
        <section className="py-v4 px-g2">
          <div className="mx-auto max-w-container">
            <div className="max-w-md mx-auto">
              <div className="bg-card border border-border-01 rounded-xs p-6 md:p-8">
                <ContactForm />
              </div>

              {/* Alternative contact info */}
              <div className="mt-v2 text-center">
                <p className="text-sm text-text-secondary mb-2">
                  Prefer email? Reach us directly at
                </p>
                <a
                  href="mailto:hello@margen.ai"
                  className="text-accent hover:text-accent/80 transition-colors"
                >
                  hello@margen.ai
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
