import { describe, it, expect } from 'vitest';
import {
  resolveSpokenQuery,
  prepareSpokenSummary,
  CivicVoiceSpeaker
} from './voiceCivicAssistantService';

describe('voiceCivicAssistantService - Speech & Phonetic Mapping', () => {
  it('resolves vernacular phonetic phrase "aay praman" to Income Certificate', () => {
    const res = resolveSpokenQuery('aay praman');
    expect(res.targetServiceId).toBe('income-certificate');
    expect(res.canonicalName).toBe('Income Certificate');
  });

  it('resolves vernacular phrase "rashan card" to Ration Card', () => {
    const res = resolveSpokenQuery('mujhe rashan card banwana hai');
    expect(res.targetServiceId).toBe('ration-card');
  });

  it('falls back to raw text for unknown phrases', () => {
    const res = resolveSpokenQuery('xyz arbitrary service');
    expect(res.targetServiceId).toBeNull();
    expect(res.canonicalName).toBe('xyz arbitrary service');
  });

  it('prepares clear spoken summary for screen readers & audio synthesis', () => {
    const service = {
      name: 'Driving License',
      department: 'Transport Department',
      fees: 200,
      processingTime: '15 working days'
    };

    const text = prepareSpokenSummary(service);
    expect(text).toContain('Driving License');
    expect(text).toContain('Transport Department');
    expect(text).toContain('statutory fee of ₹200');
    expect(text).toContain('15 working days');
  });
});
