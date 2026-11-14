import { useState, useEffect } from 'react';
import {
  CheckCircle2,
  XCircle,
  ExternalLink,
  Building2,
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { safeHttpUrl } from '../../utils/safeContent';

export default function CommunityFacilityCorrectionQueue() {
  const { toast } = useToast();
  const [items, setItems] = useState([
    {
      id: 'sub_cf_seed_101',
      facilityId: 'delhi-mcd-civic-centre-auditorium',
      facilityName: 'Dr. S.P. Mukherjee Civic Centre Auditorium',
      proposedChange: 'MCD Public Works circular: Balcony HVAC overhaul completed; morning shift tariff now includes centralized sound console.',
      officialSourceUrl: 'https://mcdonline.nic.in/public-notices/civic-centre-upgrade',
      contributorRole: 'official_staff',
      submittedAt: '2026-02-14T09:30:00Z',
      status: 'pending_review',
      verificationSeal: 'CF-CORR-4A12-98E0',
    },
    {
      id: 'sub_cf_seed_102',
      facilityId: 'bengaluru-bbmp-sir-puttanna-chettiar-town-hall',
      facilityName: 'Sir Puttanna Chettiar Town Hall',
      proposedChange: 'BBMP Cultural Department updated concession quota guidelines for folk drama academies.',
      officialSourceUrl: 'https://bbmp.gov.in/notifications/townhall-concession',
      contributorRole: 'citizen',
      submittedAt: '2026-02-15T11:20:00Z',
      status: 'pending_review',
      verificationSeal: 'CF-CORR-2C89-77B4',
    },
  ]);

  useEffect(() => {
    fetch('/api/community-facility-corrections')
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
    toast?.success?.('Community facility correction verified against official source and approved.');
  };

  const handleReject = (id) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: 'rejected' } : item))
    );
    toast?.info?.('Submission rejected due to lack of verifiable official government notice.');
  };

  const pendingItems = items.filter((i) => i.status === 'pending_review');

  return (
    <div
      style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-main)',
        borderRadius: '1rem',
        padding: '1.5rem',
        marginTop: '2rem',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Building2 size={18} /> Community Facility Corrections & Audit Queue
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0' }}>
            Review citizen and municipal caretaker submitted rule updates against dated official sources.
          </p>
        </div>
        <span
          style={{
            fontSize: '0.8rem',
            padding: '0.25rem 0.6rem',
            borderRadius: '9999px',
            backgroundColor: pendingItems.length > 0 ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
            color: pendingItems.length > 0 ? 'var(--warning, #f59e0b)' : 'var(--success, #16a34a)',
            fontWeight: 600,
          }}
        >
          {pendingItems.length} Pending Verification
        </span>
      </div>

      {items.length === 0 ? (
        <p style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', textAlign: 'center', padding: '2rem 0' }}>
          No pending facility updates in queue.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {items.map((item) => {
            const isPending = item.status === 'pending_review';
            const validSourceUrl = safeHttpUrl(item.officialSourceUrl);

            return (
              <div
                key={item.id}
                style={{
                  backgroundColor: 'var(--bg-main)',
                  border: '1px solid var(--border-light)',
                  borderRadius: '0.75rem',
                  padding: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.6rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                      {item.facilityName}
                    </strong>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '0.15rem' }}>
                      ID: {item.facilityId} • Role: {item.contributorRole} • Submitted: {new Date(item.submittedAt).toLocaleDateString()}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontFamily: 'monospace',
                        padding: '0.15rem 0.4rem',
                        borderRadius: '4px',
                        backgroundColor: 'var(--bg-surface)',
                        border: '1px solid var(--border-main)',
                        color: 'var(--accent-main)',
                      }}
                    >
                      {item.verificationSeal}
                    </span>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        padding: '0.2rem 0.5rem',
                        borderRadius: '4px',
                        backgroundColor:
                          item.status === 'approved' ? 'rgba(16, 185, 129, 0.1)' :
                          item.status === 'rejected' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                        color:
                          item.status === 'approved' ? 'var(--success, #16a34a)' :
                          item.status === 'rejected' ? 'var(--danger, #dc2626)' : 'var(--warning, #f59e0b)',
                      }}
                    >
                      {item.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                </div>

                <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', margin: 0, lineHeight: 1.4 }}>
                  {item.proposedChange}
                </p>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-light)' }}>
                  <div>
                    {validSourceUrl ? (
                      <a
                        href={validSourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          fontSize: '0.8rem',
                          color: 'var(--accent-main)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          textDecoration: 'underline',
                        }}
                      >
                        Official Source Document <ExternalLink size={12} />
                      </a>
                    ) : (
                      <span style={{ fontSize: '0.8rem', color: 'var(--danger, #dc2626)' }}>
                        Invalid or non-https URL provided
                      </span>
                    )}
                  </div>

                  {isPending && (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        type="button"
                        onClick={() => handleReject(item.id)}
                        style={{
                          padding: '0.35rem 0.75rem',
                          backgroundColor: 'transparent',
                          color: 'var(--danger, #dc2626)',
                          border: '1px solid var(--danger, #dc2626)',
                          borderRadius: '0.4rem',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                        }}
                      >
                        <XCircle size={13} /> Reject
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApprove(item.id)}
                        style={{
                          padding: '0.35rem 0.75rem',
                          backgroundColor: 'var(--success, #16a34a)',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '0.4rem',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                        }}
                      >
                        <CheckCircle2 size={13} /> Approve & Verify
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

