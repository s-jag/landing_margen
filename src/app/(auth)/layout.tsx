import Link from 'next/link';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* Header */}
      <header className="h-14 border-b border-border-01 flex items-center px-6">
        <Link href="/" className="flex items-center gap-2">
          <svg width="24" height="24" viewBox="0 0 20 20" fill="none">
            <path
              d="M2 4h3l5 8 5-8h3v12h-3V8l-5 8-5-8v8H2V4z"
              fill="currentColor"
              className="text-text"
            />
          </svg>
          <span className="text-base font-semibold text-text">Margen</span>
        </Link>
      </header>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center p-6">
        {children}
      </main>

      {/* Footer */}
      <footer className="py-6 text-center">
        <p className="text-xs text-text-tertiary">
          &copy; {new Date().getFullYear()} Margen. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
