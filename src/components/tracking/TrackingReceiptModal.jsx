import { useState, useEffect, useMemo } from 'react';
import {
  X,
  Shield,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Printer,
  Download,
  Copy,
  Check,
  FileText,
  FileJson,
} from 'lucide-react';
import {
  buildReceiptSummary,
  formatReceiptAsPlainText,
  downloadReceiptTextFile,
  downloadReceiptJsonDossier,
  buildReceiptQrPath,
  parseAndVerifyReceiptText,
} from '../../services/submissionReceiptService';

const TrackingReceiptModal = ({ app, isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('receipt');
  const [copiedSlip, setCopiedSlip] = useState(false);
  const [copiedDigest, setCopiedDigest] = useState(false);
  const [verifyInput, setVerifyInput] = useState('');
  const [verifyResult, setVerifyResult] = useState(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const summary = useMemo(() => {
    if (!app) return null;
    return buildReceiptSummary(app);
  }, [app]);

  const qr = useMemo(() => {
    if (!summary) return null;
    return buildReceiptQrPath({
      id: summary.applicationId,
      rec: summary.receiptNumber,
      seal: summary.verificationSeal,
      sha256: summary.sha256Digest,
    });
  }, [summary]);

  if (!isOpen || !app || !summary) return null;

  const handleCopyTextSlip = async () => {
    try {
      const text = formatReceiptAsPlainText(summary);
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        setCopiedSlip(true);
        setTimeout(() => setCopiedSlip(false), 2000);
      }
    } catch {
      // Fallback
    }
  };

  const handleCopyDigest = async () => {
    try {
      if (summary?.sha256Digest && navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(summary.sha256Digest);
        setCopiedDigest(true);
        setTimeout(() => setCopiedDigest(false), 2000);
      }
    } catch {
      // Fallback
    }
  };

  const handleDownloadText = () => {
    downloadReceiptTextFile(summary);
  };

  const handleDownloadJson = () => {
    downloadReceiptJsonDossier(summary);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleVerify = () => {
    if (!verifyInput.trim()) return;
    const res = parseAndVerifyReceiptText(verifyInput);
    setVerifyResult(res);
  };

  const handleClearVerify = () => {
    setVerifyInput('');
    setVerifyResult(null);
  };

  return (
    <div
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1200,
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="receipt-title"
        className="card animate-fade-in civic-receipt-printable"
        style={{
          width: '100%',
          maxWidth: '580px',
          background: 'var(--bg-main, #0f172a)',
          position: 'relative',
          padding: '2rem',
          border: '1px solid var(--border-main, #334155)',
          borderRadius: '1rem',
          boxShadow: 'var(--shadow-lg, 0 20px 25px -5px rgba(0, 0, 0, 0.3))',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close receipt"
          className="no-print"
          style={{
            position: 'absolute',
            top: '1.25rem',
            right: '1.25rem',
            background: 'var(--glass-bg, rgba(255, 255, 255, 0.05))',
            border: '1px solid var(--border-light, #334155)',
            color: 'var(--text-secondary, #94a3b8)',
            padding: '0.5rem',
            borderRadius: '50%',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <X size={18} />
        </button>

        {/* Receipt Header */}
        <div
          style={{
            textAlign: 'center',
            marginBottom: '1.25rem',
            borderBottom: '1px dashed var(--border-main, #334155)',
            paddingBottom: '1rem',
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '0.4rem',
            }}
          >
            <div
              style={{
                width: '2rem',
                height: '2rem',
                borderRadius: '0.5rem',
                background: 'var(--accent-main, #38bdf8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Shield size={16} color="#0f172a" />
            </div>
            <span
              style={{
                fontWeight: '800',
                fontSize: '1.15rem',
                color: 'var(--text-primary)',
              }}
            >
              CivicBridge Portal
            </span>
          </div>
          <h2
            id="receipt-title"
            style={{ fontSize: '1.35rem', fontWeight: '800', margin: '0.25rem 0 0' }}
          >
            Official Submission Receipt
          </h2>
          <p
            style={{
              color: 'var(--text-secondary)',
              fontSize: '0.8rem',
              marginTop: '0.25rem',
            }}
          >
            National Public Service Fast-Track Verification Slip
          </p>
        </div>

        {/* Tabs Bar */}
        <div
          role="tablist"
          aria-label="Receipt modal tabs"
          className="no-print"
          style={{
            display: 'flex',
            gap: '0.5rem',
            marginBottom: '1.25rem',
            background: 'var(--glass-bg, rgba(255, 255, 255, 0.04))',
            padding: '0.25rem',
            borderRadius: '0.5rem',
            border: '1px solid var(--border-light, #334155)',
          }}
        >
          <button
            type="button"
            role="tab"
            id="tab-receipt"
            aria-selected={activeTab === 'receipt'}
            aria-controls="panel-receipt"
            onClick={() => setActiveTab('receipt')}
            style={{
              flex: 1,
              padding: '0.5rem 0.75rem',
              fontSize: '0.82rem',
              fontWeight: '600',
              borderRadius: '0.375rem',
              border: 'none',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              background:
                activeTab === 'receipt'
                  ? 'var(--accent-main, #38bdf8)'
                  : 'transparent',
              color:
                activeTab === 'receipt'
                  ? '#0f172a'
                  : 'var(--text-secondary, #94a3b8)',
              transition: 'all 0.15s ease',
            }}
          >
            <FileText size={15} />
            <span>Receipt Slip</span>
          </button>
          <button
            type="button"
            role="tab"
            id="tab-verify"
            aria-selected={activeTab === 'verify'}
            aria-controls="panel-verify"
            onClick={() => setActiveTab('verify')}
            style={{
              flex: 1,
              padding: '0.5rem 0.75rem',
              fontSize: '0.82rem',
              fontWeight: '600',
              borderRadius: '0.375rem',
              border: 'none',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              background:
                activeTab === 'verify'
                  ? 'var(--accent-main, #38bdf8)'
                  : 'transparent',
              color:
                activeTab === 'verify'
                  ? '#0f172a'
                  : 'var(--text-secondary, #94a3b8)',
              transition: 'all 0.15s ease',
            }}
          >
            <ShieldCheck size={15} />
            <span>Verify Authenticity</span>
          </button>
        </div>

        {/* Tab 1: Receipt Slip View */}
        {activeTab === 'receipt' && (
          <div id="panel-receipt" role="tabpanel" aria-labelledby="tab-receipt">
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                marginBottom: '1.5rem',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.75rem 1rem',
                  background: 'var(--glass-bg, rgba(255, 255, 255, 0.03))',
                  borderRadius: '0.5rem',
                  border: '1px solid var(--border-light, #334155)',
                }}
              >
                <span
                  style={{
                    fontSize: '0.8rem',
                    color: 'var(--text-tertiary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Receipt Number
                </span>
                <span
                  style={{
                    fontFamily: 'monospace',
                    fontWeight: '800',
                    fontSize: '1rem',
                    color: 'var(--accent-main, #38bdf8)',
                  }}
                >
                  {summary.receiptNumber}
                </span>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '0.85rem',
                  fontSize: '0.85rem',
                }}
              >
                <div>
                  <span
                    style={{
                      color: 'var(--text-tertiary)',
                      display: 'block',
                      fontSize: '0.72rem',
                      textTransform: 'uppercase',
                    }}
                  >
                    Service
                  </span>
                  <strong style={{ color: 'var(--text-primary)' }}>
                    {summary.serviceName}
                  </strong>
                </div>

                <div>
                  <span
                    style={{
                      color: 'var(--text-tertiary)',
                      display: 'block',
                      fontSize: '0.72rem',
                      textTransform: 'uppercase',
                    }}
                  >
                    Applicant
                  </span>
                  <strong style={{ color: 'var(--text-primary)' }}>
                    {summary.applicantName}
                  </strong>
                </div>

                <div>
                  <span
                    style={{
                      color: 'var(--text-tertiary)',
                      display: 'block',
                      fontSize: '0.72rem',
                      textTransform: 'uppercase',
                    }}
                  >
                    Submission Date
                  </span>
                  <strong style={{ color: 'var(--text-primary)' }}>
                    {summary.submissionDate}
                  </strong>
                </div>

                <div>
                  <span
                    style={{
                      color: 'var(--text-tertiary)',
                      display: 'block',
                      fontSize: '0.72rem',
                      textTransform: 'uppercase',
                    }}
                  >
                    Target Completion
                  </span>
                  <strong style={{ color: 'var(--text-primary)' }}>
                    {summary.targetCompletionDate}
                  </strong>
                </div>
              </div>

              {/* Digital Verification Seal & SVG QR Code */}
              <div
                style={{
                  padding: '0.85rem 1rem',
                  background: 'var(--glass-bg-subtle, rgba(255, 255, 255, 0.02))',
                  borderRadius: '0.5rem',
                  border: '1px solid var(--border-light, #334155)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.75rem',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      marginBottom: '0.2rem',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '0.72rem',
                        color: 'var(--text-tertiary)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                      }}
                    >
                      Digital Verification Seal
                    </span>
                    <span
                      style={{
                        fontSize: '0.65rem',
                        padding: '0.1rem 0.4rem',
                        borderRadius: '9999px',
                        background: 'rgba(16, 185, 129, 0.15)',
                        color: '#10b981',
                        fontWeight: '700',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                      }}
                    >
                      SHA-256 Sealed
                    </span>
                  </div>
                  <div
                    style={{
                      fontFamily: 'monospace',
                      fontSize: '0.82rem',
                      fontWeight: '700',
                      color: 'var(--text-primary)',
                      letterSpacing: '0.02em',
                    }}
                  >
                    {summary.verificationSeal}
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      marginTop: '0.25rem',
                    }}
                  >
                    <code
                      title={summary.sha256Digest}
                      style={{
                        fontSize: '0.68rem',
                        color: 'var(--text-tertiary)',
                        fontFamily: 'monospace',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: '220px',
                        display: 'inline-block',
                      }}
                    >
                      {summary.sha256Digest.slice(0, 16)}...
                      {summary.sha256Digest.slice(-8)}
                    </code>
                    <button
                      type="button"
                      onClick={handleCopyDigest}
                      aria-label="Copy full SHA-256 digest"
                      className="no-print"
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: copiedDigest ? '#10b981' : 'var(--text-tertiary)',
                        cursor: 'pointer',
                        padding: '0.1rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                      }}
                    >
                      {copiedDigest ? (
                        <Check size={12} color="#10b981" />
                      ) : (
                        <Copy size={12} />
                      )}
                    </button>
                  </div>
                </div>

                {qr && (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.2rem',
                    }}
                  >
                    <svg
                      viewBox={`0 0 ${qr.size} ${qr.size}`}
                      role="img"
                      aria-label="Scannable receipt verification QR code"
                      style={{
                        width: '76px',
                        height: '76px',
                        padding: '4px',
                        background: '#ffffff',
                        borderRadius: '0.4rem',
                        flexShrink: 0,
                      }}
                    >
                      <path d={qr.path} fill="#0f172a" />
                    </svg>
                    <span
                      style={{
                        fontSize: '0.58rem',
                        color: 'var(--text-tertiary)',
                        letterSpacing: '0.04em',
                      }}
                    >
                      SCAN TO VERIFY
                    </span>
                  </div>
                )}
              </div>

              <div
                style={{
                  fontSize: '0.72rem',
                  color: 'var(--text-tertiary)',
                  lineHeight: '1.4',
                  background: 'rgba(255,255,255,0.02)',
                  padding: '0.6rem 0.8rem',
                  borderRadius: '0.4rem',
                }}
              >
                ℹ️ {summary.statutoryNotice}
              </div>
            </div>

            {/* Action Controls */}
            <div
              className="no-print"
              style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}
            >
              <button
                type="button"
                onClick={handleCopyTextSlip}
                className="btn btn-secondary"
                aria-label="Copy receipt slip text"
                style={{
                  flex: '1 1 110px',
                  padding: '0.6rem',
                  fontSize: '0.8rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.35rem',
                }}
              >
                {copiedSlip ? (
                  <Check size={14} color="#10b981" />
                ) : (
                  <Copy size={14} />
                )}
                <span>{copiedSlip ? 'Copied Slip' : 'Copy Text'}</span>
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="btn btn-secondary"
                aria-label="Print receipt"
                style={{
                  flex: '1 1 100px',
                  padding: '0.6rem',
                  fontSize: '0.8rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.35rem',
                }}
              >
                <Printer size={14} />
                <span>Print Slip</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadText}
                className="btn btn-secondary"
                aria-label="Save receipt text file"
                style={{
                  flex: '1 1 115px',
                  padding: '0.6rem',
                  fontSize: '0.8rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.35rem',
                }}
              >
                <Download size={14} />
                <span>Download Slip</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadJson}
                className="btn btn-primary"
                aria-label="Download signed JSON dossier"
                style={{
                  flex: '1 1 125px',
                  padding: '0.6rem',
                  fontSize: '0.8rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.35rem',
                }}
              >
                <FileJson size={14} />
                <span>Download JSON</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Verify Receipt Authenticity View */}
        {activeTab === 'verify' && (
          <div
            id="panel-verify"
            role="tabpanel"
            aria-labelledby="tab-verify"
            className="no-print"
          >
            <div style={{ marginBottom: '1rem' }}>
              <p
                style={{
                  fontSize: '0.82rem',
                  color: 'var(--text-secondary)',
                  margin: '0 0 0.5rem',
                }}
              >
                Paste an official ASCII receipt slip or JSON export dossier
                below to cryptographically verify its authenticity and check for
                tampering.
              </p>
              <textarea
                rows={5}
                value={verifyInput}
                onChange={(e) => setVerifyInput(e.target.value)}
                placeholder="Paste receipt slip text or JSON dossier here..."
                aria-label="Paste receipt slip or JSON dossier"
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  background: 'var(--glass-bg, rgba(255, 255, 255, 0.04))',
                  border: '1px solid var(--border-light, #334155)',
                  color: 'var(--text-primary)',
                  fontFamily: 'monospace',
                  fontSize: '0.75rem',
                  lineHeight: '1.4',
                  resize: 'vertical',
                }}
              />
            </div>

            <div
              style={{
                display: 'flex',
                gap: '0.5rem',
                marginBottom: '1.25rem',
              }}
            >
              <button
                type="button"
                onClick={handleVerify}
                disabled={!verifyInput.trim()}
                className="btn btn-primary"
                aria-label="Verify Authenticity"
                style={{
                  flex: 1,
                  padding: '0.65rem',
                  fontSize: '0.85rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                  opacity: verifyInput.trim() ? 1 : 0.6,
                  cursor: verifyInput.trim() ? 'pointer' : 'not-allowed',
                }}
              >
                <ShieldCheck size={16} />
                <span>Verify Authenticity</span>
              </button>
              {verifyInput && (
                <button
                  type="button"
                  onClick={handleClearVerify}
                  className="btn btn-secondary"
                  aria-label="Clear verification input"
                  style={{ padding: '0.65rem 1rem', fontSize: '0.85rem' }}
                >
                  Clear
                </button>
              )}
            </div>

            {verifyResult && (
              <div
                data-testid="verification-verdict"
                style={{
                  padding: '1rem',
                  borderRadius: '0.5rem',
                  border: `1px solid ${
                    verifyResult.valid
                      ? 'rgba(16, 185, 129, 0.4)'
                      : verifyResult.status === 'TAMPERED'
                      ? 'rgba(239, 68, 68, 0.4)'
                      : 'rgba(245, 158, 11, 0.4)'
                  }`,
                  background: verifyResult.valid
                    ? 'rgba(16, 185, 129, 0.08)'
                    : verifyResult.status === 'TAMPERED'
                    ? 'rgba(239, 68, 68, 0.08)'
                    : 'rgba(245, 158, 11, 0.08)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.6rem',
                  }}
                >
                  {verifyResult.valid ? (
                    <CheckCircle2
                      size={20}
                      color="#10b981"
                      style={{ flexShrink: 0, marginTop: '2px' }}
                    />
                  ) : verifyResult.status === 'TAMPERED' ? (
                    <AlertTriangle
                      size={20}
                      color="#ef4444"
                      style={{ flexShrink: 0, marginTop: '2px' }}
                    />
                  ) : (
                    <AlertCircle
                      size={20}
                      color="#f59e0b"
                      style={{ flexShrink: 0, marginTop: '2px' }}
                    />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <strong
                      style={{
                        display: 'block',
                        fontSize: '0.9rem',
                        color: verifyResult.valid
                          ? '#10b981'
                          : verifyResult.status === 'TAMPERED'
                          ? '#ef4444'
                          : '#f59e0b',
                      }}
                    >
                      {verifyResult.valid
                        ? 'Verified Authentic'
                        : verifyResult.status === 'TAMPERED'
                        ? 'Tamper Warning: Cryptographic Mismatch'
                        : 'Invalid Receipt Format'}
                    </strong>
                    <p
                      style={{
                        margin: '0.25rem 0 0',
                        fontSize: '0.78rem',
                        color: 'var(--text-secondary)',
                        lineHeight: '1.4',
                      }}
                    >
                      {verifyResult.valid
                        ? 'Cryptographic SHA-256 seal matches canonical receipt facts. No tampering detected.'
                        : verifyResult.reason}
                    </p>

                    {verifyResult.valid &&
                      (verifyResult.parsedReceipt || verifyResult.summary) && (
                        <div
                          style={{
                            marginTop: '0.75rem',
                            paddingTop: '0.75rem',
                            borderTop: '1px solid rgba(16, 185, 129, 0.2)',
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: '0.5rem',
                            fontSize: '0.75rem',
                          }}
                        >
                          <div>
                            <span
                              style={{
                                color: 'var(--text-tertiary)',
                                display: 'block',
                                fontSize: '0.68rem',
                              }}
                            >
                              REFERENCE ID
                            </span>
                            <strong style={{ color: 'var(--text-primary)' }}>
                              {
                                (
                                  verifyResult.parsedReceipt ||
                                  verifyResult.summary
                                ).applicationId
                              }
                            </strong>
                          </div>
                          <div>
                            <span
                              style={{
                                color: 'var(--text-tertiary)',
                                display: 'block',
                                fontSize: '0.68rem',
                              }}
                            >
                              SERVICE
                            </span>
                            <strong style={{ color: 'var(--text-primary)' }}>
                              {
                                (
                                  verifyResult.parsedReceipt ||
                                  verifyResult.summary
                                ).serviceName
                              }
                            </strong>
                          </div>
                          <div>
                            <span
                              style={{
                                color: 'var(--text-tertiary)',
                                display: 'block',
                                fontSize: '0.68rem',
                              }}
                            >
                              APPLICANT
                            </span>
                            <strong style={{ color: 'var(--text-primary)' }}>
                              {
                                (
                                  verifyResult.parsedReceipt ||
                                  verifyResult.summary
                                ).applicantName
                              }
                            </strong>
                          </div>
                          <div>
                            <span
                              style={{
                                color: 'var(--text-tertiary)',
                                display: 'block',
                                fontSize: '0.68rem',
                              }}
                            >
                              STATUS
                            </span>
                            <strong
                              style={{
                                color: 'var(--text-primary)',
                                textTransform: 'uppercase',
                              }}
                            >
                              {
                                (
                                  verifyResult.parsedReceipt ||
                                  verifyResult.summary
                                ).status
                              }
                            </strong>
                          </div>
                        </div>
                      )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          .civic-receipt-printable, .civic-receipt-printable * {
            visibility: visible !important;
          }
          .civic-receipt-printable {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            background: #ffffff !important;
            color: #000000 !important;
            border: 1px solid #000000 !important;
            box-shadow: none !important;
            padding: 2cm !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default TrackingReceiptModal;
