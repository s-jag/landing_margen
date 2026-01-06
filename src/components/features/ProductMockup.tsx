'use client';

import { useState, useEffect, useCallback } from 'react';

// Animation timing constants (ms)
const CHAR_SPEED = 25;           // Speed per character
const PAUSE_AFTER_TEXT = 400;    // Pause after finishing text
const FILE_CARD_DELAY = 300;     // Delay before file card appears
const CODE_LINE_DELAY = 150;     // Delay between code lines
const LOOP_PAUSE = 4000;         // Pause before restarting

// Content to type out
const CONTENT = {
  question: "Help me understand the requirements for the home office deduction under IRC Section 280A and calculate the potential deduction for a client using 300 sq ft of their 2,000 sq ft home.",
  paragraph1: "I found the relevant guidance in IRC Section 280A. Let me analyze the requirements for the home office deduction.",
  file1: { name: "IRC_Section_280A.pdf", added: 156, removed: 0 },
  paragraph2: "Now let me apply the safe harbor method from Rev. Proc. 2013-13 to calculate the simplified deduction:",
  file2: { name: "deduction_calc.xlsx", added: 24, removed: 6 },
  result: "Done. The client qualifies for a $1,500 simplified deduction (300 sq ft × $5/sq ft) under the safe harbor method.",
  bullets: [
    { label: "Qualification:", value: "Regular and exclusive business use confirmed" },
    { label: "Method:", value: "Safe harbor (Rev. Proc. 2013-13)" },
    { label: "Calculation:", value: "300 sq ft × $5 = $1,500 max" },
  ],
  codeLines: [
    { num: "1", content: "# Home Office Deduction Calculator", added: false },
    { num: "2", content: "", added: false },
    { num: "3", content: "# Client: Smith, John", added: true },
    { num: "4", content: "# Tax Year: 2024", added: true },
    { num: "5", content: "", added: false },
    { num: "6", content: "home_sqft = 2000", added: false },
    { num: "7", content: "office_sqft = 300", added: false },
    { num: "8", content: "rate_per_sqft = 5  # Safe harbor", added: true },
    { num: "9", content: "", added: false },
    { num: "10", content: "# Simplified Method (Rev Proc 2013-13)", added: true },
    { num: "11", content: "deduction = min(office_sqft, 300) * rate_per_sqft", added: true },
    { num: "12", content: "# Result: $1,500", added: true },
  ],
};

// TypeWriter component - the heart of the animation
function TypeWriter({
  text,
  speed = CHAR_SPEED,
  delay = 0,
  onComplete,
  showCursor = true,
  className = "",
}: {
  text: string;
  speed?: number;
  delay?: number;
  onComplete?: () => void;
  showCursor?: boolean;
  className?: string;
}) {
  const [displayed, setDisplayed] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const startTimeout = setTimeout(() => {
      setStarted(true);
      setIsTyping(true);
    }, delay);

    return () => clearTimeout(startTimeout);
  }, [delay]);

  useEffect(() => {
    if (!started) return;

    let i = 0;
    const interval = setInterval(() => {
      if (i < text.length) {
        setDisplayed(text.slice(0, i + 1));
        i++;
      } else {
        clearInterval(interval);
        setIsTyping(false);
        setTimeout(() => onComplete?.(), PAUSE_AFTER_TEXT);
      }
    }, speed);

    return () => clearInterval(interval);
  }, [started, text, speed, onComplete]);

  if (!started) return null;

  return (
    <span className={className}>
      {displayed}
      {showCursor && isTyping && <span className="typing-cursor" />}
    </span>
  );
}

// File card with slide-in animation
function FileCard({
  name,
  added,
  removed,
  visible,
}: {
  name: string;
  added: number;
  removed: number;
  visible: boolean;
}) {
  return (
    <div
      className={`bg-card rounded-xs border border-border-01 p-3 mb-4 transition-all duration-300 ease-out ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
      }`}
    >
      <div className="flex items-center gap-2 text-xs text-text-tertiary">
        <span>📄</span>
        <span>{name}</span>
        <span className="text-ansi-green">+{added}</span>
        <span className="text-ansi-red">-{removed}</span>
      </div>
    </div>
  );
}

