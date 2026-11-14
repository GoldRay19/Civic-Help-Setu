import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ServiceDetails from './ServiceDetails.jsx';
import { MOCK_SERVICES } from '../data/services';
import { LanguageProvider } from '../context/LanguageContext';

vi.mock('../context/AuthContext', () => ({ useAuth: () => ({ user: null }) }));
vi.mock('../context/ToastContext', () => ({ useToast: () => ({ toast: { success: vi.fn(), error: vi.fn() } }) }));

const render = (path) =>
  renderToStaticMarkup(
    <LanguageProvider>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/services/:id" element={<ServiceDetails />} />
        </Routes>
      </MemoryRouter>
    </LanguageProvider>
  );

describe('ServiceDetails', () => {
  it('renders a published guide, including the actions that open modals', () => {
    const service = MOCK_SERVICES[0];
    const html = render(`/services/${service.id}`);
    expect(html).toContain(service.name);
    expect(html).toContain('Report Access Barrier');
    expect(html).toContain('Print Visit Dossier');
    expect(html).toContain('Make checklist');
    expect(html).toContain('Preparation Plan');
    expect(html).toContain('Simplify this service');
  });

  it('says so when the guide does not exist', () => {
    expect(render('/services/no-such-guide')).toContain('Service not found');
  });

  it('renders the dedicated Aadhaar guide entry card when viewing the aadhaar-card service (#530)', () => {
    const html = render('/services/aadhaar-card');
    expect(html).toContain('Aadhaar Card Enrollment');
    expect(html).toContain('Dedicated Aadhaar Enrolment &amp; Demographic Update Guide');
    expect(html).toContain('Open Interactive Aadhaar Guide');
    expect(html).toContain('/services/aadhaar-guide');
  });

  it('renders the dedicated Fire NOC guide entry card when viewing the fire-noc service (#719)', () => {
    const html = render('/services/fire-noc');
    expect(html).toContain('Fire Safety Certificate / Fire NOC');
    expect(html).toContain('Dedicated Fire NOC &amp; Fire-Safety Compliance Preparation Guide');
    expect(html).toContain('Open Interactive Fire Guide');
    expect(html).toContain('/services/fire-noc-guide');
  });

  it('renders the dedicated Tree guide entry card when viewing the tree-pruning-permission service (#717)', () => {
    const html = render('/services/tree-pruning-permission');
    expect(html).toContain('Tree-Pruning Permission and Urban Tree Protection');
    expect(html).toContain('Dedicated Tree-Pruning Permission &amp; Urban Tree Protection Guide');
    expect(html).toContain('Open Interactive Tree Guide');
    expect(html).toContain('/services/tree-permission-guide');
  });
});
