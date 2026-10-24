import { useState } from 'react';
import { X, CheckCircle, AlertTriangle, XCircle, ShieldCheck, Download, FileText } from 'lucide-react';
import { useModalKeyboard } from '../../hooks/useModalKeyboard';

export default function PreflightAuditModal({ audit, onClose }) {
  const modalRef = useModalKeyboard(true, onClose);
  const [copied, setCopied] = useState(false);

  if (!audit) return null;

  const getStatusBadge = (status) => {
    switch (status) {
      case 'READY':
        return <span style={{ background: '#dcfce7', color: '#15803d', padding: '4px 10px', borderRadius: '12px', fontWeight: 600, fontSize: '0.82rem' }}>READY FOR PORTAL SUBMISSION</span>;
      case 'NEEDS_ATTENTION':
        return <span style={{ background: '#fef3c7', color: '#b45309', padding: '4px 10px', borderRadius: '12px', fontWeight: 600, fontSize: '0.82rem' }}>MINOR WARNINGS</span>;
      default:
        return <span style={{ background: '#fee2e2', color: '#b91c1c', padding: '4px 10px', borderRadius: '12px', fontWeight: 600, fontSize: '0.82rem' }}>HIGH REJECTION RISK</span>;
    }
  };

  const handleCopyCertificate = () => {
    const text = `CIVIC HELP SETU - DOCUMENT READINESS PASS
Document: ${audit.documentName} (${audit.documentType})
Readiness Score: ${audit.overallScore}/100
Status: ${audit.status}
Audit Date: ${new Date(audit.timestamp).toLocaleDateString()}
Checks:
${audit.checks.map(c => `- [${c.passed ? 'PASS' : 'FAIL'}] ${c.name}: ${c.message}`).join('\n')}
Recommendations:
${audit.recommendations.map(r => `* ${r}`).join('\n')}
`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.55)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '16px'
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="audit-modal-title"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        style={{
          background: 'var(--card-bg, #ffffff)',
          color: 'var(--text-color, #1e293b)',
          borderRadius: '14px',
          width: '100%',
          maxWidth: '620px',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
          padding: '24px'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck color="#2563eb" size={24} />
            <h2 id="audit-modal-title" style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>
              Pre-flight Readiness Audit
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '4px' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Score Card */}
        <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', border: '1px solid #e2e8f0' }}>
          <div>
            <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 500 }}>Target Document</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{audit.documentName}</div>
            <div style={{ marginTop: '4px' }}>{getStatusBadge(audit.status)}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: audit.overallScore >= 80 ? '#16a34a' : audit.overallScore >= 50 ? '#d97706' : '#dc2626' }}>
              {audit.overallScore}%
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Readiness Score</div>
          </div>
        </div>

        {/* Audit Checks */}
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '10px', color: '#334155' }}>
            Compliance Checklist
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {audit.checks.map((check, idx) => (
              <div
                key={idx}
                style={{
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  background: check.passed ? '#f0fdf4' : '#fef2f2',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px'
                }}
              >
                {check.passed ? (
                  <CheckCircle size={18} color="#16a34a" style={{ marginTop: '2px', flexShrink: 0 }} />
                ) : (
                  <XCircle size={18} color="#dc2626" style={{ marginTop: '2px', flexShrink: 0 }} />
                )}
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.88rem', color: check.passed ? '#15803d' : '#b91c1c' }}>
                    {check.name}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#475569', marginTop: '2px' }}>
                    {check.message}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recommendations */}
        {audit.recommendations.length > 0 && (
          <div style={{ marginBottom: '20px', background: '#eff6ff', padding: '14px', borderRadius: '10px', border: '1px solid #bfdbfe' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '0.88rem', color: '#1e40af', marginBottom: '8px' }}>
              <AlertTriangle size={16} />
              Pre-Submission Advice & Privacy Safeguards
            </div>
            <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.82rem', color: '#1e3a8a', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {audit.recommendations.map((rec, idx) => (
                <li key={idx}>{rec}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '16px' }}>
          <button
            onClick={handleCopyCertificate}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.85rem',
              fontWeight: 500
            }}
          >
            <FileText size={16} />
            {copied ? 'Copied to Clipboard!' : 'Copy Audit Summary'}
          </button>
          <button
            onClick={onClose}
            style={{
              padding: '8px 18px',
              borderRadius: '8px',
              background: '#2563eb',
              color: '#ffffff',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: 600
            }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
