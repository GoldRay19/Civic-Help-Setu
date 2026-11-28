// Turns the securely downloaded JSON export into CSV in the browser, so the CSV choice goes
// through exactly the same authorisation, field filtering and single-use link as JSON.

// A spreadsheet runs a cell that starts with one of these as a formula.
const FORMULA_START = /^[\s]*[=+\-@]|^[\t\r]/;

const cell = (value) => {
  let text = value === null || value === undefined ? '' : String(value);
  if (typeof value === 'string' && FORMULA_START.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
};

const isRecord = (value) => Boolean(value) && typeof value === 'object' && !Array.isArray(value);

/**
 * One row per value: category, record number, field, value. Categories have different fields, so
 * this keeps a single table that opens cleanly in any spreadsheet. List fields get a row per item.
 */
export function privacyExportToCsv(payload) {
  if (!isRecord(payload) || !isRecord(payload.data)) {
    throw new TypeError('The export file is not in the expected format.');
  }
  const rows = [['category', 'record', 'field', 'value']];
  rows.push(['export', 1, 'exportVersion', payload.exportVersion]);
  rows.push(['export', 1, 'generatedAt', payload.generatedAt]);

  for (const [category, content] of Object.entries(payload.data)) {
    const records = Array.isArray(content) ? content : [content];
    if (records.length === 0) rows.push([category, '', '', 'No records']);
    records.forEach((record, index) => {
      if (!isRecord(record)) return;
      for (const [field, value] of Object.entries(record)) {
        for (const item of Array.isArray(value) ? value : [value]) {
          rows.push([category, index + 1, field, isRecord(item) ? JSON.stringify(item) : item]);
        }
      }
    });
  }

  return `${rows.map((row) => row.map(cell).join(',')).join('\r\n')}\r\n`;
}
