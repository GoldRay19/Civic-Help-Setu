import { useState } from 'react';
import { X, Users, CheckCircle, AlertTriangle, Plus, Send } from 'lucide-react';
import { useModalKeyboard } from '../../hooks/useModalKeyboard';
import { getAuditReports, saveAuditReport } from '../../services/communityAuditService';
import DiscrepancyVoteCard from './DiscrepancyVoteCard';

export default function CommunityAuditBoardModal({ isOpen, onClose, service }) {
  const modalRef = useModalKeyboard(isOpen, onClose);
  const [reports, setReports] = useState(() => getAuditReports(service?.id));
  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('FEES_UPDATE');
  const [description, setDescription] = useState('');
  const [reporterName, setReporterName] = useState('');

  if (!isOpen || !service) return null;

  const handleRefresh = () => {
    setReports(getAuditReports(service.id));
  };

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    saveAuditReport({
      serviceId: service.id,
      category,
      title,
      description,
      reportedBy: reporterName.trim() || 'Citizen Contributor'
    });

    setTitle('');
    setDescription('');
    setShowAddForm(false);
    handleRefresh();
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
      aria-labelledby="audit-board-title"
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
            <Users color="#2563eb" size={24} />
            <div>
              <h2 id="audit-board-title" style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>
                Community Discrepancy & Verification Board
              </h2>
              <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{service.name}</div>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '4px' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Action Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ fontSize: '0.82rem', color: '#475569' }}>
            Ground-reality verification by applicants. Net 5+ confirms elevate to <strong>Community Verified</strong>.
          </div>
          <button
            type="button"
            onClick={() => setShowAddForm(!showAddForm)}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: 'none',
              background: '#2563eb',
              color: '#ffffff',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Plus size={14} />
            <span>{showAddForm ? 'Cancel' : 'Report Ground Discrepancy'}</span>
          </button>
        </div>

        {/* Add Discrepancy Form */}
        {showAddForm && (
          <form onSubmit={handleAddSubmit} style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #cbd5e1', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, marginBottom: '3px' }}>Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  style={{ width: '100%', padding: '7px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.82rem', background: '#fff' }}
                >
                  <option value="FEES_UPDATE">Fee Schedule Revision</option>
                  <option value="DOCUMENT_REQUIREMENT">New Document Demanded</option>
                  <option value="TIMINGS_CLOSURE">Counter Timings / Days Closed</option>
                  <option value="PORTAL_OUTAGE">Portal Link Broken / Changed</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, marginBottom: '3px' }}>Your Name / Identifier</label>
                <input
                  type="text"
                  placeholder="e.g. Applicant_Jaipur"
                  value={reporterName}
                  onChange={(e) => setReporterName(e.target.value)}
                  style={{ width: '100%', padding: '7px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, marginBottom: '3px' }}>Summary Title</label>
              <input
                type="text"
                placeholder="e.g. Officer requested affidavit on ₹50 stamp instead of plain paper"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={{ width: '100%', padding: '7px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, marginBottom: '3px' }}>Detailed Observation & Center Visited</label>
              <textarea
                rows="2"
                placeholder="Describe exactly what happened during your physical center visit or portal application..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{ width: '100%', padding: '7px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
                required
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="submit"
                style={{ padding: '6px 14px', borderRadius: '6px', border: 'none', background: '#16a34a', color: '#fff', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <Send size={13} />
                <span>Submit for Community Vote</span>
              </button>
            </div>
          </form>
        )}

        {/* List of active reports */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {reports.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px', color: '#64748b', fontSize: '0.85rem' }}>
              No active discrepancies reported. Ground reality matches published guidelines.
            </div>
          ) : (
            reports.map(r => (
              <DiscrepancyVoteCard key={r.id} report={r} onVoted={handleRefresh} />
            ))
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
          <button
            onClick={onClose}
            style={{ padding: '8px 18px', borderRadius: '8px', background: '#475569', color: '#ffffff', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
