/**
 * Small helpers for writing iCalendar (.ics) text as RFC 5545 expects.
 * Shared by the appointment export and the saved service reminders.
 */

/**
 * Escapes a value for a TEXT property (SUMMARY, DESCRIPTION, LOCATION).
 * Backslash goes first so the backslashes added for ; , and newlines are not doubled.
 */
export const escapeIcsText = (value) =>
  String(value ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r\n|\r|\n/g, '\\n');

const utf8Length = (char) => {
  const code = char.codePointAt(0);
  if (code < 0x80) return 1;
  if (code < 0x800) return 2;
  if (code < 0x10000) return 3;
  return 4;
};

/**
 * Folds a content line so no physical line is longer than 75 octets.
 * Continuation lines start with a single space (which counts toward the 75),
 * and multi-byte UTF-8 characters are never split.
 */
export const foldIcsLine = (line) => {
  const parts = [];
  let current = '';
  let currentBytes = 0;
  let limit = 75;

  for (const char of line) {
    const size = utf8Length(char);
    if (currentBytes + size > limit) {
      parts.push(current);
      current = '';
      currentBytes = 0;
      limit = 74;
    }
    current += char;
    currentBytes += size;
  }
  parts.push(current);

  return parts.join('\r\n ');
};

/** Folds every line and joins them with CRLF, ending with a CRLF as well. */
export const buildIcsContent = (lines) => `${lines.map(foldIcsLine).join('\r\n')}\r\n`;

/** Formats a Date as a UTC DATE-TIME value, e.g. 20261024T063000Z. */
export const formatIcsUtcTimestamp = (date = new Date()) =>
  `${date.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`;

/**
 * Parses a YYYY-MM-DD string into its parts, or returns null when it is missing
 * or not a real calendar date (so 2026-02-30 is rejected instead of rolling over).
 */
export const parseIsoDate = (value) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value ?? '').trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return { year, month, day };
};
