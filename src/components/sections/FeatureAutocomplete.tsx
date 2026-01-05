import Link from 'next/link';

export function FeatureAutocomplete() {
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

            <div className="p-6 font-mono text-sm">
              {/* Form field simulation */}
              <div className="space-y-4">
                <FormField label="Filing Status" value="Married Filing Jointly" />
                <FormField label="Wages, salaries, tips" value="$142,500" />
                <FormField label="Interest income" value="$1,247" />
                <FormField
                  label="Business income (Schedule C)"
                  value="$38,200"
                  autocomplete="$38,217.00"
                />
                <FormField label="Capital gains" value="" placeholder="Enter amount..." />
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

function FormField({
  label,
  value,
  autocomplete,
  placeholder,
}: {
  label: string;
  value: string;
  autocomplete?: string;
  placeholder?: string;
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border-01">
      <span className="text-text-secondary">{label}</span>
      <div className="text-right">
        {value && <span className="text-text">{value}</span>}
        {autocomplete && (
          <span className="text-text-tertiary ml-1">{autocomplete.slice(value.length)}</span>
        )}
        {!value && placeholder && (
          <span className="text-text-tertiary">{placeholder}</span>
        )}
      </div>
    </div>
  );
}
