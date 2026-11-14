import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import TreePermissionGuide from '../components/services/TreePermissionGuide';

/**
 * TreePermissionGuidePage Component
 *
 * Dedicated route view for the Tree-Pruning Permission and Urban Tree Protection Guide (#717).
 * Accessible via `/services/tree-permission-guide` and `/tree-permission-guide`.
 */
export default function TreePermissionGuidePage() {
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

        <TreePermissionGuide onBack={() => navigate('/services')} />
      </div>
    </section>
  );
}

