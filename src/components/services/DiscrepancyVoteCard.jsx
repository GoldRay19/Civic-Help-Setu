import { useState } from 'react';
import { ThumbsUp, ThumbsDown, CheckCircle2, AlertCircle, Clock, ShieldCheck } from 'lucide-react';
import { voteAuditReport } from '../../services/communityAuditService';

export default function DiscrepancyVoteCard({ report, onVoted }) {
  const [currentReport, setCurrentReport] = useState(report);
  const [hasVoted, setHasVoted] = useState(false);

  const handleVote = (type) => {
    if (hasVoted) return;
    const updated = voteAuditReport(currentReport.id, type);
    if (updated) {
      setCurrentReport(updated);
      setHasVoted(true);
      if (onVoted) onVoted(updated);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'COMMUNITY_VERIFIED':
        return (
          <span style={{ background: '#dcfce7', color: '#15803d', padding: '3px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <CheckCircle2 size={12} /> Community Corroborated
          </span>
        );
      case 'RESOLVED':
        return (
          <span style={{ background: '#eff6ff', color: '#1e40af', padding: '3px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <ShieldCheck size={12} /> Officially Merged
          </span>
        );
      case 'DISPUTED':
        return (
          <span style={{ background: '#fee2e2', color: '#b91c1c', padding: '3px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <AlertCircle size={12} /> Disputed
          </span>
        );
      default:
        return (
          <span style={{ background: '#fef3c7', color: '#b45309', padding: '3px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <Clock size={12} /> Awaiting Community Votes
          </span>
        );
    }
  };

  return (
    <div
      style={{
        background: '#ffffff',
        padding: '14px',
        borderRadius: '10px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '6px' }}>
        <div>
          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
            {currentReport.category.replace('_', ' ')}
          </span>
          <h4 style={{ margin: '4px 0 0 0', fontSize: '0.94rem', fontWeight: 700, color: '#0f172a' }}>
            {currentReport.title}
          </h4>
        </div>
        <div>{getStatusBadge(currentReport.status)}</div>
      </div>

      <p style={{ fontSize: '0.82rem', color: '#334155', margin: '8px 0', lineHeight: 1.4 }}>
        {currentReport.description}
      </p>

      {currentReport.adminNote && (
        <div style={{ background: '#eff6ff', padding: '8px 10px', borderRadius: '6px', border: '1px solid #bfdbfe', fontSize: '0.76rem', color: '#1e3a8a', marginBottom: '8px' }}>
          <strong>Admin Note:</strong> {currentReport.adminNote}
        </div>
      )}

      {/* Voting Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', paddingTop: '8px', borderTop: '1px solid #f1f5f9' }}>
        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
          Reported by <strong>{currentReport.reportedBy}</strong> on {currentReport.reportedDate}
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            type="button"
            disabled={hasVoted}
            onClick={() => handleVote('UP')}
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              background: hasVoted ? '#f8fafc' : '#f0fdf4',
              color: '#15803d',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: hasVoted ? 'default' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <ThumbsUp size={13} />
            <span>Confirm ({currentReport.upvotes})</span>
          </button>

          <button
            type="button"
            disabled={hasVoted}
            onClick={() => handleVote('DOWN')}
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              background: hasVoted ? '#f8fafc' : '#fef2f2',
              color: '#b91c1c',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: hasVoted ? 'default' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <ThumbsDown size={13} />
            <span>Dispute ({currentReport.downvotes})</span>
          </button>
        </div>
      </div>
    </div>
  );
}
