import Link from 'next/link';

export function FeatureAgent() {
  return (
    <section className="py-v4 px-g2 bg-card">
      <div className="mx-auto max-w-container">
        <div className="grid md:grid-cols-2 gap-v2 items-center">
          {/* Text - LEFT side */}
          <div className="max-w-md">
            <h2 className="text-lg md:text-xl text-text mb-v0.5">
              Agent turns research into answers
            </h2>
            <p className="text-base text-text-secondary mb-v1">
              A human-AI tax researcher, orders of magnitude more effective than any professional alone.
            </p>
            <Link href="/agent" className="link-accent inline-flex items-center gap-1">
              Learn about Agent
              <span>→</span>
            </Link>
          </div>

          {/* Mockup - RIGHT side */}
          <div className="mockup-window">
            <div className="mockup-titlebar">
              <div className="mockup-dots">
                <span className="mockup-dot" />
                <span className="mockup-dot" />
                <span className="mockup-dot" />
              </div>
              <span className="text-xs text-text-tertiary">Margen</span>
              <div className="w-16" />
            </div>

            <div className="p-6">
              <div className="space-y-4">
                <AgentTask
                  status="complete"
                  title="Research Section 199A deduction"
                  detail="Found 12 relevant citations"
                />
                <AgentTask
                  status="complete"
                  title="Analyze client K-1 forms"
                  detail="Identified 3 passive activities"
                />
                <AgentTask
                  status="running"
                  title="Calculate QBI deduction"
                  detail="Processing..."
                />
                <AgentTask
                  status="pending"
                  title="Generate memo for client"
                  detail="Waiting"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function AgentTask({
  status,
  title,
  detail,
}: {
  status: 'complete' | 'running' | 'pending';
  title: string;
  detail: string;
}) {
  const icons = {
    complete: <span className="text-ansi-green">✓</span>,
    running: <span className="text-accent animate-pulse">●</span>,
    pending: <span className="text-text-tertiary">○</span>,
  };

  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5">{icons[status]}</span>
      <div>
        <div className={`text-sm ${status === 'pending' ? 'text-text-tertiary' : 'text-text'}`}>
          {title}
        </div>
        <div className="text-xs text-text-tertiary">{detail}</div>
      </div>
    </div>
  );
}
