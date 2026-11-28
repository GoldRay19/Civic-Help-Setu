import { useState, useMemo } from 'react';
import {
  X,
  Copy,
  Check,
  Download,
  FileText,
  AlertTriangle,
  Scale,
} from 'lucide-react';
import {
  generateFssaiComplaintPetition,
  generateFboLegalNotice,
  calculateAdulterationLiability,
} from '../../services/foodSafetyService.js';

export default function FoodSafetyDrafterModal({
  caseData,
  onClose,
}) {
  const [activeTab, setActiveTab] = useState('petition'); // 'petition' | 'notice'
  const [complainantName, setComplainantName] = useState(caseData?.complainantName || '');
  const [complainantContact, setComplainantContact] = useState(caseData?.complainantContact || '');
  const [complainantAddress, setComplainantAddress] = useState(caseData?.complainantAddress || '');
  const [customText, setCustomText] = useState(null);
  const [copied, setCopied] = useState(false);

  const calculations = useMemo(() => {
    return calculateAdulterationLiability({
      selectedViolations: caseData?.selectedViolations || [],
      injuryTier: caseData?.injuryTier || 'NONE',
      actualMedicalBills: caseData?.actualMedicalBills || 0,
      daysHospitalized: caseData?.daysHospitalized || 0,
      lostWages: caseData?.lostWages || 0,
    });
  }, [caseData]);

  const generatedPetition = useMemo(() => {
    return generateFssaiComplaintPetition({
      complainantName,
      complainantContact,
      complainantAddress,
      fboName: caseData?.fboName,
      fboAddress: caseData?.fboAddress,
      fboLicenseNumber: caseData?.fboLicenseNumber,
      productName: caseData?.productName,
      batchNumber: caseData?.batchNumber,
      purchaseDate: caseData?.purchaseDate,
      purchaseInvoice: caseData?.purchaseInvoice,
      labReportNumber: caseData?.labReportNumber,
      violationDetails: caseData?.evidenceNotes,
      calculations,
    });
  }, [complainantName, complainantContact, complainantAddress, caseData, calculations]);

  const generatedNotice = useMemo(() => {
    return generateFboLegalNotice({
      complainantName,
      complainantContact,
      complainantAddress,
      fboName: caseData?.fboName,
      fboAddress: caseData?.fboAddress,
      productName: caseData?.productName,
      purchaseDate: caseData?.purchaseDate,
      purchaseInvoice: caseData?.purchaseInvoice,
      violationDetails: caseData?.evidenceNotes,
      calculations,
    });
  }, [complainantName, complainantContact, complainantAddress, caseData, calculations]);

  const currentContent = customText !== null ? customText : (activeTab === 'petition' ? generatedPetition : generatedNotice);

  const handleCopy = () => {
    navigator.clipboard.writeText(currentContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const filename = `${activeTab === 'petition' ? 'FSSAI_ADM_Complaint_Petition' : 'FBO_15Day_Legal_Notice'}_${caseData?.id || 'doc'}.txt`;
    const blob = new Blob([currentContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-lg bg-orange-100 text-orange-700 dark:bg-orange-950/50 dark:text-orange-300">
              <Scale className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                FSSAI Statutory Redressal & Legal Drafter
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Generate formal Section 68 Adjudication Application or 15-day pre-litigation demand notice
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher & Parameters Bar */}
        <div className="px-6 py-3 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 bg-slate-50/25 dark:bg-slate-900/50">
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
            <button
              onClick={() => {
                setActiveTab('petition');
                setCustomText(null);
              }}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                activeTab === 'petition'
                  ? 'bg-white dark:bg-slate-700 text-orange-700 dark:text-orange-300 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              ADM / DO Formal Petition (Sec 68)
            </button>
            <button
              onClick={() => {
                setActiveTab('notice');
                setCustomText(null);
              }}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                activeTab === 'notice'
                  ? 'bg-white dark:bg-slate-700 text-orange-700 dark:text-orange-300 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              15-Day Pre-Litigation FBO Notice
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-600 font-semibold">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy Text</span>
                </>
              )}
            </button>

            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-orange-600 hover:bg-orange-700 text-white transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Download (.txt)</span>
            </button>
          </div>
        </div>

        {/* Quick Edit Party Metadata */}
        <div className="px-6 py-3 border-b border-slate-100 dark:border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-50/50 dark:bg-slate-900/80">
          <div>
            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-0.5">
              Complainant Full Name
            </label>
            <input
              type="text"
              value={complainantName}
              onChange={(e) => {
                setComplainantName(e.target.value);
                setCustomText(null);
              }}
              placeholder="e.g. Meera Deshmukh"
              className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-0.5">
              Contact (Phone / Email)
            </label>
            <input
              type="text"
              value={complainantContact}
              onChange={(e) => {
                setComplainantContact(e.target.value);
                setCustomText(null);
              }}
              placeholder="e.g. 9876543210 / meera@mail.com"
              className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-0.5">
              Residential Address
            </label>
            <input
              type="text"
              value={complainantAddress}
              onChange={(e) => {
                setComplainantAddress(e.target.value);
                setCustomText(null);
              }}
              placeholder="e.g. Flat 402, Baner, Pune"
              className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>
        </div>

        {/* Editor / Live Preview Body */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="flex items-center justify-between pb-2 mb-2 text-xs text-slate-500">
            <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
              <FileText className="w-4 h-4 text-orange-600" />
              Document Text (Editable Draft):
            </span>
            <span className="text-[11px] text-slate-400">
              Edits made here are reflected when copying or downloading
            </span>
          </div>
          <textarea
            value={currentContent}
            onChange={(e) => setCustomText(e.target.value)}
            rows={18}
            className="w-full p-4 font-mono text-xs leading-relaxed rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-orange-500 focus:outline-none"
          />
        </div>

        {/* Footer Disclaimer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-amber-50/50 dark:bg-amber-950/20 text-amber-900 dark:text-amber-200 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <span className="text-[11px]">
            Statutory Notice: This draft is generated for citizen legal organization under the Food Safety & Standards Act, 2006.
            Submission must be executed in person or via the official FoSCoS grievance portal.
          </span>
        </div>
      </div>
    </div>
  );
}
