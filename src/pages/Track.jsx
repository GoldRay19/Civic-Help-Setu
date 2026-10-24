import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Search,
  FileText,
  ArrowRight,
  Copy,
  Plus,
  AlertTriangle,
  ShieldCheck,
  MessageSquare,
  Send,
  Compass,
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import {
  getApplications,
  getApplicationById,
  addNoteToApplication,
  resolveApplicationPendingAction,
  getTrackingMetrics,
  getStatusMeta,
  formatDisplayDate,
} from '../services/trackingService';
import ActiveApplicationsSummaryGrid from '../components/tracking/ActiveApplicationsSummaryGrid';
import ApplicationTimeline from '../components/tracking/ApplicationTimeline';
import ActionRequiredAlert from '../components/tracking/ActionRequiredAlert';
import LinkedDocumentsManager from '../components/tracking/LinkedDocumentsManager';
import ManualAddApplicationModal from '../components/tracking/ManualAddApplicationModal';
import TrackingReceiptModal from '../components/tracking/TrackingReceiptModal';
import SlaBreachAlertWidget from '../components/tracking/SlaBreachAlertWidget';

const Track = () => {
  const location = useLocation();
  const { toast } = useToast();

  const [applications, setApplications] = useState(() => getApplications());
  const [metrics, setMetrics] = useState(() => getTrackingMetrics());
  const [appIdInput, setAppIdInput] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [activeApp, setActiveApp] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);

  // Note addition state
  const [newNoteText, setNewNoteText] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isJourneyModalOpen, setIsJourneyModalOpen] = useState(false);

  // Initialize or handle URL query parameters
  useEffect(() => {
    const freshApps = getApplications();
    setApplications(freshApps);
    setMetrics(getTrackingMetrics());

    const searchParams = new URLSearchParams(location.search);
    const queryId = searchParams.get('id') || searchParams.get('ref');

    if (queryId) {
      setAppIdInput(queryId);
      const match = getApplicationById(queryId);
      if (match) {
        setActiveApp(match);
      } else {
        setNotFound(true);
      }
    } else if (freshApps.length > 0) {
      setActiveApp(freshApps[0]);
    }
  }, [location.search]);

  const handleSearch = (e) => {
    e?.preventDefault();
    const query = appIdInput.trim();
    if (!query) {
      toast?.warning?.('Please enter an application reference ID to track status.');
      return;
    }

    setIsSearching(true);
    setNotFound(false);

    setTimeout(() => {
      const match = getApplicationById(query);
      if (match) {
        setActiveApp(match);
        setNotFound(false);
        toast?.success?.(`Application record ${match.id} loaded successfully.`);
      } else {
        setActiveApp(null);
        setNotFound(true);
        toast?.error?.(`No record found matching "${query}".`);
      }
      setIsSearching(false);
    }, 400);
  };

  const handleCopyId = () => {
    if (!activeApp) return;
    navigator.clipboard?.writeText(activeApp.id);
    toast?.info?.(`Reference ID ${activeApp.id} copied to clipboard.`);
  };

  const handleSelectApp = (app) => {
    setActiveApp(app);
    setAppIdInput(app.id);
    setNotFound(false);
  };

  const handleAddNote = (e) => {
    e.preventDefault();
    if (!activeApp || !newNoteText.trim()) return;

    const updated = addNoteToApplication(activeApp.id, newNoteText);
    if (updated) {
      setActiveApp({ ...updated });
      setApplications(getApplications());
      setNewNoteText('');
      toast?.success?.('Note added to application timeline.');
    }
  };

  const handleResolveAction = (appId, resolutionText) => {
    const updated = resolveApplicationPendingAction(appId, resolutionText);
    if (updated) {
      setActiveApp({ ...updated });
      setApplications(getApplications());
      setMetrics(getTrackingMetrics());
      toast?.success?.('Action marked as resolved! Application moved to in-progress verification.');
    }
  };

  const handleDocumentsUpdated = (updatedApp) => {
    setActiveApp({ ...updatedApp });
    setApplications(getApplications());
  };

  const handleApplicationAdded = (newApp) => {
    setApplications(getApplications());
    setMetrics(getTrackingMetrics());
    setActiveApp(newApp);
    setAppIdInput(newApp.id);
  };

  const statusMeta = getStatusMeta(activeApp?.status);

  return (
    <div className="section animate-fade-in" style={{ paddingBottom: '6rem' }}>
      <div className="container" style={{ maxWidth: '900px' }}>
        {/* Header Section */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: 'var(--accent-main)',
              fontSize: '0.875rem',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              marginBottom: '0.5rem',
            }}
          >
            <ShieldCheck size={18} /> Official Civic Service Tracker
          </div>
          <h1 style={{ fontSize: 'clamp(2.25rem, 5vw, 3.25rem)', fontWeight: '800', marginBottom: '0.75rem' }}>
            Application Status & Progress
          </h1>
          <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            Monitor real-time verification stages, departmental approvals, and action deadlines in one place.
          </p>

          <button
            type="button"
            onClick={() => setIsJourneyModalOpen(true)}
            className="btn btn-primary animate-fade-in"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.625rem 1.25rem',
              fontSize: '0.95rem',
              fontWeight: '700',
              borderRadius: '9999px',
              boxShadow: 'var(--shadow-glow, 0 0 20px rgba(56, 189, 248, 0.2))',
            }}
          >
            <Compass size={17} />
            <span>Multi-Service Application Journey Planner (Ordered Checklist)</span>
          </button>
        </div>

        {/* High-level status dashboard metrics */}
        <ActiveApplicationsSummaryGrid
          metrics={metrics}
          applications={applications}
          selectedId={activeApp?.id}
          onSelectApplication={handleSelectApp}
          onOpenAddModal={() => setIsAddModalOpen(true)}
        />

        {/* Reference ID Search Bar */}
        <form
          onSubmit={handleSearch}
          style={{
            display: 'flex',
            gap: '0.75rem',
            marginBottom: '2rem',
            background: 'var(--glass-bg)',
            padding: '0.6rem 0.75rem',
            borderRadius: '99px',
            border: '1px solid var(--border-main)',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          <div style={{ paddingLeft: '1rem', display: 'flex', alignItems: 'center', color: 'var(--text-tertiary)' }}>
            <Search size={22} />
          </div>
          <input
            type="text"
            placeholder="Search by Reference ID (e.g. SRV-98234710)"
            value={appIdInput}
            onChange={(e) => setAppIdInput(e.target.value)}
            className="input-field"
            style={{
              border: 'none',
              background: 'transparent',
              fontSize: '1.05rem',
              flex: 1,
              padding: '0.5rem 0',
              outline: 'none',
            }}
          />
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSearching}
            style={{ padding: '0.75rem 1.75rem', borderRadius: '99px' }}
          >
            {isSearching ? 'Checking...' : 'Track Status'}
          </button>
        </form>

        {/* Not Found View */}
        {notFound && (
          <div
            className="card animate-fade-in"
            style={{
              textAlign: 'center',
              padding: '2.5rem',
              marginBottom: '2rem',
              borderColor: 'rgba(239, 68, 68, 0.3)',
            }}
          >
            <AlertTriangle size={36} color="#ef4444" style={{ margin: '0 auto 1rem' }} />
            <h3 style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '0.5rem' }}>
              Application Reference Not Found
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: '480px', margin: '0 auto 1.5rem' }}>
              We could not find an active filing with reference ID <strong>"{appIdInput}"</strong>. If you applied at an offline office or state portal, you can register it manually.
            </p>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setIsAddModalOpen(true)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <Plus size={16} /> Register Application Manually
            </button>
          </div>
        )}

        {applications.length === 0 && !activeApp && !notFound && (
          <div className="card" style={{ textAlign: 'center', padding: '2.5rem', marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: '800', marginBottom: '0.5rem' }}>No applications tracked yet</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: '480px', margin: '0 auto 1.5rem' }}>
              Enter a reference ID above, or register an application you filed at an office or state portal.
            </p>
            <button type="button" className="btn btn-primary" onClick={() => setIsAddModalOpen(true)}>
              <Plus size={16} /> Add Application
            </button>
          </div>
        )}

        {/* Active Application Detail Card */}
        {activeApp && (
          <div className="card animate-fade-in" style={{ padding: '2rem', borderRadius: '1.25rem' }}>
            {/* Header info */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                borderBottom: '1px solid var(--border-light)',
                paddingBottom: '1.5rem',
                marginBottom: '1.5rem',
                flexWrap: 'wrap',
                gap: '1rem',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
                  <span
                    style={{
                      fontFamily: 'monospace',
                      fontWeight: '800',
                      fontSize: '1.25rem',
                      color: 'var(--accent-main)',
                      letterSpacing: '0.5px',
                    }}
                  >
                    {activeApp.id}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyId}
                    title="Copy reference number"
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-tertiary)',
                      cursor: 'pointer',
                      padding: '0.2rem',
                    }}
                  >
                    <Copy size={16} />
                  </button>
                </div>
                <h2 style={{ fontSize: '1.65rem', fontWeight: '800', margin: '0 0 0.35rem' }}>
                  {activeApp.serviceName}
                </h2>
                <div style={{ display: 'flex', gap: '0.85rem', color: 'var(--text-secondary)', fontSize: '0.85rem', flexWrap: 'wrap' }}>
                  <span>Applicant: <strong>{activeApp.applicantName}</strong></span>
                  <span>•</span>
                  <span>Category: <strong>{activeApp.category}</strong></span>
                  <span>•</span>
                  <span>Applied: <strong>{formatDisplayDate(activeApp.appliedDate)}</strong></span>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span
                  style={{
                    display: 'inline-block',
                    padding: '0.35rem 0.85rem',
                    borderRadius: '99px',
                    fontSize: '0.8rem',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    background: statusMeta.background,
                    color: statusMeta.color,
                    border: `1px solid ${statusMeta.color}`,
                  }}
                >
                  {statusMeta.label}
                </span>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginTop: '0.5rem' }}>
                  Target Delivery: <strong>{formatDisplayDate(activeApp.estimatedCompletion)}</strong>
                </div>
              </div>
            </div>

            {/* Statutory Citizen Charter SLA & Breach Alert */}
            <div style={{ marginBottom: '1.25rem' }}>
              <SlaBreachAlertWidget application={activeApp} citizenName={activeApp.applicantName} />
            </div>

            {/* Action Required Banner if present */}
            {activeApp.pendingAction && (
              <ActionRequiredAlert
                action={activeApp.pendingAction}
                appId={activeApp.id}
                onResolve={handleResolveAction}
              />
            )}

            {/* Application Progress Timeline */}
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '800', marginBottom: '1.25rem', color: 'var(--text-primary)' }}>
                Verification & Approval Workflow
              </h3>

              {activeApp.stages?.length > 0 ? (
                <ApplicationTimeline stages={activeApp.stages} />
              ) : (
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  No progress steps are recorded for this application yet.
                </p>
              )}
            </div>

            {/* Linked Documents Manager */}
            <LinkedDocumentsManager
              appId={activeApp.id}
              linkedDocs={activeApp.linkedDocs || []}
              onDocumentsUpdated={handleDocumentsUpdated}
            />

            {/* Notes & Activity Log Section */}
            <div
              style={{
                marginTop: '1.75rem',
                padding: '1.25rem',
                borderRadius: '0.85rem',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-light)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <MessageSquare size={18} color="var(--accent-main)" />
                  <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '800', color: 'var(--text-primary)' }}>
                    Citizen Filing Notes & Updates ({activeApp.notes?.length || 0})
                  </h4>
                </div>
                
                <button
                  type="button"
                  onClick={() => setShowReceipt(true)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--accent-main)',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    cursor: 'pointer',
                    fontSize: '0.95rem',
                  }}
                >
                  <span>View Official Receipt</span>
                  <ArrowRight size={16} />
                </button>
              </div>

              {/* Existing notes */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1rem' }}>
                {activeApp.notes?.length === 0 ? (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', fontStyle: 'italic', margin: 0 }}>
                    No personal notes recorded yet.
                  </p>
                ) : (
                  activeApp.notes?.map((n) => (
                    <div
                      key={n.id}
                      style={{
                        padding: '0.65rem 0.85rem',
                        borderRadius: '0.5rem',
                        background: 'var(--glass-bg)',
                        border: '1px solid var(--border-light)',
                        fontSize: '0.85rem',
                      }}
                    >
                      <div style={{ color: 'var(--text-primary)', marginBottom: '0.2rem' }}>{n.text}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>{n.date}</div>
                    </div>
                  ))
                )}
              </div>

              {/* Add note input */}
              <form onSubmit={handleAddNote} style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Add a progress note, official name, or token reminder..."
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  style={{ flex: 1, fontSize: '0.85rem' }}
                />
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ padding: '0.45rem 1rem', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                >
                  <Send size={14} /> Add
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Modal for registering external / manual application */}
        <ManualAddApplicationModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onApplicationAdded={handleApplicationAdded}
        />

        {/* Official Receipt Modal */}
        {showReceipt && activeApp && (
          <TrackingReceiptModal
            application={activeApp}
            onClose={() => setShowReceipt(false)}
          />
        )}

        {/* Multi-Service Application Journey Planner Modal */}
        <JourneyPlannerModal
          isOpen={isJourneyModalOpen}
          onClose={() => setIsJourneyModalOpen(false)}
        />
      </div>
    </div>
  );
};

export default Track;