import { useState } from 'react';
import { X, Calculator, Sparkles, User, Briefcase, FileText } from 'lucide-react';
import { useModalKeyboard } from '../../hooks/useModalKeyboard';
import { calculateCitizenEntitlements } from '../../services/welfareEntitlementEngine';
import EntitlementBreakdownView from './EntitlementBreakdownView';

export default function EntitlementCalculatorModal({ isOpen, onClose }) {
  const modalRef = useModalKeyboard(isOpen, onClose);

  const [formData, setFormData] = useState({
    age: 32,
    annualIncome: 180000,
    occupation: 'farmer',
    category: 'OBC',
    isStudent: false,
    hasPuccaHouse: false,
    isFarmer: true,
    hasDaughterUnder10: false,
    hasDisability: false
  });

  const [result, setResult] = useState(() => calculateCitizenEntitlements(formData));

  if (!isOpen) return null;

  const handleChange = (field, value) => {
    const updated = { ...formData, [field]: value };
    setFormData(updated);
    setResult(calculateCitizenEntitlements(updated));
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
      aria-labelledby="entitlement-modal-title"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        style={{
          background: 'var(--card-bg, #ffffff)',
          color: 'var(--text-color, #1e293b)',
          borderRadius: '14px',
          width: '100%',
          maxWidth: '740px',
          maxHeight: '92vh',
          overflowY: 'auto',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15)',
          padding: '24px'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calculator color="#16a34a" size={24} />
            <h2 id="entitlement-modal-title" style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>
              Citizen Welfare & Subsidy Benefit Maximizer
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

        {/* Input Parameters Form */}
        <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
              Citizen Age
            </label>
            <input
              type="number"
              min="0"
              max="120"
              value={formData.age}
              onChange={(e) => handleChange('age', parseInt(e.target.value, 10) || 0)}
              style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
              Annual Family Income (₹)
            </label>
            <input
              type="number"
              step="10000"
              value={formData.annualIncome}
              onChange={(e) => handleChange('annualIncome', parseInt(e.target.value, 10) || 0)}
              style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
              Social Category
            </label>
            <select
              value={formData.category}
              onChange={(e) => handleChange('category', e.target.value)}
              style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.88rem', background: '#fff' }}
            >
              <option value="GENERAL">General</option>
              <option value="OBC">OBC</option>
              <option value="SC">SC</option>
              <option value="ST">ST</option>
              <option value="BPL">BPL / Antyodaya</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
              Primary Occupation
            </label>
            <select
              value={formData.occupation}
              onChange={(e) => {
                const val = e.target.value;
                const isF = val === 'farmer';
                const isS = val === 'student';
                const updated = { ...formData, occupation: val, isFarmer: isF, isStudent: isS };
                setFormData(updated);
                setResult(calculateCitizenEntitlements(updated));
              }}
              style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.88rem', background: '#fff' }}
            >
              <option value="farmer">Farmer / Agriculture</option>
              <option value="student">Student</option>
              <option value="self-employed">Micro-Vendor / Self-Employed</option>
              <option value="retired">Senior Citizen / Retired</option>
              <option value="wage-laborer">Daily Wage Laborer</option>
              <option value="general">Salaried / Other</option>
            </select>
          </div>
        </div>

        {/* Situational Flags */}
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '12px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={formData.hasPuccaHouse}
              onChange={(e) => handleChange('hasPuccaHouse', e.target.checked)}
            />
            <span>Owns a Pucca House</span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={formData.hasDaughterUnder10}
              onChange={(e) => handleChange('hasDaughterUnder10', e.target.checked)}
            />
            <span>Has Daughter under 10 yrs</span>
          </label>
        </div>

        {/* Calculated Breakdown View */}
        <EntitlementBreakdownView result={result} />

        {/* Close button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 20px',
              borderRadius: '8px',
              background: '#16a34a',
              color: '#ffffff',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.9rem'
            }}
          >
            Close Calculator
          </button>
        </div>
      </div>
    </div>
  );
}
