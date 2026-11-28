import { useEffect } from 'react';
import { X, Printer, FileText, AlertCircle } from 'lucide-react';

const NOT_LISTED = 'Not listed in this guide. Confirm with the official source.';

const asList = (value) => (Array.isArray(value) ? value.filter(Boolean) : []);

const Section = ({ title, children }) => (
  <section>
    <h5 style={{ margin: '0 0 0.4rem', fontSize: '0.88rem', fontWeight: 600 }}>{title}</h5>
    <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', overflowWrap: 'anywhere' }}>{children}</div>
  </section>
);

const Missing = () => <p style={{ margin: 0 }}>{NOT_LISTED}</p>;

const Bullets = ({ items }) =>
  items.length === 0 ? (
    <Missing />
  ) : (
    <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
      {items.map((item, idx) => (
        <li key={idx}>{item}</li>
      ))}
    </ul>
  );

export default function ServicePrintPacketModal({ isOpen, onClose, service }) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !service) return null;

  // Only what the service record actually publishes: a packet is carried to a counter, so a
  // guessed document or timeline could send someone there unprepared.
  const docs = asList(service.documents || service.requiredDocuments);
  const eligibility = asList(service.eligibility);
  const steps = asList(service.steps);
  const warnings = asList(service.warnings);
  const sources = asList(service.officialSources).filter((source) => source?.url);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className="modal-backdrop print-packet-backdrop"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        zIndex: 1000,
        backdropFilter: 'blur(4px)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="glass-panel print-packet-container"
        role="dialog"
        aria-modal="true"
        aria-labelledby="csc-packet-title"
        style={{
          background: 'var(--bg-card, #1e293b)',
          border: '1px solid var(--border-light, #334155)',
          borderRadius: '1rem',
          maxWidth: '700px',
          width: '100%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--border-light, #334155)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <FileText size={20} color="var(--accent-main, #38bdf8)" aria-hidden="true" />
            <h3 id="csc-packet-title" style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>
              Physical Application Packet Checklist
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost no-print"
            aria-label="Close checklist modal"
            style={{ padding: '0.4rem', borderRadius: '0.5rem', color: 'var(--text-secondary)' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div
            style={{
              padding: '0.85rem 1rem',
              borderRadius: '0.625rem',
              background: 'rgba(56, 189, 248, 0.08)',
              border: '1px solid rgba(56, 189, 248, 0.2)',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.6rem',
            }}
          >
            <AlertCircle size={18} color="var(--accent-main, #38bdf8)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong>Common Service Centre (CSC) & Seva Kendra Preparation:</strong> Print this packet before visiting. Keep originals for on-spot visual verification and submit only signed self-attested copies.
            </div>
          </div>

          <div>
            <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.95rem', fontWeight: 600 }}>
              Service: <span style={{ color: 'var(--accent-main, #38bdf8)' }}>{service.title || service.name}</span>
            </h4>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Category: {service.category || 'Civic Service'} • Last verified: {service.lastVerified || 'not recorded'}
            </p>
          </div>

          <Section title="Important warnings">
            <Bullets items={warnings} />
          </Section>

          <Section title="Who can apply">
            <Bullets items={eligibility} />
          </Section>

          {/* Table of Document Checklist */}
          <div>
            <h5 style={{ margin: '0 0 0.6rem', fontSize: '0.88rem', fontWeight: 600 }}>
              Documents to check and carry:
            </h5>
            {docs.length === 0 ? (
              <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{NOT_LISTED}</p>
            ) : (
            <div
              style={{
                border: '1px solid var(--border-light, #334155)',
                borderRadius: '0.5rem',
                overflow: 'hidden',
              }}
            >
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: 'rgba(255, 255, 255, 0.04)', borderBottom: '1px solid var(--border-light, #334155)' }}>
                    <th style={{ padding: '0.65rem 0.85rem' }}>#</th>
                    <th style={{ padding: '0.65rem 0.85rem' }}>Document</th>
                    <th style={{ padding: '0.65rem 0.85rem', textAlign: 'center' }}>Original</th>
                    <th style={{ padding: '0.65rem 0.85rem', textAlign: 'center' }}>Self-Attested Copy</th>
                  </tr>
                </thead>
                <tbody>
                  {docs.map((doc, idx) => (
                    <tr
                      key={idx}
                      style={{
                        borderBottom: idx < docs.length - 1 ? '1px solid rgba(255, 255, 255, 0.05)' : 'none',
                      }}
                    >
                      <td style={{ padding: '0.65rem 0.85rem', color: 'var(--text-secondary)' }}>{idx + 1}</td>
                      <td style={{ padding: '0.65rem 0.85rem', fontWeight: 500 }}>{doc}</td>
                      <td style={{ padding: '0.65rem 0.85rem', textAlign: 'center' }}>
                        <span style={{ display: 'inline-block', width: '14px', height: '14px', border: '1px solid #64748b', borderRadius: '3px' }} />
                      </td>
                      <td style={{ padding: '0.65rem 0.85rem', textAlign: 'center' }}>
                        <span style={{ display: 'inline-block', width: '14px', height: '14px', border: '1px solid #64748b', borderRadius: '3px' }} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            )}
          </div>

          <Section title="Steps">
            {steps.length === 0 ? (
              <Missing />
            ) : (
              <ol style={{ margin: 0, paddingLeft: '1.2rem' }}>
                {steps.map((step, idx) => (
                  <li key={idx}>
                    <strong>{step.title || step}</strong>
                    {step.description ? `: ${step.description}` : ''}
                  </li>
                ))}
              </ol>
            )}
          </Section>

          <Section title="Published fees">
            <p style={{ margin: 0 }}>{service.fees || NOT_LISTED}</p>
          </Section>

          <Section title="Processing time">
            <p style={{ margin: 0 }}>{service.processingTime || NOT_LISTED}</p>
          </Section>

          <Section title="Official sources">
            {/* Addresses are written out because a link cannot be followed on paper. */}
            <Bullets items={sources.map((source) => `${source.name || 'Official source'}: ${source.url}`)} />
          </Section>

          {/* Photograph & Biometrics Specifications */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '0.75rem',
              fontSize: '0.8rem',
            }}
          >
            <div style={{ padding: '0.75rem', borderRadius: '0.5rem', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-light, #334155)' }}>
              <strong>Photograph Specs:</strong> (general tip, confirm at the counter)
              <ul style={{ margin: '0.35rem 0 0', paddingLeft: '1.2rem', color: 'var(--text-secondary)' }}>
                <li>Size: 35mm x 45mm</li>
                <li>Plain white background</li>
                <li>80% face coverage, no glare</li>
              </ul>
            </div>
            <div style={{ padding: '0.75rem', borderRadius: '0.5rem', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-light, #334155)' }}>
              <strong>Attestation Norms:</strong> (general tip, confirm at the counter)
              <ul style={{ margin: '0.35rem 0 0', paddingLeft: '1.2rem', color: 'var(--text-secondary)' }}>
                <li>Sign across the lower margin</li>
                <li>Write &quot;Self Attested&quot; + Date</li>
                <li>Blue/Black ballpoint ink only</li>
              </ul>
            </div>
          </div>

          {/* Tear-off CSC Acknowledgement Slip */}
          <div
            style={{
              padding: '0.85rem 1rem',
              borderRadius: '0.5rem',
              border: '1px dashed #64748b',
              background: 'rgba(0, 0, 0, 0.2)',
              fontSize: '0.78rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
              <strong>CSC / Tehsil Submission Acknowledgement Slip</strong>
              <span>Civic Help Setu</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', color: 'var(--text-secondary)' }}>
              <div>Applicant Name: _________________</div>
              <div>Token / Ref No: _________________</div>
              <div>Receiving Officer: _______________</div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div
          className="no-print"
          style={{
            padding: '1rem 1.5rem',
            borderTop: '1px solid var(--border-light, #334155)',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '0.75rem',
            background: 'rgba(0, 0, 0, 0.2)',
          }}
        >
          <button type="button" onClick={onClose} className="btn btn-secondary" style={{ fontSize: '0.85rem' }}>
            Close
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="btn btn-primary"
            style={{ fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}
          >
            <Printer size={16} /> Print Checklist Packet
          </button>
        </div>
      </div>
    </div>
  );
}
