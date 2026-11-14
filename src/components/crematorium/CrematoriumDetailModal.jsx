import AccessibleModal from '../common/AccessibleModal';
import {
  ExternalLink,
  Clock,
  ShieldCheck,
  FileText,
  AlertCircle,
  Building2,
} from 'lucide-react';
import { FACILITY_TYPE_LABELS } from '../../data/crematoriumContract';
import { REQUIREMENT_LABELS } from '../../services/requirementTypes';
import { safeHttpUrl } from '../../utils/safeContent';

export default function CrematoriumDetailModal({
  isOpen,
  onClose,
  facility,
  onOpenChecklist,
}) {
  if (!facility) return null;

  const typeLabel = FACILITY_TYPE_LABELS[facility.facilityType] || 'Public Facility';
  const portalUrl = safeHttpUrl(facility.officialContact?.portalUrl);
  const sourceUrl = safeHttpUrl(facility.auditMetadata?.sourceUrl);

  return (
    <AccessibleModal
      isOpen={isOpen}
      onClose={onClose}
      title={facility.name}
      subtitle={`${typeLabel} • Managed by ${facility.managingAuthority}`}
      maxWidth="680px"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Important Bereavement Notice */}
        <div
          style={{
            backgroundColor: 'rgba(245, 158, 11, 0.08)',
            border: '1px solid rgba(245, 158, 11, 0.25)',
            borderRadius: '0.75rem',
            padding: '0.75rem 1rem',
            fontSize: '0.85rem',
            color: 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.5rem',
          }}
        >
          <AlertCircle size={18} style={{ color: 'var(--warning, #f59e0b)', flexShrink: 0, marginTop: '2px' }} />
          <div>
            <strong style={{ color: 'var(--text-primary)' }}>Live Availability Disclaimer:</strong> Civic Help Setu does not track live furnace slots or real-time booking queues. Please contact the municipal authority or facility counter directly upon arrival.
          </div>
        </div>

        {/* Location & Contacts */}
        <section style={{ backgroundColor: 'var(--bg-main)', padding: '1rem', borderRadius: '0.75rem', border: '1px solid var(--border-light)' }}>
          <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Building2 size={16} /> Facility & Authority Contact
          </h4>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            <strong>Address:</strong> {facility.address}, {facility.district}, {facility.state} - {facility.pincode}
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', fontSize: '0.85rem' }}>
            <div>
              <strong>Official Phone:</strong>{' '}
              {facility.officialContact?.phone?.map((ph, idx) => (
                <a key={idx} href={`tel:${ph.replace(/\s+/g, '')}`} style={{ color: 'var(--accent-main)', textDecoration: 'underline', marginRight: '0.5rem' }}>
                  {ph}
                </a>
              ))}
            </div>
            {portalUrl && (
              <div>
                <a href={portalUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-main)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', textDecoration: 'underline' }}>
                  Official Portal <ExternalLink size={13} />
                </a>
              </div>
            )}
          </div>
        </section>

        {/* Operating Hours & Out of Hours */}
        <section>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Clock size={16} /> Operating Hours & Night Intake
          </h4>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <div><strong>Hours:</strong> {facility.operatingHours?.hours || 'Operating hours not officially published.'}</div>
            <div>
              <strong>Out-of-Hours Support:</strong>{' '}
              {facility.operatingHours?.outOfHoursServices
                ? `Supported (${facility.operatingHours?.outOfHoursNotes || 'Emergency staff on duty for night admission'})`
                : 'No night admissions published by authority.'}
            </div>
          </div>
        </section>

        {/* Official Booking Procedures (Separated from Editorial Guidance) */}
        <section>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <FileText size={16} /> Official Admission & Booking Procedures
          </h4>
          {Array.isArray(facility.bookingProcedures) && facility.bookingProcedures.length > 0 ? (
            <ol style={{ paddingLeft: '1.25rem', margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {facility.bookingProcedures.map((step, idx) => (
                <li key={idx}>
                  <strong style={{ color: 'var(--text-primary)' }}>{step.title}:</strong> {step.description}
                </li>
              ))}
            </ol>
          ) : (
            <p style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
              No online pre-booking procedure published by authority. Direct counter intimation upon arrival is required.
            </p>
          )}
        </section>

        {/* Statutory Charges & Fees */}
        <section>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            Statutory Municipal Charges
          </h4>
          {facility.statutoryCharges?.isFree ? (
            <div style={{ padding: '0.75rem', backgroundColor: 'rgba(22, 163, 74, 0.1)', color: 'var(--success, #16a34a)', borderRadius: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>
              ✓ Free Public Municipal Service (Subsidized by Local Body)
            </div>
          ) : Array.isArray(facility.statutoryCharges?.feeSchedule) && facility.statutoryCharges.feeSchedule.length > 0 ? (
            <div style={{ border: '1px solid var(--border-light)', borderRadius: '0.5rem', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
                <thead style={{ backgroundColor: 'var(--bg-main)', borderBottom: '1px solid var(--border-light)' }}>
                  <tr>
                    <th style={{ padding: '0.5rem 0.75rem' }}>Item / Service</th>
                    <th style={{ padding: '0.5rem 0.75rem' }}>Statutory Fee</th>
                    <th style={{ padding: '0.5rem 0.75rem' }}>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {facility.statutoryCharges.feeSchedule.map((fee, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--border-light)' }}>
                      <td style={{ padding: '0.5rem 0.75rem', color: 'var(--text-primary)' }}>{fee.item}</td>
                      <td style={{ padding: '0.5rem 0.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>₹{fee.amount}</td>
                      <td style={{ padding: '0.5rem 0.75rem', color: 'var(--text-secondary)' }}>{fee.notes || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
              Official statutory fee schedule is unavailable from published records. Please verify directly with the municipal registrar at the facility.
            </p>
          )}
        </section>

        {/* Required Documents */}
        <section>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            Required Documents & Statutory Proofs
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {Array.isArray(facility.requiredDocuments) && facility.requiredDocuments.length > 0 ? (
              facility.requiredDocuments.map((doc, idx) => {
                const badgeColor =
                  doc.type === 'required' ? 'rgba(22, 163, 74, 0.15)' :
                  doc.type === 'conditional' ? 'rgba(56, 189, 248, 0.15)' :
                  doc.type === 'optional' ? 'rgba(147, 51, 234, 0.15)' : 'rgba(148, 163, 184, 0.2)';
                const textColor =
                  doc.type === 'required' ? 'var(--success, #16a34a)' :
                  doc.type === 'conditional' ? 'var(--accent-main, #0284c7)' :
                  doc.type === 'optional' ? '#9333ea' : 'var(--text-tertiary)';

                return (
                  <div
                    key={idx}
                    style={{
                      padding: '0.6rem 0.75rem',
                      backgroundColor: 'var(--bg-main)',
                      borderRadius: '0.5rem',
                      border: '1px solid var(--border-light)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.2rem',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{doc.name}</span>
                      <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: '4px', backgroundColor: badgeColor, color: textColor, fontWeight: 600 }}>
                        {REQUIREMENT_LABELS[doc.type] || 'Unverified'}
                      </span>
                    </div>
                    {doc.condition && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Condition: {doc.condition}</span>
                    )}
                  </div>
                );
              })
            ) : (
              <p style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)' }}>No custom document rules verified. Standard Hospital Medical Death Certificate (Form 4/4A) applies.</p>
            )}
          </div>
        </section>

        {/* Data Provenance & Official Source */}
        <section style={{ borderTop: '1px solid var(--border-light)', paddingTop: '1rem', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
            <ShieldCheck size={14} style={{ color: 'var(--success, #16a34a)' }} />
            <strong>Official Source & Audit Provenance:</strong>
          </div>
          <div>
            Verified by {facility.auditMetadata?.verifiedBy || 'Civic Operations'} on {facility.auditMetadata?.lastVerified || 'Pending'}.{' '}
            {sourceUrl && (
              <a href={sourceUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-main)', textDecoration: 'underline' }}>
                View Official Municipal Publication <ExternalLink size={11} style={{ display: 'inline' }} />
              </a>
            )}
          </div>
        </section>

        {/* Modal Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '0.6rem 1.25rem',
              backgroundColor: 'var(--bg-main)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-main)',
              borderRadius: '0.5rem',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
            }}
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenChecklist(facility);
            }}
            style={{
              padding: '0.6rem 1.25rem',
              backgroundColor: 'var(--accent-main)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '0.5rem',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
            }}
          >
            Open Preparation Checklist
          </button>
        </div>
      </div>
    </AccessibleModal>
  );
}
