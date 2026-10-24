import { Link } from 'react-router-dom';
import { Bookmark } from 'lucide-react';

const SavedEmptyState = () => (
  <section
    className="card"
    aria-labelledby="saved-empty-title"
    style={{
      textAlign: 'center',
      padding: 'clamp(2.5rem, 8vw, 5rem) clamp(1rem, 4vw, 2rem)',
      background: 'var(--glass-bg)',
      border: '1px dashed var(--border-main)',
    }}
  >
    <Bookmark size={48} color="var(--text-tertiary)" aria-hidden="true" style={{ margin: '0 auto 1.5rem' }} />
    <h2 id="saved-empty-title" style={{ fontSize: '1.75rem', fontWeight: '800', marginBottom: '0.5rem' }}>
      You have not saved any services yet
    </h2>
    <p
      style={{
        color: 'var(--text-secondary)',
        maxWidth: '450px',
        margin: '0 auto 2rem',
        lineHeight: '1.6',
      }}
    >
      Open any service in the directory and save it here to keep notes, set renewal reminders and organise guides into folders.
    </p>
    <Link to="/services" className="btn btn-primary" style={{ padding: '0.75rem 2rem' }}>
      Browse the services directory
    </Link>
  </section>
);

export default SavedEmptyState;
