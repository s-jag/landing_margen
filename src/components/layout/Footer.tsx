import Link from 'next/link';

const FOOTER_LINKS = {
  Product: [
    { label: 'Features', href: '/features' },
    { label: 'Pricing', href: '/pricing' },
    { label: 'Enterprise', href: '/enterprise' },
    { label: 'Changelog', href: '/changelog' },
  ],
  Resources: [
    { label: 'Documentation', href: '/docs' },
    { label: 'Blog', href: '/blog' },
    { label: 'Community', href: '/community' },
  ],
  Company: [
    { label: 'About', href: '/about' },
    { label: 'Careers', href: '/careers' },
    { label: 'Contact', href: '/contact' },
  ],
  Legal: [
    { label: 'Privacy', href: '/privacy' },
    { label: 'Terms', href: '/terms' },
    { label: 'Security', href: '/security' },
  ],
};

export function Footer() {
  return (
    <footer className="py-v4 px-g2 border-t border-border-01">
      <div className="mx-auto max-w-container">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-v2">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <MargenLogo />
              <span className="text-base font-medium text-text">Margen</span>
            </Link>
          </div>

          {/* Links */}
          {Object.entries(FOOTER_LINKS).map(([category, links]) => (
            <div key={category}>
              <h4 className="text-sm font-medium text-text mb-3">{category}</h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-text-secondary hover:text-text transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="mt-v3 pt-v1 border-t border-border-01 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-text-tertiary">
            © {new Date().getFullYear()} Margen. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <SocialLink href="https://twitter.com" label="Twitter" />
            <SocialLink href="https://linkedin.com" label="LinkedIn" />
          </div>
        </div>
      </div>
    </footer>
  );
}

function MargenLogo() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path
        d="M2 4h3l5 8 5-8h3v12h-3V8l-5 8-5-8v8H2V4z"
        fill="currentColor"
        className="text-text"
      />
    </svg>
  );
}

function SocialLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-sm text-text-tertiary hover:text-text transition-colors"
    >
      {label}
    </a>
  );
}
