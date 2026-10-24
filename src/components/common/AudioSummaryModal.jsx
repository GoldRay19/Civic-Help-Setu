import { useState, useEffect } from 'react';
import { X, Volume2, Square, Play, Pause, RotateCcw, Sparkles } from 'lucide-react';
import { useModalKeyboard } from '../../hooks/useModalKeyboard';
import { civicVoiceSpeaker, prepareSpokenSummary } from '../../services/voiceCivicAssistantService';

export default function AudioSummaryModal({ isOpen, onClose, service }) {
  const modalRef = useModalKeyboard(isOpen, onClose);
  const [isPlaying, setIsPlaying] = useState(false);

  const textToRead = service ? prepareSpokenSummary(service) : 'Welcome to Civic Help Setu voice reader.';

  useEffect(() => {
    return () => {
      civicVoiceSpeaker.stop();
    };
  }, []);

  if (!isOpen) return null;

  const handlePlay = () => {
    setIsPlaying(true);
    civicVoiceSpeaker.speak(textToRead, () => {
      setIsPlaying(false);
    });
  };

  const handleStop = () => {
    civicVoiceSpeaker.stop();
    setIsPlaying(false);
  };

  const handleClose = () => {
    civicVoiceSpeaker.stop();
    setIsPlaying(false);
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.55)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '16px'
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="audio-modal-title"
      onClick={handleClose}
    >
      <div
        ref={modalRef}
        style={{
          background: 'var(--card-bg, #ffffff)',
          color: 'var(--text-color, #1e293b)',
          borderRadius: '14px',
          width: '100%',
          maxWidth: '540px',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15)',
          padding: '24px'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Volume2 color="#2563eb" size={24} />
            <h2 id="audio-modal-title" style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>
              Voice Reader & Audio Assistant
            </h2>
          </div>
          <button
            onClick={handleClose}
            aria-label="Close modal"
            style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '4px' }}
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '16px', lineHeight: 1.6, fontSize: '0.9rem', color: '#1e293b' }}>
          {textToRead}
        </div>

        {/* Audio controls */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', alignItems: 'center', marginBottom: '16px' }}>
          {!isPlaying ? (
            <button
              type="button"
              onClick={handlePlay}
              style={{
                padding: '10px 20px',
                borderRadius: '99px',
                background: '#2563eb',
                color: '#ffffff',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Play size={16} fill="currentColor" />
              <span>Read Aloud</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleStop}
              style={{
                padding: '10px 20px',
                borderRadius: '99px',
                background: '#dc2626',
                color: '#ffffff',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Square size={16} fill="currentColor" />
              <span>Stop Reading</span>
            </button>
          )}
        </div>

        <div style={{ textAlign: 'center', fontSize: '0.76rem', color: '#64748b' }}>
          Uses standard Indian English (en-IN) synthetic speech designed for accessible civic consultation.
        </div>
      </div>
    </div>
  );
}
