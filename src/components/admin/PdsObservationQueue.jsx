import { useState, useEffect } from 'react';
import {
  CheckCircle2,
  XCircle,
  ExternalLink,
  Store,
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { safeHttpUrl } from '../../utils/safeContent';

export default function PdsObservationQueue() {
  const { toast } = useToast();
  const [items, setItems] = useState([
    {
      id: 'pds_obs_seed_101',
      shopId: 'delhi-fps-paharganj-101',
      shopName: 'Fair Price Shop No. 101 - Paharganj',
      observationType: 'epos_receipt',
      observationText: 'Electronic weighing scale connected to e-POS device; printed receipt issued successfully to cardholders with clear weight breakdown.',
      observedDate: '2026-02-14',
      officialSourceUrl: 'https://nfs.delhi.gov.in',
      submittedAt: '2026-02-14T08:30:00Z',
      status: 'pending_review',
      verificationSeal: 'PDS-OBS-4F12-88B1',
    },
    {
      id: 'pds_obs_seed_102',
      shopId: 'karnataka-fps-indiranagar-204',
      shopName: 'Fair Price Shop No. 204 - Indiranagar',
      observationType: 'closure_timing',
      observationText: 'Notice board displayed: shop operating 08:00 - 12:00 and 16:00 - 20:00 as per state food civil supplies gazette notification.',
      observedDate: '2026-02-15',
      officialSourceUrl: 'https://ahara.kar.nic.in',
      submittedAt: '2026-02-15T10:15:00Z',
      status: 'pending_review',
      verificationSeal: 'PDS-OBS-9A34-CC22',
    },
  ]);

  useEffect(() => {
    fetch('/api/pds-observations')
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
    toast?.success?.('PDS observation reviewed against official sources and approved.');
  };

  const handleReject = (id) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: 'rejected' } : item))
    );
    toast?.info?.('PDS observation rejected.');
  };

  const pending = items.filter((i) => i.status === 'pending_review');

  return (
    <div
      style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-main)',
        borderRadius: '1rem',
        padding: '1.5rem',
        marginTop: '1.5rem',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1rem',
          flexWrap: 'wrap',
          gap: '0.5rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Store size={20} style={{ color: 'var(--accent-main, #0284c7)' }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
            PDS Fair Price Shop Observation &amp; Correction Queue (#723)
          </h3>
        </div>
        <span
          style={{
            fontSize: '0.8rem',
            padding: '0.2rem 0.6rem',
            borderRadius: '9999px',
            backgroundColor: pending.length > 0 ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
            color: pending.length > 0 ? '#d97706' : '#10b981',
            fontWeight: 600,
          }}
        >
          {pending.length} Pending Review
        </span>
      </div>

      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
        Moderate dated citizen observations and proposed service corrections for Fair Price Shops. Verify that observations contain zero personal identifiers (no Aadhaar, no Ration Card numbers) before approving.
      </p>

      {items.length === 0 ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          No pending PDS observations in queue.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {items.map((item) => {
            const isPending = item.status === 'pending_review';
            const isApproved = item.status === 'approved';
            const safeUrl = safeHttpUrl(item.officialSourceUrl);

            return (
              <div
                key={item.id}
                style={{
                  padding: '1rem',
                  borderRadius: '0.75rem',
                  backgroundColor: 'var(--bg-secondary, #f8fafc)',
                  border: '1px solid var(--border-light, #e2e8f0)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                      {item.shopName}
                    </strong>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      Shop ID: <code>{item.shopId}</code> | Observed on: {item.observedDate}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontFamily: 'monospace',
                        padding: '0.15rem 0.5rem',
                        borderRadius: '4px',
                        backgroundColor: 'rgba(56, 189, 248, 0.15)',
                        color: 'var(--accent-main, #0284c7)',
                        fontWeight: 600,
                      }}
                    >
                      {item.verificationSeal}
                    </span>

                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        padding: '0.15rem 0.5rem',
                        borderRadius: '4px',
                        backgroundColor: isPending
                          ? 'rgba(245, 158, 11, 0.15)'
                          : isApproved
                          ? 'rgba(16, 185, 129, 0.15)'
                          : 'rgba(239, 68, 68, 0.15)',
                        color: isPending ? '#d97706' : isApproved ? '#10b981' : '#ef4444',
                      }}
                    >
                      {item.status.toUpperCase().replace('_', ' ')}
                    </span>
                  </div>
                </div>

                <div
                  style={{
                    fontSize: '0.88rem',
                    color: 'var(--text-primary)',
                    backgroundColor: 'var(--bg-surface)',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '0.5rem',
                    border: '1px solid var(--border-main)',
                  }}
                >
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent-main, #0284c7)', display: 'block', marginBottom: '0.2rem' }}>
                    Type: {item.observationType}
                  </span>
                  {item.observationText}
                </div>

                {safeUrl && (
                  <div style={{ fontSize: '0.8rem' }}>
                    <a
                      href={safeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        color: 'var(--accent-main, #0284c7)',
                        textDecoration: 'underline',
                      }}
                    >
                      <ExternalLink size={13} /> Official Source ({new URL(safeUrl).hostname})
                    </a>
                  </div>
                )}

                {isPending && (
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                    <button
                      onClick={() => handleReject(item.id)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        padding: '0.4rem 0.85rem',
                        borderRadius: '0.5rem',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        color: '#ef4444',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      <XCircle size={15} /> Reject
                    </button>

                    <button
                      onClick={() => handleApprove(item.id)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        padding: '0.4rem 0.85rem',
                        borderRadius: '0.5rem',
                        backgroundColor: '#10b981',
                        border: 'none',
                        color: '#ffffff',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      <CheckCircle2 size={15} /> Approve &amp; Verify
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
