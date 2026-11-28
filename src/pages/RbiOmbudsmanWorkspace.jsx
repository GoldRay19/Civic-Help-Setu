import { useState, useMemo } from 'react';
import {
  Landmark,
  Plus,
  Download,
  FileText,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import {
  getBankingCases,
  saveBankingCase,
  deleteBankingCase,
  exportBankingCasesDossier,
  OFFICIAL_STATUS_DISCLAIMER,
} from '../services/rbiOmbudsmanStorage.js';
import {
  sanitizeBankingCase,
} from '../services/rbiOmbudsmanService.js';
import ZeroLiabilityAuditorCard from '../components/rbiOmbudsman/ZeroLiabilityAuditorCard.jsx';
import TatCompensationCalculatorCard from '../components/rbiOmbudsman/TatCompensationCalculatorCard.jsx';
import RbiBankingCaseSummaryCard from '../components/rbiOmbudsman/RbiBankingCaseSummaryCard.jsx';
import RbiOmbudsmanDrafterModal from '../components/rbiOmbudsman/RbiOmbudsmanDrafterModal.jsx';

export default function RbiOmbudsmanWorkspace() {
  const [cases, setCases] = useState(() => getBankingCases());
  const [activeCaseId, setActiveCaseId] = useState(() => getBankingCases()[0]?.id || null);
  const [activeTab, setActiveTab] = useState('zeroLiability'); // 'zeroLiability' | 'tatCompensation'
  const [showDrafter, setShowDrafter] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);
  const [isEditingMetadata, setIsEditingMetadata] = useState(false);

  const activeCase = useMemo(() => {
    return cases.find((c) => c.id === activeCaseId) || cases[0] || null;
  }, [cases, activeCaseId]);

  const handleCreateNewCase = async () => {
    const newCase = {
      id: `rbi-case-${Date.now()}`,
      complainantName: '',
      complainantContact: '',
      complainantAddress: '',
      bankName: 'Commercial Bank of India',
      branchName: 'Main Branch',
      accountNumber: 'XXXX-XXXX-0000',
      accountType: 'SAVINGS_CURRENT',
      disputeType: 'UNAUTHORIZED_DEBIT',
      channelId: 'ATM_CASH_FAILED',
      transactionAmount: 10000,
      transactionDate: new Date().toISOString().split('T')[0],
      reportingDays: 1,
      pnoRefNumber: '',
      pnoComplaintDate: '',
      selectedDeficiencies: ['unauthorized_debit'],
      incidentDetails: '',
      status: 'DRAFT',
      createdAt: new Date().toISOString(),
    };

    const saved = await saveBankingCase(newCase);
    setCases((prev) => [saved, ...prev]);
    setActiveCaseId(saved.id);
    setIsEditingMetadata(true);
  };

  const handleUpdateActiveCase = async (updates) => {
    if (!activeCase) return;
    const merged = { ...activeCase, ...updates };
    const saved = await saveBankingCase(merged);
    setCases((prev) => prev.map((c) => (c.id === saved.id ? saved : c)));
    setSaveSuccessMsg(true);
    setTimeout(() => setSaveSuccessMsg(false), 2000);
  };

  const handleDeleteCase = (id) => {
    if (window.confirm('Are you sure you want to delete this banking dispute case record?')) {
      deleteBankingCase(id);
      const remaining = cases.filter((c) => c.id !== id);
      setCases(remaining);
      if (activeCaseId === id) {
        setActiveCaseId(remaining[0]?.id || null);
      }
    }
  };

  const handleExportDossier = () => {
    const jsonStr = exportBankingCasesDossier();
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `RBI_Ombudsman_Banking_Disputes_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportCaseJson = (c) => {
    const sanitized = sanitizeBankingCase(c);
    const blob = new Blob([JSON.stringify(sanitized, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `BankingCase_${c.id}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportCaseMarkdown = (c) => {
    const md = `# RBI Banking Ombudsman Dispute Dossier
Case ID: ${c.id}
Bank: ${c.bankName} (${c.branchName || 'Digital'})
Account / Instrument: ${c.accountNumber}
Dispute Category: ${c.disputeType}
Transaction Amount: ₹${Number(c.transactionAmount || 0).toLocaleString('en-IN')}
Transaction Date: ${c.transactionDate} | Reported in: ${c.reportingDays} days
Status: ${c.status}
PNO Reference: ${c.pnoRefNumber || 'None'}

## Case Particulars & Incident Notes:
${c.incidentDetails || 'None recorded'}

---
*${OFFICIAL_STATUS_DISCLAIMER}*
`;
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `BankingCase_${c.id}.md`;
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
              <span className="p-3 rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                <Landmark className="w-8 h-8" />
              </span>
              <div>
                <h1 className="text-2xl font-black text-slate-900 dark:text-white">
                  RBI Banking Ombudsman Workspace
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  Unauthorized Digital Debits (Zero Liability) &amp; Failed Transaction TAT Compensation (RB-IOS 2021)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleCreateNewCase}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>New Banking Dispute</span>
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
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200 font-bold border border-emerald-300 dark:border-emerald-800'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {c.bankName} (₹{Number(c.transactionAmount || 0).toLocaleString('en-IN')})
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
          <RbiBankingCaseSummaryCard
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
                <FileText className="w-4 h-4 text-emerald-600" />
                Edit Bank &amp; Account Particulars
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
                  Bank / Regulated Entity Name
                </label>
                <input
                  type="text"
                  value={activeCase.bankName || ''}
                  onChange={(e) => handleUpdateActiveCase({ bankName: e.target.value })}
                  placeholder="e.g. State Bank of India"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  Branch / Digital Channel
                </label>
                <input
                  type="text"
                  value={activeCase.branchName || ''}
                  onChange={(e) => handleUpdateActiveCase({ branchName: e.target.value })}
                  placeholder="e.g. Indiranagar Branch"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  Account / Card Number
                </label>
                <input
                  type="text"
                  value={activeCase.accountNumber || ''}
                  onChange={(e) => handleUpdateActiveCase({ accountNumber: e.target.value })}
                  placeholder="e.g. 501004928123"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  Disputed Amount (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={activeCase.transactionAmount || ''}
                  onChange={(e) => handleUpdateActiveCase({ transactionAmount: Number(e.target.value) || 0 })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  Date of Incident
                </label>
                <input
                  type="date"
                  value={activeCase.transactionDate || ''}
                  onChange={(e) => handleUpdateActiveCase({ transactionDate: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  Reporting Lag (Working Days)
                </label>
                <input
                  type="number"
                  min="0"
                  max="60"
                  value={activeCase.reportingDays || ''}
                  onChange={(e) => handleUpdateActiveCase({ reportingDays: Number(e.target.value) || 0 })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-600 dark:text-slate-400 block mb-1 text-xs">
                Incident Summary, Fraud Modus Operandi &amp; PNO Ticket Notes
              </label>
              <textarea
                value={activeCase.incidentDetails || ''}
                onChange={(e) => handleUpdateActiveCase({ incidentDetails: e.target.value })}
                rows={2}
                placeholder="Describe unauthorized debit, failed ATM cash dispensing, or delay in releasing property documents."
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
                onClick={() => setActiveTab('zeroLiability')}
                className={`pb-3 text-sm font-bold border-b-2 transition-all ${
                  activeTab === 'zeroLiability'
                    ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                1. Zero Liability Auditor (Unauthorized Debits)
              </button>
              <button
                onClick={() => setActiveTab('tatCompensation')}
                className={`pb-3 text-sm font-bold border-b-2 transition-all ${
                  activeTab === 'tatCompensation'
                    ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                2. Failed Transaction TAT &amp; Delay Compensation
              </button>
            </div>

            {/* Tab 1: Zero Liability Auditor */}
            {activeTab === 'zeroLiability' && (
              <ZeroLiabilityAuditorCard
                reportingDays={activeCase.reportingDays || 0}
                transactionAmount={activeCase.transactionAmount || 0}
                accountType={activeCase.accountType || 'SAVINGS_CURRENT'}
                onChange={(updates) => handleUpdateActiveCase(updates)}
              />
            )}

            {/* Tab 2: TAT Compensation Calculator */}
            {activeTab === 'tatCompensation' && (
              <TatCompensationCalculatorCard
                channelId={activeCase.channelId || 'ATM_CASH_FAILED'}
                transactionDate={activeCase.transactionDate || ''}
                transactionAmount={activeCase.transactionAmount || 0}
                onChange={(updates) => handleUpdateActiveCase(updates)}
              />
            )}
          </div>
        )}

        {/* Drafter Modal */}
        {showDrafter && activeCase && (
          <RbiOmbudsmanDrafterModal
            caseData={activeCase}
            onClose={() => setShowDrafter(false)}
          />
        )}
      </div>
    </div>
  );
}
