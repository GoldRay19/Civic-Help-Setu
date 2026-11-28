import {
  OFFICIAL_STATUS_DISCLAIMER,
  exportRationDossier
} from '../../services/nfsaRationStorage';
import { FileText, Download, Trash2, Key, Info, ExternalLink } from 'lucide-react';

export default function NfsaCaseSummaryCard({
  cases = [],
  onSelectCaseForDraft,
  onDeleteCase
}) {
  const handleExport = (c) => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(exportRationDossier(c));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `NFSA_Dossier_${c.id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-blue-50 dark:bg-blue-950/40 text-blue-600 rounded-lg">
              <FileText className="w-5 h-5" />
            </span>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              NFSA Ration Dispute Vault ({cases.length})
            </h3>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Local offline case records with cryptographic SHA-256 seal for presentation before the DGRO or State Food Commission.
          </p>
        </div>
      </div>

      {cases.length === 0 ? (
        <div className="text-center py-10 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            No ration grievances recorded in vault yet. Run an Entitlement Audit or Biometric Log to create one.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {cases.map((c) => (
            <div
              key={c.id}
              className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-colors bg-slate-50/50 dark:bg-slate-800/40 space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    {c.title || `Ration Dispute - ${c.id}`}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Beneficiary: <strong className="text-slate-800 dark:text-slate-200">{c.beneficiaryName || 'Self'}</strong> | Card: {c.maskedRationCard || 'RC-XXXX'} ({c.cardType || 'PHH'}) | FPS: {c.fairPriceShopNo || 'FPS Shop'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 text-xs font-semibold rounded-full">
                    Deficit: {c.deficitKg || 0} kg
                  </span>
                  {c.fsaAmount > 0 && (
                    <span className="px-2.5 py-1 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200 text-xs font-semibold rounded-full">
                      FSA Due: ₹{c.fsaAmount}
                    </span>
                  )}
                </div>
              </div>

              {/* Violations Summary */}
              {Array.isArray(c.selectedViolations) && c.selectedViolations.length > 0 && (
                <div className="text-xs text-slate-600 dark:text-slate-400">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Infractions:</span>
                  <ul className="list-disc pl-5 mt-1 space-y-0.5">
                    {c.selectedViolations.map((v, i) => (
                      <li key={i}>{v}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Footer row with Seal and Action buttons */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-200 dark:border-slate-700/60 text-xs">
                <div className="flex items-center gap-1.5 text-slate-500 font-mono">
                  <Key className="w-3.5 h-3.5 text-slate-400" />
                  <span>Seal: {c.integritySeal?.substring(0, 16) || 'UNSEALED'}...</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onSelectCaseForDraft && onSelectCaseForDraft(c)}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-1"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Draft Petition
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExport(c)}
                    className="p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    title="Export Dossier JSON"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteCase && onDeleteCase(c.id)}
                    className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                    title="Delete Case"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Statutory Disclaimer Notice */}
      <div className="bg-slate-100 dark:bg-slate-800/80 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
        <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
        <p>{OFFICIAL_STATUS_DISCLAIMER}</p>
      </div>
    </div>
  );
}

