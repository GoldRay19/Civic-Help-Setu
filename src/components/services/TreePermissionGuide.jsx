import { useState, useMemo, useId } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  AlertOctagon,
  ExternalLink,
  CheckCircle,
  Clock,
  PhoneCall,
  Save,
  Trash2,
  Download,
  Leaf,
  Scale,
} from 'lucide-react';

import {
  TREE_OPERATION_TYPE,
  OPERATION_METADATA,
  resolveCompetentTreeAuthority,
  getTreeActionRequirements,
  getEmergencyHazardRoute,
  getIllegalFellingReportRoute,
  listSupportedJurisdictions,
  getProtectedSpeciesDirectory,
  createTreeChecklist,
  updateTreeChecklist,
  deleteTreeChecklist,
  sanitizeTreeChecklistForExport,
  submitTreeDataCorrection,
} from '../../services/treeProtectionService';

/**
 * Flattens hierarchical category checklist into flat actionable items.
 */
function getFlattenedRequirements(requirementsData) {
  if (!requirementsData || !requirementsData.evidenceChecklist) return [];
  const flattened = [];
  requirementsData.evidenceChecklist.forEach((cat) => {
    cat.items.forEach((item) => {
      flattened.push({
        itemId: item.id,
        categoryId: cat.categoryId,
        categoryTitle: cat.categoryTitle,
        label: item.label,
        helpText: item.helpText,
        mandatory: item.mandatory,
        condition: item.condition,
        completed: false,
        documentRef: '',
        notes: '',
      });
    });
  });
  return flattened;
}

/**
 * TreePermissionGuide Component
 *
 * Local-authority guide and preparation workspace for tree permissions,
 * urban tree protection, emergency hazardous tree response, and illegal felling reporting.
 *
 * Conforms to WCAG 2.1 AA accessibility, supports keyboard navigation,
 * and maintains strict PII protection on exports and public views.
 */
