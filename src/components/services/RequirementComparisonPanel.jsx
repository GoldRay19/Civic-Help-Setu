import { useMemo } from 'react';
import { compareRequirements } from '../../services/requirementComparisonService';
import { REQUIREMENT_LABELS } from '../../services/requirementTypes';

const Rows = ({ title, rows }) => (
  <>
    <h4 style={{ margin: '0.75rem 0 0.35rem', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
      {title} ({rows.length})
    </h4>
    {rows.length === 0 ? (
      <p className="compare-missing">None.</p>
    ) : (
      <ul className="compare-list">
        {rows.map((row) => (
          <li key={row.id} style={{ marginBottom: '0.4rem', overflowWrap: 'anywhere' }}>
            {row.label}
            <ul className="compare-list">
              {row.entries.map((entry) => (
                <li key={entry.serviceId} style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem' }}>
                  {entry.serviceName}: {REQUIREMENT_LABELS[entry.type]}
                  {entry.condition ? ` (${entry.condition})` : ''}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    )}
  </>
);

/** Documents the compared services have in common, and those only some of them ask for. */
export default function RequirementComparisonPanel({ comparedServices }) {
  const { shared, partial, withoutList } = useMemo(
    () => compareRequirements(comparedServices),
    [comparedServices]
  );

  if (!comparedServices || comparedServices.length < 2) return null;

  return (
    <section aria-labelledby="requirement-comparison-title" style={{ marginTop: '1.5rem' }}>
      <h3 id="requirement-comparison-title" style={{ margin: '0 0 0.35rem', fontSize: '1rem', color: 'var(--text-primary)' }}>
        Documents side by side
      </h3>
      <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
        Matched on the exact wording in each guide, so similar papers worded differently appear separately.
        Confirm the current list with the official source.
      </p>
      <Rows title="Listed by every service with a document list" rows={shared} />
      <Rows title="Listed by only some" rows={partial} />
      {withoutList.length > 0 && (
        <p role="status" className="compare-missing">
          No document list is recorded for: {withoutList.map((s) => s.name).join(', ')}.
        </p>
      )}
    </section>
  );
}
