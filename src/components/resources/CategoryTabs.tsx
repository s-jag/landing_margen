'use client';

import { CATEGORIES, type Category } from '@/lib/resources';
import { cn } from '@/lib/utils';

interface CategoryTabsProps {
  active: Category | 'all';
  onChange: (category: Category | 'all') => void;
}

export function CategoryTabs({ active, onChange }: CategoryTabsProps) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-1">
      {CATEGORIES.map((category) => {
        const isActive = active === category.slug;

        return (
          <button
            key={category.slug}
            onClick={() => onChange(category.slug)}
            className={cn(
              'relative px-4 py-2 text-sm font-medium rounded-full transition-all duration-200',
              isActive
                ? 'text-text'
                : 'text-text-tertiary hover:text-text-secondary'
            )}
          >
            {category.label}

            {/* Active indicator - underline */}
            {isActive && (
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-accent rounded-full" />
            )}
          </button>
        );
      })}
    </div>
  );
}
