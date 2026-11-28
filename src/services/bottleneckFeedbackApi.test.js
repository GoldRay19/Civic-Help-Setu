import { describe, it, expect } from 'vitest';
import {
  checkFeedbackAttachment,
  encodeFeedbackAttachment,
  MAX_FEEDBACK_ATTACHMENT_BYTES,
} from './bottleneckFeedbackApi.js';

const file = (type, size, name = 'screen.png') => ({
  name,
  type,
  size,
  arrayBuffer: async () => new Uint8Array(size).buffer,
});

describe('feedback attachment checks', () => {
  it('accepts allowed types up to the limit, and no file at all', () => {
    expect(checkFeedbackAttachment(null)).toBe('');
    expect(checkFeedbackAttachment(file('image/png', 1))).toBe('');
    expect(checkFeedbackAttachment(file('application/pdf', MAX_FEEDBACK_ATTACHMENT_BYTES))).toBe('');
  });

  it('explains a wrong type, an empty file and an oversized file', () => {
    expect(checkFeedbackAttachment(file('image/svg+xml', 10, 'a.svg'))).toMatch(/PNG, JPEG or PDF/);
    expect(checkFeedbackAttachment(file('image/png', 0))).toMatch(/is empty/);
    expect(checkFeedbackAttachment(file('image/png', MAX_FEEDBACK_ATTACHMENT_BYTES + 1))).toMatch(
      /is 257 KB\. The limit is 256 KB/
    );
  });

  it('refuses to encode a file that fails the check', async () => {
    await expect(encodeFeedbackAttachment(file('text/html', 5, 'x.html'))).rejects.toThrow(/cannot be attached/);
    await expect(encodeFeedbackAttachment(file('image/png', 3))).resolves.toEqual({
      base64: 'AAAA',
      contentType: 'image/png',
    });
  });
});
