import type { NavLink, Feature, Testimonial, AgentFeature } from '@/types';

export const SITE_CONFIG = {
  name: 'Margen',
  tagline: 'AI-Powered Tax Preparation for Professionals',
  description:
    'The most advanced AI assistant for tax professionals. Research tax code, analyze documents, and prepare returns faster with AI.',
  url: 'https://margen.ai',
};

export const NAV_LINKS: NavLink[] = [
  { label: 'Features', href: '#features' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Documentation', href: '/docs' },
  { label: 'Blog', href: '/blog' },
  { label: 'About', href: '/about' },
];

export const FEATURES: Feature[] = [
  {
    id: 'ai-chat',
    title: 'AI Chat with Tax Knowledge',
    description:
      'Ask anything about tax code. Get instant, accurate answers with citations to IRC sections, Treasury Regulations, and IRS guidance.',
  },
  {
    id: 'document-analysis',
    title: 'Document Analysis',
    description:
      'Upload W-2s, 1099s, K-1s, and more. Our AI instantly extracts data and explains relevant tax implications.',
  },
  {
    id: 'smart-autocomplete',
    title: 'Smart Autocomplete',
    description:
      'Magically accurate form completion. AI suggests entries based on context with real-time validation against IRS rules.',
  },
  {
    id: 'research-assistant',
    title: 'Research Assistant',
    description:
      'Complete tax code understanding. Search across IRC, Treasury Regulations, Revenue Rulings, and PLRs in seconds.',
  },
];

export const AGENT_FEATURES: AgentFeature[] = [
  {
    id: 'research-agent',
    title: 'Automated Research Agent',
    description:
      'Agent researches complex tax situations autonomously with multi-step reasoning across tax code.',
    status: 'coming-soon',
  },
  {
    id: 'preparation-agent',
    title: 'Form Preparation Agent',
    description:
      'Agent drafts returns from raw documents. Handles data extraction, calculations, and validation.',
    status: 'coming-soon',
  },
  {
    id: 'audit-agent',
    title: 'Audit Support Agent',
    description:
      'Agent prepares audit defense documentation. Compiles relevant citations and precedents.',
    status: 'coming-soon',
  },
];

export const TESTIMONIALS: Testimonial[] = [
  {
    id: '1',
    quote:
      'Margen has transformed how our firm handles research. What used to take hours now takes minutes.',
    author: 'Sarah Chen',
    role: 'Tax Partner',
    company: 'Anderson & Associates CPAs',
  },
  {
    id: '2',
    quote:
      "The accuracy of the AI citations is remarkable. It's like having a tax attorney on demand.",
    author: 'Michael Torres',
    role: 'Senior Tax Manager',
    company: 'Torres Tax Advisory',
  },
  {
    id: '3',
    quote:
      'Finally, a tool that actually understands the complexity of tax code. Game changer for our practice.',
    author: 'Jennifer Park',
    role: 'Managing Partner',
    company: 'Park & Associates',
  },
];

export const FOOTER_LINKS = {
  product: [
    { label: 'Features', href: '#features' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'Documentation', href: '/docs' },
    { label: 'Changelog', href: '/changelog' },
  ],
  resources: [
    { label: 'Blog', href: '/blog' },
    { label: 'Guides', href: '/guides' },
    { label: 'API Reference', href: '/api' },
    { label: 'Status', href: '/status' },
  ],
  company: [
    { label: 'About', href: '/about' },
    { label: 'Careers', href: '/careers' },
    { label: 'Press', href: '/press' },
    { label: 'Contact', href: '/contact' },
  ],
  legal: [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
    { label: 'Security', href: '/security' },
  ],
};
