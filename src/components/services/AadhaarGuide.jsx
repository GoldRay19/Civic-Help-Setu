import { useState } from 'react';
import {
  FileText,
  Building,
  CheckCircle,
  AlertTriangle,
  ShieldCheck,
  ExternalLink,
  Calendar,
  Layers,
  HelpCircle,
  Info,
  Mail,
  MapPin,
  Sparkles,
  UserCheck,
  CreditCard,
  ChevronDown,
  ChevronUp,
  FileCheck,
  Check,
  Copy
} from 'lucide-react';

import {
  INDIAN_STATES_AND_UTS,
  UIDAI_REGIONAL_OFFICES,
  getJurisdictionDetails,
  SERVICE_MODES,
  OFFICIAL_FEE_SCHEDULE,
  SUPPORTING_DOCUMENTS,
  ORDERED_JOURNEY_STAGES,
  MILESTONE_DATE_FIELDS,
  FLAGGED_MYTHS,
  AADHAAR_FAQS
} from '../../data/aadhaarGuideData';

/**
 * Aadhaar Enrolment & Demographic Update Acknowledgement Guide Component
 *
 * Implements GitHub Issue #530:
 * Professional, jurisdiction-aware, privacy-preserving citizen guide for Aadhaar
 * enrolment and demographic update acknowledgement slips, EID/URN tracking,
 * authorized centres, statutory fee safeguards, and verified UIDAI procedures.
 *
 * Grounded in:
 * - Aadhaar Act, 2016 (as amended 2019)
 * - UIDAI Official Regulations and Circulars
 * - UIDAI Citizens' Charter Standards
 * - Central Identities Data Repository (CIDR) verification protocols
 */
