import {
  ClipboardList,
  Building2,
  ExternalLink,
  Clock,
  Activity,
  HelpCircle,
} from 'lucide-react';
import { safeHttpUrl } from '../../utils/safeContent';
import { TRANSITION_CATEGORY_LABELS, WORKFLOW_STAGE_LABELS } from '../../data/rentalTransitionContract';
import { calculateTransitionReadiness } from '../../services/rentalChecklistStorage';
import RentalStaleDataNotice from './RentalStaleDataNotice';
import { isRecordStale } from '../../services/rentalTransitionService';

export default function RentalTransitionCard({
  transition,
  onInspect,
  onOpenChecklist,
  onOpenCorrection,
  checklistState,
}) {
  const officialUrl = safeHttpUrl(transition.sourceUrl);
  const isStale = isRecordStale(transition);
  const readiness = calculateTransitionReadiness(transition, checklistState);

  const meter = transition.meterReadingConfig;
  const isMoveIn = transition.stage === 'move_in';

  return (
    <div
      className="card hover-scale"
      style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-main)',
        borderRadius: '1rem',
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        transition: 'all 0.2s ease',
      }}
    >
      <div>
        {/* Top Header: Stage & Category Badges */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '0.2rem 0.55rem',
                borderRadius: '4px',
                backgroundColor: isMoveIn ? 'rgba(34, 197, 94, 0.12)' : 'rgba(234, 179, 8, 0.12)',
                color: isMoveIn ? '#16a34a' : '#ca8a04',
                border: isMoveIn ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(234, 179, 8, 0.3)',
              }}
            >
              {WORKFLOW_STAGE_LABELS[transition.stage] || transition.stage}
            </span>

            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                padding: '0.2rem 0.5rem',
                borderRadius: '4px',
                backgroundColor: 'rgba(14, 165, 233, 0.1)',
                color: 'var(--accent-main)',
                border: '1px solid rgba(14, 165, 233, 0.25)',
              }}
            >
              {TRANSITION_CATEGORY_LABELS[transition.category] || transition.category}
            </span>
          </div>

          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              padding: '0.15rem 0.45rem',
              borderRadius: '4px',
              backgroundColor: 'var(--bg-main)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-light)',
            }}
          >
            {transition.jurisdiction?.level?.toUpperCase()}
          </span>
        </div>

        {/* Title */}
        <h4
          style={{
            fontSize: '1.15rem',
            fontWeight: 700,
            color: 'var(--text-primary)',
            margin: '0 0 0.5rem 0',
            lineHeight: 1.4,
          }}
        >
          {transition.title}
        </h4>

        {/* Authority */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
          <Building2 size={15} style={{ flexShrink: 0, color: 'var(--text-tertiary)' }} />
          <span>{transition.authority}</span>
        </div>

        {/* Meter Reading Highlight */}
        {meter?.isApplicable && (
          <div
            style={{
              padding: '0.6rem 0.85rem',
              borderRadius: '0.5rem',
              backgroundColor: 'rgba(59, 130, 246, 0.08)',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.5rem',
              fontSize: '0.85rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Activity size={16} color="var(--accent-main)" />
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                {meter.meterType?.toUpperCase()} Meter Reading ({meter.unit})
              </span>
            </div>
            {meter.requiresJointConfirmation && (
              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', background: 'var(--bg-surface)', padding: '0.15rem 0.4rem', borderRadius: '4px', border: '1px solid var(--border-light)' }}>
                Mutual Confirmation
              </span>
            )}
          </div>
        )}

        {/* Turnaround SLA or Unavailable Marker */}
        <div style={{ marginBottom: '1rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
          {transition.turnaroundSchedule?.isUnavailable ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#eab308' }}>
              <HelpCircle size={14} />
              <span>SLA: {transition.turnaroundSchedule.unavailableReason}</span>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Clock size={14} />
              <span>Standard Turnaround: {transition.turnaroundSchedule?.workingDays} working days</span>
            </div>
          )}
        </div>

        {/* Checklist Progress Indicator */}
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
            <span>Transition Readiness</span>
            <span style={{ fontWeight: 700, color: readiness.score === 100 ? '#16a34a' : 'var(--text-primary)' }}>
              {readiness.score}% ({readiness.completedCount}/{readiness.totalItems})
            </span>
          </div>
          <div style={{ height: '6px', width: '100%', backgroundColor: 'var(--border-light)', borderRadius: '3px', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${readiness.score}%`,
                backgroundColor: readiness.score === 100 ? '#16a34a' : 'var(--accent-main)',
                transition: 'width 0.3s ease',
              }}
            />
          </div>
        </div>

        {/* Stale audit warning if applicable */}
        {isStale && (
          <div style={{ marginBottom: '1rem' }}>
            <RentalStaleDataNotice transition={transition} />
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-light)' }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            type="button"
            onClick={() => onInspect(transition)}
            className="btn btn-outline btn-sm"
            style={{ flex: 1, padding: '0.5rem', fontSize: '0.85rem' }}
          >
            Official Guide
          </button>
          <button
            type="button"
            onClick={() => onOpenChecklist(transition)}
            className="btn btn-primary btn-sm"
            style={{ flex: 1, padding: '0.5rem', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}
          >
            <ClipboardList size={14} />
            <span>Checklist</span>
          </button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', marginTop: '0.25rem' }}>
          {officialUrl && (
            <a
              href={officialUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--accent-main)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', textDecoration: 'none' }}
            >
              <span>Official Portal</span>
              <ExternalLink size={12} />
            </a>
          )}

          <button
            type="button"
            onClick={() => onOpenCorrection(transition)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-tertiary)',
              cursor: 'pointer',
              textDecoration: 'underline',
              padding: 0,
              fontSize: '0.78rem',
            }}
          >
            Suggest Correction
          </button>
        </div>
      </div>
    </div>
  );
}
