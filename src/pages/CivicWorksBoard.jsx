import { useState, useMemo } from 'react';
import {
  MapPin,
  ShieldCheck,
  Clock,
  FilePlus2,
  Edit3,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Building2,
  GitMerge,
  Eye,
  EyeOff,
  Camera,
  ChevronDown,
  ChevronUp,
  Search,
  Lock,
} from 'lucide-react';
import StandardPageHeader from '../components/common/StandardPageHeader';
import CivicWorksModeratorPanel from '../components/civicWorks/CivicWorksModeratorPanel';
import {
  CIVIC_WORK_CATEGORIES,
  CIVIC_WORK_CATEGORY_LABELS,
  CIVIC_WORK_STATES,
  CIVIC_WORK_STATE_LABELS,
  BOARD_GOVERNANCE_NOTICE,
  ALLOWED_MEDIA_MIME_TYPES,
  MAX_MEDIA_BYTES,
  ensureCivicWorksSeedData,
  listPublicCivicWorkReports,
  submitCivicWorkReport,
  editCivicWorkReport,
  withdrawCivicWorkReport,
  getClusterDetail,
  isSafeMediaUrl,
} from '../services/civicWorksBoardService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { can } from '../services/accessControl';

const LOCAL_REPORTER_KEY = 'civicbridge_civic_works_reporter_id';

function getOrCreateLocalReporterId() {
  try {
    const existing = globalThis.localStorage?.getItem(LOCAL_REPORTER_KEY);
    if (existing) return existing;
    const generated = `resident_${Math.random().toString(36).slice(2, 10)}`;
    globalThis.localStorage?.setItem(LOCAL_REPORTER_KEY, generated);
    return generated;
  } catch {
    return 'resident_session';
  }
}

