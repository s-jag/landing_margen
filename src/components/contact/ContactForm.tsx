'use client';

import { useState } from 'react';

type FormState = 'idle' | 'submitting' | 'success' | 'error';

interface FormErrors {
  name?: string;
  email?: string;
  message?: string;
}

export function ContactForm() {
  const [formState, setFormState] = useState<FormState>('idle');
  const [errors, setErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});
    setServerError(null);
    setFormState('submitting');

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      message: formData.get('message') as string,
    };

    // Client-side validation
    const newErrors: FormErrors = {};
    if (!data.name || data.name.trim().length === 0) {
      newErrors.name = 'Name is required';
    }
    if (!data.email || !data.email.includes('@')) {
      newErrors.email = 'Valid email is required';
    }
    if (!data.message || data.message.trim().length < 10) {
      newErrors.message = 'Message must be at least 10 characters';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setFormState('idle');
      return;
    }

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          setServerError('Too many requests. Please try again later.');
        } else if (result.details?.fieldErrors) {
          setErrors(result.details.fieldErrors);
          setFormState('idle');
          return;
        } else {
          setServerError(result.message || 'Failed to send message');
        }
        setFormState('error');
        return;
      }

      setFormState('success');
    } catch {
      setServerError('An unexpected error occurred. Please try again.');
      setFormState('error');
    }
  }

  if (formState === 'success') {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-ansi-green/10 flex items-center justify-center">
          <svg className="w-8 h-8 text-ansi-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-lg text-text mb-2">Message sent!</h3>
        <p className="text-sm text-text-secondary">
          Thank you for reaching out. We'll get back to you soon.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {serverError && (
        <div className="p-3 bg-ansi-red/10 border border-ansi-red/30 rounded-md">
          <p className="text-sm text-ansi-red">{serverError}</p>
        </div>
      )}

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-text mb-1.5">
          Name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          required
          className="w-full px-3 py-2 bg-card-02 border border-border-02 rounded-md text-text placeholder:text-text-tertiary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/20"
          placeholder="Your name"
        />
        {errors.name && (
          <p className="mt-1 text-xs text-ansi-red">{errors.name}</p>
        )}
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-text mb-1.5">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="w-full px-3 py-2 bg-card-02 border border-border-02 rounded-md text-text placeholder:text-text-tertiary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/20"
          placeholder="you@company.com"
        />
        {errors.email && (
          <p className="mt-1 text-xs text-ansi-red">{errors.email}</p>
        )}
      </div>

      <div>
        <label htmlFor="message" className="block text-sm font-medium text-text mb-1.5">
          Message
        </label>
        <textarea
          id="message"
          name="message"
          rows={5}
          required
          className="w-full px-3 py-2 bg-card-02 border border-border-02 rounded-md text-text placeholder:text-text-tertiary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 resize-none"
          placeholder="How can we help you?"
        />
        {errors.message && (
          <p className="mt-1 text-xs text-ansi-red">{errors.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={formState === 'submitting'}
        className="w-full py-2.5 px-4 bg-accent text-bg font-medium rounded-md hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {formState === 'submitting' ? 'Sending...' : 'Send message'}
      </button>
    </form>
  );
}
