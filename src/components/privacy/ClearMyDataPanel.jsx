import { useState, useRef, useCallback } from 'react';
import { Trash2, CheckCircle2, AlertTriangle, MinusCircle } from 'lucide-react';
import { useConfirm } from '../../context/ConfirmationDialogContext';
import { useAuth } from '../../context/AuthContext';
import {
  clearUserData,
  getStoredDataSummary,
  expandCategories,
} from '../../services/clearMyDataService.js';

const STATUS_TEXT = {
  cleared: 'Cleared',
  nothing: 'Nothing stored',
  partial: 'Partly cleared',
  failed: 'Not cleared',
};

const StatusIcon = ({ status }) => {
  if (status === 'cleared') return <CheckCircle2 size={18} aria-hidden="true" />;
  if (status === 'nothing') return <MinusCircle size={18} aria-hidden="true" />;
  return <AlertTriangle size={18} aria-hidden="true" />;
};

const countText = (item) => {
  if (item.keyCount === 0) return 'Nothing stored';
  return `${item.recordCount} ${item.recordCount === 1 ? 'item' : 'items'} stored`;
};

/**
 * App-scoped "Clear my data" section (#223). Deletes only the keys listed in the registry in
 * privacyConsentService.js, asks first with the shared ConfirmationDialog, and shows a result
 * row per category, including the ones that failed.
 */
