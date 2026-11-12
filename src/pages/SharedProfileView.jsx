import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Lock,
  Clock,
  CheckCircle2,
  FileText,
  User,
  MapPin,
  Briefcase,
  Layers,
  ArrowLeft,
  KeyRound,
  Eye,
} from 'lucide-react';
import { getPublicSharedProfile } from '../services/shareableProfileService';

function SharedProfileViewBody({ token }) {
  const [data, setData] = useState(() => (token ? getPublicSharedProfile(token) : null));
  const [pinInput, setPinInput] = useState('');

  if (!token) {
    return (
      <div className="section container" style={{ textAlign: 'center', padding: '5rem 1rem' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Loading verified shared profile...</p>
      </div>
    );
  }

  const handleUnlockSubmit = (e) => {
    e.preventDefault();
    const res = getPublicSharedProfile(token, { pin: pinInput });
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
            Passcode Required to View Shared Profile
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6, textAlign: 'center', marginBottom: '1.5rem' }}>
            {isInvalidAttempt
              ? data.error
              : 'The citizen who shared this profile protected it with a passcode.'}
          </p>

          <form onSubmit={handleUnlockSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
            <input
              type="password"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              aria-label="Enter share passcode"
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
              Unlock Shared Profile
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
    const isExpired = data?.status === 'EXPIRED';
    const isRevoked = data?.status === 'REVOKED';
    const isLocked = data?.status === 'LOCKED';
    const isViewLimit = data?.status === 'VIEW_LIMIT_REACHED';
    const isTampered = data?.status === 'TAMPERED';
    const isDanger = isRevoked || isLocked || isTampered;

    let heading = 'Profile View Not Found';
    let description = 'This profile share URL is invalid or has been permanently removed.';
    if (isRevoked) {
      heading = 'Shared Profile Link Revoked';
      description = 'The owner of this citizen profile has revoked public access. The shared information is no longer accessible.';
    } else if (isLocked) {
      heading = 'Shared Profile Access Temporarily Locked';
      description = data?.error || 'Too many failed passcode attempts triggered a protective lockout.';
    } else if (isTampered) {
      heading = 'Snapshot Integrity Verification Failed';
      description = data?.error || 'Cryptographic SHA-256 verification failed for this shared profile record.';
    } else if (isViewLimit) {
      heading = 'Maximum View Limit Reached';
      description = data?.error || 'This share link has consumed all permitted views and is now closed.';
    } else if (isExpired) {
      heading = 'Shared Profile Link Expired';
      description = 'This time-limited shared link has passed its expiration window. Please request an updated share link from the profile owner.';
    }

    return (
      <div className="section container" style={{ maxWidth: '640px', margin: '4rem auto', padding: '0 1rem' }}>
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
            ) : isDanger ? (
              <Lock className="w-8 h-8" />
            ) : isViewLimit ? (
              <AlertTriangle className="w-8 h-8" />
            ) : (
              <Clock className="w-8 h-8" />
            )}
          </div>

          <h2 style={{ fontSize: '1.4rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            {heading}
          </h2>

          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '2rem' }}>
            {description}
          </p>

          <Link
            to="/"
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
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const { profile, expiresAt, createdAt, viewsRemaining, consumedOnThisView, integrityDigest } = data;

  return (
    <div className="shared-profile-view section" style={{ padding: '2rem 1rem' }}>
      <div className="container" style={{ maxWidth: '800px', margin: '0 auto' }}>
        {/* Read-only Security Banner */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.85rem 1.25rem',
            borderRadius: '0.65rem',
            background: 'rgba(14, 165, 233, 0.08)',
            border: '1px solid rgba(14, 165, 233, 0.25)',
            color: '#0284c7',
            fontSize: '0.875rem',
            marginBottom: '1.5rem',
          }}
        >
          <ShieldCheck className="w-5 h-5 flex-shrink-0" />
          <div style={{ flex: 1 }}>
            <strong>Privacy-Controlled Shared View:</strong> You are viewing a verified, read-only summary explicitly shared by the citizen.
            Private contact details, sensitive documents, and internal account notes are protected and unexposed.
          </div>
        </div>

        {/* Profile Card Header */}
        <div
          style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--border-color)',
            borderRadius: '0.75rem',
            padding: '2rem',
            marginBottom: '1.5rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
            <div
              style={{
                width: '3.75rem',
                height: '3.75rem',
                borderRadius: '50%',
                background: 'var(--accent-light, rgba(79, 70, 229, 0.1))',
                color: 'var(--accent-main)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                fontWeight: '700',
              }}
            >
              {profile.fullName?.charAt(0) || 'C'}
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
                  {profile.fullName}
                </h1>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    padding: '0.2rem 0.5rem',
                    borderRadius: '0.35rem',
                    background: 'rgba(16, 185, 129, 0.1)',
                    color: '#059669',
                  }}
                >
                  Verified Citizen Share
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

              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                {profile.location && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                    <MapPin className="w-4 h-4 text-slate-400" />
                    {profile.location}
                  </span>
                )}
                {profile.occupation && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Briefcase className="w-4 h-4 text-slate-400" />
                    {profile.occupation}
                  </span>
                )}
                {profile.category && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                    <User className="w-4 h-4 text-slate-400" />
                    Category: {profile.category}
                  </span>
                )}
              </div>
            </div>

            {typeof profile.readinessScore === 'number' && (
              <div
                style={{
                  textAlign: 'center',
                  background: 'rgba(16, 185, 129, 0.05)',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                  borderRadius: '0.55rem',
                  padding: '0.75rem 1.25rem',
                }}
              >
                <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#10b981' }}>
                  {profile.readinessScore}%
                </div>
                <div style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)' }}>
                  Readiness Score
                </div>
              </div>
            )}
          </div>

          {/* Expiry and view quota metadata footer */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.5rem',
              marginTop: '1.5rem',
              paddingTop: '1rem',
              borderTop: '1px solid var(--border-color)',
              fontSize: '0.8rem',
              color: 'var(--text-secondary)',
            }}
          >
            <span>Shared on: {new Date(createdAt).toLocaleDateString()}</span>
            {typeof viewsRemaining === 'number' && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: consumedOnThisView ? '#ef4444' : '#0284c7' }}>
                <Eye className="w-3.5 h-3.5" />
                {consumedOnThisView ? 'Final view consumed — link closed' : `${viewsRemaining} view(s) remaining`}
              </span>
            )}
            {expiresAt && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: '#f59e0b' }}>
                <Clock className="w-3.5 h-3.5" />
                Valid until: {new Date(expiresAt).toLocaleString()}
              </span>
            )}
          </div>
        </div>

        {/* Application Milestones Section */}
        {profile.applicationMilestones && profile.applicationMilestones.length > 0 && (
          <div
            style={{
              background: 'var(--card-bg)',
              border: '1px solid var(--border-color)',
              borderRadius: '0.75rem',
              padding: '1.75rem',
              marginBottom: '1.5rem',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            }}
          >
            <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Layers className="w-5 h-5 text-indigo-500" />
              Active Civic Application Progress
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {profile.applicationMilestones.map((app, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.85rem 1rem',
                    background: 'var(--bg-secondary, rgba(0,0,0,0.02))',
                    borderRadius: '0.5rem',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                      {app.serviceName}
                    </div>
                    {app.updatedAt && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                        Last Updated: {app.updatedAt}
                      </div>
                    )}
                  </div>

                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      fontSize: '0.8rem',
                      fontWeight: '600',
                      padding: '0.25rem 0.65rem',
                      borderRadius: '0.35rem',
                      background: 'rgba(59, 130, 246, 0.1)',
                      color: '#2563eb',
                    }}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {app.stage}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Selected Services Section */}
        {profile.savedServices && profile.savedServices.length > 0 && (
          <div
            style={{
              background: 'var(--card-bg)',
              border: '1px solid var(--border-color)',
              borderRadius: '0.75rem',
              padding: '1.75rem',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            }}
          >
            <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileText className="w-5 h-5 text-emerald-500" />
              Services in Applicant Portfolio
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '0.75rem' }}>
              {profile.savedServices.map((srv, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '0.85rem 1rem',
                    background: 'var(--bg-secondary, rgba(0,0,0,0.02))',
                    borderRadius: '0.5rem',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <div style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                    {srv.title}
                  </div>
                  {srv.category && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                      {srv.category}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SharedProfileView({ initialToken }) {
  const params = useParams();
  const token = initialToken || params?.token || '';
  return <SharedProfileViewBody key={token} token={token} />;
}
