import { useEffect } from 'react';
import { X, Printer } from 'lucide-react';

export default function TenderPrintReportModal({
  tender,
  checklistState,
  readiness,
  isOpen,
  onClose,
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !tender) return null;

  const mandatory = tender.eligibilityCriteria?.mandatory || [];
  const items = checklistState?.items || {};
  const msme = checklistState?.msmeStatus || {};

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="print-report-title"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(4px)',
        zIndex: 1100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="printable-tender-report animate-scale-up"
        style={{
          backgroundColor: '#ffffff',
          color: '#1e293b',
          borderRadius: '1rem',
          width: '100%',
          maxWidth: '850px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          overflow: 'hidden',
        }}
      >
        {/* Controls Bar (Hidden in @media print) */}
        <div
          className="no-print"
          style={{
            padding: '1rem 1.5rem',
            backgroundColor: '#0f172a',
            color: '#ffffff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>
            Vendor Readiness Printable Dossier (#722)
          </span>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button
              type="button"
              onClick={handlePrint}
              style={{
                backgroundColor: '#2563eb',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                padding: '0.45rem 0.85rem',
                fontSize: '0.825rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              <Printer size={15} />
              <span>Print / Save PDF</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close report"
              style={{
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                padding: '0.25rem',
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Printable Report Document Body */}
        <div
          id="printable-readiness-content"
          style={{
            padding: '2rem',
            overflowY: 'auto',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem',
            fontSize: '0.9rem',
            lineHeight: 1.5,
          }}
        >
          {/* Header & Watermark */}
          <div style={{ borderBottom: '2px solid #0f172a', paddingBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h1 id="print-report-title" style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                  CIVIC HELP SETU — TENDER READINESS DOSSIER
                </h1>
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                  Pre-Submission Evidence Verification &amp; Exemption Roadmap for Small Vendors
                </p>
              </div>
              <div style={{ textAlign: 'right', fontSize: '0.75rem', color: '#64748b' }}>
                <div>Report Date: {new Date().toLocaleDateString()}</div>
                <div>Status: Self-Evaluated Checklist</div>
              </div>
            </div>

            {/* Non-transactional disclaimer badge */}
            <div
              style={{
                marginTop: '0.75rem',
                padding: '0.5rem 0.75rem',
                backgroundColor: '#fef3c7',
                border: '1px solid #f59e0b',
                borderRadius: '6px',
                fontSize: '0.78rem',
                color: '#92400e',
                fontWeight: 600,
              }}
            >
              ⚠️ DISCLAIMER: This document is generated for vendor self-preparation and internal audit only. It does NOT constitute an official tender submission or bid tender on any government portal.
            </div>
          </div>

          {/* Tender Identification */}
          <div>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 0.5rem 0', color: '#0f172a' }}>
              {tender.title}
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', fontSize: '0.85rem' }}>
              <div><strong>NIT Reference:</strong> {tender.tenderRefNumber}</div>
              <div><strong>Procuring Body:</strong> {tender.authority}</div>
              <div><strong>Category:</strong> {tender.category?.toUpperCase()}</div>
              <div><strong>Jurisdiction:</strong> {tender.jurisdiction?.level?.toUpperCase()}</div>
              <div>
                <strong>Submission Closing:</strong>{' '}
                {tender.closingSchedule?.isUnavailable
                  ? 'To be announced in corrigendum'
                  : `${tender.closingSchedule?.closingDate} ${tender.closingSchedule?.closingTime || ''}`}
              </div>
              <div>
                <strong>EMD:</strong> {tender.financials?.emd?.amount ? `₹${tender.financials.emd.amount.toLocaleString()}` : 'Nil'}
                {tender.financials?.emd?.isExemptForMsme ? ' (MSME Exempt)' : ''}
              </div>
            </div>
          </div>

          {/* Readiness Score Card */}
          <div
            style={{
              padding: '1rem',
              backgroundColor: '#f8fafc',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <span style={{ fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
                Readiness Score
              </span>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a' }}>
                {readiness?.score || 0}%
              </div>
            </div>
            <div style={{ textAlign: 'right', fontSize: '0.85rem' }}>
              <div><strong>{readiness?.completedCount || 0}</strong> of <strong>{readiness?.totalMandatory || 0}</strong> Mandatory Proofs Prepared</div>
              <div style={{ color: '#64748b', fontSize: '0.8rem' }}>
                MSME Exemption Claim: {msme.isClaimingMsmeExemption ? 'YES (GFR 170)' : 'NO'}
              </div>
            </div>
          </div>

          {/* Itemized Evidence Table */}
          <div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: '0 0 0.5rem 0', color: '#0f172a' }}>
              Mandatory Statutory Requirements &amp; Evidence Checklist
            </h3>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: '#0f172a', color: '#ffffff' }}>
                  <th style={{ padding: '0.5rem', border: '1px solid #cbd5e1' }}>Requirement</th>
                  <th style={{ padding: '0.5rem', border: '1px solid #cbd5e1' }}>Required Proof</th>
                  <th style={{ padding: '0.5rem', border: '1px solid #cbd5e1' }}>Status</th>
                  <th style={{ padding: '0.5rem', border: '1px solid #cbd5e1' }}>Vendor Reference / Note</th>
                </tr>
              </thead>
              <tbody>
                {mandatory.map((req) => {
                  const saved = items[req.id] || { status: 'not_started', notes: '', documentRef: '' };
                  const isDone = saved.status === 'ready' || saved.status === 'exempt';

                  return (
                    <tr key={req.id} style={{ backgroundColor: isDone ? '#f0fdf4' : '#ffffff' }}>
                      <td style={{ padding: '0.5rem', border: '1px solid #cbd5e1', fontWeight: 600 }}>
                        {req.label}
                      </td>
                      <td style={{ padding: '0.5rem', border: '1px solid #cbd5e1', color: '#475569' }}>
                        {req.evidenceRequired}
                      </td>
                      <td style={{ padding: '0.5rem', border: '1px solid #cbd5e1', fontWeight: 700, color: isDone ? '#15803d' : '#b45309', textTransform: 'capitalize' }}>
                        {saved.status.replace(/_/g, ' ')}
                      </td>
                      <td style={{ padding: '0.5rem', border: '1px solid #cbd5e1' }}>
                        {saved.documentRef && <div><strong>File:</strong> {saved.documentRef}</div>}
                        {saved.notes && <div><strong>Note:</strong> {saved.notes}</div>}
                        {!saved.documentRef && !saved.notes && <span style={{ color: '#94a3b8' }}>None recorded</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Official Source Provenance */}
          <div style={{ borderTop: '1px solid #cbd5e1', paddingTop: '1rem', fontSize: '0.78rem', color: '#64748b' }}>
            <div><strong>Official Notice Source:</strong> {tender.sourceUrl}</div>
            <div><strong>Last Verified by Civic Help Setu Audit Desk:</strong> {tender.auditMetadata?.lastVerified}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
