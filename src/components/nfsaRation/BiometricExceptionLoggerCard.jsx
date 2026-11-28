import { useState, useMemo } from 'react';
import {
  BIOMETRIC_FAILURE_MODES,
  FALLBACK_MECHANISMS,
  auditBiometricFallbackCompliance,
  calculateFoodSecurityAllowance
} from '../../services/nfsaRationService';
import { Fingerprint, AlertOctagon, HelpCircle, FileCheck, Coins } from 'lucide-react';

export default function BiometricExceptionLoggerCard({ onLogBiometricException }) {
  const [failureMode, setFailureMode] = useState('FINGERPRINT_ATTRITION');
  const [fallbackOffered, setFallbackOffered] = useState('NONE');
  const [refusalOfRation, setRefusalOfRation] = useState(true);
  const [offlineRegisterAvailable, setOfflineRegisterAvailable] = useState(false);
  const [deficitKg, setDeficitKg] = useState('20');
  const [delayedDays, setDelayedDays] = useState('25');

  const biometricAudit = useMemo(() => {
    return auditBiometricFallbackCompliance({
      failureMode,
      fallbackOffered,
      refusalOfRation,
      offlineRegisterAvailable
    });
  }, [failureMode, fallbackOffered, refusalOfRation, offlineRegisterAvailable]);

  const fsaCalculation = useMemo(() => {
    return calculateFoodSecurityAllowance({
      deficitKg: parseFloat(deficitKg) || 0,
      delayedDays: parseInt(delayedDays, 10) || 0
    });
  }, [deficitKg, delayedDays]);

  const handleLog = () => {
    if (onLogBiometricException) {
      onLogBiometricException({
        failureMode,
        fallbackOffered,
        refusalOfRation,
        offlineRegisterAvailable,
        biometricAudit,
        fsaCalculation,
        date: new Date().toISOString()
      });
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 rounded-lg">
              <Fingerprint className="w-5 h-5" />
            </span>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Biometric Exception & Food Security Allowance (Section 8)
            </h3>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Audits e-PoS fingerprint/iris failure at Fair Price Shops and calculates statutory Food Security Allowance (FSA) under Section 8.
          </p>
        </div>
        <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-800 dark:text-indigo-200 text-xs font-semibold rounded-full">
          Section 8 & 12
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="nfsa-failure-mode-select" className="block text-xs font-semibold uppercase text-slate-700 dark:text-slate-300 mb-1">
            Biometric Failure Mode at e-PoS
          </label>
          <select
            id="nfsa-failure-mode-select"
            value={failureMode}
            onChange={(e) => setFailureMode(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-800 dark:text-slate-100"
          >
            {Object.values(BIOMETRIC_FAILURE_MODES).map((mode) => (
              <option key={mode.code} value={mode.code}>
                {mode.label}
              </option>
            ))}
          </select>
          <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 block">
            {BIOMETRIC_FAILURE_MODES[failureMode]?.description}
          </span>
        </div>

        <div>
          <label htmlFor="nfsa-fallback-select" className="block text-xs font-semibold uppercase text-slate-700 dark:text-slate-300 mb-1">
            Fallback Mechanism Provided by Dealer
          </label>
          <select
            id="nfsa-fallback-select"
            value={fallbackOffered}
            onChange={(e) => setFallbackOffered(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-800 dark:text-slate-100"
          >
            <option value="NONE">None / Dealer Refused Fallback and Turned Cardholder Away</option>
            {Object.values(FALLBACK_MECHANISMS).map((fb) => (
              <option key={fb.code} value={fb.code}>
                {fb.label} ({fb.statutoryRef})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-wrap gap-6 pt-1 text-sm">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={refusalOfRation}
            onChange={(e) => setRefusalOfRation(e.target.checked)}
            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
          />
          <span className="text-slate-700 dark:text-slate-300">
            Dealer refused foodgrain release due to authentication failure
          </span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={offlineRegisterAvailable}
            onChange={(e) => setOfflineRegisterAvailable(e.target.checked)}
            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
          />
          <span className="text-slate-700 dark:text-slate-300">
            FPS dealer maintains physical manual exemption register
          </span>
        </label>
      </div>

      {/* Biometric Compliance Verdict */}
      {biometricAudit.isIllegalDenial ? (
        <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-900 rounded-xl p-4 space-y-2">
          <div className="flex items-start gap-3">
            <AlertOctagon className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div>
              <h5 className="text-sm font-bold text-rose-900 dark:text-rose-200">
                Statutory Violation: Unlawful Biometric Exclusion
              </h5>
              <p className="text-xs text-rose-700 dark:text-rose-300 mt-1">
                {biometricAudit.statutoryInfraction}
              </p>
            </div>
          </div>
          <div className="text-xs text-slate-600 dark:text-slate-400 bg-white/70 dark:bg-slate-900/60 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
            <span className="font-semibold block text-slate-900 dark:text-white mb-1">
              Mandatory Fallback Protocols (Directives of Central Ministry & Supreme Court):
            </span>
            <ul className="list-disc pl-4 space-y-0.5">
              {biometricAudit.fallbackMandated.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 flex items-center gap-3">
          <FileCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span className="text-xs font-medium text-emerald-800 dark:text-emerald-200">
            {biometricAudit.statutoryInfraction}
          </span>
        </div>
      )}

      {/* Section 8 Food Security Allowance Calculator */}
      <div className="border-t border-slate-200 dark:border-slate-800 pt-5 space-y-4">
        <div className="flex items-center gap-2">
          <Coins className="w-4 h-4 text-amber-500" />
          <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
            Section 8 Food Security Allowance (FSA) Calculation
          </h4>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-400">
          Under Section 8 of NFSA 2013, if entitled foodgrains are not supplied within the statutory period, the State Government must pay Food Security Allowance calculated at Minimum Support Price (MSP).
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="nfsa-deficit-kg-input" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Undelivered / Deficit Grain (kg)
            </label>
            <input
              id="nfsa-deficit-kg-input"
              type="number"
              min="1"
              value={deficitKg}
              onChange={(e) => setDeficitKg(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-slate-100"
              placeholder="e.g. 20"
            />
          </div>

          <div>
            <label htmlFor="nfsa-delayed-days-input" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Distribution Delay (Days Past Due Date)
            </label>
            <input
              id="nfsa-delayed-days-input"
              type="number"
              min="0"
              value={delayedDays}
              onChange={(e) => setDelayedDays(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-slate-100"
              placeholder="e.g. 25"
            />
          </div>
        </div>

        {/* FSA Result Card */}
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-xl p-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-2 bg-white dark:bg-slate-900 rounded-lg">
              <span className="text-xs text-slate-500">Deficit Grain</span>
              <div className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                {fsaCalculation.safeDeficit} kg
              </div>
            </div>
            <div className="p-2 bg-white dark:bg-slate-900 rounded-lg">
              <span className="text-xs text-slate-500">Base MSP Value</span>
              <div className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                ₹{fsaCalculation.baseAllowance}
              </div>
            </div>
            <div className="p-2 bg-white dark:bg-slate-900 rounded-lg">
              <span className="text-xs text-slate-500">Delay Interest</span>
              <div className="text-lg font-bold text-amber-600 dark:text-amber-400 mt-1">
                ₹{fsaCalculation.delayPenaltyInterest}
              </div>
            </div>
            <div className="p-2 bg-white dark:bg-slate-900 rounded-lg">
              <span className="text-xs text-slate-500">Total Statutory FSA</span>
              <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                ₹{fsaCalculation.totalFoodSecurityAllowance}
              </div>
            </div>
          </div>
          <div className="mt-3 text-[11px] text-amber-800 dark:text-amber-300 flex items-center gap-1.5 justify-center">
            <HelpCircle className="w-3.5 h-3.5 shrink-0" />
            <span>Payable by District Grievance Redressal Officer (DGRO) order under Section 15 & Food Security Allowance Rules 2015.</span>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="button"
          onClick={handleLog}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center gap-2"
        >
          <FileCheck className="w-4 h-4" />
          Log Biometric Incident & FSA
        </button>
      </div>
    </div>
  );
}

