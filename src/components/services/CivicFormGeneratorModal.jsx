import { useState } from 'react';
import { X, FileText, CheckCircle, Sparkles } from 'lucide-react';
import { useModalKeyboard } from '../../hooks/useModalKeyboard';
import { CIVIC_FORM_TEMPLATES } from '../../data/civicFormTemplates';
import { populateFormTemplate } from '../../services/civicFormTemplateEngine';
import FormTemplatePreview from './FormTemplatePreview';

export default function CivicFormGeneratorModal({ isOpen, onClose, defaultService = {} }) {
  const modalRef = useModalKeyboard(isOpen, onClose);

  const [selectedTemplateId, setSelectedTemplateId] = useState(CIVIC_FORM_TEMPLATES[0].id);
  const activeTemplate = CIVIC_FORM_TEMPLATES.find(t => t.id === selectedTemplateId) || CIVIC_FORM_TEMPLATES[0];

  const [fieldValues, setFieldValues] = useState({
    applicantName: 'Applicant Citizen',
    guardianName: '',
    address: '',
    pincode: '',
    contactNumber: '',
    publicAuthority: defaultService.department || 'Competent Authority',
    serviceName: defaultService.title || 'Civic Service',
    applicationNumber: '',
    departmentOffice: defaultService.department || 'Administrative Office',
    particulars: `1. Current processing status and file movement of ${defaultService.title || 'civic application'}.\n2. Certified copies of inspection note and officer remarks.`
  });

  if (!isOpen) return null;

  const handleFieldChange = (key, val) => {
    setFieldValues(prev => ({ ...prev, [key]: val }));
  };

  const filledForm = populateFormTemplate(selectedTemplateId, fieldValues);

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
      aria-labelledby="form-gen-title"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        style={{
          background: 'var(--card-bg, #ffffff)',
          color: 'var(--text-color, #1e293b)',
          borderRadius: '14px',
          width: '100%',
          maxWidth: '720px',
          maxHeight: '92vh',
          overflowY: 'auto',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15)',
          padding: '24px'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText color="#2563eb" size={24} />
            <h2 id="form-gen-title" style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>
              Civic Application & Affidavit Generator
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

        {/* Template Selector */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px' }}>
            Select Standard Administrative Template
          </label>
          <select
            value={selectedTemplateId}
            onChange={(e) => setSelectedTemplateId(e.target.value)}
            style={{
              width: '100%',
              padding: '9px 12px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '0.88rem',
              background: '#ffffff'
            }}
          >
            {CIVIC_FORM_TEMPLATES.map(t => (
              <option key={t.id} value={t.id}>
                {t.title} ({t.act})
              </option>
            ))}
          </select>
        </div>

        {/* Dynamic Form Inputs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
          {activeTemplate.fields.map(field => (
            <div key={field.key} style={{ gridColumn: field.type === 'textarea' ? '1 / -1' : 'auto' }}>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                {field.label} {field.required && <span style={{ color: '#dc2626' }}>*</span>}
              </label>
              {field.type === 'textarea' ? (
                <textarea
                  rows="3"
                  value={fieldValues[field.key] || ''}
                  onChange={(e) => handleFieldChange(field.key, e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                />
              ) : (
                <input
                  type="text"
                  value={fieldValues[field.key] || ''}
                  onChange={(e) => handleFieldChange(field.key, e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                />
              )}
            </div>
          ))}
        </div>

        {/* Form Preview and Export */}
        <FormTemplatePreview filledForm={filledForm} />

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 18px',
              borderRadius: '8px',
              background: '#64748b',
              color: '#ffffff',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.85rem'
            }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
