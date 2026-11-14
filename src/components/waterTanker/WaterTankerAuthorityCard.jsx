import {
  ExternalLink,
  Phone,
  Clock,
  ShieldCheck,
  FileText,
  AlertCircle,
  CheckCircle2,
  BookmarkCheck,
  Send,
  Flag,
} from 'lucide-react';
import { getVerificationFreshness, formatVerificationDate } from '../../services/sourceVerificationService';

export default function WaterTankerAuthorityCard({
  authority,
  onLogRequest,
  onOpenChecklist,
  onOpenEscalation,
  onOpenReport,
}) {
  if (!authority) return null;

  const freshness = getVerificationFreshness(authority.auditMetadata?.lastVerified);
  const formattedVerifiedDate = formatVerificationDate(authority.auditMetadata?.lastVerified);

  return (
    <div
      role="article"
      aria-label={`${authority.name} information card`}
      style={{
        borderRadius: '1rem',
        border: '1px solid var(--border-color, #e2e8f0)',
        backgroundColor: 'var(--surface, #ffffff)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
        position: 'relative',
      }}
    >
      {/* Header */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  padding: '0.15rem 0.5rem',
                  borderRadius: '0.375rem',
                  backgroundColor: 'rgba(37, 99, 235, 0.1)',
                  color: 'var(--primary, #2563eb)',
                }}
              >
                {authority.shortCode}
              </span>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary, #64748b)', fontWeight: 500 }}>
                {authority.city}, {authority.state}
              </span>
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--text, #0f172a)', margin: 0 }}>
              {authority.name}
            </h3>
          </div>

          {/* Audit Freshness Badge */}
          <div
            title={`Last audit verified on ${formattedVerifiedDate || 'Unknown'}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem',
              fontSize: '0.75rem',
              fontWeight: 600,
              padding: '0.25rem 0.6rem',
              borderRadius: '999px',
              backgroundColor: freshness.badgeBg,
              color: freshness.color,
              whiteSpace: 'nowrap',
            }}
          >
            <ShieldCheck size={14} aria-hidden="true" />
            <span>{freshness.label}</span>
          </div>
        </div>

        <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary, #64748b)' }}>
          {authority.managingAuthority}
        </p>
      </div>

      {/* Pricing & Eligibility Summary */}
      <div
        style={{
          borderRadius: '0.75rem',
          backgroundColor: 'var(--surface-raised, #f8fafc)',
          border: '1px solid var(--border-color, #e2e8f0)',
          padding: '1rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
        }}
      >
        <div>
          <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary, #64748b)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Statutory Tariff & Rates
          </span>
          <div style={{ marginTop: '0.35rem', display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text, #0f172a)' }}>
              ₹{authority.pricingStructure.standardRateInr}
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary, #64748b)' }}>
              / {authority.pricingStructure.capacityLitres.toLocaleString('en-IN')} Litres
            </span>
          </div>
          {authority.pricingStructure.officialOrderUrl && (
            <a
              href={authority.pricingStructure.officialOrderUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
                fontSize: '0.75rem',
                color: 'var(--primary, #2563eb)',
                textDecoration: 'none',
                marginTop: '0.25rem',
              }}
            >
              <span>View Official Tariff Order</span>
              <ExternalLink size={12} aria-hidden="true" />
            </a>
          )}
        </div>

        <div>
          <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary, #64748b)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Emergency Free Quota
          </span>
          <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.825rem', color: 'var(--text, #0f172a)', lineHeight: 1.4 }}>
            {authority.eligibilityConditions.freeSupplyCriteria}
          </p>
        </div>
      </div>

      {/* Official Booking Channels */}
      <div>
        <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text, #0f172a)', margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <CheckCircle2 size={16} style={{ color: 'var(--success, #16a34a)' }} aria-hidden="true" />
          <span>Official Request Channels</span>
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {authority.officialChannels.map((ch, idx) => (
            <div
              key={idx}
              style={{
                borderRadius: '0.5rem',
                border: '1px solid var(--border-color, #e2e8f0)',
                padding: '0.625rem 0.75rem',
                fontSize: '0.85rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.25rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                <span style={{ fontWeight: 600, color: 'var(--text, #0f172a)' }}>{ch.name}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {ch.phone && (
                    <a
                      href={`tel:${ch.phone.replace(/[^0-9+]/g, '')}`}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        color: 'var(--primary, #2563eb)',
                        textDecoration: 'none',
                        fontWeight: 500,
                      }}
                    >
                      <Phone size={13} aria-hidden="true" />
                      <span>{ch.phone}</span>
                    </a>
                  )}
                  {ch.url && (
                    <a
                      href={ch.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        color: 'var(--primary, #2563eb)',
                        textDecoration: 'none',
                        fontWeight: 500,
                      }}
                    >
                      <span>Open Portal</span>
                      <ExternalLink size={13} aria-hidden="true" />
                    </a>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-secondary, #64748b)' }}>
                <Clock size={12} aria-hidden="true" />
                <span>{ch.hours}</span>
              </div>
              <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-secondary, #64748b)' }}>
                {ch.instructions}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Official vs Editorial Guidance */}
      <div
        style={{
          borderRadius: '0.5rem',
          borderLeft: '4px solid var(--accent, #f59e0b)',
          backgroundColor: 'rgba(245, 158, 11, 0.08)',
          padding: '0.75rem',
          fontSize: '0.8rem',
          color: 'var(--text, #0f172a)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600, marginBottom: '0.25rem' }}>
          <AlertCircle size={14} style={{ color: 'var(--accent, #f59e0b)' }} aria-hidden="true" />
          <span>Editorial Citizen Guidance (Separate from Official Orders)</span>
        </div>
        <p style={{ margin: 0, lineHeight: 1.45 }}>
          {authority.editorialGuidance}
        </p>
      </div>

      {/* Wards Tag List */}
      <div>
        <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary, #64748b)', marginBottom: '0.35rem' }}>
          Covered Wards / Zones:
        </span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
          {authority.wards.slice(0, 5).map((w, idx) => (
            <span
              key={idx}
              style={{
                fontSize: '0.75rem',
                backgroundColor: 'var(--surface-raised, #f1f5f9)',
                color: 'var(--text-secondary, #64748b)',
                padding: '0.15rem 0.45rem',
                borderRadius: '0.25rem',
              }}
            >
              {w}
            </span>
          ))}
          {authority.wards.length > 5 && (
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary, #64748b)', alignSelf: 'center' }}>
              +{authority.wards.length - 5} more wards
            </span>
          )}
        </div>
      </div>

      {/* Card Actions */}
      <div
        style={{
          marginTop: 'auto',
          paddingTop: '0.75rem',
          borderTop: '1px solid var(--border-color, #e2e8f0)',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.5rem',
        }}
      >
        <button
          type="button"
          onClick={() => onLogRequest(authority)}
          className="btn btn-primary"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.5rem 0.85rem',
            borderRadius: '0.5rem',
            fontSize: '0.85rem',
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          <BookmarkCheck size={16} aria-hidden="true" />
          <span>Log / Track Request</span>
        </button>

        <button
          type="button"
          onClick={() => onOpenChecklist(authority)}
          className="btn btn-secondary"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.5rem 0.85rem',
            borderRadius: '0.5rem',
            fontSize: '0.85rem',
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          <FileText size={16} aria-hidden="true" />
          <span>Prep Checklist</span>
        </button>

        <button
          type="button"
          onClick={() => onOpenEscalation(authority)}
          className="btn btn-secondary"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.5rem 0.85rem',
            borderRadius: '0.5rem',
            fontSize: '0.85rem',
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          <Send size={16} aria-hidden="true" />
          <span>Non-Delivery Escalation</span>
        </button>

        <button
          type="button"
          onClick={() => onOpenReport(authority)}
          style={{
            marginLeft: 'auto',
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary, #64748b)',
            fontSize: '0.8rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.25rem',
            cursor: 'pointer',
            padding: '0.4rem',
          }}
          title="Report inaccurate tariff or broken helpline"
        >
          <Flag size={14} aria-hidden="true" />
          <span>Report Issue</span>
        </button>
      </div>
    </div>
  );
}
