'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

// Animation timing
const CASCADE_SPEED = 20;  // ms per character - fast, this is DATA
const FIELD_STAGGER = 700; // ms between fields
const LOOP_PAUSE = 3000;   // ms pause before restart

// Form field data
const FIELDS = [
  { label: 'Filing Status', value: 'Married Filing Jointly', delay: 500 },
  { label: 'Wages, salaries, tips', value: '$142,500', delay: 1200 },
  { label: 'Interest income', value: '$1,247', delay: 1900 },
  { label: 'Business income (Schedule C)', value: '$38,200', ghost: '.00', delay: 2600, isHero: true },
  { label: 'Capital gains', value: '', placeholder: 'Enter amount...', delay: 3800, isWaiting: true },
];

export function FeatureAutocomplete() {
  const [cycle, setCycle] = useState(0);

  // Loop the animation
  useEffect(() => {
    const loopTimeout = setTimeout(() => {
      setCycle(c => c + 1);
    }, 5500 + LOOP_PAUSE);

    return () => clearTimeout(loopTimeout);
  }, [cycle]);

  return (
    <section className="py-v4 px-g2">
      <div className="mx-auto max-w-container">
        <div className="grid md:grid-cols-2 gap-v2 items-center">
          {/* Mockup - LEFT side */}
          <div className="mockup-window order-2 md:order-1">
            <div className="mockup-titlebar">
              <div className="mockup-dots">
                <span className="mockup-dot" />
                <span className="mockup-dot" />
                <span className="mockup-dot" />
              </div>
              <span className="text-xs text-text-tertiary">Form 1040</span>
              <div className="w-16" />
            </div>

            <div className="p-6 font-mono text-sm" key={cycle}>
              <div className="space-y-4">
                {FIELDS.map((field, i) => (
                  <AnimatedFormField
                    key={`${field.label}-${cycle}`}
                    label={field.label}
                    value={field.value}
                    ghost={field.ghost}
                    placeholder={field.placeholder}
                    delay={field.delay}
                    isHero={field.isHero}
                    isWaiting={field.isWaiting}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Text - RIGHT side */}
          <div className="max-w-md order-1 md:order-2">
            <h2 className="text-lg md:text-xl text-text mb-v0.5">
              Magically accurate form completion
            </h2>
            <p className="text-base text-text-secondary mb-v1">
              Our custom model predicts your next entry with striking speed and precision.
            </p>
            <Link href="/autocomplete" className="link-accent inline-flex items-center gap-1">
              Learn about Tab
              <span>→</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function AnimatedFormField({
  label,
  value,
  ghost,
  placeholder,
  delay,
  isHero = false,
  isWaiting = false,
}: {
  label: string;
  value: string;
  ghost?: string;
  placeholder?: string;
  delay: number;
  isHero?: boolean;
  isWaiting?: boolean;
}) {
  const [displayedValue, setDisplayedValue] = useState('');
  const [showGhost, setShowGhost] = useState(false);
  const [isGlowing, setIsGlowing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [showShimmer, setShowShimmer] = useState(false);

  useEffect(() => {
    if (!value) return; // Skip animation for empty fields

    // Start glow, then cascade
    const glowTimeout = setTimeout(() => {
      setIsGlowing(true);

      // Start cascading after glow begins
      setTimeout(() => {
        setShowShimmer(true);
        let i = 0;
        const interval = setInterval(() => {
          if (i < value.length) {
            setDisplayedValue(value.slice(0, i + 1));
            i++;
          } else {
            clearInterval(interval);
            setIsComplete(true);
            // Show ghost text after value is complete
            if (ghost) {
              setTimeout(() => setShowGhost(true), 200);
            }
          }
        }, CASCADE_SPEED);

        return () => clearInterval(interval);
      }, 100);
    }, delay);

    return () => clearTimeout(glowTimeout);
  }, [value, delay, ghost]);

  // Reset glow after animation
  useEffect(() => {
    if (isGlowing) {
      const timeout = setTimeout(() => setIsGlowing(false), isHero ? 800 : 600);
      return () => clearTimeout(timeout);
    }
  }, [isGlowing, isHero]);

  // Reset shimmer after animation
  useEffect(() => {
    if (showShimmer && isComplete) {
      const timeout = setTimeout(() => setShowShimmer(false), 600);
      return () => clearTimeout(timeout);
    }
  }, [showShimmer, isComplete]);

  return (
    <div
      className={`flex items-center justify-between py-2 border-b border-border-01 transition-colors ${
        isGlowing ? (isHero ? 'row-glow-hero' : 'row-glow') : ''
      }`}
    >
      <span className="text-text-secondary">{label}</span>
      <div className="text-right">
        {/* Value with shimmer */}
        {displayedValue && (
          <span className={showShimmer && !isComplete ? 'shimmer-text' : 'text-text'}>
            {displayedValue}
          </span>
        )}

        {/* Ghost text (Tab completion) */}
        {showGhost && ghost && (
          <span className="text-text-tertiary ml-0 ghost-fade">{ghost}</span>
        )}

        {/* Waiting state with cursor */}
        {isWaiting && !displayedValue && (
          <span className="field-waiting flex items-center gap-1">
            <span className="text-text-tertiary">{placeholder}</span>
            <span className="typing-cursor" />
          </span>
        )}

        {/* Empty placeholder for non-waiting empty fields */}
        {!isWaiting && !value && !displayedValue && placeholder && (
          <span className="text-text-tertiary">{placeholder}</span>
        )}
      </div>
    </div>
  );
}
