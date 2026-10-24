import { X, History, ShieldCheck, ExternalLink } from 'lucide-react';
import { useModalKeyboard } from '../../hooks/useModalKeyboard';
import { getServiceRevisions } from '../../services/serviceChangelogService';
import VersionHistoryTimeline from './VersionHistoryTimeline';

export default function ServiceChangelogModal({ isOpen, onClose, service }) {
  const modalRef = useModalKeyboard(isOpen, onClose);

  if (!isOpen || !service) return null;

  const revisions = getServiceRevisions(service.id);

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
      aria-labelledby="changelog-modal-title"
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
            <History color="#2563eb" size={24} />
            <div>
              <h2 id="changelog-modal-title" style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>
                Official Revisions & Circular History
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

        <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '16px', fontSize: '0.82rem', color: '#475569' }}>
          <ShieldCheck size={16} color="#16a34a" style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '6px' }} />
          Verified against published State and Central Gazette Notifications and Government Orders (G.O.s). Changes are updated within 48 hours of official notification.
        </div>

        <VersionHistoryTimeline revisions={revisions} />

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
          <button
            onClick={onClose}
            style={{ padding: '8px 18px', borderRadius: '8px', background: '#2563eb', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
