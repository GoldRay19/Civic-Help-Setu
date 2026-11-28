import { useState, useMemo } from 'react';
import {
  UtensilsCrossed,
  Plus,
  Download,
  FileText,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import {
  getFoodSafetyCases,
  saveFoodSafetyCase,
  deleteFoodSafetyCase,
  exportFoodSafetyCasesDossier,
  OFFICIAL_STATUS_DISCLAIMER,
} from '../services/foodSafetyStorage.js';
import {
  sanitizeFoodSafetyCase,
} from '../services/foodSafetyService.js';
import Schedule4AuditorCard from '../components/foodSafety/Schedule4AuditorCard.jsx';
import AdulterationPenaltyCalculatorCard from '../components/foodSafety/AdulterationPenaltyCalculatorCard.jsx';
import FoodSafetyCaseSummaryCard from '../components/foodSafety/FoodSafetyCaseSummaryCard.jsx';
import FoodSafetyDrafterModal from '../components/foodSafety/FoodSafetyDrafterModal.jsx';

export default function FoodSafetyWorkspace() {
  const [cases, setCases] = useState(() => getFoodSafetyCases());
  const [activeCaseId, setActiveCaseId] = useState(() => getFoodSafetyCases()[0]?.id || null);
  const [activeTab, setActiveTab] = useState('audit'); // 'audit' | 'calculator' | 'metadata'
  const [showDrafter, setShowDrafter] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);
  const [isEditingMetadata, setIsEditingMetadata] = useState(false);

  // Active case object
  const activeCase = useMemo(() => {
    return cases.find((c) => c.id === activeCaseId) || cases[0] || null;
  }, [cases, activeCaseId]);

  const handleCreateNewCase = async () => {
    const newCase = {
      id: `fssai-case-${Date.now()}`,
      complainantName: '',
      complainantAddress: '',
      complainantContact: '',
      fboName: 'New Establishment / Restaurant',
      fboAddress: '',
      fboLicenseNumber: '',
      productName: 'Adulterated Food Article',
      batchNumber: '',
      purchaseDate: new Date().toISOString().split('T')[0],
      purchaseInvoice: '',
      labReportNumber: '',
      injuryTier: 'NONE',
      actualMedicalBills: 0,
      daysHospitalized: 0,
      lostWages: 0,
      selectedViolations: ['substandard'],
      schedule4Checks: {},
      evidenceNotes: '',
      status: 'DRAFT',
      createdAt: new Date().toISOString(),
    };

    const saved = await saveFoodSafetyCase(newCase);
    setCases((prev) => [saved, ...prev]);
    setActiveCaseId(saved.id);
    setIsEditingMetadata(true);
  };

  const handleUpdateActiveCase = async (updates) => {
    if (!activeCase) return;
    const merged = { ...activeCase, ...updates };
    const saved = await saveFoodSafetyCase(merged);
    setCases((prev) => prev.map((c) => (c.id === saved.id ? saved : c)));
    setSaveSuccessMsg(true);
    setTimeout(() => setSaveSuccessMsg(false), 2000);
  };

  const handleDeleteCase = (id) => {
    if (window.confirm('Are you sure you want to delete this food safety dispute case record?')) {
      deleteFoodSafetyCase(id);
      const remaining = cases.filter((c) => c.id !== id);
      setCases(remaining);
      if (activeCaseId === id) {
        setActiveCaseId(remaining[0]?.id || null);
      }
    }
  };

  const handleExportDossier = () => {
    const dossierStr = exportFoodSafetyCasesDossier();
    const blob = new Blob([dossierStr], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `FSSAI_FoodSafety_Evidence_Dossier_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportCaseJson = (c) => {
    const sanitized = sanitizeFoodSafetyCase(c);
    const blob = new Blob([JSON.stringify(sanitized, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Case_${c.id}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportCaseMarkdown = (c) => {
    const md = `# FSSAI Food Safety Evidentiary Dossier
Case ID: ${c.id}
Product: ${c.productName}
FBO: ${c.fboName} (License: ${c.fboLicenseNumber || 'N/A'})
Purchase Date: ${c.purchaseDate} | Invoice: ${c.purchaseInvoice}
Status: ${c.status}
Injury Tier: ${c.injuryTier}
Medical Out-of-Pocket: ₹${Number(c.actualMedicalBills || 0).toLocaleString('en-IN')}

## Evidence & Statutory Violations:
${(c.selectedViolations || []).map((v) => `- ${v}`).join('\n')}

Notes:
${c.evidenceNotes || 'None'}

---
*${OFFICIAL_STATUS_DISCLAIMER}*
`;
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Case_${c.id}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Workspace Title & Actions Header */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="p-3 rounded-xl bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300">
                <UtensilsCrossed className="w-8 h-8" />
              </span>
              <div>
                <h1 className="text-2xl font-black text-slate-900 dark:text-white">
                  Food Safety (FSSAI) Redressal Workspace
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  Adulteration & Hygiene Evidence Auditor under the Food Safety and Standards Act, 2006
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleCreateNewCase}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-orange-600 hover:bg-orange-700 text-white shadow-sm transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>New Food Complaint</span>
              </button>

              <button
                onClick={handleExportDossier}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Export Dossier (JSON)</span>
              </button>
            </div>
          </div>

          {/* Official Disclaimer Banner */}
          <div className="mt-5 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <span className="font-bold">Statutory Integrity Notice:</span>{' '}
              {OFFICIAL_STATUS_DISCLAIMER}
            </div>
          </div>
        </div>

        {/* Case Selector Strip */}
        {cases.length > 0 && (
          <div className="flex items-center justify-between gap-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-3 shadow-sm overflow-x-auto">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">
                Active Cases ({cases.length}):
              </span>
              <div className="flex items-center gap-2">
                {cases.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      setActiveCaseId(c.id);
                      setIsEditingMetadata(false);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                      c.id === activeCaseId
                        ? 'bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-200 font-bold border border-orange-300 dark:border-orange-800'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {c.productName || c.id}
                  </button>
                ))}
              </div>
            </div>

            {saveSuccessMsg && (
              <span className="text-xs text-emerald-600 font-bold flex items-center gap-1 animate-fade-in pr-2">
                <CheckCircle2 className="w-4 h-4" /> Saved & Sealed
              </span>
            )}
          </div>
        )}

        {/* Active Case Summary Card */}
        {activeCase && (
          <FoodSafetyCaseSummaryCard
            caseData={activeCase}
            onStatusChange={(id, newStatus) => handleUpdateActiveCase({ status: newStatus })}
            onEditCase={() => setIsEditingMetadata(!isEditingMetadata)}
            onDeleteCase={handleDeleteCase}
            onExportJson={handleExportCaseJson}
            onExportMarkdown={handleExportCaseMarkdown}
            onOpenDrafter={() => setShowDrafter(true)}
          />
        )}

        {/* Metadata Editor Form (collapsible) */}
        {isEditingMetadata && activeCase && (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-orange-600" />
                Edit Case Particulars & FBO Details
              </h3>
              <button
                onClick={() => setIsEditingMetadata(false)}
                className="text-xs text-slate-500 hover:text-slate-700"
              >
                Close Editor
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  Product / Food Item Name
                </label>
                <input
                  type="text"
                  value={activeCase.productName || ''}
                  onChange={(e) => handleUpdateActiveCase({ productName: e.target.value })}
                  placeholder="e.g. Paneer Butter Masala"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  Food Business Operator (FBO) Name
                </label>
                <input
                  type="text"
                  value={activeCase.fboName || ''}
                  onChange={(e) => handleUpdateActiveCase({ fboName: e.target.value })}
                  placeholder="e.g. Royal Spice Cloud Kitchen"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  FSSAI 14-Digit License / Reg. No.
                </label>
                <input
                  type="text"
                  value={activeCase.fboLicenseNumber || ''}
                  onChange={(e) => handleUpdateActiveCase({ fboLicenseNumber: e.target.value })}
                  placeholder="e.g. 11521038000412"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  Batch / Lot / Bill Reference
                </label>
                <input
                  type="text"
                  value={activeCase.batchNumber || ''}
                  onChange={(e) => handleUpdateActiveCase({ batchNumber: e.target.value })}
                  placeholder="e.g. BATCH-2026-K1"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  Purchase Date
                </label>
                <input
                  type="date"
                  value={activeCase.purchaseDate || ''}
                  onChange={(e) => handleUpdateActiveCase({ purchaseDate: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  Purchase Invoice / Memo No.
                </label>
                <input
                  type="text"
                  value={activeCase.purchaseInvoice || ''}
                  onChange={(e) => handleUpdateActiveCase({ purchaseInvoice: e.target.value })}
                  placeholder="e.g. INV-99214"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-600 dark:text-slate-400 block mb-1 text-xs">
                Contamination Findings, Symptoms & Evidence Notes
              </label>
              <textarea
                value={activeCase.evidenceNotes || ''}
                onChange={(e) => handleUpdateActiveCase({ evidenceNotes: e.target.value })}
                rows={3}
                placeholder="Describe extraneous matter, sour odor, unhygienic conditions observed, or clinical symptoms."
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>
        )}

        {/* Workspace Mode Tabs */}
        {activeCase && (
          <div>
            <div className="flex border-b border-slate-200 dark:border-slate-800 mb-6 gap-6">
              <button
                onClick={() => setActiveTab('audit')}
                className={`pb-3 text-sm font-bold border-b-2 transition-all ${
                  activeTab === 'audit'
                    ? 'border-orange-600 text-orange-600 dark:text-orange-400'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                1. Schedule 4 Sanitary Auditor
              </button>
              <button
                onClick={() => setActiveTab('calculator')}
                className={`pb-3 text-sm font-bold border-b-2 transition-all ${
                  activeTab === 'calculator'
                    ? 'border-orange-600 text-orange-600 dark:text-orange-400'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                2. Adulteration Penalties & Compensation
              </button>
            </div>

            {/* Tab 1: Schedule 4 Sanitary Auditor */}
            {activeTab === 'audit' && (
              <Schedule4AuditorCard
                checks={activeCase.schedule4Checks || {}}
                onChange={(newChecks) => handleUpdateActiveCase({ schedule4Checks: newChecks })}
              />
            )}

            {/* Tab 2: Penalties & Compensation Calculator */}
            {activeTab === 'calculator' && (
              <AdulterationPenaltyCalculatorCard
                selectedViolations={activeCase.selectedViolations || []}
                injuryTier={activeCase.injuryTier || 'NONE'}
                actualMedicalBills={activeCase.actualMedicalBills || 0}
                daysHospitalized={activeCase.daysHospitalized || 0}
                lostWages={activeCase.lostWages || 0}
                onChange={(updates) => handleUpdateActiveCase(updates)}
              />
            )}
          </div>
        )}

        {/* Drafter Modal */}
        {showDrafter && activeCase && (
          <FoodSafetyDrafterModal
            caseData={activeCase}
            onClose={() => setShowDrafter(false)}
          />
        )}
      </div>
    </div>
  );
}
