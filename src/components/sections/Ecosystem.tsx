import Link from 'next/link';

export function Ecosystem() {
  return (
    <section className="py-v4 px-g2 bg-card">
      <div className="mx-auto max-w-container">
        <div className="grid md:grid-cols-2 gap-v2 items-center">
          {/* Text - LEFT side */}
          <div className="max-w-md">
            <h2 className="text-lg md:text-xl text-text mb-v0.5">
              Tax work gets done; Everywhere and all the time.
            </h2>
            <p className="text-base text-text-secondary mb-v1">
              Margen is in your inbox responding to clients, analyzing documents in your portal, and anywhere else you work.
            </p>
            <Link href="/integrations" className="link-accent inline-flex items-center gap-1">
              Learn about integrations
              <span>→</span>
            </Link>
          </div>

          {/* Mockups - RIGHT side */}
          <div className="relative h-[450px] hidden md:block">
            <EmailWindow />
            <ResponseWindow />
          </div>
        </div>
      </div>
    </section>
  );
}

function EmailWindow() {
  return (
    <div
      className="absolute bg-card-02 rounded-[10px] overflow-hidden"
      style={{
        left: '5%',
        top: '10%',
        width: '340px',
        zIndex: 10,
        boxShadow: '0 28px 70px rgba(0,0,0,0.14), 0 14px 32px rgba(0,0,0,0.1), 0 0 0 1px rgba(237,236,236,0.1)',
      }}
    >
      {/* Title bar */}
      <div className="flex items-center justify-between h-7 px-2 bg-card-03 border-b border-border-01">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-border-03" />
          <span className="w-2.5 h-2.5 rounded-full bg-border-03" />
          <span className="w-2.5 h-2.5 rounded-full bg-border-03" />
        </div>
        <span className="text-xs text-text-tertiary">Email</span>
        <div className="w-12" />
      </div>

      {/* Email tabs */}
      <div className="flex gap-4 px-4 py-2 border-b border-border-01 text-xs">
        <span className="text-text-secondary">Inbox (3)</span>
        <span className="text-text-tertiary">Sent</span>
        <span className="text-text-tertiary">Drafts</span>
      </div>

      {/* Email header */}
      <div className="px-4 py-3 border-b border-border-01">
        <div className="text-sm text-text font-medium">John Smith</div>
        <div className="text-xs text-text-secondary mt-0.5">Question about home office deduction</div>
        <div className="text-xs text-text-tertiary mt-0.5">Today at 2:34 PM</div>
      </div>

      {/* Email body */}
      <div className="px-4 py-3 text-sm text-text-secondary leading-relaxed">
        <p>Hi,</p>
        <p className="mt-2">
          I wanted to ask about the home office deduction. I use 300 sq ft of my 2,000 sq ft home for my consulting business. What are my options?
        </p>
        <p className="mt-2">
          Thanks,<br />
          John
        </p>
      </div>

      {/* Reply button */}
      <div className="px-4 py-3 border-t border-border-01">
        <button className="flex items-center gap-2 px-3 py-1.5 bg-accent text-bg text-xs font-medium rounded-full">
          <span>M</span>
          Reply with Margen
        </button>
      </div>
    </div>
  );
}

function ResponseWindow() {
  return (
    <div
      className="absolute bg-card-02 rounded-[10px] overflow-hidden"
      style={{
        left: '30%',
        top: '25%',
        width: '380px',
        zIndex: 15,
        boxShadow: '0 32px 80px rgba(0,0,0,0.18), 0 16px 40px rgba(0,0,0,0.12), 0 0 0 1px rgba(237,236,236,0.1)',
      }}
    >
      {/* Title bar */}
      <div className="flex items-center justify-between h-7 px-2 bg-card-03 border-b border-border-01">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-border-03" />
          <span className="w-2.5 h-2.5 rounded-full bg-border-03" />
          <span className="w-2.5 h-2.5 rounded-full bg-border-03" />
        </div>
        <span className="text-xs text-text-tertiary">Margen Response</span>
        <div className="w-12" />
      </div>

      {/* Response header */}
      <div className="px-4 py-3 border-b border-border-01">
        <div className="text-sm text-text font-medium">RE: Home office deduction</div>
      </div>

      {/* Response body */}
      <div className="px-4 py-3 text-sm text-text-secondary leading-relaxed">
        <p>Hi John,</p>
        <p className="mt-2">
          Great question! Based on your situation, you have two options:
        </p>
        <p className="mt-2">
          <span className="text-text">1. Simplified Method</span> (Rev. Proc. 2013-13):<br />
          <span className="text-text font-medium">$5/sq ft × 300 = $1,500</span>
        </p>
        <p className="mt-2">
          <span className="text-text">2. Regular Method</span>:<br />
          Actual expenses × 15% (300/2000)
        </p>
        <p className="mt-2">
          The simplified method is often better for smaller offices...
        </p>
      </div>

      {/* Attachment */}
      <div className="px-4 py-2 border-t border-border-01">
        <div className="flex items-center gap-2 text-xs text-text-tertiary">
          <span>📎</span>
          <span>IRC_280A_Analysis.pdf</span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="px-4 py-3 border-t border-border-01 flex gap-2">
        <button className="px-3 py-1.5 bg-accent text-bg text-xs font-medium rounded-full">
          Send Response
        </button>
        <button className="px-3 py-1.5 bg-card-03 text-text-secondary text-xs rounded-full border border-border-01">
          Edit in Margen
        </button>
      </div>
    </div>
  );
}