// Code line with fade-in
function CodeLine({
  num,
  content,
  added = false,
  visible,
}: {
  num: string;
  content: string;
  added?: boolean;
  visible: boolean;
}) {
  return (
    <div
      className={`flex transition-opacity duration-150 ease-out ${
        visible ? 'opacity-100' : 'opacity-0'
      } ${added ? 'bg-ansi-green/10' : ''}`}
    >
      <span className="w-8 text-text-tertiary select-none">{num}</span>
      {added && <span className="text-ansi-green mr-1">+</span>}
      <span className={added ? 'text-ansi-green' : 'text-text-secondary'}>
        {content}
      </span>
    </div>
  );
}

// Sidebar item with spinning icon
function SidebarItem({
  icon,
  label,
  status,
  time,
  active = false,
  spinning = false,
}: {
  icon: string;
  label: string;
  status: string;
  time?: string;
  active?: boolean;
  spinning?: boolean;
}) {
  return (
    <div className={`px-2 py-1.5 rounded text-sm cursor-pointer ${active ? 'bg-card-03' : 'hover:bg-card-03'}`}>
      <div className="flex items-center gap-2">
        <span className={`text-text-tertiary ${spinning ? 'spin inline-block' : ''}`}>{icon}</span>
        <span className={`truncate ${active ? 'text-text' : 'text-text-secondary'}`}>{label}</span>
        {time && <span className="text-xs text-text-tertiary ml-auto">{time}</span>}
      </div>
      <div className="text-xs text-text-tertiary mt-0.5 ml-6 truncate">{status}</div>
    </div>
  );
}

