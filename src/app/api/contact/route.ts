import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { contactSchema } from '@/types/api';
import { authLimiter, getClientIdentifier } from '@/lib/rateLimit';

/**
 * POST /api/contact - Submit contact form
 * Rate limited: 5 requests per 15 minutes (spam prevention)
 */
export async function POST(request: Request) {
  try {
    // Check rate limit (no user ID for public endpoint)
    const identifier = getClientIdentifier(request);
    const result = await authLimiter.check(identifier);

    if (!result.success) {
      return NextResponse.json(
        {
          error: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many submissions. Please try again later.',
        },
        {
          status: 429,
          headers: {
            'Retry-After': (result.reset - Math.floor(Date.now() / 1000)).toString(),
          },
        }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = contactSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'VALIDATION_ERROR',
          message: 'Invalid form data',
          details: validation.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { name, email, message } = validation.data;

    // Check if Resend is configured
    if (!process.env.RESEND_API_KEY || !process.env.CONTACT_EMAIL) {
      console.error('Missing RESEND_API_KEY or CONTACT_EMAIL environment variable');
      return NextResponse.json(
        { error: 'SERVER_ERROR', message: 'Email service not configured' },
        { status: 500 }
      );
    }

    // Initialize Resend client (lazy to avoid build errors)
    const resend = new Resend(process.env.RESEND_API_KEY);

    // Send email via Resend
    const { error: sendError } = await resend.emails.send({
      from: 'Margen Contact <onboarding@resend.dev>',
      to: process.env.CONTACT_EMAIL,
      replyTo: email,
      subject: `New Contact Form Submission from ${name}`,
      text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${escapeHtml(name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        <h3>Message:</h3>
        <p>${escapeHtml(message).replace(/\n/g, '<br>')}</p>
      `,
    });

    if (sendError) {
      console.error('Resend error:', sendError);
      return NextResponse.json(
        { error: 'EMAIL_ERROR', message: 'Failed to send message. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: 'Message sent successfully' });
  } catch (error) {
    console.error('Contact form error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

/**
 * Escape HTML to prevent XSS in email
 */
function escapeHtml(text: string): string {
  const htmlEntities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (char) => htmlEntities[char]);
}
