import { Award, CheckCircle, HeartPulse, Home, GraduationCap, IndianRupee, Layers } from 'lucide-react';
import { formatInr } from '../../services/welfareEntitlementEngine';

const CATEGORY_ICONS = {
  AGRICULTURE: <Layers size={18} color="#16a34a" />,
  HEALTH: <HeartPulse size={18} color="#dc2626" />,
  HOUSING: <Home size={18} color="#2563eb" />,
  PENSION: <Award size={18} color="#d97706" />,
  EDUCATION: <GraduationCap size={18} color="#7c3aed" />,
  LIVELIHOOD: <IndianRupee size={18} color="#0891b2" />,
  GIRL_CHILD: <HeartPulse size={18} color="#db2777" />
};

export default function EntitlementBreakdownView({ result }) {
  if (!result || !result.eligibleSchemes) return null;

  return (
    <div style={{ marginTop: '20px' }}>
      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '20px' }}>
        <div style={{ background: '#f0fdf4', padding: '16px', borderRadius: '10px', border: '1px solid #bbf7d0' }}>
          <div style={{ fontSize: '0.8rem', color: '#166534', fontWeight: 600 }}>ANNUAL CASH DBT</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#15803d', marginTop: '4px' }}>
            {formatInr(result.totalAnnualCash)}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#166534', marginTop: '2px' }}>Direct to Bank Account</div>
        </div>

        <div style={{ background: '#fef2f2', padding: '16px', borderRadius: '10px', border: '1px solid #fecaca' }}>
          <div style={{ fontSize: '0.8rem', color: '#991b1b', fontWeight: 600 }}>HEALTH INSURANCE</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#b91c1c', marginTop: '4px' }}>
            {formatInr(result.totalHealthCoverage)}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#991b1b', marginTop: '2px' }}>Hospitalization Coverage</div>
        </div>

        <div style={{ background: '#eff6ff', padding: '16px', borderRadius: '10px', border: '1px solid #bfdbfe' }}>
          <div style={{ fontSize: '0.8rem', color: '#1e40af', fontWeight: 600 }}>TOTAL VALUE OF ENTITLEMENTS</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1d4ed8', marginTop: '4px' }}>
            {formatInr(result.totalGrossAnnualValue)}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#1e40af', marginTop: '2px' }}>{result.eligibleCount} Qualifying Schemes</div>
        </div>
      </div>

      {/* Schemes List */}
      <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '12px', color: '#334155' }}>
        Matched Welfare & Subsidy Programs ({result.eligibleCount})
      </h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {result.eligibleSchemes.map((scheme) => (
          <div
            key={scheme.id}
            style={{
              padding: '14px',
              borderRadius: '10px',
              border: '1px solid #e2e8f0',
              background: '#ffffff',
              boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {CATEGORY_ICONS[scheme.category] || <Award size={18} />}
                <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a' }}>{scheme.name}</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ background: '#ecfdf5', color: '#065f46', padding: '4px 8px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700 }}>
                  {scheme.annualBenefitCash > 0
                    ? `${formatInr(scheme.annualBenefitCash)} / yr Cash`
                    : `${formatInr(scheme.annualBenefitInKind)} Coverage`}
                </span>
              </div>
            </div>

            <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '4px' }}>
              {scheme.department}
            </div>
            <p style={{ fontSize: '0.82rem', color: '#334155', margin: '8px 0 0 0', lineHeight: 1.4 }}>
              {scheme.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