// Main animated mockup
export function ProductMockup() {
  // Animation phase state machine
  const [phase, setPhase] = useState(0);
  const [visibleCodeLines, setVisibleCodeLines] = useState(0);
  const [key, setKey] = useState(0); // For resetting animation

  // Phase progression callbacks
  const advancePhase = useCallback(() => {
    setPhase((p) => p + 1);
  }, []);

  // Reset and loop
  useEffect(() => {
    if (phase === 7) {
      // All text done, start code lines
      const showCodeLines = () => {
        let lineIndex = 0;
        const interval = setInterval(() => {
          if (lineIndex < CONTENT.codeLines.length) {
            setVisibleCodeLines((v) => v + 1);
            lineIndex++;
          } else {
            clearInterval(interval);
            // Schedule loop restart
            setTimeout(() => {
              setPhase(0);
              setVisibleCodeLines(0);
              setKey((k) => k + 1);
            }, LOOP_PAUSE);
          }
        }, CODE_LINE_DELAY);
        return () => clearInterval(interval);
      };
      const cleanup = showCodeLines();
      return cleanup;
    }
  }, [phase]);

  return (
    <div className="mockup-window max-w-5xl mx-auto" key={key}>
      {/* Title bar */}
      <div className="mockup-titlebar">
        <div className="mockup-dots">
          <span className="mockup-dot" />
          <span className="mockup-dot" />
          <span className="mockup-dot" />
        </div>
        <span className="text-xs text-text-tertiary">Margen</span>
        <div className="w-16" />
      </div>

      {/* Content */}
      <div className="flex min-h-[500px]">
        {/* Sidebar */}
        <div className="hidden md:block w-60 border-r border-border-01 bg-card-02 p-3">
          <div className="text-xs text-text-tertiary uppercase tracking-wider mb-2">
            IN PROGRESS <span className="text-text-secondary">3</span>
          </div>
          <SidebarItem icon="⟳" label="Client Returns - Q4..." status="Generating" spinning />
          <SidebarItem icon="⟳" label="Schedule K-1 Analysis..." status="Generating" spinning />
          <SidebarItem icon="⟳" label="IRC 280A Research..." status="Generating" spinning />

          <div className="text-xs text-text-tertiary uppercase tracking-wider mt-6 mb-2">
            READY FOR REVIEW <span className="text-text-secondary">3</span>
          </div>
          <SidebarItem icon="✓" label="Form 1040 - Smith..." time="now" status="+162-37 · Done, configurabl..." active />
          <SidebarItem icon="✓" label="Partnership K-1..." time="30m" status="+37-0 · Set up Rules f..." />
          <SidebarItem icon="✓" label="Estate Tax Planning..." time="45m" status="+135-21 · Estate analysis" />
        </div>

        {/* Main content area */}
        <div className="flex-1 flex flex-col">
          {/* Agent response */}
          <div className="flex-1 p-6 overflow-auto">
            <div className="max-w-2xl">
              <h3 className="text-base font-medium text-text mb-4">
                Home Office Deduction Analysis
              </h3>

              {/* User question - always visible */}
              <p className="text-sm text-text-secondary mb-4">
                {CONTENT.question}
              </p>

              {/* Phase 0: Start typing paragraph 1 */}
              {phase >= 0 && (
                <p className="text-sm text-text mb-4 min-h-[24px]">
                  <TypeWriter
                    text={CONTENT.paragraph1}
                    delay={500}
                    onComplete={() => setTimeout(advancePhase, FILE_CARD_DELAY)}
                  />
                </p>
              )}

              {/* Phase 1: Show file card 1 */}
              <FileCard
                name={CONTENT.file1.name}
                added={CONTENT.file1.added}
                removed={CONTENT.file1.removed}
                visible={phase >= 1}
              />

              {/* Phase 2: Type paragraph 2 */}
              {phase >= 1 && (
                <p className="text-sm text-text mb-4 min-h-[24px]">
                  {phase >= 2 ? (
                    <TypeWriter
                      text={CONTENT.paragraph2}
                      onComplete={() => setTimeout(advancePhase, FILE_CARD_DELAY)}
                    />
                  ) : (
                    <TypeWriter
                      text={CONTENT.paragraph2}
                      delay={0}
                      onComplete={() => setTimeout(advancePhase, FILE_CARD_DELAY)}
                    />
                  )}
                </p>
              )}

              {/* Phase 3: Show file card 2 */}
              <FileCard
                name={CONTENT.file2.name}
                added={CONTENT.file2.added}
                removed={CONTENT.file2.removed}
                visible={phase >= 3}
              />

              {/* Phase 4: Type result */}
              {phase >= 3 && (
                <p className="text-sm text-text mb-4 min-h-[24px]">
                  {phase >= 4 ? (
                    <span>
                      Done. The client qualifies for a <span className="text-text font-medium">$1,500 simplified deduction</span> (300 sq ft × $5/sq ft) under the safe harbor method.
                    </span>
                  ) : (
                    <TypeWriter
                      text={CONTENT.result}
                      onComplete={advancePhase}
                    />
                  )}
                </p>
              )}

              {/* Phase 5: Show bullets one by one */}
              {phase >= 5 && (
                <ul className="text-sm text-text-secondary space-y-1 mb-6">
                  {CONTENT.bullets.map((bullet, i) => (
                    <li
                      key={i}
                      className={`transition-opacity duration-200 ${
                        phase >= 5 + i * 0.5 ? 'opacity-100' : 'opacity-0'
                      }`}
                      style={{ transitionDelay: `${i * 150}ms` }}
                    >
                      • <span className="font-medium text-text">{bullet.label}</span> {bullet.value}
                    </li>
                  ))}
                </ul>
              )}

              {/* Phase 6: Bullets done, advance to code */}
              {phase === 5 && (
                <div className="hidden">
                  <TypeWriter text="" delay={600} onComplete={advancePhase} />
                </div>
              )}
              {phase === 6 && (
                <div className="hidden">
                  <TypeWriter text="" delay={300} onComplete={advancePhase} />
                </div>
              )}

              {/* Input area */}
              <div className="bg-card rounded-xs border border-border-01 p-3">
                <div className="text-sm text-text-tertiary">
                  Plan, search, research anything...
                </div>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-card-03 px-2 py-0.5 rounded text-text-secondary">Agent</span>
                    <span className="text-xs text-text-tertiary">Claude Sonnet 4</span>
                  </div>
                  <button className="w-6 h-6 rounded-full bg-text flex items-center justify-center">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M6 2v8M2 6h8" stroke="currentColor" strokeWidth="2" className="text-bg" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right panel - code/diff view */}
        <div className="hidden lg:block w-80 border-l border-border-01 bg-bg">
          {/* Tabs */}
          <div className="flex border-b border-border-01">
            <div className="px-4 py-2 text-xs text-text-secondary border-b border-text">deduction_calc.xlsx</div>
            <div className="px-4 py-2 text-xs text-text-tertiary">sources.pdf</div>
          </div>

          {/* Code content */}
          <div className="p-4 font-mono text-xs">
            {CONTENT.codeLines.map((line, i) => (
              <CodeLine
                key={i}
                num={line.num}
                content={line.content}
                added={line.added}
                visible={i < visibleCodeLines}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
