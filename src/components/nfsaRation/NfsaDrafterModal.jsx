import { useState, useMemo } from 'react';
import {
  generateDgroComplaintDossier,
  generateFoodCommissionAppealDossier,
  maskIdentifier
} from '../../services/nfsaRationService';
import { X, Copy, Check, Download, FileText, Scale } from 'lucide-react';

export default function NfsaDrafterModal({
  isOpen,
  onClose,
  initialCase = null
}) {
  const [activeTab, setActiveTab] = useState('DGRO'); // 'DGRO' | 'FOOD_COMMISSION'
  const [copied, setCopied] = useState(false);

  // Editable Form fields
  const [complainantName, setComplainantName] = useState(initialCase?.beneficiaryName || 'Rameshwar Lal');
  const [rationCardNo, setRationCardNo] = useState(initialCase?.maskedRationCard || 'RC-UP88192341');
  const [aadhaarNo, setAadhaarNo] = useState(initialCase?.maskedAadhaar || 'XXXX-XXXX-9012');
  const [cardType, setCardType] = useState(initialCase?.cardType || 'PHH');
  const [familyMembers, setFamilyMembers] = useState(initialCase?.familyMembers || 4);
  const [dealerName, setDealerName] = useState(initialCase?.dealerName || 'Suresh Chandra PDS Retailer');
  const [fairPriceShopNo, setFairPriceShopNo] = useState(initialCase?.fairPriceShopNo || 'FPS-142-VARANASI');
  const [shopLocation, setShopLocation] = useState(initialCase?.shopLocation || 'Shivpur Ward 14, Varanasi');
  const [district, setDistrict] = useState(initialCase?.district || 'Varanasi');
  const [state, setState] = useState(initialCase?.state || 'Uttar Pradesh');
  const [monthYear, setMonthYear] = useState(initialCase?.distributionMonth || 'October 2026');

  const maskedCard = useMemo(() => maskIdentifier(rationCardNo, 'RC'), [rationCardNo]);
  const maskedAadhaarVal = useMemo(() => maskIdentifier(aadhaarNo, 'UID'), [aadhaarNo]);

  const auditResult = useMemo(() => {
    return {
      entitledKg: initialCase?.entitledKg || 25,
      actualDeliveredKg: initialCase?.actualDeliveredKg || 0,
      deficitKg: initialCase?.deficitKg || 25,
      deficitPercentage: initialCase?.deficitPercentage || 100,
      expectedCost: initialCase?.expectedCost || 0,
      actualChargedRupees: initialCase?.actualChargedRupees || 0,
      overchargeRupees: initialCase?.overchargeRupees || 0,
      riceKg: Math.round((initialCase?.entitledKg || 25) * 0.6),
      wheatKg: Math.round((initialCase?.entitledKg || 25) * 0.4)
    };
  }, [initialCase]);

  const fsaResult = useMemo(() => {
    return {
      totalFoodSecurityAllowance: initialCase?.fsaAmount || 572.50,
      delayPenaltyInterest: 25.50
    };
  }, [initialCase]);

  const biometricAudit = useMemo(() => {
    return {
      isIllegalDenial: initialCase?.isIllegalDenial ?? true,
      failureMode: initialCase?.biometricFailureMode || 'Fingerprint Sensor Failure / Sensor Attrition'
    };
  }, [initialCase]);

  const petitionText = useMemo(() => {
    if (activeTab === 'FOOD_COMMISSION') {
      return generateFoodCommissionAppealDossier({
        complainantName,
        maskedRationCard: maskedCard,
        dgroOrderNo: 'DGRO/VNS/2026/NFSA-91',
        dgroOrderDate: new Date().toLocaleDateString('en-IN'),
        district,
        state,
        appealGrounds: '1. The DGRO failed to direct immediate release of foodgrains.\n2. Biometric exclusion without statutory fallback was overlooked.\n3. Mandatory Section 8 Food Security Allowance was not disbursed.',
        fsaAmount: fsaResult.totalFoodSecurityAllowance
      });
    }

    return generateDgroComplaintDossier({
      complainantName,
      maskedRationCard: maskedCard,
      maskedAadhaar: maskedAadhaarVal,
      cardType,
      familyMembers,
      fairPriceShopNo,
      dealerName,
      shopLocation,
      district,
      state,
      monthYear,
      auditResult,
      fsaResult,
      biometricAudit,
      selectedViolations: initialCase?.selectedViolations || [
        'Refusal of monthly grain quota due to biometric sensor failure',
        'Denial of statutory fallback under Section 12 of NFSA 2013',
        'Failure to disburse statutory Food Security Allowance under Section 8'
      ]
    });
  }, [
    activeTab,
    complainantName,
    maskedCard,
    maskedAadhaarVal,
    cardType,
    familyMembers,
    fairPriceShopNo,
    dealerName,
    shopLocation,
    district,
    state,
    monthYear,
    auditResult,
    fsaResult,
    biometricAudit,
    initialCase
  ]);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(petitionText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([petitionText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `NFSA_${activeTab}_Petition_${district}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 rounded-lg">
              <Scale className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                NFSA 2013 Statutory Grievance Drafter
              </h3>
              <p className="text-xs text-slate-500">
                Formulate Section 15 DGRO Petition or Section 16 State Food Commission Appeal
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="px-6 pt-3 flex gap-3 border-b border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab('DGRO')}
            className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'DGRO'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <FileText className="w-4 h-4" />
            Section 15 DGRO Petition (ADM / SDO)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('FOOD_COMMISSION')}
            className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'FOOD_COMMISSION'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Scale className="w-4 h-4" />
            Section 16 State Food Commission Appeal
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Quick Edit Party Fields */}
          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
            <h4 className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-3">
              Party & Fair Price Shop Particulars
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                  Complainant Name
                </label>
                <input
                  type="text"
                  value={complainantName}
                  onChange={(e) => setComplainantName(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                  Ration Card Number
                </label>
                <input
                  type="text"
                  value={rationCardNo}
                  onChange={(e) => setRationCardNo(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                  Aadhaar Number
                </label>
                <input
                  type="text"
                  value={aadhaarNo}
                  onChange={(e) => setAadhaarNo(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                  FPS Dealer Name
                </label>
                <input
                  type="text"
                  value={dealerName}
                  onChange={(e) => setDealerName(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                  FPS Shop ID
                </label>
                <input
                  type="text"
                  value={fairPriceShopNo}
                  onChange={(e) => setFairPriceShopNo(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                  Card Category
                </label>
                <select
                  value={cardType}
                  onChange={(e) => setCardType(e.target.value)}
                  className="w-full px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                >
                  <option value="AAY">AAY (35 kg)</option>
                  <option value="PHH">PHH (5 kg/person)</option>
                  <option value="NON_NFSA">Non-NFSA</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                  Family Members
                </label>
                <input
                  type="number"
                  min="1"
                  value={familyMembers}
                  onChange={(e) => setFamilyMembers(parseInt(e.target.value, 10) || 1)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                  FPS Location
                </label>
                <input
                  type="text"
                  value={shopLocation}
                  onChange={(e) => setShopLocation(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                  Distribution Month
                </label>
                <input
                  type="text"
                  value={monthYear}
                  onChange={(e) => setMonthYear(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                  District & State
                </label>
                <div className="flex gap-1">
                  <input
                    type="text"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-1/2 px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                  />
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-1/2 px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Generated Petition Output */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-semibold uppercase tracking-wider">
                Statutory Draft Output
              </span>
              <span>DPDP Sanitized</span>
            </div>
            <pre className="p-4 bg-slate-950 text-slate-100 rounded-xl font-mono text-xs overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-72 border border-slate-800">
              {petitionText}
            </pre>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50 rounded-b-2xl">
          <span className="text-xs text-slate-500">
            Print or file directly with District Collectorate / SDO Office.
          </span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleCopy}
              className="px-4 py-2 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied' : 'Copy Text'}
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Download className="w-4 h-4" />
              Download Petition
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

