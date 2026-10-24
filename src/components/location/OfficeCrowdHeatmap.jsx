import { Users, Clock } from 'lucide-react';
import { getHourlyForecast } from '../../services/officeCrowdForecaster';

export default function OfficeCrowdHeatmap() {
  const forecast = getHourlyForecast();

  const getBarColor = (level) => {
    switch (level) {
      case 'HIGH':
        return '#ef4444';
      case 'MODERATE':
        return '#f59e0b';
      case 'LOW':
        return '#10b981';
      default:
        return '#94a3b8';
    }
  };

  return (
    <div style={{ marginTop: '12px', background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 600, color: '#334155' }}>
          <Users size={14} color="#64748b" />
          <span>Typical Hourly Footfall (9 AM - 5 PM)</span>
        </div>
        <div style={{ display: 'flex', gap: '8px', fontSize: '0.7rem' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></span> Low
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b' }}></span> Mod
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444' }}></span> Peak
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '4px', alignItems: 'flex-end', height: '60px', paddingTop: '10px' }}>
        {forecast.map((f, i) => {
          const heightPct = f.level === 'HIGH' ? 85 : f.level === 'MODERATE' ? 55 : f.level === 'LOW' ? 30 : 15;
          return (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
              <div
                title={`${f.timeLabel}: ${f.label} (~${f.waitMinutes}m wait)`}
                style={{
                  width: '100%',
                  height: `${heightPct}%`,
                  background: getBarColor(f.level),
                  borderRadius: '3px 3px 0 0',
                  transition: 'height 0.3s'
                }}
              />
              <span style={{ fontSize: '0.65rem', color: '#64748b', marginTop: '4px' }}>{f.timeLabel.replace(' ', '')}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
