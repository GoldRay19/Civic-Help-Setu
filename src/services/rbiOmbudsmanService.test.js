import { describe, it, expect } from 'vitest';
import {
  calculateZeroLiability,
  calculateTatCompensation,
  generatePnoComplaintLetter,
  generateRbiOmbudsmanPetition,
  sanitizeBankingCase,
  RBI_LEGAL_DISCLAIMER,
} from './rbiOmbudsmanService.js';

describe('rbiOmbudsmanService (#1341)', () => {
  it('calculates Zero Customer Liability when reported within 3 working days', () => {
    const result = calculateZeroLiability({
      reportingDays: 2,
      transactionAmount: 45000,
      accountType: 'SAVINGS_CURRENT',
    });

    expect(result.liabilityTier).toBe('ZERO_CUSTOMER_LIABILITY');
    expect(result.customerLiability).toBe(0);
    expect(result.bankLiability).toBe(45000);
    expect(result.claimableRefund).toBe(45000);
    expect(result.shadowCreditMandatory).toBe(true);
    expect(result.shadowCreditDays).toBe(10);
  });

  it('caps customer liability for reports made between 4 to 7 working days', () => {
    // BSBD Account: capped at ₹5,000
    const bsbd = calculateZeroLiability({
      reportingDays: 5,
      transactionAmount: 20000,
      accountType: 'BSBD',
    });
    expect(bsbd.liabilityTier).toBe('LIMITED_CUSTOMER_LIABILITY');
    expect(bsbd.customerLiability).toBe(5000);
    expect(bsbd.bankLiability).toBe(15000);

    // Savings Account: capped at ₹10,000
    const savings = calculateZeroLiability({
      reportingDays: 6,
      transactionAmount: 50000,
      accountType: 'SAVINGS_CURRENT',
    });
    expect(savings.customerLiability).toBe(10000);
    expect(savings.bankLiability).toBe(40000);

    // Credit Card > 5L: capped at ₹25,000
    const card = calculateZeroLiability({
      reportingDays: 4,
      transactionAmount: 100000,
      accountType: 'CREDIT_CARD_ABOVE_5L',
    });
    expect(card.customerLiability).toBe(25000);
    expect(card.bankLiability).toBe(75000);
  });

  it('calculates statutory TAT delay penalty of ₹100/day for failed ATM withdrawals', () => {
    // 15 days elapsed, allowable TAT is 5 days -> 10 days delay * 100 = 1000
    const comp = calculateTatCompensation({
      channelId: 'ATM_CASH_FAILED',
      transactionDate: '2026-02-01',
      resolutionDate: '2026-02-16',
      transactionAmount: 10000,
    });

    expect(comp.allowableTatDays).toBe(5);
    expect(comp.delayDays).toBe(10);
    expect(comp.statutoryCompensation).toBe(1000);
    expect(comp.totalAmountPayable).toBe(11000);
    expect(comp.isDelayed).toBe(true);
  });

  it('calculates statutory delay compensation of ₹5,000/day for delayed property documents', () => {
    // 40 days elapsed, allowable TAT is 30 days -> 10 days delay * 5000 = 50000
    const comp = calculateTatCompensation({
      channelId: 'PROPERTY_DOCS_DELAYED',
      transactionDate: '2026-01-01',
      resolutionDate: '2026-02-10',
      transactionAmount: 0,
    });

    expect(comp.allowableTatDays).toBe(30);
    expect(comp.delayDays).toBe(10);
    expect(comp.penaltyRatePerDay).toBe(5000);
    expect(comp.statutoryCompensation).toBe(50000);
  });

  it('drafts formal representation to Bank Principal Nodal Officer (PNO) with 30-day notice', () => {
    const letter = generatePnoComplaintLetter({
      complainantName: 'Ananya Sengupta',
      complainantContact: 'ananya@example.com / 9830012345',
      complainantAddress: 'Salt Lake, Kolkata',
      bankName: 'Apex Commercial Bank',
      branchName: 'City Centre Branch',
      accountNumber: '918020048123',
      disputeType: 'UNAUTHORIZED_DEBIT',
      transactionDate: '2026-02-12',
      transactionAmount: 48500,
      calculations: {
        claimableRefund: 48500,
        statutoryCompensation: 1000,
        delayDays: 10,
        penaltyRatePerDay: 100,
      },
      incidentDetails: 'Fraudulent UPI debit without OTP.',
    });

    expect(letter).toContain('THE PRINCIPAL NODAL OFFICER (PNO)');
    expect(letter).toContain('Ananya Sengupta');
    expect(letter).toContain('Apex Commercial Bank');
    expect(letter).toContain('₹48,500');
    expect(letter).toContain('₹1,000');
    expect(letter).toContain('thirty (30) days');
    expect(letter).toContain(RBI_LEGAL_DISCLAIMER);
  });

  it('drafts formal petition to RBI Ombudsman under Clause 11 of RB-IOS 2021', () => {
    const petition = generateRbiOmbudsmanPetition({
      complainantName: 'Ananya Sengupta',
      complainantContact: 'ananya@example.com',
      complainantAddress: 'Salt Lake, Kolkata',
      bankName: 'Apex Commercial Bank',
      branchName: 'City Centre Branch',
      accountNumber: '918020048123',
      pnoComplaintDate: '2026-02-15',
      pnoRefNumber: 'PNO-8812',
      transactionAmount: 48500,
      disputeDetails: 'Bank failed to provide shadow credit or investigate spoofed payment gateway.',
      calculations: {
        claimableRefund: 48500,
        statutoryCompensation: 1000,
      },
    });

    expect(petition).toContain('BEFORE THE RESERVE BANK - INTEGRATED OMBUDSMAN');
    expect(petition).toContain('RESERVE BANK - INTEGRATED OMBUDSMAN SCHEME, 2021');
    expect(petition).toContain('Ananya Sengupta');
    expect(petition).toContain('Clause 16');
    expect(petition).toContain('₹49,500');
    expect(petition).toContain(RBI_LEGAL_DISCLAIMER);
  });

  it('sanitizes bank account numbers and contact details under DPDP Act 2023', () => {
    const raw = {
      accountNumber: '918020048123',
      complainantContact: '9830012345 / user@bank.in',
    };

    const sanitized = sanitizeBankingCase(raw);
    expect(sanitized.accountNumber).toContain('XXXX-XXXX-8123');
    expect(sanitized.complainantContact).toContain('98XXXXXX45');
    expect(sanitized.complainantContact).toContain('u***@bank.in');
  });
});
