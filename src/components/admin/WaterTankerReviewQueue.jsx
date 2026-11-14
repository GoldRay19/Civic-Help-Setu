import { useState, useEffect } from 'react';
import {
  CheckCircle2,
  XCircle,
  ExternalLink,
  Droplets,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { safeHttpUrl } from '../../utils/safeContent';

export default function WaterTankerReviewQueue() {
  const { toast } = useToast();
  const [items, setItems] = useState([
    {
      id: 'wt_seed_101',
      authorityId: 'bengaluru-bwssb-south',
      ward: 'Ward 176 - BTM Layout',
      reportType: 'tariff_overcharge',
      details: 'Private contractor operating under BWSSB nodal registration quoted ₹950 for 6kL tanker delivery instead of the statutory ₹600 ceiling. Requires rate card enforcement.',
      officialSourceUrl: 'https://bwssb.karnataka.gov.in/tariff-notification',
      status: 'pending_review',
      submittedAt: '2026-03-02T11:20:00Z',
      seal: 'WT-REP-5F12-88B1',
    },
    {
      id: 'wt_seed_102',
      authorityId: 'delhi-djb-central',
      ward: 'Ward 79 - Pahar Ganj',
      reportType: 'booking_channel_broken',
      details: 'Jhandewalan depot telephone line 011-23538495 reports fast busy during daytime hours. RMS online portal operational.',
      officialSourceUrl: 'https://delhijalboard.delhi.gov.in/contact-us',
      status: 'pending_review',
      submittedAt: '2026-03-03T09:45:00Z',
      seal: 'WT-REP-2A88-11C4',
    },
  ]);

  useEffect(() => {
    fetch('/api/water-tanker-reports')
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
        // Fallback to initial seed items
      });
  }, []);

  const handleAction = (id, newStatus) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
    );
    if (newStatus === 'approved') {
      toast?.success?.('Report approved: Data verified against municipal gazette.');
    } else {
      toast?.info?.('Report flagged/rejected: Claim marked unverifiable.');
    }
  };

  const pendingItems = items.filter((i) => i.status === 'pending_review');

  return (
    <div
      role="region"
      aria-label="Water Tanker Citizen Observation Queue"
      style={{
        borderRadius: '0.75rem',
        border: '1px solid var(--border-color, #e2e8f0)',
        backgroundColor: 'var(--surface, #ffffff)',
        padding: '1.25rem',
        marginTop: '1.5rem',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div
            style={{
              width: '2rem',
              height: '2rem',
              borderRadius: '0.375rem',
              backgroundColor: 'rgba(37, 99, 235, 0.1)',
              color: 'var(--primary, #2563eb)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Droplets size={16} aria-hidden="true" />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: 'var(--text, #0f172a)' }}>
              Water Tanker Citizen Inaccuracies &amp; Reports Queue
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary, #64748b)' }}>
              Community disclosures regarding statutory tariff overcharging, broken booking channels, and dry areas.
            </span>
          </div>
        </div>

        <span
          style={{
            fontSize: '0.75rem',
            fontWeight: 600,
            padding: '0.2rem 0.6rem',
            borderRadius: '999px',
            backgroundColor: pendingItems.length > 0 ? 'rgba(245, 158, 11, 0.1)' : 'rgba(22, 163, 74, 0.1)',
            color: pendingItems.length > 0 ? 'var(--accent, #d97706)' : 'var(--success, #16a34a)',
          }}
        >
          {pendingItems.length} Pending Review
        </span>
      </div>

      {items.length === 0 ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary, #64748b)', fontSize: '0.85rem' }}>
          No citizen water-tanker reports currently in queue.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {items.map((item) => (
            <div
              key={item.id}
              style={{
                borderRadius: '0.5rem',
                border: '1px solid var(--border-color, #e2e8f0)',
                backgroundColor: 'var(--surface-raised, #f8fafc)',
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text, #0f172a)' }}>
                      {item.authorityId}
                    </span>
                    <span
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        padding: '0.1rem 0.45rem',
                        borderRadius: '0.25rem',
                        backgroundColor: 'rgba(37, 99, 235, 0.1)',
                        color: 'var(--primary, #2563eb)',
                      }}
                    >
                      {item.reportType.replace(/_/g, ' ')}
                    </span>
                    {item.seal && (
                      <span style={{ fontSize: '0.7rem', fontFamily: 'monospace', color: 'var(--text-secondary, #64748b)' }}>
                        Seal: {item.seal}
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary, #64748b)' }}>
                    Ward: {item.ward} • Submitted: {new Date(item.submittedAt).toLocaleDateString('en-IN')}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {item.status === 'pending_review' ? (
                    <>
                      <button
                        type="button"
                        onClick={() => handleAction(item.id, 'approved')}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          padding: '0.35rem 0.65rem',
                          borderRadius: '0.375rem',
                          border: '1px solid var(--success, #16a34a)',
                          backgroundColor: 'rgba(22, 163, 74, 0.08)',
                          color: 'var(--success, #16a34a)',
                          fontSize: '0.75rem',
                          fontWeight: 500,
                          cursor: 'pointer',
                        }}
                      >
                        <CheckCircle2 size={13} aria-hidden="true" />
                        <span>Verify &amp; Approve</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAction(item.id, 'rejected')}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          padding: '0.35rem 0.65rem',
                          borderRadius: '0.375rem',
                          border: '1px solid var(--danger, #dc2626)',
                          backgroundColor: 'rgba(239, 68, 68, 0.08)',
                          color: 'var(--danger, #dc2626)',
                          fontSize: '0.75rem',
                          fontWeight: 500,
                          cursor: 'pointer',
                        }}
                      >
                        <XCircle size={13} aria-hidden="true" />
                        <span>Reject</span>
                      </button>
                    </>
                  ) : (
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        padding: '0.15rem 0.5rem',
                        borderRadius: '999px',
                        backgroundColor: item.status === 'approved' ? 'rgba(22, 163, 74, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        color: item.status === 'approved' ? 'var(--success, #16a34a)' : 'var(--danger, #dc2626)',
                        textTransform: 'capitalize',
                      }}
                    >
                      {item.status}
                    </span>
                  )}
                </div>
              </div>

              <p style={{ margin: 0, fontSize: '0.825rem', color: 'var(--text, #0f172a)', lineHeight: 1.45 }}>
                {item.details}
              </p>

              {item.officialSourceUrl && safeHttpUrl(item.officialSourceUrl) && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <ExternalLink size={12} style={{ color: 'var(--primary, #2563eb)' }} aria-hidden="true" />
                  <a
                    href={safeHttpUrl(item.officialSourceUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: '0.75rem', color: 'var(--primary, #2563eb)', textDecoration: 'none' }}
                  >
                    View Official Verification Source
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

