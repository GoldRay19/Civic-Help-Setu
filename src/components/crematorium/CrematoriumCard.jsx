import {
  MapPin,
  Clock,
  ShieldCheck,
  ClipboardList,
  Copy,
  Info,
  Moon,
} from 'lucide-react';
import { FACILITY_TYPE_LABELS } from '../../data/crematoriumContract';
import { getFacilityFreshness, formatCrematoriumInstructions } from '../../services/crematoriumService';
import { useToast } from '../../context/ToastContext';

export default function CrematoriumCard({
  facility,
  onOpenDetails,
  onOpenChecklist,
  onOpenCorrection,
}) {
  const { toast } = useToast();
  if (!facility) return null;

  const freshness = getFacilityFreshness(facility);
  const typeLabel = FACILITY_TYPE_LABELS[facility.facilityType] || 'Public Facility';

  const handleCopyInstructions = (e) => {
    e.stopPropagation();
    const text = formatCrematoriumInstructions(facility);
    navigator.clipboard?.writeText?.(text);
    toast?.success?.('Facility details and official instructions copied to clipboard.');
  };

  return (
    <article
      className="crematorium-card"
      style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-main)',
        borderRadius: '1rem',
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
        position: 'relative',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
      }}
    >
      <div>
        {/* Top Badges */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center', marginBottom: '0.75rem' }}>
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              padding: '0.2rem 0.6rem',
              borderRadius: '9999px',
              backgroundColor: 'rgba(56, 189, 248, 0.1)',
              color: 'var(--accent-main, #0284c7)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
            }}
          >
            {typeLabel}
          </span>
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              padding: '0.2rem 0.6rem',
              borderRadius: '9999px',
              backgroundColor: 'var(--glass-bg)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-light)',
            }}
          >
            {facility.managingAuthority}
          </span>
          {facility.operatingHours?.outOfHoursServices && (
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                padding: '0.2rem 0.6rem',
                borderRadius: '9999px',
                backgroundColor: 'rgba(147, 51, 234, 0.1)',
                color: '#9333ea',
                border: '1px solid rgba(147, 51, 234, 0.25)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
              }}
            >
              <Moon size={12} /> Out-of-Hours Supported
            </span>
          )}
          {freshness.status === 'overdue' && (
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                padding: '0.2rem 0.6rem',
                borderRadius: '9999px',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                color: '#ef4444',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
              }}
            >
              Audit Overdue (Stale Record)
            </span>
          )}
        </div>

        {/* Title */}
        <h3
          style={{
            fontSize: '1.2rem',
            fontWeight: 700,
            color: 'var(--text-primary)',
            marginBottom: '0.5rem',
            lineHeight: 1.3,
          }}
        >
          {facility.name}
        </h3>

        {/* Address */}
        <p
          style={{
            fontSize: '0.875rem',
            color: 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.4rem',
            marginBottom: '1rem',
          }}
        >
          <MapPin size={16} style={{ flexShrink: 0, marginTop: '2px', color: 'var(--accent-main)' }} />
          <span>
            {facility.address}, {facility.district}, {facility.state} - {facility.pincode}
          </span>
        </p>

        {/* Quick Highlights Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
            gap: '0.5rem',
            marginBottom: '1rem',
            fontSize: '0.8rem',
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--bg-main)',
              padding: '0.5rem 0.75rem',
              borderRadius: '0.5rem',
              border: '1px solid var(--border-light)',
            }}
          >
            <div style={{ color: 'var(--text-tertiary)', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Clock size={12} /> Operating Hours
            </div>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
              {facility.operatingHours?.hours || 'Unpublished'}
            </div>
          </div>

          <div
            style={{
              backgroundColor: 'var(--bg-main)',
              padding: '0.5rem 0.75rem',
              borderRadius: '0.5rem',
              border: '1px solid var(--border-light)',
            }}
          >
            <div style={{ color: 'var(--text-tertiary)', fontSize: '0.7rem' }}>Official Contact</div>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
              {facility.officialContact?.phone?.[0] || 'In-person gate'}
            </div>
          </div>

          <div
            style={{
              backgroundColor: 'var(--bg-main)',
              padding: '0.5rem 0.75rem',
              borderRadius: '0.5rem',
              border: '1px solid var(--border-light)',
            }}
          >
            <div style={{ color: 'var(--text-tertiary)', fontSize: '0.7rem' }}>Statutory Charges</div>
            <div style={{ fontWeight: 600, color: facility.statutoryCharges?.isFree ? 'var(--success, #16a34a)' : 'var(--text-primary)', marginTop: '2px' }}>
              {facility.statutoryCharges?.isFree ? 'Free (Subsidized)' : 'Published Scale'}
            </div>
          </div>
        </div>

        {/* Accessibility & Features Chips */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1.25rem' }}>
          {facility.accessibility?.wheelchairAccessible && (
            <span style={{ fontSize: '0.75rem', padding: '0.15rem 0.5rem', borderRadius: '4px', backgroundColor: 'var(--bg-main)', color: 'var(--text-secondary)', border: '1px solid var(--border-light)' }}>
              ♿ Ramp Access
            </span>
          )}
          {facility.accessibility?.mortuaryColdStorage && (
            <span style={{ fontSize: '0.75rem', padding: '0.15rem 0.5rem', borderRadius: '4px', backgroundColor: 'var(--bg-main)', color: 'var(--text-secondary)', border: '1px solid var(--border-light)' }}>
              ❄️ Cold Storage
            </span>
          )}
          {facility.accessibility?.hearseAccess && (
            <span style={{ fontSize: '0.75rem', padding: '0.15rem 0.5rem', borderRadius: '4px', backgroundColor: 'var(--bg-main)', color: 'var(--text-secondary)', border: '1px solid var(--border-light)' }}>
              🚐 Hearse Bay
            </span>
          )}
        </div>

        {/* Mandatory Live-Slot Disclaimer */}
        <div
          style={{
            fontSize: '0.75rem',
            color: 'var(--text-tertiary)',
            backgroundColor: 'rgba(245, 158, 11, 0.08)',
            border: '1px solid rgba(245, 158, 11, 0.2)',
            borderRadius: '0.5rem',
            padding: '0.5rem 0.75rem',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
          }}
        >
          <Info size={14} style={{ color: 'var(--warning, #f59e0b)', flexShrink: 0 }} />
          <span>Live slot availability is not tracked. Contact gate or authority directly.</span>
        </div>
      </div>

      {/* Footer Actions & Verification provenance */}
      <div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: '0.75rem',
            borderTop: '1px solid var(--border-light)',
            marginBottom: '0.75rem',
            fontSize: '0.75rem',
            color: 'var(--text-tertiary)',
          }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
            <ShieldCheck size={14} style={{ color: freshness.color }} />
            Verified: {facility.auditMetadata?.lastVerified || 'Pending'}
          </span>
          <button
            type="button"
            onClick={() => onOpenCorrection(facility)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--accent-main)',
              cursor: 'pointer',
              padding: 0,
              fontSize: '0.75rem',
              textDecoration: 'underline',
            }}
          >
            Suggest Correction
          </button>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => onOpenDetails(facility)}
            style={{
              flex: '1 1 auto',
              padding: '0.6rem 1rem',
              backgroundColor: 'var(--accent-main)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '0.5rem',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
            }}
          >
            Procedures & Charges
          </button>

          <button
            type="button"
            onClick={() => onOpenChecklist(facility)}
            style={{
              padding: '0.6rem 0.85rem',
              backgroundColor: 'var(--bg-main)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-main)',
              borderRadius: '0.5rem',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
            title="Open Preparation Checklist"
          >
            <ClipboardList size={16} />
            Checklist
          </button>

          <button
            type="button"
            onClick={handleCopyInstructions}
            style={{
              padding: '0.6rem 0.75rem',
              backgroundColor: 'var(--bg-main)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-main)',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
            }}
            title="Copy Official Instructions"
          >
            <Copy size={16} />
          </button>
        </div>
      </div>
    </article>
  );
}
