import { SERVICE_REVISIONS } from '../data/serviceRevisionsData';

/**
 * Retrieves revision history for a specific civic service
 */
export function getServiceRevisions(serviceId) {
  if (!serviceId) return [];
  const cleanId = serviceId.toLowerCase().replace(/\s+/g, '-');
  const found = SERVICE_REVISIONS.find(r => r.serviceId === cleanId);
  return found ? found.revisions : [];
}

/**
 * Checks if a service has had an official policy change within the last 180 days
 */
export function checkRecentRevisions(serviceId, thresholdDays = 180) {
  const revisions = getServiceRevisions(serviceId);
  if (!revisions.length) {
    return { hasRecent: false, latestRevision: null, daysAgo: null };
  }

  const latest = revisions[0];
  const revDate = new Date(latest.effectiveDate);
  const now = new Date();
  const diffDays = Math.round((now - revDate) / (1000 * 60 * 60 * 24));

  return {
    hasRecent: diffDays >= 0 && diffDays <= thresholdDays,
    latestRevision: latest,
    daysAgo: diffDays,
    totalRevisions: revisions.length
  };
}

/**
 * Formats official circular reference citation string
 */
export function formatCircularCitation(revision = {}) {
  if (!revision || !revision.circularNumber) return 'Standard Government Order';
  return `${revision.circularNumber} dated ${new Date(revision.effectiveDate).toLocaleDateString('en-IN')} (${revision.issuingAuthority})`;
}
