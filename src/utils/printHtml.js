/**
 * Helpers for the print windows (RTI draft, first appeal notice, form templates).
 * Those windows are written with document.write, so anything the user typed has to be
 * escaped before it goes into the markup. Otherwise "<" and "&" get eaten and tags run.
 */

const HTML_ESCAPES = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

export const escapeHtml = (value) =>
  String(value ?? '').replace(/[&<>"']/g, (ch) => HTML_ESCAPES[ch]);

/**
 * Full HTML document for a plain-text letter, shown in a <pre>.
 */
export const buildLetterPrintHtml = (title, text) =>
  `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title><style>body{font-family:serif;font-size:13pt;line-height:1.6;padding:40px;}pre{font-family:inherit;white-space:pre-wrap;}</style></head><body><pre>${escapeHtml(text)}</pre></body></html>`;