export default function TreePermissionGuide({
  initialJurisdiction = 'DELHI_NCT',
  initialOperation = TREE_OPERATION_TYPE.PRUNING,
  initialCitizenId = 'citizen_guest_session',
  onBack,
} = {}) {
  const [selectedJurisdiction, setSelectedJurisdiction] = useState(initialJurisdiction);
  const [customJurisdictionInput, setCustomJurisdictionInput] = useState('');
  const [selectedOperation, setSelectedOperation] = useState(initialOperation);
  const [activeTab, setActiveTab] = useState('guide'); // 'guide' | 'checklist' | 'emergency' | 'reporting' | 'protected' | 'penalties'

  // View messages
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Authenticated citizen identifier for checklist isolation
  const citizenId = initialCitizenId;
  const [savedDossier, setSavedDossier] = useState(null);
  const [itemOverrides, setItemOverrides] = useState({});
  const [treeSpeciesInput, setTreeSpeciesInput] = useState('');
  const [locationDescriptionInput, setLocationDescriptionInput] = useState('');
  const [estimatedGirthInput, setEstimatedGirthInput] = useState('');

  // Sanitized export preview modal state
  const [sanitizedPreview, setSanitizedPreview] = useState(null);

  // Community correction modal state
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [correctionSourceUrl, setCorrectionSourceUrl] = useState('');
  const [correctionAuthorityName, setCorrectionAuthorityName] = useState('');
  const [correctionNotes, setCorrectionNotes] = useState('');

  const jurisdictionSelectId = useId();
  const supportedJurisdictions = listSupportedJurisdictions();
  const authorityInfo = resolveCompetentTreeAuthority(selectedJurisdiction);
  const requirementsData = useMemo(
    () => getTreeActionRequirements(selectedOperation, selectedJurisdiction),
    [selectedOperation, selectedJurisdiction]
  );
  const emergencyData = getEmergencyHazardRoute(selectedJurisdiction);
  const reportingData = getIllegalFellingReportRoute(selectedJurisdiction);
  const protectedSpeciesList = getProtectedSpeciesDirectory();

  // Declarative checklist items with user state applied
  const baseItems = useMemo(() => getFlattenedRequirements(requirementsData), [requirementsData]);
  const checklistItems = useMemo(() => {
    return baseItems.map((item) => {
      const override = itemOverrides[item.itemId];
      return {
        ...item,
        completed: override?.completed ?? false,
        documentRef: override?.documentRef ?? '',
        notes: override?.notes ?? '',
      };
    });
  }, [baseItems, itemOverrides]);

  // Handle local item toggle
  const handleItemToggle = (itemId) => {
    setItemOverrides((prev) => {
      const current = prev[itemId] || {};
      return {
        ...prev,
        [itemId]: {
          ...current,
          completed: !current.completed,
        },
      };
    });
  };

  const handleItemDocRefChange = (itemId, docRef) => {
    setItemOverrides((prev) => {
      const current = prev[itemId] || {};
      return {
        ...prev,
        [itemId]: {
          ...current,
          documentRef: docRef,
        },
      };
    });
  };

  // Save checklist dossier to service store
  const handleSaveChecklist = () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      let dossier;
      if (savedDossier && savedDossier.id) {
        dossier = updateTreeChecklist(savedDossier.id, citizenId, {
          treeSpecies: treeSpeciesInput || 'Unspecified Native Species',
          treeLocationDescription: locationDescriptionInput || 'Private residential yard',
          estimatedGirthCm: Number(estimatedGirthInput) || 0,
          itemsToUpdate: checklistItems.map((i) => ({
            itemId: i.itemId,
            completed: i.completed,
            documentRef: i.documentRef,
            notes: i.notes,
          })),
        });
        setSuccessMsg('Checklist updated successfully.');
      } else {
        dossier = createTreeChecklist({
          ownerId: citizenId,
          jurisdictionKey: selectedJurisdiction,
          operationType: selectedOperation,
          treeSpecies: treeSpeciesInput || 'Unspecified Native Species',
          treeLocationDescription: locationDescriptionInput || 'Private residential yard',
          estimatedGirthCm: Number(estimatedGirthInput) || 0,
        });

        // Apply completed statuses
        dossier = updateTreeChecklist(dossier.id, citizenId, {
          itemsToUpdate: checklistItems.map((i) => ({
            itemId: i.itemId,
            completed: i.completed,
            documentRef: i.documentRef,
            notes: i.notes,
          })),
        });
        setSavedDossier(dossier);
        setSuccessMsg(`Checklist saved with Dossier ID: ${dossier.id}`);
      }
      setSavedDossier(dossier);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to save checklist record');
    }
  };

  // Delete saved dossier
  const handleDeleteChecklist = () => {
    if (!savedDossier) return;
    try {
      deleteTreeChecklist(savedDossier.id, citizenId);
      setSavedDossier(null);
      setItemOverrides({});
      setSuccessMsg('Saved checklist dossier permanently deleted.');
    } catch (err) {
      setErrorMsg(err.message || 'Failed to delete checklist record');
    }
  };

  // Generate sanitized PII-safe export preview
  const handleExportSanitized = () => {
    if (!savedDossier) {
      setErrorMsg('Please save your checklist first before generating an export.');
      return;
    }
    const clean = sanitizeTreeChecklistForExport(savedDossier);
    setSanitizedPreview(clean);
  };

  // Submit community correction
  const handleSubmitCorrection = (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const submission = submitTreeDataCorrection({
        jurisdictionKey: selectedJurisdiction,
        proposedAuthorityName: correctionAuthorityName,
        officialGazetteOrSourceUrl: correctionSourceUrl,
        submissionNotes: correctionNotes,
        contributorId: citizenId,
      });
      setSuccessMsg(`Correction submitted for administrator review (ID: ${submission.proposalId})`);
      setShowCorrectionModal(false);
      setCorrectionSourceUrl('');
      setCorrectionAuthorityName('');
      setCorrectionNotes('');
    } catch (err) {
      setErrorMsg(err.message || 'Failed to submit correction');
    }
  };

  const completedCount = checklistItems.filter((i) => i.completed).length;
  const totalCount = checklistItems.length;
  const completionPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div
      className="tree-permission-guide"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
        color: 'var(--text-primary, #1e293b)',
        fontFamily: 'inherit',
      }}
    >
      {/* Top Banner & Header */}
      <div
        style={{
          border: '1px solid var(--border-color, #e2e8f0)',
          borderRadius: '10px',
          padding: '1.25rem',
          backgroundColor: 'var(--card-bg, #ffffff)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <Leaf size={22} color="#16a34a" />
              <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800 }}>
                Tree-Pruning Permission &amp; Urban Tree Protection Guide
              </h2>
            </div>
            <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-secondary, #64748b)' }}>
              Official local-authority statutory guidance for tree pruning, transplantation, felling permissions, hazardous tree mitigation, and illegal felling reporting.
            </p>
          </div>

          {onBack && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onBack}
              style={{ fontSize: '0.82rem', padding: '0.4rem 0.8rem' }}
            >
              Back
            </button>
          )}
        </div>

        {/* Global Notifications */}
        {errorMsg && (
          <div
            role="alert"
            style={{
              marginTop: '1rem',
              padding: '0.75rem 1rem',
              borderRadius: '6px',
              backgroundColor: '#fee2e2',
              color: '#991b1b',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.85rem',
            }}
          >
            <AlertOctagon size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div
            role="status"
            style={{
              marginTop: '1rem',
              padding: '0.75rem 1rem',
              borderRadius: '6px',
              backgroundColor: '#dcfce7',
              color: '#166534',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.85rem',
            }}
          >
            <CheckCircle size={16} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Jurisdiction & Operation Selectors */}
        <div
          style={{
            marginTop: '1.25rem',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1rem',
            paddingTop: '1rem',
            borderTop: '1px solid var(--border-color, #e2e8f0)',
          }}
        >
          {/* Jurisdiction Selector */}
          <div>
            <label
              htmlFor={jurisdictionSelectId}
              style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.35rem' }}
            >
              Select Municipal / Forest Jurisdiction:
            </label>
            <select
              id={jurisdictionSelectId}
              value={selectedJurisdiction}
              onChange={(e) => {
                setSelectedJurisdiction(e.target.value);
                setSavedDossier(null);
                setItemOverrides({});
              }}
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                borderRadius: '6px',
                border: '1px solid var(--border-color, #cbd5e1)',
                backgroundColor: 'var(--bg-primary, #ffffff)',
                color: 'inherit',
                fontSize: '0.88rem',
              }}
            >
              {supportedJurisdictions.map((j) => (
                <option key={j.jurisdictionKey} value={j.jurisdictionKey}>
                  {j.city} ({j.state}) — {j.authorityName}
                </option>
              ))}
              <option value="UNLISTED_REGIONAL">Other / Unlisted Regional Local Body</option>
            </select>
          </div>

          {/* Operation Selector */}
          <div>
            <label
              htmlFor="operation-type-select"
              style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.35rem' }}
            >
              Select Intended Tree Action:
            </label>
            <select
              id="operation-type-select"
              value={selectedOperation}
              onChange={(e) => setSelectedOperation(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                borderRadius: '6px',
                border: '1px solid var(--border-color, #cbd5e1)',
                backgroundColor: 'var(--bg-primary, #ffffff)',
                color: 'inherit',
                fontSize: '0.88rem',
              }}
            >
              {Object.values(OPERATION_METADATA).map((op) => (
                <option key={op.id} value={op.id}>
                  {op.title} ({op.badge})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Custom Unlisted Jurisdiction Entry */}
        {selectedJurisdiction === 'UNLISTED_REGIONAL' && (
          <div
            style={{
              marginTop: '0.85rem',
              padding: '0.75rem',
              backgroundColor: '#fffbeb',
              borderRadius: '6px',
              border: '1px solid #fef3c7',
            }}
          >
            <label
              htmlFor="custom-jurisdiction-input"
              style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#92400e', marginBottom: '0.3rem' }}
            >
              Enter City / District / State:
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                id="custom-jurisdiction-input"
                type="text"
                value={customJurisdictionInput}
                onChange={(e) => setCustomJurisdictionInput(e.target.value)}
                placeholder="e.g. Bhopal, Madhya Pradesh"
                style={{
                  flex: 1,
                  padding: '0.45rem 0.65rem',
                  borderRadius: '4px',
                  border: '1px solid #d97706',
                  fontSize: '0.85rem',
                }}
              />
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  if (customJurisdictionInput.trim()) {
                    setSelectedJurisdiction(customJurisdictionInput.trim());
                  }
                }}
                style={{ fontSize: '0.82rem' }}
              >
                Inspect
              </button>
            </div>
          </div>
        )}

        {/* Jurisdiction Verification State Banner */}
        <div style={{ marginTop: '1rem' }}>
          {!authorityInfo.isSupported ? (
            <div
              style={{
                padding: '0.85rem',
                borderRadius: '6px',
                backgroundColor: '#fff7ed',
                border: '1px solid #ffedd5',
                color: '#9a3412',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.65rem',
                fontSize: '0.85rem',
              }}
            >
              <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong>UNVERIFIED / UNAVAILABLE DATA STATE:</strong> {authorityInfo.message}
                <div style={{ marginTop: '0.35rem', color: '#c2410c' }}>
                  {authorityInfo.recommendedAction}
                </div>
              </div>
            </div>
          ) : authorityInfo.isStale ? (
            <div
              style={{
                padding: '0.75rem',
                borderRadius: '6px',
                backgroundColor: '#fefce8',
                border: '1px solid #fef08a',
                color: '#854d0e',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.83rem',
              }}
            >
              <Clock size={16} />
              <span>
                <strong>Stale Data Warning:</strong> This jurisdiction's record was verified on {new Date(authorityInfo.verificationTimestamp).toLocaleDateString()}, which exceeds the 180-day freshness threshold. Re-verify directly at the official portal.
              </span>
            </div>
          ) : (
            <div
              style={{
                padding: '0.75rem',
                borderRadius: '6px',
                backgroundColor: '#f0fdf4',
                border: '1px solid #bbf7d0',
                color: '#166534',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.5rem',
                fontSize: '0.83rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldCheck size={16} />
                <span>
                  <strong>Verified Statutory Source:</strong> {authorityInfo.authorityName} (Verified: {new Date(authorityInfo.verificationTimestamp).toLocaleDateString()})
                </span>
              </div>
              {authorityInfo.sourceUrl && (
                <a
                  href={authorityInfo.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    color: '#15803d',
                    fontWeight: 600,
                    textDecoration: 'underline',
                  }}
                >
                  Official Government Portal <ExternalLink size={12} />
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Accessible Tab Navigation */}
      <div
        role="tablist"
        aria-label="Tree Permission Sections"
        style={{
          display: 'flex',
          gap: '0.35rem',
          flexWrap: 'wrap',
          borderBottom: '2px solid var(--border-color, #e2e8f0)',
          paddingBottom: '0.25rem',
        }}
      >
        {[
          { id: 'guide', label: '1. Statutory Rules & Authority' },
          { id: 'checklist', label: '2. Evidence Checklist & Dossier' },
          { id: 'emergency', label: '3. Dangerous Trees (Emergency)' },
          { id: 'reporting', label: '4. Report Illegal Felling' },
          { id: 'protected', label: '5. Protected Species' },
          { id: 'penalties', label: '6. Sourced Penalties' },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              id={`tab-${tab.id}`}
              aria-selected={isActive}
              aria-controls={`panel-${tab.id}`}
              tabIndex={isActive ? 0 : -1}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '0.55rem 0.95rem',
                borderRadius: '6px 6px 0 0',
                border: 'none',
                backgroundColor: isActive ? 'var(--accent-main, #16a34a)' : 'transparent',
                color: isActive ? '#ffffff' : 'var(--text-secondary, #64748b)',
                fontWeight: isActive ? 700 : 500,
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'background-color 0.15s ease',
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: STATUTORY RULES & AUTHORITY */}
      {activeTab === 'guide' && (
        <div
          role="tabpanel"
          id="panel-guide"
          aria-labelledby="tab-guide"
          style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
        >
          {/* Statutory Scope Warning Card */}
          <div
            style={{
              padding: '0.85rem 1rem',
              backgroundColor: '#eff6ff',
              borderRadius: '8px',
              border: '1px solid #bfdbfe',
              color: '#1e40af',
              fontSize: '0.85rem',
            }}
          >
            <strong>Statutory Law vs Editorial Advice:</strong>
            <p style={{ margin: '0.35rem 0 0', lineHeight: 1.45 }}>
              {requirementsData.statutoryNotice}
            </p>
          </div>

          {/* Sourced Authority Parameters Card */}
          <div
            style={{
              padding: '1.25rem',
              backgroundColor: 'var(--card-bg, #ffffff)',
              borderRadius: '8px',
              border: '1px solid var(--border-color, #e2e8f0)',
              boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <Scale size={20} color="#2563eb" />
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>
                Competent Tree Officer &amp; Procedural Framework
              </h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
              <div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary, #64748b)', textTransform: 'uppercase', fontWeight: 700 }}>
                  Competent Tree Officer
                </span>
                <p style={{ margin: '0.2rem 0 0', fontWeight: 600, fontSize: '0.92rem' }}>
                  {authorityInfo.competentOfficerTitle || 'Designated Tree Officer'}
                </p>
                <p style={{ margin: '0.15rem 0 0', fontSize: '0.83rem', color: 'var(--text-secondary)' }}>
                  {authorityInfo.authorityName}
                </p>
              </div>

              <div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary, #64748b)', textTransform: 'uppercase', fontWeight: 700 }}>
                  Statutory Rulebook / Act
                </span>
                <p style={{ margin: '0.2rem 0 0', fontWeight: 600, fontSize: '0.92rem' }}>
                  {authorityInfo.statutoryAct || 'State Preservation of Trees Act'}
                </p>
                <p style={{ margin: '0.15rem 0 0', fontSize: '0.83rem', color: 'var(--text-secondary)' }}>
                  Effective Date: {authorityInfo.effectiveDate || 'Not specified'}
                </p>
              </div>

              <div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary, #64748b)', textTransform: 'uppercase', fontWeight: 700 }}>
                  Compensatory Afforestation Ratio
                </span>
                <p style={{ margin: '0.2rem 0 0', fontWeight: 600, fontSize: '0.92rem', color: '#16a34a' }}>
                  {authorityInfo.compensatoryPlantationRatio || '1:10 (10 saplings per felled tree)'}
                </p>
                <p style={{ margin: '0.15rem 0 0', fontSize: '0.83rem', color: 'var(--text-secondary)' }}>
                  Mandatory indigenous species nurturing for 2-3 years.
                </p>
              </div>

              <div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary, #64748b)', textTransform: 'uppercase', fontWeight: 700 }}>
                  Public Objection Notice Window
                </span>
                <p style={{ margin: '0.2rem 0 0', fontWeight: 600, fontSize: '0.92rem' }}>
                  {authorityInfo.publicObjectionWindowDays ? `${authorityInfo.publicObjectionWindowDays} calendar days` : '15 to 30 days statutory notice'}
                </p>
                <p style={{ margin: '0.15rem 0 0', fontSize: '0.83rem', color: 'var(--text-secondary)' }}>
                  Mandatory newspaper / website notice for non-hazardous mature trees.
                </p>
              </div>
            </div>

            {/* Pruning Threshold Specifics */}
            <div
              style={{
                marginTop: '1.25rem',
                padding: '0.85rem',
                backgroundColor: 'var(--bg-secondary, #f8fafc)',
                borderRadius: '6px',
                border: '1px solid var(--border-color, #e2e8f0)',
              }}
            >
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Branch Girth Exemption vs Formal Permission Threshold:
              </span>
              <p style={{ margin: '0.35rem 0 0', fontSize: '0.85rem', lineHeight: 1.45 }}>
                {authorityInfo.pruningThresholdRule ||
                  'Branch trimming exceeding 10-15 cm in girth mandates prior Tree Officer inspection and permission.'}
              </p>
            </div>

            {/* Editorial Advice Box */}
            <div
              style={{
                marginTop: '1rem',
                padding: '0.85rem',
                backgroundColor: '#faf5ff',
                borderRadius: '6px',
                border: '1px solid #f3e8ff',
                color: '#6b21a8',
                fontSize: '0.84rem',
              }}
            >
              <strong>Editorial Practice Note:</strong>
              <p style={{ margin: '0.25rem 0 0', lineHeight: 1.45 }}>
                {requirementsData.editorialNotice}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: EVIDENCE CHECKLIST & USER DOSSIER */}
      {activeTab === 'checklist' && (
        <div
          role="tabpanel"
          id="panel-checklist"
          aria-labelledby="tab-checklist"
          style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
        >
          {/* Progress Header */}
          <div
            style={{
              padding: '1rem 1.25rem',
              backgroundColor: 'var(--card-bg, #ffffff)',
              borderRadius: '8px',
              border: '1px solid var(--border-color, #e2e8f0)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle size={18} color="#16a34a" />
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>
                  Application Evidence Checklist ({completedCount}/{totalCount} Items Completed — {completionPct}%)
                </h3>
              </div>
              <p style={{ margin: '0.2rem 0 0', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                {savedDossier ? `Linked to Dossier ID: ${savedDossier.id}` : 'Draft Mode (Unsaved)'}
              </p>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSaveChecklist}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  fontSize: '0.82rem',
                  padding: '0.45rem 0.85rem',
                }}
              >
                <Save size={14} />
                <span>Save Checklist</span>
              </button>

              {savedDossier && (
                <>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleExportSanitized}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      fontSize: '0.82rem',
                      padding: '0.45rem 0.85rem',
                    }}
                  >
                    <Download size={14} />
                    <span>Export Sanitized JSON</span>
                  </button>

                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={handleDeleteChecklist}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      fontSize: '0.82rem',
                      padding: '0.45rem 0.85rem',
                      backgroundColor: '#ef4444',
                      color: '#ffffff',
                    }}
                  >
                    <Trash2 size={14} />
                    <span>Delete Dossier</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Dossier Metadata Form */}
          <div
            style={{
              padding: '1rem 1.25rem',
              backgroundColor: 'var(--card-bg, #ffffff)',
              borderRadius: '8px',
              border: '1px solid var(--border-color, #e2e8f0)',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '0.85rem',
            }}
          >
            <div>
              <label htmlFor="tree-species-input" style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                Tree Species (Common / Botanical):
              </label>
              <input
                id="tree-species-input"
                type="text"
                value={treeSpeciesInput}
                onChange={(e) => setTreeSpeciesInput(e.target.value)}
                placeholder="e.g. Neem / Azadirachta indica"
                style={{
                  width: '100%',
                  padding: '0.45rem 0.65rem',
                  borderRadius: '4px',
                  border: '1px solid var(--border-color, #cbd5e1)',
                  fontSize: '0.85rem',
                }}
              />
            </div>

            <div>
              <label htmlFor="tree-location-input" style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                Location / Yard Description:
              </label>
              <input
                id="tree-location-input"
                type="text"
                value={locationDescriptionInput}
                onChange={(e) => setLocationDescriptionInput(e.target.value)}
                placeholder="e.g. Front yard near boundary wall"
                style={{
                  width: '100%',
                  padding: '0.45rem 0.65rem',
                  borderRadius: '4px',
                  border: '1px solid var(--border-color, #cbd5e1)',
                  fontSize: '0.85rem',
                }}
              />
            </div>

            <div>
              <label htmlFor="tree-girth-input" style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                Estimated Trunk Girth (cm at 1.3m height):
              </label>
              <input
                id="tree-girth-input"
                type="number"
                value={estimatedGirthInput}
                onChange={(e) => setEstimatedGirthInput(e.target.value)}
                placeholder="e.g. 60"
                style={{
                  width: '100%',
                  padding: '0.45rem 0.65rem',
                  borderRadius: '4px',
                  border: '1px solid var(--border-color, #cbd5e1)',
                  fontSize: '0.85rem',
                }}
              />
            </div>
          </div>

          {/* Checklist Items Grouped */}
          {requirementsData.evidenceChecklist.map((category) => (
            <div
              key={category.categoryId}
              style={{
                backgroundColor: 'var(--card-bg, #ffffff)',
                borderRadius: '8px',
                border: '1px solid var(--border-color, #e2e8f0)',
                padding: '1.25rem',
              }}
            >
              <h4 style={{ margin: '0 0 0.85rem', fontSize: '0.95rem', fontWeight: 700, color: '#0f766e' }}>
                {category.categoryTitle}
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {category.items.map((item) => {
                  const stateItem = checklistItems.find((i) => i.itemId === item.id) || {};
                  const isChecked = stateItem.completed || false;

                  return (
                    <div
                      key={item.id}
                      style={{
                        padding: '0.75rem',
                        borderRadius: '6px',
                        backgroundColor: isChecked ? '#f0fdf4' : 'var(--bg-secondary, #f8fafc)',
                        border: isChecked ? '1px solid #86efac' : '1px solid var(--border-color, #e2e8f0)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.4rem',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
                        <input
                          type="checkbox"
                          id={`check-${item.id}`}
                          checked={isChecked}
                          onChange={() => handleItemToggle(item.id)}
                          style={{ marginTop: '0.2rem', cursor: 'pointer', transform: 'scale(1.15)' }}
                        />
                        <label
                          htmlFor={`check-${item.id}`}
                          style={{
                            flex: 1,
                            fontSize: '0.88rem',
                            fontWeight: isChecked ? 600 : 500,
                            cursor: 'pointer',
                            color: isChecked ? '#166534' : 'inherit',
                          }}
                        >
                          {item.label}
                          {item.mandatory ? (
                            <span style={{ marginLeft: '0.4rem', color: '#b91c1c', fontSize: '0.75rem', fontWeight: 700 }}>
                              *Mandatory
                            </span>
                          ) : (
                            <span style={{ marginLeft: '0.4rem', color: '#64748b', fontSize: '0.75rem' }}>
                              (Conditional)
                            </span>
                          )}
                        </label>
                      </div>

                      {item.condition && (
                        <p style={{ margin: '0 0 0 1.85rem', fontSize: '0.78rem', color: '#d97706', fontStyle: 'italic' }}>
                          Condition: {item.condition}
                        </p>
                      )}

                      {item.helpText && (
                        <p style={{ margin: '0 0 0 1.85rem', fontSize: '0.78rem', color: 'var(--text-secondary, #64748b)' }}>
                          {item.helpText}
                        </p>
                      )}

                      {/* Optional Document Token Field */}
                      <div style={{ marginLeft: '1.85rem', marginTop: '0.25rem' }}>
                        <input
                          type="text"
                          value={stateItem.documentRef || ''}
                          onChange={(e) => handleItemDocRefChange(item.id, e.target.value)}
                          placeholder="Optional attachment reference / deed registration token"
                          style={{
                            width: '100%',
                            maxWidth: '380px',
                            padding: '0.3rem 0.5rem',
                            fontSize: '0.78rem',
                            borderRadius: '4px',
                            border: '1px solid var(--border-color, #cbd5e1)',
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Sanitized Export Modal / Preview */}
          {sanitizedPreview && (
            <div
              style={{
                marginTop: '1rem',
                padding: '1.25rem',
                backgroundColor: '#f8fafc',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <ShieldCheck size={18} color="#059669" />
                  <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>
                    Sanitized Export Preview (All Personal Identifiers Redacted)
                  </h4>
                </div>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setSanitizedPreview(null)}
                  style={{ fontSize: '0.78rem', padding: '0.25rem 0.6rem' }}
                >
                  Close
                </button>
              </div>
              <p style={{ margin: '0 0 0.5rem', fontSize: '0.8rem', color: '#475569' }}>
                Notice: Citizen ID, precise plot coordinates, citizen notes, and document attachment tokens are systematically scrubbed.
              </p>
              <pre
                style={{
                  backgroundColor: '#0f172a',
                  color: '#f8fafc',
                  padding: '1rem',
                  borderRadius: '6px',
                  fontSize: '0.78rem',
                  overflowX: 'auto',
                  maxHeight: '260px',
                }}
              >
                {JSON.stringify(sanitizedPreview, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: DANGEROUS TREES (EMERGENCY) */}
      {activeTab === 'emergency' && (
        <div
          role="tabpanel"
          id="panel-emergency"
          aria-labelledby="tab-emergency"
          style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
        >
          {/* Emergency Alert Card */}
          <div
            style={{
              padding: '1.25rem',
              backgroundColor: '#fef2f2',
              borderRadius: '8px',
              border: '2px solid #ef4444',
              color: '#991b1b',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <AlertOctagon size={24} color="#dc2626" />
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>
                24/7 Fast-Track Route for Imminent Tree Collapse &amp; Storm Hazards
              </h3>
            </div>
            <p style={{ margin: 0, fontSize: '0.88rem', lineHeight: 1.45 }}>
              Standard 15–30 day public objection windows are legally bypassed when a tree presents an active danger to human life, power cables, or vehicular traffic.
            </p>

            <div
              style={{
                marginTop: '1rem',
                padding: '0.75rem 1rem',
                backgroundColor: '#ffffff',
                borderRadius: '6px',
                border: '1px solid #fca5a5',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
              }}
            >
              <PhoneCall size={20} color="#b91c1c" />
              <div>
                <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', fontWeight: 700, color: '#7f1d1d' }}>
                  Emergency Disaster &amp; Forest Control Room:
                </span>
                <p style={{ margin: '0.15rem 0 0', fontWeight: 800, fontSize: '1.05rem', color: '#991b1b' }}>
                  {emergencyData.emergencyHotline}
                </p>
              </div>
            </div>
          </div>

          {/* Action Steps */}
          <div
            style={{
              padding: '1.25rem',
              backgroundColor: 'var(--card-bg, #ffffff)',
              borderRadius: '8px',
              border: '1px solid var(--border-color, #e2e8f0)',
            }}
          >
            <h4 style={{ margin: '0 0 1rem', fontSize: '0.98rem', fontWeight: 700 }}>
              Immediate Citizen Safety Protocol
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {emergencyData.immediateActionSteps.map((step) => (
                <div
                  key={step.stepNumber}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.75rem',
                    padding: '0.75rem',
                    backgroundColor: 'var(--bg-secondary, #f8fafc)',
                    borderRadius: '6px',
                  }}
                >
                  <span
                    style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '50%',
                      backgroundColor: '#dc2626',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '0.82rem',
                      flexShrink: 0,
                    }}
                  >
                    {step.stepNumber}
                  </span>
                  <div>
                    <strong style={{ fontSize: '0.88rem' }}>{step.title}</strong>
                    <p style={{ margin: '0.2rem 0 0', fontSize: '0.83rem', color: 'var(--text-secondary)' }}>
                      {step.instruction}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: REPORT ILLEGAL FELLING */}
      {activeTab === 'reporting' && (
        <div
          role="tabpanel"
          id="panel-reporting"
          aria-labelledby="tab-reporting"
          style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
        >
          {/* Whistleblower Banner */}
          <div
            style={{
              padding: '1.25rem',
              backgroundColor: '#f0fdf4',
              borderRadius: '8px',
              border: '1px solid #bbf7d0',
              color: '#166534',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <ShieldCheck size={22} color="#15803d" />
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>
                {reportingData.title}
              </h3>
            </div>
            <p style={{ margin: 0, fontSize: '0.86rem', lineHeight: 1.45 }}>
              {reportingData.confidentialityNotice}
            </p>
            <div style={{ marginTop: '0.75rem', fontWeight: 700, fontSize: '0.9rem' }}>
              Vigilance Helpline: {reportingData.helpline}
            </div>
          </div>

          {/* Investigation Steps */}
          <div
            style={{
              padding: '1.25rem',
              backgroundColor: 'var(--card-bg, #ffffff)',
              borderRadius: '8px',
              border: '1px solid var(--border-color, #e2e8f0)',
            }}
          >
            <h4 style={{ margin: '0 0 1rem', fontSize: '0.98rem', fontWeight: 700 }}>
              Evidence Collection &amp; Safe Action Steps
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {reportingData.investigationSteps.map((step) => (
                <div
                  key={step.stepNumber}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.75rem',
                    padding: '0.75rem',
                    backgroundColor: 'var(--bg-secondary, #f8fafc)',
                    borderRadius: '6px',
                  }}
                >
                  <span
                    style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '50%',
                      backgroundColor: '#16a34a',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '0.82rem',
                      flexShrink: 0,
                    }}
                  >
                    {step.stepNumber}
                  </span>
                  <div>
                    <strong style={{ fontSize: '0.88rem' }}>{step.title}</strong>
                    <p style={{ margin: '0.2rem 0 0', fontSize: '0.83rem', color: 'var(--text-secondary)' }}>
                      {step.instruction}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: PROTECTED SPECIES */}
      {activeTab === 'protected' && (
        <div
          role="tabpanel"
          id="panel-protected"
          aria-labelledby="tab-protected"
          style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
        >
          <div
            style={{
              padding: '1rem 1.25rem',
              backgroundColor: 'var(--card-bg, #ffffff)',
              borderRadius: '8px',
              border: '1px solid var(--border-color, #e2e8f0)',
            }}
          >
            <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.05rem', fontWeight: 700 }}>
              Special Protected &amp; Reserved Timber Tree Species
            </h3>
            <p style={{ margin: '0 0 1rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Felling or lopping of the following species triggers heightened statutory scrutiny, mandatory state-level review, or complete legal prohibition under State Forest and Wildlife Preservation schedules.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.85rem' }}>
              {protectedSpeciesList.map((species) => (
                <div
                  key={species.commonName}
                  style={{
                    padding: '0.85rem',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color, #e2e8f0)',
                    backgroundColor: 'var(--bg-secondary, #f8fafc)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#166534' }}>
                      {species.commonName}
                    </h4>
                    <span
                      style={{
                        fontSize: '0.72rem',
                        padding: '0.15rem 0.45rem',
                        borderRadius: '4px',
                        backgroundColor: '#fef3c7',
                        color: '#92400e',
                        fontWeight: 600,
                      }}
                    >
                      {species.protectionCategory}
                    </span>
                  </div>
                  <p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', fontStyle: 'italic', color: '#64748b' }}>
                    {species.botanicalName}
                  </p>
                  <p style={{ margin: '0.45rem 0 0', fontSize: '0.82rem', lineHeight: 1.4 }}>
                    {species.rules}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: SOURCED PENALTIES */}
      {activeTab === 'penalties' && (
        <div
          role="tabpanel"
          id="panel-penalties"
          aria-labelledby="tab-penalties"
          style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
        >
          <div
            style={{
              padding: '1.25rem',
              backgroundColor: 'var(--card-bg, #ffffff)',
              borderRadius: '8px',
              border: '1px solid var(--border-color, #e2e8f0)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem' }}>
              <Scale size={20} color="#b91c1c" />
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>
                Statutory Penalties &amp; Offenses under Preservation of Trees Acts
              </h3>
            </div>

            {authorityInfo.statutoryPenalties ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div
                  style={{
                    padding: '0.85rem',
                    borderRadius: '6px',
                    backgroundColor: '#fef2f2',
                    border: '1px solid #fecaca',
                  }}
                >
                  <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', fontWeight: 700, color: '#991b1b' }}>
                    Statutory Legal Section:
                  </span>
                  <p style={{ margin: '0.2rem 0 0', fontWeight: 700, color: '#7f1d1d' }}>
                    {authorityInfo.statutoryPenalties.legalSection}
                  </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.85rem' }}>
                  <div
                    style={{
                      padding: '0.85rem',
                      borderRadius: '6px',
                      backgroundColor: 'var(--bg-secondary, #f8fafc)',
                      border: '1px solid var(--border-color, #e2e8f0)',
                    }}
                  >
                    <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', fontWeight: 700, color: '#64748b' }}>
                      Maximum Imprisonment:
                    </span>
                    <p style={{ margin: '0.2rem 0 0', fontWeight: 600, color: '#991b1b' }}>
                      {authorityInfo.statutoryPenalties.imprisonmentMax}
                    </p>
                  </div>

                  <div
                    style={{
                      padding: '0.85rem',
                      borderRadius: '6px',
                      backgroundColor: 'var(--bg-secondary, #f8fafc)',
                      border: '1px solid var(--border-color, #e2e8f0)',
                    }}
                  >
                    <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', fontWeight: 700, color: '#64748b' }}>
                      Statutory Fine &amp; Forfeiture:
                    </span>
                    <p style={{ margin: '0.2rem 0 0', fontWeight: 600, color: '#991b1b' }}>
                      {authorityInfo.statutoryPenalties.fineMax}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Penalties for this jurisdiction are subject to the Indian Forest Act, 1927 and Bharatiya Nyaya Sanhita (BNS) / IPC provisions.
              </p>
            )}

            {/* Community Correction Prompt */}
            <div
              style={{
                marginTop: '1.25rem',
                paddingTop: '1rem',
                borderTop: '1px solid var(--border-color, #e2e8f0)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '0.5rem',
              }}
            >
              <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                Notice an outdated penalty figure or missing municipal notification?
              </span>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowCorrectionModal(true)}
                style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
              >
                Submit Correction Proposal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Community Correction Proposal Modal */}
      {showCorrectionModal && (
        <div
          role="dialog"
          aria-labelledby="correction-modal-title"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            zIndex: 9999,
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--card-bg, #ffffff)',
              borderRadius: '8px',
              padding: '1.5rem',
              maxWidth: '500px',
              width: '100%',
              boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
            }}
          >
            <h3 id="correction-modal-title" style={{ margin: '0 0 0.5rem', fontSize: '1.1rem', fontWeight: 700 }}>
              Submit Sourced Authority Correction
            </h3>
            <p style={{ margin: '0 0 1rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              All community corrections undergo administrative verification. Submissions without a verifiable official government source URL are automatically declined.
            </p>

            <form onSubmit={handleSubmitCorrection} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '0.2rem' }}>
                  Official Government Gazette / Portal Source URL*:
                </label>
                <input
                  type="url"
                  required
                  value={correctionSourceUrl}
                  onChange={(e) => setCorrectionSourceUrl(e.target.value)}
                  placeholder="https://... (official .gov.in URL required)"
                  style={{
                    width: '100%',
                    padding: '0.45rem 0.65rem',
                    borderRadius: '4px',
                    border: '1px solid var(--border-color, #cbd5e1)',
                    fontSize: '0.85rem',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '0.2rem' }}>
                  Authority Name / Tree Cell:
                </label>
                <input
                  type="text"
                  value={correctionAuthorityName}
                  onChange={(e) => setCorrectionAuthorityName(e.target.value)}
                  placeholder="e.g. BMC Tree Authority Ward K-West"
                  style={{
                    width: '100%',
                    padding: '0.45rem 0.65rem',
                    borderRadius: '4px',
                    border: '1px solid var(--border-color, #cbd5e1)',
                    fontSize: '0.85rem',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '0.2rem' }}>
                  Notes &amp; Specific Changes*:
                </label>
                <textarea
                  required
                  rows={3}
                  value={correctionNotes}
                  onChange={(e) => setCorrectionNotes(e.target.value)}
                  placeholder="Detail the updated statutory penalty, new circular date, or changed helpline..."
                  style={{
                    width: '100%',
                    padding: '0.45rem 0.65rem',
                    borderRadius: '4px',
                    border: '1px solid var(--border-color, #cbd5e1)',
                    fontSize: '0.85rem',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowCorrectionModal(false)}
                  style={{ fontSize: '0.82rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ fontSize: '0.82rem' }}
                >
                  Submit Proposal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
