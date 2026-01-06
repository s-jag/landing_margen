import Link from 'next/link';
import { ProductMockup } from '@/components/features/ProductMockup';

export function Hero() {
  return (
    <section className="pt-[120px] pb-v4 px-g2">
      <div className="mx-auto max-w-container">
        {/* Headline - LEFT ALIGNED, not centered */}
        <div className="max-w-2xl mb-v2">
          <h1 className="text-lg md:text-xl lg:text-2xl text-text mb-v1">
            Built for speed and accuracy,
            <br />
            Margen is the best way for professionals to prep taxes with AI.
          </h1>

          {/* Single CTA - no begging */}
          <Link href="/chat" className="btn inline-flex">
            Try for Free
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="ml-1">
              <path d="M7 2v8M4 7l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>

        {/* MASSIVE product mockup */}
        <ProductMockup />
      </div>
    </section>
  );
}
