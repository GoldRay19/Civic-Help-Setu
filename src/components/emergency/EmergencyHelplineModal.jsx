import React, { useState } from 'react';
import { X, PhoneCall, Copy, Check, Search, ShieldAlert, AlertCircle, Clock } from 'lucide-react';
import { helplineService } from '../../services/helplineService';

const EmergencyHelplineModal = ({ isOpen, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [copiedId, setCopiedId] = useState(null);

  if (!isOpen) return null;

  const categories = helplineService.getCategories();
  const filtered = helplineService.filterHelplines({
    query: searchQuery,
    category: selectedCategory
  });

  const handleCopy = (id, number) => {
    navigator.clipboard.writeText(number);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(8px)',
        zIndex: 1200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="sos-modal-title"
    >
      <div
        className="card-glass animate-fade-in"
        style={{
          width: '100%',
          maxWidth: '740px',
          maxHeight: '90vh',
          borderRadius: '1.25rem',
          background: 'var(--bg-main)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(239, 68, 68, 0.25)',
          position:'relative',
          top:'20rem'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.75rem',
            borderBottom: '1px solid var(--border-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(239, 68, 68, 0.08)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '2.5rem',
                height: '2.5rem',
                borderRadius: '0.75rem',
                background: '#ef4444',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <ShieldAlert size={22} />
            </div>
            <div>
              <h2 id="sos-modal-title" style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-primary)' }}>
                Citizen Emergency SOS & Rapid Helplines
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Verified 24x7 Government Emergency Call Centers & Distress Response
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              padding: '0.5rem'
            }}
          >
            <X size={22} />
          </button>
        </div>

        {/* Search & Category Filter */}
        <div style={{ padding: '1rem 1.75rem', background: 'var(--glass-bg)', borderBottom: '1px solid var(--border-light)' }}>
          <div style={{ position: 'relative', marginBottom: '0.75rem' }}>
            <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search helpline name, emergency type, or dial code (e.g. 112, cyber, ambulance)..."
              style={{
                width: '100%',
                padding: '0.65rem 0.85rem 0.65rem 2.4rem',
                borderRadius: '0.65rem',
                background: 'var(--glass-bg-subtle)',
                border: '1px solid var(--border-light)',
                color: 'var(--text-primary)',
                fontSize: '0.875rem'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.4rem', overflowX: 'auto', paddingBottom: '0.2rem' }}>
            {categories.map(cat => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    padding: '0.3rem 0.75rem',
                    borderRadius: '999px',
                    border: isSelected ? '1px solid #ef4444' : '1px solid var(--border-light)',
                    background: isSelected ? '#ef4444' : 'var(--glass-bg-subtle)',
                    color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Helplines List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem 1.75rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-secondary)' }}>
              <AlertCircle size={36} style={{ margin: '0 auto 0.5rem auto', opacity: 0.5 }} />
              <p>No emergency helpline matched your search.</p>
              <p style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>For immediate life-threatening assistance, call <strong>112</strong>.</p>
            </div>
          ) : (
            filtered.map((item) => {
              const isCopied = copiedId === item.id;
              return (
                <div
                  key={item.id}
                  style={{
                    padding: '1rem 1.25rem',
                    background: 'var(--glass-bg)',
                    borderRadius: '0.85rem',
                    border: '1px solid var(--border-light)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '1rem'
                  }}
                >
                  <div style={{ flex: '1 1 300px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <span
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: '700',
                          textTransform: 'uppercase',
                          padding: '0.15rem 0.5rem',
                          borderRadius: '999px',
                          background: `${item.badgeColor}22`,
                          color: item.badgeColor
                        }}
                      >
                        {item.category}
                      </span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        <Clock size={12} />
                        {item.timing}
                      </span>
                    </div>

                    <h3 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
                      {item.name}
                    </h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                      {item.description}
                    </p>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <div
                      style={{
                        padding: '0.45rem 0.85rem',
                        background: 'rgba(239, 68, 68, 0.12)',
                        border: '1px solid rgba(239, 68, 68, 0.25)',
                        borderRadius: '0.65rem',
                        fontSize: '1.15rem',
                        fontWeight: '800',
                        color: '#ef4444',
                        fontFamily: 'monospace'
                      }}
                    >
                      {item.number}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopy(item.id, item.number)}
                      style={{
                        padding: '0.5rem',
                        background: 'var(--glass-bg-subtle)',
                        border: '1px solid var(--border-light)',
                        borderRadius: '0.5rem',
                        color: isCopied ? 'var(--success, #10b981)' : 'var(--text-secondary)',
                        cursor: 'pointer'
                      }}
                      title="Copy number"
                    >
                      {isCopied ? <Check size={16} /> : <Copy size={16} />}
                    </button>

                    <a
                      href={helplineService.getDialUrl(item.number)}
                      className="btn"
                      style={{
                        padding: '0.5rem 1rem',
                        background: '#ef4444',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        borderRadius: '0.5rem',
                        fontWeight: '700',
                        fontSize: '0.85rem',
                        textDecoration: 'none'
                      }}
                    >
                      <PhoneCall size={15} />
                      <span>Dial Now</span>
                    </a>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default EmergencyHelplineModal;
