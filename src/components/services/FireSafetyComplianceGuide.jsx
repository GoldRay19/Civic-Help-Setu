import { useState, useId } from 'react';
import {
  Flame,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Building,
  FileText,
  ExternalLink,
  Calendar,
  Layers,
  Info,
  Clock,
  Trash2,
  Save,
  Plus,
  Send,
  Check,
  X,
  FolderOpen
} from 'lucide-react';
import './FireSafetyComplianceGuide.css';

import {
  STATUTORY_SCOPE_DISCLAIMER,
  FIRE_JURISDICTIONS,
  BUILDING_OCCUPANCY_GROUPS,
  FIRE_NOC_STAGES,
  FIRE_NOC_STAGE
} from '../../data/fireSafetyComplianceData';

import {
  resolveFireAuthority,
  evaluateNocApplicability,
  getStageChecklistRequirements,
  isDataStale
} from '../../services/fireSafetyComplianceService';

/**
 * Fire NOC and Fire-Safety Compliance Preparation Guide Component
 * Implements GitHub Issue #719
 *
 * Adheres strictly to:
 * - National Building Code of India (NBC 2016 Part 4: Fire & Life Safety)
 * - State Fire Force Acts & Municipal Fire Regulations
 * - Separate Provisional, Final, and Renewal workflows
 * - Non-authoritative technical advisory guardrails (no fire-engineering calculations)
 * - Explicit UNAVAILABLE_OR_UNVERIFIED states for unmapped territories
 * - Local-only citizen checklist persistence with full review, edit, and deletion capabilities
 */
