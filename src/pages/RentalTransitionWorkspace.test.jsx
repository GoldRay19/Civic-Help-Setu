import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import RentalTransitionWorkspace from './RentalTransitionWorkspace';
import { ToastProvider } from '../context/ToastContext';

describe('RentalTransitionWorkspace Page (#726)', () => {
  it('renders page header, ethical guardrail banner, and filters', () => {
    const html = renderToStaticMarkup(
      <ToastProvider>
        <RentalTransitionWorkspace />
      </ToastProvider>
    );

    expect(html).toContain('Rental Move-In &amp; Move-Out Civic Records Checklist');
    expect(html).toContain('Neutral Civic Transition Scope:');
    expect(html).toContain('Search &amp; Rental Transition Filters');
    expect(html).toContain('BESCOM Initial Electricity Meter Reading &amp; Consumer Mapping');
  });

  it('renders move-in and move-out occupancy stage toggles', () => {
    const html = renderToStaticMarkup(
      <ToastProvider>
        <RentalTransitionWorkspace />
      </ToastProvider>
    );

    expect(html).toContain('Move-In (Occupancy Start)');
    expect(html).toContain('Move-Out (Occupancy Handover)');
    expect(html).toContain('All Workflows');
  });

  it('renders meter reading highlights and authority names', () => {
    const html = renderToStaticMarkup(
      <ToastProvider>
        <RentalTransitionWorkspace />
      </ToastProvider>
    );

    expect(html).toContain('Bangalore Electricity Supply Company Limited (BESCOM)');
    expect(html).toContain('ELECTRICITY Meter Reading (kWh)');
    expect(html).toContain('Official Guide');
    expect(html).toContain('Checklist');
  });
});

