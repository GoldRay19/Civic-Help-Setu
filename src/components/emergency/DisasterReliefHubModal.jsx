import { useState } from 'react';
import { X, ShieldAlert, CheckSquare, Home, Share2, Copy, Check, Radio } from 'lucide-react';
import { useModalKeyboard } from '../../hooks/useModalKeyboard';
import { getSurvivalChecklist, generateEmergencySosSms } from '../../services/disasterReliefService';
import ReliefShelterFinder from './ReliefShelterFinder';

export default function DisasterReliefHubModal({ isOpen, onClose }) {
  const modalRef = useModalKeyboard(isOpen, onClose);
  const [activeTab, setActiveTab] = useState('shelters');
  const [copied, setCopied] = useState(false);
  const checklist = getSurvivalChecklist();

  if (!isOpen) return null;

  const sampleSms = generateEmergencySosSms('Zonal Emergency Center', 'Me');

  const handleCopySms = () => {
    navigator.clipboard.writeText(sampleSms);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '16px'
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="disaster-hub-title"
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
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
          padding: '24px'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldAlert color="#dc2626" size={24} />
            <div>
              <h2 id="disaster-hub-title" style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>
                Disaster Relief Shelters & Offline Preparedness Hub
              </h2>
              <div style={{ fontSize: '0.78rem', color: '#16a34a', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#16a34a' }}></span>
                Cached for 100% Offline Resilience
              </div>
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

        {/* Tab Switcher */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
          <button
            type="button"
            onClick={() => setActiveTab('shelters')}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              border: 'none',
              background: activeTab === 'shelters' ? '#dc2626' : '#f1f5f9',
              color: activeTab === 'shelters' ? '#ffffff' : '#475569',
              fontWeight: 600,
              fontSize: '0.82rem',
              cursor: 'pointer'
            }}
          >
            Emergency Relief Camps
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('checklist')}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              border: 'none',
              background: activeTab === 'checklist' ? '#dc2626' : '#f1f5f9',
              color: activeTab === 'checklist' ? '#ffffff' : '#475569',
              fontWeight: 600,
              fontSize: '0.82rem',
              cursor: 'pointer'
            }}
          >
            Survival Grab-Bag Checklist
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('sos')}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              border: 'none',
              background: activeTab === 'sos' ? '#dc2626' : '#f1f5f9',
              color: activeTab === 'sos' ? '#ffffff' : '#475569',
              fontWeight: 600,
              fontSize: '0.82rem',
              cursor: 'pointer'
            }}
          >
            Quick Offline SMS Template
          </button>
        </div>

        {/* Tab 1: Shelters */}
        {activeTab === 'shelters' && <ReliefShelterFinder />}

        {/* Tab 2: Survival Checklist */}
        {activeTab === 'checklist' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '6px' }}>
              Pack these items in a sealed waterproof bag before flood/cyclone evacuation:
            </div>
            {checklist.map((item) => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: '#f8fafc',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #e2e8f0',
                  fontSize: '0.82rem'
                }}
              >
                <input type="checkbox" id={item.id} style={{ cursor: 'pointer' }} />
                <label htmlFor={item.id} style={{ cursor: 'pointer', flex: 1, color: item.essential ? '#0f172a' : '#475569', fontWeight: item.essential ? 600 : 400 }}>
                  {item.item}
                </label>
                {item.essential && (
                  <span style={{ fontSize: '0.7rem', color: '#dc2626', background: '#fee2e2', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>
                    ESSENTIAL
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Tab 3: SOS SMS Broadcast */}
        {activeTab === 'sos' && (
          <div>
            <div style={{ fontSize: '0.82rem', color: '#475569', marginBottom: '10px' }}>
              When mobile network or data connectivity is weak, copy and send this short SMS template via basic 2G cellular SMS to family members:
            </div>
            <pre style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.82rem', whiteSpace: 'pre-wrap', color: '#0f172a' }}>
              {sampleSms}
            </pre>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
              <button
                type="button"
                onClick={handleCopySms}
                style={{ padding: '6px 14px', borderRadius: '6px', border: 'none', background: '#dc2626', color: '#fff', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                <span>{copied ? 'Copied to Clipboard' : 'Copy SMS Text'}</span>
              </button>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '18px' }}>
          <button
            onClick={onClose}
            style={{ padding: '8px 18px', borderRadius: '8px', background: '#475569', color: '#ffffff', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}
          >
            Close Hub
          </button>
        </div>
      </div>
    </div>
  );
}
