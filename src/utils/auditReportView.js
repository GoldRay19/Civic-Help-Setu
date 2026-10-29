/**
 * Small helpers that turn a record from communityAuditService into what the
 * admin "Discrepancy Audits" tab shows. Kept out of Admin.jsx so the field
 * mapping can be unit tested and a record with a missing field cannot crash
 * the page.
 */

const RESOLVED_STATUS = 'RESOLVED';

// "FEES_UPDATE" -> "FEES UPDATE". Replaces every underscore, not just the first.
export function formatAuditCategory(category) {
  const text = typeof category === 'string' ? category.trim() : '';
  return (text || 'GENERAL_DISCREPANCY').replace(/_/g, ' ');
}

export function isAuditResolved(report) {
  return report?.status === RESOLVED_STATUS;
}

// Everything that is not RESOLVED still needs an admin (pending, community verified, disputed).
export function countOpenAudits(reports) {
  if (!Array.isArray(reports)) return 0;
  return reports.filter((report) => report && !isAuditResolved(report)).length;
}

// "income-certificate" -> "Income Certificate", used when the service is not in the list.
function readableServiceId(serviceId) {
  const text = typeof serviceId === 'string' ? serviceId.trim() : '';
  if (!text) return 'General';
  return text
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function getAuditServiceName(report, services) {
  const id = report?.serviceId;
  const match = Array.isArray(services) ? services.find((service) => service?.id === id) : null;
  return match?.name || readableServiceId(id);
}

const toCount = (value) => (Number.isFinite(value) && value > 0 ? value : 0);

// The report fields (id, title, description, reportedBy) come through unchanged, the rest is derived.
export function describeAuditReport(report, services) {
  const safe = report || {};
  const upvotes = toCount(safe.upvotes);
  return {
    ...safe,
    serviceName: getAuditServiceName(safe, services),
    categoryLabel: formatAuditCategory(safe.category),
    reportedDate: safe.reportedDate || '',
    upvotes,
    downvotes: toCount(safe.downvotes),
    resolved: isAuditResolved(safe),
    adminNote: safe.adminNote || '',
    // same colour rule the tab already used: green resolved, red when 3+ citizens agree, else amber
    tone: isAuditResolved(safe) ? 'resolved' : upvotes >= 3 ? 'urgent' : 'pending',
  };
}
