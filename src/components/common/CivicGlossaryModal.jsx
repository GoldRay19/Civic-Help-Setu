import { useState } from 'react';
import { X, Search, BookOpen, ExternalLink, HelpCircle, Sparkles } from 'lucide-react';
import { CIVIC_GLOSSARY, searchGlossary } from '../../data/civicGlossary';
import { useLanguage } from '../../context/LanguageContext';

const CivicGlossaryModal = ({
  isOpen,
  onClose,
}) => {
  const { language } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const results = searchGlossary(searchTerm);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1100,
        padding: '1rem',
      }}
    >
      <div
        className="card animate-fade-in"
        style={{
          width: '100%',
          maxWidth: '650px',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '1.75rem',
          borderRadius: '1.25rem',
          background: 'var(--bg-main)',
          border: '1px solid var(--border-main)',
          top:'20rem',
          position:'relative'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <BookOpen size={22} color="var(--accent-main)" />
            <h3 style={{ fontSize: '1.35rem', fontWeight: '800', margin: 0 }}>
              Civic Jargon & Plain Language Dictionary
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-tertiary)',
              cursor: 'pointer',
              padding: '0.25rem',
            }}
          >
            <X size={20} />
          </button>
        </div>

        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
          Legal, municipal, and revenue terminologies explained in simple words so you can file applications with confidence.
        </p>

        {/* Search Input */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 0.85rem',
            borderRadius: '0.6rem',
            background: 'var(--glass-bg)',
            border: '1px solid var(--border-light)',
            marginBottom: '1.25rem',
          }}
        >
          <Search size={18} color="var(--text-tertiary)" />
          <input
            type="text"
            className="input-field"
            placeholder="Search jargon terms (e.g., affidavit, encumbrance, mutation, patta)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ border: 'none', background: 'transparent', padding: '0.2rem', width: '100%', outline: 'none' }}
          />
        </div>

        {/* Terms list */}
        <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem', paddingRight: '0.25rem' }}>
          {results.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-tertiary)' }}>
              No terms found matching "{searchTerm}".
            </div>
          ) : (
            results.map((item) => {
              let localizedMeaning = item.simpleMeaning;
              if (language === 'hi' && item.simpleMeaningHi) localizedMeaning = item.simpleMeaningHi;
              else if (language === 'bn' && item.simpleMeaningBn) localizedMeaning = item.simpleMeaningBn;
              else if (language === 'ta' && item.simpleMeaningTa) localizedMeaning = item.simpleMeaningTa;

              return (
                <div
                  key={item.id}
                  style={{
                    padding: '1rem',
                    borderRadius: '0.75rem',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border-light)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
                    <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '800', color: 'var(--text-primary)' }}>
                      {item.term}
                    </h4>
                    <span style={{ fontSize: '0.78rem', color: 'var(--accent-main)', fontWeight: '600' }}>
                      {language === 'hi' ? item.hiTerm : language === 'bn' ? item.bnTerm : language === 'ta' ? item.taTerm : item.hiTerm}
                    </span>
                  </div>

                  <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)', margin: '0 0 0.5rem', lineHeight: '1.5' }}>
                    <strong>In Simple Terms:</strong> {localizedMeaning}
                  </p>

                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                    <strong>When is it needed?</strong> {item.context}
                  </div>

                  {item.relatedServices && item.relatedServices.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>Related services:</span>
                      {item.relatedServices.map((srv, idx) => (
                        <span
                          key={idx}
                          style={{
                            fontSize: '0.7rem',
                            padding: '0.1rem 0.4rem',
                            borderRadius: '4px',
                            background: 'rgba(56, 189, 248, 0.1)',
                            color: 'var(--accent-main)',
                          }}
                        >
                          {srv}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default CivicGlossaryModal;
