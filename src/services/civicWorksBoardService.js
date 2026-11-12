import { can, requirePermission, actorLabel as getVerifiedActorLabel } from './accessControl';
import { minimizeForExternal } from '../utils/dataMinimization';
import { sanitizePlainText, safeHttpUrl } from '../utils/safeContent';
import {
  MODERATION_MERGE_STATE,
  getGeospatialGridBucket,
  evaluatePairwiseReportSimilarity,
  detectReportBursts,
  confirmModeratorMerge,
  reverseModeratorMerge,
} from './duplicateReportDetectionService';

export const CIVIC_WORKS_REPORTS_KEY = 'civicbridge_civic_works_reports_v1';
export const CIVIC_WORKS_CLUSTERS_KEY = 'civicbridge_civic_works_clusters_v1';
export const CIVIC_WORKS_RATE_LIMIT_KEY = 'civicbridge_civic_works_rate_limit_v1';

export const CIVIC_WORK_CATEGORIES = {
  ROAD_DAMAGE: 'road_damage',
  STREETLIGHT: 'streetlight',
  DRAINAGE: 'drainage',
  WATER_SANITATION: 'water_sanitation',
  PUBLIC_FACILITY: 'public_facility',
  FOOTPATH_SAFETY: 'footpath_safety',
};

export const CIVIC_WORK_CATEGORY_LABELS = {
  [CIVIC_WORK_CATEGORIES.ROAD_DAMAGE]: 'Damaged Roads & Potholes',
  [CIVIC_WORK_CATEGORIES.STREETLIGHT]: 'Streetlights & Public Lighting',
  [CIVIC_WORK_CATEGORIES.DRAINAGE]: 'Drainage & Stormwater',
  [CIVIC_WORK_CATEGORIES.WATER_SANITATION]: 'Water Supply & Sanitation',
  [CIVIC_WORK_CATEGORIES.PUBLIC_FACILITY]: 'Public Facilities & Parks',
  [CIVIC_WORK_CATEGORIES.FOOTPATH_SAFETY]: 'Footpaths & Traffic Safety',
};

export const CIVIC_WORK_STATES = {
  SUBMITTED: 'submitted',
  UNDER_REVIEW: 'under_review',
  FORWARDED: 'forwarded',
  WORK_REPORTED: 'work_reported',
  INDEPENDENTLY_CONFIRMED: 'independently_confirmed',
  WITHDRAWN: 'withdrawn',
};

export const CIVIC_WORK_STATE_LABELS = {
  [CIVIC_WORK_STATES.SUBMITTED]: 'Submitted (Citizen Report)',
  [CIVIC_WORK_STATES.UNDER_REVIEW]: 'Under Review',
  [CIVIC_WORK_STATES.FORWARDED]: 'Forwarded to Department',
  [CIVIC_WORK_STATES.WORK_REPORTED]: 'Work Reported (Pending Verification)',
  [CIVIC_WORK_STATES.INDEPENDENTLY_CONFIRMED]: 'Independently Confirmed',
  [CIVIC_WORK_STATES.WITHDRAWN]: 'Withdrawn by Reporter',
};

export const MODERATION_DECISIONS = {
  PENDING_MODERATION: 'pending_moderation',
  APPROVED: 'approved',
  FLAGGED: 'flagged',
  REJECTED: 'rejected',
};

export const ACTOR_SOURCE_TYPES = {
  CITIZEN: 'citizen',
  MODERATOR: 'moderator',
  OFFICIAL: 'official',
  COMMUNITY_VERIFIER: 'community_verifier',
};

export const MEDIA_KINDS = {
  ISSUE_EVIDENCE: 'issue_evidence',
  WORK_COMPLETION_PROOF: 'work_completion_proof',
  INDEPENDENT_VERIFICATION: 'independent_verification',
};

export const ALLOWED_MEDIA_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const MAX_MEDIA_BYTES = 5 * 1024 * 1024;
export const MAX_MEDIA_ATTACHMENTS = 4;
export const RATE_LIMIT_MAX_SUBMISSIONS = 5;
export const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
export const DUPLICATE_SPAM_COOLDOWN_MS = 10 * 60 * 1000;

export const BOARD_GOVERNANCE_NOTICE =
  'Community reports show coarse ward and grid locations by default. Citizen submissions are distinct from official municipal acknowledgement, and repairs are not marked independently verified without documented post-work evidence.';