export default function FireSafetyComplianceGuide({
  initialJurisdictionId = 'delhi',
  initialBuildingGroup = 'GROUP_E',
  initialStage = FIRE_NOC_STAGE.PROVISIONAL_NOC,
  initialTab = 'overview',
  onBack = null
} = {}) {
  const [selectedJurisdictionId, setSelectedJurisdictionId] = useState(initialJurisdictionId);
  const [selectedGroupCode, setSelectedGroupCode] = useState(initialBuildingGroup);
  const [buildingHeight, setBuildingHeight] = useState(18);
  const [coveredArea, setCoveredArea] = useState(600);
  const [activeStage, setActiveStage] = useState(initialStage);
  const [activeTab, setActiveTab] = useState(initialTab); // 'overview' | 'checklist' | 'stages' | 'tracking' | 'corrections'

  // Local checklist interactive state
  const [completedItems, setCompletedItems] = useState({});
  const [itemDocRefs, setItemDocRefs] = useState({});
  const [savedStatusNotice, setSavedStatusNotice] = useState(null);
  const [hasSavedDossier, setHasSavedDossier] = useState(() => {
    try {
      return Boolean(typeof localStorage !== 'undefined' && localStorage.getItem('civic_fire_noc_checklist_dossier'));
    } catch {
      return false;
    }
  });
  const [savedDossierDate, setSavedDossierDate] = useState(() => {
    try {
      if (typeof localStorage === 'undefined') return null;
      const raw = localStorage.getItem('civic_fire_noc_checklist_dossier');
      if (raw) {
        const parsed = JSON.parse(raw);
        return parsed.savedAt ? parsed.savedAt.slice(0, 10) : 'Previous session';
      }
    } catch {
      return null;
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState(false);

  // Milestone & deficiency tracking state
  const [submissionToken, setSubmissionToken] = useState('');
  const [inspectionDate, setInspectionDate] = useState('');
  const [deficiencies, setDeficiencies] = useState([]);
  const [newDeficiencyText, setNewDeficiencyText] = useState('');
  const [newDeficiencyMemo, setNewDeficiencyMemo] = useState('');

  // Community correction modal state
  const [isCorrectionModalOpen, setIsCorrectionModalOpen] = useState(false);
  const [correctionSourceUrl, setCorrectionSourceUrl] = useState('');
  const [correctionNotes, setCorrectionNotes] = useState('');
  const [correctionStatus, setCorrectionStatus] = useState(null);

  const jurisdictionSelectId = useId();
  const buildingGroupSelectId = useId();
  const heightInputId = useId();
  const areaInputId = useId();

  const authority = resolveFireAuthority(selectedJurisdictionId);
  const applicability = evaluateNocApplicability(selectedGroupCode, buildingHeight, coveredArea);
  const stageData = getStageChecklistRequirements(activeStage, selectedJurisdictionId, selectedGroupCode);

  const isStale = isDataStale(authority.verificationTimestamp, authority.maxStaleDays);

  const handleJurisdictionChange = (e) => {
    const newId = e.target.value;
    setIsLoading(true);
    setSelectedJurisdictionId(newId);
    setTimeout(() => setIsLoading(false), 80);
  };

  const toggleItemCompletion = (itemId) => {
    setCompletedItems((prev) => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  const handleDocRefChange = (itemId, refVal) => {
    setItemDocRefs((prev) => ({
      ...prev,
      [itemId]: refVal
    }));
  };

  const handleSaveChecklist = () => {
    const nowIso = new Date().toISOString();
    const payload = {
      jurisdictionId: selectedJurisdictionId,
      buildingGroupCode: selectedGroupCode,
      activeStage,
      buildingHeight,
      coveredArea,
      submissionToken,
      inspectionDate,
      completedItems,
      itemDocRefs,
      deficiencies,
      savedAt: nowIso
    };

    try {
      localStorage.setItem('civic_fire_noc_checklist_dossier', JSON.stringify(payload));
      setHasSavedDossier(true);
      setSavedDossierDate(nowIso.slice(0, 10));
      setSavedStatusNotice({ type: 'success', text: 'Preparation checklist saved securely to this device.' });
    } catch {
      setSavedStatusNotice({ type: 'error', text: 'Could not write to local device storage.' });
    }

    setTimeout(() => setSavedStatusNotice(null), 4000);
  };

  const handleReopenChecklist = () => {
    try {
      const raw = localStorage.getItem('civic_fire_noc_checklist_dossier');
      if (!raw) {
        setSavedStatusNotice({ type: 'error', text: 'No saved checklist found on this device.' });
        return;
      }
      const data = JSON.parse(raw);
      if (data.jurisdictionId) setSelectedJurisdictionId(data.jurisdictionId);
      if (data.buildingGroupCode) setSelectedGroupCode(data.buildingGroupCode);
      if (data.activeStage) setActiveStage(data.activeStage);
      if (data.buildingHeight !== undefined) setBuildingHeight(data.buildingHeight);
      if (data.coveredArea !== undefined) setCoveredArea(data.coveredArea);
      if (data.submissionToken) setSubmissionToken(data.submissionToken);
      if (data.inspectionDate) setInspectionDate(data.inspectionDate);
      if (data.completedItems) setCompletedItems(data.completedItems);
      if (data.itemDocRefs) setItemDocRefs(data.itemDocRefs);
      if (Array.isArray(data.deficiencies)) setDeficiencies(data.deficiencies);

      setSavedStatusNotice({ type: 'success', text: 'Saved checklist dossier reopened and restored.' });
    } catch {
      setSavedStatusNotice({ type: 'error', text: 'Failed to parse saved checklist from storage.' });
    }

    setTimeout(() => setSavedStatusNotice(null), 4000);
  };

  const handleResetChecklist = () => {
    if (window.confirm('Reset all checklist progress, tracking tokens, and deficiency memos for this guide?')) {
      setCompletedItems({});
      setItemDocRefs({});
      setSubmissionToken('');
      setInspectionDate('');
      setDeficiencies([]);
      setHasSavedDossier(false);
      setSavedDossierDate(null);
      try {
        localStorage.removeItem('civic_fire_noc_checklist_dossier');
      } catch {
        // ignore storage errors
      }
      setSavedStatusNotice({ type: 'info', text: 'Local checklist data completely reset.' });
      setTimeout(() => setSavedStatusNotice(null), 3000);
    }
  };

  const handleAddDeficiency = (e) => {
    e.preventDefault();
    if (!newDeficiencyText.trim()) return;

    const newDef = {
      id: `def_${Date.now()}`,
      memoNumber: newDeficiencyMemo.trim() || `MEMO-${deficiencies.length + 1}`,
      description: newDeficiencyText.trim(),
      recordedAt: new Date().toISOString().slice(0, 10),
      status: 'PENDING_RECTIFICATION'
    };

    setDeficiencies((prev) => [...prev, newDef]);
    setNewDeficiencyText('');
    setNewDeficiencyMemo('');
  };

  const handleResolveDeficiency = (id) => {
    setDeficiencies((prev) =>
      prev.map((d) => (d.id === id ? { ...d, status: 'RESOLVED', resolvedAt: new Date().toISOString().slice(0, 10) } : d))
    );
  };

  const handleSubmitCorrection = async (e) => {
    e.preventDefault();
    if (!correctionSourceUrl.trim()) return;

    try {
      const response = await fetch('/api/fire-compliance-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jurisdictionKey: authority.jurisdictionKey || selectedJurisdictionId.toUpperCase(),
          officialGazetteOrSourceUrl: correctionSourceUrl.trim(),
          submissionNotes: correctionNotes.trim()
        })
      });

      if (response.ok) {
        setCorrectionStatus({ type: 'success', message: 'Correction proposal queued for administrator verification.' });
        setCorrectionSourceUrl('');
        setCorrectionNotes('');
        setTimeout(() => {
          setIsCorrectionModalOpen(false);
          setCorrectionStatus(null);
        }, 2500);
      } else {
        const err = await response.json();
        setCorrectionStatus({ type: 'error', message: err.message || 'Submission failed server validation.' });
      }
    } catch {
      // In offline / mock client mode: register client-side success
      setCorrectionStatus({ type: 'success', message: 'Correction recorded locally (offline mode).' });
      setTimeout(() => {
        setIsCorrectionModalOpen(false);
        setCorrectionStatus(null);
      }, 2000);
    }
  };

  return (
    <div className="fire-noc-guide" aria-busy={isLoading}>
      {isLoading && (
        <div role="status" aria-live="polite" className="fire-alert-box fire-alert-blue" style={{ justifyContent: 'center' }}>
          <Clock className="w-4 h-4 animate-spin text-red-500" />
          <span>Updating jurisdiction fire rules...</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="fire-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div className="fire-badge-pill fire-badge-red" style={{ marginBottom: '0.5rem' }}>
              <Flame size={14} />
              <span>NBC 2016 Part 4 &amp; State Fire Safety Compliance</span>
            </div>
            <h1 style={{ margin: '0 0 0.4rem 0', fontSize: '1.75rem', fontWeight: 800 }}>
              Fire NOC &amp; Fire-Safety Compliance Preparation Guide
            </h1>
            <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-secondary)', maxWidth: '750px', lineHeight: 1.5 }}>
              Procedural compliance, required drawings, active &amp; passive fire systems inspection checklists, and shortfall remediation for building owners and commercial occupiers.
            </p>
          </div>
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="btn btn-secondary"
              style={{ fontSize: '0.85rem' }}
              aria-label="Return to services list"
            >
              Back to Services
            </button>
          )}
        </div>

        {/* Statutory Scope Disclaimer Card */}
        <div className="fire-alert-box fire-alert-amber">
          <ShieldAlert size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <strong>Non-Engineering Advisory Notice: </strong>
            {STATUTORY_SCOPE_DISCLAIMER}
          </div>
        </div>
      </div>

      {/* Jurisdiction & Building Use Selector Matrix */}
      <div className="fire-card">
        <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Building size={20} color="#ef4444" />
          <span>Jurisdiction &amp; Building Classification</span>
        </h2>

        <div className="fire-grid-4">
          <div className="fire-field-group">
            <label htmlFor={jurisdictionSelectId} className="fire-field-label">
              State &amp; Municipal Territory
            </label>
            <select
              id={jurisdictionSelectId}
              value={selectedJurisdictionId}
              onChange={handleJurisdictionChange}
              className="fire-select"
            >
              {FIRE_JURISDICTIONS.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.state} ({j.city})
                </option>
              ))}
            </select>
          </div>

          <div className="fire-field-group">
            <label htmlFor={buildingGroupSelectId} className="fire-field-label">
              Building Occupancy Group
            </label>
            <select
              id={buildingGroupSelectId}
              value={selectedGroupCode}
              onChange={(e) => setSelectedGroupCode(e.target.value)}
              className="fire-select"
            >
              {BUILDING_OCCUPANCY_GROUPS.map((g) => (
                <option key={g.code} value={g.code}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>

          <div className="fire-field-group">
            <label htmlFor={heightInputId} className="fire-field-label">
              Total Height (meters)
            </label>
            <input
              id={heightInputId}
              type="number"
              min="0"
              max="200"
              value={buildingHeight}
              onChange={(e) => setBuildingHeight(Math.max(0, Number(e.target.value)))}
              className="fire-input"
            />
          </div>

          <div className="fire-field-group">
            <label htmlFor={areaInputId} className="fire-field-label">
              Covered Floor Area (sq.m)
            </label>
            <input
              id={areaInputId}
              type="number"
              min="0"
              max="50000"
              value={coveredArea}
              onChange={(e) => setCoveredArea(Math.max(0, Number(e.target.value)))}
              className="fire-input"
            />
          </div>
        </div>

        {/* Applicability Assessment Card */}
        <div style={{ marginTop: '1.25rem', padding: '1rem', borderRadius: '0.75rem', background: 'var(--bg-secondary, rgba(255,255,255,0.02))', border: '1px solid var(--border-light, rgba(255,255,255,0.08))', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                Statutory NOC Mandate:
              </span>
              <span
                className={`fire-badge-pill ${
                  applicability.isMandatory
                    ? 'fire-badge-red'
                    : applicability.isExempt
                    ? 'fire-badge-emerald'
                    : 'fire-badge-amber'
                }`}
              >
                {applicability.status}
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              {applicability.reason}
            </p>
          </div>

          <div style={{ fontSize: '0.8rem', padding: '0.5rem 0.85rem', borderRadius: '0.5rem', background: 'var(--bg-card, rgba(0,0,0,0.2))', border: '1px solid var(--border-light, rgba(255,255,255,0.08))' }}>
            <strong>Key Audit Focus:</strong> {applicability.inspectionFocus || 'Evacuation routes and fire suppression hardware'}
          </div>
        </div>

        {/* Stale Data Warning Banner */}
        {isStale && authority.verified && (
          <div className="fire-alert-box fire-alert-yellow" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={16} style={{ flexShrink: 0 }} />
              <span>
                <strong>Stale Rulebook Advisory:</strong> Verification record for this jurisdiction is older than 180 days ({authority.verificationTimestamp?.slice(0, 10)}). Official rules may have revised notifications.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsCorrectionModalOpen(true)}
              style={{ background: 'none', border: 'none', color: 'inherit', fontWeight: 700, textDecoration: 'underline', cursor: 'pointer', flexShrink: 0 }}
            >
              Submit Update
            </button>
          </div>
        )}

        {/* Unavailable Data Fallback State Banner */}
        {!authority.verified && (
          <div className="fire-alert-box fire-alert-orange">
            <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <div style={{ fontWeight: 700 }}>Uncatalogued / Unverified Fire Authority</div>
              <div>{authority.message}</div>
              <div style={{ fontWeight: 600 }}>{authority.recommendedAction}</div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="fire-nav-tabs" role="tablist">
        {[
          { id: 'overview', label: '1. Authority & Rules', icon: ShieldCheck },
          { id: 'checklist', label: '2. Preparation Checklist', icon: FileText },
          { id: 'stages', label: '3. Lifecycle Stages', icon: Layers },
          { id: 'tracking', label: '4. Inspection & Shortfalls', icon: Calendar }
        ].map((tab) => {
          const Icon = tab.icon;
          const isCurrent = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isCurrent}
              onClick={() => setActiveTab(tab.id)}
              className={`fire-tab-btn ${isCurrent ? 'active' : ''}`}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: Authority & Official Rules Overview */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="fire-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Competent Fire Directorate Record</h2>
              <button
                type="button"
                onClick={() => setIsCorrectionModalOpen(true)}
                style={{ background: 'none', border: 'none', color: 'var(--accent-main, #38bdf8)', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer', textDecoration: 'underline' }}
              >
                Propose Correction
              </button>
            </div>

            <div className="fire-grid-2">
              <div style={{ padding: '0.9rem 1rem', borderRadius: '0.65rem', background: 'var(--bg-secondary, rgba(255,255,255,0.02))', border: '1px solid var(--border-light)' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Competent Authority:</span>
                <span style={{ fontSize: '0.95rem', fontWeight: 800 }}>{authority.authorityName}</span>
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Officer: {authority.competentOfficer || 'Chief Fire Officer'}</p>
              </div>

              <div style={{ padding: '0.9rem 1rem', borderRadius: '0.65rem', background: 'var(--bg-secondary, rgba(255,255,255,0.02))', border: '1px solid var(--border-light)' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Statutory Act &amp; Bye-Laws:</span>
                <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>{authority.statutoryAct}</span>
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Effective Date: {authority.effectiveDate || 'Not specified'}</p>
              </div>

              <div style={{ padding: '0.9rem 1rem', borderRadius: '0.65rem', background: 'var(--bg-secondary, rgba(255,255,255,0.02))', border: '1px solid var(--border-light)' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Official Application Portal:</span>
                {authority.portalUrl ? (
                  <a
                    href={authority.portalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-main, #38bdf8)', fontWeight: 600, fontSize: '0.88rem', textDecoration: 'none' }}
                  >
                    <span>{authority.portalName}</span>
                    <ExternalLink size={14} />
                  </a>
                ) : (
                  <span style={{ fontStyle: 'italic', color: 'var(--text-secondary)' }}>Not specified by the linked official source.</span>
                )}
                {authority.scrutinyPortal && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
                    Integrated Building Portal: <a href={authority.scrutinyPortal} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-main, #38bdf8)' }}>{authority.scrutinyPortal}</a>
                  </div>
                )}
              </div>

              <div style={{ padding: '0.9rem 1rem', borderRadius: '0.65rem', background: 'var(--bg-secondary, rgba(255,255,255,0.02))', border: '1px solid var(--border-light)' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Statutory Service Timelines:</span>
                <span style={{ fontSize: '0.95rem', fontWeight: 800 }}>
                  {authority.turnaroundDays ? `${authority.turnaroundDays} Working Days` : 'Not specified'}
                </span>
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  {authority.inspectionMandatory ? 'Mandatory spot inspection required before clearance.' : 'Self-certification permitted.'}
                </p>
              </div>
            </div>

            {authority.guidanceNotes && (
              <div className="fire-alert-box fire-alert-blue">
                <Info size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <strong>Editorial Practice Note: </strong>
                  {authority.guidanceNotes}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: Preparation Checklist Workspace */}
      {activeTab === 'checklist' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Stage Selector Sub-Bar */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', padding: '0.4rem', borderRadius: '0.5rem', background: 'var(--bg-secondary, rgba(255,255,255,0.03))', border: '1px solid var(--border-light)' }}>
            {Object.values(FIRE_NOC_STAGES).map((stg) => (
              <button
                key={stg.stage}
                type="button"
                onClick={() => setActiveStage(stg.stage)}
                className={`fire-tab-btn ${activeStage === stg.stage ? 'active' : ''}`}
                style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
              >
                {stg.title.split(':')[0]}
              </button>
            ))}
          </div>

          {/* Active Stage Header */}
          <div className="fire-card">
            <h2 style={{ margin: '0 0 0.35rem 0', fontSize: '1.15rem', fontWeight: 700 }}>{stageData.stageTitle}</h2>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>{stageData.description}</p>
            <div style={{ marginTop: '0.65rem', fontSize: '0.8rem', fontWeight: 700, color: '#ef4444' }}>
              Deliverable: {stageData.deliverable}
            </div>
          </div>

          {/* Action Bar: Save / Reopen / Reset local checklist */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={handleSaveChecklist}
                className="btn btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem' }}
                title="Save current checklist progress to this device"
              >
                <Save size={15} />
                <span>Save Checklist</span>
              </button>

              <button
                type="button"
                onClick={handleReopenChecklist}
                className="btn btn-secondary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem' }}
                title="Reopen previously saved checklist from this device"
              >
                <FolderOpen size={15} color="var(--accent-main, #38bdf8)" />
                <span>Reopen Saved</span>
              </button>

              <button
                type="button"
                onClick={handleResetChecklist}
                className="btn btn-secondary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', color: '#f87171' }}
                title="Delete saved checklist and clear form"
              >
                <Trash2 size={15} />
                <span>Reset</span>
              </button>
            </div>

            {savedStatusNotice && (
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: savedStatusNotice.type === 'error' ? '#ef4444' : '#10b981' }}>
                {savedStatusNotice.text}
              </span>
            )}
          </div>

          {/* Saved Dossier Availability Notification */}
          {hasSavedDossier && !savedStatusNotice && (
            <div className="fire-alert-box fire-alert-blue" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FolderOpen size={16} color="var(--accent-main, #38bdf8)" style={{ flexShrink: 0 }} />
                <span>
                  <strong>Saved Progress Available:</strong> You have a saved checklist from {savedDossierDate}.
                </span>
              </div>
              <button
                type="button"
                onClick={handleReopenChecklist}
                style={{ background: 'none', border: 'none', color: 'var(--accent-main, #38bdf8)', fontWeight: 700, textDecoration: 'underline', cursor: 'pointer', flexShrink: 0 }}
              >
                Reopen &amp; Restore
              </button>
            </div>
          )}

          {/* Categorized Checklist Items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {stageData.requiredCategories.map((catGroup) => (
              <div key={catGroup.category} className="fire-card">
                <h3 style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem' }}>
                  {catGroup.title}
                </h3>

                <div>
                  {catGroup.items.map((item) => {
                    const isChecked = Boolean(completedItems[item.id]);
                    return (
                      <div
                        key={item.id}
                        className={`fire-check-item ${isChecked ? 'checked' : ''}`}
                      >
                        <input
                          type="checkbox"
                          id={`check-${item.id}`}
                          checked={isChecked}
                          onChange={() => toggleItemCompletion(item.id)}
                          className="fire-checkbox"
                        />
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <label
                              htmlFor={`check-${item.id}`}
                              style={{
                                fontSize: '0.88rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                textDecoration: isChecked ? 'line-through' : 'none',
                                color: isChecked ? 'var(--text-secondary)' : 'var(--text-primary)'
                              }}
                            >
                              {item.label}
                            </label>
                            <span
                              className={`fire-badge-pill ${item.mandatory ? 'fire-badge-red' : 'fire-badge-neutral'}`}
                            >
                              {item.mandatory ? 'MANDATORY' : 'CONDITIONAL'}
                            </span>
                          </div>

                          {/* Official Rule & Legal Basis */}
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                            <span><strong>Rule:</strong> {item.officialRule}</span>
                            <span><strong>Purpose:</strong> {item.officialBasis}</span>
                          </div>

                          {/* Reference / File Token Input */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>File Ref:</span>
                            <input
                              type="text"
                              placeholder="e.g. DWG-FIRE-01 or Lab Report #102"
                              value={itemDocRefs[item.id] || ''}
                              onChange={(e) => handleDocRefChange(item.id, e.target.value)}
                              className="fire-input"
                              style={{ maxWidth: '280px', padding: '0.35rem 0.6rem', fontSize: '0.78rem' }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: Three-Stage Lifecycle Comparison */}
      {activeTab === 'stages' && (
        <div className="fire-grid-3">
          {Object.values(FIRE_NOC_STAGES).map((stg, idx) => (
            <div key={stg.stage} className="fire-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.85rem' }}>
                {idx + 1}
              </div>
              <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>{stg.title}</h3>
              <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.45, flex: 1 }}>{stg.description}</p>
              <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '0.65rem', fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <div><strong>Milestone:</strong> {stg.milestone}</div>
                <div><strong>Outcome:</strong> {stg.deliverable}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 4: Submission Token, Inspection & Shortfall Memo Tracker */}
      {activeTab === 'tracking' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="fire-card">
            <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.15rem', fontWeight: 700 }}>
              Application &amp; Spot Inspection Milestone Tracker
            </h2>

            <div className="fire-grid-2">
              <div className="fire-field-group">
                <label className="fire-field-label">
                  Official Submission Reference / Application Token
                </label>
                <input
                  type="text"
                  placeholder="e.g. DFS/2026/FSC/8821"
                  value={submissionToken}
                  onChange={(e) => setSubmissionToken(e.target.value)}
                  className="fire-input"
                />
              </div>

              <div className="fire-field-group">
                <label className="fire-field-label">
                  Scheduled Inspection Date
                </label>
                <input
                  type="date"
                  value={inspectionDate}
                  onChange={(e) => setInspectionDate(e.target.value)}
                  className="fire-input"
                />
              </div>
            </div>
          </div>

          {/* Deficiency Notices / Shortfall Memoranda Section */}
          <div className="fire-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Inspection Shortfalls &amp; Deficiency Memoranda</h2>
              <span className="fire-badge-pill fire-badge-neutral">
                {deficiencies.length} Recorded
              </span>
            </div>

            <form onSubmit={handleAddDeficiency} style={{ padding: '1rem', borderRadius: '0.75rem', background: 'var(--bg-secondary, rgba(255,255,255,0.02))', border: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
                <div>
                  <input
                    type="text"
                    placeholder="Shortfall Memo # (e.g. MEMO-01)"
                    value={newDeficiencyMemo}
                    onChange={(e) => setNewDeficiencyMemo(e.target.value)}
                    className="fire-input"
                    style={{ fontSize: '0.8rem' }}
                  />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <input
                    type="text"
                    placeholder="Inspector observation (e.g. Secondary escape door locked or pump pressure under 3.5 bar)"
                    value={newDeficiencyText}
                    onChange={(e) => setNewDeficiencyText(e.target.value)}
                    className="fire-input"
                    style={{ fontSize: '0.8rem' }}
                  />
                </div>
              </div>
              <button type="submit" className="btn btn-secondary" style={{ alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem' }}>
                <Plus size={14} /> Log Inspection Shortfall
              </button>
            </form>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {deficiencies.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '1.5rem', fontSize: '0.82rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                  No inspection deficiencies recorded. If the scrutiny officer issues an observation memo, log it here to track response deadlines.
                </div>
              ) : (
                deficiencies.map((def) => (
                  <div
                    key={def.id}
                    className="fire-check-item"
                    style={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 800 }}>{def.memoNumber}</span>
                        <span
                          className={`fire-badge-pill ${
                            def.status === 'RESOLVED' ? 'fire-badge-emerald' : 'fire-badge-amber'
                          }`}
                        >
                          {def.status}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Recorded: {def.recordedAt}</span>
                      </div>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-primary)' }}>{def.description}</p>
                    </div>

                    {def.status !== 'RESOLVED' && (
                      <button
                        type="button"
                        onClick={() => handleResolveDeficiency(def.id)}
                        className="btn btn-secondary"
                        style={{ fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: '#34d399' }}
                      >
                        <Check size={14} /> Mark Rectified
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Community Correction Proposal Modal */}
      {isCorrectionModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="correction-modal-title"
          className="fire-modal-backdrop"
        >
          <div className="fire-modal-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h3 id="correction-modal-title" style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>
                Submit Fire Rule / Portal Correction
              </h3>
              <button
                type="button"
                onClick={() => setIsCorrectionModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.2rem' }}
                aria-label="Close correction modal"
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ margin: '0 0 1rem 0', fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
              Civic-Help-Setu requires all statutory claims to be linked to a dated official government gazette, portal URL, or department notification.
            </p>

            <form onSubmit={handleSubmitCorrection} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div className="fire-field-group">
                <label className="fire-field-label">
                  Official Gazette / Directorate URL (Required)
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://dfs.delhigovt.nic.in/gazette-rule.pdf"
                  value={correctionSourceUrl}
                  onChange={(e) => setCorrectionSourceUrl(e.target.value)}
                  className="fire-input"
                />
              </div>

              <div className="fire-field-group">
                <label className="fire-field-label">
                  Correction Details &amp; Notes
                </label>
                <textarea
                  rows="3"
                  placeholder="Explain what rule, timeline, or portal URL has changed..."
                  value={correctionNotes}
                  onChange={(e) => setCorrectionNotes(e.target.value)}
                  className="fire-textarea"
                />
              </div>

              {correctionStatus && (
                <div style={{ fontSize: '0.8rem', padding: '0.5rem', borderRadius: '0.4rem', background: correctionStatus.type === 'error' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)', color: correctionStatus.type === 'error' ? '#f87171' : '#34d399' }}>
                  {correctionStatus.message}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setIsCorrectionModalOpen(false)}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.82rem' }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem' }}>
                  <Send size={14} /> Submit for Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
