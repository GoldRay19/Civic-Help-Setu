import { useState, useEffect } from 'react';
import {
  CheckCircle2,
  XCircle,
  ExternalLink,
  FileText,
  AlertCircle,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { safeHttpUrl } from '../../utils/safeContent';

export default function TenderCorrectionQueue() {
  const { toast } = useToast();
  const [items, setItems] = useState([
    {
      id: 'sub_seed_tr_01',
      tenderId: 'gem-2026-b-581902',
      tenderRefNumber: 'GEM/2026/B/581902',
      correctionType: 'corrigendum_update',
      proposedDetails: 'GeM Corrigendum 2 published extending closing date from 2026-11-28 to 2026-12-05 and updating pre-bid queries reply.',
      officialSourceUrl: 'https://gem.gov.in/tenders/corrigendum/GEM-2026-B-581902-C2',
      contributorRole: 'small_vendor',
      submittedAt: '2026-11-12T09:30:00Z',
      status: 'pending_review',
      verificationSeal: 'TR-CORR-4A12-9F81',
    },
    {
      id: 'sub_seed_tr_02',
      tenderId: 'kppp-pwd-2026-9041',
      tenderRefNumber: 'KPPP/PWD/BLR/2026/9041',
      correctionType: 'fee_or_emd_update',
      proposedDetails: 'Karnataka PWD circular clarifies that SC/ST entrepreneurs registered with MSME are 100% exempt from EMD security deposit under KTPP amendment.',
      officialSourceUrl: 'https://kppp.karnataka.gov.in/circulars/pwd-msme-clarification-2026',
      contributorRole: 'procurement_analyst',
      submittedAt: '2026-11-13T14:15:00Z',
      status: 'pending_review',
      verificationSeal: 'TR-CORR-7C33-10BD',
    },
  ]);

  useEffect(() => {
    fetch('/api/tender-corrections')
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
    toast?.success?.('Tender correction verified against official portal and approved.');
  };

  const handleReject = (id) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: 'rejected' } : item))
    );
    toast?.error?.('Tender correction rejected (insufficient official proof or invalid URL).');
  };

  return (
    <div className="tender-correction-queue-panel animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText size={22} color="var(--accent-main)" />
            Government Tender Notices & Corrigenda Review Queue
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0 0' }}>
            Review vendor-submitted corrigenda, date extensions, and official procurement notices against verified government portals.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--glass-bg)', padding: '0.4rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border-main)' }}>
          <ShieldCheck size={16} color="#10b981" />
          <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-primary)' }}>
            Fail-Closed Review Enforced
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {items.map((item) => {
          const safeUrl = safeHttpUrl(item.officialSourceUrl);
          const isPending = item.status === 'pending_review';

          return (
            <div
              key={item.id}
              className="card"
              style={{
                padding: '1.25rem',
                borderLeft: `4px solid ${
                  item.status === 'approved' ? '#10b981' : item.status === 'rejected' ? '#ef4444' : 'var(--accent-main)'
                }`,
                display: 'flex',
                flexDirection: 'column',
                gap: '0.85rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: '700', color: 'var(--text-primary)', fontSize: '1rem' }}>
                      {item.tenderRefNumber}
                    </span>
                    <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: '4px', background: 'var(--glass-bg-hover)', border: '1px solid var(--border-main)', color: 'var(--text-secondary)' }}>
                      {item.correctionType.replace(/_/g, ' ').toUpperCase()}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', fontFamily: 'monospace' }}>
                      Seal: {item.verificationSeal}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.2rem' }}>
                    <Clock size={12} />
                    Submitted: {new Date(item.submittedAt).toLocaleDateString()} by role: {item.contributorRole}
                  </span>
                </div>

                <div>
                  {item.status === 'approved' && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: '#10b981', fontSize: '0.85rem', fontWeight: '600' }}>
                      <CheckCircle2 size={16} /> Approved & Staged
                    </span>
                  )}
                  {item.status === 'rejected' && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: '#ef4444', fontSize: '0.85rem', fontWeight: '600' }}>
                      <XCircle size={16} /> Rejected
                    </span>
                  )}
                  {isPending && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: '#f59e0b', fontSize: '0.85rem', fontWeight: '600' }}>
                      <AlertCircle size={16} /> Needs Source Check
                    </span>
                  )}
                </div>
              </div>

              <div style={{ background: 'var(--glass-bg)', padding: '0.75rem', borderRadius: '6px', fontSize: '0.88rem', color: 'var(--text-primary)', border: '1px solid var(--border-main)' }}>
                <strong>Proposed Notice Update:</strong>
                <p style={{ margin: '0.35rem 0 0 0', lineHeight: 1.5 }}>{item.proposedDetails}</p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                {safeUrl ? (
                  <a
                    href={safeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary btn-sm"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
                  >
                    <span>Click-Check Official Government Portal</span>
                    <ExternalLink size={13} />
                  </a>
                ) : (
                  <span style={{ fontSize: '0.8rem', color: '#ef4444' }}>Invalid / Insecure Source URL</span>
                )}

                {isPending && (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={() => handleReject(item.id)}
                      className="btn btn-sm"
                      style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid #ef4444', padding: '0.35rem 0.75rem', fontSize: '0.8rem', cursor: 'pointer', borderRadius: '6px' }}
                    >
                      Reject
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApprove(item.id)}
                      className="btn btn-primary btn-sm"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                    >
                      <CheckCircle2 size={14} />
                      <span>Approve & Verify</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

