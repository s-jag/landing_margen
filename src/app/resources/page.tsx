'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ArticleCard } from '@/components/resources/ArticleCard';
import { CategoryTabs } from '@/components/resources/CategoryTabs';
import { ARTICLES, filterArticles, type Category } from '@/lib/resources';

export default function ResourcesPage() {
  const [activeCategory, setActiveCategory] = useState<Category | 'all'>('all');

  const filteredArticles = filterArticles(ARTICLES, activeCategory);

  return (
    <>
      <Header />

      <main className="min-h-screen bg-bg">
        {/* Hero Section */}
        <section className="pt-[120px] pb-v2 px-g2 ledger-grid">
          <div className="max-w-[1300px] mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-2xl text-text mb-4">Resources</h1>
              <p className="text-md text-text-secondary max-w-[600px] mb-8">
                Insights on tax strategy, product updates, and perspectives on the future of tax preparation.
              </p>

              <CategoryTabs active={activeCategory} onChange={setActiveCategory} />
            </motion.div>
          </div>
        </section>

        {/* Articles Grid */}
        <section className="py-v2 px-g2">
          <div className="max-w-[1300px] mx-auto">
            {filteredArticles.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredArticles.map((article, index) => (
                  <ArticleCard key={article.id} article={article} index={index} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="text-text-tertiary mb-2">No articles found</div>
                <button
                  onClick={() => setActiveCategory('all')}
                  className="text-accent text-sm hover:underline"
                >
                  View all articles
                </button>
              </div>
            )}
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-v4 px-g2 border-t border-border-01">
          <div className="max-w-[1300px] mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="bg-card border border-border-01 rounded-[4px] p-8 md:p-12 text-center"
            >
              <h2 className="text-xl text-text mb-4">Stay informed</h2>
              <p className="text-text-secondary mb-8 max-w-[500px] mx-auto">
                Get the latest tax insights and product updates delivered to your inbox.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
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
                  Contact sales
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
