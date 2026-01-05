'use client';

export function ProductMockup() {
  return (
    <div className="mockup-window max-w-5xl mx-auto">
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
          <SidebarItem icon="⟳" label="Client Returns - Q4..." status="Generating" />
          <SidebarItem icon="⟳" label="Schedule K-1 Analysis..." status="Generating" />
          <SidebarItem icon="⟳" label="IRC 280A Research..." status="Generating" />

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

              <p className="text-sm text-text-secondary mb-4">
                Help me understand the requirements for the home office deduction under IRC Section 280A and calculate the potential deduction for a client using 300 sq ft of their 2,000 sq ft home.
              </p>

              <div className="bg-card rounded-xs border border-border-01 p-3 mb-4">
                <div className="flex items-center gap-2 text-xs text-text-tertiary mb-2">
                  <span>📄</span>
                  <span>IRC_Section_280A.pdf</span>
                  <span className="text-ansi-green">+156</span>
                  <span className="text-ansi-red">-0</span>
                </div>
              </div>

              <p className="text-sm text-text mb-4">
                Now let me apply the safe harbor method from Rev. Proc. 2013-13 to calculate the simplified deduction:
              </p>

              <div className="bg-card rounded-xs border border-border-01 p-3 mb-4">
                <div className="flex items-center gap-2 text-xs text-text-tertiary mb-2">
                  <span>📄</span>
                  <span>deduction_calc.xlsx</span>
                  <span className="text-ansi-green">+24</span>
                  <span className="text-ansi-red">-6</span>
                </div>
              </div>

              <p className="text-sm text-text mb-4">
                Done. The client qualifies for a <span className="text-text font-medium">$1,500 simplified deduction</span> (300 sq ft × $5/sq ft) under the safe harbor method.
              </p>

              <ul className="text-sm text-text-secondary space-y-1 mb-6">
                <li>• <span className="font-medium text-text">Qualification:</span> Regular and exclusive business use confirmed</li>
                <li>• <span className="font-medium text-text">Method:</span> Safe harbor (Rev. Proc. 2013-13)</li>
                <li>• <span className="font-medium text-text">Calculation:</span> 300 sq ft × $5 = $1,500 max</li>
              </ul>

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
            <CodeLine num="1" content="# Home Office Deduction Calculator" />
            <CodeLine num="2" content="" />
            <CodeLine num="3" content="# Client: Smith, John" added />
            <CodeLine num="4" content="# Tax Year: 2024" added />
            <CodeLine num="5" content="" />
            <CodeLine num="6" content="home_sqft = 2000" />
            <CodeLine num="7" content="office_sqft = 300" />
            <CodeLine num="8" content="rate_per_sqft = 5  # Safe harbor" added />
            <CodeLine num="9" content="" />
            <CodeLine num="10" content="# Simplified Method (Rev Proc 2013-13)" added />
            <CodeLine num="11" content="deduction = min(office_sqft, 300) * rate_per_sqft" added />
            <CodeLine num="12" content="# Result: $1,500" added />
          </div>
        </div>
      </div>
    </div>
  );
}

function SidebarItem({
  icon,
  label,
  status,
  time,
  active = false,
}: {
  icon: string;
  label: string;
  status: string;
  time?: string;
  active?: boolean;
}) {
  return (
    <div className={`px-2 py-1.5 rounded text-sm cursor-pointer ${active ? 'bg-card-03' : 'hover:bg-card-03'}`}>
      <div className="flex items-center gap-2">
        <span className="text-text-tertiary">{icon}</span>
        <span className={`truncate ${active ? 'text-text' : 'text-text-secondary'}`}>{label}</span>
        {time && <span className="text-xs text-text-tertiary ml-auto">{time}</span>}
      </div>
      <div className="text-xs text-text-tertiary mt-0.5 ml-6 truncate">{status}</div>
    </div>
  );
}

function CodeLine({
  num,
  content,
  added = false,
  removed = false,
}: {
  num: string;
  content: string;
  added?: boolean;
  removed?: boolean;
}) {
  return (
    <div className={`flex ${added ? 'bg-ansi-green/10' : removed ? 'bg-ansi-red/10' : ''}`}>
      <span className="w-8 text-text-tertiary select-none">{num}</span>
      {added && <span className="text-ansi-green mr-1">+</span>}
      {removed && <span className="text-ansi-red mr-1">-</span>}
      <span className={added ? 'text-ansi-green' : removed ? 'text-ansi-red' : 'text-text-secondary'}>
        {content}
      </span>
    </div>
  );
}
