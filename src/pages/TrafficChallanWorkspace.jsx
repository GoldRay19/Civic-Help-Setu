import { useState, useMemo } from 'react';
import {
  Car,
  Plus,
  Download,
  FileText,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import {
  getChallanCases,
  saveChallanCase,
  deleteChallanCase,
  exportChallanCasesDossier,
  OFFICIAL_STATUS_DISCLAIMER,
} from '../services/trafficChallanStorage.js';
import {
  sanitizeChallanCase,
} from '../services/trafficChallanService.js';
import Rule167AAuditorCard from '../components/trafficChallan/Rule167AAuditorCard.jsx';
import ChallanDefectAnalyzerCard from '../components/trafficChallan/ChallanDefectAnalyzerCard.jsx';
import TrafficChallanSummaryCard from '../components/trafficChallan/TrafficChallanSummaryCard.jsx';
import TrafficChallanDrafterModal from '../components/trafficChallan/TrafficChallanDrafterModal.jsx';

export default function TrafficChallanWorkspace() {
  const [cases, setCases] = useState(() => getChallanCases());
  const [activeCaseId, setActiveCaseId] = useState(() => getChallanCases()[0]?.id || null);
  const [activeTab, setActiveTab] = useState('audit'); // 'audit' | 'defects'
  const [showDrafter, setShowDrafter] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);
  const [isEditingMetadata, setIsEditingMetadata] = useState(false);

  const activeCase = useMemo(() => {
    return cases.find((c) => c.id === activeCaseId) || cases[0] || null;
  }, [cases, activeCaseId]);

  const handleCreateNewCase = async () => {
    const newCase = {
      id: `challan-case-${Date.now()}`,
      ownerName: '',
      ownerContact: '',
      ownerAddress: '',
      vehicleNumber: 'DL-01-XX-0000',
      vehicleClass: 'Motor Car (LMV)',
      challanNumber: `CH-${Date.now().toString().slice(-8)}`,
      challanDate: new Date().toISOString().split('T')[0],
      challanTime: '12:00:00',
      location: 'City Junction / Highway',
      allegedOffence: 'Section 183 - Excessive Speed',
      fineAmount: 1000,
      daysToService: 0,
      selectedDefects: ['uncalibrated_camera'],
      rule167AChecks: {},
      defectNotes: '',
      alibiDetails: '',
      status: 'DRAFT',
      createdAt: new Date().toISOString(),
    };

    const saved = await saveChallanCase(newCase);
    setCases((prev) => [saved, ...prev]);
    setActiveCaseId(saved.id);
    setIsEditingMetadata(true);
  };

  const handleUpdateActiveCase = async (updates) => {
    if (!activeCase) return;
    const merged = { ...activeCase, ...updates };
    const saved = await saveChallanCase(merged);
    setCases((prev) => prev.map((c) => (c.id === saved.id ? saved : c)));
    setSaveSuccessMsg(true);
    setTimeout(() => setSaveSuccessMsg(false), 2000);
  };

  const handleDeleteCase = (id) => {
    if (window.confirm('Are you sure you want to delete this traffic challan dispute record?')) {
      deleteChallanCase(id);
      const remaining = cases.filter((c) => c.id !== id);
      setCases(remaining);
      if (activeCaseId === id) {
        setActiveCaseId(remaining[0]?.id || null);
      }
    }
  };

  const handleExportDossier = () => {
    const jsonStr = exportChallanCasesDossier();
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Traffic_Challan_Dispute_Dossier_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportCaseJson = (c) => {
    const sanitized = sanitizeChallanCase(c);
    const blob = new Blob([JSON.stringify(sanitized, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ChallanCase_${c.challanNumber || c.id}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportCaseMarkdown = (c) => {
    const md = `# Traffic E-Challan Dispute Case
Case ID: ${c.id}
Challan Ref: ${c.challanNumber}
Vehicle No: ${c.vehicleNumber} (${c.vehicleClass || 'LMV'})
Alleged Offence: ${c.allegedOffence}
Fine Demand: ₹${Number(c.fineAmount || 0).toLocaleString('en-IN')}
Date & Time: ${c.challanDate} ${c.challanTime}
Location: ${c.location}
Status: ${c.status}

## Evidentiary Defects Identified:
${(c.selectedDefects || []).map((d) => `- ${d}`).join('\n')}

Defect Notes:
${c.defectNotes || 'None'}

Alibi Details:
${c.alibiDetails || 'None'}

---
*${OFFICIAL_STATUS_DISCLAIMER}*
`;
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ChallanCase_${c.challanNumber || c.id}.md`;
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
              <span className="p-3 rounded-xl bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                <Car className="w-8 h-8" />
              </span>
              <div>
                <h1 className="text-2xl font-black text-slate-900 dark:text-white">
                  Traffic E-Challan Dispute Workspace
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  Automated Camera Defect &amp; Section 208 Virtual Court Contest Auditor (CMVR Rule 167A)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleCreateNewCase}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>New Challan Dispute</span>
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
                Active Disputes ({cases.length}):
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
                        ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-200 font-bold border border-indigo-300 dark:border-indigo-800'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {c.vehicleNumber} ({c.challanNumber})
                  </button>
                ))}
              </div>
            </div>

            {saveSuccessMsg && (
              <span className="text-xs text-emerald-600 font-bold flex items-center gap-1 animate-fade-in pr-2">
                <CheckCircle2 className="w-4 h-4" /> Saved &amp; Sealed
              </span>
            )}
          </div>
        )}

        {/* Active Case Summary Card */}
        {activeCase && (
          <TrafficChallanSummaryCard
            caseData={activeCase}
            onStatusChange={(id, newStatus) => handleUpdateActiveCase({ status: newStatus })}
            onEditCase={() => setIsEditingMetadata(!isEditingMetadata)}
            onDeleteCase={handleDeleteCase}
            onExportJson={handleExportCaseJson}
            onExportMarkdown={handleExportCaseMarkdown}
            onOpenDrafter={() => setShowDrafter(true)}
          />
        )}

        {/* Metadata Editor Form (Collapsible) */}
        {isEditingMetadata && activeCase && (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-600" />
                Edit Challan &amp; Vehicle Particulars
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
                  Vehicle Registration Number
                </label>
                <input
                  type="text"
                  value={activeCase.vehicleNumber || ''}
                  onChange={(e) => handleUpdateActiveCase({ vehicleNumber: e.target.value })}
                  placeholder="e.g. KA-01-MJ-4099"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  Vehicle Class
                </label>
                <input
                  type="text"
                  value={activeCase.vehicleClass || ''}
                  onChange={(e) => handleUpdateActiveCase({ vehicleClass: e.target.value })}
                  placeholder="e.g. Motor Car / Two-Wheeler"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  Challan Reference Number
                </label>
                <input
                  type="text"
                  value={activeCase.challanNumber || ''}
                  onChange={(e) => handleUpdateActiveCase({ challanNumber: e.target.value })}
                  placeholder="e.g. KA26110998341A"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  Alleged Offence
                </label>
                <input
                  type="text"
                  value={activeCase.allegedOffence || ''}
                  onChange={(e) => handleUpdateActiveCase({ allegedOffence: e.target.value })}
                  placeholder="e.g. Section 183 - Excessive Speed"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  Fine Amount Demanded (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={activeCase.fineAmount || ''}
                  onChange={(e) => handleUpdateActiveCase({ fineAmount: Number(e.target.value) || 0 })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  Location / Junction
                </label>
                <input
                  type="text"
                  value={activeCase.location || ''}
                  onChange={(e) => handleUpdateActiveCase({ location: e.target.value })}
                  placeholder="e.g. Outer Ring Road, Bengaluru"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="font-semibold text-slate-600 dark:text-slate-400 block mb-1 text-xs">
                  Camera / Evidentiary Defect Notes
                </label>
                <textarea
                  value={activeCase.defectNotes || ''}
                  onChange={(e) => handleUpdateActiveCase({ defectNotes: e.target.value })}
                  rows={2}
                  placeholder="e.g. Blurred photo, speed radar uncertified, plate belongs to a scooter."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-600 dark:text-slate-400 block mb-1 text-xs">
                  Alibi Proof (Fastag Toll / Parking / Dashcam)
                </label>
                <textarea
                  value={activeCase.alibiDetails || ''}
                  onChange={(e) => handleUpdateActiveCase({ alibiDetails: e.target.value })}
                  rows={2}
                  placeholder="e.g. Fastag toll record verifies vehicle was 45 km away at the time."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
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
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                1. Rule 167A Electronic Evidence Auditor
              </button>
              <button
                onClick={() => setActiveTab('defects')}
                className={`pb-3 text-sm font-bold border-b-2 transition-all ${
                  activeTab === 'defects'
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                2. Challan Defects &amp; Grounds of Contest
              </button>
            </div>

            {/* Tab 1: Rule 167A Auditor */}
            {activeTab === 'audit' && (
              <Rule167AAuditorCard
                checks={activeCase.rule167AChecks || {}}
                daysToService={activeCase.daysToService || 0}
                onChange={(updates) => handleUpdateActiveCase(updates)}
              />
            )}

            {/* Tab 2: Defect Analyzer */}
            {activeTab === 'defects' && (
              <ChallanDefectAnalyzerCard
                selectedDefects={activeCase.selectedDefects || []}
                fineAmount={activeCase.fineAmount || 0}
                onChange={(updates) => handleUpdateActiveCase(updates)}
              />
            )}
          </div>
        )}

        {/* Drafter Modal */}
        {showDrafter && activeCase && (
          <TrafficChallanDrafterModal
            caseData={activeCase}
            onClose={() => setShowDrafter(false)}
          />
        )}
      </div>
    </div>
  );
}
