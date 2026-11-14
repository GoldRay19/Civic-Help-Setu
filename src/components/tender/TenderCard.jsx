import {
  FileText,
  Building2,
  ExternalLink,
  ShieldCheck,
  Clock,
  FileCheck2,
} from 'lucide-react';
import { safeHttpUrl } from '../../utils/safeContent';
import { getClosingUrgency, getTenderFreshness } from '../../services/tenderService';
import { TENDER_CATEGORY_LABELS } from '../../data/tenderContract';
import TenderStaleDataNotice from './TenderStaleDataNotice';

export default function TenderCard({
  tender,
  onInspect,
  onOpenChecklist,
  onOpenCorrection,
  checklistState,
}) {
  const urgency = getClosingUrgency(tender.closingSchedule);
  const freshness = getTenderFreshness(tender);
  const officialUrl = safeHttpUrl(tender.sourceUrl);

  const emd = tender.financials?.emd;
  const tenderFee = tender.financials?.tenderFee;
  const isMsmeExempt = emd?.isExemptForMsme || tenderFee?.isExemptForMsme;
  const hasCorrigenda = Array.isArray(tender.corrigenda) && tender.corrigenda.length > 0;

  // Saved checklist progress
  const completedCount = Object.values(checklistState?.items || {}).filter(
    (i) => i.status === 'ready' || i.status === 'exempt'
  ).length;
  const totalMandatory = tender.eligibilityCriteria?.mandatory?.length || 0;

  return (
    <div
      className="card hover-scale"
      style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-main)',
        borderRadius: '1rem',
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        transition: 'all 0.2s ease',
      }}
    >
      <div>
        {/* Top Header: Category & Reference */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '0.2rem 0.5rem',
                borderRadius: '4px',
                backgroundColor: 'rgba(14, 165, 233, 0.1)',
                color: 'var(--accent-main)',
                border: '1px solid rgba(14, 165, 233, 0.25)',
              }}
            >
              {TENDER_CATEGORY_LABELS[tender.category] || tender.category}
            </span>

            <span style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', fontFamily: 'monospace' }}>
              Ref: {tender.tenderRefNumber}
            </span>
          </div>

          {/* Closing Urgency Badge */}
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              padding: '0.2rem 0.6rem',
              borderRadius: '9999px',
              backgroundColor: `${urgency.badgeColor}15`,
              color: urgency.badgeColor,
              border: `1px solid ${urgency.badgeColor}40`,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem',
            }}
          >
            <Clock size={12} />
            {urgency.label}
          </span>
        </div>

        {/* Tender Title */}
        <h3
          style={{
            fontSize: '1.1rem',
            fontWeight: 700,
            color: 'var(--text-primary)',
            lineHeight: 1.4,
            marginBottom: '0.75rem',
          }}
        >
          {tender.title}
        </h3>

        {/* Procuring Authority & Jurisdiction */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem', fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Building2 size={14} color="var(--accent-main)" />
            <strong>{tender.authority}</strong>
          </span>
          <span>•</span>
          <span style={{ textTransform: 'capitalize' }}>
            {tender.jurisdiction?.level} Level {tender.jurisdiction?.states?.length > 0 ? `(${tender.jurisdiction.states.join(', ')})` : ''}
          </span>
        </div>

        {/* Key Attributes Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '0.75rem',
            backgroundColor: 'var(--bg-main)',
            padding: '0.85rem',
            borderRadius: '0.75rem',
            marginBottom: '1rem',
            fontSize: '0.825rem',
          }}
        >
          <div>
            <span style={{ color: 'var(--text-tertiary)', display: 'block', fontSize: '0.75rem' }}>Estimated Value</span>
            <strong style={{ color: 'var(--text-primary)' }}>
              {tender.financials?.estimatedValue?.isDisclosed
                ? tender.financials.estimatedValue.statedText
                : 'Not Disclosed'}
            </strong>
          </div>

          <div>
            <span style={{ color: 'var(--text-tertiary)', display: 'block', fontSize: '0.75rem' }}>EMD / Bid Security</span>
            <strong style={{ color: 'var(--text-primary)' }}>
              {emd?.isExemptForMsme ? 'Exempt for MSME' : emd?.amount ? `₹${emd.amount.toLocaleString()}` : 'Not Specified'}
            </strong>
          </div>

          <div>
            <span style={{ color: 'var(--text-tertiary)', display: 'block', fontSize: '0.75rem' }}>Pre-Bid Conference</span>
            <span style={{ color: 'var(--text-secondary)' }}>
              {tender.preBidMeeting?.isUnavailable
                ? 'Date to be announced'
                : tender.preBidMeeting?.date
                ? `${tender.preBidMeeting.date} (${tender.preBidMeeting.mode || 'Notice'})`
                : 'None scheduled'}
            </span>
          </div>

          <div>
            <span style={{ color: 'var(--text-tertiary)', display: 'block', fontSize: '0.75rem' }}>Corrigenda</span>
            <span style={{ color: hasCorrigenda ? '#f59e0b' : 'var(--text-secondary)', fontWeight: hasCorrigenda ? 600 : 400 }}>
              {hasCorrigenda ? `${tender.corrigenda.length} Corrigendum Issued` : 'None published'}
            </span>
          </div>
        </div>

        {/* MSME Exemption Pill */}
        {isMsmeExempt && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.4rem 0.65rem',
              backgroundColor: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              borderRadius: '6px',
              fontSize: '0.78rem',
              color: '#10b981',
              marginBottom: '1rem',
            }}
          >
            <ShieldCheck size={14} />
            <span>
              <strong>MSME Benefit Applicable:</strong> {emd?.exemptionBasis || 'Tender fee / EMD waiver supported'}
            </span>
          </div>
        )}

        {/* Readiness Checklist Progress (if started) */}
        {totalMandatory > 0 && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '0.8rem',
              marginBottom: '1rem',
              padding: '0.4rem 0.65rem',
              backgroundColor: 'var(--glass-bg)',
              borderRadius: '6px',
              border: '1px solid var(--border-main)',
            }}
          >
            <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <FileCheck2 size={14} color="var(--accent-main)" />
              Readiness Evidence Tracker:
            </span>
            <strong style={{ color: completedCount === totalMandatory ? '#10b981' : 'var(--text-primary)' }}>
              {completedCount} / {totalMandatory} Verified
            </strong>
          </div>
        )}

        {/* Stale Warning Banner (if audit overdue) */}
        {freshness.isStale && (
          <div style={{ marginBottom: '1rem' }}>
            <TenderStaleDataNotice tender={tender} />
          </div>
        )}
      </div>

      {/* Action Buttons Footer */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.75rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            type="button"
            onClick={() => onInspect(tender)}
            className="btn btn-secondary btn-sm"
            style={{
              flex: 1,
              padding: '0.55rem',
              fontSize: '0.825rem',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.35rem',
            }}
          >
            <FileText size={14} />
            <span>Inspect Eligibility</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenChecklist(tender)}
            className="btn btn-primary btn-sm"
            style={{
              flex: 1,
              padding: '0.55rem',
              fontSize: '0.825rem',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.35rem',
            }}
          >
            <FileCheck2 size={14} />
            <span>Readiness Checklist</span>
          </button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', color: 'var(--text-tertiary)', paddingTop: '0.5rem', borderTop: '1px solid var(--border-light)' }}>
          <button
            type="button"
            onClick={() => onOpenCorrection(tender)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              textDecoration: 'underline',
              padding: 0,
              fontSize: '0.78rem',
            }}
          >
            Report Date / Corrigendum Update
          </button>

          {officialUrl && (
            <a
              href={officialUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
                color: 'var(--accent-main)',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              <span>Official Notice</span>
              <ExternalLink size={12} />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