const VALID_STATE_SET = new Set(Object.values(CIVIC_WORK_STATES));
const VALID_CATEGORY_SET = new Set(Object.values(CIVIC_WORK_CATEGORIES));
const VALID_SOURCE_SET = new Set(Object.values(ACTOR_SOURCE_TYPES));
const SAFE_DATA_IMAGE_RE = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]{8,}$/;
const SAFE_BLOB_URL_RE = /^blob:(?:https?:\/\/[^\s/$.?#].[^\s]*|[a-zA-Z0-9-]+)$/;
const DMS_COORD_RE = /\b\d{1,3}°\s*\d{1,2}['′]\s*\d{1,2}(?:\.\d+)?["″]?\s*[NSEW]\b/gi;
const LABELED_COORD_RE = /\b(?:lat(?:itude)?|lng|lon(?:gitude)?)\s*[:=]\s*-?\d{1,3}(?:\.\d+)?/gi;
const COMPACT_COORD_PAIR_RE = /(?<!\d)-?\d{1,3}\.\d{2,}\s*[,;/]\s*-?\d{1,3}\.\d{2,}(?!\d)/g;
const SPACE_COORD_PAIR_RE = /(?<!\d)-?\d{1,3}\.\d{4,}\s+-?\d{1,3}\.\d{4,}(?!\d)/g;
const URL_COUNT_RE = /https?:\/\/[^\s]+/gi;

const getStorage = () => {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
};

const createServiceError = (message, code, extra = {}) => {
  const err = new Error(message);
  err.code = code;
  Object.assign(err, extra);
  return err;
};

const safeReadJson = (storage, key, fallback) => {
  if (!storage) return fallback;
  try {
    const raw = storage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    if (Array.isArray(fallback) && !Array.isArray(parsed)) return fallback;
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
};

const safeWriteJson = (storage, key, value) => {
  if (!storage) return false;
  try {
    storage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
};

/**
 * Sanitizes text and scrubs PII, secrets, and exact decimal/DMS geographic coordinates
 * so public views never leak street-level reporter coordinates or personal data.
 */
export function redactLocationAndPii(value = '', { max = 2000, multiline = true } = {}) {
  const plain = sanitizePlainText(value, { max, multiline });
  if (!plain) return '';
  const minimized = minimizeForExternal(plain);
  return minimized
    .replace(DMS_COORD_RE, '[REDACTED_COORDINATE]')
    .replace(LABELED_COORD_RE, '[REDACTED_COORDINATE]')
    .replace(COMPACT_COORD_PAIR_RE, '[REDACTED_LOCATION]')
    .replace(SPACE_COORD_PAIR_RE, '[REDACTED_LOCATION]')
    .trim();
}

function normalizeWardSlug(ward = '') {
  return String(ward)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '') || 'unassigned';
}

function validateCoordinates(exactCoordinates) {
  if (exactCoordinates === null || exactCoordinates === undefined) return null;
  if (typeof exactCoordinates !== 'object') {
    throw createServiceError('Coordinates must be an object with numeric lat and lng.', 'INVALID_COORDINATES');
  }
  const lat = Number(exactCoordinates.lat);
  const lng = Number(exactCoordinates.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    throw createServiceError('Latitude must be between -90 and 90 and longitude between -180 and 180.', 'INVALID_COORDINATES');
  }
  return { lat, lng };
}

function buildCoarseLocation({ ward, locality, approximateLandmark = '', exactCoordinates = null }) {
  const cleanWard = redactLocationAndPii(ward, { max: 80, multiline: false });
  const cleanLocality = redactLocationAndPii(locality, { max: 120, multiline: false });
  const cleanLandmark = redactLocationAndPii(approximateLandmark, { max: 180, multiline: false });

  if (!cleanWard || cleanWard.length < 2) {
    throw createServiceError('Ward name or number is required.', 'INVALID_LOCATION');
  }
  if (!cleanLocality || cleanLocality.length < 2) {
    throw createServiceError('Locality or neighbourhood name is required.', 'INVALID_LOCATION');
  }

  const validCoords = validateCoordinates(exactCoordinates);
  const geoBucket = validCoords
    ? getGeospatialGridBucket(validCoords.lat, validCoords.lng)
    : `ward_${normalizeWardSlug(cleanWard)}_${normalizeWardSlug(cleanLocality)}`;

  return {
    coarseLocation: {
      ward: cleanWard,
      locality: cleanLocality,
      approximateLandmark: cleanLandmark,
      geoBucket,
      precision: validCoords ? 'grid_1km_approx' : 'ward_locality',
    },
    privateLocation: validCoords
      ? {
          exactCoordinates: validCoords,
          redactionPolicy: 'exact_coordinates_withheld_from_public',
        }
      : null,
  };
}

function hasControlChars(str) {
  for (let i = 0; i < str.length; i += 1) {
    const code = str.charCodeAt(i);
    if (code <= 0x1f || code === 0x7f) return true;
  }
  return false;
}

export function isSafeMediaUrl(value) {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > 2_000_000) return false;
  if (hasControlChars(trimmed)) return false;
  if (SAFE_DATA_IMAGE_RE.test(trimmed)) return true;
  if (SAFE_BLOB_URL_RE.test(trimmed)) return true;
  if (/^https?:\/\//i.test(trimmed)) {
    const safe = safeHttpUrl(trimmed);
    return Boolean(safe) && !/\.svg(?:$|\?)/i.test(safe);
  }
  return false;
}

export function validateMediaAttachments(
  mediaList = [],
  { mediaConsent = false, defaultSourceType = ACTOR_SOURCE_TYPES.CITIZEN, defaultKind = MEDIA_KINDS.ISSUE_EVIDENCE } = {}
) {
  if (mediaList === null || mediaList === undefined) return [];
  if (!Array.isArray(mediaList)) {
    throw createServiceError('Media attachments must be an array.', 'INVALID_MEDIA');
  }
  if (mediaList.length > MAX_MEDIA_ATTACHMENTS) {
    throw createServiceError(`A maximum of ${MAX_MEDIA_ATTACHMENTS} media attachments is allowed per action.`, 'MEDIA_LIMIT_EXCEEDED');
  }
  if (mediaList.length > 0 && mediaConsent !== true) {
    throw createServiceError('Explicit media publication consent is required when attaching media.', 'MEDIA_CONSENT_REQUIRED');
  }

  return mediaList.map((item, idx) => {
    if (!item || typeof item !== 'object') {
      throw createServiceError(`Media attachment #${idx + 1} is invalid.`, 'INVALID_MEDIA');
    }
    const mimeType = String(item.mimeType || '').toLowerCase().trim();
    if (!ALLOWED_MEDIA_MIME_TYPES.includes(mimeType)) {
      throw createServiceError(
        `Unsupported media type "${mimeType || 'unknown'}". Only JPEG, PNG, and WebP images are permitted.`,
        'UNSUPPORTED_MEDIA_TYPE'
      );
    }

    const sizeBytes = item.sizeBytes !== undefined ? Number(item.sizeBytes) : 0;
    if (!Number.isFinite(sizeBytes) || sizeBytes < 0 || sizeBytes > MAX_MEDIA_BYTES) {
      throw createServiceError(`Media file size exceeds the ${Math.round(MAX_MEDIA_BYTES / (1024 * 1024))} MB safety limit.`, 'MEDIA_TOO_LARGE');
    }

    const url = String(item.url || item.dataUri || '').trim();
    if (!isSafeMediaUrl(url)) {
      throw createServiceError('Media URL or image payload failed safety validation.', 'UNSAFE_MEDIA_URL');
    }

    const kind = Object.values(MEDIA_KINDS).includes(item.kind) ? item.kind : defaultKind;
    const caption = redactLocationAndPii(item.caption || '', { max: 240, multiline: false });
    const uploadedBySource = VALID_SOURCE_SET.has(item.uploadedBySource)
      ? item.uploadedBySource
      : defaultSourceType;

    return {
      id: item.id || `med_${Date.now()}_${idx}_${Math.random().toString(36).slice(2, 6)}`,
      kind,
      mimeType,
      sizeBytes,
      url,
      caption,
      exifStripped: true,
      mediaConsentGranted: Boolean(mediaConsent),
      moderationApproved: uploadedBySource === ACTOR_SOURCE_TYPES.MODERATOR ||
        uploadedBySource === ACTOR_SOURCE_TYPES.OFFICIAL ||
        uploadedBySource === ACTOR_SOURCE_TYPES.COMMUNITY_VERIFIER,
      uploadedAt: item.uploadedAt || new Date().toISOString(),
      uploadedBySource,
    };
  });
}

function getAllRawReports(storage = getStorage()) {
  return safeReadJson(storage, CIVIC_WORKS_REPORTS_KEY, []);
}

function saveAllRawReports(reports, storage = getStorage()) {
  return safeWriteJson(storage, CIVIC_WORKS_REPORTS_KEY, reports);
}

function getAllClusters(storage = getStorage()) {
  return safeReadJson(storage, CIVIC_WORKS_CLUSTERS_KEY, []);
}

function saveAllClusters(clusters, storage = getStorage()) {
  return safeWriteJson(storage, CIVIC_WORKS_CLUSTERS_KEY, clusters);
}

function enforceSubmissionAbuseControls(
  { reporterKey, title, description, nowMs = Date.now() },
  existingReports,
  storage = getStorage()
) {
  const safeKey = String(reporterKey || 'anonymous_resident').trim() || 'anonymous_resident';
  const normalizedTitle = sanitizePlainText(title, { max: 140, multiline: false }).toLowerCase();
  const normalizedDesc = sanitizePlainText(description, { max: 2000, multiline: true }).toLowerCase();

  if (normalizedTitle.length < 5) {
    throw createServiceError('Please provide a clear title (at least 5 characters).', 'VALIDATION_ERROR');
  }
  if (normalizedDesc.length < 10) {
    throw createServiceError('Please provide a clear description (at least 10 characters).', 'VALIDATION_ERROR');
  }

  const urlsInText = (String(description).match(URL_COUNT_RE) || []).length +
    (String(title).match(URL_COUNT_RE) || []).length;
  if (urlsInText > 2) {
    throw createServiceError('Too many external links detected in report text.', 'ABUSE_SPAM_BLOCKED');
  }

  // Repeated identical text spam check from the same reporter
  const duplicateRecent = existingReports.find((rep) => {
    if (rep.reporterId !== safeKey || rep.status === CIVIC_WORK_STATES.WITHDRAWN) return false;
    const ageMs = nowMs - Date.parse(rep.createdAt || '');
    if (!Number.isFinite(ageMs) || ageMs < 0 || ageMs > DUPLICATE_SPAM_COOLDOWN_MS) return false;
    return (
      String(rep.title || '').toLowerCase() === normalizedTitle &&
      String(rep.description || '').toLowerCase() === normalizedDesc
    );
  });

  if (duplicateRecent) {
    throw createServiceError(
      'An identical report was submitted recently from this account. Please wait or edit your existing report instead.',
      'DUPLICATE_SPAM_BLOCKED'
    );
  }

  // Sliding window rate limiter
  const rateState = safeReadJson(storage, CIVIC_WORKS_RATE_LIMIT_KEY, {});
  const historyTimestamps = Array.isArray(rateState[safeKey]) ? rateState[safeKey] : [];
  const activeTimestamps = historyTimestamps.filter(
    (ts) => Number.isFinite(ts) && ts <= nowMs && nowMs - ts < RATE_LIMIT_WINDOW_MS
  );

  if (activeTimestamps.length >= RATE_LIMIT_MAX_SUBMISSIONS) {
    const oldest = Math.min(...activeTimestamps);
    const retryAfterSeconds = Math.max(1, Math.ceil((oldest + RATE_LIMIT_WINDOW_MS - nowMs) / 1000));
    throw createServiceError(
      `Submission rate limit reached. Please try again in ${retryAfterSeconds} seconds.`,
      'ABUSE_RATE_LIMITED',
      { retryAfterSeconds }
    );
  }

  activeTimestamps.push(nowMs);
  safeWriteJson(storage, CIVIC_WORKS_RATE_LIMIT_KEY, {
    ...rateState,
    [safeKey]: activeTimestamps,
  });
}

function determineMediaAccess(report, viewer = {}) {
  const allMedia = Array.isArray(report.media) ? report.media : [];
  if (allMedia.length === 0) {
    return {
      visibleMedia: [],
      redactedMediaCount: 0,
      mediaAccessStatus: 'none',
    };
  }

  const isModerator = Boolean(viewer.isModerator) || can('civicWorks.moderate');
  const isOwner =
    Boolean(viewer.reporterId && viewer.reporterId === report.reporterId) ||
    Boolean(viewer.editToken && viewer.editToken === report.editToken);

  if (report.status === CIVIC_WORK_STATES.WITHDRAWN && !isModerator) {
    return {
      visibleMedia: [],
      redactedMediaCount: allMedia.length,
      mediaAccessStatus: 'restricted_withdrawn',
    };
  }

  if (report.moderationStatus === MODERATION_DECISIONS.REJECTED && !isModerator) {
    return {
      visibleMedia: [],
      redactedMediaCount: allMedia.length,
      mediaAccessStatus: 'restricted_rejected',
    };
  }

  const visibleMedia = [];
  let redactedCount = 0;

  for (const item of allMedia) {
    if (!item || !isSafeMediaUrl(item.url)) {
      redactedCount += 1;
      continue;
    }

    const consented = Boolean(item.mediaConsentGranted) &&
      (item.uploadedBySource !== ACTOR_SOURCE_TYPES.CITIZEN || report.consent?.mediaConsent === true);

    if (isModerator) {
      visibleMedia.push({
        id: item.id,
        kind: item.kind,
        mimeType: item.mimeType,
        sizeBytes: item.sizeBytes,
        url: item.url,
        caption: redactLocationAndPii(item.caption || '', { max: 240, multiline: false }),
        exifStripped: Boolean(item.exifStripped),
        moderationApproved: Boolean(item.moderationApproved),
        mediaConsentGranted: consented,
        uploadedAt: item.uploadedAt,
        uploadedBySource: item.uploadedBySource,
      });
      continue;
    }

    if (isOwner && item.moderationApproved !== false) {
      visibleMedia.push({
        id: item.id,
        kind: item.kind,
        mimeType: item.mimeType,
        sizeBytes: item.sizeBytes,
        url: item.url,
        caption: redactLocationAndPii(item.caption || '', { max: 240, multiline: false }),
        exifStripped: Boolean(item.exifStripped),
        moderationApproved: Boolean(item.moderationApproved),
        uploadedAt: item.uploadedAt,
        uploadedBySource: item.uploadedBySource,
      });
      continue;
    }

    // Public viewer: requires approved report, approved media item, and explicit consent
    const isVerificationEvidence =
      item.uploadedBySource === ACTOR_SOURCE_TYPES.OFFICIAL ||
      item.uploadedBySource === ACTOR_SOURCE_TYPES.COMMUNITY_VERIFIER;

    if (
      report.moderationStatus === MODERATION_DECISIONS.APPROVED &&
      item.moderationApproved === true &&
      (consented || isVerificationEvidence)
    ) {
      visibleMedia.push({
        id: item.id,
        kind: item.kind,
        mimeType: item.mimeType,
        sizeBytes: item.sizeBytes,
        url: item.url,
        caption: redactLocationAndPii(item.caption || '', { max: 240, multiline: false }),
        exifStripped: Boolean(item.exifStripped),
        uploadedAt: item.uploadedAt,
        uploadedBySource: item.uploadedBySource,
      });
    } else {
      redactedCount += 1;
    }
  }

  let mediaAccessStatus = 'public_visible';
  if (redactedCount > 0 && visibleMedia.length === 0) {
    mediaAccessStatus =
      report.consent?.mediaConsent !== true
        ? 'restricted_no_consent'
        : 'restricted_pending_moderation';
  } else if (redactedCount > 0) {
    mediaAccessStatus = 'partially_redacted';
  }

  return {
    visibleMedia,
    redactedMediaCount: redactedCount,
    mediaAccessStatus,
  };
}

function getVerificationBadge(report) {
  if (report.status === CIVIC_WORK_STATES.WITHDRAWN) {
    return {
      code: 'withdrawn',
      label: 'Withdrawn Report',
      isOfficiallyAcknowledged: Boolean(report.officialAcknowledgement?.acknowledged),
      isIndependentlyConfirmed: false,
    };
  }
  if (report.status === CIVIC_WORK_STATES.INDEPENDENTLY_CONFIRMED && report.completionVerification?.verified) {
    return {
      code: 'independently_confirmed_with_evidence',
      label: 'Independently Confirmed (With Evidence)',
      isOfficiallyAcknowledged: Boolean(report.officialAcknowledgement?.acknowledged),
      isIndependentlyConfirmed: true,
    };
  }
  if (report.status === CIVIC_WORK_STATES.WORK_REPORTED) {
    return {
      code: 'work_claimed_unverified',
      label: 'Work Reported — Independent Verification Pending',
      isOfficiallyAcknowledged: Boolean(report.officialAcknowledgement?.acknowledged),
      isIndependentlyConfirmed: false,
    };
  }
  if (report.officialAcknowledgement?.acknowledged) {
    return {
      code: 'officially_acknowledged',
      label: 'Officially Acknowledged',
      isOfficiallyAcknowledged: true,
      isIndependentlyConfirmed: false,
    };
  }
  return {
    code: 'unverified_citizen_report',
    label: 'Citizen Report (Awaiting Official Acknowledgement)',
    isOfficiallyAcknowledged: false,
    isIndependentlyConfirmed: false,
  };
}

/**
 * Produces a privacy-safe public projection of a report.
 * Always suppresses private coordinates (`_privateLocation`), edit tokens,
 * and unapproved/unconsented media, and scrubs PII/coordinates from text fields.
 */
export function toPublicReportView(report, viewer = {}, clusters = []) {
  if (!report || typeof report !== 'object') return null;

  const isWithdrawn = report.status === CIVIC_WORK_STATES.WITHDRAWN;
  const mediaAccess = determineMediaAccess(report, viewer);
  const badge = getVerificationBadge(report);
  const cluster = report.clusterId
    ? clusters.find((c) => c.clusterId === report.clusterId && c.status === MODERATION_MERGE_STATE.CONFIRMED_MERGED)
    : null;

  return {
    id: report.id,
    trackingCode: report.trackingCode,
    originType: report.originType || 'citizen_report',
    category: report.category,
    categoryLabel: CIVIC_WORK_CATEGORY_LABELS[report.category] || report.category,
    title: isWithdrawn
      ? '[Withdrawn Citizen Report]'
      : redactLocationAndPii(report.title, { max: 140, multiline: false }),
    description: isWithdrawn
      ? 'This report was withdrawn by the resident. Audit timestamps remain for accountability.'
      : redactLocationAndPii(report.description, { max: 2000, multiline: true }),
    coarseLocation: {
      ward: report.coarseLocation?.ward || 'Unspecified Ward',
      locality: report.coarseLocation?.locality || 'Unspecified Locality',
      approximateLandmark: isWithdrawn
        ? ''
        : redactLocationAndPii(report.coarseLocation?.approximateLandmark || '', { max: 180, multiline: false }),
      geoBucket: report.coarseLocation?.geoBucket || 'UNKNOWN_ZONE',
      precision: report.coarseLocation?.precision || 'ward_locality',
    },
    locationRedactedByDefault: true,
    status: report.status,
    statusLabel: CIVIC_WORK_STATE_LABELS[report.status] || report.status,
    moderationStatus: report.moderationStatus,
    verification: badge,
    officialAcknowledgement: report.officialAcknowledgement?.acknowledged
      ? {
          acknowledged: true,
          department: redactLocationAndPii(report.officialAcknowledgement.department || '', { max: 120, multiline: false }),
          referenceNumber: redactLocationAndPii(report.officialAcknowledgement.referenceNumber || '', { max: 60, multiline: false }),
          assignedUnit: redactLocationAndPii(report.officialAcknowledgement.assignedUnit || '', { max: 120, multiline: false }),
          acknowledgedAt: report.officialAcknowledgement.acknowledgedAt,
          acknowledgedBy: redactLocationAndPii(report.officialAcknowledgement.acknowledgedBy || 'Official Desk', { max: 80, multiline: false }),
          notes: redactLocationAndPii(report.officialAcknowledgement.notes || '', { max: 400, multiline: false }),
        }
      : { acknowledged: false },
    completionVerification: report.completionVerification?.verified
      ? {
          verified: true,
          verifiedAt: report.completionVerification.verifiedAt,
          verifierSourceType: report.completionVerification.verifierSourceType,
          verifierLabel: redactLocationAndPii(report.completionVerification.verifierLabel || '', { max: 80, multiline: false }),
          evidenceMediaIds: [...(report.completionVerification.evidenceMediaIds || [])],
          evidenceNote: redactLocationAndPii(report.completionVerification.evidenceNote || '', { max: 400, multiline: false }),
        }
      : { verified: false },
    media: mediaAccess.visibleMedia,
    redactedMediaCount: mediaAccess.redactedMediaCount,
    mediaAccessStatus: mediaAccess.mediaAccessStatus,
    clusterId: cluster ? cluster.clusterId : null,
    clusterRole: cluster
      ? cluster.primaryReportId === report.id
        ? 'primary'
        : 'grouped_duplicate'
      : null,
    statusHistory: (Array.isArray(report.statusHistory) ? report.statusHistory : []).map((entry) => ({
      id: entry.id,
      state: entry.state,
      stateLabel: CIVIC_WORK_STATE_LABELS[entry.state] || entry.state,
      timestamp: entry.timestamp,
      sourceType: entry.sourceType,
      actorLabel: redactLocationAndPii(entry.actorLabel || entry.sourceType, { max: 80, multiline: false }),
      note: isWithdrawn && entry.state === CIVIC_WORK_STATES.SUBMITTED
        ? '[Original submission text withheld after withdrawal]'
        : redactLocationAndPii(entry.note || '', { max: 300, multiline: false }),
      evidenceIds: Array.isArray(entry.evidenceIds) ? [...entry.evidenceIds] : [],
    })),
    createdAt: report.createdAt,
    updatedAt: report.updatedAt,
    isEdited: Boolean(report.editCount > 0),
    editCount: report.editCount || 0,
  };
}

/**
 * Submits a new citizen ward-level civic works report.
 * Subject to consent verification, PII/coordinate redaction, media validation,
 * anti-abuse rate limiting, and moderation triage.
 */
export function submitCivicWorkReport(input = {}, storage = getStorage(), options = {}) {
  if (!VALID_CATEGORY_SET.has(input.category)) {
    throw createServiceError('Please select a valid civic infrastructure category.', 'INVALID_CATEGORY');
  }

  const consent = input.consent;
  if (!consent || typeof consent !== 'object' || consent.publicationConsent !== true) {
    throw createServiceError(
      'Explicit publication consent is required before submitting a community report.',
      'CONSENT_REQUIRED'
    );
  }
  if (consent.locationRedactionAccepted === false) {
    throw createServiceError(
      'Location privacy policy must be accepted to publish coarse ward coordinates.',
      'CONSENT_REQUIRED'
    );
  }

  const nowMs = Number.isFinite(options.nowMs) ? options.nowMs : Date.now();
  const nowIso = new Date(nowMs).toISOString();
  const reports = getAllRawReports(storage);
  const reporterId = sanitizePlainText(input.reporterId || 'resident_local', { max: 80, multiline: false }) || 'resident_local';

  enforceSubmissionAbuseControls(
    {
      reporterKey: reporterId,
      title: input.title,
      description: input.description,
      nowMs,
    },
    reports,
    storage
  );

  const { coarseLocation, privateLocation } = buildCoarseLocation({
    ward: input.ward,
    locality: input.locality,
    approximateLandmark: input.approximateLandmark || '',
    exactCoordinates: input.exactCoordinates || null,
  });

  const validatedMedia = validateMediaAttachments(input.media || [], {
    mediaConsent: consent.mediaConsent === true,
    defaultSourceType: ACTOR_SOURCE_TYPES.CITIZEN,
    defaultKind: MEDIA_KINDS.ISSUE_EVIDENCE,
  });

  const safeTitle = redactLocationAndPii(input.title, { max: 140, multiline: false });
  const safeDescription = redactLocationAndPii(input.description, { max: 2000, multiline: true });
  const actorDisplay = redactLocationAndPii(input.reporterLabel || 'Ward Resident', { max: 60, multiline: false });

  const id = `cw_${nowMs}_${Math.random().toString(36).slice(2, 7)}`;
  const trackingCode = `CW-${Math.floor(100000 + Math.random() * 900000)}`;
  const editToken = `tok_${Math.random().toString(36).slice(2, 10)}${nowMs.toString(36)}`;

  const initialHistoryEntry = {
    id: `hist_${nowMs}_init`,
    state: CIVIC_WORK_STATES.SUBMITTED,
    timestamp: nowIso,
    sourceType: ACTOR_SOURCE_TYPES.CITIZEN,
    actorId: reporterId,
    actorLabel: actorDisplay,
    note: 'Citizen report submitted (coarse ward location published after moderation review).',
    evidenceIds: validatedMedia.map((m) => m.id),
  };

  const newRecord = {
    id,
    trackingCode,
    originType: 'citizen_report',
    reporterId,
    editToken,
    category: input.category,
    title: safeTitle,
    description: safeDescription,
    coarseLocation,
    _privateLocation: privateLocation,
    media: validatedMedia,
    consent: {
      publicationConsent: true,
      mediaConsent: Boolean(consent.mediaConsent),
      locationRedactionAccepted: consent.locationRedactionAccepted !== false,
      consentedAt: nowIso,
    },
    status: CIVIC_WORK_STATES.SUBMITTED,
    moderationStatus: MODERATION_DECISIONS.PENDING_MODERATION,
    moderationNotes: '',
    moderatedAt: null,
    moderatedBy: null,
    officialAcknowledgement: {
      acknowledged: false,
    },
    completionVerification: {
      verified: false,
    },
    clusterId: null,
    editCount: 0,
    statusHistory: [initialHistoryEntry],
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  const updated = [newRecord, ...reports];
  saveAllRawReports(updated, storage);

  const duplicateCandidates = evaluateDuplicatesForReport(newRecord, reports);

  return {
    success: true,
    id: newRecord.id,
    trackingCode: newRecord.trackingCode,
    editToken,
    moderationStatus: newRecord.moderationStatus,
    duplicateCandidates,
    publicReport: toPublicReportView(newRecord, { reporterId, editToken }, getAllClusters(storage)),
  };
}

/**
 * Allows report owner (or moderator) to edit a submitted report subject to moderation.
 * Previously approved reports re-enter moderation review when content changes.
 */
export function editCivicWorkReport(reportId, updates = {}, actorContext = {}, storage = getStorage(), options = {}) {
  const reports = getAllRawReports(storage);
  const idx = reports.findIndex((r) => r.id === reportId || r.trackingCode === reportId);
  if (idx === -1) {
    throw createServiceError(`Civic work report "${reportId}" was not found.`, 'NOT_FOUND');
  }

  const existing = reports[idx];
  const isModerator = can('civicWorks.moderate');
  const ownsByReporterId = Boolean(actorContext.reporterId && actorContext.reporterId === existing.reporterId);
  const ownsByToken = Boolean(actorContext.editToken && actorContext.editToken === existing.editToken);

  if (!isModerator && !ownsByReporterId && !ownsByToken) {
    throw createServiceError('You do not have permission to edit this report.', 'UNAUTHORIZED_EDIT');
  }

  if (existing.status === CIVIC_WORK_STATES.WITHDRAWN) {
    throw createServiceError('Withdrawn reports cannot be edited.', 'REPORT_WITHDRAWN');
  }
  if (existing.moderationStatus === MODERATION_DECISIONS.REJECTED) {
    throw createServiceError('Rejected reports cannot be edited.', 'REPORT_REJECTED');
  }
  if (existing.status === CIVIC_WORK_STATES.INDEPENDENTLY_CONFIRMED) {
    throw createServiceError('Independently confirmed reports are locked for historical integrity.', 'REPORT_LOCKED');
  }

  const nowMs = Number.isFinite(options.nowMs) ? options.nowMs : Date.now();
  const nowIso = new Date(nowMs).toISOString();

  const nextTitle = updates.title !== undefined
    ? redactLocationAndPii(updates.title, { max: 140, multiline: false })
    : existing.title;
  const nextDescription = updates.description !== undefined
    ? redactLocationAndPii(updates.description, { max: 2000, multiline: true })
    : existing.description;

  if (!nextTitle || nextTitle.length < 5) {
    throw createServiceError('Title must remain at least 5 characters long.', 'VALIDATION_ERROR');
  }
  if (!nextDescription || nextDescription.length < 10) {
    throw createServiceError('Description must remain at least 10 characters long.', 'VALIDATION_ERROR');
  }

  const nextCategory = updates.category !== undefined ? updates.category : existing.category;
  if (!VALID_CATEGORY_SET.has(nextCategory)) {
    throw createServiceError('Invalid civic infrastructure category.', 'INVALID_CATEGORY');
  }

  let nextCoarseLocation = existing.coarseLocation;
  let nextPrivateLocation = existing._privateLocation;
  if (
    updates.ward !== undefined ||
    updates.locality !== undefined ||
    updates.approximateLandmark !== undefined ||
    updates.exactCoordinates !== undefined
  ) {
    const rebuilt = buildCoarseLocation({
      ward: updates.ward ?? existing.coarseLocation.ward,
      locality: updates.locality ?? existing.coarseLocation.locality,
      approximateLandmark: updates.approximateLandmark ?? existing.coarseLocation.approximateLandmark,
      exactCoordinates:
        updates.exactCoordinates !== undefined
          ? updates.exactCoordinates
          : existing._privateLocation?.exactCoordinates ?? null,
    });
    nextCoarseLocation = rebuilt.coarseLocation;
    nextPrivateLocation = rebuilt.privateLocation;
  }

  let nextConsent = existing.consent;
  if (updates.mediaConsent !== undefined) {
    nextConsent = {
      ...existing.consent,
      mediaConsent: Boolean(updates.mediaConsent),
    };
  }

  let nextMedia = existing.media || [];
  if (updates.media !== undefined) {
    nextMedia = validateMediaAttachments(updates.media, {
      mediaConsent: nextConsent.mediaConsent === true,
      defaultSourceType: isModerator ? ACTOR_SOURCE_TYPES.MODERATOR : ACTOR_SOURCE_TYPES.CITIZEN,
    });
  } else if (updates.mediaConsent === false) {
    nextMedia = nextMedia.map((m) => ({
      ...m,
      mediaConsentGranted: false,
    }));
  }

  const changedFields = [];
  if (nextTitle !== existing.title) changedFields.push('title');
  if (nextDescription !== existing.description) changedFields.push('description');
  if (nextCategory !== existing.category) changedFields.push('category');
  if (JSON.stringify(nextCoarseLocation) !== JSON.stringify(existing.coarseLocation)) changedFields.push('location');
  if (updates.media !== undefined || updates.mediaConsent !== undefined) changedFields.push('media');

  const requiresRemoderation = !isModerator && changedFields.some((f) => f !== 'media' || updates.media !== undefined);
  const nextModerationStatus = requiresRemoderation
    ? MODERATION_DECISIONS.PENDING_MODERATION
    : existing.moderationStatus;

  const historyEntry = {
    id: `hist_${nowMs}_edit`,
    state: existing.status,
    timestamp: nowIso,
    sourceType: isModerator ? ACTOR_SOURCE_TYPES.MODERATOR : ACTOR_SOURCE_TYPES.CITIZEN,
    actorId: actorContext.reporterId || existing.reporterId,
    actorLabel: isModerator ? getVerifiedActorLabel('Moderator') : 'Ward Resident (Edit)',
    note: `Report updated (${changedFields.join(', ') || 'metadata'}).${requiresRemoderation ? ' Re-queued for moderation.' : ''}`,
    evidenceIds: [],
  };

  reports[idx] = {
    ...existing,
    category: nextCategory,
    title: nextTitle,
    description: nextDescription,
    coarseLocation: nextCoarseLocation,
    _privateLocation: nextPrivateLocation,
    consent: nextConsent,
    media: nextMedia,
    moderationStatus: nextModerationStatus,
    editCount: (existing.editCount || 0) + 1,
    updatedAt: nowIso,
    statusHistory: [...(existing.statusHistory || []), historyEntry],
  };

  saveAllRawReports(reports, storage);

  return {
    success: true,
    moderationStatus: reports[idx].moderationStatus,
    publicReport: toPublicReportView(reports[idx], actorContext, getAllClusters(storage)),
  };
}

/**
 * Allows report owner (or moderator) to withdraw a report.
 * Preserves audit history while suppressing public display of media & report details.
 */
export function withdrawCivicWorkReport(reportId, actorContext = {}, storage = getStorage(), options = {}) {
  const reports = getAllRawReports(storage);
  const idx = reports.findIndex((r) => r.id === reportId || r.trackingCode === reportId);
  if (idx === -1) {
    throw createServiceError(`Civic work report "${reportId}" was not found.`, 'NOT_FOUND');
  }

  const existing = reports[idx];
  const isModerator = can('civicWorks.moderate');
  const ownsByReporterId = Boolean(actorContext.reporterId && actorContext.reporterId === existing.reporterId);
  const ownsByToken = Boolean(actorContext.editToken && actorContext.editToken === existing.editToken);

  if (!isModerator && !ownsByReporterId && !ownsByToken) {
    throw createServiceError('You do not have permission to withdraw this report.', 'UNAUTHORIZED_WITHDRAWAL');
  }

  if (existing.status === CIVIC_WORK_STATES.WITHDRAWN) {
    return {
      success: true,
      alreadyWithdrawn: true,
      publicReport: toPublicReportView(existing, actorContext, getAllClusters(storage)),
    };
  }

  const nowMs = Number.isFinite(options.nowMs) ? options.nowMs : Date.now();
  const nowIso = new Date(nowMs).toISOString();
  const cleanReason = redactLocationAndPii(actorContext.reason || 'Withdrawn by reporter', {
    max: 240,
    multiline: false,
  });

  const historyEntry = {
    id: `hist_${nowMs}_withdraw`,
    state: CIVIC_WORK_STATES.WITHDRAWN,
    timestamp: nowIso,
    sourceType: isModerator ? ACTOR_SOURCE_TYPES.MODERATOR : ACTOR_SOURCE_TYPES.CITIZEN,
    actorId: actorContext.reporterId || existing.reporterId,
    actorLabel: isModerator ? getVerifiedActorLabel('Moderator') : 'Ward Resident (Withdrew)',
    note: `Report withdrawn: ${cleanReason}`,
    evidenceIds: [],
  };

  reports[idx] = {
    ...existing,
    status: CIVIC_WORK_STATES.WITHDRAWN,
    withdrawnAt: nowIso,
    updatedAt: nowIso,
    statusHistory: [...(existing.statusHistory || []), historyEntry],
  };

  saveAllRawReports(reports, storage);

  return {
    success: true,
    publicReport: toPublicReportView(reports[idx], actorContext, getAllClusters(storage)),
  };
}

/**
 * Privileged moderator action to approve, flag, or reject a submitted report and its media.
 */
export function moderateCivicWorkReport(
  { reportId, decision, notes = '', approveMedia = true },
  storage = getStorage(),
  options = {}
) {
  requirePermission('civicWorks.moderate');

  if (![MODERATION_DECISIONS.APPROVED, MODERATION_DECISIONS.FLAGGED, MODERATION_DECISIONS.REJECTED].includes(decision)) {
    throw createServiceError('Moderation decision must be "approved", "flagged", or "rejected".', 'INVALID_MODERATION_ACTION');
  }

  const reports = getAllRawReports(storage);
  const idx = reports.findIndex((r) => r.id === reportId || r.trackingCode === reportId);
  if (idx === -1) {
    throw createServiceError(`Civic work report "${reportId}" was not found.`, 'NOT_FOUND');
  }

  const nowMs = Number.isFinite(options.nowMs) ? options.nowMs : Date.now();
  const nowIso = new Date(nowMs).toISOString();
  const existing = reports[idx];
  const moderatorLabel = getVerifiedActorLabel('Moderator');
  const cleanNote = redactLocationAndPii(notes || `Moderation decision: ${decision}`, {
    max: 300,
    multiline: false,
  });

  const updatedMedia = (existing.media || []).map((item) => ({
    ...item,
    moderationApproved: decision === MODERATION_DECISIONS.APPROVED && Boolean(approveMedia) && Boolean(item.mediaConsentGranted),
  }));

  const nextState =
    decision === MODERATION_DECISIONS.APPROVED && existing.status === CIVIC_WORK_STATES.SUBMITTED
      ? CIVIC_WORK_STATES.UNDER_REVIEW
      : existing.status;

  const historyEntry = {
    id: `hist_${nowMs}_mod`,
    state: nextState,
    timestamp: nowIso,
    sourceType: ACTOR_SOURCE_TYPES.MODERATOR,
    actorId: moderatorLabel,
    actorLabel: moderatorLabel,
    note: cleanNote,
    evidenceIds: [],
  };

  reports[idx] = {
    ...existing,
    status: nextState,
    moderationStatus: decision,
    moderationNotes: cleanNote,
    moderatedAt: nowIso,
    moderatedBy: moderatorLabel,
    media: updatedMedia,
    updatedAt: nowIso,
    statusHistory: [...(existing.statusHistory || []), historyEntry],
  };

  saveAllRawReports(reports, storage);

  return {
    success: true,
    moderationStatus: decision,
    publicReport: toPublicReportView(reports[idx], { isModerator: true }, getAllClusters(storage)),
  };
}

/**
 * Records explicit official department acknowledgement separately from citizen reporting.
 */
export function recordOfficialAcknowledgement(
  { reportId, department, referenceNumber = '', assignedUnit = '', notes = '' },
  storage = getStorage(),
  options = {}
) {
  requirePermission('civicWorks.moderate');

  const cleanDept = redactLocationAndPii(department || '', { max: 120, multiline: false });
  if (!cleanDept || cleanDept.length < 3) {
    throw createServiceError('Official department or agency name is required.', 'VALIDATION_ERROR');
  }

  const reports = getAllRawReports(storage);
  const idx = reports.findIndex((r) => r.id === reportId || r.trackingCode === reportId);
  if (idx === -1) {
    throw createServiceError(`Civic work report "${reportId}" was not found.`, 'NOT_FOUND');
  }

  const existing = reports[idx];
  const nowMs = Number.isFinite(options.nowMs) ? options.nowMs : Date.now();
  const nowIso = new Date(nowMs).toISOString();
  const officialActor = getVerifiedActorLabel('Official Desk');
  const cleanRef = redactLocationAndPii(referenceNumber, { max: 60, multiline: false });
  const cleanUnit = redactLocationAndPii(assignedUnit, { max: 120, multiline: false });
  const cleanNote = redactLocationAndPii(
    notes || `Officially acknowledged by ${cleanDept}${cleanRef ? ` (Ref: ${cleanRef})` : ''}.`,
    { max: 300, multiline: false }
  );

  const nextState =
    existing.status === CIVIC_WORK_STATES.SUBMITTED || existing.status === CIVIC_WORK_STATES.UNDER_REVIEW
      ? CIVIC_WORK_STATES.FORWARDED
      : existing.status;

  const historyEntry = {
    id: `hist_${nowMs}_ack`,
    state: nextState,
    timestamp: nowIso,
    sourceType: ACTOR_SOURCE_TYPES.OFFICIAL,
    actorId: officialActor,
    actorLabel: `${cleanDept} (${officialActor})`,
    note: cleanNote,
    evidenceIds: [],
  };

  reports[idx] = {
    ...existing,
    status: nextState,
    officialAcknowledgement: {
      acknowledged: true,
      department: cleanDept,
      referenceNumber: cleanRef,
      assignedUnit: cleanUnit,
      acknowledgedAt: nowIso,
      acknowledgedBy: officialActor,
      notes: cleanNote,
    },
    updatedAt: nowIso,
    statusHistory: [...(existing.statusHistory || []), historyEntry],
  };

  saveAllRawReports(reports, storage);

  return {
    success: true,
    publicReport: toPublicReportView(reports[idx], { isModerator: true }, getAllClusters(storage)),
  };
}

/**
 * Transitions a civic work report's lifecycle state with timestamp + actor attribution.
 * Enforces evidence requirement before a report can reach `independently_confirmed`.
 */
export function updateCivicWorkStatus(
  {
    reportId,
    nextState,
    sourceType = ACTOR_SOURCE_TYPES.OFFICIAL,
    note = '',
    evidence = [],
    verifierLabel = '',
  },
  storage = getStorage(),
  options = {}
) {
  requirePermission('civicWorks.moderate');

  if (!VALID_STATE_SET.has(nextState) || nextState === CIVIC_WORK_STATES.WITHDRAWN) {
    throw createServiceError(`Invalid target status "${nextState}".`, 'INVALID_STATE');
  }
  if (!VALID_SOURCE_SET.has(sourceType)) {
    throw createServiceError(`Invalid actor sourceType "${sourceType}".`, 'INVALID_SOURCE_TYPE');
  }

  const reports = getAllRawReports(storage);
  const idx = reports.findIndex((r) => r.id === reportId || r.trackingCode === reportId);
  if (idx === -1) {
    throw createServiceError(`Civic work report "${reportId}" was not found.`, 'NOT_FOUND');
  }

  const existing = reports[idx];
  if (existing.status === CIVIC_WORK_STATES.WITHDRAWN) {
    throw createServiceError('Cannot update status of a withdrawn report.', 'REPORT_WITHDRAWN');
  }

  const nowMs = Number.isFinite(options.nowMs) ? options.nowMs : Date.now();
  const nowIso = new Date(nowMs).toISOString();

  const defaultKind =
    nextState === CIVIC_WORK_STATES.INDEPENDENTLY_CONFIRMED
      ? MEDIA_KINDS.INDEPENDENT_VERIFICATION
      : nextState === CIVIC_WORK_STATES.WORK_REPORTED
        ? MEDIA_KINDS.WORK_COMPLETION_PROOF
        : MEDIA_KINDS.ISSUE_EVIDENCE;

  const validatedEvidence = validateMediaAttachments(evidence || [], {
    mediaConsent: true,
    defaultSourceType: sourceType,
    defaultKind,
  });

  const allMediaAfter = [...(existing.media || []), ...validatedEvidence];
  const cleanNote = redactLocationAndPii(note, { max: 400, multiline: false });

  let nextCompletionVerification = existing.completionVerification || { verified: false };

  if (nextState === CIVIC_WORK_STATES.INDEPENDENTLY_CONFIRMED) {
    const verificationEvidence = allMediaAfter.filter(
      (item) =>
        item.kind === MEDIA_KINDS.INDEPENDENT_VERIFICATION ||
        item.kind === MEDIA_KINDS.WORK_COMPLETION_PROOF
    );

    if (verificationEvidence.length === 0) {
      throw createServiceError(
        'Cannot mark completion as independently confirmed without documented post-work verification media evidence.',
        'VERIFICATION_EVIDENCE_REQUIRED'
      );
    }

    if (!cleanNote || cleanNote.length < 12) {
      throw createServiceError(
        'Cannot mark completion as independently confirmed without a descriptive independent inspection note (min 12 characters).',
        'VERIFICATION_EVIDENCE_REQUIRED'
      );
    }

    nextCompletionVerification = {
      verified: true,
      verifiedAt: nowIso,
      verifierSourceType:
        sourceType === ACTOR_SOURCE_TYPES.OFFICIAL
          ? ACTOR_SOURCE_TYPES.COMMUNITY_VERIFIER
          : sourceType,
      verifierLabel:
        redactLocationAndPii(verifierLabel, { max: 80, multiline: false }) ||
        getVerifiedActorLabel('Community Verifier'),
      evidenceMediaIds: verificationEvidence.map((m) => m.id),
      evidenceNote: cleanNote,
    };
  }

  const historyActor =
    redactLocationAndPii(verifierLabel, { max: 80, multiline: false }) ||
    getVerifiedActorLabel(
      sourceType === ACTOR_SOURCE_TYPES.OFFICIAL
        ? 'Municipal Official'
        : sourceType === ACTOR_SOURCE_TYPES.COMMUNITY_VERIFIER
          ? 'Community Verifier'
          : 'Moderator'
    );

  const historyEntry = {
    id: `hist_${nowMs}_st`,
    state: nextState,
    timestamp: nowIso,
    sourceType,
    actorId: historyActor,
    actorLabel: historyActor,
    note: cleanNote || `Status updated to ${CIVIC_WORK_STATE_LABELS[nextState] || nextState}.`,
    evidenceIds: validatedEvidence.map((m) => m.id),
  };

  reports[idx] = {
    ...existing,
    status: nextState,
    media: allMediaAfter,
    completionVerification: nextCompletionVerification,
    updatedAt: nowIso,
    statusHistory: [...(existing.statusHistory || []), historyEntry],
  };

  saveAllRawReports(reports, storage);

  return {
    success: true,
    publicReport: toPublicReportView(reports[idx], { isModerator: true }, getAllClusters(storage)),
  };
}

function toSimilarityShape(report) {
  return {
    id: report.id,
    category: report.category,
    geoBucket: report.coarseLocation?.geoBucket || 'UNKNOWN_ZONE',
    title: report.title,
    description: `${report.title} ${report.description} ${report.coarseLocation?.locality || ''}`,
    createdAt: report.createdAt,
  };
}

function evaluateDuplicatesForReport(targetReport, allReports) {
  const targetShape = toSimilarityShape(targetReport);
  const candidates = [];

  for (const other of allReports) {
    if (!other || other.id === targetReport.id) continue;
    if (other.status === CIVIC_WORK_STATES.WITHDRAWN || other.moderationStatus === MODERATION_DECISIONS.REJECTED) {
      continue;
    }
    if (
      other.coarseLocation?.ward &&
      targetReport.coarseLocation?.ward &&
      other.coarseLocation.ward.toLowerCase() !== targetReport.coarseLocation.ward.toLowerCase()
    ) {
      continue;
    }
    const similarity = evaluatePairwiseReportSimilarity(targetShape, toSimilarityShape(other), {
      timeWindowHours: 168,
    });
    if (similarity) {
      candidates.push({
        ...similarity,
        ward: other.coarseLocation?.ward,
        locality: other.coarseLocation?.locality,
        trackingCode: other.trackingCode,
        title: redactLocationAndPii(other.title, { max: 140, multiline: false }),
      });
    }
  }

  return candidates.sort((a, b) => b.confidence - a.confidence);
}

/**
 * Surfaces possible duplicate pairs and coordinated/impact bursts for moderator review.
 */
export function findDuplicateCandidates(wardFilter = '', storage = getStorage()) {
  const reports = getAllRawReports(storage).filter(
    (r) =>
      r.status !== CIVIC_WORK_STATES.WITHDRAWN &&
      r.moderationStatus !== MODERATION_DECISIONS.REJECTED &&
      (!wardFilter || r.coarseLocation?.ward?.toLowerCase() === wardFilter.toLowerCase())
  );

  const pairs = [];
  const seenPairs = new Set();

  for (let i = 0; i < reports.length; i += 1) {
    for (let j = i + 1; j < reports.length; j += 1) {
      const repA = reports[i];
      const repB = reports[j];
      if (
        repA.coarseLocation?.ward &&
        repB.coarseLocation?.ward &&
        repA.coarseLocation.ward.toLowerCase() !== repB.coarseLocation.ward.toLowerCase()
      ) {
        continue;
      }
      const match = evaluatePairwiseReportSimilarity(toSimilarityShape(repA), toSimilarityShape(repB), {
        timeWindowHours: 168,
      });
      if (match) {
        const pairKey = [repA.id, repB.id].sort().join('::');
        if (!seenPairs.has(pairKey)) {
          seenPairs.add(pairKey);
          pairs.push({
            ...match,
            ward: repA.coarseLocation?.ward,
            locality: repA.coarseLocation?.locality,
            reportATrackingCode: repA.trackingCode,
            reportBTrackingCode: repB.trackingCode,
            reportATitle: redactLocationAndPii(repA.title, { max: 140, multiline: false }),
            reportBTitle: redactLocationAndPii(repB.title, { max: 140, multiline: false }),
          });
        }
      }
    }
  }

  const bursts = detectReportBursts(reports.map(toSimilarityShape), { burstThreshold: 3 });

  return {
    candidatePairs: pairs.sort((a, b) => b.confidence - a.confidence),
    sectorBursts: bursts,
  };
}

/**
 * Groups duplicate reports into a moderator-reviewed cluster while preserving
 * all constituent report IDs, submissions, and independent status histories.
 */
export function clusterDuplicateReports(
  { reportIds = [], primaryReportId = '', reason = 'Same physical infrastructure issue reported by multiple residents' },
  storage = getStorage(),
  options = {}
) {
  requirePermission('civicWorks.moderate');

  const uniqueIds = [...new Set(Array.isArray(reportIds) ? reportIds.filter(Boolean) : [])];
  if (uniqueIds.length < 2) {
    throw createServiceError('Select at least 2 reports to create a duplicate cluster.', 'INVALID_CLUSTER');
  }

  const reports = getAllRawReports(storage);
  const matchedReports = uniqueIds.map((id) => {
    const found = reports.find((r) => r.id === id);
    if (!found) {
      throw createServiceError(`Report "${id}" was not found for clustering.`, 'NOT_FOUND');
    }
    return found;
  });

  const resolvedPrimaryId = uniqueIds.includes(primaryReportId) ? primaryReportId : uniqueIds[0];
  const nowMs = Number.isFinite(options.nowMs) ? options.nowMs : Date.now();
  const nowIso = new Date(nowMs).toISOString();
  const moderatorLabel = getVerifiedActorLabel('Moderator');
  const clusterId = `cl_${nowMs}_${Math.random().toString(36).slice(2, 6)}`;
  const mergeRecord = confirmModeratorMerge(clusterId, uniqueIds, moderatorLabel);
  const cleanReason = redactLocationAndPii(reason, { max: 300, multiline: false });

  const newCluster = {
    ...mergeRecord,
    primaryReportId: resolvedPrimaryId,
    ward: matchedReports[0].coarseLocation?.ward || 'Unassigned Ward',
    category: matchedReports[0].category,
    reason: cleanReason,
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  const clusters = getAllClusters(storage);
  saveAllClusters([newCluster, ...clusters], storage);

  // Preserve each report's existing statusHistory intact and append clustering provenance
  const updatedReports = reports.map((rep) => {
    if (!uniqueIds.includes(rep.id)) return rep;
    const historyEntry = {
      id: `hist_${nowMs}_cluster_${rep.id.slice(-4)}`,
      state: rep.status,
      timestamp: nowIso,
      sourceType: ACTOR_SOURCE_TYPES.MODERATOR,
      actorId: moderatorLabel,
      actorLabel: moderatorLabel,
      note: `Grouped into duplicate cluster ${clusterId} (${rep.id === resolvedPrimaryId ? 'primary reference' : 'linked duplicate'}): ${cleanReason}`,
      evidenceIds: [],
    };
    return {
      ...rep,
      clusterId,
      updatedAt: nowIso,
      statusHistory: [...(rep.statusHistory || []), historyEntry],
    };
  });

  saveAllRawReports(updatedReports, storage);

  return {
    success: true,
    cluster: newCluster,
    preservedReportCount: uniqueIds.length,
    individualHistories: updatedReports
      .filter((r) => uniqueIds.includes(r.id))
      .map((r) => ({
        reportId: r.id,
        trackingCode: r.trackingCode,
        historyLength: r.statusHistory.length,
        statusHistory: r.statusHistory,
      })),
  };
}

/**
 * Reverses a duplicate merge cluster and restores independent reports cleanly.
 */
export function splitDuplicateCluster(
  { clusterId, reason = 'Separated after on-site verification confirmed distinct issues' },
  storage = getStorage(),
  options = {}
) {
  requirePermission('civicWorks.moderate');

  const clusters = getAllClusters(storage);
  const idx = clusters.findIndex((c) => c.clusterId === clusterId);
  if (idx === -1) {
    throw createServiceError(`Duplicate cluster "${clusterId}" not found.`, 'NOT_FOUND');
  }

  const nowMs = Number.isFinite(options.nowMs) ? options.nowMs : Date.now();
  const nowIso = new Date(nowMs).toISOString();
  const moderatorLabel = getVerifiedActorLabel('Moderator');
  const cleanReason = redactLocationAndPii(reason, { max: 300, multiline: false });
  const reversed = reverseModeratorMerge(clusters[idx], moderatorLabel, cleanReason);

  clusters[idx] = {
    ...reversed,
    updatedAt: nowIso,
  };
  saveAllClusters(clusters, storage);

  const reports = getAllRawReports(storage);
  const updatedReports = reports.map((rep) => {
    if (rep.clusterId !== clusterId) return rep;
    const historyEntry = {
      id: `hist_${nowMs}_split_${rep.id.slice(-4)}`,
      state: rep.status,
      timestamp: nowIso,
      sourceType: ACTOR_SOURCE_TYPES.MODERATOR,
      actorId: moderatorLabel,
      actorLabel: moderatorLabel,
      note: `Unmerged from cluster ${clusterId}: ${cleanReason}`,
      evidenceIds: [],
    };
    return {
      ...rep,
      clusterId: null,
      updatedAt: nowIso,
      statusHistory: [...(rep.statusHistory || []), historyEntry],
    };
  });

  saveAllRawReports(updatedReports, storage);

  return {
    success: true,
    cluster: clusters[idx],
  };
}

/**
 * Returns a specific cluster along with every constituent report's preserved individual history.
 */
export function getClusterDetail(clusterId, viewer = {}, storage = getStorage()) {
  const clusters = getAllClusters(storage);
  const cluster = clusters.find((c) => c.clusterId === clusterId);
  if (!cluster) return null;

  const reports = getAllRawReports(storage);
  const memberReports = reports
    .filter((r) => cluster.mergedReportIds.includes(r.id))
    .map((r) => toPublicReportView(r, viewer, clusters));

  return {
    clusterId: cluster.clusterId,
    status: cluster.status,
    primaryReportId: cluster.primaryReportId,
    ward: cluster.ward,
    category: cluster.category,
    reason: redactLocationAndPii(cluster.reason || '', { max: 300, multiline: false }),
    mergedAt: cluster.mergedAt,
    isReversible: Boolean(cluster.isReversible),
    memberCount: memberReports.length,
    memberReports,
    combinedTimeline: memberReports
      .flatMap((rep) =>
        rep.statusHistory.map((h) => ({
          ...h,
          reportId: rep.id,
          trackingCode: rep.trackingCode,
        }))
      )
      .sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp)),
  };
}

/**
 * Privileged moderator diagnostic endpoint to inspect pending queue + private location diagnostics.
 */
export function getModeratorQueue(storage = getStorage()) {
  requirePermission('civicWorks.moderate');
  const reports = getAllRawReports(storage);
  const clusters = getAllClusters(storage);

  return {
    reports: reports.map((r) => ({
      ...toPublicReportView(r, { isModerator: true }, clusters),
      hasPrivateExactCoordinates: Boolean(r._privateLocation?.exactCoordinates),
      reporterId: r.reporterId,
      moderationNotes: r.moderationNotes,
      consent: r.consent,
    })),
    pendingCount: reports.filter((r) => r.moderationStatus === MODERATION_DECISIONS.PENDING_MODERATION).length,
    clusters,
    duplicates: findDuplicateCandidates('', storage),
  };
}

/**
 * Queries the community-facing ward board grouped by ward/locality.
 * Uses coarse location by default and enforces moderation + media consent access rules.
 */
export function listPublicCivicWorkReports(filters = {}, storage = getStorage()) {
  const {
    ward = '',
    category = '',
    status = '',
    search = '',
    includeWithdrawn = false,
    viewer = {},
  } = filters;

  const rawReports = getAllRawReports(storage);
  const clusters = getAllClusters(storage);
  const isModerator = Boolean(viewer.isModerator) || can('civicWorks.moderate');
  const viewerReporterId = viewer.reporterId || '';
  const searchLower = String(search || '').trim().toLowerCase();

  const visibleRaw = rawReports.filter((rep) => {
    const isOwner = Boolean(viewerReporterId && rep.reporterId === viewerReporterId);

    if (rep.moderationStatus === MODERATION_DECISIONS.REJECTED && !isModerator) return false;
    if (rep.moderationStatus !== MODERATION_DECISIONS.APPROVED && !isModerator && !isOwner) return false;
    if (rep.status === CIVIC_WORK_STATES.WITHDRAWN && !includeWithdrawn && !isOwner && !isModerator) return false;

    if (ward && rep.coarseLocation?.ward?.toLowerCase() !== ward.toLowerCase()) return false;
    if (category && rep.category !== category) return false;
    if (status && rep.status !== status) return false;

    if (searchLower) {
      const haystack = `${rep.title} ${rep.description} ${rep.coarseLocation?.ward} ${rep.coarseLocation?.locality} ${rep.coarseLocation?.approximateLandmark} ${rep.trackingCode}`.toLowerCase();
      if (!haystack.includes(searchLower)) return false;
    }

    return true;
  });

  const publicReports = visibleRaw.map((rep) => toPublicReportView(rep, viewer, clusters));

  // Group by ward -> locality summary cleanly
  const wardMap = new Map();
  for (const rep of publicReports) {
    const wardKey = rep.coarseLocation.ward;
    if (!wardMap.has(wardKey)) {
      wardMap.set(wardKey, {
        ward: wardKey,
        localities: new Set(),
        reports: [],
        counts: {
          total: 0,
          submitted: 0,
          under_review: 0,
          forwarded: 0,
          work_reported: 0,
          independently_confirmed: 0,
          withdrawn: 0,
          officiallyAcknowledged: 0,
        },
      });
    }
    const bucket = wardMap.get(wardKey);
    bucket.localities.add(rep.coarseLocation.locality);
    bucket.reports.push(rep);
    bucket.counts.total += 1;
    if (bucket.counts[rep.status] !== undefined) {
      bucket.counts[rep.status] += 1;
    }
    if (rep.officialAcknowledgement?.acknowledged) {
      bucket.counts.officiallyAcknowledged += 1;
    }
  }

  const wardGroups = [...wardMap.values()]
    .map((g) => ({
      ...g,
      localities: [...g.localities].sort(),
    }))
    .sort((a, b) => a.ward.localeCompare(b.ward));

  const summary = {
    totalReports: publicReports.length,
    wardCount: wardGroups.length,
    officiallyAcknowledgedCount: publicReports.filter((r) => r.officialAcknowledgement?.acknowledged).length,
    workReportedPendingVerificationCount: publicReports.filter(
      (r) => r.status === CIVIC_WORK_STATES.WORK_REPORTED
    ).length,
    independentlyConfirmedCount: publicReports.filter(
      (r) => r.status === CIVIC_WORK_STATES.INDEPENDENTLY_CONFIRMED && r.completionVerification?.verified
    ).length,
    activeClusters: clusters.filter((c) => c.status === MODERATION_MERGE_STATE.CONFIRMED_MERGED),
  };

  return {
    reports: publicReports,
    wardGroups,
    summary,
    governanceNotice: BOARD_GOVERNANCE_NOTICE,
  };
}

/**
 * Seeds representative non-PII ward-level public works examples when storage is empty,
 * so residents opening the board see realistic status histories, duplicate clusters,
 * and citizen-vs-official distinctions immediately.
 */
export function ensureCivicWorksSeedData(storage = getStorage()) {
  if (!storage) return false;
  const existing = getAllRawReports(storage);
  if (existing.length > 0) return false;

  const seedReports = [
    {
      id: 'cw_seed_101',
      trackingCode: 'CW-408211',
      originType: 'citizen_report',
      reporterId: 'seed_resident_1',
      editToken: 'tok_seed_101',
      category: CIVIC_WORK_CATEGORIES.ROAD_DAMAGE,
      title: 'Deep road cave-in near 100ft Signal Crossing',
      description: 'Asphalt collapsed along the left bus lane after heavy monsoon runoff, slowing evening ambulances and two-wheelers.',
      coarseLocation: {
        ward: 'Ward 14 - Indiranagar East',
        locality: 'HAL 2nd Stage',
        approximateLandmark: 'Near 100ft Main Signal Bus Bay',
        geoBucket: 'geo_12.97_77.64',
        precision: 'grid_1km_approx',
      },
      _privateLocation: null,
      media: [
        {
          id: 'med_seed_101_a',
          kind: MEDIA_KINDS.ISSUE_EVIDENCE,
          mimeType: 'image/png',
          sizeBytes: 12400,
          url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGAAAAA4CAIAAACNJ2r1AAAAx0lEQVR4nO3ZsQ0CMQyG0esZh4Kahg1Yjz0YjJ4NcgKdf1u6J30DOK+IFGe73p9atLVPMDxAgAABAjQ4QIAAAQI0OECAAAE6N9D7cVt3RqBdlDlYaaC/abqYckCH0OSZQkCH68SMEkBFOhmjcqBSnYBRLVBAp9oIUB9QTKfUCBAgQIAAAQLUbFR3BECtQN5i/UbVw9sHzQCyUYwyJQf2qzES6Ces3vH6gYYHaA/o87poESBAgGqB2m/B4QECBAgQoMEBAgSotC8fN/rEudcBjwAAAABJRU5ErkJggg==',
          caption: 'Road surface crater photographed from public footpath',
          exifStripped: true,
          mediaConsentGranted: true,
          moderationApproved: true,
          uploadedAt: '2026-10-28T08:30:00.000Z',
          uploadedBySource: ACTOR_SOURCE_TYPES.CITIZEN,
        },
        {
          id: 'med_seed_101_v',
          kind: MEDIA_KINDS.INDEPENDENT_VERIFICATION,
          mimeType: 'image/png',
          sizeBytes: 14800,
          url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGAAAAA4CAIAAACNJ2r1AAAAjUlEQVR4nO3TsQmAUAxF0T+CE9g7g9M5lutYWTqCAwixEPlPPHDLBMKBtHGaVdS6XxAeIECAAAEKDhAgQIAABQcIECBAgIIDBAgQIEDBAQIECBCg4Nq2H0XXhb/NAwL0EKjLY38oQIAAAQIUHCBAgAABCg4QIECAAAUHCBCgd4GGdVERIECAAAEKDtBNJ680RzN5EkUVAAAAAElFTkSuQmCC',
          caption: 'Resurfaced lane inspected 5 days post repair by ward volunteer team',
          exifStripped: true,
          mediaConsentGranted: true,
          moderationApproved: true,
          uploadedAt: '2026-11-08T11:15:00.000Z',
          uploadedBySource: ACTOR_SOURCE_TYPES.COMMUNITY_VERIFIER,
        },
      ],
      consent: {
        publicationConsent: true,
        mediaConsent: true,
        locationRedactionAccepted: true,
        consentedAt: '2026-10-28T08:30:00.000Z',
      },
      status: CIVIC_WORK_STATES.INDEPENDENTLY_CONFIRMED,
      moderationStatus: MODERATION_DECISIONS.APPROVED,
      moderationNotes: 'Verified non-PII public carriageway location.',
      moderatedAt: '2026-10-28T10:00:00.000Z',
      moderatedBy: 'Ward Moderator',
      officialAcknowledgement: {
        acknowledged: true,
        department: 'Municipal Road Engineering Division (East)',
        referenceNumber: 'MRED-2026-8841',
        assignedUnit: 'Ward 14 Pothole Patching Squad',
        acknowledgedAt: '2026-10-29T09:15:00.000Z',
        acknowledgedBy: 'Executive Engineer Office',
        notes: 'Logged under urgent arterial repair schedule.',
      },
      completionVerification: {
        verified: true,
        verifiedAt: '2026-11-08T11:15:00.000Z',
        verifierSourceType: ACTOR_SOURCE_TYPES.COMMUNITY_VERIFIER,
        verifierLabel: 'Indiranagar Civic Watch Volunteer',
        evidenceMediaIds: ['med_seed_101_v'],
        evidenceNote: 'Hot-mix resurfacing flush with curb verified on site after rain.',
      },
      clusterId: 'cl_seed_408',
      editCount: 0,
      statusHistory: [
        {
          id: 'h_101_1',
          state: CIVIC_WORK_STATES.SUBMITTED,
          timestamp: '2026-10-28T08:30:00.000Z',
          sourceType: ACTOR_SOURCE_TYPES.CITIZEN,
          actorId: 'seed_resident_1',
          actorLabel: 'Ward Resident',
          note: 'Initial citizen report filed with coarse grid reference.',
          evidenceIds: ['med_seed_101_a'],
        },
        {
          id: 'h_101_2',
          state: CIVIC_WORK_STATES.FORWARDED,
          timestamp: '2026-10-29T09:15:00.000Z',
          sourceType: ACTOR_SOURCE_TYPES.OFFICIAL,
          actorId: 'official_east',
          actorLabel: 'Municipal Road Engineering Division (East)',
          note: 'Official acknowledgement MRED-2026-8841 assigned to Ward 14 Squad.',
          evidenceIds: [],
        },
        {
          id: 'h_101_3',
          state: CIVIC_WORK_STATES.WORK_REPORTED,
          timestamp: '2026-11-03T16:40:00.000Z',
          sourceType: ACTOR_SOURCE_TYPES.OFFICIAL,
          actorId: 'official_east',
          actorLabel: 'Contractor Completion Desk',
          note: 'Contractor reported bituminous patchwork completed; awaiting independent verification.',
          evidenceIds: [],
        },
        {
          id: 'h_101_4',
          state: CIVIC_WORK_STATES.INDEPENDENTLY_CONFIRMED,
          timestamp: '2026-11-08T11:15:00.000Z',
          sourceType: ACTOR_SOURCE_TYPES.COMMUNITY_VERIFIER,
          actorId: 'verifier_14',
          actorLabel: 'Indiranagar Civic Watch Volunteer',
          note: 'Hot-mix resurfacing flush with curb verified on site after rain.',
          evidenceIds: ['med_seed_101_v'],
        },
      ],
      createdAt: '2026-10-28T08:30:00.000Z',
      updatedAt: '2026-11-08T11:15:00.000Z',
    },
    {
      id: 'cw_seed_102',
      trackingCode: 'CW-408219',
      originType: 'citizen_report',
      reporterId: 'seed_resident_2',
      editToken: 'tok_seed_102',
      category: CIVIC_WORK_CATEGORIES.ROAD_DAMAGE,
      title: 'Submerged pothole cluster by 100ft bus stop',
      description: 'Multiple two-wheelers skidded near the 100ft signal bus bay pothole edge during evening peak hours.',
      coarseLocation: {
        ward: 'Ward 14 - Indiranagar East',
        locality: 'HAL 2nd Stage',
        approximateLandmark: 'Near 100ft Main Signal Bus Bay',
        geoBucket: 'geo_12.97_77.64',
        precision: 'grid_1km_approx',
      },
      _privateLocation: null,
      media: [],
      consent: {
        publicationConsent: true,
        mediaConsent: false,
        locationRedactionAccepted: true,
        consentedAt: '2026-10-28T13:10:00.000Z',
      },
      status: CIVIC_WORK_STATES.INDEPENDENTLY_CONFIRMED,
      moderationStatus: MODERATION_DECISIONS.APPROVED,
      moderationNotes: 'Linked with CW-408211 while keeping independent citizen timeline.',
      moderatedAt: '2026-10-28T15:00:00.000Z',
      moderatedBy: 'Ward Moderator',
      officialAcknowledgement: {
        acknowledged: true,
        department: 'Municipal Road Engineering Division (East)',
        referenceNumber: 'MRED-2026-8841',
        assignedUnit: 'Ward 14 Pothole Patching Squad',
        acknowledgedAt: '2026-10-29T09:15:00.000Z',
        acknowledgedBy: 'Executive Engineer Office',
        notes: 'Cross-referenced under primary ticket MRED-2026-8841.',
      },
      completionVerification: {
        verified: true,
        verifiedAt: '2026-11-08T11:15:00.000Z',
        verifierSourceType: ACTOR_SOURCE_TYPES.COMMUNITY_VERIFIER,
        verifierLabel: 'Indiranagar Civic Watch Volunteer',
        evidenceMediaIds: ['med_seed_101_v'],
        evidenceNote: 'Linked site verified repaired with CW-408211 post-work evidence.',
      },
      clusterId: 'cl_seed_408',
      editCount: 0,
      statusHistory: [
        {
          id: 'h_102_1',
          state: CIVIC_WORK_STATES.SUBMITTED,
          timestamp: '2026-10-28T13:10:00.000Z',
          sourceType: ACTOR_SOURCE_TYPES.CITIZEN,
          actorId: 'seed_resident_2',
          actorLabel: 'Evening Commuter (Resident)',
          note: 'Independent citizen safety submission for 100ft bus stop hazard.',
          evidenceIds: [],
        },
        {
          id: 'h_102_2',
          state: CIVIC_WORK_STATES.UNDER_REVIEW,
          timestamp: '2026-10-28T15:00:00.000Z',
          sourceType: ACTOR_SOURCE_TYPES.MODERATOR,
          actorId: 'mod_14',
          actorLabel: 'Ward Moderator',
          note: 'Grouped into duplicate cluster cl_seed_408 with CW-408211 while preserving original timeline.',
          evidenceIds: [],
        },
      ],
      createdAt: '2026-10-28T13:10:00.000Z',
      updatedAt: '2026-11-08T11:15:00.000Z',
    },
    {
      id: 'cw_seed_201',
      trackingCode: 'CW-519034',
      originType: 'citizen_report',
      reporterId: 'seed_resident_3',
      editToken: 'tok_seed_201',
      category: CIVIC_WORK_CATEGORIES.STREETLIGHT,
      title: 'Six consecutive LED streetlights non-functional near Market Cross',
      description: 'Entire stretch between Primary Health Centre and Market Square stays dark after 6:30 PM.',
      coarseLocation: {
        ward: 'Ward 7 - Shivajinagar Central',
        locality: 'Market Square Precinct',
        approximateLandmark: 'Stretch opposite Primary Health Centre',
        geoBucket: 'geo_12.98_77.60',
        precision: 'grid_1km_approx',
      },
      _privateLocation: null,
      media: [],
      consent: {
        publicationConsent: true,
        mediaConsent: false,
        locationRedactionAccepted: true,
        consentedAt: '2026-11-06T19:00:00.000Z',
      },
      status: CIVIC_WORK_STATES.WORK_REPORTED,
      moderationStatus: MODERATION_DECISIONS.APPROVED,
      moderationNotes: 'Approved for public board.',
      moderatedAt: '2026-11-07T08:15:00.000Z',
      moderatedBy: 'Ward Moderator',
      officialAcknowledgement: {
        acknowledged: true,
        department: 'Street Lighting & Electrical Wing',
        referenceNumber: 'SLW-2026-3109',
        assignedUnit: 'Central Feeder Maintenance Van 2',
        acknowledgedAt: '2026-11-07T11:30:00.000Z',
        acknowledgedBy: 'Assistant Executive Engineer',
        notes: 'Feeder relay fault logged for nighttime check.',
      },
      completionVerification: {
        verified: false,
      },
      clusterId: null,
      editCount: 0,
      statusHistory: [
        {
          id: 'h_201_1',
          state: CIVIC_WORK_STATES.SUBMITTED,
          timestamp: '2026-11-06T19:00:00.000Z',
          sourceType: ACTOR_SOURCE_TYPES.CITIZEN,
          actorId: 'seed_resident_3',
          actorLabel: 'Ward Resident',
          note: 'Reported evening outage across 6 poles.',
          evidenceIds: [],
        },
        {
          id: 'h_201_2',
          state: CIVIC_WORK_STATES.FORWARDED,
          timestamp: '2026-11-07T11:30:00.000Z',
          sourceType: ACTOR_SOURCE_TYPES.OFFICIAL,
          actorId: 'official_elec',
          actorLabel: 'Street Lighting & Electrical Wing',
          note: 'Acknowledged under SLW-2026-3109.',
          evidenceIds: [],
        },
        {
          id: 'h_201_3',
          state: CIVIC_WORK_STATES.WORK_REPORTED,
          timestamp: '2026-11-10T17:45:00.000Z',
          sourceType: ACTOR_SOURCE_TYPES.OFFICIAL,
          actorId: 'official_elec',
          actorLabel: 'Electrical Maintenance Desk',
          note: 'Contractor reported MCB contactor replaced. Requires evening verification evidence before confirmation.',
          evidenceIds: [],
        },
      ],
      createdAt: '2026-11-06T19:00:00.000Z',
      updatedAt: '2026-11-10T17:45:00.000Z',
    },
    {
      id: 'cw_seed_301',
      trackingCode: 'CW-602771',
      originType: 'citizen_report',
      reporterId: 'seed_resident_4',
      editToken: 'tok_seed_301',
      category: CIVIC_WORK_CATEGORIES.DRAINAGE,
      title: 'Blocked stormwater grate overflowing near Government High School gate',
      description: 'Silted catch-pit causes stagnant knee-deep water during afternoon showers right outside the school pedestrian crossing.',
      coarseLocation: {
        ward: 'Ward 22 - Koramangala South',
        locality: '3rd Block Civic Zone',
        approximateLandmark: 'Outside Govt High School East Gate',
        geoBucket: 'geo_12.93_77.62',
        precision: 'grid_1km_approx',
      },
      _privateLocation: null,
      media: [],
      consent: {
        publicationConsent: true,
        mediaConsent: false,
        locationRedactionAccepted: true,
        consentedAt: '2026-11-11T09:20:00.000Z',
      },
      status: CIVIC_WORK_STATES.SUBMITTED,
      moderationStatus: MODERATION_DECISIONS.APPROVED,
      moderationNotes: 'Coarse ward and school landmark published cleanly.',
      moderatedAt: '2026-11-11T10:05:00.000Z',
      moderatedBy: 'Ward Moderator',
      officialAcknowledgement: {
        acknowledged: false,
      },
      completionVerification: {
        verified: false,
      },
      clusterId: null,
      editCount: 0,
      statusHistory: [
        {
          id: 'h_301_1',
          state: CIVIC_WORK_STATES.SUBMITTED,
          timestamp: '2026-11-11T09:20:00.000Z',
          sourceType: ACTOR_SOURCE_TYPES.CITIZEN,
          actorId: 'seed_resident_4',
          actorLabel: 'Parent Volunteer',
          note: 'Citizen report submitted; awaiting official municipal acknowledgement.',
          evidenceIds: [],
        },
      ],
      createdAt: '2026-11-11T09:20:00.000Z',
      updatedAt: '2026-11-11T10:05:00.000Z',
    },
  ];

  const seedClusters = [
    {
      clusterId: 'cl_seed_408',
      moderatorId: 'Ward Moderator',
      mergedReportIds: ['cw_seed_101', 'cw_seed_102'],
      primaryReportId: 'cw_seed_101',
      ward: 'Ward 14 - Indiranagar East',
      category: CIVIC_WORK_CATEGORIES.ROAD_DAMAGE,
      reason: 'Both citizen reports describe the same 100ft Signal bus bay road collapse in grid geo_12.97_77.64.',
      status: MODERATION_MERGE_STATE.CONFIRMED_MERGED,
      mergedAt: '2026-10-28T15:00:00.000Z',
      createdAt: '2026-10-28T15:00:00.000Z',
      updatedAt: '2026-10-28T15:00:00.000Z',
      isReversible: true,
    },
  ];

  saveAllRawReports(seedReports, storage);
  saveAllClusters(seedClusters, storage);
  return true;
}
