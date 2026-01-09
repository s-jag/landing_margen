'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

export function Frontier() {
  return (
    <section className="py-v4 px-g2 bg-card ledger-grid overflow-hidden">
      <div className="mx-auto max-w-container">
        {/* Section header - LEFT aligned */}
        <h2 className="text-xl text-text mb-v2">
          Stay on the frontier
        </h2>

        {/* 3-column grid */}
        <div className="grid md:grid-cols-3 gap-g1">
          <FrontierCard
            title="Instant Research"
            description="Cut your research time from hours to minutes with AI-powered tax law search."
            link={{ label: 'See how it works', href: '/features' }}
          >
            <ResearchTimer />
          </FrontierCard>

          <FrontierCard
            title="Complete tax code understanding"
            description="Margen learns how tax code works, no matter the complexity."
            link={{ label: 'Learn about indexing', href: '/resources/solving-hallucination-in-regulatory-ai' }}
          >
            <SearchDemo />
          </FrontierCard>

          <FrontierCard
            title="Built for Tax Pros"
            description="Designed specifically for CPAs, EAs, and tax attorneys who need reliable answers."
            link={{ label: 'Learn more', href: '/features' }}
          >
            <TaxProVisual />
          </FrontierCard>
        </div>
      </div>
    </section>
  );
}

function FrontierCard({
  title,
  description,
  link,
  children,
}: {
  title: string;
  description: string;
  link: { label: string; href: string };
  children: React.ReactNode;
}) {
  return (
    <div className="card frontier-card flex flex-col cursor-pointer">
      <h3 className="text-base font-medium text-text mb-1">{title}</h3>
      <p className="text-sm text-text-secondary mb-2">{description}</p>
      <Link href={link.href} className="link-accent text-sm inline-flex items-center gap-1 mb-4">
        {link.label}
        <span>↗</span>
      </Link>
      <div className="mt-auto pt-4">
        {children}
      </div>
    </div>
  );
}

function ResearchTimer() {
  const [phase, setPhase] = useState<'traditional' | 'transition' | 'margen'>('traditional');

  // Run animation once (no loop)
  useEffect(() => {
    // Show traditional for 2s
    const t1 = setTimeout(() => setPhase('transition'), 2000);

    // Transition for 0.5s then show margen
    const t2 = setTimeout(() => setPhase('margen'), 2500);

    // Animation stays at 'margen' state - no restart

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  return (
    <div className="bg-card-02 rounded-xs border border-border-01 p-4 h-32 flex items-center justify-center">
      <div className="relative w-full">
        {/* Traditional research time */}
        <div
          className={`
            flex items-center justify-between transition-all duration-500
            ${phase === 'traditional' ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}
          `}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-card-03 flex items-center justify-center">
              <svg className="w-5 h-5 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <div className="text-xs text-text-tertiary">Traditional Research</div>
              <div className="text-xl font-medium text-text-secondary">2+ hours</div>
            </div>
          </div>
        </div>

        {/* Margen research time */}
        <div
          className={`
            absolute inset-0 flex items-center justify-between transition-all duration-500
            ${phase === 'margen' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
          `}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <div className="text-xs text-text-tertiary">With Margen</div>
              <div className="text-xl font-medium text-accent">2 minutes</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SearchDemo() {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const hasPlayed = useRef(false);
  const fullText = 'Where is the QBI limitation defined?';

  // Run animation once (no loop)
  useEffect(() => {
    if (hasPlayed.current) return;

    // Start typing after a delay
    const startDelay = setTimeout(() => {
      setIsTyping(true);
      let i = 0;

      const typeInterval = setInterval(() => {
        if (i < fullText.length) {
          setDisplayedText(fullText.slice(0, i + 1));
          i++;
        } else {
          clearInterval(typeInterval);
          hasPlayed.current = true;
          // Animation stays at final state - no restart
        }
      }, 60);

      return () => clearInterval(typeInterval);
    }, 1000);

    return () => clearTimeout(startDelay);
  }, []);

  return (
    <div className="bg-card-02 rounded-xs border border-border-01 p-4">
      <div className="bg-card rounded-xs border border-border-01 px-3 py-2 mb-3 search-pulse">
        <span className="text-sm text-text-secondary">
          {displayedText}
          {isTyping && <span className="typing-cursor" />}
          {!isTyping && !displayedText && (
            <span className="text-text-tertiary">Search tax code...</span>
          )}
        </span>
      </div>
      <div className="text-xs text-text-tertiary flex items-center gap-1">
        {displayedText.length > 0 && (
          <>
            <span className="spin inline-block">⟳</span>
            <span>Searching...</span>
          </>
        )}
        {!displayedText && <span>&nbsp;</span>}
      </div>
    </div>
  );
}

function TaxProVisual() {
  const [visibleChecks, setVisibleChecks] = useState<number[]>([]);

  // Run animation once (no loop)
  useEffect(() => {
    // Stagger the checkmarks appearing
    const t1 = setTimeout(() => setVisibleChecks([0]), 500);
    const t2 = setTimeout(() => setVisibleChecks([0, 1]), 1000);
    const t3 = setTimeout(() => setVisibleChecks([0, 1, 2]), 1500);

    // Animation stays at final state - no reset

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  const badges = [
    { label: 'CPA', title: 'Certified Public Accountant' },
    { label: 'EA', title: 'Enrolled Agent' },
    { label: 'Attorney', title: 'Tax Attorney' },
  ];

  return (
    <div className="bg-card-02 rounded-xs border border-border-01 p-4 h-32 flex items-center justify-center">
      <div className="flex gap-3">
        {badges.map((badge, index) => (
          <div
            key={badge.label}
            className="relative flex flex-col items-center"
          >
            <div className={`
              w-14 h-14 rounded-full border-2 flex items-center justify-center
              transition-all duration-300
              ${visibleChecks.includes(index)
                ? 'border-accent bg-accent/10'
                : 'border-border-02 bg-card-03'
              }
            `}>
              <span className={`
                text-xs font-medium transition-colors duration-300
                ${visibleChecks.includes(index) ? 'text-accent' : 'text-text-secondary'}
              `}>
                {badge.label}
              </span>
            </div>
            {/* Checkmark */}
            <div className={`
              absolute -top-1 -right-1 w-5 h-5 rounded-full bg-accent
              flex items-center justify-center transition-all duration-300
              ${visibleChecks.includes(index)
                ? 'opacity-100 scale-100'
                : 'opacity-0 scale-50'
              }
            `}>
              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
