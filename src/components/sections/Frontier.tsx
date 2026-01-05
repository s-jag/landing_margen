import Link from 'next/link';

export function Frontier() {
  return (
    <section className="py-v4 px-g2 bg-card">
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
    <div className="card flex flex-col">
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
  const models = [
    { name: 'Auto', tag: 'Suggested' },
    { name: 'Claude Sonnet 4', tag: null },
    { name: 'Claude Opus 4', tag: null },
    { name: 'GPT-4o', tag: 'Fast' },
    { name: 'Gemini Pro', tag: null },
  ];

  return (
    <div className="bg-card-02 rounded-xs border border-border-01 p-2">
      {models.map((model, i) => (
        <div
          key={model.name}
          className={`px-3 py-2 rounded text-sm flex items-center justify-between ${i === 1 ? 'bg-card-03' : ''}`}
        >
          <span className={i === 1 ? 'text-text' : 'text-text-secondary'}>{model.name}</span>
          {model.tag && (
            <span className="text-xs text-text-tertiary">{model.tag}</span>
          )}
          {i === 1 && <span className="text-text-tertiary">✓</span>}
        </div>
      ))}
    </div>
  );
}

function SearchDemo() {
  return (
    <div className="bg-card-02 rounded-xs border border-border-01 p-4">
      <div className="bg-card rounded-xs border border-border-01 px-3 py-2 mb-3">
        <span className="text-sm text-text-secondary">
          Where is the QBI limitation defined?
        </span>
      </div>
      <div className="text-xs text-text-tertiary">
        Searching...
      </div>
    </div>
  );
}

function EnterpriseVisual() {
  return (
    <div className="bg-card-02 rounded-xs border border-border-01 p-4 h-32 flex items-center justify-center">
      <div className="text-center">
        <div className="text-2xl text-text mb-1">500+</div>
        <div className="text-xs text-text-tertiary">Firms using Margen</div>
      </div>
    </div>
  );
}
