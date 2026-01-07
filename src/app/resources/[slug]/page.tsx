'use client';

import { useParams, notFound } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { getArticleBySlug, formatDate, getCategoryInfo, CATEGORY_STYLES, ARTICLES } from '@/lib/resources';
import { ArticleCard } from '@/components/resources/ArticleCard';

export default function ArticlePage() {
  const params = useParams();
  const slug = params.slug as string;
  const article = getArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  const categoryInfo = getCategoryInfo(article.category);
  const styles = CATEGORY_STYLES[article.category];

  // Get related articles (same category, excluding current)
  const relatedArticles = ARTICLES
    .filter((a) => a.category === article.category && a.id !== article.id)
    .slice(0, 2);

  return (
    <>
      <Header />

      <main className="min-h-screen bg-bg">
        {/* Article Header */}
        <section className="pt-[100px] pb-v2 px-g2 border-b border-border-01">
          <div className="max-w-[720px] mx-auto">
            {/* Back Link */}
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Link
                href="/resources"
                className="inline-flex items-center gap-2 text-sm text-text-tertiary hover:text-text transition-colors mb-8"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Resources
              </Link>
            </motion.div>

            {/* Meta */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="flex items-center gap-3 mb-6"
            >
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${styles.text} ${styles.bg}`}>
                {categoryInfo?.label}
              </span>
              <span className="text-sm text-text-tertiary">
                {formatDate(article.publishedAt)}
              </span>
              <span className="text-text-tertiary">·</span>
              <span className="text-sm text-text-tertiary flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {article.readingTime} min read
              </span>
            </motion.div>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="text-2xl md:text-[2.5rem] leading-[1.1] tracking-[-0.02em] text-text mb-6"
            >
              {article.title}
            </motion.h1>

            {/* Excerpt */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="text-lg text-text-secondary leading-relaxed"
            >
              {article.excerpt}
            </motion.p>
          </div>
        </section>

        {/* Article Content */}
        <section className="py-v3 px-g2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="max-w-[720px] mx-auto"
          >
            {article.content ? (
              <article className="prose-article">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    // Headings
                    h1: ({ children }) => (
                      <h1 className="text-xl md:text-2xl font-normal text-text mt-12 mb-6 tracking-[-0.02em]">
                        {children}
                      </h1>
                    ),
                    h2: ({ children }) => (
                      <h2 className="text-lg md:text-xl font-normal text-text mt-10 mb-4 tracking-[-0.01em]">
                        {children}
                      </h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="text-base md:text-lg font-medium text-text mt-8 mb-3">
                        {children}
                      </h3>
                    ),
                    // Paragraphs
                    p: ({ children }) => (
                      <p className="text-[15px] md:text-base text-text-secondary leading-[1.75] mb-6">
                        {children}
                      </p>
                    ),
                    // Strong/Bold
                    strong: ({ children }) => (
                      <strong className="font-semibold text-text">{children}</strong>
                    ),
                    // Emphasis/Italic
                    em: ({ children }) => (
                      <em className="italic text-text-secondary">{children}</em>
                    ),
                    // Links
                    a: ({ href, children }) => (
                      <a
                        href={href}
                        className="text-accent hover:underline"
                        target={href?.startsWith('http') ? '_blank' : undefined}
                        rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
                      >
                        {children}
                      </a>
                    ),
                    // Code blocks
                    pre: ({ children }) => (
                      <pre className="bg-[#0d0c08] border border-border-02 rounded-md p-4 md:p-6 overflow-x-auto my-6 text-[13px] leading-[1.6]">
                        {children}
                      </pre>
                    ),
                    code: ({ className, children, ...props }) => {
                      const isInline = !className;
                      if (isInline) {
                        return (
                          <code className="bg-card-02 text-accent px-1.5 py-0.5 rounded text-[0.9em] font-mono">
                            {children}
                          </code>
                        );
                      }
                      return (
                        <code className="font-mono text-text-secondary whitespace-pre" {...props}>
                          {children}
                        </code>
                      );
                    },
                    // Lists
                    ul: ({ children }) => (
                      <ul className="list-disc list-outside ml-6 mb-6 space-y-2 text-text-secondary">
                        {children}
                      </ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="list-decimal list-outside ml-6 mb-6 space-y-2 text-text-secondary">
                        {children}
                      </ol>
                    ),
                    li: ({ children }) => (
                      <li className="text-[15px] md:text-base leading-[1.75] pl-1">
                        {children}
                      </li>
                    ),
                    // Blockquotes
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-2 border-accent pl-6 my-6 italic text-text-secondary">
                        {children}
                      </blockquote>
                    ),
                    // Horizontal rule
                    hr: () => (
                      <hr className="border-border-02 my-10" />
                    ),
                    // Tables
                    table: ({ children }) => (
                      <div className="overflow-x-auto my-6">
                        <table className="w-full text-sm">
                          {children}
                        </table>
                      </div>
                    ),
                    thead: ({ children }) => (
                      <thead className="border-b border-border-02">
                        {children}
                      </thead>
                    ),
                    tbody: ({ children }) => (
                      <tbody className="divide-y divide-border-01">
                        {children}
                      </tbody>
                    ),
                    tr: ({ children }) => (
                      <tr>{children}</tr>
                    ),
                    th: ({ children }) => (
                      <th className="text-left py-3 px-4 font-medium text-text">
                        {children}
                      </th>
                    ),
                    td: ({ children }) => (
                      <td className="py-3 px-4 text-text-secondary">
                        {children}
                      </td>
                    ),
                  }}
                >
                  {article.content}
                </ReactMarkdown>
              </article>
            ) : (
              <div className="text-center py-16">
                <p className="text-text-tertiary">Full article coming soon.</p>
              </div>
            )}
          </motion.div>
        </section>

        {/* Related Articles */}
        {relatedArticles.length > 0 && (
          <section className="py-v3 px-g2 border-t border-border-01">
            <div className="max-w-[1300px] mx-auto">
              <h2 className="text-lg text-text mb-8">More from {categoryInfo?.label}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {relatedArticles.map((relatedArticle, index) => (
                  <ArticleCard key={relatedArticle.id} article={relatedArticle} index={index} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* CTA */}
        <section className="py-v3 px-g2 border-t border-border-01">
          <div className="max-w-[720px] mx-auto text-center">
            <p className="text-text-secondary mb-6">
              Have questions or want to learn more about our approach?
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link
                href="/signup"
                className="btn-accent px-6 py-3 rounded-full text-sm font-medium"
              >
                Get started free
              </Link>
              <Link
                href="/enterprise"
                className="btn-secondary px-6 py-3 rounded-full text-sm font-medium border border-border-02"
              >
                Contact us
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
