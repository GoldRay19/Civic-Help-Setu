import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import AadhaarGuide from '../components/services/AadhaarGuide';

/**
 * AadhaarGuidePage Component
 *
 * Dedicated route view for the Aadhaar Enrolment & Demographic Update Acknowledgement Guide (#530).
 * Accessible via `/services/aadhaar-guide` and `/aadhaar-guide`.
 */
export default function AadhaarGuidePage() {
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

        <AadhaarGuide onBack={() => navigate('/services')} />
      </div>
    </section>
  );
}
