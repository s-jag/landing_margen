'use client';

interface AuthorityBadgeProps {
  level: number;
  compact?: boolean;
}

/**
 * Display authority level badge for Utah citations.
 * Level 1 = Primary (highest), Level 2 = Secondary, Level 3+ = Tertiary
 */
export function AuthorityBadge({ level, compact = false }: AuthorityBadgeProps) {
  const getAuthorityInfo = (level: number) => {
    switch (level) {
      case 1:
        return {
          label: 'Primary',
          shortLabel: 'P',
          color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
          tooltip: 'Primary authority - Utah Code or Constitution',
        };
      case 2:
        return {
          label: 'Secondary',
          shortLabel: 'S',
          color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
          tooltip: 'Secondary authority - Administrative Rules',
        };
      default:
        return {
          label: 'Tertiary',
          shortLabel: 'T',
          color: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
          tooltip: 'Tertiary authority - Decisions, Publications',
        };
    }
  };

  const info = getAuthorityInfo(level);

  if (compact) {
    return (
      <span
        className={`inline-flex items-center justify-center w-4 h-4 text-[10px] font-bold rounded border ${info.color}`}
        title={info.tooltip}
      >
        {info.shortLabel}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium rounded border ${info.color}`}
      title={info.tooltip}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {info.label}
    </span>
  );
}
