import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import TrackingReceiptModal from './TrackingReceiptModal';

describe('TrackingReceiptModal component (#742)', () => {
  const sampleApp = {
    id: 'APP-TEST-99',
    serviceName: 'Aadhaar Address Update',
    applicantName: 'Sunita Sharma',
    appliedDate: '2026-10-20',
    estimatedCompletion: '2026-11-05',
    status: 'under-review',
    stages: [
      { step: 1, title: 'Application Submitted', completed: true },
      { step: 2, title: 'Biometric Verification', current: true },
    ],
  };

  it('exports a valid React functional component', () => {
    expect(typeof TrackingReceiptModal).toBe('function');
  });

  it('renders nothing when closed or when app is missing', () => {
    const htmlClosed = renderToStaticMarkup(
      <TrackingReceiptModal isOpen={false} app={null} onClose={() => {}} />
    );
    expect(htmlClosed).toBe('');

    const htmlNoApp = renderToStaticMarkup(
      <TrackingReceiptModal isOpen={true} app={null} onClose={() => {}} />
    );
    expect(htmlNoApp).toBe('');
  });

  it('renders official submission receipt with deterministic verification seal and actions', () => {
    const html = renderToStaticMarkup(
      <TrackingReceiptModal isOpen={true} app={sampleApp} onClose={() => {}} />
    );

    expect(html).toContain('role="dialog"');
    expect(html).toContain('Official Submission Receipt');
    expect(html).toContain('REC-APP-TEST-99');
    expect(html).toContain('Sunita Sharma');
    expect(html).toContain('Aadhaar Address Update');
    expect(html).toContain('CB-SEAL-');
    expect(html).toContain('Print Slip');
    expect(html).toContain('Download Slip');
    expect(html).toContain('Copy Text');
    expect(html).toContain('Download JSON');
  });

  it('renders scannable SVG QR code and SHA-256 cryptographic seal badge', () => {
    const html = renderToStaticMarkup(
      <TrackingReceiptModal isOpen={true} app={sampleApp} onClose={() => {}} />
    );

    expect(html).toContain('SHA-256 Sealed');
    expect(html).toContain('aria-label="Scannable receipt verification QR code"');
    expect(html).toContain('<svg');
    expect(html).toContain('<path d="M');
    expect(html).toContain('SCAN TO VERIFY');
  });

  it('renders accessible tab navigation controls for receipt slip and verification', () => {
    const html = renderToStaticMarkup(
      <TrackingReceiptModal isOpen={true} app={sampleApp} onClose={() => {}} />
    );

    expect(html).toContain('role="tablist"');
    expect(html).toContain('Receipt Slip');
    expect(html).toContain('Verify Authenticity');
    expect(html).toContain('aria-selected="true"');
    expect(html).toContain('aria-controls="panel-receipt"');
  });

  it('renders statutory charter notice and close button', () => {
    const html = renderToStaticMarkup(
      <TrackingReceiptModal isOpen={true} app={sampleApp} onClose={() => {}} />
    );

    expect(html).toContain('State Right to Public Services Charter');
    expect(html).toContain('aria-label="Close receipt"');
  });
});
