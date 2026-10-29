import { useState } from 'react';
import { X, AlertOctagon, Copy, Printer, Check, ShieldAlert, Scale } from 'lucide-react';
import { useModalKeyboard } from '../../hooks/useModalKeyboard';
import { evaluateApplicationSla, generateFirstAppealNotice } from '../../services/statutorySlaService';
import { buildLetterPrintHtml } from '../../utils/printHtml';

export default function AppellateEscalationModal({ isOpen, onClose, application, citizenName = 'Citizen Applicant' }) {
  const modalRef = useModalKeyboard(isOpen, onClose);
  const [copied, setCopied] = useState(false);

  if (!isOpen || !application) return null;

  const slaInfo = evaluateApplicationSla(application);
  const appealText = generateFirstAppealNotice(application, citizenName);

  const handleCopy = () => {
    navigator.clipboard.writeText(appealText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(buildLetterPrintHtml('First Appeal Notice', appealText));
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => printWindow.print(), 300);
    }
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
      aria-labelledby="appeal-modal-title"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        style={{
          background: 'var(--card-bg, #ffffff)',
          color: 'var(--text-color, #1e293b)',
          borderRadius: '14px',
          width: '100%',
          maxWidth: '680px',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15)',
          padding: '24px'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Scale color="#dc2626" size={24} />
            <h2 id="appeal-modal-title" style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>
              Statutory First Appeal & Escalation
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

        {/* SLA Breach Info Header */}
        <div style={{ background: '#fef2f2', padding: '14px', borderRadius: '10px', border: '1px solid #fecaca', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#991b1b', fontWeight: 700, fontSize: '0.92rem' }}>
            <AlertOctagon size={18} />
            Statutory Deadline Exceeded by {slaInfo.overdueDays} Business Days
          </div>
          <p style={{ margin: '6px 0 0 0', fontSize: '0.82rem', color: '#7f1d1d', lineHeight: 1.4 }}>
            Under the {slaInfo.actName}, the designated officer was mandated to process {slaInfo.serviceName} within {slaInfo.statutoryDays} working days. You are legally entitled to file this appeal with the designated First Appellate Authority.
          </p>
        </div>

        {/* Appellate Authority Details */}
        <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '16px', fontSize: '0.84rem' }}>
          <div><strong>Designated First Appellate Officer:</strong> {slaInfo.firstAppellateAuthority}</div>
          <div style={{ marginTop: '4px' }}><strong>Second Appellate Authority:</strong> {slaInfo.secondAppellateAuthority}</div>
          <div style={{ marginTop: '4px', color: '#047857' }}><strong>Applicable Penalty Provision:</strong> {slaInfo.penaltyClause}</div>
        </div>

        {/* Petition Letter Preview */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>Statutory Petition Letter</span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={handleCopy}
                style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                {copied ? <Check size={14} color="#16a34a" /> : <Copy size={14} />}
                <span>{copied ? 'Copied' : 'Copy Petition'}</span>
              </button>
              <button
                type="button"
                onClick={handlePrint}
                style={{ padding: '6px 14px', borderRadius: '6px', border: 'none', background: '#dc2626', color: '#fff', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <Printer size={14} />
                <span>Print Appeal</span>
              </button>
            </div>
          </div>

          <pre style={{ background: '#f1f5f9', padding: '14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.8rem', whiteSpace: 'pre-wrap', maxHeight: '250px', overflowY: 'auto', color: '#0f172a' }}>
            {appealText}
          </pre>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
          <button
            onClick={onClose}
            style={{ padding: '8px 18px', borderRadius: '8px', background: '#475569', color: '#ffffff', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
