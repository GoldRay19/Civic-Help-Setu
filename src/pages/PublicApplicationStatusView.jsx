import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Lock,
  Clock,
  CheckCircle2,
  Layers,
  ArrowLeft,
  Building,
  KeyRound,
  Eye,
} from 'lucide-react';
import { resolvePublicStatusByToken } from '../services/applicationStatusQrService';

function PublicApplicationStatusViewBody({ token }) {
  const [data, setData] = useState(() => (token ? resolvePublicStatusByToken(token) : null));
  const [pinInput, setPinInput] = useState('');

  if (!token) {
    return (
      <div className="section container" style={{ textAlign: 'center', padding: '5rem 1rem' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Loading verified application milestone status...</p>
      </div>
    );
  }

  const handleUnlockSubmit = (e) => {
    e.preventDefault();
    const res = resolvePublicStatusByToken(token, 'web_client', { pin: pinInput });
    setData(res);
    if (res?.status !== 'ACTIVE') {
      setPinInput('');
    }
  };

  if (data && (data.status === 'PIN_REQUIRED' || data.status === 'INVALID_PIN')) {
    const isInvalidAttempt = data.status === 'INVALID_PIN';
    return (
      <div className="section container" style={{ maxWidth: '520px', margin: '4rem auto', padding: '0 1rem' }}>
        <div
          style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--border-color)',
            borderRadius: '0.75rem',
            padding: '2.25rem 2rem',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
          }}
        >
          <div
            style={{
              width: '3.75rem',
              height: '3.75rem',
              borderRadius: '50%',
              background: isInvalidAttempt ? 'rgba(239, 68, 68, 0.1)' : 'rgba(79, 70, 229, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem',
              color: isInvalidAttempt ? '#ef4444' : '#4f46e5',
            }}
          >
            <KeyRound className="w-7 h-7" />
          </div>

          <h2 style={{ fontSize: '1.35rem', fontWeight: '700', color: 'var(--text-primary)', textAlign: 'center', marginBottom: '0.5rem' }}>
            Passcode Required to View Application Status
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6, textAlign: 'center', marginBottom: '1.5rem' }}>
            {isInvalidAttempt
              ? data.error
              : 'The applicant protected this status QR pass with a viewer passcode.'}
          </p>

          <form onSubmit={handleUnlockSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
            <input
              type="password"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              aria-label="Enter status pass passcode"
              placeholder="Enter viewer passcode"
              autoComplete="off"
              style={{
                width: '100%',
                padding: '0.65rem 0.85rem',
                borderRadius: '0.45rem',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-secondary, transparent)',
                color: 'var(--text-primary)',
                fontSize: '0.95rem',
              }}
            />
            <button
              type="submit"
              style={{
                width: '100%',
                padding: '0.7rem 1.25rem',
                borderRadius: '0.45rem',
                border: 'none',
                background: 'var(--accent-main)',
                color: '#ffffff',
                fontWeight: '600',
                fontSize: '0.92rem',
                cursor: 'pointer',
              }}
            >
              Unlock Status Pass
            </button>
          </form>

          {typeof data.remainingAttempts === 'number' && (
            <p style={{ marginTop: '0.9rem', fontSize: '0.78rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
              Attempts remaining before lockout: {data.remainingAttempts}
            </p>
          )}
        </div>
      </div>
    );
  }

  if (!data || data.status !== 'ACTIVE') {
    const isRevoked = data?.status === 'REVOKED';
    const isRateLimited = data?.status === 'RATE_LIMITED';
    const isExpired = data?.status === 'EXPIRED';
    const isLocked = data?.status === 'LOCKED';
    const isViewLimit = data?.status === 'VIEW_LIMIT_REACHED';
    const isTampered = data?.status === 'TAMPERED';
    const isDanger = isRevoked || isRateLimited || isLocked || isTampered;

    let heading = 'Application Not Found';
    let description = data?.error || 'This status lookup QR link is no longer valid. The applicant may have refreshed or rotated their pass.';
    if (isRateLimited) {
      heading = 'Lookup Rate Limit Exceeded';
    } else if (isRevoked) {
      heading = 'QR Status Pass Deactivated';
      description = 'This lookup QR code has been rotated or deactivated by the applicant for security.';
    } else if (isLocked) {
      heading = 'QR Status Pass Temporarily Locked';
      description = data?.error || 'Too many failed passcode attempts triggered a temporary protective lockout.';
    } else if (isTampered) {
      heading = 'Snapshot Integrity Verification Failed';
      description = data?.error || 'Cryptographic SHA-256 verification failed for this application status record.';
    } else if (isViewLimit) {
      heading = 'Maximum View Limit Reached';
      description = data?.error || 'This status lookup QR pass has reached its maximum allowed view limit and is now closed.';
    } else if (isExpired) {
      heading = 'QR Status Pass Expired';
      description = 'This lookup QR code has expired. Please check your account dashboard for an updated QR pass.';
    }

    return (
      <div className="section container" style={{ maxWidth: '600px', margin: '4rem auto', padding: '0 1rem' }}>
        <div
          style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--border-color)',
            borderRadius: '0.75rem',
            padding: '2.5rem 2rem',
            textAlign: 'center',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
          }}
        >
          <div
            style={{
              width: '4rem',
              height: '4rem',
              borderRadius: '50%',
              background: isDanger ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem',
              color: isDanger ? '#ef4444' : '#f59e0b',
            }}
          >
            {isTampered ? (
              <ShieldAlert className="w-8 h-8" />
            ) : isRevoked || isLocked ? (
              <Lock className="w-8 h-8" />
            ) : isRateLimited || isViewLimit ? (
              <AlertTriangle className="w-8 h-8" />
            ) : (
              <Clock className="w-8 h-8" />
            )}
          </div>

          <h2 style={{ fontSize: '1.35rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            {heading}
          </h2>

          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '2rem' }}>
            {description}
          </p>

          <Link
            to="/track"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.65rem 1.25rem',
              borderRadius: '0.5rem',
              background: 'var(--accent-main)',
              color: '#ffffff',
              fontWeight: '600',
              textDecoration: 'none',
              fontSize: '0.9rem',
            }}
          >
            <ArrowLeft className="w-4 h-4" />
            Go to Tracking Portal
          </Link>
        </div>
      </div>
    );
  }

  const { application, expiresAt, viewsRemaining, consumedOnThisView, integrityDigest } = data;

  return (
    <div className="public-status-view section" style={{ padding: '2.5rem 1rem' }}>
      <div className="container" style={{ maxWidth: '720px', margin: '0 auto' }}>
        {/* Security & Privacy Banner */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.85rem 1.25rem',
            borderRadius: '0.65rem',
            background: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            color: '#059669',
            fontSize: '0.875rem',
            marginBottom: '1.5rem',
          }}
        >
          <ShieldCheck className="w-5 h-5 flex-shrink-0" />
          <div style={{ flex: 1 }}>
            <strong>Privacy-Safe Status View:</strong> Displays official milestones and next steps. Personal identifiers, phone numbers, and sensitive documents are protected and excluded from public view.
          </div>
        </div>

        {/* Application Header Card */}
        <div
          style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--border-color)',
            borderRadius: '0.75rem',
            padding: '2rem',
            marginBottom: '1.5rem',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span
                  style={{
                    display: 'inline-block',
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    padding: '0.2rem 0.5rem',
                    borderRadius: '0.35rem',
                    background: 'rgba(59, 130, 246, 0.1)',
                    color: '#2563eb',
                  }}
                >
                  Official Civic Application
                </span>
                {integrityDigest && (
                  <span
                    title={integrityDigest}
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: '600',
                      padding: '0.2rem 0.5rem',
                      borderRadius: '0.35rem',
                      background: 'rgba(14, 165, 233, 0.1)',
                      color: '#0284c7',
                      fontFamily: 'monospace',
                    }}
                  >
                    SHA-256: {integrityDigest.slice(0, 10)}
                  </span>
                )}
              </div>
              <h1 style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
                {application.serviceName}
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.4rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <Building className="w-4 h-4 text-slate-400" />
                {application.department}
              </div>
            </div>

            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.4rem 0.85rem',
                borderRadius: '9999px',
                background: 'rgba(16, 185, 129, 0.1)',
                color: '#059669',
                fontWeight: '700',
                fontSize: '0.85rem',
              }}
            >
              <CheckCircle2 className="w-4 h-4" />
              {application.stage}
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
              marginTop: '1.5rem',
              paddingTop: '1rem',
              borderTop: '1px solid var(--border-color)',
            }}
          >
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '600' }}>
                Application Date
              </div>
              <div style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-primary)', marginTop: '0.2rem' }}>
                {application.submissionDate || 'Recorded on system'}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '600' }}>
                Statutory Timeline
              </div>
              <div style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-primary)', marginTop: '0.2rem' }}>
                {application.expectedResolution}
              </div>
            </div>
          </div>
        </div>

        {/* Milestone Progression Timeline */}
        <div
          style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--border-color)',
            borderRadius: '0.75rem',
            padding: '2rem',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
          }}
        >
          <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--text-primary)', margin: '0 0 1.25rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Layers className="w-5 h-5 text-indigo-500" />
            Milestone Progress Tracking
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {application.milestones.map((m, idx) => {
              const isDone = m.status === 'COMPLETED';
              const isInProgress = m.status === 'IN_PROGRESS';

              return (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '1rem',
                    padding: '0.85rem 1rem',
                    borderRadius: '0.5rem',
                    background: isDone
                      ? 'rgba(16, 185, 129, 0.05)'
                      : isInProgress
                        ? 'rgba(59, 130, 246, 0.05)'
                        : 'var(--bg-secondary, rgba(0,0,0,0.01))',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <div
                    style={{
                      width: '1.75rem',
                      height: '1.75rem',
                      borderRadius: '50%',
                      background: isDone ? '#10b981' : isInProgress ? '#3b82f6' : 'var(--border-color)',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.8rem',
                      fontWeight: '700',
                      flexShrink: 0,
                    }}
                  >
                    {isDone ? '✓' : idx + 1}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: '600', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                        {m.label}
                      </span>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: '700',
                          color: isDone ? '#059669' : isInProgress ? '#2563eb' : 'var(--text-secondary)',
                        }}
                      >
                        {isDone ? 'Completed' : isInProgress ? 'In Progress' : 'Pending'}
                      </span>
                    </div>
                    {m.completedAt && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                        Recorded: {m.completedAt}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Privacy & View Quota Footer */}
          <div
            style={{
              marginTop: '1.5rem',
              paddingTop: '1rem',
              borderTop: '1px solid var(--border-color)',
              fontSize: '0.75rem',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.5rem',
            }}
          >
            <span>
              Pass expiration: {expiresAt ? new Date(expiresAt).toLocaleDateString() : 'N/A'}.
            </span>
            {typeof viewsRemaining === 'number' && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: consumedOnThisView ? '#ef4444' : '#0284c7' }}>
                <Eye className="w-3.5 h-3.5" />
                {consumedOnThisView ? 'Final view consumed — pass closed' : `${viewsRemaining} view(s) remaining`}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PublicApplicationStatusView({ initialToken }) {
  const params = useParams();
  const token = initialToken || params?.token || '';
  return <PublicApplicationStatusViewBody key={token} token={token} />;
}
