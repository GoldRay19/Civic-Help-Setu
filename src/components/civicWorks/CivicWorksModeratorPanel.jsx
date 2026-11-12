import { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  GitMerge,
  Split,
  Building2,
  FileCheck2,
  Flag,
} from 'lucide-react';
import {
  CIVIC_WORK_STATES,
  CIVIC_WORK_STATE_LABELS,
  MODERATION_DECISIONS,
  ACTOR_SOURCE_TYPES,
  MEDIA_KINDS,
  getModeratorQueue,
  moderateCivicWorkReport,
  recordOfficialAcknowledgement,
  updateCivicWorkStatus,
  clusterDuplicateReports,
  splitDuplicateCluster,
} from '../../services/civicWorksBoardService';
import { can } from '../../services/accessControl';
import { useToast } from '../../context/ToastContext';

const CivicWorksModeratorPanel = ({ onUpdated }) => {
  const { toast } = useToast();
  const [refreshTick, setRefreshTick] = useState(0);
  const [selectedForCluster, setSelectedForCluster] = useState([]);
  const [clusterReason, setClusterReason] = useState('');
  const [ackForm, setAckForm] = useState({
    reportId: '',
    department: '',
    referenceNumber: '',
    assignedUnit: '',
    notes: '',
  });
  const [statusForm, setStatusForm] = useState({
    reportId: '',
    nextState: CIVIC_WORK_STATES.WORK_REPORTED,
    sourceType: ACTOR_SOURCE_TYPES.OFFICIAL,
    verifierLabel: '',
    note: '',
    evidenceUrl: '',
    evidenceCaption: '',
  });

  const canModerate = can('civicWorks.moderate');
  if (!canModerate) {
    return (
      <div className="card" style={{ padding: '1.5rem', border: '1px solid var(--border-main)' }}>
        <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
          Moderator and official verification controls require administrator permissions.
        </p>
      </div>
    );
  }

  let queueData = { reports: [], pendingCount: 0, clusters: [], duplicates: { candidatePairs: [], sectorBursts: [] } };
  try {
    // Re-read on each refreshTick
    void refreshTick;
    queueData = getModeratorQueue();
  } catch {
    // Permission guard fallback
  }

  const refreshAll = (msg) => {
    setRefreshTick((n) => n + 1);
    onUpdated?.();
    if (msg) toast?.success?.(msg);
  };

  const handleModeration = (reportId, decision) => {
    try {
      moderateCivicWorkReport({
        reportId,
        decision,
        approveMedia: decision === MODERATION_DECISIONS.APPROVED,
        notes: `Moderator marked submission as ${decision}.`,
      });
      refreshAll(`Report marked ${decision}.`);
    } catch (err) {
      toast?.error?.(err.message);
    }
  };

  const handleSubmitAck = (e) => {
    e.preventDefault();
    if (!ackForm.reportId) return;
    try {
      recordOfficialAcknowledgement({
        reportId: ackForm.reportId,
        department: ackForm.department,
        referenceNumber: ackForm.referenceNumber,
        assignedUnit: ackForm.assignedUnit,
        notes: ackForm.notes,
      });
      setAckForm({ reportId: '', department: '', referenceNumber: '', assignedUnit: '', notes: '' });
      refreshAll('Official municipal acknowledgement recorded.');
    } catch (err) {
      toast?.error?.(err.message);
    }
  };

  const handleSubmitStatus = (e) => {
    e.preventDefault();
    if (!statusForm.reportId) return;
    try {
      const evidence = statusForm.evidenceUrl.trim()
        ? [
            {
              kind:
                statusForm.nextState === CIVIC_WORK_STATES.INDEPENDENTLY_CONFIRMED
                  ? MEDIA_KINDS.INDEPENDENT_VERIFICATION
                  : MEDIA_KINDS.WORK_COMPLETION_PROOF,
              mimeType: 'image/jpeg',
              sizeBytes: 25000,
              url: statusForm.evidenceUrl.trim(),
              caption: statusForm.evidenceCaption.trim() || 'Completion inspection evidence',
              uploadedBySource: statusForm.sourceType,
            },
          ]
        : [];

      updateCivicWorkStatus({
        reportId: statusForm.reportId,
        nextState: statusForm.nextState,
        sourceType: statusForm.sourceType,
        verifierLabel: statusForm.verifierLabel,
        note: statusForm.note,
        evidence,
      });
      setStatusForm({
        reportId: '',
        nextState: CIVIC_WORK_STATES.WORK_REPORTED,
        sourceType: ACTOR_SOURCE_TYPES.OFFICIAL,
        verifierLabel: '',
        note: '',
        evidenceUrl: '',
        evidenceCaption: '',
      });
      refreshAll('Lifecycle status updated with timestamp and actor attribution.');
    } catch (err) {
      toast?.error?.(err.message);
    }
  };

  const toggleClusterSelection = (id) => {
    setSelectedForCluster((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleMergeCluster = () => {
    try {
      clusterDuplicateReports({
        reportIds: selectedForCluster,
        primaryReportId: selectedForCluster[0],
        reason: clusterReason || 'Duplicate reports on same civic asset verified by moderator',
      });
      setSelectedForCluster([]);
      setClusterReason('');
      refreshAll('Duplicate reports grouped cleanly while preserving all individual histories.');
    } catch (err) {
      toast?.error?.(err.message);
    }
  };

  const handleSplitCluster = (clusterId) => {
    try {
      splitDuplicateCluster({
        clusterId,
        reason: 'Reversible split executed by moderator.',
      });
      refreshAll('Cluster split and independent report tracking restored.');
    } catch (err) {
      toast?.error?.(err.message);
    }
  };

  const activeReports = queueData.reports.filter((r) => r.status !== CIVIC_WORK_STATES.WITHDRAWN);
  const pendingReports = queueData.reports.filter(
    (r) => r.moderationStatus === MODERATION_DECISIONS.PENDING_MODERATION || r.moderationStatus === MODERATION_DECISIONS.FLAGGED
  );
  const mergedClusters = queueData.clusters.filter((c) => c.status === 'CONFIRMED_MERGED');

  return (
    <section
      aria-label="Ward Public Works Moderator Queue"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
        marginTop: '1rem',
      }}
    >
      {/* Header Banner */}
      <div
        className="card"
        style={{
          padding: '1.5rem',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          background: 'var(--glass-bg)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-main)', fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase' }}>
              <ShieldCheck size={16} /> Moderation &amp; Verification Desk
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: '800', marginTop: '0.25rem' }}>
              Ward Works Triage, Duplicate Clustering &amp; Official Updates
            </h2>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <span style={{ padding: '0.35rem 0.75rem', borderRadius: '99px', fontSize: '0.8rem', fontWeight: '700', background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
              Pending Moderation: {queueData.pendingCount}
            </span>
            <span style={{ padding: '0.35rem 0.75rem', borderRadius: '99px', fontSize: '0.8rem', fontWeight: '700', background: 'rgba(56, 189, 248, 0.15)', color: 'var(--accent-main)' }}>
              Active Clusters: {mergedClusters.length}
            </span>
          </div>
        </div>
      </div>

      {/* Pending Moderation Queue */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          <Flag size={18} color="#f59e0b" /> Citizen Submissions Pending Moderation ({pendingReports.length})
        </h3>
        {pendingReports.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
            All current civic work submissions have been reviewed.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {pendingReports.map((rep) => (
              <div
                key={rep.id}
                style={{
                  padding: '1rem',
                  borderRadius: '0.75rem',
                  border: '1px solid var(--border-main)',
                  background: 'var(--bg-secondary)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.4rem' }}>
                  <strong>{rep.trackingCode} — {rep.title}</strong>
                  <span style={{ fontSize: '0.75rem', padding: '0.15rem 0.55rem', borderRadius: '99px', background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', fontWeight: '700' }}>
                    {rep.moderationStatus}
                  </span>
                </div>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', margin: '0 0 0.5rem' }}>
                  {rep.description}
                </p>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', margin: '0 0 0.75rem' }}>
                  Ward: {rep.coarseLocation.ward} ({rep.coarseLocation.locality}) • Grid: {rep.coarseLocation.geoBucket} • Private exact coords attached: {rep.hasPrivateExactCoordinates ? 'Yes (redacted from public)' : 'No'} • Media items: {rep.media.length}
                </p>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => handleModeration(rep.id, MODERATION_DECISIONS.APPROVED)}
                    className="btn btn-primary"
                    style={{ padding: '0.45rem 0.9rem', fontSize: '0.82rem' }}
                  >
                    <CheckCircle2 size={14} /> Approve Report &amp; Media
                  </button>
                  <button
                    type="button"
                    onClick={() => handleModeration(rep.id, MODERATION_DECISIONS.FLAGGED)}
                    className="btn btn-secondary"
                    style={{ padding: '0.45rem 0.9rem', fontSize: '0.82rem' }}
                  >
                    <AlertTriangle size={14} /> Flag for Clarification
                  </button>
                  <button
                    type="button"
                    onClick={() => handleModeration(rep.id, MODERATION_DECISIONS.REJECTED)}
                    className="btn btn-secondary"
                    style={{ padding: '0.45rem 0.9rem', fontSize: '0.82rem', color: '#ef4444', borderColor: 'rgba(239,68,68,0.4)' }}
                  >
                    <XCircle size={14} /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Forms Grid: Official Acknowledgement + Status / Independent Verification */}
      <div className="grid-2" style={{ gap: '1.25rem' }}>
        <form onSubmit={handleSubmitAck} className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <Building2 size={18} color="var(--accent-main)" /> Record Official Department Acknowledgement
          </h3>
          <select
            aria-label="Select report for official acknowledgement"
            value={ackForm.reportId}
            onChange={(e) => setAckForm({ ...ackForm, reportId: e.target.value })}
            className="input-field"
            style={{ borderRadius: '0.6rem', padding: '0.6rem 0.8rem', fontSize: '0.9rem' }}
            required
          >
            <option value="">Choose a report...</option>
            {activeReports.map((r) => (
              <option key={r.id} value={r.id}>{r.trackingCode} — {r.title.slice(0, 48)}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Department name (e.g. Road Engineering Wing)"
            value={ackForm.department}
            onChange={(e) => setAckForm({ ...ackForm, department: e.target.value })}
            className="input-field"
            style={{ borderRadius: '0.6rem', padding: '0.6rem 0.8rem', fontSize: '0.9rem' }}
            required
          />
          <input
            type="text"
            placeholder="Official docket / work-order reference #"
            value={ackForm.referenceNumber}
            onChange={(e) => setAckForm({ ...ackForm, referenceNumber: e.target.value })}
            className="input-field"
            style={{ borderRadius: '0.6rem', padding: '0.6rem 0.8rem', fontSize: '0.9rem' }}
          />
          <input
            type="text"
            placeholder="Assigned ward team / contractor unit"
            value={ackForm.assignedUnit}
            onChange={(e) => setAckForm({ ...ackForm, assignedUnit: e.target.value })}
            className="input-field"
            style={{ borderRadius: '0.6rem', padding: '0.6rem 0.8rem', fontSize: '0.9rem' }}
          />
          <button type="submit" className="btn btn-primary" style={{ padding: '0.6rem 1rem', fontSize: '0.88rem' }}>
            Save Official Acknowledgement
          </button>
        </form>

        <form onSubmit={handleSubmitStatus} className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <FileCheck2 size={18} color="#10b981" /> Update Work State / Independent Verification
          </h3>
          <select
            aria-label="Select report to update status"
            value={statusForm.reportId}
            onChange={(e) => setStatusForm({ ...statusForm, reportId: e.target.value })}
            className="input-field"
            style={{ borderRadius: '0.6rem', padding: '0.6rem 0.8rem', fontSize: '0.9rem' }}
            required
          >
            <option value="">Choose a report...</option>
            {activeReports.map((r) => (
              <option key={r.id} value={r.id}>{r.trackingCode} — {r.statusLabel}</option>
            ))}
          </select>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            <select
              aria-label="Target workflow state"
              value={statusForm.nextState}
              onChange={(e) => setStatusForm({ ...statusForm, nextState: e.target.value })}
              className="input-field"
              style={{ borderRadius: '0.6rem', padding: '0.6rem 0.8rem', fontSize: '0.85rem' }}
            >
              {Object.entries(CIVIC_WORK_STATE_LABELS)
                .filter(([key]) => key !== CIVIC_WORK_STATES.WITHDRAWN)
                .map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
            </select>
            <select
              aria-label="Source actor type"
              value={statusForm.sourceType}
              onChange={(e) => setStatusForm({ ...statusForm, sourceType: e.target.value })}
              className="input-field"
              style={{ borderRadius: '0.6rem', padding: '0.6rem 0.8rem', fontSize: '0.85rem' }}
            >
              <option value={ACTOR_SOURCE_TYPES.OFFICIAL}>Official Desk</option>
              <option value={ACTOR_SOURCE_TYPES.COMMUNITY_VERIFIER}>Community Verifier</option>
              <option value={ACTOR_SOURCE_TYPES.MODERATOR}>Moderator</option>
            </select>
          </div>
          <input
            type="text"
            placeholder="Actor / verifier label (e.g. Ward Audit Team)"
            value={statusForm.verifierLabel}
            onChange={(e) => setStatusForm({ ...statusForm, verifierLabel: e.target.value })}
            className="input-field"
            style={{ borderRadius: '0.6rem', padding: '0.6rem 0.8rem', fontSize: '0.9rem' }}
          />
          <input
            type="url"
            placeholder={
              statusForm.nextState === CIVIC_WORK_STATES.INDEPENDENTLY_CONFIRMED
                ? 'Required post-work verification photo URL (https://...)'
                : 'Optional supporting photo URL (https://...)'
            }
            value={statusForm.evidenceUrl}
            onChange={(e) => setStatusForm({ ...statusForm, evidenceUrl: e.target.value })}
            className="input-field"
            style={{ borderRadius: '0.6rem', padding: '0.6rem 0.8rem', fontSize: '0.9rem' }}
          />
          <textarea
            rows={2}
            placeholder={
              statusForm.nextState === CIVIC_WORK_STATES.INDEPENDENTLY_CONFIRMED
                ? 'Required independent inspection observation (min 12 chars)...'
                : 'Status update note...'
            }
            value={statusForm.note}
            onChange={(e) => setStatusForm({ ...statusForm, note: e.target.value })}
            className="input-field"
            style={{ borderRadius: '0.6rem', padding: '0.6rem 0.8rem', fontSize: '0.9rem', resize: 'vertical' }}
            required
          />
          <button type="submit" className="btn btn-primary" style={{ padding: '0.6rem 1rem', fontSize: '0.88rem' }}>
            Record Status Transition
          </button>
        </form>
      </div>

      {/* Duplicate Candidates & Active Clusters */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          <GitMerge size={18} color="var(--accent-main)" /> Duplicate Candidate Review &amp; History-Safe Clustering
        </h3>

        {queueData.duplicates.sectorBursts.length > 0 && (
          <div style={{ marginBottom: '1rem', padding: '0.75rem 1rem', borderRadius: '0.65rem', background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.25)' }}>
            <strong style={{ fontSize: '0.85rem' }}>Sector Activity Notice (Non-Punitive):</strong>
            {queueData.duplicates.sectorBursts.map((b) => (
              <p key={b.burstKey} style={{ margin: '0.25rem 0 0', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                {b.observationNotice} ({b.geoBucket})
              </p>
            ))}
          </div>
        )}

        {queueData.duplicates.candidatePairs.length > 0 && (
          <div style={{ marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <p style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)', margin: 0 }}>
              Suggested Duplicate Pairs:
            </p>
            {queueData.duplicates.candidatePairs.map((pair) => (
              <div
                key={`${pair.reportAId}_${pair.reportBId}`}
                style={{
                  padding: '0.75rem',
                  borderRadius: '0.65rem',
                  border: '1px solid var(--border-main)',
                  fontSize: '0.84rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '0.5rem',
                }}
              >
                <div>
                  <strong>{pair.reportATrackingCode}</strong> &amp; <strong>{pair.reportBTrackingCode}</strong> ({Math.round(pair.confidence * 100)}% similarity • {pair.ward})
                  <div style={{ color: 'var(--text-tertiary)', fontSize: '0.78rem' }}>{pair.reasons.join(' | ')}</div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedForCluster([pair.reportAId, pair.reportBId])}
                  className="btn btn-secondary"
                  style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
                >
                  Select Pair
                </button>
              </div>
            ))}
          </div>
        )}

        <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
          Select 2 or more active reports to group into a reversible duplicate cluster (individual histories remain intact):
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
          {activeReports.map((rep) => {
            const checked = selectedForCluster.includes(rep.id);
            return (
              <label
                key={rep.id}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.35rem 0.65rem',
                  borderRadius: '0.5rem',
                  border: `1px solid ${checked ? 'var(--accent-main)' : 'var(--border-main)'}`,
                  background: checked ? 'var(--accent-light)' : 'var(--bg-secondary)',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleClusterSelection(rep.id)}
                />
                <span>{rep.trackingCode} ({rep.coarseLocation.ward})</span>
              </label>
            );
          })}
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Clustering rationale..."
            value={clusterReason}
            onChange={(e) => setClusterReason(e.target.value)}
            className="input-field"
            style={{ flex: '1 1 240px', borderRadius: '0.6rem', padding: '0.55rem 0.8rem', fontSize: '0.88rem' }}
          />
          <button
            type="button"
            disabled={selectedForCluster.length < 2}
            onClick={handleMergeCluster}
            className="btn btn-primary"
            style={{ padding: '0.55rem 1rem', fontSize: '0.85rem', opacity: selectedForCluster.length < 2 ? 0.55 : 1 }}
          >
            <GitMerge size={15} /> Merge Selected ({selectedForCluster.length})
          </button>
        </div>

        {mergedClusters.length > 0 && (
          <div style={{ marginTop: '1.1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <strong style={{ fontSize: '0.88rem' }}>Active Duplicate Clusters:</strong>
            {mergedClusters.map((cl) => (
              <div
                key={cl.clusterId}
                style={{
                  padding: '0.7rem 0.9rem',
                  borderRadius: '0.6rem',
                  border: '1px solid var(--border-main)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '0.5rem',
                  fontSize: '0.84rem',
                }}
              >
                <span>
                  <strong>{cl.clusterId}</strong> — {cl.mergedReportIds.length} grouped reports in {cl.ward}
                </span>
                <button
                  type="button"
                  onClick={() => handleSplitCluster(cl.clusterId)}
                  className="btn btn-secondary"
                  style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
                >
                  <Split size={14} /> Split Cluster
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default CivicWorksModeratorPanel;
