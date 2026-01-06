'use client';

import { useState, useEffect } from 'react';
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
            title="Access the best models"
            description="Choose between every cutting-edge model from OpenAI, Anthropic, and more."
            link={{ label: 'Explore models', href: '/models' }}
          >
            <ModelDropdown />
          </FrontierCard>

          <FrontierCard
            title="Complete tax code understanding"
            description="Margen learns how tax code works, no matter the complexity."
            link={{ label: 'Learn about indexing', href: '/indexing' }}
          >
            <SearchDemo />
          </FrontierCard>

          <FrontierCard
            title="Enterprise ready"
            description="Trusted by top accounting firms to accelerate work, securely and at scale."
            link={{ label: 'Explore enterprise', href: '/enterprise' }}
          >
            <EnterpriseVisual />
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

function ModelDropdown() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const models = [
    { name: 'Auto', tag: 'Suggested' },
    { name: 'Claude Sonnet 4', tag: null },
    { name: 'Claude Opus 4', tag: null },
    { name: 'GPT-4o', tag: 'Fast' },
    { name: 'Gemini Pro', tag: null },
  ];

  return (
    <div className="bg-card-02 rounded-xs border border-border-01 p-2">
      {models.map((model, i) => {
        const isSelected = i === 1;
        const isHovered = hoveredIndex === i;

        return (
          <div
            key={model.name}
            onMouseEnter={() => setHoveredIndex(i)}
            onMouseLeave={() => setHoveredIndex(null)}
            className={`
              px-3 py-2 rounded text-sm flex items-center justify-between
              cursor-pointer transition-all duration-150
              ${isSelected ? 'bg-card-03' : isHovered ? 'bg-card-03/50' : ''}
            `}
          >
            <span className={isSelected || isHovered ? 'text-text' : 'text-text-secondary'}>
              {model.name}
            </span>
            {model.tag && (
              <span className="text-xs text-text-tertiary">{model.tag}</span>
            )}
            {isSelected && <span className="text-text-tertiary">✓</span>}
          </div>
        );
      })}
    </div>
  );
}

function SearchDemo() {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [cycle, setCycle] = useState(0);
  const fullText = 'Where is the QBI limitation defined?';

  useEffect(() => {
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
          // Pause then restart
          setTimeout(() => {
            setDisplayedText('');
            setIsTyping(false);
            setCycle(c => c + 1);
          }, 3000);
        }
      }, 60);

      return () => clearInterval(typeInterval);
    }, 1000);

    return () => clearTimeout(startDelay);
  }, [cycle]);

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

function EnterpriseVisual() {
  const [count, setCount] = useState(0);
  const targetCount = 500;

  useEffect(() => {
    const duration = 2000; // 2 seconds
    const startTime = Date.now();

    // Easing function - easeOutExpo
    const easeOutExpo = (t: number) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t);

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutExpo(progress);

      setCount(Math.floor(easedProgress * targetCount));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    // Start animation after a brief delay
    const timeout = setTimeout(() => {
      requestAnimationFrame(animate);
    }, 500);

    return () => clearTimeout(timeout);
  }, []);

  return (
    <div className="bg-card-02 rounded-xs border border-border-01 p-4 h-32 flex items-center justify-center">
      <div className="text-center">
        <div className="text-2xl text-text mb-1">{count}+</div>
        <div className="text-xs text-text-tertiary">Firms using Margen</div>
      </div>
    </div>
  );
}
