import { useState } from 'react';
import { Home, Phone, MapPin, Users, CheckCircle, ShieldAlert, Navigation } from 'lucide-react';
import { getReliefShelters } from '../../services/disasterReliefService';

export default function ReliefShelterFinder() {
  const [filterType, setFilterType] = useState('ALL');
  const shelters = getReliefShelters(filterType);

  return (
    <div>
      {/* Category selector */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '14px' }}>
        {['ALL', 'FLOOD', 'HEATWAVE', 'CYCLONE', 'CIVIL_DEFENCE'].map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setFilterType(type)}
            style={{
              padding: '5px 12px',
              borderRadius: '99px',
              border: filterType === type ? '1px solid #dc2626' : '1px solid #cbd5e1',
              background: filterType === type ? '#fee2e2' : '#ffffff',
              color: filterType === type ? '#b91c1c' : '#475569',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            {type.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Shelter cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {shelters.map((shelter) => (
          <div
            key={shelter.id}
            style={{
              background: '#ffffff',
              borderRadius: '8px',
              padding: '12px 14px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '6px' }}>
              <div>
                <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 700, color: '#0f172a' }}>
                  {shelter.name}
                </h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>
                  <MapPin size={13} />
                  <span>{shelter.address}, {shelter.city}</span>
                </div>
              </div>
              <span style={{ background: '#ecfdf5', color: '#047857', padding: '3px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700 }}>
                Capacity: {shelter.capacity} Beds
              </span>
            </div>

            {/* Supplies tags */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '8px' }}>
              {shelter.suppliesAvailable.map((sup, idx) => (
                <span
                  key={idx}
                  style={{
                    fontSize: '0.7rem',
                    background: '#f1f5f9',
                    color: '#334155',
                    padding: '2px 6px',
                    borderRadius: '4px'
                  }}
                >
                  ✓ {sup}
                </span>
              ))}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
              <a
                href={`tel:${shelter.contact}`}
                style={{
                  padding: '5px 10px',
                  borderRadius: '6px',
                  background: '#dc2626',
                  color: '#ffffff',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <Phone size={12} />
                <span>Call Center: {shelter.contact}</span>
              </a>
              <a
                href={`https://maps.google.com/?q=${shelter.lat},${shelter.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  padding: '5px 10px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  color: '#334155',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <Navigation size={12} />
                <span>Navigate</span>
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
