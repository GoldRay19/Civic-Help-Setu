import { useState, useMemo } from 'react';
import {
  X,
  Copy,
  Check,
  Download,
  FileText,
  AlertTriangle,
  Gavel,
} from 'lucide-react';
import {
  generateSection208ContestPetition,
  generateTrafficPoliceGrievance,
} from '../../services/trafficChallanService.js';

export default function TrafficChallanDrafterModal({
  caseData,
  onClose,
}) {
  const [activeTab, setActiveTab] = useState('petition'); // 'petition' | 'grievance'
  const [ownerName, setOwnerName] = useState(caseData?.ownerName || '');
  const [ownerContact, setOwnerContact] = useState(caseData?.ownerContact || '');
  const [ownerAddress, setOwnerAddress] = useState(caseData?.ownerAddress || '');
  const [alibiDetails, setAlibiDetails] = useState(caseData?.alibiDetails || '');
  const [customText, setCustomText] = useState(null);
  const [copied, setCopied] = useState(false);

  const generatedPetition = useMemo(() => {
    return generateSection208ContestPetition({
      ownerName,
      ownerContact,
      ownerAddress,
      vehicleNumber: caseData?.vehicleNumber,
      vehicleClass: caseData?.vehicleClass,
      challanNumber: caseData?.challanNumber,
      challanDate: caseData?.challanDate,
      challanTime: caseData?.challanTime,
      fineAmount: caseData?.fineAmount,
      allegedOffence: caseData?.allegedOffence,
      location: caseData?.location,
      defectNotes: caseData?.defectNotes,
      selectedDefects: caseData?.selectedDefects || [],
      alibiDetails,
    });
  }, [ownerName, ownerContact, ownerAddress, caseData, alibiDetails]);

  const generatedGrievance = useMemo(() => {
    return generateTrafficPoliceGrievance({
      ownerName,
      ownerContact,
      vehicleNumber: caseData?.vehicleNumber,
      challanNumber: caseData?.challanNumber,
      challanDate: caseData?.challanDate,
      fineAmount: caseData?.fineAmount,
      allegedOffence: caseData?.allegedOffence,
      location: caseData?.location,
      defectNotes: caseData?.defectNotes,
      selectedDefects: caseData?.selectedDefects || [],
    });
  }, [ownerName, ownerContact, caseData]);

  const currentContent = customText !== null ? customText : (activeTab === 'petition' ? generatedPetition : generatedGrievance);

  const handleCopy = () => {
    navigator.clipboard.writeText(currentContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const filename = `${activeTab === 'petition' ? 'VirtualCourt_Section208_Petition' : 'TrafficPolice_Administrative_Grievance'}_${caseData?.challanNumber || 'doc'}.txt`;
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
            <span className="p-2 rounded-lg bg-indigo-100 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300">
              <Gavel className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Traffic Challan Section 208 Dispute &amp; Petition Drafter
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Generate formal Section 208 Virtual Court application or Traffic Police grievance
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
                setActiveTab('petition');
                setCustomText(null);
              }}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                activeTab === 'petition'
                  ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Virtual Court Contest Petition (Sec 208)
            </button>
            <button
              onClick={() => {
                setActiveTab('grievance');
                setCustomText(null);
              }}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                activeTab === 'grievance'
                  ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Traffic Police Nodal Grievance
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
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Download (.txt)</span>
            </button>
          </div>
        </div>

        {/* Quick Edit Party Fields */}
        <div className="px-6 py-3 border-b border-slate-100 dark:border-slate-800 grid grid-cols-1 md:grid-cols-4 gap-3 bg-slate-50/50 dark:bg-slate-900/80">
          <div>
            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-0.5">
              Registered Owner Name
            </label>
            <input
              type="text"
              value={ownerName}
              onChange={(e) => {
                setOwnerName(e.target.value);
                setCustomText(null);
              }}
              placeholder="e.g. Vikramaditya Rao"
              className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-0.5">
              Contact (Phone / Email)
            </label>
            <input
              type="text"
              value={ownerContact}
              onChange={(e) => {
                setOwnerContact(e.target.value);
                setCustomText(null);
              }}
              placeholder="e.g. 9845012345 / vikram@mail.com"
              className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-0.5">
              Owner Residential Address
            </label>
            <input
              type="text"
              value={ownerAddress}
              onChange={(e) => {
                setOwnerAddress(e.target.value);
                setCustomText(null);
              }}
              placeholder="e.g. Indiranagar, Bengaluru"
              className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-0.5">
              Alibi / Fastag Evidence Note
            </label>
            <input
              type="text"
              value={alibiDetails}
              onChange={(e) => {
                setAlibiDetails(e.target.value);
                setCustomText(null);
              }}
              placeholder="e.g. Fastag toll record at T2"
              className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>
        </div>

        {/* Live Preview Textarea */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="flex items-center justify-between pb-2 mb-2 text-xs text-slate-500">
            <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
              <FileText className="w-4 h-4 text-indigo-600" />
              Document Text (Editable Draft):
            </span>
            <span className="text-[11px] text-slate-400">
              Edits here are preserved when copying or downloading
            </span>
          </div>
          <textarea
            value={currentContent}
            onChange={(e) => setCustomText(e.target.value)}
            rows={18}
            className="w-full p-4 font-mono text-xs leading-relaxed rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        {/* Footer Disclaimer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-amber-50/50 dark:bg-amber-950/20 text-amber-900 dark:text-amber-200 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <span className="text-[11px]">
            Statutory Notice: This draft is generated locally for citizen legal advocacy under Rule 167A &amp; Section 208.
            Submission must be executed on vcourts.gov.in or the official State Traffic Police Grievance portal.
          </span>
        </div>
      </div>
    </div>
  );
}
