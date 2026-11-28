import { useState } from 'react';
import {
  Wheat,
  ShieldCheck,
  Scale,
  Fingerprint,
  FileText,
  AlertCircle,
  Database
} from 'lucide-react';
import RationEntitlementAuditorCard from '../components/nfsaRation/RationEntitlementAuditorCard';
import BiometricExceptionLoggerCard from '../components/nfsaRation/BiometricExceptionLoggerCard';
import NfsaCaseSummaryCard from '../components/nfsaRation/NfsaCaseSummaryCard';
import NfsaDrafterModal from '../components/nfsaRation/NfsaDrafterModal';
import {
  getStoredRationRecords,
  saveRationRecord,
  deleteRationRecord,
  seedSampleRationRecords,
  OFFICIAL_STATUS_DISCLAIMER
} from '../services/nfsaRationStorage';

export default function NfsaRationWorkspace() {
  const [activeTab, setActiveTab] = useState('AUDITOR'); // 'AUDITOR' | 'BIOMETRIC' | 'VAULT'
  const [cases, setCases] = useState(() => getStoredRationRecords());
  const [selectedCaseForDraft, setSelectedCaseForDraft] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [notification, setNotification] = useState('');

  const loadCases = () => {
    const list = getStoredRationRecords();
    setCases(list);
  };

  const showNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 4000);
  };

  const handleSaveAudit = async (auditData) => {
    const newRecord = {
      title: `${auditData.cardType} Ration Audit - ${auditData.audit.deficitKg}kg Deficit`,
      cardType: auditData.cardType,
      familyMembers: auditData.familyMembers,
      maskedRationCard: 'RC-UP****8912',
      entitledKg: auditData.entitlement.totalGrainKg,
      actualDeliveredKg: auditData.audit.actualDeliveredKg,
      deficitKg: auditData.audit.deficitKg,
      deficitPercentage: auditData.audit.deficitPercentage,
      expectedCost: auditData.audit.expectedCost,
      actualChargedRupees: auditData.audit.actualChargedRupees,
      overchargeRupees: auditData.audit.overchargeRupees,
      fsaAmount: Math.round(auditData.audit.deficitKg * 23 * 100) / 100,
      selectedViolations: [
        auditData.audit.hasWeighmentDeficit ? `Short-weighing of ${auditData.audit.deficitKg} kg` : null,
        auditData.audit.hasOvercharging ? `Overcharge of ₹${auditData.audit.overchargeRupees}` : null
      ].filter(Boolean),
      stage: 'DGRO_PETITION_READY'
    };

    await saveRationRecord(newRecord);
    loadCases();
    showNotification('Ration quota audit successfully saved to your offline vault.');
  };

  const handleLogBiometric = async (bioData) => {
    const newRecord = {
      title: `Biometric Exclusion - ${bioData.biometricAudit.failureMode}`,
      cardType: 'PHH',
      familyMembers: 4,
      maskedRationCard: 'RC-UP****7721',
      deficitKg: bioData.fsaCalculation.safeDeficit,
      fsaAmount: bioData.fsaCalculation.totalFoodSecurityAllowance,
      biometricFailureMode: bioData.failureMode,
      fallbackOffered: bioData.fallbackOffered,
      isIllegalDenial: bioData.biometricAudit.isIllegalDenial,
      selectedViolations: [
        bioData.biometricAudit.isIllegalDenial ? 'Refusal of ration due to biometric sensor failure' : null,
        'Denial of statutory fallback mechanism under Section 12',
        `Food Security Allowance claim: ₹${bioData.fsaCalculation.totalFoodSecurityAllowance}`
      ].filter(Boolean),
      stage: 'DGRO_PETITION_READY'
    };

    await saveRationRecord(newRecord);
    loadCases();
    showNotification('Biometric failure incident & Section 8 FSA claim logged.');
  };

  const handleDeleteCase = (id) => {
    deleteRationRecord(id);
    loadCases();
    showNotification('Grievance record removed from vault.');
  };

  const handleOpenDraftModal = (c = null) => {
    setSelectedCaseForDraft(c || cases[0] || null);
    setIsModalOpen(true);
  };

  const handleSeedSamples = async () => {
    await seedSampleRationRecords();
    loadCases();
    showNotification('Sample NFSA civic grievance cases loaded into vault.');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Hero Header */}
        <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold rounded-full flex items-center gap-1.5">
                <Wheat className="w-3.5 h-3.5" />
                NFSA 2013 Statutory Redressal
              </span>
              <span className="px-3 py-1 bg-teal-500/20 border border-teal-400/30 text-teal-300 text-xs font-semibold rounded-full flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5" />
                Section 15 DGRO & Section 16 Food Commission
              </span>
              <span className="px-3 py-1 bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs font-semibold rounded-full flex items-center gap-1.5">
                <Fingerprint className="w-3.5 h-3.5" />
                Biometric Fallback Mandate
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              National Food Security (NFSA 2013) Ration Entitlement & Biometric Redressal Workspace
            </h1>
            <p className="text-slate-300 text-sm max-w-3xl leading-relaxed">
              Empowering ration cardholders across India to audit statutory foodgrain entitlements under Section 3, detect Fair Price Shop short-weighing, challenge illegal biometric fingerprint exclusion under Supreme Court mandates, and claim statutory Food Security Allowance (Section 8).
            </p>

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="button"
                onClick={() => handleOpenDraftModal()}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-semibold transition-all shadow-md flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                Draft Section 15 DGRO Petition
              </button>
              {cases.length === 0 && (
                <button
                  type="button"
                  onClick={handleSeedSamples}
                  className="px-4 py-2 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-600 text-slate-200 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                >
                  <Database className="w-4 h-4" />
                  Load Sample Grievances
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Notification Toast */}
        {notification && (
          <div className="p-3 bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 rounded-xl text-xs font-semibold text-emerald-800 dark:text-emerald-200 flex items-center gap-2 transition-all shadow-sm">
            <ShieldCheck className="w-4 h-4" />
            <span>{notification}</span>
          </div>
        )}

        {/* Statutory Disclaimer Card */}
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 rounded-xl p-4 flex items-start gap-3 text-xs text-amber-900 dark:text-amber-200">
          <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold uppercase tracking-wider block">Statutory Advisory & Legal Notice</span>
            <p className="leading-relaxed">{OFFICIAL_STATUS_DISCLAIMER}</p>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-6 text-sm font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('AUDITOR')}
            className={`pb-3 border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'AUDITOR'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Scale className="w-4 h-4" />
            Quota & Weighment Auditor
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('BIOMETRIC')}
            className={`pb-3 border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'BIOMETRIC'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Fingerprint className="w-4 h-4" />
            Biometric Fallback & Section 8 FSA
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('VAULT')}
            className={`pb-3 border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'VAULT'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Database className="w-4 h-4" />
            Grievance Vault ({cases.length})
          </button>
        </div>

        {/* Tab Content Panels */}
        <div>
          {activeTab === 'AUDITOR' && (
            <RationEntitlementAuditorCard onSaveAudit={handleSaveAudit} />
          )}

          {activeTab === 'BIOMETRIC' && (
            <BiometricExceptionLoggerCard onLogBiometricException={handleLogBiometric} />
          )}

          {activeTab === 'VAULT' && (
            <NfsaCaseSummaryCard
              cases={cases}
              onSelectCaseForDraft={handleOpenDraftModal}
              onDeleteCase={handleDeleteCase}
            />
          )}
        </div>

        {/* Drafter Modal */}
        <NfsaDrafterModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          initialCase={selectedCaseForDraft}
        />
      </div>
    </div>
  );
}
