import { VOICE_SEARCH_ALIASES } from '../data/voiceSearchAliases';

/**
 * Phonetically resolves a spoken transcript to canonical service names
 */
export function resolveSpokenQuery(transcript = '') {
  if (!transcript || typeof transcript !== 'string') return null;

  const clean = transcript.trim().toLowerCase();

  for (const item of VOICE_SEARCH_ALIASES) {
    if (item.canonicalName.toLowerCase() === clean) {
      return item;
    }
    for (const phrase of item.spokenPhrases) {
      if (clean.includes(phrase) || phrase.includes(clean)) {
        return item;
      }
    }
  }

  return {
    targetServiceId: null,
    canonicalName: transcript,
    spokenPhrases: []
  };
}

/**
 * Prepares clean speech synthesis utterance text
 */
export function prepareSpokenSummary(service = {}) {
  const name = service.name || 'Civic Service';
  const dept = service.department || 'Government of India';
  const fee = service.fees !== undefined ? (service.fees === 0 ? 'free of statutory fees' : `statutory fee of ₹${service.fees}`) : 'standard fee';
  const time = service.processingTime || 'standard statutory processing time';

  return `Service details for ${name}. Administered by ${dept}. The estimated processing time is ${time}, with a ${fee}. Please prepare your Aadhaar card and identity documents before submitting your application.`;
}

/**
 * Web Speech Synthesis Controller
 */
export class CivicVoiceSpeaker {
  constructor() {
    this.synth = typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null;
    this.currentUtterance = null;
    this.isSpeaking = false;
  }

  speak(text, onEnd) {
    if (!this.synth) {
      console.warn('Speech synthesis not supported in this environment');
      if (onEnd) onEnd();
      return;
    }

    this.stop();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-IN';
    utterance.rate = 0.95; // Slightly slower for clarity
    utterance.pitch = 1.0;

    utterance.onend = () => {
      this.isSpeaking = false;
      if (onEnd) onEnd();
    };

    utterance.onerror = () => {
      this.isSpeaking = false;
      if (onEnd) onEnd();
    };

    this.currentUtterance = utterance;
    this.isSpeaking = true;
    this.synth.speak(utterance);
  }

  pause() {
    if (this.synth && this.synth.speaking) {
      this.synth.pause();
    }
  }

  resume() {
    if (this.synth && this.synth.paused) {
      this.synth.resume();
    }
  }

  stop() {
    if (this.synth) {
      this.synth.cancel();
      this.isSpeaking = false;
    }
  }
}

export const civicVoiceSpeaker = new CivicVoiceSpeaker();
