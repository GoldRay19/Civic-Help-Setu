import { useState, useEffect, useCallback } from 'react';
import { List, X, ChevronRight } from 'lucide-react';

/**
 * Responsive in-page table-of-contents for ServiceDetails.
 *
 * On wider viewports it renders as a compact sidebar-style list.
 * On narrow screens it collapses behind a floating button that
 * opens an overlay drawer — the drawer never covers the main
 * content when closed and scrolls independently when open.
 */
const ServiceSectionNav = ({ sections = [] }) => {
  const [activeId, setActiveId] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);

  // ── Intersection-based scroll spy ──
  useEffect(() => {
    if (sections.length === 0) return undefined;

    const handleIntersect = (entries) => {
      // Pick the first visible entry (top-most in the viewport).
      const visible = entries
        .filter((e) => e.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

      if (visible.length > 0) {
        setActiveId(visible[0].target.id);
      }
    };

    const observer = new IntersectionObserver(handleIntersect, {
      rootMargin: '-80px 0px -60% 0px',
      threshold: 0,
    });

    sections.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [sections]);

  const scrollTo = useCallback(
    (id) => {
      const el = document.getElementById(id);
      if (!el) return;

      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      el.focus({ preventScroll: true });
      setMobileOpen(false);
    },
    [],
  );

  if (sections.length === 0) return null;

  const linkList = (
    <ul
      className="section-nav__list"
      role="list"
      aria-label="Page sections"
    >
      {sections.map(({ id, label }) => {
        const isActive = id === activeId;
        return (
          <li key={id}>
            <a
              href={`#${id}`}
              className={`section-nav__link${isActive ? ' section-nav__link--active' : ''}`}
              aria-current={isActive ? 'true' : undefined}
              onClick={(e) => {
                e.preventDefault();
                scrollTo(id);
              }}
            >
              <ChevronRight
                size={14}
                className="section-nav__chevron"
                aria-hidden="true"
              />
              {label}
            </a>
          </li>
        );
      })}
    </ul>
  );

  return (
    <>
      {/* ── Desktop / tablet: inline nav ── */}
      <nav
        aria-label="On this page"
        className="section-nav section-nav--desktop"
      >
        <p className="section-nav__heading">On this page</p>
        {linkList}
      </nav>

      {/* ── Mobile: floating button + overlay ── */}
      <button
        type="button"
        className="section-nav__fab"
        aria-label="Open section navigation"
        aria-expanded={mobileOpen}
        onClick={() => setMobileOpen(true)}
      >
        <List size={20} />
      </button>

      {mobileOpen && (
        <div
          className="section-nav__overlay"
          onClick={() => setMobileOpen(false)}
        >
          <nav
            aria-label="On this page"
            className="section-nav section-nav--mobile"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="section-nav__mobile-header">
              <p className="section-nav__heading">On this page</p>
              <button
                type="button"
                className="section-nav__close"
                aria-label="Close section navigation"
                onClick={() => setMobileOpen(false)}
              >
                <X size={18} />
              </button>
            </div>
            {linkList}
          </nav>
        </div>
      )}
    </>
  );
};

export default ServiceSectionNav;
