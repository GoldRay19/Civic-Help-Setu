import { useState } from 'react';
import { Users, Clock, AlertCircle, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { predictOfficeCrowd } from '../../services/officeCrowdForecaster';
import OfficeCrowdHeatmap from './OfficeCrowdHeatmap';

export default function BestTimeToVisitCard({ office }) {
  const [showHeatmap, setShowHeatmap] = useState(false);
  const crowd = predictOfficeCrowd(office);

  return (
    <div
      style={{
        marginTop: '10px',
        padding: '10px 12px',
        borderRadius: '8px',
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        fontSize: '0.82rem'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span
            style={{
              padding: '3px 8px',
              borderRadius: '6px',
              fontSize: '0.72rem',
              fontWeight: 700,
              color: '#ffffff',
              background: crowd.badgeColor
            }}
          >
            {crowd.badgeText}
          </span>
          <span style={{ color: '#64748b', fontSize: '0.75rem' }}>{crowd.activeDayName}</span>
        </div>

        <button
          type="button"
          onClick={() => setShowHeatmap(!showHeatmap)}
          style={{
            border: 'none',
            background: 'transparent',
            color: '#2563eb',
            cursor: 'pointer',
            fontSize: '0.75rem',
            fontWeight: 600,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '2px',
            padding: 0
          }}
        >
          <span>{showHeatmap ? 'Hide Rush Chart' : 'Rush Heatmap'}</span>
          {showHeatmap ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', marginTop: '6px', color: '#475569', fontSize: '0.78rem' }}>
        <Sparkles size={14} color="#f59e0b" style={{ flexShrink: 0, marginTop: '1px' }} />
        <span>{crowd.recommendation}</span>
      </div>

      {showHeatmap && <OfficeCrowdHeatmap />}
    </div>
  );
}
