import AccessibleModal from '../common/AccessibleModal';
import {
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Building2,
  Users,
  CalendarClock,
  Banknote,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { FACILITY_TYPE_LABELS } from '../../data/communityFacilityContract';
import { REQUIREMENT_LABELS } from '../../services/requirementTypes';
import { safeHttpUrl } from '../../utils/safeContent';

export default function FacilityDetailModal({
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
        {/* Important Live Availability Disclaimer Notice */}
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
            <strong style={{ color: 'var(--text-primary)' }}>Live Availability Notice:</strong> Civic Help Setu does not track live booking slots or real-time calendar availability. Links are provided to official booking channels and desks. Do not make non-refundable event arrangements until confirmed by the managing municipal body.
          </div>
        </div>

        {/* Location & Authority Contact */}
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
                  Official Municipal Portal <ExternalLink size={13} />
                </a>
              </div>
            )}
          </div>
          {facility.officialContact?.bookingDeskLocation && (
            <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginTop: '0.5rem', marginBottom: 0 }}>
              <strong>In-Person Civic Desk:</strong> {facility.officialContact.bookingDeskLocation}
            </p>
          )}
        </section>

        {/* Capacity, Lead Times & Operating Hours */}
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
          <div style={{ backgroundColor: 'var(--bg-main)', padding: '0.85rem', borderRadius: '0.5rem', border: '1px solid var(--border-light)' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.25rem' }}>
              <Users size={14} /> Capacity Metrics
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              Total: {facility.capacity?.total?.toLocaleString()} attendees
            </div>
            {facility.capacity?.seated !== null && (
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Seated: {facility.capacity?.seated?.toLocaleString()} seats
              </div>
            )}
            {facility.capacity?.notes && (
              <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '0.25rem' }}>
                {facility.capacity.notes}
              </div>
            )}
          </div>

          <div style={{ backgroundColor: 'var(--bg-main)', padding: '0.85rem', borderRadius: '0.5rem', border: '1px solid var(--border-light)' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.25rem' }}>
              <CalendarClock size={14} /> Application Lead Times
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              Min {facility.leadTimes?.minLeadDays} days in advance
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Booking window: up to {facility.leadTimes?.maxAdvanceDays} days ahead
            </div>
            {facility.leadTimes?.noticeNotes && (
              <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '0.25rem' }}>
                {facility.leadTimes.noticeNotes}
              </div>
            )}
          </div>
        </section>

        {/* Permitted vs Prohibited Activities */}
        <section>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            Permitted & Prohibited Activities
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.75rem' }}>
            <div style={{ backgroundColor: 'rgba(22, 163, 74, 0.05)', border: '1px solid rgba(22, 163, 74, 0.2)', padding: '0.75rem', borderRadius: '0.5rem' }}>
              <div style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--success, #16a34a)', display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.4rem' }}>
                <CheckCircle2 size={14} /> Permitted Uses
              </div>
              <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                {facility.permittedActivities?.map((act, idx) => (
                  <li key={idx} style={{ marginBottom: '0.2rem' }}>{act}</li>
                ))}
              </ul>
            </div>

            <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '0.75rem', borderRadius: '0.5rem' }}>
              <div style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--danger, #dc2626)', display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.4rem' }}>
                <XCircle size={14} /> Strictly Prohibited
              </div>
              <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                {facility.prohibitedActivities?.map((act, idx) => (
                  <li key={idx} style={{ marginBottom: '0.2rem' }}>{act}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Financial Separation: Booking Charges, Refundable Deposits, and Cancellation Rules */}
        <section>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Banknote size={16} /> Tariffs, Security Deposit & Cancellation Rules
          </h4>

          {/* 1. Booking Charges */}
          <div style={{ marginBottom: '0.75rem' }}>
            <strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)', display: 'block', marginBottom: '0.3rem' }}>
              1. Statutory Rental Tariffs:
            </strong>
            {facility.statutoryCharges?.isFree ? (
              <div style={{ padding: '0.6rem', backgroundColor: 'rgba(22, 163, 74, 0.1)', color: 'var(--success, #16a34a)', borderRadius: '0.5rem', fontSize: '0.85rem', fontWeight: 600 }}>
                ✓ Subsidized Free Public Municipal Facility
              </div>
            ) : Array.isArray(facility.statutoryCharges?.feeSchedule) && facility.statutoryCharges.feeSchedule.length > 0 ? (
              <div style={{ border: '1px solid var(--border-light)', borderRadius: '0.5rem', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
                  <thead style={{ backgroundColor: 'var(--bg-main)', borderBottom: '1px solid var(--border-light)' }}>
                    <tr>
                      <th style={{ padding: '0.4rem 0.6rem' }}>Shift / Category</th>
                      <th style={{ padding: '0.4rem 0.6rem' }}>Tariff</th>
                      <th style={{ padding: '0.4rem 0.6rem' }}>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {facility.statutoryCharges.feeSchedule.map((fee, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid var(--border-light)' }}>
                        <td style={{ padding: '0.4rem 0.6rem', color: 'var(--text-primary)' }}>{fee.slotOrCategory}</td>
                        <td style={{ padding: '0.4rem 0.6rem', fontWeight: 600, color: 'var(--text-primary)' }}>₹{fee.tariff?.toLocaleString()}</td>
                        <td style={{ padding: '0.4rem 0.6rem', color: 'var(--text-secondary)' }}>{fee.notes || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', fontStyle: 'italic', margin: 0 }}>
                Tariff schedule is unavailable in published gazette. Please verify at local ward office.
              </p>
            )}
          </div>

          {/* 2. Refundable Security Deposit */}
          <div style={{ marginBottom: '0.75rem', padding: '0.75rem', backgroundColor: 'var(--bg-main)', borderRadius: '0.5rem', border: '1px solid var(--border-light)' }}>
            <strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)', display: 'block', marginBottom: '0.25rem' }}>
              2. Refundable Security Deposit:
            </strong>
            {facility.securityDeposit?.required ? (
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <div>
                  <strong>Amount:</strong> {facility.securityDeposit.amount !== null ? `₹${facility.securityDeposit.amount.toLocaleString()}` : 'Variable (Assessed by municipal engineer post layout plan review)'}
                </div>
                <div><strong>Refund Timeline:</strong> {facility.securityDeposit.refundTimeline || 'Post inspection'}</div>
                {facility.securityDeposit.forfeitureConditions && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '0.2rem' }}>
                    <strong>Forfeiture Conditions:</strong> {facility.securityDeposit.forfeitureConditions}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                {facility.securityDeposit === null
                  ? '⚠️ Security deposit terms unavailable from official municipal source.'
                  : 'No security deposit required for this facility.'}
              </div>
            )}
          </div>

          {/* 3. Cancellation & Refund Rules */}
          <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-main)', borderRadius: '0.5rem', border: '1px solid var(--border-light)' }}>
            <strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)', display: 'block', marginBottom: '0.25rem' }}>
              3. Cancellation & Refund Schedule:
            </strong>
            {facility.cancellationPolicy?.isAvailable && Array.isArray(facility.cancellationPolicy.rules) ? (
              <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                {facility.cancellationPolicy.rules.map((rule, idx) => (
                  <li key={idx} style={{ marginBottom: '0.25rem' }}>
                    <strong style={{ color: 'var(--text-primary)' }}>{rule.timeline}:</strong> {rule.refundPercentage}% refund ({rule.deductionNotes || 'Deductions apply'})
                  </li>
                ))}
              </ul>
            ) : (
              <div style={{ fontSize: '0.85rem', color: 'var(--warning, #f59e0b)', fontStyle: 'italic' }}>
                ⚠️ Official cancellation schedule is unpublished for this facility. Refunds are determined manually by the municipal commissioner on a case-by-case basis.
              </div>
            )}
          </div>
        </section>

        {/* Statutory Event Permits & Documents */}
        <section>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            Statutory Event Permits & Approvals
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {Array.isArray(facility.eventPermits) && facility.eventPermits.length > 0 ? (
              facility.eventPermits.map((permit, idx) => {
                const badgeColor =
                  permit.type === 'required' ? 'rgba(22, 163, 74, 0.15)' :
                  permit.type === 'conditional' ? 'rgba(56, 189, 248, 0.15)' :
                  permit.type === 'optional' ? 'rgba(147, 51, 234, 0.15)' : 'rgba(148, 163, 184, 0.2)';
                const textColor =
                  permit.type === 'required' ? 'var(--success, #16a34a)' :
                  permit.type === 'conditional' ? 'var(--accent-main, #0284c7)' :
                  permit.type === 'optional' ? '#9333ea' : 'var(--text-tertiary)';

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
                      <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{permit.name}</span>
                      <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: '4px', backgroundColor: badgeColor, color: textColor, fontWeight: 600 }}>
                        {REQUIREMENT_LABELS[permit.type] || 'Unverified'}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      <strong>Issuing Authority:</strong> {permit.authority}
                    </div>
                    {permit.condition && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--accent-main)' }}>
                        <strong>Trigger Condition:</strong> {permit.condition}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>No custom event permits published. Standard municipal health and safety bylaws apply.</p>
            )}
          </div>
        </section>

        {/* Data Provenance & Official Source */}
        <section style={{ borderTop: '1px solid var(--border-light)', paddingTop: '1rem', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
            <ShieldCheck size={14} style={{ color: 'var(--success, #16a34a)' }} />
            <strong>Official Municipal Source & Audit Provenance:</strong>
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
