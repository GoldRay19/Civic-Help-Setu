import {
  MapPin,
  Clock,
  ShieldCheck,
  AlertCircle,
  ClipboardList,
  Copy,
  Info,
  Calendar,
  Layers,
  MessageSquarePlus,
} from 'lucide-react';
import { getPdsAuditStatus } from '../../services/pdsShopService';
import { useToast } from '../../context/ToastContext';

export default function PdsShopCard({
  shop,
  onOpenDetails,
  onOpenChecklist,
  onOpenObservation,
}) {
  const { toast } = useToast();
  if (!shop) return null;

  const auditStatus = getPdsAuditStatus(shop);

  const handleCopyDetails = (e) => {
    e.stopPropagation();
    const details = [
      `Official Fair Price Shop: ${shop.name} (${shop.fpsId})`,
      `Dealer: ${shop.dealerName}`,
      `Address: ${shop.address}, ${shop.locality}, ${shop.district}, ${shop.state} - ${shop.pincode}`,
      `Hours: ${shop.operatingHours?.regularHours} (Weekly Off: ${shop.operatingHours?.weeklyOff})`,
      `Distribution Cycle: ${shop.operatingHours?.distributionCycle}`,
      `ONORC Portability: ${shop.onorcPortability?.enabled ? 'Active (Nationwide Biometric)' : 'Not Enabled'}`,
      `Source: ${shop.auditMetadata?.sourceUrl} (Last Verified: ${auditStatus.formattedDate})`,
    ].join('\n');

    navigator.clipboard?.writeText?.(details);
    toast?.success?.('Shop details and official hours copied to clipboard.');
  };

  return (
    <article
      className="pds-shop-card"
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
              backgroundColor: 'rgba(56, 189, 248, 0.12)',
              color: 'var(--accent-main, #0284c7)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
            }}
          >
            FPS: {shop.fpsId}
          </span>

          {shop.onorcPortability?.enabled && (
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                padding: '0.2rem 0.6rem',
                borderRadius: '9999px',
                backgroundColor: 'rgba(16, 185, 129, 0.12)',
                color: '#10b981',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
              }}
            >
              <Layers size={12} /> ONORC Active
            </span>
          )}

          {/* Audit Freshness Badge */}
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              padding: '0.2rem 0.6rem',
              borderRadius: '9999px',
              backgroundColor: auditStatus.badgeBg,
              color: auditStatus.color,
              border: `1px solid ${auditStatus.color}40`,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
            }}
          >
            {auditStatus.isOverdue ? <AlertCircle size={12} /> : <ShieldCheck size={12} />}
            {auditStatus.label}
          </span>
        </div>

        {/* Shop Name & Dealer */}
        <h3
          style={{
            fontSize: '1.15rem',
            fontWeight: 700,
            color: 'var(--text-primary)',
            marginBottom: '0.25rem',
            lineHeight: 1.35,
          }}
        >
          {shop.name}
        </h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
          Dealer: <strong style={{ color: 'var(--text-primary)' }}>{shop.dealerName}</strong>
        </p>

        {/* Location & Address */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.65rem' }}>
          <MapPin size={16} style={{ color: 'var(--accent-main, #0284c7)', flexShrink: 0, marginTop: '0.15rem' }} />
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
            {shop.address}, {shop.locality}, {shop.block}, {shop.district}, {shop.state} - {shop.pincode}
          </span>
        </div>

        {/* Timings & Distribution Window */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.65rem' }}>
          <Clock size={16} style={{ color: '#f59e0b', flexShrink: 0, marginTop: '0.15rem' }} />
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            <strong>{shop.operatingHours?.regularHours}</strong> (Closed: {shop.operatingHours?.weeklyOff})
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '1rem' }}>
          <Calendar size={16} style={{ color: '#8b5cf6', flexShrink: 0, marginTop: '0.15rem' }} />
          <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            Cycle: {shop.operatingHours?.distributionCycle}
          </span>
        </div>

        {/* Audit Warning Banner if Overdue */}
        {auditStatus.isOverdue && (
          <div
            style={{
              padding: '0.5rem 0.75rem',
              borderRadius: '0.5rem',
              backgroundColor: 'rgba(245, 158, 11, 0.1)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.78rem',
              color: '#d97706',
            }}
          >
            <AlertCircle size={14} style={{ flexShrink: 0 }} />
            <span>Audit overdue (&gt; 180 days). Please confirm timings locally.</span>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div
        style={{
          borderTop: '1px solid var(--border-light, #e2e8f0)',
          paddingTop: '1rem',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.5rem',
        }}
      >
        <button
          onClick={() => onOpenDetails?.(shop)}
          style={{
            flex: '1 1 140px',
            padding: '0.55rem 0.75rem',
            borderRadius: '0.5rem',
            backgroundColor: 'var(--accent-main, #0284c7)',
            color: '#ffffff',
            border: 'none',
            fontWeight: 600,
            fontSize: '0.85rem',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.35rem',
          }}
        >
          <Info size={15} /> Details & Entitlements
        </button>

        <button
          onClick={() => onOpenChecklist?.(shop)}
          style={{
            padding: '0.55rem 0.75rem',
            borderRadius: '0.5rem',
            backgroundColor: 'var(--bg-secondary, #f8fafc)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-main)',
            fontWeight: 500,
            fontSize: '0.85rem',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
          }}
          aria-label={`Open visit checklist for ${shop.name}`}
        >
          <ClipboardList size={15} /> Checklist
        </button>

        <button
          onClick={() => onOpenObservation?.(shop)}
          style={{
            padding: '0.55rem 0.75rem',
            borderRadius: '0.5rem',
            backgroundColor: 'var(--bg-secondary, #f8fafc)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-main)',
            fontWeight: 500,
            fontSize: '0.85rem',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
          }}
          aria-label={`Report dated observation for ${shop.name}`}
        >
          <MessageSquarePlus size={15} /> Report
        </button>

        <button
          onClick={handleCopyDetails}
          title="Copy shop details to clipboard"
          aria-label={`Copy details for ${shop.name}`}
          style={{
            padding: '0.55rem 0.65rem',
            borderRadius: '0.5rem',
            backgroundColor: 'transparent',
            color: 'var(--text-secondary)',
            border: '1px solid var(--border-main)',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Copy size={15} />
        </button>
      </div>
    </article>
  );
}

