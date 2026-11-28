import { withCsrfHeaders } from '../utils/csrf.js';

const messages = {
  401: 'Sign in again to access the shared moderation queue.',
  403: 'A verified administrator account is required.',
  409: 'This report changed. Refresh before reviewing it, or retry a changed submission with a new receipt key.',
  423: 'This attachment is quarantined and cannot be downloaded.',
  429: 'Too many submissions. Wait a minute before retrying. Your feedback is still in the form.',
};
export async function feedbackRequest({ method = 'GET', body, query = '', key, getToken, signal } = {}) {
  const token = await getToken?.();
  const response = await fetch(`/api/bottleneck-feedback${query}`, { method, signal, credentials: 'same-origin',
    headers: withCsrfHeaders({ 'Content-Type': 'application/json', ...(key ? { 'Idempotency-Key': key } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}) }),
    ...(body ? { body: JSON.stringify(body) } : {}) });
  if (!response.ok) throw new Error(messages[response.status] || 'Feedback service unavailable. Nothing has been confirmed; keep this form open and retry.');
  return response.json();
}

export const FEEDBACK_ATTACHMENT_TYPES = ['image/png', 'image/jpeg', 'application/pdf'];
export const MAX_FEEDBACK_ATTACHMENT_BYTES = 256 * 1024;

const sizeLabel = (bytes) => `${Math.ceil(bytes / 1024)} KB`;

/** Returns what is wrong with a chosen file in plain words, or '' when it can be attached. */
export function checkFeedbackAttachment(file) {
  if (!file) return '';
  if (!FEEDBACK_ATTACHMENT_TYPES.includes(file.type)) {
    return `"${file.name}" cannot be attached. Choose a PNG, JPEG or PDF file.`;
  }
  if (file.size < 1) return `"${file.name}" is empty. Choose a file with content.`;
  if (file.size > MAX_FEEDBACK_ATTACHMENT_BYTES) {
    return `"${file.name}" is ${sizeLabel(file.size)}. The limit is ${sizeLabel(MAX_FEEDBACK_ATTACHMENT_BYTES)}; crop or compress it and choose it again.`;
  }
  return '';
}

export async function encodeFeedbackAttachment(file) {
  if (!file) return null;
  const problem = checkFeedbackAttachment(file);
  if (problem) throw new Error(problem);
  const bytes = new Uint8Array(await file.arrayBuffer());
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return { base64: btoa(binary), contentType: file.type };
}
