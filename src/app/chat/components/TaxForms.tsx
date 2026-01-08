'use client';

import { useState } from 'react';

interface TaxFormsProps {
  forms: string[];
  stateCode?: string;
}

export function TaxForms({ forms, stateCode = 'UT' }: TaxFormsProps) {
  const [expandedForm, setExpandedForm] = useState<string | null>(null);
  const [formDetails, setFormDetails] = useState<Record<string, { title: string; description: string; url: string | null }>>({});
  const [loading, setLoading] = useState<string | null>(null);

  if (!forms || forms.length === 0) return null;

  const fetchFormDetails = async (formNumber: string) => {
    if (formDetails[formNumber]) {
      setExpandedForm(expandedForm === formNumber ? null : formNumber);
      return;
    }

    setLoading(formNumber);
    setExpandedForm(formNumber);

    try {
      const response = await fetch(`/api/forms/${encodeURIComponent(formNumber)}?state=${stateCode}`);
      if (response.ok) {
        const data = await response.json();
        setFormDetails((prev) => ({
          ...prev,
          [formNumber]: {
            title: data.title,
            description: data.description,
            url: data.url,
          },
        }));
      }
    } catch (error) {
      console.error('Failed to fetch form details:', error);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="mt-4 border border-border-01 rounded-md overflow-hidden">
      <div className="bg-card-02 px-4 py-2 border-b border-border-01">
        <div className="flex items-center gap-2">
          {/* Form icon */}
          <svg
            className="w-4 h-4 text-accent"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <span className="text-xs font-medium text-text-secondary uppercase tracking-wider">
            Related Tax Forms
          </span>
        </div>
      </div>

      <div className="divide-y divide-border-01">
        {forms.map((form) => (
          <div key={form} className="bg-card">
            <button
              onClick={() => fetchFormDetails(form)}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-card-02 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm font-medium text-accent">{form}</span>
                {formDetails[form]?.title && (
                  <span className="text-sm text-text-secondary">
                    {formDetails[form].title}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {loading === form ? (
                  <span className="w-4 h-4 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
                ) : (
                  <svg
                    className={`w-4 h-4 text-text-tertiary transition-transform ${
                      expandedForm === form ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                )}
              </div>
            </button>

            {/* Expanded details */}
            {expandedForm === form && formDetails[form] && (
              <div className="px-4 pb-4 text-sm">
                <p className="text-text-secondary mb-3">{formDetails[form].description}</p>
                {formDetails[form].url && (
                  <a
                    href={formDetails[form].url!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-accent hover:underline"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                      />
                    </svg>
                    Download Form
                  </a>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
