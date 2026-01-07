import { RAG_LATENCY_ARTICLE, HALLUCINATION_ARTICLE } from './article-content';

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
  content?: string; // Full markdown content
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
    slug: 'solving-hallucination-in-regulatory-ai',
    title: 'How Margen Solves the Hallucination Problem in Regulatory AI',
    excerpt: 'A hybrid system combining semantic search, exact term matching, knowledge graph relationships, and self-correction to deliver answers legal professionals can trust.',
    category: 'product',
    publishedAt: '2025-01-06',
    readingTime: 15,
    content: HALLUCINATION_ARTICLE,
  },
  {
    id: '2',
    slug: 'taming-the-latency-beast',
    title: 'Taming the Latency Beast: How We Cut RAG Response Times by 60%',
    excerpt: 'When we first deployed our RAG system, users were waiting 8-10 seconds for each response. This is the story of how we diagnosed the bottlenecks and reduced our p95 latency to under 4 seconds—without sacrificing quality.',
    category: 'product',
    publishedAt: '2025-01-06',
    readingTime: 12,
    content: RAG_LATENCY_ARTICLE,
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

/**
 * Find article by slug
 */
export function getArticleBySlug(slug: string): Article | undefined {
  return ARTICLES.find((article) => article.slug === slug);
}
