import { AlertCircle, CalendarClock, ExternalLink } from 'lucide-react';
import { safeHttpUrl } from '../../utils/safeContent';

export default function TenderStaleDataNotice({ tender }) {
  if (!tender) return null;
  const lastVerified = tender.auditMetadata?.lastVerified;
  const sourceUrl = safeHttpUrl(tender.sourceUrl);

  return (
    <div
      role="note"
      aria-label="Stale audit warning"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.75rem',
        padding: '0.75rem 1rem',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        border: '1px solid rgba(245, 158, 11, 0.3)',
        borderRadius: '8px',
        color: 'var(--text-primary)',
        fontSize: '0.85rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <AlertCircle size={18} color="#f59e0b" style={{ flexShrink: 0 }} />
        <span>
          <strong>Audit Stale Warning:</strong> This tender notice was last audited against the official portal on{' '}
          <strong>{lastVerified || 'unrecorded date'}</strong>. Please check the official source for recently issued corrigenda before submitting evidence.
        </span>
      </div>

      {sourceUrl && (
        <a
          href={sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-secondary btn-sm"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem', whiteSpace: 'nowrap' }}
        >
          <CalendarClock size={14} />
          <span>Verify Live on Portal</span>
          <ExternalLink size={12} />
        </a>
      )}
    </div>
  );
}

