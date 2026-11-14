import { useState, useMemo } from 'react';
import AccessibleModal from '../common/AccessibleModal';
import {
  BookmarkCheck,
  Plus,
  Trash2,
  Clock,
  ShieldCheck,
  Edit2,
} from 'lucide-react';
import {
  getSavedRequests,
  saveRequest,
  deleteSavedRequest,
  clearAllSavedRequests,
  maskResidentialAddress,
  calculateSlaStatus,
} from '../../services/waterTankerService';
import { REQUEST_STATUS_LABELS } from '../../data/waterTankerContract';
import { useToast } from '../../context/ToastContext';

export default function WaterTankerRequestModal({
  isOpen,
  onClose,
  authority,
}) {
  const { toast } = useToast();
  const [allRequests, setAllRequests] = useState(() => getSavedRequests());
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Form State
  const [bookingReference, setBookingReference] = useState('');
  const [selectedWard, setSelectedWard] = useState('');
  const [address, setAddress] = useState('');
  const [capacityLitres, setCapacityLitres] = useState(6000);
  const [requestDate, setRequestDate] = useState('');
  const [status, setStatus] = useState('requested');
  const [notes, setNotes] = useState('');

  const requests = useMemo(() => {
    if (authority?.id) {
      return allRequests.filter((r) => r.authorityId === authority.id);
    }
    return allRequests;
  }, [allRequests, authority]);

  const refreshRequests = () => {
    setAllRequests(getSavedRequests());
  };

  const handleModalClose = () => {
    setIsFormOpen(false);
    setEditingId(null);
    onClose();
  };

  if (!isOpen) return null;

  const resetForm = () => {
    setBookingReference('');
    setSelectedWard(authority?.wards?.[0] || '');
    setAddress('');
    setCapacityLitres(authority?.pricingStructure?.capacityLitres || 6000);
    setRequestDate(new Date().toISOString().slice(0, 16));
    setStatus('requested');
    setNotes('');
    setEditingId(null);
    setIsFormOpen(false);
  };

  const handleStartAdd = () => {
    resetForm();
    setSelectedWard(authority?.wards?.[0] || '');
    setRequestDate(new Date().toISOString().slice(0, 16));
    setIsFormOpen(true);
  };

  const handleStartEdit = (req) => {
    setEditingId(req.id);
    setBookingReference(req.bookingReference || '');
    setSelectedWard(req.ward || authority?.wards?.[0] || '');
    setAddress(req.address || '');
    setCapacityLitres(req.capacityLitres || 6000);
    setRequestDate(req.requestDate ? req.requestDate.slice(0, 16) : new Date().toISOString().slice(0, 16));
    setStatus(req.status || 'requested');
    setNotes(req.notes || '');
    setIsFormOpen(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!bookingReference.trim()) {
      toast?.error?.('Please enter your booking reference or token number.');
      return;
    }
    if (!selectedWard) {
      toast?.error?.('Please choose your municipal ward.');
      return;
    }

    const payload = {
      id: editingId || `req_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      authorityId: authority?.id || 'general',
      authorityName: authority?.name || 'Municipal Water Authority',
      bookingReference: bookingReference.trim(),
      ward: selectedWard,
      address: address.trim(),
      capacityLitres: Number(capacityLitres) || 6000,
      requestDate: requestDate ? new Date(requestDate).toISOString() : new Date().toISOString(),
      status,
      notes: notes.trim(),
    };

    saveRequest(payload);
    refreshRequests();
    setIsFormOpen(false);
    toast?.success?.(editingId ? 'Request details updated.' : 'Request logged successfully.');
  };

  const handleDelete = (id) => {
    if (window.confirm('Delete this saved water-tanker request entry?')) {
      deleteSavedRequest(id);
      refreshRequests();
      toast?.info?.('Request record removed from your device.');
    }
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to permanently delete all your saved water tanker requests? This action cannot be undone.')) {
      clearAllSavedRequests();
      refreshRequests();
      toast?.info?.('All saved water tanker requests deleted.');
    }
  };

  const maskedPreview = maskResidentialAddress(address, selectedWard, authority?.city);

  return (
    <AccessibleModal
      isOpen={isOpen}
      onClose={handleModalClose}
      title="Personal Water-Tanker Request Log"
      subtitle={`${authority?.name || 'Municipal Water Board'} • Request & Delivery Follow-up`}
      maxWidth="700px"
      ariaLabel="Personal water-tanker request log modal"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Privacy Invariant Banner */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1rem',
            borderRadius: '0.5rem',
            backgroundColor: 'rgba(37, 99, 235, 0.08)',
            border: '1px solid rgba(37, 99, 235, 0.2)',
            fontSize: '0.825rem',
            color: 'var(--text, #0f172a)',
          }}
        >
          <ShieldCheck size={18} style={{ color: 'var(--primary, #2563eb)', flexShrink: 0 }} aria-hidden="true" />
          <span>
            <strong>Local Privacy Protected:</strong> All request logs are stored exclusively in your browser&apos;s local storage. Exact house and flat numbers are masked in shared and exported summaries.
          </span>
        </div>

        {/* Action Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: 'var(--text, #0f172a)' }}>
            Logged Requests ({requests.length})
          </h4>
          {!isFormOpen && (
            <button
              type="button"
              onClick={handleStartAdd}
              className="btn btn-primary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.45rem 0.85rem',
                borderRadius: '0.5rem',
                fontSize: '0.85rem',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              <Plus size={16} aria-hidden="true" />
              <span>Log New Request</span>
            </button>
          )}
        </div>

        {/* Request Form (Add / Edit) */}
        {isFormOpen && (
          <form
            onSubmit={handleSave}
            style={{
              borderRadius: '0.75rem',
              border: '1px solid var(--border-color, #cbd5e1)',
              backgroundColor: 'var(--surface-raised, #f8fafc)',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h5 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: 'var(--text, #0f172a)' }}>
                {editingId ? 'Edit Tanker Request' : 'Log New Tanker Booking'}
              </h5>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary, #64748b)', cursor: 'pointer', fontSize: '0.8rem' }}
              >
                Cancel
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.85rem' }}>
              <div>
                <label htmlFor="modal-booking-ref" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, marginBottom: '0.25rem' }}>
                  Booking Reference / Token No. *
                </label>
                <input
                  id="modal-booking-ref"
                  type="text"
                  required
                  value={bookingReference}
                  onChange={(e) => setBookingReference(e.target.value)}
                  placeholder="e.g. DJB-2026-9812 or SMS Token"
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '0.375rem',
                    border: '1px solid var(--border-color, #cbd5e1)',
                    backgroundColor: 'var(--surface, #ffffff)',
                    fontSize: '0.85rem',
                  }}
                />
              </div>

              <div>
                <label htmlFor="modal-ward-select" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, marginBottom: '0.25rem' }}>
                  Ward / Locality *
                </label>
                <select
                  id="modal-ward-select"
                  value={selectedWard}
                  onChange={(e) => setSelectedWard(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '0.375rem',
                    border: '1px solid var(--border-color, #cbd5e1)',
                    backgroundColor: 'var(--surface, #ffffff)',
                    fontSize: '0.85rem',
                  }}
                >
                  {authority?.wards?.map((w) => (
                    <option key={w} value={w}>{w}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="modal-capacity" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, marginBottom: '0.25rem' }}>
                  Tanker Capacity (Litres)
                </label>
                <select
                  id="modal-capacity"
                  value={capacityLitres}
                  onChange={(e) => setCapacityLitres(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '0.375rem',
                    border: '1px solid var(--border-color, #cbd5e1)',
                    backgroundColor: 'var(--surface, #ffffff)',
                    fontSize: '0.85rem',
                  }}
                >
                  <option value={5000}>5,000 Litres (Domestic Standard)</option>
                  <option value={6000}>6,000 Litres (Municipal Ceiling)</option>
                  <option value={9000}>9,000 Litres (Medium Sump)</option>
                  <option value={10000}>10,000 Litres (Society Tank)</option>
                  <option value={12000}>12,000 Litres (Large Tanker)</option>
                </select>
              </div>

              <div>
                <label htmlFor="modal-request-date" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, marginBottom: '0.25rem' }}>
                  Booking Date & Time
                </label>
                <input
                  id="modal-request-date"
                  type="datetime-local"
                  value={requestDate}
                  onChange={(e) => setRequestDate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '0.375rem',
                    border: '1px solid var(--border-color, #cbd5e1)',
                    backgroundColor: 'var(--surface, #ffffff)',
                    fontSize: '0.85rem',
                  }}
                />
              </div>

              <div>
                <label htmlFor="modal-status-select" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, marginBottom: '0.25rem' }}>
                  User-Entered Status
                </label>
                <select
                  id="modal-status-select"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '0.375rem',
                    border: '1px solid var(--border-color, #cbd5e1)',
                    backgroundColor: 'var(--surface, #ffffff)',
                    fontSize: '0.85rem',
                  }}
                >
                  {Object.entries(REQUEST_STATUS_LABELS).map(([k, label]) => (
                    <option key={k} value={k}>{label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="modal-address" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, marginBottom: '0.25rem' }}>
                  Delivery Address / Landmark (Private)
                </label>
                <input
                  id="modal-address"
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Near Water Tank, 4th Cross"
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '0.375rem',
                    border: '1px solid var(--border-color, #cbd5e1)',
                    backgroundColor: 'var(--surface, #ffffff)',
                    fontSize: '0.85rem',
                  }}
                />
              </div>
            </div>

            {/* Address Masking Preview */}
            {address && (
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary, #64748b)', backgroundColor: 'var(--surface, #ffffff)', padding: '0.5rem 0.75rem', borderRadius: '0.375rem', border: '1px dashed var(--border-color, #cbd5e1)' }}>
                <strong>Public / Escalation Preview:</strong> {maskedPreview}
              </div>
            )}

            <div>
              <label htmlFor="modal-notes" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, marginBottom: '0.25rem' }}>
                Private Notes (Driver contact, water quality observations)
              </label>
              <textarea
                id="modal-notes"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Driver promised delivery by 2:00 PM; narrow street access requires long hose."
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '0.375rem',
                  border: '1px solid var(--border-color, #cbd5e1)',
                  backgroundColor: 'var(--surface, #ffffff)',
                  fontSize: '0.85rem',
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="btn btn-secondary"
                style={{ padding: '0.45rem 0.85rem', borderRadius: '0.375rem', fontSize: '0.85rem' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ padding: '0.45rem 1rem', borderRadius: '0.375rem', fontSize: '0.85rem', fontWeight: 500 }}
              >
                {editingId ? 'Update Request' : 'Save Request'}
              </button>
            </div>
          </form>
        )}

        {/* Requests List */}
        {requests.length === 0 ? (
          <div
            style={{
              padding: '2rem 1rem',
              textAlign: 'center',
              backgroundColor: 'var(--surface-raised, #f8fafc)',
              borderRadius: '0.75rem',
              border: '1px dashed var(--border-color, #cbd5e1)',
              color: 'var(--text-secondary, #64748b)',
              fontSize: '0.875rem',
            }}
          >
            <BookmarkCheck size={28} style={{ margin: '0 auto 0.5rem auto', opacity: 0.4 }} aria-hidden="true" />
            <p style={{ margin: 0 }}>No requests logged yet for this authority.</p>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem' }}>
              Log your official booking token to track delivery SLA and generate escalation representations.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '350px', overflowY: 'auto' }}>
            {requests.map((req) => {
              const sla = calculateSlaStatus(req.requestDate, authority?.escalationMatrix?.[0]?.statutorySlaHours || 24);
              return (
                <div
                  key={req.id}
                  style={{
                    borderRadius: '0.75rem',
                    border: '1px solid var(--border-color, #e2e8f0)',
                    backgroundColor: 'var(--surface, #ffffff)',
                    padding: '1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text, #0f172a)' }}>
                          Token: {req.bookingReference}
                        </span>
                        <span
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            padding: '0.15rem 0.5rem',
                            borderRadius: '999px',
                            backgroundColor: req.status === 'delivered' ? 'rgba(22, 163, 74, 0.1)' : sla.isDelayed ? 'rgba(239, 68, 68, 0.1)' : 'rgba(37, 99, 235, 0.1)',
                            color: req.status === 'delivered' ? 'var(--success, #16a34a)' : sla.isDelayed ? 'var(--danger, #dc2626)' : 'var(--primary, #2563eb)',
                          }}
                        >
                          {REQUEST_STATUS_LABELS[req.status] || req.status}
                        </span>
                      </div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary, #64748b)' }}>
                        {req.ward} • {req.capacityLitres.toLocaleString('en-IN')} L • Booked: {new Date(req.requestDate).toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <button
                        type="button"
                        onClick={() => handleStartEdit(req)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-secondary, #64748b)',
                          cursor: 'pointer',
                          padding: '0.35rem',
                          borderRadius: '0.375rem',
                        }}
                        title="Edit request"
                      >
                        <Edit2 size={16} aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(req.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--danger, #dc2626)',
                          cursor: 'pointer',
                          padding: '0.35rem',
                          borderRadius: '0.375rem',
                        }}
                        title="Delete request"
                      >
                        <Trash2 size={16} aria-hidden="true" />
                      </button>
                    </div>
                  </div>

                  {/* SLA Indicator */}
                  {req.status !== 'delivered' && req.status !== 'rejected' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: sla.isDelayed ? 'var(--danger, #dc2626)' : 'var(--text-secondary, #64748b)' }}>
                      <Clock size={13} aria-hidden="true" />
                      <span>{sla.label}</span>
                    </div>
                  )}

                  {req.notes && (
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary, #64748b)', fontStyle: 'italic' }}>
                      &ldquo;{req.notes}&rdquo;
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Footer actions */}
        {requests.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.5rem', borderTop: '1px solid var(--border-color, #e2e8f0)' }}>
            <button
              type="button"
              onClick={handleClearAll}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--danger, #dc2626)',
                fontSize: '0.8rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
              }}
            >
              <Trash2 size={14} aria-hidden="true" />
              <span>Delete All Saved Requests</span>
            </button>

            <button
              type="button"
              onClick={handleModalClose}
              className="btn btn-secondary"
              style={{ padding: '0.45rem 1rem', borderRadius: '0.375rem', fontSize: '0.85rem' }}
            >
              Close
            </button>
          </div>
        )}
      </div>
    </AccessibleModal>
  );
}