const SOURCE_BADGE_STYLES = {
  citizen: { label: 'Citizen Report', bg: 'rgba(14, 165, 233, 0.14)', color: 'var(--accent-main)' },
  moderator: { label: 'Moderator', bg: 'rgba(168, 85, 247, 0.14)', color: '#a855f7' },
  official: { label: 'Official Desk', bg: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' },
  community_verifier: { label: 'Community Verifier', bg: 'rgba(16, 185, 129, 0.16)', color: '#10b981' },
};

const STATE_BADGE_STYLES = {
  [CIVIC_WORK_STATES.SUBMITTED]: { bg: 'rgba(148, 163, 184, 0.16)', color: 'var(--text-secondary)' },
  [CIVIC_WORK_STATES.UNDER_REVIEW]: { bg: 'rgba(168, 85, 247, 0.16)', color: '#c084fc' },
  [CIVIC_WORK_STATES.FORWARDED]: { bg: 'rgba(56, 189, 248, 0.16)', color: 'var(--accent-main)' },
  [CIVIC_WORK_STATES.WORK_REPORTED]: { bg: 'rgba(245, 158, 11, 0.16)', color: '#f59e0b' },
  [CIVIC_WORK_STATES.INDEPENDENTLY_CONFIRMED]: { bg: 'rgba(16, 185, 129, 0.16)', color: '#10b981' },
  [CIVIC_WORK_STATES.WITHDRAWN]: { bg: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' },
};

const EMPTY_FORM = {
  editingId: null,
  category: CIVIC_WORK_CATEGORIES.ROAD_DAMAGE,
  ward: '',
  locality: '',
  approximateLandmark: '',
  exactLat: '',
  exactLng: '',
  title: '',
  description: '',
  mediaUrl: '',
  mediaMimeType: 'image/jpeg',
  mediaCaption: '',
  publicationConsent: false,
  locationRedactionAccepted: true,
  mediaConsent: false,
};

const CivicWorksBoard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const isModerator = can('civicWorks.moderate');
  const reporterId = useMemo(() => user?.id || getOrCreateLocalReporterId(), [user]);

  const [refreshTick, setRefreshTick] = useState(() => {
    ensureCivicWorksSeedData();
    return 0;
  });
  const [wardFilter, setWardFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [includeWithdrawn, setIncludeWithdrawn] = useState(false);
  const [showModeratorQueue, setShowModeratorQueue] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [formState, setFormState] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [duplicateAlert, setDuplicateAlert] = useState([]);
  const [expandedHistoryIds, setExpandedHistoryIds] = useState({});
  const [expandedClusterId, setExpandedClusterId] = useState(null);
  const [withdrawTargetId, setWithdrawTargetId] = useState(null);
  const [withdrawReason, setWithdrawReason] = useState('');

  const boardData = useMemo(() => {
    void refreshTick;
    return listPublicCivicWorkReports({
      ward: wardFilter,
      category: categoryFilter,
      status: statusFilter,
      search: searchQuery,
      includeWithdrawn,
      viewer: { reporterId, isModerator },
    });
  }, [refreshTick, wardFilter, categoryFilter, statusFilter, searchQuery, includeWithdrawn, reporterId, isModerator]);

  const allWards = useMemo(() => {
    void refreshTick;
    const unfiltered = listPublicCivicWorkReports({ viewer: { reporterId, isModerator } });
    return unfiltered.wardGroups.map((g) => g.ward);
  }, [refreshTick, reporterId, isModerator]);

  const activeClusterDetail = useMemo(() => {
    if (!expandedClusterId) return null;
    void refreshTick;
    return getClusterDetail(expandedClusterId, { reporterId, isModerator });
  }, [expandedClusterId, refreshTick, reporterId, isModerator]);

  const openNewReportForm = () => {
    setFormState(EMPTY_FORM);
    setFormError('');
    setDuplicateAlert([]);
    setShowFormModal(true);
  };

  const openEditReportForm = (rep) => {
    setFormState({
      editingId: rep.id,
      category: rep.category,
      ward: rep.coarseLocation.ward,
      locality: rep.coarseLocation.locality,
      approximateLandmark: rep.coarseLocation.approximateLandmark || '',
      exactLat: '',
      exactLng: '',
      title: rep.title,
      description: rep.description,
      mediaUrl: rep.media[0]?.url || '',
      mediaMimeType: rep.media[0]?.mimeType || 'image/jpeg',
      mediaCaption: rep.media[0]?.caption || '',
      publicationConsent: true,
      locationRedactionAccepted: true,
      mediaConsent: Boolean(rep.media.length > 0),
    });
    setFormError('');
    setDuplicateAlert([]);
    setShowFormModal(true);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ALLOWED_MEDIA_MIME_TYPES.includes(file.type)) {
      setFormError('Only JPEG, PNG, or WebP images are permitted.');
      return;
    }
    if (file.size > MAX_MEDIA_BYTES) {
      setFormError('Image exceeds the 5 MB upload limit.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setFormState((prev) => ({
          ...prev,
          mediaUrl: reader.result,
          mediaMimeType: file.type,
        }));
        setFormError('');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    setFormError('');

    try {
      const hasCoords = formState.exactLat.trim() !== '' && formState.exactLng.trim() !== '';
      const exactCoordinates = hasCoords
        ? { lat: Number(formState.exactLat), lng: Number(formState.exactLng) }
        : null;

      const media = formState.mediaUrl.trim()
        ? [
            {
              mimeType: formState.mediaMimeType || 'image/jpeg',
              sizeBytes: 24000,
              url: formState.mediaUrl.trim(),
              caption: formState.mediaCaption.trim() || 'Citizen uploaded issue photo',
            },
          ]
        : [];

      if (formState.editingId) {
        const res = editCivicWorkReport(
          formState.editingId,
          {
            category: formState.category,
            ward: formState.ward,
            locality: formState.locality,
            approximateLandmark: formState.approximateLandmark,
            ...(hasCoords ? { exactCoordinates } : {}),
            title: formState.title,
            description: formState.description,
            mediaConsent: formState.mediaConsent,
            media,
          },
          { reporterId }
        );
        setRefreshTick((t) => t + 1);
        setShowFormModal(false);
        toast?.success?.(
          res.moderationStatus === 'pending_moderation'
            ? 'Report updated and queued for moderation review.'
            : 'Report updated.'
        );
      } else {
        const res = submitCivicWorkReport({
          reporterId,
          reporterLabel: user?.username || 'Ward Resident',
          category: formState.category,
          ward: formState.ward,
          locality: formState.locality,
          approximateLandmark: formState.approximateLandmark,
          exactCoordinates,
          title: formState.title,
          description: formState.description,
          media,
          consent: {
            publicationConsent: formState.publicationConsent,
            locationRedactionAccepted: formState.locationRedactionAccepted,
            mediaConsent: formState.mediaConsent,
          },
        });
        setDuplicateAlert(res.duplicateCandidates || []);
        setRefreshTick((t) => t + 1);
        setShowFormModal(false);
        toast?.success?.(`Report ${res.trackingCode} submitted for moderation (exact location kept private).`);
      }
    } catch (err) {
      setFormError(err.message);
    }
  };

  const handleConfirmWithdraw = (e) => {
    e.preventDefault();
    if (!withdrawTargetId) return;
    try {
      withdrawCivicWorkReport(withdrawTargetId, {
        reporterId,
        reason: withdrawReason.trim() || 'Issue resolved / withdrawn by resident',
      });
      setWithdrawTargetId(null);
      setWithdrawReason('');
      setRefreshTick((t) => t + 1);
      toast?.success?.('Report withdrawn. Public media hidden while audit timestamps remain.');
    } catch (err) {
      toast?.error?.(err.message);
    }
  };

  const toggleHistory = (id) => {
    setExpandedHistoryIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="section animate-fade-in civic-works-board-page" style={{ paddingBottom: '6rem', maxWidth: '100%', overflowX: 'hidden' }}>
      <div className="container" style={{ maxWidth: '1200px', minWidth: 0 }}>
        <StandardPageHeader
          eyebrow="Ward Accountability"
          eyebrowIcon={<MapPin size={16} />}
          badgeText="Coarse Location • Evidence-Gated"
          badgeType="accent"
          title="Ward Public Works & Asset Follow-Up Board"
          subtitle="Track road repairs, streetlights, drainage, and civic facility issues grouped by ward with transparent timestamps, official vs citizen attribution, and strict location privacy."
        >
          <button
            type="button"
            onClick={openNewReportForm}
            className="btn btn-primary"
            style={{ padding: '0.7rem 1.35rem', fontSize: '0.95rem' }}
          >
            <FilePlus2 size={18} /> Submit Ward Report
          </button>

          {isModerator && (
            <button
              type="button"
              onClick={() => setShowModeratorQueue((v) => !v)}
              className="btn btn-secondary"
              style={{ padding: '0.7rem 1.25rem', fontSize: '0.92rem' }}
            >
              <ShieldCheck size={18} />
              {showModeratorQueue ? 'Hide Moderator Queue' : 'Moderator Review Queue'}
            </button>
          )}
        </StandardPageHeader>

        {/* Privacy & Verification Distinction Notice */}
        <div
          className="card"
          role="note"
          aria-label="Board Privacy and Verification Rules"
          style={{
            padding: '1rem 1.25rem',
            marginBottom: '1.5rem',
            borderColor: 'rgba(56, 189, 248, 0.35)',
            background: 'rgba(56, 189, 248, 0.06)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.85rem',
          }}
        >
          <Lock size={20} color="var(--accent-main)" style={{ flexShrink: 0, marginTop: '0.15rem' }} />
          <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.55' }}>
            <strong style={{ color: 'var(--text-primary)' }}>Privacy &amp; Verification Standard: </strong>
            {BOARD_GOVERNANCE_NOTICE}
          </div>
        </div>

        {/* Summary Metrics Strip */}
        <div className="grid-4" style={{ gap: '1rem', marginBottom: '1.75rem' }}>
          <div className="card" style={{ padding: '1.15rem' }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: '700' }}>Active Ward Reports</div>
            <div style={{ fontSize: '1.75rem', fontWeight: '800', marginTop: '0.2rem' }}>{boardData.summary.totalReports}</div>
          </div>
          <div className="card" style={{ padding: '1.15rem' }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: '700' }}>Wards Tracked</div>
            <div style={{ fontSize: '1.75rem', fontWeight: '800', marginTop: '0.2rem' }}>{boardData.summary.wardCount}</div>
          </div>
          <div className="card" style={{ padding: '1.15rem' }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: '700' }}>Officially Acknowledged</div>
            <div style={{ fontSize: '1.75rem', fontWeight: '800', marginTop: '0.2rem', color: 'var(--accent-main)' }}>{boardData.summary.officiallyAcknowledgedCount}</div>
          </div>
          <div className="card" style={{ padding: '1.15rem' }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: '700' }}>Independently Confirmed</div>
            <div style={{ fontSize: '1.75rem', fontWeight: '800', marginTop: '0.2rem', color: '#10b981' }}>{boardData.summary.independentlyConfirmedCount}</div>
          </div>
        </div>

        {/* Possible Duplicate Notification Banner right after Citizen Submission */}
        {duplicateAlert.length > 0 && (
          <div
            className="card"
            style={{
              padding: '1rem 1.25rem',
              marginBottom: '1.5rem',
              borderColor: 'rgba(245, 158, 11, 0.4)',
              background: 'rgba(245, 158, 11, 0.08)',
            }}
          >
            <strong style={{ color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <GitMerge size={17} /> Possible Similar Reports Found in Your Ward
            </strong>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', margin: '0.3rem 0 0' }}>
              Moderators will review clustering with: {duplicateAlert.map((d) => `${d.trackingCode} (${Math.round(d.confidence * 100)}% match)`).join(', ')}. Both reports keep their independent histories.
            </p>
          </div>
        )}

        {/* Moderator Queue */}
        {isModerator && showModeratorQueue && (
          <div style={{ marginBottom: '2rem' }}>
            <CivicWorksModeratorPanel onUpdated={() => setRefreshTick((t) => t + 1)} />
          </div>
        )}

        {/* Filters Toolbar */}
        <div
          className="card"
          style={{
            padding: '1.15rem',
            marginBottom: '2rem',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(180px, 100%), 1fr))',
            gap: '0.75rem',
            alignItems: 'center',
            minWidth: 0,
            maxWidth: '100%',
          }}
        >
          <div style={{ position: 'relative', minWidth: 0 }}>
            <Search size={16} style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
            <input
              type="search"
              aria-label="Search civic works reports"
              placeholder="Search landmark, title, code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field"
              style={{ padding: '0.6rem 0.9rem 0.6rem 2.2rem', fontSize: '0.9rem', borderRadius: '0.65rem', minWidth: 0, width: '100%' }}
            />
          </div>

          <select
            aria-label="Filter by Ward"
            value={wardFilter}
            onChange={(e) => setWardFilter(e.target.value)}
            className="input-field"
            style={{ padding: '0.6rem 0.9rem', fontSize: '0.9rem', borderRadius: '0.65rem', minWidth: 0, width: '100%' }}
          >
            <option value="">All Wards / Localities</option>
            {allWards.map((w) => (
              <option key={w} value={w}>{w}</option>
            ))}
          </select>

          <select
            aria-label="Filter by Category"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="input-field"
            style={{ padding: '0.6rem 0.9rem', fontSize: '0.9rem', borderRadius: '0.65rem', minWidth: 0, width: '100%' }}
          >
            <option value="">All Asset Categories</option>
            {Object.entries(CIVIC_WORK_CATEGORY_LABELS).map(([k, label]) => (
              <option key={k} value={k}>{label}</option>
            ))}
          </select>

          <select
            aria-label="Filter by Status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field"
            style={{ padding: '0.6rem 0.9rem', fontSize: '0.9rem', borderRadius: '0.65rem', minWidth: 0, width: '100%' }}
          >
            <option value="">All Lifecycle States</option>
            {Object.entries(CIVIC_WORK_STATE_LABELS).map(([k, label]) => (
              <option key={k} value={k}>{label}</option>
            ))}
          </select>

          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.85rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={includeWithdrawn}
              onChange={(e) => setIncludeWithdrawn(e.target.checked)}
            />
            <span>Include withdrawn history</span>
          </label>
        </div>

        {/* Cluster Comparison Drawer */}
        {activeClusterDetail && (
          <div
            className="card"
            role="region"
            aria-label={`Cluster ${activeClusterDetail.clusterId} Preserved Histories`}
            style={{
              padding: '1.5rem',
              marginBottom: '2rem',
              borderColor: 'var(--accent-main)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div>
                <h2 style={{ fontSize: '1.15rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <GitMerge size={18} color="var(--accent-main)" /> Duplicate Cluster {activeClusterDetail.clusterId} ({activeClusterDetail.memberCount} Preserved Reports)
                </h2>
                <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0' }}>
                  {activeClusterDetail.reason}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setExpandedClusterId(null)}
                className="btn btn-secondary"
                style={{ padding: '0.4rem 0.85rem', fontSize: '0.82rem' }}
              >
                Close Cluster View
              </button>
            </div>
            <div className="grid-2" style={{ gap: '1rem' }}>
              {activeClusterDetail.memberReports.map((member) => (
                <div
                  key={member.id}
                  style={{
                    padding: '1rem',
                    borderRadius: '0.75rem',
                    border: '1px solid var(--border-main)',
                    background: 'var(--bg-secondary)',
                  }}
                >
                  <div style={{ fontWeight: '700', fontSize: '0.92rem' }}>
                    {member.trackingCode} • {member.title}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', marginBottom: '0.5rem' }}>
                    Preserved Timeline ({member.statusHistory.length} events)
                  </div>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    {member.statusHistory.map((h) => (
                      <li key={h.id} style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        <strong>{h.stateLabel}</strong> ({h.actorLabel}) — {h.note}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Ward-Grouped Public Reports */}
        {boardData.wardGroups.length === 0 ? (
          <div className="card" style={{ padding: '2.5rem', textAlign: 'center' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.5rem' }}>
              No civic work reports match these filters
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              Try clearing your filters or submit a new ward-level infrastructure report.
            </p>
            <button type="button" onClick={openNewReportForm} className="btn btn-primary" style={{ padding: '0.65rem 1.25rem', fontSize: '0.92rem' }}>
              Submit First Ward Report
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {boardData.wardGroups.map((group) => (
              <section
                key={group.ward}
                aria-label={group.ward}
                className="card"
                style={{ padding: '1.5rem' }}
              >
                {/* Ward Group Header */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '0.75rem',
                    paddingBottom: '1rem',
                    marginBottom: '1.25rem',
                    borderBottom: '1px solid var(--border-main)',
                  }}
                >
                  <div>
                    <h2 style={{ fontSize: '1.35rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <MapPin size={20} color="var(--accent-main)" /> {group.ward}
                    </h2>
                    <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0' }}>
                      Localities: {group.localities.join(', ')}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span style={{ padding: '0.25rem 0.65rem', borderRadius: '99px', fontSize: '0.76rem', fontWeight: '700', background: 'var(--glass-bg)', border: '1px solid var(--border-light)' }}>
                      {group.counts.total} Report{group.counts.total === 1 ? '' : 's'}
                    </span>
                    <span style={{ padding: '0.25rem 0.65rem', borderRadius: '99px', fontSize: '0.76rem', fontWeight: '700', background: 'rgba(56, 189, 248, 0.14)', color: 'var(--accent-main)' }}>
                      {group.counts.officiallyAcknowledged} Official Ack
                    </span>
                    <span style={{ padding: '0.25rem 0.65rem', borderRadius: '99px', fontSize: '0.76rem', fontWeight: '700', background: 'rgba(16, 185, 129, 0.14)', color: '#10b981' }}>
                      {group.counts.independently_confirmed} Verified Done
                    </span>
                  </div>
                </div>

                {/* Reports inside Ward */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                  {group.reports.map((rep) => {
                    const stateStyle = STATE_BADGE_STYLES[rep.status] || STATE_BADGE_STYLES.submitted;
                    const historyOpen = Boolean(expandedHistoryIds[rep.id]);
                    const isLocalOwner =
                      rep.statusHistory.some((h) => h.state === CIVIC_WORK_STATES.SUBMITTED) &&
                      rep.moderationStatus !== 'rejected';

                    return (
                      <article
                        key={rep.id}
                        style={{
                          padding: '1.25rem',
                          borderRadius: '0.9rem',
                          border: '1px solid var(--border-main)',
                          background: 'var(--bg-secondary)',
                        }}
                      >
                        {/* Top Metadata Badges */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.6rem', marginBottom: '0.65rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <span style={{ fontWeight: '800', fontSize: '0.82rem', padding: '0.2rem 0.55rem', borderRadius: '0.4rem', background: 'var(--glass-bg)', border: '1px solid var(--border-main)' }}>
                              {rep.trackingCode}
                            </span>
                            <span style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--accent-main)' }}>
                              {rep.categoryLabel}
                            </span>
                            <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: '99px', fontWeight: '700', background: stateStyle.bg, color: stateStyle.color }}>
                              {rep.statusLabel}
                            </span>
                            {rep.moderationStatus !== 'approved' && (
                              <span style={{ fontSize: '0.74rem', padding: '0.2rem 0.55rem', borderRadius: '99px', fontWeight: '700', background: 'rgba(245, 158, 11, 0.16)', color: '#f59e0b' }}>
                                Pending Moderation ({rep.moderationStatus})
                              </span>
                            )}
                          </div>

                          <span style={{ fontSize: '0.76rem', color: 'var(--text-tertiary)', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                            <Lock size={12} /> Coarse Grid: {rep.coarseLocation.geoBucket}
                          </span>
                        </div>

                        <h3 style={{ fontSize: '1.12rem', fontWeight: '700', marginBottom: '0.35rem' }}>
                          {rep.title}
                        </h3>
                        <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', lineHeight: '1.55' }}>
                          {rep.description}
                        </p>

                        <div style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)', marginBottom: '0.85rem' }}>
                          <strong>Approximate Location:</strong> {rep.coarseLocation.locality}
                          {rep.coarseLocation.approximateLandmark ? ` • ${rep.coarseLocation.approximateLandmark}` : ''}
                          {' '}(exact street coordinates redacted)
                        </div>

                        {/* Citizen vs Official Distinction & Verification Callout */}
                        <div
                          style={{
                            padding: '0.75rem 0.95rem',
                            borderRadius: '0.65rem',
                            border: '1px solid var(--border-light)',
                            background: rep.verification.isIndependentlyConfirmed
                              ? 'rgba(16, 185, 129, 0.09)'
                              : rep.officialAcknowledgement.acknowledged
                                ? 'rgba(56, 189, 248, 0.08)'
                                : 'rgba(245, 158, 11, 0.08)',
                            marginBottom: '0.85rem',
                            fontSize: '0.84rem',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontWeight: '700' }}>
                            {rep.verification.isIndependentlyConfirmed ? (
                              <CheckCircle2 size={16} color="#10b981" />
                            ) : rep.officialAcknowledgement.acknowledged ? (
                              <Building2 size={16} color="var(--accent-main)" />
                            ) : (
                              <AlertCircle size={16} color="#f59e0b" />
                            )}
                            <span>{rep.verification.label}</span>
                          </div>

                          {rep.officialAcknowledgement.acknowledged && (
                            <div style={{ marginTop: '0.3rem', color: 'var(--text-secondary)' }}>
                              Department: <strong>{rep.officialAcknowledgement.department}</strong>
                              {rep.officialAcknowledgement.referenceNumber ? ` • Ref: ${rep.officialAcknowledgement.referenceNumber}` : ''}
                              {rep.officialAcknowledgement.assignedUnit ? ` • Assigned: ${rep.officialAcknowledgement.assignedUnit}` : ''}
                            </div>
                          )}

                          {rep.completionVerification.verified && (
                            <div style={{ marginTop: '0.3rem', color: '#10b981' }}>
                              Verified by <strong>{rep.completionVerification.verifierLabel}</strong>: {rep.completionVerification.evidenceNote}
                            </div>
                          )}
                        </div>

                        {/* Media / Privacy Access Status */}
                        {(rep.media.length > 0 || rep.redactedMediaCount > 0) && (
                          <div style={{ marginBottom: '0.85rem' }}>
                            <div style={{ fontSize: '0.8rem', fontWeight: '700', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-secondary)' }}>
                              <Camera size={14} /> Documented Evidence ({rep.media.length} visible
                              {rep.redactedMediaCount > 0 ? `, ${rep.redactedMediaCount} withheld for consent/moderation` : ''})
                            </div>

                            {rep.media.length > 0 ? (
                              <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
                                {rep.media.map((m) => (
                                  <div
                                    key={m.id}
                                    style={{
                                      width: '160px',
                                      borderRadius: '0.55rem',
                                      overflow: 'hidden',
                                      border: '1px solid var(--border-main)',
                                      background: 'var(--bg-main)',
                                    }}
                                  >
                                    {isSafeMediaUrl(m.url) && (
                                      <img
                                        src={m.url}
                                        alt={m.caption || 'Civic work evidence'}
                                        loading="lazy"
                                        style={{ width: '100%', height: '92px', objectFit: 'cover', display: 'block' }}
                                      />
                                    )}
                                    <div style={{ padding: '0.35rem 0.45rem', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                                      <div>{m.caption || m.kind}</div>
                                      <div style={{ color: 'var(--text-tertiary)' }}>EXIF stripped • {m.uploadedBySource}</div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                                <EyeOff size={14} /> Attached media withheld ({rep.mediaAccessStatus}).
                              </div>
                            )}
                          </div>
                        )}

                        {/* Cluster & Action Controls */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.6rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-light)' }}>
                          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <button
                              type="button"
                              onClick={() => toggleHistory(rep.id)}
                              className="btn btn-secondary"
                              style={{ padding: '0.38rem 0.8rem', fontSize: '0.8rem' }}
                            >
                              <Clock size={14} /> History ({rep.statusHistory.length})
                              {historyOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </button>

                            {rep.clusterId && (
                              <button
                                type="button"
                                onClick={() =>
                                  setExpandedClusterId((prev) => (prev === rep.clusterId ? null : rep.clusterId))
                                }
                                className="btn btn-secondary"
                                style={{ padding: '0.38rem 0.8rem', fontSize: '0.8rem', borderColor: 'var(--accent-main)', color: 'var(--accent-main)' }}
                              >
                                <GitMerge size={14} /> View Duplicate Cluster ({rep.clusterRole})
                              </button>
                            )}
                          </div>

                          {isLocalOwner && rep.status !== CIVIC_WORK_STATES.WITHDRAWN && rep.status !== CIVIC_WORK_STATES.INDEPENDENTLY_CONFIRMED && (
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <button
                                type="button"
                                onClick={() => openEditReportForm(rep)}
                                className="btn btn-secondary"
                                style={{ padding: '0.38rem 0.75rem', fontSize: '0.78rem' }}
                              >
                                <Edit3 size={13} /> Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => setWithdrawTargetId(rep.id)}
                                className="btn btn-secondary"
                                style={{ padding: '0.38rem 0.75rem', fontSize: '0.78rem', color: '#ef4444' }}
                              >
                                <Trash2 size={13} /> Withdraw
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Expandable Status History */}
                        {historyOpen && (
                          <div style={{ marginTop: '0.85rem', padding: '0.85rem', borderRadius: '0.65rem', background: 'var(--bg-main)', border: '1px solid var(--border-light)' }}>
                            <div style={{ fontSize: '0.8rem', fontWeight: '700', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                              <Eye size={14} color="var(--accent-main)" /> Status &amp; Attribution Timeline
                            </div>
                            <ol style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                              {rep.statusHistory.map((h) => {
                                const srcBadge = SOURCE_BADGE_STYLES[h.sourceType] || SOURCE_BADGE_STYLES.citizen;
                                return (
                                  <li key={h.id} style={{ fontSize: '0.82rem', paddingBottom: '0.45rem', borderBottom: '1px dashed var(--border-light)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.4rem' }}>
                                      <span style={{ fontWeight: '700' }}>{h.stateLabel}</span>
                                      <span style={{ fontSize: '0.72rem', padding: '0.1rem 0.45rem', borderRadius: '99px', background: srcBadge.bg, color: srcBadge.color, fontWeight: '700' }}>
                                        {srcBadge.label}: {h.actorLabel}
                                      </span>
                                    </div>
                                    <div style={{ color: 'var(--text-secondary)', marginTop: '0.15rem' }}>{h.note}</div>
                                    <div style={{ color: 'var(--text-tertiary)', fontSize: '0.74rem', marginTop: '0.1rem' }}>
                                      Timestamp: {h.timestamp}
                                    </div>
                                  </li>
                                );
                              })}
                            </ol>
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}

        {/* Withdraw Confirmation Panel */}
        {withdrawTargetId && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Withdraw Civic Work Report"
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.65)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1rem',
              zIndex: 100,
            }}
          >
            <form
              onSubmit={handleConfirmWithdraw}
              className="card"
              style={{ width: '100%', maxWidth: '460px', padding: '1.5rem', background: 'var(--bg-secondary)' }}
            >
              <h2 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '0.5rem' }}>
                Withdraw Your Civic Work Report?
              </h2>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '0.9rem' }}>
                Attached media and details are immediately removed from public view while non-identifying audit timestamps remain preserved.
              </p>
              <input
                type="text"
                placeholder="Reason for withdrawal (optional)"
                value={withdrawReason}
                onChange={(e) => setWithdrawReason(e.target.value)}
                className="input-field"
                style={{ borderRadius: '0.6rem', padding: '0.6rem 0.85rem', fontSize: '0.9rem', marginBottom: '1rem' }}
              />
              <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setWithdrawTargetId(null)}
                  className="btn btn-secondary"
                  style={{ padding: '0.55rem 1rem', fontSize: '0.88rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ padding: '0.55rem 1rem', fontSize: '0.88rem', background: '#ef4444', color: '#ffffff' }}
                >
                  Confirm Withdrawal
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Submit / Edit Citizen Report Modal */}
        {showFormModal && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label={formState.editingId ? 'Edit Civic Work Report' : 'Submit Ward Civic Work Report'}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1rem',
              zIndex: 100,
              overflowY: 'auto',
            }}
          >
            <form
              onSubmit={handleFormSubmit}
              className="card"
              style={{
                width: '100%',
                maxWidth: '640px',
                maxHeight: '90vh',
                overflowY: 'auto',
                padding: '1.65rem',
                background: 'var(--bg-secondary)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.85rem',
              }}
            >
              <h2 style={{ fontSize: '1.35rem', fontWeight: '800' }}>
                {formState.editingId ? 'Edit Report (Re-Queued for Moderation)' : 'Report a Ward Public Works Issue'}
              </h2>

              {formError && (
                <div role="alert" style={{ padding: '0.65rem 0.85rem', borderRadius: '0.55rem', background: 'rgba(239,68,68,0.14)', color: '#ef4444', fontSize: '0.86rem', fontWeight: '600' }}>
                  {formError}
                </div>
              )}

              <label style={{ fontSize: '0.84rem', fontWeight: '600' }}>
                Issue Category
                <select
                  value={formState.category}
                  onChange={(e) => setFormState({ ...formState, category: e.target.value })}
                  className="input-field"
                  style={{ borderRadius: '0.6rem', padding: '0.6rem 0.85rem', fontSize: '0.92rem', marginTop: '0.25rem' }}
                >
                  {Object.entries(CIVIC_WORK_CATEGORY_LABELS).map(([k, label]) => (
                    <option key={k} value={k}>{label}</option>
                  ))}
                </select>
              </label>

              <div className="grid-2" style={{ gap: '0.75rem' }}>
                <label style={{ fontSize: '0.84rem', fontWeight: '600' }}>
                  Ward Name / Number *
                  <input
                    type="text"
                    placeholder="e.g. Ward 14 - Indiranagar East"
                    value={formState.ward}
                    onChange={(e) => setFormState({ ...formState, ward: e.target.value })}
                    className="input-field"
                    style={{ borderRadius: '0.6rem', padding: '0.6rem 0.85rem', fontSize: '0.92rem', marginTop: '0.25rem' }}
                    required
                  />
                </label>
                <label style={{ fontSize: '0.84rem', fontWeight: '600' }}>
                  Locality / Sector *
                  <input
                    type="text"
                    placeholder="e.g. HAL 2nd Stage"
                    value={formState.locality}
                    onChange={(e) => setFormState({ ...formState, locality: e.target.value })}
                    className="input-field"
                    style={{ borderRadius: '0.6rem', padding: '0.6rem 0.85rem', fontSize: '0.92rem', marginTop: '0.25rem' }}
                    required
                  />
                </label>
              </div>

              <label style={{ fontSize: '0.84rem', fontWeight: '600' }}>
                Approximate Public Landmark (avoid home address / phone numbers)
                <input
                  type="text"
                  placeholder="e.g. Opposite Govt Primary School Gate"
                  value={formState.approximateLandmark}
                  onChange={(e) => setFormState({ ...formState, approximateLandmark: e.target.value })}
                  className="input-field"
                  style={{ borderRadius: '0.6rem', padding: '0.6rem 0.85rem', fontSize: '0.92rem', marginTop: '0.25rem' }}
                />
              </label>

              <div className="grid-2" style={{ gap: '0.75rem' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Optional Private Latitude (redacted to ~1km public grid)
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g. 12.9716"
                    value={formState.exactLat}
                    onChange={(e) => setFormState({ ...formState, exactLat: e.target.value })}
                    className="input-field"
                    style={{ borderRadius: '0.6rem', padding: '0.55rem 0.8rem', fontSize: '0.88rem', marginTop: '0.25rem' }}
                  />
                </label>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Optional Private Longitude (never published)
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g. 77.6412"
                    value={formState.exactLng}
                    onChange={(e) => setFormState({ ...formState, exactLng: e.target.value })}
                    className="input-field"
                    style={{ borderRadius: '0.6rem', padding: '0.55rem 0.8rem', fontSize: '0.88rem', marginTop: '0.25rem' }}
                  />
                </label>
              </div>

              <label style={{ fontSize: '0.84rem', fontWeight: '600' }}>
                Short Issue Summary *
                <input
                  type="text"
                  placeholder="e.g. Broken streetlight pole outside bus bay"
                  value={formState.title}
                  onChange={(e) => setFormState({ ...formState, title: e.target.value })}
                  className="input-field"
                  style={{ borderRadius: '0.6rem', padding: '0.6rem 0.85rem', fontSize: '0.92rem', marginTop: '0.25rem' }}
                  required
                />
              </label>

              <label style={{ fontSize: '0.84rem', fontWeight: '600' }}>
                Public Description *
                <textarea
                  rows={3}
                  placeholder="Describe the civic hazard, duration, and impact on commuters or pedestrians..."
                  value={formState.description}
                  onChange={(e) => setFormState({ ...formState, description: e.target.value })}
                  className="input-field"
                  style={{ borderRadius: '0.6rem', padding: '0.6rem 0.85rem', fontSize: '0.92rem', marginTop: '0.25rem', resize: 'vertical' }}
                  required
                />
              </label>

              {/* Optional Media Attachment */}
              <div style={{ padding: '0.8rem', borderRadius: '0.65rem', border: '1px solid var(--border-main)', background: 'var(--glass-bg)' }}>
                <div style={{ fontSize: '0.84rem', fontWeight: '700', marginBottom: '0.45rem' }}>
                  Optional Evidence Image (JPEG/PNG/WebP • EXIF stripped &amp; moderated before public view)
                </div>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileUpload}
                  style={{ fontSize: '0.82rem', marginBottom: '0.5rem', width: '100%' }}
                />
                <input
                  type="text"
                  placeholder="Caption describing visible public infrastructure damage"
                  value={formState.mediaCaption}
                  onChange={(e) => setFormState({ ...formState, mediaCaption: e.target.value })}
                  className="input-field"
                  style={{ borderRadius: '0.55rem', padding: '0.5rem 0.75rem', fontSize: '0.86rem' }}
                />
              </div>

              {/* Explicit Privacy & Consent Checkboxes */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.83rem', color: 'var(--text-secondary)' }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formState.publicationConsent}
                    onChange={(e) => setFormState({ ...formState, publicationConsent: e.target.checked })}
                    required
                  />
                  <span>I consent to publish this civic issue under community moderation at ward/grid level.</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formState.locationRedactionAccepted}
                    onChange={(e) => setFormState({ ...formState, locationRedactionAccepted: e.target.checked })}
                    required
                  />
                  <span>I acknowledge exact GPS coordinates remain private and only coarse ward grids are public.</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formState.mediaConsent}
                    onChange={(e) => setFormState({ ...formState, mediaConsent: e.target.checked })}
                  />
                  <span>Media Consent: If attaching photos, I confirm no private faces or ID numbers appear and approve moderation review.</span>
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="btn btn-secondary"
                  style={{ padding: '0.6rem 1.1rem', fontSize: '0.9rem' }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ padding: '0.6rem 1.25rem', fontSize: '0.9rem' }}>
                  {formState.editingId ? 'Save Changes' : 'Submit Report'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default CivicWorksBoard;
