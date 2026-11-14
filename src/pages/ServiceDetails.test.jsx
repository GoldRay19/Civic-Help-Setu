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

  it('renders the dedicated Small-Business Licence Renewal & Closure Centre entry card (#721)', () => {
    const html = render('/services/business-licence-checklist');
    expect(html).toContain('Small-Business Licence Renewal &amp; Closure Checklist Centre');
    expect(html).toContain('Interactive Small-Business Licence Renewal &amp; Closure Checklist Centre');
    expect(html).toContain('Open Interactive Centre');
    expect(html).toContain('/services/business-licence-checklist');
  });
});
