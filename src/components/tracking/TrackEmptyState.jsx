import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';

const STEPS = [
  'Apply for a service. Our guides in the directory show where and how.',
  'Copy the reference or receipt ID you get after applying.',
  'Paste it into the search box above, or add the application manually.',
];

const TrackEmptyState = ({ onAdd }) => (
  <section
    className="card"
    aria-labelledby="track-empty-title"
    style={{ textAlign: 'center', padding: 'clamp(1.5rem, 5vw, 2.5rem)', marginBottom: '2rem' }}
  >
    <h2 id="track-empty-title" style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '0.5rem' }}>
      No applications tracked yet
    </h2>
    <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: '480px', margin: '0 auto 1.25rem' }}>
      Track an application to see its stages, deadlines and any action needed from you.
    </p>
    <ol
      style={{
        textAlign: 'left',
        color: 'var(--text-secondary)',
        fontSize: '0.95rem',
        lineHeight: '1.6',
        maxWidth: '480px',
        margin: '0 auto 1.5rem',
        paddingLeft: '1.25rem',
      }}
    >
      {STEPS.map((step) => (
        <li key={step}>{step}</li>
      ))}
    </ol>
    <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
      <button type="button" className="btn btn-primary" onClick={onAdd}>
        <Plus size={16} aria-hidden="true" /> Add Application
      </button>
      <Link to="/services" className="btn btn-secondary">
        Browse the services directory
      </Link>
    </div>
  </section>
);

export default TrackEmptyState;
