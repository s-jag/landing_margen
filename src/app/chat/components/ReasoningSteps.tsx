'use client';

import { useState } from 'react';
import type { ReasoningStep } from '@/types/chat';

interface ReasoningStepsProps {
  steps: ReasoningStep[];
  isStreaming?: boolean;
}

export default function ReasoningSteps({ steps, isStreaming }: ReasoningStepsProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (steps.length === 0) return null;

  return (
    <div className="mb-3">
      {/* Toggle header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 text-xs text-text/50 hover:text-text/70 transition-colors mb-2"
      >
        <svg
          className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span>Reasoning ({steps.length} steps)</span>
        {isStreaming && (
          <svg className="w-3 h-3 animate-spin ml-1" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        )}
      </button>

      {/* Steps timeline */}
      {isExpanded && (
        <div className="ml-1.5 border-l border-text/10 pl-4 space-y-2">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              {/* Timeline dot */}
              <div
                className={`absolute -left-[21px] w-2.5 h-2.5 rounded-full border-2 ${
                  index === steps.length - 1 && isStreaming
                    ? 'border-accent bg-accent/20 animate-pulse'
                    : 'border-text/30 bg-card'
                }`}
              />

              {/* Step content */}
              <div className="text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-accent/70">{step.node}</span>
                  <span className="text-text/30">|</span>
                  <span className="text-text/50">Step {step.step}</span>
                </div>
                <p className="text-text/60 mt-0.5">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
