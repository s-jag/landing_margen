'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import type { Article } from '@/lib/resources';
import { formatDate, CATEGORY_STYLES, getCategoryInfo } from '@/lib/resources';

interface ArticleCardProps {
  article: Article;
  index?: number;
}

export function ArticleCard({ article, index = 0 }: ArticleCardProps) {
  const categoryInfo = getCategoryInfo(article.category);
  const styles = CATEGORY_STYLES[article.category];

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className="group"
    >
      <Link
        href={`/resources/${article.slug}`}
        className="block h-full bg-card border border-border-01 rounded-[4px] p-6 transition-all duration-[0.25s] ease-[cubic-bezier(0.25,1,0.5,1)] hover:translate-y-[-4px] hover:border-l-2 hover:border-l-accent hover:shadow-[0_8px_30px_rgba(0,0,0,0.2)]"
      >
        {/* Category Pill */}
        <div className="mb-4">
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${styles.text} ${styles.bg}`}
          >
            {categoryInfo?.label}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-lg font-normal leading-tight text-text mb-3 group-hover:text-accent transition-colors duration-200">
          {article.title}
        </h3>

        {/* Excerpt - 3 line clamp */}
        <p className="text-sm text-text-secondary leading-relaxed mb-4 line-clamp-3">
          {article.excerpt}
        </p>

        {/* Meta Row */}
        <div className="flex items-center gap-2 text-xs text-text-tertiary mt-auto pt-4 border-t border-border-01">
          <time dateTime={article.publishedAt}>{formatDate(article.publishedAt)}</time>
          <span className="text-border-03">•</span>
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {article.readingTime} min read
          </span>
        </div>
      </Link>
    </motion.article>
  );
}
