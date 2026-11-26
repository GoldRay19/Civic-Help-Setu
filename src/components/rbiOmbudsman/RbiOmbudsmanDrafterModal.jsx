import { useState, useMemo } from 'react';
import {
  X,
  Copy,
  Check,
  Download,
  FileText,
  AlertTriangle,
  Landmark,
} from 'lucide-react';
import {
  generatePnoComplaintLetter,
  generateRbiOmbudsmanPetition,
  calculateZeroLiability,
  calculateTatCompensation,
} from '../../services/rbiOmbudsmanService.js';

export default function RbiOmbudsmanDrafterModal({
  caseData,
  onClose,
}) {
  const [activeTab, setActiveTab] = useState('pno'); // 'pno' | 'ombudsman'
  const [complainantName, setComplainantName] = useState(caseData?.complainantName || '');
  const [complainantContact, setComplainantContact] = useState(caseData?.complainantContact || '');
  const [complainantAddress, setComplainantAddress] = useState(caseData?.complainantAddress || '');
  const [bankName, setBankName] = useState(caseData?.bankName || '');
  const [accountNumber, setAccountNumber] = useState(caseData?.accountNumber || '');
  const [customText, setCustomText] = useState(null);
  const [copied, setCopied] = useState(false);

  const calculations = useMemo(() => {
    const zero = calculateZeroLiability({
      reportingDays: caseData?.reportingDays || 0,
      transactionAmount: caseData?.transactionAmount || 0,
      accountType: caseData?.accountType || 'SAVINGS_CURRENT',
    });

    const tat = calculateTatCompensation({
      channelId: caseData?.channelId || 'ATM_CASH_FAILED',
      transactionDate: caseData?.transactionDate || '',
      transactionAmount: caseData?.transactionAmount || 0,
    });

    return {
      claimableRefund: zero.claimableRefund,
      statutoryCompensation: tat.statutoryCompensation,
      delayDays: tat.delayDays,
      penaltyRatePerDay: tat.penaltyRatePerDay,
    };
  }, [caseData]);

  const generatedPno = useMemo(() => {
    return generatePnoComplaintLetter({
      complainantName,
      complainantContact,
      complainantAddress,
      bankName,
      branchName: caseData?.branchName,
      accountNumber,
      disputeType: caseData?.disputeType,
      transactionDate: caseData?.transactionDate,
      transactionAmount: caseData?.transactionAmount,
      ticketNumber: caseData?.pnoRefNumber,
      calculations,
      incidentDetails: caseData?.incidentDetails,
    });
  }, [complainantName, complainantContact, complainantAddress, bankName, accountNumber, caseData, calculations]);

  const generatedOmbudsman = useMemo(() => {
    return generateRbiOmbudsmanPetition({
      complainantName,
      complainantContact,
      complainantAddress,
      bankName,
      branchName: caseData?.branchName,
      accountNumber,
      pnoComplaintDate: caseData?.pnoComplaintDate,
      pnoRefNumber: caseData?.pnoRefNumber,
      transactionAmount: caseData?.transactionAmount,
      disputeDetails: caseData?.incidentDetails,
      calculations,
    });
  }, [complainantName, complainantContact, complainantAddress, bankName, accountNumber, caseData, calculations]);

  const currentContent = customText !== null ? customText : (activeTab === 'pno' ? generatedPno : generatedOmbudsman);

  const handleCopy = () => {
    navigator.clipboard.writeText(currentContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const filename = `${activeTab === 'pno' ? 'Bank_PNO_Statutory_Complaint' : 'RBI_CMS_Ombudsman_Petition'}_${accountNumber || 'case'}.txt`;
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
            <span className="p-2 rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
              <Landmark className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                RBI Banking Ombudsman Redressal &amp; Petition Drafter
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Generate formal PNO representation or RBI CMS escalation petition under RB-IOS 2021
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

        {/* Tab Switcher & Actions */}
        <div className="px-6 py-3 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 bg-slate-50/25 dark:bg-slate-900/50">
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
            <button
              onClick={() => {
                setActiveTab('pno');
                setCustomText(null);
              }}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                activeTab === 'pno'
                  ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Bank Principal Nodal Officer (PNO) Letter
            </button>
            <button
              onClick={() => {
                setActiveTab('ombudsman');
                setCustomText(null);
              }}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                activeTab === 'ombudsman'
                  ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              RBI Ombudsman CMS Petition (Clause 11)
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
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Download (.txt)</span>
            </button>
          </div>
        </div>

        {/* Quick Edit Party Fields */}
        <div className="px-6 py-3 border-b border-slate-100 dark:border-slate-800 grid grid-cols-1 md:grid-cols-5 gap-2.5 bg-slate-50/50 dark:bg-slate-900/80">
          <div>
            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-0.5">
              Complainant Name
            </label>
            <input
              type="text"
              value={complainantName}
              onChange={(e) => {
                setComplainantName(e.target.value);
                setCustomText(null);
              }}
              placeholder="e.g. Ananya Sengupta"
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
              placeholder="e.g. 9830012345 / ananya@mail.com"
              className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-0.5">
              Address / City
            </label>
            <input
              type="text"
              value={complainantAddress}
              onChange={(e) => {
                setComplainantAddress(e.target.value);
                setCustomText(null);
              }}
              placeholder="e.g. Salt Lake, Kolkata"
              className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-0.5">
              Bank Name
            </label>
            <input
              type="text"
              value={bankName}
              onChange={(e) => {
                setBankName(e.target.value);
                setCustomText(null);
              }}
              placeholder="e.g. State Bank of India"
              className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-0.5">
              Account / Card Number
            </label>
            <input
              type="text"
              value={accountNumber}
              onChange={(e) => {
                setAccountNumber(e.target.value);
                setCustomText(null);
              }}
              placeholder="e.g. 918020048123"
              className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>
        </div>

        {/* Live Preview Textarea */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="flex items-center justify-between pb-2 mb-2 text-xs text-slate-500">
            <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
              <FileText className="w-4 h-4 text-emerald-600" />
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
            className="w-full p-4 font-mono text-xs leading-relaxed rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>

        {/* Footer Disclaimer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-amber-50/50 dark:bg-amber-950/20 text-amber-900 dark:text-amber-200 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <span className="text-[11px]">
            Statutory Notice: This draft is generated locally under the RBI Integrated Ombudsman Scheme, 2021.
            Submission must be executed on cms.rbi.org.in or submitted directly to the bank PNO.
          </span>
        </div>
      </div>
    </div>
  );
}
