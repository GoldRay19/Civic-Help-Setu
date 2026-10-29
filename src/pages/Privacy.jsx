import React, { useState, useEffect } from 'react';
import { Shield, Lock, Download, Trash2, CheckCircle2, Sliders, History, FileCheck } from 'lucide-react';
import {
  CONSENT_CATEGORIES,
  getConsentPreferences,
  exportUserData,
  getPrivacyAuditLogs,
} from '../services/privacyConsentService.js';
import PrivacyConsentCenterModal from '../components/privacy/PrivacyConsentCenterModal';
import ClearMyDataPanel from '../components/privacy/ClearMyDataPanel';
import { useToast } from '../context/ToastContext';

const Privacy = () => {
  const { toast } = useToast?.() || {};
  const [isCenterOpen, setIsCenterOpen] = useState(false);
  const [preferences, setPreferences] = useState(() => getConsentPreferences());
  const [logsCount, setLogsCount] = useState(() => getPrivacyAuditLogs().length);

  useEffect(() => {
    setPreferences(getConsentPreferences());
    setLogsCount(getPrivacyAuditLogs().length);
  }, [isCenterOpen]);

  const handleQuickExport = () => {
    try {
      const data = exportUserData();
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(data, null, 2)
      )}`;
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', jsonString);
      downloadAnchor.setAttribute(
        'download',
        `civicbridge_user_data_export_${new Date().toISOString().slice(0, 10)}.json`
      );
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      toast?.success?.('Personal data exported successfully.');
    } catch (err) {
      toast?.error?.(`Export failed: ${err.message}`);
    }
  };

  return (
    <div className="container max-w-4xl pt-12 pb-24 animate-fade-in" style={{ padding: '3rem 1.5rem' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: 'var(--accent-main, #38bdf8)',
            fontSize: '0.875rem',
            fontWeight: '700',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            marginBottom: '0.5rem',
          }}
        >
          <Shield size={18} /> DPDP Act 2023 & GDPR Compliant
        </div>
        <h1 style={{ fontSize: 'clamp(2.25rem, 5vw, 3.25rem)', fontWeight: '800', marginBottom: '0.75rem' }}>
          Privacy & Consent Management Center
        </h1>
        <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary, #94a3b8)', maxWidth: '650px', margin: '0 auto' }}>
          Civic-Help-Setu enforces strict client-side encryption, granular consent controls, and complete data portability.
        </p>
      </div>

      {/* Interactive Privacy Action Hub */}
      <div
        style={{
          padding: '1.75rem',
          borderRadius: '1rem',
          background: 'var(--bg-card, #121212)',
          border: '1px solid var(--border-main, rgba(255, 255, 255, 0.15))',
          boxShadow: 'var(--shadow-md, 0 12px 32px rgba(0,0,0,0.6))',
          marginBottom: '3rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ margin: '0 0 0.25rem', fontSize: '1.25rem', fontWeight: '800' }}>
              Your Enforced Privacy Settings
            </h2>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary, #cbd5e1)' }}>
              Manage opt-in consent categories, download your JSON dossier, or inspect immutable audit logs.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setIsCenterOpen(true)}
              className="btn btn-primary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.55rem 1.25rem',
                fontSize: '0.875rem',
                fontWeight: '700',
              }}
            >
              <Sliders size={16} />
              <span>Manage Consent Preferences</span>
            </button>

            <button
              type="button"
              onClick={handleQuickExport}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.55rem 1.25rem',
                fontSize: '0.875rem',
                fontWeight: '700',
                borderRadius: '0.5rem',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid var(--border-light, rgba(255, 255, 255, 0.15))',
                color: 'var(--text-primary, #ffffff)',
                cursor: 'pointer',
              }}
            >
              <Download size={16} />
              <span>Export My Data</span>
            </button>
          </div>
        </div>

        {/* Live Summary Chips */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '0.75rem',
            paddingTop: '0.75rem',
            borderTop: '1px solid var(--border-light, rgba(255, 255, 255, 0.08))',
          }}
        >
          {Object.values(CONSENT_CATEGORIES).map((cat) => {
            const isGranted = !!preferences[cat.id];
            return (
              <div
                key={cat.id}
                style={{
                  padding: '0.625rem 0.875rem',
                  borderRadius: '0.5rem',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-light, rgba(255, 255, 255, 0.08))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '0.8rem',
                }}
              >
                <span style={{ fontWeight: '600', color: 'var(--text-secondary, #cbd5e1)' }}>
                  {cat.title.split(' ')[0]} {cat.title.split(' ')[1]}
                </span>
                <span
                  style={{
                    fontWeight: '800',
                    fontSize: '0.75rem',
                    color: isGranted ? '#4ade80' : 'var(--text-muted, #94a3b8)',
                  }}
                >
                  {isGranted ? 'Active' : 'Disabled'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ marginBottom: '3rem' }}>
        <ClearMyDataPanel />
      </div>

      {/* Statutory Privacy Policy Details */}
      <div className="prose prose-slate" style={{ lineHeight: '1.7', color: 'var(--text-secondary, #cbd5e1)' }}>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted, #94a3b8)' }}>
          Last updated: {new Date().toLocaleDateString()} &bull; Statutory Authority: Digital Personal Data Protection Act, 2023 (India)
        </p>

        <h2 style={{ fontSize: '1.35rem', fontWeight: '800', color: 'var(--text-primary, #ffffff)', marginTop: '2rem' }}>
          1. Principles of Data Minimization & Client-Side Privacy
        </h2>
        <p>
          Civic-Help-Setu operates under a strict principle of <strong>Zero-Knowledge Civic Tech</strong>. Core services do not require you to create an account, register your Aadhaar or PAN number, or upload unencrypted documents to centralized cloud servers. All personal notes, saved service bookmarks, and document metadata remain stored exclusively within your local browser sandbox via encrypted web storage.
        </p>

        <h2 style={{ fontSize: '1.35rem', fontWeight: '800', color: 'var(--text-primary, #ffffff)', marginTop: '2rem' }}>
          2. Enforceable Consent Architecture
        </h2>
        <p>
          Under our privacy center, each category of data processing is isolated:
        </p>
        <ul>
          <li><strong>Strictly Necessary Storage:</strong> Ensures persistent dark mode, chosen language locale, and UI security tokens.</li>
          <li><strong>Explainable Personalization:</strong> Evaluates your goal inputs and held documents to compute service relevance scores without leaking identity.</li>
          <li><strong>Offline Cache Resilience:</strong> Caches official roadmaps and application stages so you can access government guidance during network outages.</li>
          <li><strong>Assistant Conversational Memory:</strong> Local session memory for AI chat queries that can be purged with a single click.</li>
        </ul>

        <h2 style={{ fontSize: '1.35rem', fontWeight: '800', color: 'var(--text-primary, #ffffff)', marginTop: '2rem' }}>
          3. Right to Data Portability & Complete Erasure
        </h2>
        <p>
          You retain unencumbered ownership of all records created within Civic-Help-Setu. At any time, you may export your complete civic dossier as an interoperable JSON package or trigger an irreversible cascading account purge that deletes every stored key across your device.
        </p>
      </div>

      {/* Modal */}
      <PrivacyConsentCenterModal
        isOpen={isCenterOpen}
        onClose={() => setIsCenterOpen(false)}
      />
    </div>
  );
};

export default Privacy;
