import AccessibleModal from '../common/AccessibleModal';
import {
  Clock,
  ShieldCheck,
  ExternalLink,
  Layers,
  Phone,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { getPdsAuditStatus, STATUTORY_NFSA_RULES } from '../../services/pdsShopService';
import { safeHttpUrl } from '../../utils/safeContent';

export default function PdsShopDetailModal({
  isOpen,
  onClose,
  shop,
  onOpenChecklist,
  onOpenObservation,
}) {
  if (!isOpen || !shop) return null;

  const audit = getPdsAuditStatus(shop);
  const safeSourceUrl = safeHttpUrl(audit.sourceUrl);
  const safeGrievanceUrl = safeHttpUrl(shop.officialContact?.stateGrievancePortal);

  return (
    <AccessibleModal
      isOpen={isOpen}
      onClose={onClose}
      title={shop.name}
      subtitle={`Official Fair Price Shop ID: ${shop.fpsId} | ${shop.district}, ${shop.state}`}
      maxWidth="680px"
      ariaLabel={`Official Details for Fair Price Shop ${shop.name}`}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Anti-Hallucination Grain Stock Disclaimer */}
        <div
          style={{
            padding: '0.85rem 1rem',
            borderRadius: '0.75rem',
            backgroundColor: 'rgba(2, 132, 199, 0.08)',
            border: '1px solid rgba(2, 132, 199, 0.25)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.75rem',
          }}
        >
          <AlertCircle size={20} style={{ color: 'var(--accent-main, #0284c7)', flexShrink: 0, marginTop: '0.15rem' }} />
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
            <strong style={{ color: 'var(--text-primary)' }}>Official PDS Information Policy:</strong>
            <br />
            Live grain stock levels are <strong>not tracked or implied</strong> on this board without direct government telemetry.
            Please visit the shop during published distribution hours or consult the state Food &amp; Supplies portal.
          </div>
        </div>

        {/* Operating Hours & Holiday Notice */}
        <div
          style={{
            backgroundColor: 'var(--bg-secondary, #f8fafc)',
            padding: '1rem',
            borderRadius: '0.75rem',
            border: '1px solid var(--border-light, #e2e8f0)',
          }}
        >
          <h4
            style={{
              fontSize: '0.95rem',
              fontWeight: 600,
              color: 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '0.75rem',
            }}
          >
            <Clock size={16} style={{ color: '#f59e0b' }} /> Official Operating Schedule
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', fontSize: '0.85rem' }}>
            <div>
              <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.75rem' }}>Daily Operating Hours:</span>
              <strong style={{ color: 'var(--text-primary)' }}>{shop.operatingHours?.regularHours || 'Unavailable from official source'}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.75rem' }}>Designated Weekly Off:</span>
              <strong style={{ color: 'var(--text-primary)' }}>{shop.operatingHours?.weeklyOff || 'Unavailable from official source'}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.75rem' }}>Monthly Distribution Window:</span>
              <strong style={{ color: 'var(--text-primary)' }}>{shop.operatingHours?.distributionCycle || 'Unavailable from official source'}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.75rem' }}>Holiday Policy:</span>
              <span style={{ color: 'var(--text-primary)' }}>{shop.operatingHours?.holidayNotice || 'Unavailable from official source'}</span>
            </div>
          </div>
        </div>

        {/* Statutory NFSA Entitlements */}
        <div
          style={{
            backgroundColor: 'var(--bg-secondary, #f8fafc)',
            padding: '1rem',
            borderRadius: '0.75rem',
            border: '1px solid var(--border-light, #e2e8f0)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <h4
              style={{
                fontSize: '0.95rem',
                fontWeight: 600,
                color: 'var(--text-primary)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                margin: 0,
              }}
            >
              <FileText size={16} style={{ color: '#10b981' }} /> Statutory NFSA Entitlements
            </h4>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 600,
                padding: '0.15rem 0.5rem',
                borderRadius: '4px',
                backgroundColor: 'rgba(16, 185, 129, 0.12)',
                color: '#10b981',
              }}
            >
              Official Norms
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.85rem' }}>
            <div style={{ padding: '0.5rem', backgroundColor: 'var(--bg-surface)', borderRadius: '0.5rem', border: '1px solid var(--border-main)' }}>
              <strong style={{ color: 'var(--text-primary)' }}>{STATUTORY_NFSA_RULES.aay.title}:</strong>
              <div style={{ color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                {shop.entitlements?.aayAllocation || STATUTORY_NFSA_RULES.aay.quota}
              </div>
            </div>

            <div style={{ padding: '0.5rem', backgroundColor: 'var(--bg-surface)', borderRadius: '0.5rem', border: '1px solid var(--border-main)' }}>
              <strong style={{ color: 'var(--text-primary)' }}>{STATUTORY_NFSA_RULES.phh.title}:</strong>
              <div style={{ color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                {shop.entitlements?.phhAllocation || STATUTORY_NFSA_RULES.phh.quota}
              </div>
            </div>

            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
              Pricing Policy: {shop.entitlements?.pricingPolicy}
            </div>
          </div>
        </div>

        {/* Required Documents & Verification Status */}
        <div
          style={{
            backgroundColor: 'var(--bg-secondary, #f8fafc)',
            padding: '1rem',
            borderRadius: '0.75rem',
            border: '1px solid var(--border-light, #e2e8f0)',
          }}
        >
          <h4
            style={{
              fontSize: '0.95rem',
              fontWeight: 600,
              color: 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '0.75rem',
            }}
          >
            <ShieldCheck size={16} style={{ color: 'var(--accent-main, #0284c7)' }} /> Prerequisite Documents &amp; Verification Status
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
            {(shop.requiredDocuments && shop.requiredDocuments.length > 0 ? shop.requiredDocuments : [
              { name: 'Original Physical Ration Card or Mera Ration Digital Card', type: 'required' },
              { name: 'Aadhaar Biometric Identification for e-POS Scanning', type: 'required' },
              { name: 'Nominee / Proxy Authorization Form', type: 'conditional', condition: 'Required only if cardholder is elderly/infirm or biometrics fail' },
            ]).map((doc, idx) => (
              <div
                key={idx}
                style={{
                  padding: '0.5rem 0.75rem',
                  borderRadius: '0.5rem',
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-main)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: '0.5rem',
                  flexWrap: 'wrap',
                }}
              >
                <div>
                  <strong style={{ color: 'var(--text-primary)' }}>{doc.name}</strong>
                  {doc.condition && (
                    <div style={{ fontSize: '0.78rem', color: '#d97706', marginTop: '0.15rem' }}>
                      Condition: {doc.condition}
                    </div>
                  )}
                </div>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    padding: '0.15rem 0.5rem',
                    borderRadius: '4px',
                    backgroundColor:
                      doc.type === 'required'
                        ? 'rgba(16, 185, 129, 0.12)'
                        : doc.type === 'conditional'
                        ? 'rgba(245, 158, 11, 0.12)'
                        : 'rgba(148, 163, 184, 0.15)',
                    color:
                      doc.type === 'required'
                        ? '#10b981'
                        : doc.type === 'conditional'
                        ? '#d97706'
                        : 'var(--text-secondary)',
                  }}
                >
                  {doc.type === 'required'
                    ? 'Official Requirement'
                    : doc.type === 'conditional'
                    ? 'Conditional Requirement'
                    : 'Not Verified by Circular'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ONORC Inter-State Portability */}
        <div
          style={{
            backgroundColor: 'var(--bg-secondary, #f8fafc)',
            padding: '1rem',
            borderRadius: '0.75rem',
            border: '1px solid var(--border-light, #e2e8f0)',
          }}
        >
          <h4
            style={{
              fontSize: '0.95rem',
              fontWeight: 600,
              color: 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '0.75rem',
            }}
          >
            <Layers size={16} style={{ color: '#8b5cf6' }} /> One Nation One Ration Card (ONORC) Portability
          </h4>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
            <p style={{ margin: '0 0 0.5rem' }}>
              <strong>Status:</strong>{' '}
              {shop.onorcPortability?.enabled ? (
                <span style={{ color: '#10b981', fontWeight: 600 }}>Operational for Inter-State &amp; Intra-State Lifting</span>
              ) : (
                <span style={{ color: '#ef4444', fontWeight: 600 }}>Portability Not Enabled</span>
              )}
            </p>
            <p style={{ margin: '0 0 0.5rem' }}>
              <strong>Biometric Device:</strong> {shop.onorcPortability?.biometricAuthMode}
            </p>
            {shop.onorcPortability?.note && (
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                {shop.onorcPortability.note}
              </p>
            )}
            <div style={{ marginTop: '0.5rem' }}>
              <a
                href="https://annavitran.nic.in"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  color: 'var(--accent-main, #0284c7)',
                  textDecoration: 'underline',
                  fontSize: '0.8rem',
                  fontWeight: 500,
                }}
              >
                <ExternalLink size={13} /> Official National Annavitran ONORC Portal (annavitran.nic.in)
              </a>
            </div>
          </div>
        </div>

        {/* Official Contacts & Statutory Grievance Redressal */}
        <div
          style={{
            backgroundColor: 'var(--bg-secondary, #f8fafc)',
            padding: '1rem',
            borderRadius: '0.75rem',
            border: '1px solid var(--border-light, #e2e8f0)',
          }}
        >
          <h4
            style={{
              fontSize: '0.95rem',
              fontWeight: 600,
              color: 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '0.75rem',
            }}
          >
            <Phone size={16} style={{ color: '#0284c7' }} /> Grievance Officer &amp; Redressal Helplines
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', fontSize: '0.85rem' }}>
            <div>
              <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.75rem' }}>National PDS Helpline:</span>
              <strong style={{ color: 'var(--text-primary)' }}>{shop.officialContact?.nationalHelpline || '1967'}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.75rem' }}>State Food Toll-Free:</span>
              <strong style={{ color: 'var(--text-primary)' }}>{shop.officialContact?.stateTollFree || 'Unavailable from official source'}</strong>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.75rem' }}>Designated Redressal Authority:</span>
              <strong style={{ color: 'var(--text-primary)' }}>{shop.officialContact?.grievanceOfficer || 'Unavailable from official source'}</strong>
            </div>
            {safeGrievanceUrl && (
              <div style={{ gridColumn: '1 / -1' }}>
                <a
                  href={safeGrievanceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    color: 'var(--accent-main, #0284c7)',
                    textDecoration: 'underline',
                    fontSize: '0.85rem',
                    fontWeight: 500,
                  }}
                >
                  <ExternalLink size={14} /> Official State Grievance Redressal Portal
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Data Provenance & Audit Metadata */}
        <div
          style={{
            padding: '0.85rem 1rem',
            borderRadius: '0.75rem',
            backgroundColor: audit.badgeBg,
            border: `1px solid ${audit.color}30`,
            fontSize: '0.82rem',
            color: 'var(--text-secondary)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.35rem' }}>
            <ShieldCheck size={16} style={{ color: audit.color }} />
            <strong style={{ color: 'var(--text-primary)' }}>Official Provenance &amp; Verification:</strong>
          </div>
          <div>Managing Authority: <strong>{shop.managingAuthority}</strong></div>
          <div>Verified By: <strong>{audit.verifiedBy}</strong> on <strong>{audit.formattedDate}</strong></div>
          {safeSourceUrl ? (
            <div style={{ marginTop: '0.35rem' }}>
              <a
                href={safeSourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  color: audit.color,
                  fontWeight: 600,
                  textDecoration: 'underline',
                }}
              >
                <ExternalLink size={13} /> Official Food &amp; Civil Supplies Directory ({new URL(safeSourceUrl).hostname})
              </a>
            </div>
          ) : (
            <div style={{ color: '#ef4444', marginTop: '0.35rem' }}>
              Official source URL unavailable. Marked as unverified.
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'flex-end',
            gap: '0.75rem',
            paddingTop: '0.75rem',
            borderTop: '1px solid var(--border-main)',
          }}
        >
          <button
            onClick={() => {
              onClose();
              onOpenChecklist?.(shop);
            }}
            style={{
              padding: '0.55rem 1rem',
              borderRadius: '0.5rem',
              backgroundColor: 'var(--bg-secondary, #f8fafc)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-main)',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Open Visit Checklist
          </button>
          <button
            onClick={() => {
              onClose();
              onOpenObservation?.(shop);
            }}
            style={{
              padding: '0.55rem 1rem',
              borderRadius: '0.5rem',
              backgroundColor: 'var(--accent-main, #0284c7)',
              color: '#ffffff',
              border: 'none',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Report Dated Observation
          </button>
        </div>
      </div>
    </AccessibleModal>
  );
}
