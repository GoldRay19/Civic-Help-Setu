import { useState } from 'react';
import { AlertCircle, Clock, ShieldAlert, ChevronRight, Scale } from 'lucide-react';
import { evaluateApplicationSla } from '../../services/statutorySlaService';
import AppellateEscalationModal from './AppellateEscalationModal';

export default function SlaBreachAlertWidget({ application, citizenName }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!application) return null;

  const sla = evaluateApplicationSla(application);

  if (sla.status === 'WITHIN_SLA') {
    return (
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#16a34a', background: '#f0fdf4', padding: '4px 10px', borderRadius: '12px', fontWeight: 600 }}>
        <Clock size={13} />
        <span>SLA: {sla.daysRemaining} days remaining of {sla.statutoryDays}d statutory limit</span>
      </div>
    );
  }

  if (sla.status === 'APPROACHING_DEADLINE') {
    return (
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#d97706', background: '#fef3c7', padding: '4px 10px', borderRadius: '12px', fontWeight: 600 }}>
        <AlertCircle size={13} />
        <span>SLA Warning: Only {sla.daysRemaining} days left before statutory breach</span>
      </div>
    );
  }

  // SLA_BREACHED
  return (
    <>
      <div
        style={{
          background: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          padding: '8px 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '8px',
          marginTop: '8px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#b91c1c', fontSize: '0.82rem', fontWeight: 600 }}>
          <ShieldAlert size={16} />
          <span>Statutory SLA Breached ({sla.overdueDays} business days overdue)</span>
        </div>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          style={{
            padding: '4px 10px',
            borderRadius: '6px',
            border: 'none',
            background: '#dc2626',
            color: '#ffffff',
            fontSize: '0.76rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          <Scale size={13} />
          <span>File First Appeal</span>
          <ChevronRight size={13} />
        </button>
      </div>

      <AppellateEscalationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        application={application}
        citizenName={citizenName}
      />
    </>
  );
}
