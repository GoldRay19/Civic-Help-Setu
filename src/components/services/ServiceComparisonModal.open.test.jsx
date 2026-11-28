// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import ServiceComparisonModal from './ServiceComparisonModal';
import { services } from '../../data/services';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let root;
let host;

afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
});

describe('ServiceComparisonModal opening', () => {
  it('can go from closed to open and back, showing the document comparison', async () => {
    host = document.createElement('div');
    document.body.append(host);
    root = createRoot(host);
    const render = (isOpen) =>
      act(async () =>
        root.render(
          <MemoryRouter>
            <ServiceComparisonModal
              isOpen={isOpen}
              onClose={() => {}}
              comparedServices={services.slice(0, 2)}
              onRemove={() => {}}
              onClear={() => {}}
            />
          </MemoryRouter>
        )
      );

    await render(false);
    await render(true);
    expect(document.body.textContent).toContain('Documents side by side');
    await render(false);
    expect(document.body.textContent).not.toContain('Documents side by side');
  });
});
