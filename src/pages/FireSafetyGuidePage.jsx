import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import FireSafetyComplianceGuide from '../components/services/FireSafetyComplianceGuide';

/**
 * FireSafetyGuidePage Component
 *
 * Dedicated route view for the Fire NOC and Fire-Safety Compliance Preparation Guide (#719).
 * Accessible via `/services/fire-noc-guide` and `/fire-noc-guide`.
 */
export default function FireSafetyGuidePage() {
  const navigate = useNavigate();

  return (
    <section className="section" style={{ paddingTop: '1.5rem', paddingBottom: '3rem' }}>
      <div className="container">
        <div style={{ marginBottom: '1rem' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate('/services')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.85rem' }}
          >
            <ArrowLeft size={15} />
            <span>Back to All Services</span>
          </button>
        </div>

        <FireSafetyComplianceGuide onBack={() => navigate('/services')} />
      </div>
    </section>
  );
}

