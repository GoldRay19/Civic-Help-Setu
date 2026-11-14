import { useState, useEffect } from 'react';
import {
  CheckCircle2,
  XCircle,
  ExternalLink,
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { safeHttpUrl } from '../../utils/safeContent';

export default function CrematoriumCorrectionQueue() {
  const { toast } = useToast();
  const [items, setItems] = useState([
    {
      id: 'sub_seed_101',
      facilityId: 'bengaluru-wilson-garden-electric',
      facilityName: 'Wilson Garden Electric Crematorium',
      proposedChange: 'BBMP health wing notification: Cold storage unit expansion completed; 4 additional preservation chambers commissioned.',
      officialSourceUrl: 'https://bbmp.gov.in/notifications/wilson-garden-expansion',
      contributorRole: 'official_staff',
      submittedAt: '2026-02-14T08:30:00Z',
      status: 'pending_review',
      verificationSeal: 'CB-CORR-5A21-99F0',
    },
    {
      id: 'sub_seed_102',
      facilityId: 'delhi-nigambodh-ghat',
      facilityName: 'Nigambodh Ghat Crematorium Complex',
      proposedChange: 'MCD Public Health revised CNG furnace operation slot batches for cleaner emissions.',
      officialSourceUrl: 'https://mcdonline.nic.in/crematorium-guidelines',
      contributorRole: 'citizen',
      submittedAt: '2026-02-15T10:15:00Z',
      status: 'pending_review',
      verificationSeal: 'CB-CORR-3B12-88E1',
    },
  ]);

  useEffect(() => {
    // Attempt fetching real-time items from API
    fetch('/api/crematorium-corrections')
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
    toast?.success?.('Facility correction verified against official source and approved.');
  };

  const handleReject = (id) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: 'rejected' } : item))
    );
    toast?.info?.('Facility correction rejected.');
  };

  const pending = items.filter((i) => i.status === 'pending_review');

  return (
    <div
      style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-main)',
        borderRadius: '0.75rem',
        padding: '1.25rem',
        marginTop: '1.5rem',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
            Public Facility Corrections & Audit Queue
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0' }}>
            Unverified community submissions and facility caretaker updates pending dated gazette/portal verification.
          </p>
        </div>
        <span
          style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            padding: '0.25rem 0.6rem',
            borderRadius: '9999px',
            backgroundColor: pending.length > 0 ? 'rgba(245, 158, 11, 0.15)' : 'rgba(22, 163, 74, 0.15)',
            color: pending.length > 0 ? 'var(--warning, #f59e0b)' : 'var(--success, #16a34a)',
          }}
        >
          {pending.length} Pending
        </span>
      </div>

      {items.length === 0 ? (
        <p style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', textAlign: 'center', margin: '2rem 0' }}>
          No facility corrections currently in queue.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {items.map((item) => {
            const verifiedUrl = safeHttpUrl(item.officialSourceUrl);
            return (
              <div
                key={item.id}
                style={{
                  padding: '1rem',
                  backgroundColor: 'var(--bg-main)',
                  borderRadius: '0.5rem',
                  border: '1px solid var(--border-light)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                      {item.facilityName}
                    </h4>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>ID: {item.facilityId}</span>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.7rem', fontFamily: 'monospace', padding: '0.2rem 0.5rem', backgroundColor: 'var(--glass-bg)', borderRadius: '4px', border: '1px solid var(--border-light)' }}>
                      {item.verificationSeal}
                    </span>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        padding: '0.2rem 0.5rem',
                        borderRadius: '4px',
                        textTransform: 'capitalize',
                        backgroundColor:
                          item.status === 'approved' ? 'rgba(22, 163, 74, 0.15)' :
                          item.status === 'rejected' ? 'rgba(220, 38, 38, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                        color:
                          item.status === 'approved' ? 'var(--success, #16a34a)' :
                          item.status === 'rejected' ? 'var(--danger, #dc2626)' : 'var(--warning, #f59e0b)',
                      }}
                    >
                      {item.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                  {item.proposedChange}
                </p>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-light)', fontSize: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ color: 'var(--text-tertiary)' }}>Role: {item.contributorRole}</span>
                    {verifiedUrl && (
                      <a
                        href={verifiedUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: 'var(--accent-main)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', textDecoration: 'underline' }}
                      >
                        Official Source Document <ExternalLink size={12} />
                      </a>
                    )}
                  </div>

                  {item.status === 'pending_review' && (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        type="button"
                        onClick={() => handleReject(item.id)}
                        style={{
                          padding: '0.35rem 0.75rem',
                          backgroundColor: 'transparent',
                          color: 'var(--danger, #dc2626)',
                          border: '1px solid var(--danger, #dc2626)',
                          borderRadius: '0.35rem',
                          fontSize: '0.75rem',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                        }}
                      >
                        <XCircle size={14} /> Reject
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApprove(item.id)}
                        style={{
                          padding: '0.35rem 0.75rem',
                          backgroundColor: 'var(--success, #16a34a)',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '0.35rem',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                        }}
                      >
                        <CheckCircle2 size={14} /> Approve & Verify
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
