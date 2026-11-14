import { useState, useEffect } from 'react';
import {
  CheckCircle2,
  XCircle,
  ExternalLink,
  ClipboardList,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { safeHttpUrl } from '../../utils/safeContent';

export default function RentalCorrectionQueue() {
  const { toast } = useToast();
  const [items, setItems] = useState([
    {
      id: 'sub_seed_rc_01',
      transitionId: 'bescom-move-in-meter-recording',
      proposedDetails: 'BESCOM has integrated online Form-6 meter reading intimation via Seva Sindhu 2.0 portal for tenants.',
      officialSourceUrl: 'https://bescom.karnataka.gov.in/sevasindhu-tenant-meter',
      submittedAt: '2026-02-12T09:30:00Z',
      status: 'pending_review',
      seal: 'RC-CORR-2B14-8E42',
    },
    {
      id: 'sub_seed_rc_02',
      transitionId: 'uidai-rent-agreement-address-update',
      proposedDetails: 'UIDAI has issued circular permitting registered 11-month electronic e-lease agreements with digilocker verification for address change.',
      officialSourceUrl: 'https://uidai.gov.in/circulars/registered-rent-agreement-guidelines-2026',
      submittedAt: '2026-02-13T11:45:00Z',
      status: 'pending_review',
      seal: 'RC-CORR-5C77-31DA',
    },
  ]);

  useEffect(() => {
    fetch('/api/rental-checklist-corrections')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && Array.isArray(data.items) && data.items.length > 0) {
          setItems((prev) => {
            const existingIds = new Set(prev.map((i) => i.id));
            const newItems = data.items.filter((i) => !existingIds.has(i.id));
            return [...newItems, ...prev];
          });
        }
      })
      .catch(() => {
        // Fallback to initial seeds
      });
  }, []);

  const handleApprove = (id) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: 'approved' } : item))
    );
    toast?.success?.('Rental transition correction verified against official source and approved.');
  };

  const handleReject = (id) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: 'rejected' } : item))
    );
    toast?.error?.('Rental transition correction rejected (unverified official link or invalid claim).');
  };

  return (
    <div className="rental-correction-queue-panel animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ClipboardList size={22} color="var(--accent-main)" />
            Rental Move-In/Out Civic Corrections Review Queue
          </h2>
          <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Review community-submitted utility meter rules, police tenant intimation updates, and official portal URLs before landing in the public directory.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          <span style={{ padding: '0.25rem 0.65rem', background: 'var(--bg-surface)', border: '1px solid var(--border-main)', borderRadius: '1rem', fontWeight: '600' }}>
            Pending: {items.filter((i) => i.status === 'pending_review').length}
          </span>
        </div>
      </div>

      {items.length === 0 ? (
        <div style={{ padding: '2.5rem', textAlign: 'center', background: 'var(--bg-surface)', border: '1px dashed var(--border-main)', borderRadius: '0.75rem', color: 'var(--text-secondary)' }}>
          <CheckCircle2 size={36} color="var(--accent-main)" style={{ margin: '0 auto 0.75rem auto' }} />
          <p style={{ margin: 0, fontWeight: '600' }}>Review queue is clear.</p>
          <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem' }}>No pending rental transition corrections require moderation.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {items.map((item) => {
            const isPending = item.status === 'pending_review';
            const isApproved = item.status === 'approved';
            const isRejected = item.status === 'rejected';

            return (
              <div
                key={item.id}
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-main)',
                  borderRadius: '0.75rem',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: 'monospace', fontWeight: '700', fontSize: '0.85rem', color: 'var(--accent-main)' }}>
                      {item.transitionId}
                    </span>
                    <span style={{ fontSize: '0.75rem', padding: '0.15rem 0.5rem', borderRadius: '0.35rem', background: 'var(--bg-main)', color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                      <ShieldCheck size={12} />
                      Seal: {item.seal}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Clock size={12} />
                      {new Date(item.submittedAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div>
                    {isPending && (
                      <span style={{ padding: '0.2rem 0.6rem', borderRadius: '0.4rem', fontSize: '0.75rem', fontWeight: '600', background: 'rgba(234, 179, 8, 0.15)', color: '#ca8a04' }}>
                        Pending Verification
                      </span>
                    )}
                    {isApproved && (
                      <span style={{ padding: '0.2rem 0.6rem', borderRadius: '0.4rem', fontSize: '0.75rem', fontWeight: '600', background: 'rgba(34, 197, 94, 0.15)', color: '#16a34a' }}>
                        Approved
                      </span>
                    )}
                    {isRejected && (
                      <span style={{ padding: '0.2rem 0.6rem', borderRadius: '0.4rem', fontSize: '0.75rem', fontWeight: '600', background: 'rgba(239, 68, 68, 0.15)', color: '#dc2626' }}>
                        Rejected
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ background: 'var(--bg-main)', padding: '0.85rem', borderRadius: '0.5rem', border: '1px solid var(--border-main)', fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                  {item.proposedDetails}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', paddingTop: '0.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Official Source:</span>
                    <a
                      href={safeHttpUrl(item.officialSourceUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: '0.8rem', color: 'var(--accent-main)', textDecoration: 'underline', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', wordBreak: 'break-all' }}
                    >
                      {item.officialSourceUrl}
                      <ExternalLink size={12} />
                    </a>
                  </div>

                  {isPending && (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        type="button"
                        onClick={() => handleReject(item.id)}
                        className="btn btn--outline"
                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: '#dc2626', borderColor: '#fca5a5' }}
                      >
                        <XCircle size={14} />
                        Reject
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApprove(item.id)}
                        className="btn btn--primary"
                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                      >
                        <CheckCircle2 size={14} />
                        Verify & Approve
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
