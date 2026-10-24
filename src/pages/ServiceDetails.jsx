import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { MOCK_SERVICES } from '../data/services';
import Checklist from '../components/Checklist';
import SourceCard from '../components/SourceCard';
import EligibilityWizard from '../components/eligibility/EligibilityWizard';
import PrintableChecklistModal from '../components/services/PrintableChecklistModal';
import ShareServiceModal from '../components/services/ShareServiceModal';
import RatingSummaryCard from '../components/services/RatingSummaryCard';
import CitizenReviewsList from '../components/services/CitizenReviewsList';
import ReviewSubmissionModal from '../components/services/ReviewSubmissionModal';
import { reviewStorage } from '../services/reviewStorage';
import FeeBreakdownModal from '../components/services/FeeBreakdownModal';
import EstimatedTimelineWidget from '../components/services/EstimatedTimelineWidget';
import ConcessionEligibilityBadge from '../components/services/ConcessionEligibilityBadge';
import { ArrowLeft, Clock, CreditCard, AlertTriangle, Bookmark, Flag, Zap, CheckCircle2, X, MapPin, Compass, Printer, Share2, Star, Calculator, History } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { submitErrorReport } from '../services/adminService';
import { createApplication } from '../services/trackingService';
import { CIVIC_OFFICES } from '../data/locationOffices';
import CommonRejectionReasonsCard from '../components/services/CommonRejectionReasonsCard';
import ServiceFAQAccordion from '../components/services/ServiceFAQAccordion';
import ServiceChangelogModal from '../components/services/ServiceChangelogModal';

const ServiceDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();
  const [linkCopied, setLinkCopied] = useState(false);
  
  const [service, setService] = useState(() => MOCK_SERVICES.find(s => s.id === id) || null);
  const [isSaved, setIsSaved] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('civicbridge_saved') || '[]');
      return saved.some(s => s.id === id);
    } catch {
      return false;
    }
  });
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showFeeModal, setShowFeeModal] = useState(false);
  const [showChangelogModal, setShowChangelogModal] = useState(false);
  const [applyStep, setApplyStep] = useState(1); // 1: form, 2: success
  const [generatedAppId, setGeneratedAppId] = useState('');
  const [reportSubmitted, setReportSubmitted] = useState(false);
  const [reviews, setReviews] = useState(() => reviewStorage.getReviewsForService(id));
  const [reviewAggregate, setReviewAggregate] = useState(() => reviewStorage.getAggregate(id));
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  const refreshReviews = () => {
    setReviews(reviewStorage.getReviewsForService(id));
    setReviewAggregate(reviewStorage.getAggregate(id));
  };

  const handleReportInaccuracy = () => {
    if (!service) return;
    setShowReportModal(true);
  };
  const [applyForm, setApplyForm] = useState({ fullName: '', aadhaarNumber: '' });

  useEffect(() => {
    const found = MOCK_SERVICES.find(s => s.id === id);
    setService(found || null);
    try {
      const saved = JSON.parse(localStorage.getItem('civicbridge_saved') || '[]');
      setIsSaved(saved.some(s => s.id === id));
    } catch {
      setIsSaved(false);
    }
  }, [id]);

  const handleCopyLink = async () => {
    const ok = await copyServiceLink(getServiceUrl(id));
    if (ok) {
      toast.success('Service link copied to clipboard.');
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } else {
      toast.error('Could not copy the link. Please copy it from the address bar.');
    }
  };

  const toggleSave = () => {
    if (!service) return;
    let saved = JSON.parse(localStorage.getItem('civicbridge_saved') || '[]');
    if (isSaved) saved = saved.filter(s => s.id !== service.id);
    else saved.push({ id: service.id, name: service.name, category: service.category });
    localStorage.setItem('civicbridge_saved', JSON.stringify(saved));
    setIsSaved(!isSaved);
  };

  const handleApplySubmit = (e) => {
    e.preventDefault();
    const app = createApplication({
      serviceId: service.id,
      serviceName: service.name,
      category: service.category,
      applicantName: applyForm.fullName || user?.username || 'Citizen Applicant',
      aadhaarId: applyForm.aadhaarNumber,
    });
    setGeneratedAppId(app.id);
    setApplyStep(2);
  };

  if (!service) return (
    <div className="section container" style={{ textAlign: 'center' }}>
      <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Service not found</h2>
      <Link to="/services" className="btn btn-secondary">Return to directory</Link>
    </div>
  );

  return (
    <>
      <div className="section animate-fade-in" style={{ paddingBottom: '6rem' }}>
        <div className="container" style={{ maxWidth: '900px' }}>
          <div style={{ marginBottom: '2rem' }}>
            <Link to="/services" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontWeight: '500', transition: 'color 0.3s' }} onMouseOver={(e) => e.currentTarget.style.color = 'var(--text-primary)'} onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}>
              <ArrowLeft size={18} /> Back to Services
            </Link>
          </div>

          <div className="glass-panel" style={{ padding: '3rem', marginBottom: '3rem', position: 'relative', overflow: 'hidden' }}>
            {/* Background Glow */}
            <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: '50%', height: '50%', background: 'radial-gradient(circle, var(--accent-light) 0%, transparent 70%)', zIndex: 0, opacity: 0.5, pointerEvents: 'none' }}></div>
            
            <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: '2rem', marginBottom: '2rem' }}>
              <div style={{ flex: '1 1 400px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                  <span style={{ padding: '0.25rem 0.75rem', background: 'var(--accent-light)', color: 'var(--accent-main)', borderRadius: '99px', fontSize: '0.875rem', fontWeight: '600' }}>{service.category}</span>
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)', fontWeight: '500' }}>{service.type}</span>
                  <button
                    type="button"
                    onClick={() => setShowChangelogModal(true)}
                    style={{
                      padding: '0.2rem 0.65rem',
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid var(--border-light)',
                      borderRadius: '99px',
                      fontSize: '0.78rem',
                      color: 'var(--text-secondary)',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                    title="View official circulars and government order revisions"
                  >
                    <History size={13} />
                    <span>Circular History</span>
                  </button>
                </div>
                <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: '800', lineHeight: '1.2', marginBottom: '1rem' }}>{service.name}</h1>
                <p style={{ fontSize: '1.125rem', color: 'var(--text-secondary)', lineHeight: '1.6', maxWidth: '600px' }}>{service.shortDescription}</p>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flexShrink: 0 }}>
                <button 
                  onClick={() => user ? setShowApplyModal(true) : navigate('/login')}
                  className="btn btn-primary"
                  style={{ padding: '0.85rem 1.75rem', fontSize: '1.05rem', background: 'var(--accent-main)', color: 'var(--bg-main)' }}
                >
                  <Zap size={18} fill="currentColor" />
                  Fast-Track Apply
                </button>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <button 
                    onClick={toggleSave}
                    className="btn btn-secondary"
                    style={{ 
                      padding: '0.65rem',
                      fontSize: '0.875rem',
                      background: isSaved ? 'rgba(56, 189, 248, 0.1)' : 'var(--glass-bg)',
                      borderColor: isSaved ? 'var(--accent-main)' : 'var(--border-main)',
                      color: isSaved ? 'var(--accent-main)' : 'var(--text-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.35rem'
                    }}
                  >
                    <Bookmark size={16} fill={isSaved ? 'currentColor' : 'none'} />
                    {isSaved ? 'Saved' : 'Save'}
                  </button>
                  <button 
                    onClick={() => setShowShareModal(true)}
                    className="btn btn-secondary"
                    style={{ 
                      padding: '0.65rem',
                      fontSize: '0.875rem',
                      background: 'var(--glass-bg)',
                      color: 'var(--text-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.35rem'
                    }}
                    title="Share checklist with family or WhatsApp"
                  >
                    <Share2 size={16} color="var(--accent-main)" />
                    Share
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="btn btn-secondary"
                    aria-label="Copy link to this service page"
                    style={{
                      gridColumn: '1 / -1',
                      padding: '0.65rem',
                      fontSize: '0.875rem',
                      background: 'var(--glass-bg)',
                      color: 'var(--text-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.35rem'
                    }}
                  >
                    {linkCopied ? <Check size={16} color="var(--accent-main)" /> : <Link2 size={16} color="var(--accent-main)" />}
                    {linkCopied ? 'Copied' : 'Copy link'}
                  </button>
                  <span className="sr-only" role="status" aria-live="polite" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>
                    {linkCopied ? 'Link copied to clipboard' : ''}
                  </span>
                </div>
                <button
                  onClick={() => setShowPrintModal(true)}
                  className="btn btn-outline"
                  style={{
                    padding: '0.6rem 1rem',
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.45rem'
                  }}
                  title="Generate ink-friendly office visit dossier"
                >
                  <Printer size={16} />
                  <span>Print Visit Dossier</span>
                </button>
              </div>
            </div>

            <div className="grid-2" style={{ position: 'relative', zIndex: 1, marginBottom: '1.5rem' }}>
              <div style={{ background: 'var(--glass-bg-subtle)', border: '1px solid var(--border-light)', padding: '1.5rem', borderRadius: '1rem', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <CreditCard size={24} color="var(--accent-main)" />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                    <h4 style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Expected Fees</h4>
                    <button
                      type="button"
                      onClick={() => setShowFeeModal(true)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--accent-main)',
                        fontSize: '0.8rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        padding: 0
                      }}
                    >
                      <Calculator size={14} />
                      <span>Calculator</span>
                    </button>
                  </div>
                  <p style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>{service.fees}</p>
                  <ConcessionEligibilityBadge onOpenCalculator={() => setShowFeeModal(true)} />
                </div>
              </div>
              <div style={{ background: 'var(--glass-bg-subtle)', border: '1px solid var(--border-light)', padding: '1.5rem', borderRadius: '1rem', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <Clock size={24} color="var(--accent-main)" />
                <div>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Processing Time</h4>
                  <p style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--text-primary)' }}>{service.processingTime}</p>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Statutory citizen charter turnaround</span>
                </div>
              </div>
            </div>

            {/* Estimated Turnaround Milestones */}
            <div style={{ position: 'relative', zIndex: 1, marginBottom: '2.5rem' }}>
              <EstimatedTimelineWidget
                processingTime={service.processingTime}
                onOpenCalculator={() => setShowFeeModal(true)}
              />
            </div>

            {service.warnings && service.warnings.length > 0 && (
              <div style={{ position: 'relative', zIndex: 1, padding: '1.5rem', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)', borderRadius: '1rem', marginBottom: '2.5rem' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '700', color: '#fbbf24', marginBottom: '1rem', fontSize: '1.125rem' }}>
                  <AlertTriangle size={20} /> Important Notice
                </h3>
                <ul style={{ paddingLeft: '1.5rem', color: '#fcd34d', fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {service.warnings.map((warning, idx) => <li key={idx} style={{ listStyleType: 'disc' }}>{warning}</li>)}
                </ul>
              </div>
            )}

            <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: '4rem' }}>
              <section>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '1.5rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-main)' }}>Eligibility Criteria</h2>
                <EligibilityWizard
                  serviceId={service.id}
                  staticCriteria={service.eligibility}
                  onApplyClick={() => (user ? setShowApplyModal(true) : navigate('/login'))}
                />
              </section>

              <section>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '1.5rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-main)' }}>Required Documents</h2>
                <Checklist items={service.documents} />
              </section>

              <section>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '1.5rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-main)' }}>Steps</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {service.steps.map((step, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '1.5rem' }}>
                      <div style={{ width: '3rem', height: '3rem', flexShrink: 0, borderRadius: '50%', background: 'var(--glass-bg)', border: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '1.125rem', color: 'var(--text-secondary)' }}>
                        {String(idx + 1).padStart(2, '0')}
                      </div>
                      <div style={{ paddingTop: '0.25rem' }}>
                        <h3 style={{ fontWeight: '700', fontSize: '1.125rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>{step.title}</h3>
                        <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>{step.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Nearby Facilitation Centers */}
              <section>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-main)', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: '800', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <MapPin size={22} color="var(--accent-main)" /> Nearby Facilitation Centers
                  </h2>
                  <Link
                    to={`/nearby?service=${service.id}`}
                    className="btn btn-secondary"
                    style={{ fontSize: '0.85rem', padding: '0.4rem 0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                  >
                    <Compass size={15} /> Find Centers on Interactive Map
                  </Link>
                </div>

                {(() => {
                  const matchingOffices = CIVIC_OFFICES.filter(o => o.serviceIds?.includes(service.id)).slice(0, 3);
                  if (matchingOffices.length === 0) {
                    return (
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        Multiple district magistrate, municipal, and e-Seva centers provide this service. Use our location-aware directory to locate the nearest center to your pin code.
                      </p>
                    );
                  }
                  return (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
                      {matchingOffices.map((office) => (
                        <div
                          key={office.id}
                          className="glass-panel"
                          style={{
                            padding: '1.1rem',
                            borderRadius: '0.75rem',
                            border: '1px solid var(--border-light)',
                            background: 'rgba(0, 0, 0, 0.1)',
                          }}
                        >
                          <span style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--accent-main)', textTransform: 'uppercase' }}>
                            {office.type}
                          </span>
                          <h4 style={{ fontSize: '1rem', fontWeight: '700', margin: '0.25rem 0', color: 'var(--text-primary)' }}>
                            {office.name}
                          </h4>
                          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.6rem' }}>
                            {office.city}, {office.state} • {office.officeHours?.hours}
                          </p>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <a
                              href={office.directionsUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-secondary"
                              style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', flex: 1, textAlign: 'center' }}
                            >
                              Directions
                            </a>
                            <Link
                              to={`/nearby?service=${service.id}`}
                              className="btn btn-primary"
                              style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', flex: 1, textAlign: 'center' }}
                            >
                              Book Token
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </section>

              {/* Application Rejection Prevention Guide */}
              <section>
                <CommonRejectionReasonsCard 
                  serviceId={service.id}
                  serviceCategory={service.category}
                  serviceName={service.name}
                />
              </section>

              {/* Service FAQ Knowledge Base */}
              <section>
                <ServiceFAQAccordion service={service} />
              </section>

              {/* Official Sources & Verified Portals */}
              <section>
                <OfficialSourcesList
                  service={service}
                  onReportMissingSource={handleReportInaccuracy}
                />
              </section>

              {/* Citizen Experience & Community Reviews */}
              <section>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '1.5rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Star size={22} color="#fbbf24" fill="#fbbf24" />
                  <span>Citizen Experiences & Practical Ratings</span>
                </h2>
                <RatingSummaryCard
                  aggregate={reviewAggregate}
                  onOpenReviewModal={() => setIsReviewModalOpen(true)}
                />
                <CitizenReviewsList
                  reviews={reviews}
                  onReviewUpdated={refreshReviews}
                />
              </section>
            </div>

            <div style={{ position: 'relative', zIndex: 1, marginTop: '4rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-main)', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)' }}>
                Last Verified: {formatVerificationDate(service.lastVerified) || 'Audit Pending'}
              </div>
              {reportSubmitted ? (
                <span style={{ fontSize: '0.85rem', color: 'var(--success, #10b981)', fontWeight: '600' }}>
                  ✓ Report submitted to moderator queue. Thank you!
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleReportInaccuracy}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-tertiary)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.875rem', transition: 'color 0.3s' }}
                  onMouseOver={(e) => (e.currentTarget.style.color = 'var(--error)')}
                  onMouseOut={(e) => (e.currentTarget.style.color = 'var(--text-tertiary)')}
                >
                  <Flag size={14} /> Report incorrect information
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Fast-Track Apply Modal */}
      {showApplyModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '600px', background: 'var(--bg-main)', position: 'relative' }}>
            <button 
              onClick={() => { setShowApplyModal(false); setApplyStep(1); }} 
              style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'var(--glass-bg)', border: 'none', color: 'var(--text-secondary)', padding: '0.5rem', borderRadius: '50%', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>

            {applyStep === 1 ? (
              <div style={{ padding: '1rem' }}>
                <h2 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '0.5rem' }}>Universal Fast-Track</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '2.5rem' }}>Applying digitally for: <strong style={{ color: 'var(--text-primary)' }}>{service.name}</strong></p>
                
                <form onSubmit={handleApplySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Full Name (as per ID)</label>
                    <input
                      type="text"
                      className="input-field"
                      required
                      placeholder="e.g. Ramesh Patel"
                      value={applyForm.fullName}
                      onChange={(e) => setApplyForm({ ...applyForm, fullName: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Aadhaar Number / Virtual ID</label>
                    <input
                      type="text"
                      className="input-field"
                      required
                      placeholder="XXXX XXXX 1234"
                      value={applyForm.aadhaarNumber}
                      onChange={(e) => setApplyForm({ ...applyForm, aadhaarNumber: e.target.value })}
                    />
                  </div>
                  <div style={{ padding: '1.5rem', border: '1px dashed var(--border-main)', borderRadius: '1rem', textAlign: 'center', background: 'var(--glass-bg-subtle)' }}>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1rem' }}>Upload the Required Documents mentioned in the guide</p>
                    <input type="file" required style={{ color: 'var(--text-primary)', fontSize: '0.875rem' }} />
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem', padding: '1rem', fontSize: '1.125rem' }}>
                    Submit Secure Application
                  </button>
                </form>
              </div>
            ) : (
              <div style={{ padding: '3rem 1rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: '5rem', height: '5rem', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '2rem' }}>
                  <CheckCircle2 size={48} />
                </div>
                <h2 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '1rem' }}>Application Sent!</h2>
                <p style={{ fontSize: '1.125rem', color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                  Your digital application for {service.name} has been securely submitted.
                </p>
                <div style={{ background: 'var(--glass-bg)', padding: '1.5rem', borderRadius: '1rem', border: '1px solid var(--border-main)', width: '100%', marginBottom: '2.5rem' }}>
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '600' }}>Reference ID</span>
                  <p style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--accent-main)', marginTop: '0.5rem', fontFamily: 'monospace' }}>
                    {generatedAppId}
                  </p>
                </div>
                <Link to={`/track?id=${generatedAppId}`} className="btn btn-primary" style={{ padding: '1rem 2rem' }}>
                  Track Application Status
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Printable Office Visit Dossier Modal */}
      <PrintableChecklistModal
        isOpen={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        service={service}
      />

      {/* Share Checklist Modal */}
      <ShareServiceModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        service={service}
      />

      {/* Citizen Review Submission Modal */}
      <ReviewSubmissionModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        service={service}
        onReviewAdded={refreshReviews}
      />

      {/* Fee Breakdown & Concession Calculator Modal */}
      <FeeBreakdownModal
        isOpen={showFeeModal}
        onClose={() => setShowFeeModal(false)}
        service={service}
      />

      {/* Official Revisions & Circular Changelog Modal */}
      <ServiceChangelogModal
        isOpen={showChangelogModal}
        onClose={() => setShowChangelogModal(false)}
        service={service}
      />
    </>
  );
};

export default ServiceDetails;