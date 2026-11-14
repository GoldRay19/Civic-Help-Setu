import { ShieldCheck, BookOpen, Sparkles } from 'lucide-react';

/**
 * Small inline badge that tells the reader what kind of content they
 * are looking at: official government information, editorial guidance,
 * or AI-generated / unverified content.
 *
 * Accepted `type` values: 'official' | 'guidance' | 'ai'
 */
const BADGE_CONFIG = {
  official: {
    icon: ShieldCheck,
    label: 'Official information',
    className: 'content-badge--official',
  },
  guidance: {
    icon: BookOpen,
    label: 'Explanatory guidance',
    className: 'content-badge--guidance',
  },
  ai: {
    icon: Sparkles,
    label: 'AI-generated — verify independently',
    className: 'content-badge--ai',
  },
};

const ContentTypeBadge = ({ type = 'guidance' }) => {
  const config = BADGE_CONFIG[type] || BADGE_CONFIG.guidance;
  const Icon = config.icon;

  return (
    <span
      className={`content-badge ${config.className}`}
      role="note"
      aria-label={config.label}
    >
      <Icon size={13} aria-hidden="true" />
      {config.label}
    </span>
  );
};

export default ContentTypeBadge;
