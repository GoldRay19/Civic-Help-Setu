import { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  Building2,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  FileText,
  CheckCircle2,
  Sparkles,
  HelpCircle,
  Layers,
  FileCheck2,
} from 'lucide-react';
import { safeHttpUrl } from '../../utils/safeContent';
import { TENDER_CATEGORY_LABELS } from '../../data/tenderContract';
import { getClosingUrgency, getTenderFreshness } from '../../services/tenderService';
import TenderStaleDataNotice from './TenderStaleDataNotice';

export default function TenderDetailModal({
  tender,
  isOpen,
  onClose,
  onOpenChecklist,
  onOpenCorrection,
  initialTab = 'overview',
}) {
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !tender) return null;

  const officialUrl = safeHttpUrl(tender.sourceUrl);
  const urgency = getClosingUrgency(tender.closingSchedule);
  const freshness = getTenderFreshness(tender);

  const emd = tender.financials?.emd;
  const tenderFee = tender.financials?.tenderFee;
  const estimatedValue = tender.financials?.estimatedValue;
  const mandatory = tender.eligibilityCriteria?.mandatory || [];
  const preferences = tender.eligibilityCriteria?.preferences || [];
  const conditional = tender.eligibilityCriteria?.conditional || [];
  const unverifiedGaps = tender.eligibilityCriteria?.unverifiedGaps || [];
  const corrigenda = tender.corrigenda || [];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="tender-modal-title"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="animate-scale-up"
        style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-main)',
          borderRadius: '1.25rem',
          width: '100%',
          maxWidth: '850px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--border-main)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: '1rem',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.4rem' }}>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  padding: '0.2rem 0.5rem',
                  borderRadius: '4px',
                  backgroundColor: 'rgba(14, 165, 233, 0.12)',
                  color: 'var(--accent-main)',
                  border: '1px solid rgba(14, 165, 233, 0.25)',
                }}
              >
                {TENDER_CATEGORY_LABELS[tender.category] || tender.category}
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', fontFamily: 'monospace' }}>
                NIT: {tender.tenderRefNumber}
              </span>
            </div>

            <h2
              id="tender-modal-title"
              style={{
                fontSize: '1.25rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                margin: 0,
                lineHeight: 1.35,
              }}
            >
              {tender.title}
            </h2>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.4rem', fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Building2 size={14} color="var(--accent-main)" />
                <strong>{tender.authority}</strong>
              </span>
              <span>•</span>
              <span style={{ textTransform: 'capitalize' }}>
                {tender.jurisdiction?.level} Jurisdiction {tender.jurisdiction?.states?.length > 0 ? `(${tender.jurisdiction.states.join(', ')})` : ''}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-tertiary)',
              cursor: 'pointer',
              padding: '0.35rem',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div
          role="tablist"
          style={{
            display: 'flex',
            borderBottom: '1px solid var(--border-main)',
            backgroundColor: 'var(--bg-main)',
            padding: '0 1.5rem',
            overflowX: 'auto',
          }}
        >
          {[
            { id: 'overview', label: 'Dates & Financials' },
            { id: 'eligibility', label: `Eligibility & Preferences (${mandatory.length + preferences.length})` },
            { id: 'instructions', label: 'Official Instructions vs Civic Notes' },
            { id: 'provenance', label: 'Audit Provenance' },
          ].map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '0.85rem 1rem',
                border: 'none',
                background: 'none',
                color: activeTab === tab.id ? 'var(--accent-main)' : 'var(--text-secondary)',
                fontWeight: activeTab === tab.id ? 700 : 500,
                fontSize: '0.875rem',
                borderBottom: activeTab === tab.id ? '2px solid var(--accent-main)' : '2px solid transparent',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Modal Scrollable Body */}
        <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Stale Data Warning Banner */}
          {freshness.isStale && <TenderStaleDataNotice tender={tender} />}

          {/* TAB 1: OVERVIEW & CRITICAL DATES */}
          {activeTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Critical Dates Section */}
              <div style={{ backgroundColor: 'var(--bg-main)', padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid var(--border-main)' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, margin: '0 0 0.85rem 0', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Calendar size={18} color="var(--accent-main)" />
                  Tender Schedule &amp; Strict Deadlines (Extracted only when clearly stated)
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', fontSize: '0.85rem' }}>
                  <div>
                    <span style={{ color: 'var(--text-tertiary)', display: 'block', fontSize: '0.75rem' }}>Notice Published</span>
                    <strong style={{ color: 'var(--text-primary)' }}>{tender.publishedDate}</strong>
                  </div>

                  <div>
                    <span style={{ color: 'var(--text-tertiary)', display: 'block', fontSize: '0.75rem' }}>Bid Submission Closing</span>
                    {tender.closingSchedule?.isUnavailable ? (
                      <span style={{ color: '#f59e0b', fontWeight: 600 }}>
                        Date to be announced in forthcoming corrigendum
                      </span>
                    ) : (
                      <strong style={{ color: urgency.badgeColor }}>
                        {tender.closingSchedule?.closingDate} {tender.closingSchedule?.closingTime ? `(${tender.closingSchedule.closingTime})` : ''}
                      </strong>
                    )}
                  </div>

                  <div>
                    <span style={{ color: 'var(--text-tertiary)', display: 'block', fontSize: '0.75rem' }}>Technical Bid Opening</span>
                    <span style={{ color: 'var(--text-secondary)' }}>
                      {tender.openingSchedule?.openingDate
                        ? `${tender.openingSchedule.openingDate} ${tender.openingSchedule.openingTime || ''}`
                        : 'Not specified in notice'}
                    </span>
                  </div>

                  <div>
                    <span style={{ color: 'var(--text-tertiary)', display: 'block', fontSize: '0.75rem' }}>Clarifications Deadline</span>
                    <span style={{ color: 'var(--text-secondary)' }}>
                      {tender.clarificationsDeadline || 'Refer to pre-bid schedule'}
                    </span>
                  </div>
                </div>

                {/* Pre-Bid Conference Sub-card */}
                <div style={{ marginTop: '1rem', paddingTop: '0.85rem', borderTop: '1px solid var(--border-light)' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                    Pre-Bid Meeting Conference:
                  </span>
                  {tender.preBidMeeting?.isUnavailable ? (
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>
                      No pre-bid meeting scheduled in the initial tender notice.
                    </p>
                  ) : (
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                      <div>
                        <strong>Date &amp; Time:</strong> {tender.preBidMeeting?.date || 'To be notified'} at {tender.preBidMeeting?.time || 'Scheduled time'}
                        {' '}({tender.preBidMeeting?.mode === 'online' ? 'Virtual / Online' : 'Physical In-Person'})
                      </div>
                      {tender.preBidMeeting?.venueOrLink && (
                        <div style={{ marginTop: '0.25rem', color: 'var(--text-secondary)' }}>
                          <strong>Venue / Portal Link:</strong> {tender.preBidMeeting.venueOrLink}
                        </div>
                      )}
                      {tender.preBidMeeting?.instructions && (
                        <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
                          {tender.preBidMeeting.instructions}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Financials & EMD Exemption Clauses */}
              <div style={{ backgroundColor: 'var(--bg-main)', padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid var(--border-main)' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, margin: '0 0 0.85rem 0', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <ShieldCheck size={18} color="#10b981" />
                  EMD, Tender Fees &amp; Small Vendor Exemptions
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', fontSize: '0.85rem' }}>
                  <div>
                    <span style={{ color: 'var(--text-tertiary)', display: 'block', fontSize: '0.75rem' }}>Estimated Tender Value</span>
                    <strong style={{ color: 'var(--text-primary)' }}>
                      {estimatedValue?.isDisclosed ? estimatedValue.statedText : 'Not Disclosed'}
                    </strong>
                  </div>

                  <div>
                    <span style={{ color: 'var(--text-tertiary)', display: 'block', fontSize: '0.75rem' }}>Tender Processing Fee</span>
                    <strong style={{ color: 'var(--text-primary)' }}>
                      {tenderFee?.amount === 0 ? 'Free / Nil' : `₹${tenderFee?.amount?.toLocaleString()}`}
                    </strong>
                    {tenderFee?.isExemptForMsme && (
                      <span style={{ display: 'block', fontSize: '0.75rem', color: '#10b981' }}>
                        Exempt for MSME / Startups
                      </span>
                    )}
                  </div>

                  <div style={{ gridColumn: '1 / -1' }}>
                    <span style={{ color: 'var(--text-tertiary)', display: 'block', fontSize: '0.75rem' }}>Earnest Money Deposit (EMD) / Bid Security</span>
                    <strong style={{ color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                      {emd?.amount ? `₹${emd.amount.toLocaleString()}` : 'Nil / Security Declaration'}
                    </strong>

                    {emd?.isExemptForMsme && (
                      <div style={{ marginTop: '0.5rem', padding: '0.65rem', backgroundColor: 'rgba(16, 185, 129, 0.08)', borderRadius: '6px', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
                        <span style={{ color: '#10b981', fontWeight: 700, display: 'block', fontSize: '0.825rem' }}>
                          ✓ MSME Exemption Applicable under {emd.exemptionBasis}
                        </span>
                        <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          {emd.exemptionRules}
                        </p>
                      </div>
                    )}

                    {emd?.formsAccepted?.length > 0 && (
                      <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
                        <strong>Accepted Deposit Modes:</strong> {emd.formsAccepted.join(', ')}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Corrigenda Log */}
              {corrigenda.length > 0 && (
                <div style={{ backgroundColor: 'var(--bg-main)', padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid var(--border-main)' }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, margin: '0 0 0.85rem 0', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <AlertCircle size={18} color="#f59e0b" />
                    Published Corrigenda &amp; Addenda ({corrigenda.length})
                  </h4>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {corrigenda.map((c, i) => (
                      <div key={i} style={{ padding: '0.75rem', backgroundColor: 'var(--bg-surface)', borderRadius: '6px', border: '1px solid var(--border-main)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.3rem' }}>
                          <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.85rem' }}>
                            Corrigendum {c.corrigendumNumber}: {c.title}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                            Published: {c.publishedDate}
                          </span>
                        </div>
                        <p style={{ margin: 0, fontSize: '0.825rem', color: 'var(--text-secondary)' }}>{c.summary}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ELIGIBILITY & PREFERENCES */}
          {activeTab === 'eligibility' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Mandatory Statutory Requirements */}
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, margin: '0 0 0.75rem 0', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CheckCircle2 size={18} color="#ef4444" />
                  Mandatory Statutory Eligibility ({mandatory.length})
                  <span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--text-tertiary)' }}>
                    (Non-negotiable; missing any results in technical disqualification)
                  </span>
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {mandatory.map((req) => (
                    <div
                      key={req.id}
                      style={{
                        padding: '1rem',
                        backgroundColor: 'var(--bg-main)',
                        borderRadius: '0.75rem',
                        borderLeft: '4px solid #ef4444',
                        border: '1px solid var(--border-main)',
                        borderLeftWidth: '4px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.35rem' }}>
                        <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                          {req.label}
                        </span>
                        {req.statutoryBasis && (
                          <span style={{ fontSize: '0.75rem', padding: '0.15rem 0.45rem', borderRadius: '4px', backgroundColor: 'var(--glass-bg)', color: 'var(--text-tertiary)' }}>
                            {req.statutoryBasis}
                          </span>
                        )}
                      </div>
                      <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                        {req.description}
                      </p>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)', backgroundColor: 'var(--bg-surface)', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px dashed var(--border-main)' }}>
                        <strong>Required Proof / Evidence:</strong> {req.evidenceRequired}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Evaluative Purchase Preferences */}
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, margin: '0 0 0.75rem 0', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Sparkles size={18} color="#10b981" />
                  Evaluative Purchase Preferences &amp; MSME Quotas ({preferences.length})
                  <span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--text-tertiary)' }}>
                    (Competitive advantages in price evaluation)
                  </span>
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {preferences.map((pref) => (
                    <div
                      key={pref.id}
                      style={{
                        padding: '1rem',
                        backgroundColor: 'var(--bg-main)',
                        borderRadius: '0.75rem',
                        borderLeft: '4px solid #10b981',
                        border: '1px solid var(--border-main)',
                        borderLeftWidth: '4px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.35rem' }}>
                        <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                          {pref.label}
                        </span>
                        <span style={{ fontSize: '0.75rem', padding: '0.15rem 0.45rem', borderRadius: '4px', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                          {pref.policyReference}
                        </span>
                      </div>
                      <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                        {pref.description}
                      </p>
                      <div style={{ fontSize: '0.8rem', color: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.05)', padding: '0.5rem 0.75rem', borderRadius: '6px' }}>
                        <strong>Benefit:</strong> {pref.benefitDescription}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Conditional Requirements */}
              {conditional.length > 0 && (
                <div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, margin: '0 0 0.75rem 0', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Layers size={18} color="var(--accent-main)" />
                    Conditional Requirements
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {conditional.map((c) => (
                      <div key={c.id} style={{ padding: '0.75rem 1rem', backgroundColor: 'var(--bg-main)', borderRadius: '0.5rem', border: '1px solid var(--border-main)' }}>
                        <strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>If {c.condition}:</strong>
                        <ul style={{ margin: '0.35rem 0 0 1.25rem', padding: 0, fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                          {c.requirements.map((r, ri) => (
                            <li key={ri}>{r}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Explicit Unavailable / Unverified Gaps */}
              {unverifiedGaps.length > 0 && (
                <div style={{ padding: '0.85rem 1rem', backgroundColor: 'rgba(245, 158, 11, 0.08)', borderRadius: '0.75rem', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                  <h5 style={{ fontSize: '0.85rem', fontWeight: 700, margin: '0 0 0.35rem 0', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <HelpCircle size={16} />
                    Unverified / Unavailable Notice Data Gaps
                  </h5>
                  <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    The following criteria were omitted or unstated in the official notice. Civic Help Setu marks them unverified instead of making assumptions:
                  </p>
                  <ul style={{ margin: '0 0 0 1.25rem', padding: 0, fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                    {unverifiedGaps.map((gap, gi) => (
                      <li key={gi}>
                        <strong>{gap.field}:</strong> {gap.note}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: OFFICIAL INSTRUCTIONS VS EDITORIAL NOTES */}
          {activeTab === 'instructions' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, margin: '0 0 0.75rem 0', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FileText size={18} color="var(--accent-main)" />
                  Official Government Notice Instructions (Verbatim)
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {(tender.officialInstructions || []).map((ins, idx) => (
                    <div key={idx} style={{ padding: '1rem', backgroundColor: 'var(--bg-main)', borderRadius: '0.75rem', border: '1px solid var(--border-main)' }}>
                      <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.85rem', display: 'block', marginBottom: '0.35rem' }}>
                        {ins.section}
                      </span>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                        {ins.content}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, margin: '0 0 0.75rem 0', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Sparkles size={18} color="#f59e0b" />
                  Civic Help Setu Editorial Notes &amp; Small Vendor Tips
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {(tender.editorialNotes || []).map((note, idx) => (
                    <div key={idx} style={{ padding: '1rem', backgroundColor: 'rgba(245, 158, 11, 0.05)', borderRadius: '0.75rem', border: '1px solid rgba(245, 158, 11, 0.25)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                        <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.85rem' }}>
                          {note.topic}
                        </span>
                        <span style={{ fontSize: '0.72rem', color: '#f59e0b', fontWeight: 600 }}>
                          Editorial Tip
                        </span>
                      </div>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                        {note.note}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: PROVENANCE */}
          {activeTab === 'provenance' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.875rem' }}>
              <div style={{ backgroundColor: 'var(--bg-main)', padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid var(--border-main)' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, margin: '0 0 1rem 0', color: 'var(--text-primary)' }}>
                  Data Provenance &amp; Verification Trail
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                  <div>
                    <span style={{ color: 'var(--text-tertiary)', display: 'block', fontSize: '0.75rem' }}>Primary Official Source</span>
                    {officialUrl ? (
                      <a
                        href={officialUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: 'var(--accent-main)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.35rem', wordBreak: 'break-all' }}
                      >
                        <span>{tender.sourceUrl}</span>
                        <ExternalLink size={13} />
                      </a>
                    ) : (
                      <span>{tender.sourceUrl}</span>
                    )}
                  </div>

                  <div>
                    <span style={{ color: 'var(--text-tertiary)', display: 'block', fontSize: '0.75rem' }}>Effective Gazetted Date</span>
                    <strong style={{ color: 'var(--text-primary)' }}>{tender.auditMetadata?.effectiveDate}</strong>
                  </div>

                  <div>
                    <span style={{ color: 'var(--text-tertiary)', display: 'block', fontSize: '0.75rem' }}>Last Audited Date</span>
                    <strong style={{ color: 'var(--text-primary)' }}>{tender.auditMetadata?.lastVerified}</strong>
                  </div>

                  <div>
                    <span style={{ color: 'var(--text-tertiary)', display: 'block', fontSize: '0.75rem' }}>Verified By</span>
                    <span style={{ color: 'var(--text-secondary)' }}>{tender.auditMetadata?.verifiedBy}</span>
                  </div>
                </div>

                <div style={{ marginTop: '1.25rem', padding: '0.75rem', backgroundColor: 'var(--bg-surface)', borderRadius: '6px', border: '1px solid var(--border-light)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  <strong>Disclaimer:</strong> Civic Help Setu is an independent civic open-source initiative. We organize public procurement notices to help small vendors prepare evidence. We do not submit bids or collect procurement fees.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '1rem 1.5rem',
            borderTop: '1px solid var(--border-main)',
            backgroundColor: 'var(--bg-main)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}
        >
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenCorrection(tender);
            }}
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '0.8rem' }}
          >
            Report Corrigendum / Correction
          </button>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.85rem' }}
            >
              Close
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenChecklist(tender);
              }}
              className="btn btn-primary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
            >
              <FileCheck2 size={16} />
              <span>Open Readiness Checklist</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
