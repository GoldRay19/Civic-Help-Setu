import { useState, useMemo } from 'react';
import AccessibleModal from '../common/AccessibleModal';
import {
  Printer,
  ExternalLink,
  Phone,
  AlertTriangle,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import {
  generateEscalationLetterText,
  calculateSlaStatus,
  getSavedRequests,
} from '../../services/waterTankerService';
import { buildLetterPrintHtml } from '../../utils/printHtml';

export default function WaterTankerEscalationModal({
  isOpen,
  onClose,
  authority,
}) {
  const [selectedTierIndex, setSelectedTierIndex] = useState(0);
  const [selectedRequestId, setSelectedRequestId] = useState('');

  const savedRequests = useMemo(() => {
    if (!authority?.id) return [];
    return getSavedRequests().filter((r) => r.authorityId === authority.id);
  }, [authority]);

  const activeRequest = useMemo(() => {
    if (!savedRequests.length) return null;
    if (selectedRequestId) {
      return savedRequests.find((r) => r.id === selectedRequestId) || savedRequests[0];
    }
    return savedRequests[0];
  }, [savedRequests, selectedRequestId]);

  const letterText = useMemo(() => {
    return generateEscalationLetterText({
      requestLog: activeRequest || {
        bookingReference: 'CITIZEN-TOKEN-PENDING',
        requestDate: new Date().toISOString(),
        ward: authority?.wards?.[0] || 'Municipal Ward',
        address: '[Residential Address Masked]',
        capacityLitres: authority?.pricingStructure?.capacityLitres || 6000,
      },
      authority,
      tierIndex: selectedTierIndex,
    });
  }, [activeRequest, authority, selectedTierIndex]);

  if (!isOpen || !authority) return null;

  const handlePrint = () => {
    try {
      const html = buildLetterPrintHtml(
        `Water Tanker Non-Delivery Escalation - ${authority.shortCode}`,
        letterText
      );
      const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
      const blobUrl = URL.createObjectURL(blob);
      const printWindow = window.open(blobUrl, '_blank');
      if (!printWindow) {
        alert('Please allow popups to open the printable representation letter.');
        URL.revokeObjectURL(blobUrl);
        return;
      }
      setTimeout(() => {
        try {
          printWindow.focus();
          printWindow.print();
        } catch {
          // ignore
        }
        URL.revokeObjectURL(blobUrl);
      }, 500);
    } catch {
      window.print();
    }
  };

  const selectedTier = authority.escalationMatrix?.[selectedTierIndex] || authority.escalationMatrix?.[0];
  const slaStatus = calculateSlaStatus(activeRequest?.requestDate, selectedTier?.statutorySlaHours || 24);

  return (
    <AccessibleModal
      isOpen={isOpen}
      onClose={onClose}
      title="Non-Delivery Escalation & Representation"
      subtitle={`${authority.name} • Statutory Delay Redressal`}
      maxWidth="720px"
      ariaLabel="Water tanker non-delivery escalation modal"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Delay Notice Banner */}
        <div
          style={{
            borderRadius: '0.75rem',
            border: '1px solid var(--accent, #f59e0b)',
            backgroundColor: 'rgba(245, 158, 11, 0.08)',
            padding: '1rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.75rem',
          }}
        >
          <AlertTriangle size={20} style={{ color: 'var(--accent, #f59e0b)', flexShrink: 0, marginTop: '0.1rem' }} aria-hidden="true" />
          <div style={{ fontSize: '0.85rem', color: 'var(--text, #0f172a)' }}>
            <strong>Statutory Escalation Protocol:</strong> If your requested water tanker is not dispatched within the published municipal SLA window, you are entitled under the Citizen Charter to formally escalate to the supervisory engineering wing and state grievance cell.
          </div>
        </div>

        {/* Request selector if saved requests exist */}
        {savedRequests.length > 0 && (
          <div>
            <label htmlFor="escalate-request-select" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary, #64748b)', marginBottom: '0.35rem' }}>
              Select Request to Escalate
            </label>
            <select
              id="escalate-request-select"
              value={activeRequest?.id || ''}
              onChange={(e) => setSelectedRequestId(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                borderRadius: '0.5rem',
                border: '1px solid var(--border-color, #cbd5e1)',
                backgroundColor: 'var(--surface, #ffffff)',
                fontSize: '0.875rem',
              }}
            >
              {savedRequests.map((r) => (
                <option key={r.id} value={r.id}>
                  Token: {r.bookingReference} • {r.ward} ({new Date(r.requestDate).toLocaleDateString('en-IN')})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Escalation Tiers */}
        <div>
          <span style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text, #0f172a)', marginBottom: '0.5rem' }}>
            Choose Escalation Tier
          </span>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.5rem' }}>
            {authority.escalationMatrix.map((esc, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setSelectedTierIndex(idx)}
                style={{
                  textAlign: 'left',
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  border: `2px solid ${selectedTierIndex === idx ? 'var(--primary, #2563eb)' : 'var(--border-color, #e2e8f0)'}`,
                  backgroundColor: selectedTierIndex === idx ? 'rgba(37, 99, 235, 0.05)' : 'var(--surface, #ffffff)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.25rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: selectedTierIndex === idx ? 'var(--primary, #2563eb)' : 'var(--text-secondary, #64748b)' }}>
                    Tier {esc.tier}
                  </span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary, #64748b)' }}>
                    SLA: {esc.statutorySlaHours}h
                  </span>
                </div>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text, #0f172a)' }}>
                  {esc.role}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary, #64748b)' }}>
                  {esc.authority}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Selected Tier Contact Links */}
        {selectedTier && (
          <div
            style={{
              padding: '0.75rem 1rem',
              borderRadius: '0.5rem',
              backgroundColor: 'var(--surface-raised, #f8fafc)',
              border: '1px solid var(--border-color, #e2e8f0)',
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '0.75rem',
              fontSize: '0.85rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={16} style={{ color: 'var(--primary, #2563eb)' }} aria-hidden="true" />
              <span>
                <strong>SLA Threshold:</strong> {selectedTier.statutorySlaHours} Hours ({slaStatus.label})
              </span>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              {selectedTier.phone && (
                <a
                  href={`tel:${selectedTier.phone.replace(/[^0-9+]/g, '')}`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    color: 'var(--primary, #2563eb)',
                    fontWeight: 500,
                    textDecoration: 'none',
                  }}
                >
                  <Phone size={14} aria-hidden="true" />
                  <span>{selectedTier.phone}</span>
                </a>
              )}
              {selectedTier.grievancePortalUrl && (
                <a
                  href={selectedTier.grievancePortalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    color: 'var(--primary, #2563eb)',
                    fontWeight: 500,
                    textDecoration: 'none',
                  }}
                >
                  <span>Lodge Online Grievance</span>
                  <ExternalLink size={14} aria-hidden="true" />
                </a>
              )}
            </div>
          </div>
        )}

        {/* Printable Representation Letter Preview */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text, #0f172a)' }}>
              Printable Representation Letter Preview (Address Masked)
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: 'var(--success, #16a34a)' }}>
              <ShieldCheck size={14} aria-hidden="true" />
              <span>Zero-PII Compliant</span>
            </div>
          </div>
          <pre
            style={{
              padding: '1rem',
              borderRadius: '0.5rem',
              backgroundColor: 'var(--surface-raised, #f8fafc)',
              border: '1px solid var(--border-color, #cbd5e1)',
              fontSize: '0.75rem',
              fontFamily: 'monospace',
              whiteSpace: 'pre-wrap',
              maxHeight: '220px',
              overflowY: 'auto',
              margin: 0,
              color: 'var(--text, #0f172a)',
            }}
          >
            {letterText}
          </pre>
        </div>

        {/* Modal Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.5rem', borderTop: '1px solid var(--border-color, #e2e8f0)' }}>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary"
            style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem', fontSize: '0.85rem' }}
          >
            Close
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="btn btn-primary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.5rem 1.25rem',
              borderRadius: '0.5rem',
              fontSize: '0.85rem',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            <Printer size={16} aria-hidden="true" />
            <span>Print Follow-up Letter</span>
          </button>
        </div>
      </div>
    </AccessibleModal>
  );
}
