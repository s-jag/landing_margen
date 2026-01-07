// =============================================================================
// TYPES
// =============================================================================

export type Category = 'tax-insights' | 'product' | 'industry';

export interface Article {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: Category;
  publishedAt: string; // ISO date
  readingTime: number; // minutes
}

export interface CategoryInfo {
  slug: Category | 'all';
  label: string;
  color: string;
}

// =============================================================================
// CONSTANTS
// =============================================================================

export const CATEGORIES: CategoryInfo[] = [
  { slug: 'all', label: 'All', color: '#edecec' },
  { slug: 'tax-insights', label: 'Tax Insights', color: '#f54e00' },
  { slug: 'product', label: 'Product', color: '#1f8a65' },
  { slug: 'industry', label: 'Industry', color: '#3b82f6' },
];

export const CATEGORY_STYLES: Record<Category, { text: string; bg: string }> = {
  'tax-insights': { text: 'text-accent', bg: 'bg-accent/10' },
  'product': { text: 'text-[#1f8a65]', bg: 'bg-[#1f8a65]/10' },
  'industry': { text: 'text-[#3b82f6]', bg: 'bg-[#3b82f6]/10' },
};

// =============================================================================
// SAMPLE ARTICLES
// =============================================================================

export const ARTICLES: Article[] = [
  {
    id: '1',
    slug: 'understanding-qbi-deductions',
    title: 'Understanding QBI Deductions for Pass-Through Entities',
    excerpt: 'The Qualified Business Income deduction under Section 199A can reduce taxable income by up to 20% for eligible businesses. Learn how to maximize this deduction for your clients while navigating the complex wage and capital limitations.',
    category: 'tax-insights',
    publishedAt: '2025-01-03',
    readingTime: 8,
  },
  {
    id: '2',
    slug: 'introducing-smart-form-completion',
    title: 'Introducing Smart Form Completion',
    excerpt: 'Our latest feature uses AI to intelligently pre-fill tax forms based on client documents and prior year returns. Reduce data entry time by up to 70% while maintaining accuracy with built-in validation.',
    category: 'product',
    publishedAt: '2024-12-28',
    readingTime: 4,
  },
  {
    id: '3',
    slug: 'future-of-ai-tax-preparation',
    title: 'The Future of AI in Tax Preparation',
    excerpt: 'Artificial intelligence is transforming how tax professionals work. From document processing to complex tax planning scenarios, discover how AI is reshaping the industry and what it means for your practice.',
    category: 'industry',
    publishedAt: '2024-12-20',
    readingTime: 6,
  },
  {
    id: '4',
    slug: 'state-tax-nexus-remote-work',
    title: 'State Tax Nexus: What Remote Work Means for Your Clients',
    excerpt: 'Remote work has created unprecedented state tax complexity. Understand the evolving nexus standards, withholding requirements, and planning opportunities for clients with employees across multiple states.',
    category: 'tax-insights',
    publishedAt: '2024-12-15',
    readingTime: 10,
  },
  {
    id: '5',
    slug: 'new-citation-sources-irs-guidance',
    title: 'New Citation Sources: IRS Guidance Library',
    excerpt: 'We have expanded our citation database to include Revenue Rulings, Revenue Procedures, and Private Letter Rulings. Get authoritative answers with direct links to primary sources.',
    category: 'product',
    publishedAt: '2024-12-10',
    readingTime: 3,
  },
  {
    id: '6',
    slug: 'tax-professionals-embrace-automation',
    title: 'Why Tax Professionals Should Embrace Automation',
    excerpt: 'Automation is not about replacing tax professionals—it is about empowering them. Learn how leading firms are using technology to handle routine tasks, reduce errors, and focus on high-value advisory work.',
    category: 'industry',
    publishedAt: '2024-12-05',
    readingTime: 7,
  },
];

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Format ISO date to "Jan 15, 2025" format
 */
export function formatDate(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Get category info by slug
 */
export function getCategoryInfo(slug: Category): CategoryInfo | undefined {
  return CATEGORIES.find((c) => c.slug === slug);
}

/**
 * Filter articles by category
 */
export function filterArticles(articles: Article[], category: Category | 'all'): Article[] {
  if (category === 'all') return articles;
  return articles.filter((article) => article.category === category);
}