const ClearMyDataPanel = ({ onCleared }) => {
  const confirm = useConfirm();
  const { user } = useAuth();
  const [summary, setSummary] = useState(() => getStoredDataSummary());
  const [selected, setSelected] = useState([]);
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const resultRef = useRef(null);

  const allIds = summary.map((c) => c.id);
  const everything = selected.length === allIds.length;
  const { auto } = selected.length ? expandCategories(selected) : { auto: [] };
  // The device has no account of its own, so a signed-out visitor acts as "device".
  const actorId = user?.id || 'device';

  const toggle = (id) => {
    setSelected((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  };
  const toggleEverything = () => setSelected(everything ? [] : allIds);

  const run = useCallback(
    async (ids) => {
      setError('');
      const labels = summary.filter((c) => ids.includes(c.id)).map((c) => c.label);
      const { auto: extra } = expandCategories(ids);
      const extraLabels = summary.filter((c) => extra.includes(c.id)).map((c) => c.label);
      const ok = await confirm({
        title: 'Clear this data?',
        message:
          'This deletes the selected records from this browser and cannot be undone. Your sign-in account, ' +
          'files you already downloaded or printed, and anything shared with other apps are not affected.' +
          (extraLabels.length ? ` ${extraLabels.join(', ')} will be cleared as well because it only holds copies.` : ''),
        itemName: labels.join(', '),
        confirmLabel: 'Delete data',
        cancelLabel: 'Keep my data',
        variant: 'danger',
      });
      if (!ok) return;

      setBusy(true);
      try {
        const next = clearUserData({ categories: ids, actorId });
        setReport(next);
        setSelected(next.results.filter((r) => r.status === 'failed' || r.status === 'partial').map((r) => r.id));
        onCleared?.(next);
      } catch (err) {
        setError(err?.message || 'Could not clear your data.');
      } finally {
        setSummary(getStoredDataSummary());
        setBusy(false);
        // Move the reader to the outcome, it replaces what they just confirmed
        setTimeout(() => resultRef.current?.focus(), 0);
      }
    },
    [confirm, summary, actorId, onCleared]
  );

  const failedRows = report ? report.results.filter((r) => r.status === 'failed' || r.status === 'partial') : [];

  return (
    <section className="cmd" aria-labelledby="cmd-title">
      <h2 id="cmd-title" className="cmd__title">
        <Trash2 size={20} aria-hidden="true" /> Clear my data
      </h2>
      <p className="cmd__lead">
        Civic-Help-Setu keeps your records in this browser only. If you share this device, choose what to delete below.
      </p>

      <fieldset className="cmd__fieldset" disabled={busy}>
        <legend className="cmd__legend">What do you want to delete?</legend>

        <label className="cmd__row cmd__row--all">
          <input
            type="checkbox"
            checked={everything}
            ref={(el) => {
              if (el) el.indeterminate = selected.length > 0 && !everything;
            }}
            onChange={toggleEverything}
          />
          <span className="cmd__text">
            <span className="cmd__label">Everything listed below</span>
            <span className="cmd__desc">Selects every category.</span>
          </span>
        </label>

        {summary.map((item) => (
          <label key={item.id} className="cmd__row">
            <input type="checkbox" checked={selected.includes(item.id)} onChange={() => toggle(item.id)} />
            <span className="cmd__text">
              <span className="cmd__label">{item.label}</span>
              <span className="cmd__desc">{item.description}</span>
              <span className="cmd__count">{countText(item)}</span>
            </span>
          </label>
        ))}
      </fieldset>

      {auto.length > 0 && (
        <p className="cmd__note" role="status">
          Offline copies and location will be cleared too, because they only hold copies of your tracking records and saved items.
        </p>
      )}

      <div className="cmd__box">
        <h3 className="cmd__box-title">What is not deleted</h3>
        <ul className="cmd__list">
          <li>
            Your sign-in account and the profile details you save with Edit Profile (name, phone, city, state,
            occupation, bio). These are held by the sign-in provider (Clerk), not in this browser. To remove the
            extra details, edit your profile, clear the fields and save. To delete the account, use Clerk.
          </li>
          <li>Anything you already downloaded, printed, copied or sent, such as exports, PDFs, WhatsApp or Telegram shares and calendar events.</li>
          <li>
            Requests your browser made to outside services, such as Google Fonts, the QR code image service and map links.
            Those services and your internet provider may keep their own logs.
          </li>
          <li>Theme, language, accessibility settings, your privacy choices and a short receipt that data was cleared (it holds no personal details).</li>
          <li>Outdated-information reports you sent to the review queue, and the admin portal data.</li>
        </ul>
      </div>

      <div className="cmd__actions">
        <button
          type="button"
          className="btn cmd__danger"
          disabled={busy || selected.length === 0}
          onClick={() => run(selected)}
        >
          <Trash2 size={16} aria-hidden="true" />
          <span>{busy ? 'Clearing...' : 'Clear selected data'}</span>
        </button>
        {selected.length === 0 && <span className="cmd__hint">Choose at least one category.</span>}
      </div>

      {error && (
        <p className="cmd__alert" role="alert">
          {error}
        </p>
      )}

      {report && (
        <div
          className="cmd__result"
          ref={resultRef}
          tabIndex={-1}
          role={failedRows.length ? 'alert' : 'status'}
          aria-labelledby="cmd-result-title"
        >
          <h3 id="cmd-result-title" className="cmd__box-title">
            {failedRows.length ? 'Some data could not be cleared' : 'Your data was cleared'}
          </h3>
          <ul className="cmd__results">
            {report.results.map((row) => (
              <li key={row.id} className={`cmd__result-row cmd__result-row--${row.status}`}>
                <StatusIcon status={row.status} />
                <span className="cmd__text">
                  <span className="cmd__label">
                    {row.label}: {STATUS_TEXT[row.status]}
                    {row.auto && ' (cleared along with your selection)'}
                  </span>
                  {row.removed > 0 && (
                    <span className="cmd__desc">{row.removed} stored {row.removed === 1 ? 'entry' : 'entries'} removed.</span>
                  )}
                  {row.failed.map((f) => (
                    <span key={f.key} className="cmd__desc cmd__desc--error">
                      Could not remove {f.key}: {f.error}
                    </span>
                  ))}
                </span>
              </li>
            ))}
          </ul>
          {failedRows.length > 0 && (
            <button
              type="button"
              className="btn btn-secondary cmd__retry"
              disabled={busy}
              onClick={() => run(failedRows.map((r) => r.id))}
            >
              Try the failed ones again
            </button>
          )}
        </div>
      )}
    </section>
  );
};

export default ClearMyDataPanel;