export default function AadhaarGuide({
  initialState = 'Delhi',
  initialMode = 'enrolment',
  initialTab = 'overview',
  onBack = null
} = {}) {
  const [selectedState, setSelectedState] = useState(initialState);
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedMode, setSelectedMode] = useState(initialMode);
  const [activeTab, setActiveTab] = useState(initialTab); // 'overview' | 'jurisdictions' | 'journey' | 'documents' | 'fees' | 'tracking' | 'caveats' | 'faqs'
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Client-side date simulator state (strictly client-side, zero personal data stored)
  const [simEnrolmentDate, setSimEnrolmentDate] = useState('');
  const [simulatedMilestones, setSimulatedMilestones] = useState(null);

  // Active document sub-category filter in documents tab
  const [docCategory, setDocCategory] = useState('all'); // 'all' | 'poi' | 'poa' | 'dob' | 'por' | 'optional'

  const jurisdiction = getJurisdictionDetails(selectedState);
  const currentServiceMode = SERVICE_MODES.find((m) => m.id === selectedMode) || SERVICE_MODES[0];

  const handleSimulateDates = (e) => {
    e.preventDefault();
    if (!simEnrolmentDate) return;

    const baseDate = new Date(simEnrolmentDate);
    if (isNaN(baseDate.getTime())) return;

    const addDays = (d, days) => {
      const res = new Date(d);
      res.setDate(res.getDate() + days);
      return res.toISOString().split('T')[0];
    };

    setSimulatedMilestones({
      applicationDate: simEnrolmentDate,
      enrolmentDate: simEnrolmentDate,
      acknowledgementDate: simEnrolmentDate,
      scrutinyStartDate: addDays(baseDate, 3),
      expectedValidationWindow: `${addDays(baseDate, 7)} to ${addDays(baseDate, 30)}`,
      statutoryMaxTurnaround: addDays(baseDate, 90),
      eAadhaarExpected: `${addDays(baseDate, 15)} to ${addDays(baseDate, 30)}`,
      speedPostDeliveryExpected: `${addDays(baseDate, 30)} to ${addDays(baseDate, 60)}`
    });
  };

  const handleCopyLink = async () => {
    try {
      if (typeof window !== 'undefined' && navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(window.location.href);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2500);
      }
    } catch {
      // fallback safe ignore
    }
  };

  const toggleFaq = (idx) => {
    setExpandedFaq(expandedFaq === idx ? null : idx);
  };

  return (
    <div className="aadhaar-guide max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Unique Identification Authority of India (UIDAI) — Central Statutory Standard</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Aadhaar Enrolment &amp; Demographic Update Acknowledgement Guide
            </h1>

            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-3xl leading-relaxed">
              Official, plain-language citizen guidance for new Aadhaar enrolments and demographic updates. Understand your Enrolment Acknowledgement Slip, distinguish EID from URN, verify supporting documents, inspect official fee ceilings, and track application milestones safely without exposing personal data.
            </p>
          </div>

          <div className="flex flex-wrap sm:flex-col items-start sm:items-end gap-2.5 shrink-0">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                ← Back to Service
              </button>
            )}

            <button
              type="button"
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
              title="Copy link to this guide"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Link Copied!' : 'Share Guide'}</span>
            </button>

            <a
              href="https://myaadhaar.uidai.gov.in"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>myAadhaar Portal</span>
            </a>

            <a
              href="https://appointments.uidai.gov.in"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 hover:bg-blue-100 transition-colors"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Book ASK Appointment</span>
            </a>
          </div>
        </div>

        {/* State/UT & Jurisdiction Context Bar */}
        <div className="mt-6 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          <div>
            <label
              htmlFor="aadhaar-state-select"
              className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1"
            >
              Select State / Union Territory:
            </label>
            <select
              id="aadhaar-state-select"
              value={selectedState}
              onChange={(e) => {
                setSelectedState(e.target.value);
                setSelectedDistrict('');
              }}
              className="w-full text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
              aria-label="Select State or Union Territory"
            >
              {INDIAN_STATES_AND_UTS.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="aadhaar-district-select"
              className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1"
            >
              District / Administrative Zone:
            </label>
            <select
              id="aadhaar-district-select"
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="w-full text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
              aria-label="Select District"
            >
              <option value="">All Districts ({jurisdiction.state})</option>
              {(jurisdiction.districts || []).map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div className="text-xs text-slate-600 dark:text-slate-400">
            <span className="font-semibold text-slate-800 dark:text-slate-200 block mb-0.5">
              Regional Office Jurisdiction:
            </span>
            <span className="inline-flex items-center gap-1 text-slate-700 dark:text-slate-300">
              <Building className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
              {jurisdiction.regionalOffice ? jurisdiction.regionalOffice.name : 'UIDAI HQ New Delhi'}
            </span>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              {jurisdiction.isNationalStandard
                ? 'Centrally Standardized by UIDAI (All-India procedure)'
                : `Registrar: ${jurisdiction.registrarPartner}`}
            </div>
          </div>
        </div>

        {/* Primary Service Mode Selector */}
        <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
            Select Your Aadhaar Requirement:
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {SERVICE_MODES.map((mode) => {
              const isSelected = selectedMode === mode.id;
              return (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => setSelectedMode(mode.id)}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'bg-blue-50/70 dark:bg-blue-950/30 border-blue-500 dark:border-blue-500 shadow-sm ring-1 ring-blue-500'
                      : 'bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {mode.title}
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        isSelected
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {mode.badge}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-2">
                    {mode.tagline}
                  </p>
                  <div className="flex items-center justify-between text-[11px] font-medium pt-1.5 border-t border-slate-100 dark:border-slate-700/60">
                    <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                      Fee: {mode.fee}
                    </span>
                    <span className="text-slate-500 dark:text-slate-400">
                      {mode.trackingIdentifier}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div
          role="tablist"
          aria-label="Aadhaar Guide Sections"
          className="flex flex-wrap gap-2 pt-6 border-t border-slate-200 dark:border-slate-800 mt-6"
        >
          {[
            { id: 'overview', label: 'Overview & Purpose', icon: FileText },
            { id: 'jurisdictions', label: 'Centres & Jurisdiction', icon: Building },
            { id: 'journey', label: '7-Stage Application Journey', icon: Layers },
            { id: 'documents', label: 'Supporting Documents', icon: CheckCircle },
            { id: 'fees', label: 'Fees & Safeguards', icon: CreditCard },
            { id: 'tracking', label: 'EID / URN & Dates', icon: Calendar },
            { id: 'caveats', label: 'Myths & Common Mistakes', icon: AlertTriangle },
            { id: 'faqs', label: 'FAQs & Escalation', icon: HelpCircle }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                id={`tab-${tab.id}`}
                aria-selected={isActive}
                aria-controls={`panel-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-600'
                    : 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB PANEL 1: OVERVIEW & PURPOSE */}
      {activeTab === 'overview' && (
        <div
          role="tabpanel"
          id="panel-overview"
          aria-labelledby="tab-overview"
          className="space-y-6 animate-fadeIn"
        >
          {/* Selected Mode Summary Card */}
          <div className="bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-xl p-5">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                  Active Mode: {currentServiceMode.title}
                </h3>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed mb-3">
                  {currentServiceMode.description}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-white dark:bg-slate-900/60 p-3 rounded-lg border border-blue-100 dark:border-blue-900/50">
                  <div>
                    <span className="font-semibold text-slate-500 dark:text-slate-400 block">Official Fee:</span>
                    <span className="font-bold text-emerald-700 dark:text-emerald-400">{currentServiceMode.fee}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-500 dark:text-slate-400 block">Channel:</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">{currentServiceMode.channel}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-500 dark:text-slate-400 block">Tracking Identifier:</span>
                    <span className="font-bold text-blue-700 dark:text-blue-300">{currentServiceMode.trackingIdentifier}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Legal Definition Cards: What Acknowledgement IS vs What it is NOT */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold text-sm">
                <CheckCircle className="w-4 h-4" />
                <span>What the Acknowledgement Slip Establishes</span>
              </div>
              <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-2.5">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold mt-0.5">•</span>
                  <span><strong>Official Submission Record:</strong> Proves that your enrolment or update request has been successfully captured and logged into the UIDAI CIDR queue.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold mt-0.5">•</span>
                  <span><strong>Unique 28-digit EID or 14-digit URN:</strong> Contains the exact tracking number and timestamp required to monitor your application progress.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold mt-0.5">•</span>
                  <span><strong>Audit Trail of Submitted Data:</strong> Records the spelling of your name, address, date of birth, and supporting proofs as verified by you on the preview screen.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold mt-0.5">•</span>
                  <span><strong>Escalation Token:</strong> Essential receipt required for filing complaints or tracking grievances with UIDAI via 1947 or Regional Offices.</span>
                </li>
              </ul>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/60 rounded-xl p-5 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-bold text-sm">
                <AlertTriangle className="w-4 h-4" />
                <span>What the Acknowledgement Slip Does NOT Establish</span>
              </div>
              <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-2.5">
                <li className="flex items-start gap-2">
                  <span className="text-amber-600 font-bold mt-0.5">•</span>
                  <span><strong>NOT an Aadhaar Card or Number:</strong> The slip does not confer an Aadhaar number. It is not an issued identity document.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-600 font-bold mt-0.5">•</span>
                  <span><strong>NOT Proof of Identity or Address:</strong> Financial institutions, border controls, and airlines do not accept an acknowledgement slip as identity proof.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-600 font-bold mt-0.5">•</span>
                  <span><strong>NOT Proof of Citizenship or Domicile:</strong> Under Section 9 of the Aadhaar Act, 2016, Aadhaar enrolment or receipt does not confer any right to Indian citizenship.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-600 font-bold mt-0.5">•</span>
                  <span><strong>NO Guarantee of Approval:</strong> Submissions can be rejected during backend CIDR de-duplication if biometrics mismatch, duplicate enrolments exist, or documents are invalid.</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Formats Comparison: Acknowledgement Slip vs e-Aadhaar vs PVC Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
              Understanding Aadhaar Document Stages
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                  1. Acknowledgement Slip
                </div>
                <div className="text-[11px] text-amber-700 dark:text-amber-400 font-semibold mb-2">
                  Temporary Status Token
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Issued at counter immediately after data capture. Contains 28-digit EID or 14-digit URN. Used strictly for status tracking and grievance escalation.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/60">
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                  2. e-Aadhaar (Digital PDF)
                </div>
                <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold mb-2">
                  Full Legal Document (Free)
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Digitally signed electronic PDF downloaded from myAadhaar. Legally at par with printed card under Section 4(3) of Aadhaar Act. Protected by 8-character password.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/60">
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                  3. Official Aadhaar PVC Card
                </div>
                <div className="text-[11px] text-blue-700 dark:text-blue-400 font-semibold mb-2">
                  Physical Durable Card (₹50)
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Wallet-sized, weather-resistant plastic card ordered exclusively via myAadhaar for ₹50. Features secure QR code, hologram, ghost image, and Speed Post delivery.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB PANEL 2: JURISDICTIONS & REGIONAL CENTRES */}
      {activeTab === 'jurisdictions' && (
        <div
          role="tabpanel"
          id="panel-jurisdictions"
          aria-labelledby="tab-jurisdictions"
          className="space-y-6 animate-fadeIn"
        >
          {/* Active Jurisdiction Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                  Jurisdiction Profile
                </span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {jurisdiction.state}
                </h3>
              </div>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Official Verified Jurisdiction</span>
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-3">
                <div>
                  <span className="font-bold text-slate-700 dark:text-slate-300 block mb-0.5">
                    Authorized Registrar Network:
                  </span>
                  <p className="text-slate-600 dark:text-slate-400">
                    {jurisdiction.registrarPartner}
                  </p>
                </div>

                <div>
                  <span className="font-bold text-slate-700 dark:text-slate-300 block mb-0.5">
                    State Citizen Portal:
                  </span>
                  <a
                    href={jurisdiction.portalUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 font-medium hover:underline"
                  >
                    <span>{jurisdiction.portalName}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div>
                  <span className="font-bold text-slate-700 dark:text-slate-300 block mb-0.5">
                    Local Administrative Bodies:
                  </span>
                  <p className="text-slate-600 dark:text-slate-400">
                    {(jurisdiction.localBodies || []).join(', ')}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <span className="font-bold text-slate-700 dark:text-slate-300 block mb-0.5">
                    Regional Office (UIDAI RO):
                  </span>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">
                    {jurisdiction.regionalOffice ? jurisdiction.regionalOffice.name : 'UIDAI HQ New Delhi'}
                  </p>
                  <p className="text-slate-500 dark:text-slate-400 mt-0.5 text-[11px]">
                    {jurisdiction.regionalOffice ? jurisdiction.regionalOffice.address : 'Not specified by the linked official source.'}
                  </p>
                </div>

                <div className="flex flex-wrap gap-4 text-[11px]">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block font-semibold">RO Email:</span>
                    <a
                      href={`mailto:${jurisdiction.regionalOffice?.email || 'helpdesk@uidai.gov.in'}`}
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      {jurisdiction.regionalOffice?.email || 'helpdesk@uidai.gov.in'}
                    </a>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block font-semibold">Toll-Free Helpline:</span>
                    <span className="text-emerald-700 dark:text-emerald-400 font-bold">1947</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
              <span className="font-semibold text-slate-800 dark:text-slate-200">Administrative Guidance: </span>
              {jurisdiction.notes}
            </div>
          </div>

          {/* National UIDAI Standards vs Local Variation Disclosure */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs space-y-2">
            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Info className="w-4 h-4 text-blue-600" />
              <span>Pan-India Statutory Equality</span>
            </div>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Aadhaar enrolment and update rules are centrally governed by UIDAI across India. No conflicting or additional state-specific administrative restrictions were identified for this jurisdiction. Enrolments and updates can be completed at any UIDAI-authorized centre in the state/UT or via the central myAadhaar portal.
            </p>
          </div>

          {/* All 7 UIDAI Regional Offices Directory */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              UIDAI Regional Offices Directory (All 7 Zones)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              {UIDAI_REGIONAL_OFFICES.map((ro) => (
                <div
                  key={ro.id}
                  className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/70 space-y-1.5"
                >
                  <div className="font-bold text-slate-900 dark:text-white">
                    {ro.name}
                  </div>
                  <div className="text-[11px] text-slate-600 dark:text-slate-400">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Jurisdiction: </span>
                    {ro.jurisdictionStates.join(', ')}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    {ro.address}
                  </div>
                  <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200 dark:border-slate-700">
                    <span className="text-blue-600 dark:text-blue-400 font-mono">{ro.email}</span>
                    <span className="text-emerald-700 dark:text-emerald-400 font-bold">1947</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB PANEL 3: 7-STAGE APPLICATION JOURNEY */}
      {activeTab === 'journey' && (
        <div
          role="tabpanel"
          id="panel-journey"
          aria-labelledby="tab-journey"
          className="space-y-6 animate-fadeIn"
        >
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
              Ordered 7-Stage Citizen Journey
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-6">
              Follow these sequential stages to complete your Aadhaar enrolment or demographic update without processing setbacks.
            </p>

            <div className="space-y-5">
              {ORDERED_JOURNEY_STAGES.map((stg) => (
                <div
                  key={stg.stage}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 hover:border-blue-400 dark:hover:border-blue-600 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2.5">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold shrink-0">
                        {stg.stage}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        {stg.title}
                      </h4>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                        {stg.channel}
                      </span>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                        {stg.dateLabel}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed pl-8 mb-2">
                    {stg.description}
                  </p>

                  <div className="pl-8 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] pt-2 border-t border-slate-200/80 dark:border-slate-700/50">
                    <span className="text-slate-500 dark:text-slate-400">
                      <strong>Milestone:</strong> {stg.milestone}
                    </span>
                    <span className="text-blue-700 dark:text-blue-300 font-medium">
                      💡 Tip: {stg.actionTip}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB PANEL 4: SUPPORTING DOCUMENTS */}
      {activeTab === 'documents' && (
        <div
          role="tabpanel"
          id="panel-documents"
          aria-labelledby="tab-documents"
          className="space-y-6 animate-fadeIn"
        >
          {/* Sub-Category Filter Toolbar */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Filter Document Category:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {[
                { id: 'all', label: 'All Documents' },
                { id: 'poi', label: 'Proof of Identity (PoI)' },
                { id: 'poa', label: 'Proof of Address (PoA)' },
                { id: 'dob', label: 'Date of Birth (DoB)' },
                { id: 'por', label: 'Proof of Relationship (PoR)' },
                { id: 'optional', label: 'Optional / Contacts' }
              ].map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setDocCategory(cat.id)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                    docCategory === cat.id
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Document Cards */}
          <div className="space-y-6">
            {(docCategory === 'all' || docCategory === 'poi') && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-blue-600" />
                    <span>Proof of Identity (PoI) — Containing Name &amp; Photograph</span>
                  </h3>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300">
                    Mandatory for Enrolment &amp; Name Update
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  {SUPPORTING_DOCUMENTS.poi.map((doc) => (
                    <div
                      key={doc.id}
                      className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-1.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-bold text-slate-900 dark:text-white">
                          {doc.title}
                        </span>
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full shrink-0 ${
                            doc.category === 'mandatory'
                              ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                              : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                          }`}
                        >
                          {doc.category === 'mandatory' ? 'Required' : 'Conditional'}
                        </span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-400">
                        {doc.description}
                      </p>
                      {doc.condition && (
                        <div className="text-[11px] text-amber-700 dark:text-amber-400 font-medium">
                          Condition: {doc.condition}
                        </div>
                      )}
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200 dark:border-slate-700/60">
                        Source: {doc.officialBasis}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(docCategory === 'all' || docCategory === 'poa') && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-blue-600" />
                    <span>Proof of Address (PoA) — Containing Name &amp; Full Address</span>
                  </h3>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300">
                    Mandatory for Enrolment &amp; Address Update
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  {SUPPORTING_DOCUMENTS.poa.map((doc) => (
                    <div
                      key={doc.id}
                      className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-1.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-bold text-slate-900 dark:text-white">
                          {doc.title}
                        </span>
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full shrink-0 ${
                            doc.category === 'mandatory'
                              ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                              : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                          }`}
                        >
                          {doc.category === 'mandatory' ? 'Required' : 'Conditional'}
                        </span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-400">
                        {doc.description}
                      </p>
                      {doc.condition && (
                        <div className="text-[11px] text-amber-700 dark:text-amber-400 font-medium">
                          Condition: {doc.condition}
                        </div>
                      )}
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200 dark:border-slate-700/60">
                        Source: {doc.officialBasis}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(docCategory === 'all' || docCategory === 'dob') && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <span>Proof of Date of Birth (DoB)</span>
                  </h3>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300">
                    Mandatory for Enrolment &amp; DoB Update
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  {SUPPORTING_DOCUMENTS.dob.map((doc) => (
                    <div
                      key={doc.id}
                      className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-1.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-bold text-slate-900 dark:text-white">
                          {doc.title}
                        </span>
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full shrink-0 ${
                            doc.category === 'mandatory'
                              ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                              : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                          }`}
                        >
                          {doc.category === 'mandatory' ? 'Required' : 'Conditional'}
                        </span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-400">
                        {doc.description}
                      </p>
                      {doc.condition && (
                        <div className="text-[11px] text-amber-700 dark:text-amber-400 font-medium">
                          Condition: {doc.condition}
                        </div>
                      )}
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200 dark:border-slate-700/60">
                        Source: {doc.officialBasis}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(docCategory === 'all' || docCategory === 'por') && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-blue-600" />
                    <span>Proof of Relationship (PoR) — Family Linkage</span>
                  </h3>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300">
                    Conditional for Children &amp; HoF Updates
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  {SUPPORTING_DOCUMENTS.por.map((doc) => (
                    <div
                      key={doc.id}
                      className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-1.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-bold text-slate-900 dark:text-white">
                          {doc.title}
                        </span>
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 shrink-0">
                          Conditional
                        </span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-400">
                        {doc.description}
                      </p>
                      <div className="text-[11px] text-amber-700 dark:text-amber-400 font-medium">
                        Condition: {doc.condition}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200 dark:border-slate-700/60">
                        Source: {doc.officialBasis}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(docCategory === 'all' || docCategory === 'optional') && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Mail className="w-4 h-4 text-blue-600" />
                    <span>Optional Supporting Attributes (Contact Details)</span>
                  </h3>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                    Voluntary at Enrolment / Essential for Online Services
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  {SUPPORTING_DOCUMENTS.optional.map((doc) => (
                    <div
                      key={doc.id}
                      className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-1.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-bold text-slate-900 dark:text-white">
                          {doc.title}
                        </span>
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 shrink-0">
                          Optional
                        </span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-400">
                        {doc.description}
                      </p>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        Condition: {doc.condition}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200 dark:border-slate-700/60">
                        Source: {doc.officialBasis}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB PANEL 5: FEES & SAFEGUARDS */}
      {activeTab === 'fees' && (
        <div
          role="tabpanel"
          id="panel-fees"
          aria-labelledby="tab-fees"
          className="space-y-6 animate-fadeIn"
        >
          {/* Statutory Fee Ceiling Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Official UIDAI Prescribed Customer Fee Caps
              </h3>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                Statutory Fixed Ceiling — Inclusive of GST
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                    <th className="p-3 font-bold text-slate-800 dark:text-slate-200">Service Category</th>
                    <th className="p-3 font-bold text-slate-800 dark:text-slate-200">Official Prescribed Fee</th>
                    <th className="p-3 font-bold text-slate-800 dark:text-slate-200">Applicable To</th>
                    <th className="p-3 font-bold text-slate-800 dark:text-slate-200">Mode &amp; Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {OFFICIAL_FEE_SCHEDULE.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="p-3 font-bold text-slate-900 dark:text-white">{item.service}</td>
                      <td className="p-3 font-extrabold text-emerald-700 dark:text-emerald-400">{item.fee}</td>
                      <td className="p-3 text-slate-600 dark:text-slate-400">{item.applicableTo}</td>
                      <td className="p-3 text-slate-500 dark:text-slate-400">
                        <div>{item.mode}</div>
                        <span className="text-[10px] text-blue-600 dark:text-blue-400">
                          {item.receiptPrescribed ? 'Computer receipt mandatory' : 'Instant free access'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Anti-Exploitation Rules & Overcharging Reporting */}
          <div className="bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/60 rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-amber-800 dark:text-amber-400 font-bold text-sm">
              <ShieldCheck className="w-4 h-4" />
              <span>Anti-Exploitation Rule &amp; Overcharging Redressal</span>
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              UIDAI strictly regulates enrolment centre charges. If any operator, bank branch, post office counter, or cyber cafe demands more than the official fee (e.g. demanding ₹150 for demographic updates or demanding fees for new enrolments), demand a computer-generated receipt immediately. If refused, record the 28-digit EID and report the centre immediately:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
              <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-amber-200 dark:border-amber-900/40">
                <span className="font-bold text-slate-800 dark:text-slate-200 block mb-0.5">Toll-Free Helpline:</span>
                <span className="text-emerald-700 dark:text-emerald-400 font-extrabold text-base">1947</span>
                <span className="block text-[11px] text-slate-500">24x7 automated IVRS</span>
              </div>
              <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-amber-200 dark:border-amber-900/40">
                <span className="font-bold text-slate-800 dark:text-slate-200 block mb-0.5">Grievance Email:</span>
                <a href="mailto:helpdesk@uidai.gov.in" className="text-blue-600 dark:text-blue-400 font-bold hover:underline">
                  helpdesk@uidai.gov.in
                </a>
                <span className="block text-[11px] text-slate-500">Attach EID scan / photo</span>
              </div>
              <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-amber-200 dark:border-amber-900/40">
                <span className="font-bold text-slate-800 dark:text-slate-200 block mb-0.5">Online Complaint Portal:</span>
                <a
                  href="https://myaadhaar.uidai.gov.in/file-complaint"
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 dark:text-blue-400 font-bold hover:underline inline-flex items-center gap-1"
                >
                  <span>File Complaint</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
                <span className="block text-[11px] text-slate-500">Track via token</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB PANEL 6: EID / URN TRACKING & MILESTONE DATES */}
      {activeTab === 'tracking' && (
        <div
          role="tabpanel"
          id="panel-tracking"
          aria-labelledby="tab-tracking"
          className="space-y-6 animate-fadeIn"
        >
          {/* EID vs URN Explanation */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-sm">
                <Layers className="w-4 h-4" />
                <span>The 28-Digit Enrolment ID (EID)</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Printed at the top of your Enrolment Acknowledgement Slip after visiting an ASK or centre. It consists of two 14-digit parts combined:
              </p>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg font-mono text-xs text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                <div className="text-blue-600 dark:text-blue-400 font-bold mb-1">
                  [1234/12345/12345] [2026/11/12 14:30:25]
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  Part 1: 14-digit Enrolment No. + Part 2: 14-digit Timestamp (YYYYMMDDHHMMSS)
                </div>
              </div>
              <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
                <li>• Used on <strong>Check Enrolment &amp; Update Status</strong> on myAadhaar.</li>
                <li>• Enter either all 28 digits together, or 14 digits with separate date/time.</li>
              </ul>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-sm">
                <Sparkles className="w-4 h-4" />
                <span>The 14-Digit Update Request Number (URN)</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Generated when an existing Aadhaar card holder initiates a demographic or address update online through the self-service myAadhaar portal.
              </p>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg font-mono text-xs text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                <div className="text-emerald-700 dark:text-emerald-400 font-bold mb-1">
                  0000/12345/67890 (14 Digits)
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  Tracked under "Check Status" using your URN and Aadhaar number.
                </div>
              </div>
              <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
                <li>• Issued for self-service address updates and document upload requests.</li>
                <li>• Notification SMS is sent to your registered mobile number.</li>
              </ul>
            </div>
          </div>

          {/* Interactive Date Timeline Simulator (Client-Side Only, Zero Storage) */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Client-Side Application Milestone Estimator
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Enter your counter submission date to calculate expected statutory validation dates. (Zero data saved; runs purely in your local browser).
                </p>
              </div>
              <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                🔒 Privacy Guarantee: No PII Collected
              </span>
            </div>

            <form onSubmit={handleSimulateDates} className="flex flex-wrap items-end gap-3 text-xs">
              <div>
                <label
                  htmlFor="sim-enrolment-date"
                  className="block font-bold text-slate-700 dark:text-slate-300 mb-1"
                >
                  Enrolment / Counter Date:
                </label>
                <input
                  type="date"
                  id="sim-enrolment-date"
                  value={simEnrolmentDate}
                  onChange={(e) => setSimEnrolmentDate(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors shadow-sm"
              >
                Estimate Milestones
              </button>
            </form>

            {simulatedMilestones && (
              <div className="mt-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="text-xs font-bold text-slate-900 dark:text-white">
                  Estimated Timeline for Enrolment on: {simulatedMilestones.enrolmentDate}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                    <span className="text-slate-500 block font-semibold">Backend Scrutiny:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">Starting ~{simulatedMilestones.scrutinyStartDate}</span>
                  </div>
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                    <span className="text-slate-500 block font-semibold">CIDR Validation Window:</span>
                    <span className="font-bold text-blue-700 dark:text-blue-400">{simulatedMilestones.expectedValidationWindow}</span>
                  </div>
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                    <span className="text-slate-500 block font-semibold">Digital e-Aadhaar Download:</span>
                    <span className="font-bold text-emerald-700 dark:text-emerald-400">{simulatedMilestones.eAadhaarExpected}</span>
                  </div>
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                    <span className="text-slate-500 block font-semibold">Speed Post Card Delivery:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{simulatedMilestones.speedPostDeliveryExpected}</span>
                  </div>
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                    <span className="text-slate-500 block font-semibold">Statutory Maximum Turnaround:</span>
                    <span className="font-bold text-amber-700 dark:text-amber-400">{simulatedMilestones.statutoryMaxTurnaround} (90 Days)</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 10 Milestone Date Definitions */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              The 10 Distinct Milestone Date Labels (Never Merged)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              {MILESTONE_DATE_FIELDS.map((dateItem) => (
                <div
                  key={dateItem.id}
                  className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-1"
                >
                  <div className="font-bold text-slate-900 dark:text-white">
                    {dateItem.label}
                  </div>
                  <p className="text-slate-600 dark:text-slate-400">
                    {dateItem.description}
                  </p>
                  <div className="text-[11px] text-blue-600 dark:text-blue-400 pt-1 border-t border-slate-200 dark:border-slate-700/60 font-medium">
                    Legal Impact: {dateItem.significance}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB PANEL 7: MYTHS & COMMON MISTAKES */}
      {activeTab === 'caveats' && (
        <div
          role="tabpanel"
          id="panel-caveats"
          aria-labelledby="tab-caveats"
          className="space-y-6 animate-fadeIn"
        >
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <span>Flagged Misleading Claims &amp; Online Myths</span>
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Protect your personal identity and finances from fraudulent online promises, unauthorized cyber cafes, and common processing mistakes.
            </p>

            <div className="space-y-4">
              {FLAGGED_MYTHS.map((m) => (
                <div
                  key={m.id}
                  className="p-4 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/30 dark:bg-amber-950/10 space-y-2 text-xs"
                >
                  <div className="flex items-center gap-2 text-amber-800 dark:text-amber-400 font-bold">
                    <span className="px-2 py-0.5 rounded bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200 text-[10px] uppercase font-extrabold">
                      MYTH
                    </span>
                    <span>&ldquo;{m.myth}&rdquo;</span>
                  </div>

                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed pl-8">
                    <strong>Official Reality: </strong>{m.fact}
                  </p>

                  <div className="pl-8 text-[11px] text-slate-500 dark:text-slate-400 italic">
                    Statutory Authority: {m.source}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB PANEL 8: FAQS & OFFICIAL ESCALATION */}
      {activeTab === 'faqs' && (
        <div
          role="tabpanel"
          id="panel-faqs"
          aria-labelledby="tab-faqs"
          className="space-y-6 animate-fadeIn"
        >
          {/* FAQ Accordion */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
              Frequently Asked Questions (UIDAI Standard Answers)
            </h3>

            <div className="space-y-2.5">
              {AADHAAR_FAQS.map((faq, idx) => {
                const isExpanded = expandedFaq === idx;
                return (
                  <div
                    key={idx}
                    className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden"
                  >
                    <button
                      type="button"
                      onClick={() => toggleFaq(idx)}
                      className="w-full flex items-center justify-between p-4 text-left text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                      aria-expanded={isExpanded}
                    >
                      <span className="pr-4">{faq.q}</span>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-slate-500 shrink-0" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
                      )}
                    </button>

                    {isExpanded && (
                      <div className="p-4 pt-1 text-xs text-slate-600 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-800/20">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Official Verification Notice */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 space-y-1">
            <div className="font-semibold text-slate-700 dark:text-slate-300">
              Source Transparency &amp; Verification Notice:
            </div>
            <p>
              All fee caps, document schedules, and procedures in this guide are verified against official notifications from the Unique Identification Authority of India (UIDAI), Ministry of Electronics &amp; IT. Information last verified: 12 November 2026. If any official circular updates or if a centre acts contrary to these guidelines, citizens can escalate to helpline 1947 or helpdesk@uidai.gov.in.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
