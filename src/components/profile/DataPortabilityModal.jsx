import { Link } from 'react-router-dom';
import PrivacyExportCentre from '../privacy/PrivacyExportCentre';

const DataPortabilityModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  return (
    <div role="dialog" aria-modal="true" aria-label="Secure data export" className="privacy-modal-overlay">
      <div className="privacy-modal-container">
        <button type="button" onClick={onClose} aria-label="Close secure data export">Close</button>
        <PrivacyExportCentre />
        <Link to="/privacy#privacy-centre" onClick={onClose}>Open the full Privacy Centre</Link>
      </div>
    </div>
  );
};

export default DataPortabilityModal;
