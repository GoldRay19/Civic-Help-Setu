import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import BiometricExceptionLoggerCard from './BiometricExceptionLoggerCard';

describe('BiometricExceptionLoggerCard', () => {
  it('renders biometric failure options and Food Security Allowance inputs', () => {
    const html = renderToStaticMarkup(<BiometricExceptionLoggerCard onLogBiometricException={vi.fn()} />);
    expect(html).toContain('Biometric Exception &amp; Food Security Allowance (Section 8)');
    expect(html).toContain('Biometric Failure Mode at e-PoS');
    expect(html).toContain('Fingerprint Sensor Failure / Fingerprint Attrition');
    expect(html).toContain('Section 8 &amp; 12');
  });

  it('renders Section 8 FSA calculation section and action button', () => {
    const html = renderToStaticMarkup(<BiometricExceptionLoggerCard onLogBiometricException={vi.fn()} />);
    expect(html).toContain('Section 8 Food Security Allowance (FSA) Calculation');
    expect(html).toContain('Log Biometric Incident &amp; FSA');
    expect(html).toContain('Total Statutory FSA');
  });
});
