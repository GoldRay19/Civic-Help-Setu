import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  CIVIC_WORK_CATEGORIES,
  CIVIC_WORK_STATES,
  MODERATION_DECISIONS,
  ACTOR_SOURCE_TYPES,
  MEDIA_KINDS,
  RATE_LIMIT_MAX_SUBMISSIONS,
  RATE_LIMIT_WINDOW_MS,
  redactLocationAndPii,
  isSafeMediaUrl,
  submitCivicWorkReport,
  editCivicWorkReport,
  withdrawCivicWorkReport,
  moderateCivicWorkReport,
  recordOfficialAcknowledgement,
  updateCivicWorkStatus,
  findDuplicateCandidates,
  clusterDuplicateReports,
  splitDuplicateCluster,
  getClusterDetail,
  getModeratorQueue,
  listPublicCivicWorkReports,
  ensureCivicWorksSeedData,
} from './civicWorksBoardService';
import { PermissionDeniedError, setCurrentActor } from './accessControl';

const createMemoryStorage = () => {
  const store = new Map();
  return {
    getItem: vi.fn((k) => (store.has(k) ? store.get(k) : null)),
    setItem: vi.fn((k, v) => store.set(k, String(v))),
    removeItem: vi.fn((k) => store.delete(k)),
    _map: store,
  };
};

const ADMIN_ACTOR = { id: 'admin-1', role: 'admin', username: 'WardModerator' };
const CITIZEN_ACTOR = { id: 'cit-1', role: 'citizen', username: 'AshaResident' };

const VALID_IMAGE = {
  mimeType: 'image/jpeg',
  sizeBytes: 42000,
  url: 'https://example.org/civic-evidence/pothole-after-rain.jpg',
  caption: 'Flooded bus bay pothole near Ward 14 main crossing',
};

const BASE_SUBMISSION = {
  reporterId: 'resident_a',
  reporterLabel: 'Asha N.',
  category: CIVIC_WORK_CATEGORIES.ROAD_DAMAGE,
  ward: 'Ward 14 - Indiranagar East',
  locality: 'HAL 2nd Stage',
  approximateLandmark: 'Near 100ft Signal Bus Bay',
  exactCoordinates: { lat: 12.971612, lng: 77.641234 },
  title: 'Collapsed tarmac around bus stop bay',
  description: 'A deep pothole formed near the pedestrian crossing causing vehicles to swerve dangerously.',
  media: [VALID_IMAGE],
  consent: {
    publicationConsent: true,
    mediaConsent: true,
    locationRedactionAccepted: true,
  },
};

describe('Ward-Level Public Works & Civic Asset Follow-Up Service (#649)', () => {
  let storage;

  beforeEach(() => {
    storage = createMemoryStorage();
    setCurrentActor(null);
  });

  afterEach(() => {
    setCurrentActor(null);
  });

  describe('Location redaction & coarse location default', () => {
    it('strips exact reporter coordinates and computes ~1km geoBucket for public view', () => {
      const result = submitCivicWorkReport(BASE_SUBMISSION, storage, { nowMs: 1_700_000_000_000 });
      const serializedPublic = JSON.stringify(result.publicReport);

      expect(result.publicReport.coarseLocation.geoBucket).toBe('geo_12.97_77.64');
      expect(result.publicReport.coarseLocation.ward).toBe('Ward 14 - Indiranagar East');
      expect(result.publicReport.locationRedactedByDefault).toBe(true);
      expect(result.publicReport._privateLocation).toBeUndefined();
      expect(serializedPublic).not.toContain('12.971612');
      expect(serializedPublic).not.toContain('77.641234');
    });

    it('scrubs inline decimal coords, DMS coords, emails, phones, and Aadhaar from public text fields', () => {
      const cleaned = redactLocationAndPii(
        'Meet at 12.971612, 77.641234 or 12°58\'12"N lat: 12.9716 lon=77.6412, call 9876543210, email test@example.org, Aadhaar 1234-5678-9012'
      );

      expect(cleaned).not.toContain('12.971612');
      expect(cleaned).not.toContain('77.641234');
      expect(cleaned).not.toContain('12°58');
      expect(cleaned).not.toContain('9876543210');
      expect(cleaned).not.toContain('test@example.org');
      expect(cleaned).not.toContain('1234-5678-9012');
    });

    it('exposes exact coordinate presence flag only to moderators via requirePermission', () => {
      submitCivicWorkReport(BASE_SUBMISSION, storage, { nowMs: 1_700_000_000_000 });

      setCurrentActor(CITIZEN_ACTOR);
      expect(() => getModeratorQueue(storage)).toThrow(PermissionDeniedError);

      setCurrentActor(ADMIN_ACTOR);
      const modQueue = getModeratorQueue(storage);
      expect(modQueue.reports[0].hasPrivateExactCoordinates).toBe(true);
      expect(JSON.stringify(modQueue.reports[0])).not.toContain('12.971612');
    });
  });

  describe('Consent, media validation, and media access control', () => {
    it('requires explicit publication consent and media consent when photos are attached', () => {
      expect(() =>
        submitCivicWorkReport(
          { ...BASE_SUBMISSION, consent: { publicationConsent: false, mediaConsent: true } },
          storage
        )
      ).toThrow(/publication consent/i);

      expect(() =>
        submitCivicWorkReport(
          { ...BASE_SUBMISSION, consent: { publicationConsent: true, mediaConsent: false } },
          storage
        )
      ).toThrow(/media publication consent/i);
    });

    it('rejects dangerous MIME types (SVG/HTML), javascript URLs, and oversized files', () => {
      expect(isSafeMediaUrl('javascript:alert(1)')).toBe(false);
      expect(isSafeMediaUrl('data:image/svg+xml;base64,PHN2Zz4=')).toBe(false);
      expect(isSafeMediaUrl('https://example.org/diagram.svg')).toBe(false);
      expect(isSafeMediaUrl('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA')).toBe(true);

      expect(() =>
        submitCivicWorkReport(
          {
            ...BASE_SUBMISSION,
            media: [{ mimeType: 'image/svg+xml', sizeBytes: 1200, url: 'https://example.org/x.svg' }],
          },
          storage
        )
      ).toThrow(/Only JPEG, PNG, and WebP/i);

      expect(() =>
        submitCivicWorkReport(
          {
            ...BASE_SUBMISSION,
            media: [{ ...VALID_IMAGE, sizeBytes: 8 * 1024 * 1024 }],
          },
          storage
        )
      ).toThrow(/safety limit/i);
    });

    it('gates public media behind moderation approval and consent while preserving owner/moderator preview', () => {
      const submitted = submitCivicWorkReport(BASE_SUBMISSION, storage, { nowMs: 1_700_000_000_000 });

      // Anonymous public board hides pending report & media completely
      const publicBeforeMod = listPublicCivicWorkReports({}, storage);
      expect(publicBeforeMod.reports).toHaveLength(0);

      // Even if inspected with report view as third-party citizen, media is withheld until approved
      const moderatorViewPending = listPublicCivicWorkReports(
        { viewer: { isModerator: true } },
        storage
      );
      expect(moderatorViewPending.reports[0].media).toHaveLength(1);

      // Approve report WITH approveMedia: false -> report text public, media redacted!
      setCurrentActor(ADMIN_ACTOR);
      moderateCivicWorkReport(
        { reportId: submitted.id, decision: MODERATION_DECISIONS.APPROVED, approveMedia: false },
        storage,
        { nowMs: 1_700_000_100_000 }
      );
      setCurrentActor(null);

      const publicWithheldMedia = listPublicCivicWorkReports({}, storage);
      expect(publicWithheldMedia.reports).toHaveLength(1);
      expect(publicWithheldMedia.reports[0].media).toHaveLength(0);
      expect(publicWithheldMedia.reports[0].redactedMediaCount).toBe(1);

      // Approve report WITH approveMedia: true -> consented media becomes visible with EXIF stripped
      setCurrentActor(ADMIN_ACTOR);
      moderateCivicWorkReport(
        { reportId: submitted.id, decision: MODERATION_DECISIONS.APPROVED, approveMedia: true },
        storage,
        { nowMs: 1_700_000_200_000 }
      );
      setCurrentActor(null);

      const publicApproved = listPublicCivicWorkReports({}, storage);
      expect(publicApproved.reports[0].media).toHaveLength(1);
      expect(publicApproved.reports[0].media[0].exifStripped).toBe(true);
    });
  });

  describe('Abuse controls & RBAC protection', () => {
    it('enforces per-reporter rate limit window and identical duplicate spam block', () => {
      const t0 = 1_700_000_000_000;

      // Submit same exact text twice within cooldown
      submitCivicWorkReport({ ...BASE_SUBMISSION, media: [] }, storage, { nowMs: t0 });
      expect(() =>
        submitCivicWorkReport({ ...BASE_SUBMISSION, media: [] }, storage, { nowMs: t0 + 1000 })
      ).toThrow(/identical report was submitted recently/i);

      // Distinct reports up to RATE_LIMIT_MAX_SUBMISSIONS
      for (let i = 1; i < RATE_LIMIT_MAX_SUBMISSIONS; i += 1) {
        submitCivicWorkReport(
          {
            ...BASE_SUBMISSION,
            media: [],
            title: `Distinct hazard #${i} in Ward 14`,
            description: `Detailed observation number ${i} about broken drainage slab on lane ${i}.`,
          },
          storage,
          { nowMs: t0 + i * 2000 }
        );
      }

      // Next submission within window must be rate-limited
      expect(() =>
        submitCivicWorkReport(
          {
            ...BASE_SUBMISSION,
            media: [],
            title: 'Overflow hazard beyond rate cap',
            description: 'Another unique report submitted inside the 15-minute window.',
          },
          storage,
          { nowMs: t0 + 20_000 }
        )
      ).toThrow(/rate limit reached/i);

      // After rate-limit window expires, submissions resume cleanly
      expect(() =>
        submitCivicWorkReport(
          {
            ...BASE_SUBMISSION,
            media: [],
            title: 'Allowed post-window report',
            description: 'Submitted cleanly after the 15-minute cooldown period elapsed.',
          },
          storage,
          { nowMs: t0 + RATE_LIMIT_WINDOW_MS + 5000 }
        )
      ).not.toThrow();
    });

    it('blocks spam links, HTML/script XSS injection, and unauthorized privileged actions', () => {
      expect(() =>
        submitCivicWorkReport(
          {
            ...BASE_SUBMISSION,
            media: [],
            description: 'Check https://a.example https://b.example https://c.example for prizes',
          },
          storage
        )
      ).toThrow(/external links/i);

      const created = submitCivicWorkReport(
        {
          ...BASE_SUBMISSION,
          media: [],
          title: 'Broken curb <script>alert(1)</script> drainage',
          description: 'Overflowing drain <img src=x onerror=alert(1)> blocking pedestrian path.',
        },
        storage,
        { nowMs: 1_700_000_000_000 }
      );
      expect(created.publicReport.title).not.toContain('<script>');
      expect(created.publicReport.description).not.toContain('onerror=');

      // Unauthenticated and citizen callers cannot forge moderation, official ack, or status updates
      setCurrentActor(CITIZEN_ACTOR);
      expect(() =>
        recordOfficialAcknowledgement({ reportId: created.id, department: 'Fake Dept' }, storage)
      ).toThrow(PermissionDeniedError);
      expect(() =>
        updateCivicWorkStatus({ reportId: created.id, nextState: CIVIC_WORK_STATES.FORWARDED }, storage)
      ).toThrow(PermissionDeniedError);
      expect(() => clusterDuplicateReports({ reportIds: [created.id, 'cw_2'] }, storage)).toThrow(
        PermissionDeniedError
      );
      expect(() => splitDuplicateCluster({ clusterId: 'cl_1' }, storage)).toThrow(PermissionDeniedError);
    });
  });

  describe('Citizen edit & withdraw, official acknowledgement, verification gate & history', () => {
    it('supports citizen edit (re-queued for moderation) and withdrawal (hides media, preserves audit history)', () => {
      const created = submitCivicWorkReport(BASE_SUBMISSION, storage, { nowMs: 1_700_000_000_000 });

      setCurrentActor(ADMIN_ACTOR);
      moderateCivicWorkReport(
        { reportId: created.id, decision: MODERATION_DECISIONS.APPROVED, approveMedia: true },
        storage,
        { nowMs: 1_700_000_100_000 }
      );
      setCurrentActor(null);

      // Other resident cannot edit or withdraw
      expect(() =>
        editCivicWorkReport(created.id, { title: 'Tampered title here' }, { reporterId: 'intruder' }, storage)
      ).toThrow(/do not have permission/i);
      expect(() =>
        withdrawCivicWorkReport(created.id, { reporterId: 'intruder' }, storage)
      ).toThrow(/do not have permission/i);

      // Owner edit succeeds, appends history entry, and re-queues for moderation
      const edited = editCivicWorkReport(
        created.id,
        { title: 'Updated pothole width measurement on 100ft bay' },
        { reporterId: 'resident_a' },
        storage,
        { nowMs: 1_700_000_200_000 }
      );
      expect(edited.moderationStatus).toBe(MODERATION_DECISIONS.PENDING_MODERATION);
      expect(edited.publicReport.isEdited).toBe(true);
      expect(edited.publicReport.statusHistory.some((h) => h.note.includes('Updated') || h.note.includes('updated'))).toBe(true);

      // Owner withdrawal suppresses public media & details while keeping timeline timestamps
      const withdrawn = withdrawCivicWorkReport(
        created.id,
        { reporterId: 'resident_a', reason: 'Temporarily cordoned by residents' },
        storage,
        { nowMs: 1_700_000_300_000 }
      );
      expect(withdrawn.publicReport.status).toBe(CIVIC_WORK_STATES.WITHDRAWN);
      expect(withdrawn.publicReport.media).toHaveLength(0);
      expect(withdrawn.publicReport.mediaAccessStatus).toBe('restricted_withdrawn');

      // Audit view preserves full timestamp + attribution trail
      const withAudit = listPublicCivicWorkReports({ includeWithdrawn: true }, storage);
      // Pending withdrawn won't leak publicly unless moderator or owner views
      const ownerAudit = listPublicCivicWorkReports(
        { includeWithdrawn: true, viewer: { reporterId: 'resident_a' } },
        storage
      );
      expect(ownerAudit.reports[0].statusHistory.length).toBeGreaterThanOrEqual(4);
      expect(ownerAudit.reports[0].title).toBe('[Withdrawn Citizen Report]');
      expect(withAudit.reports).toHaveLength(0);
    });

    it('distinguishes citizen report from official acknowledgement and gates independent confirmation on evidence', () => {
      const created = submitCivicWorkReport({ ...BASE_SUBMISSION, media: [] }, storage, {
        nowMs: 1_700_000_000_000,
      });

      setCurrentActor(ADMIN_ACTOR);
      moderateCivicWorkReport(
        { reportId: created.id, decision: MODERATION_DECISIONS.APPROVED },
        storage,
        { nowMs: 1_700_000_100_000 }
      );
      setCurrentActor(null);

      // Before official acknowledgement
      let board = listPublicCivicWorkReports({}, storage);
      expect(board.reports[0].verification.code).toBe('unverified_citizen_report');
      expect(board.reports[0].officialAcknowledgement.acknowledged).toBe(false);

      // Record official acknowledgement
      setCurrentActor(ADMIN_ACTOR);
      recordOfficialAcknowledgement(
        {
          reportId: created.id,
          department: 'BBMP East Road Works',
          referenceNumber: 'RW-2026-991',
          assignedUnit: 'Ward 14 Squad',
        },
        storage,
        { nowMs: 1_700_000_200_000 }
      );

      // Mark work_reported (official/contractor claim, NOT independently confirmed)
      updateCivicWorkStatus(
        {
          reportId: created.id,
          nextState: CIVIC_WORK_STATES.WORK_REPORTED,
          sourceType: ACTOR_SOURCE_TYPES.OFFICIAL,
          note: 'Contractor claims patching completed on Thursday afternoon.',
        },
        storage,
        { nowMs: 1_700_000_300_000 }
      );

      board = listPublicCivicWorkReports({}, storage);
      expect(board.reports[0].status).toBe(CIVIC_WORK_STATES.WORK_REPORTED);
      expect(board.reports[0].verification.code).toBe('work_claimed_unverified');
      expect(board.reports[0].completionVerification.verified).toBe(false);

      // Attempting independently_confirmed WITHOUT verification media MUST fail closed
      expect(() =>
        updateCivicWorkStatus(
          {
            reportId: created.id,
            nextState: CIVIC_WORK_STATES.INDEPENDENTLY_CONFIRMED,
            sourceType: ACTOR_SOURCE_TYPES.COMMUNITY_VERIFIER,
            note: 'Verified finished cleanly',
            evidence: [],
          },
          storage,
          { nowMs: 1_700_000_400_000 }
        )
      ).toThrow(/without documented post-work verification media evidence/i);

      // With documented independent evidence + descriptive observation, succeeds cleanly
      updateCivicWorkStatus(
        {
          reportId: created.id,
          nextState: CIVIC_WORK_STATES.INDEPENDENTLY_CONFIRMED,
          sourceType: ACTOR_SOURCE_TYPES.COMMUNITY_VERIFIER,
          verifierLabel: 'Ward 14 Resident Audit Pair',
          note: 'Inspected resurfaced asphalt flush with storm drain lip.',
          evidence: [
            {
              kind: MEDIA_KINDS.INDEPENDENT_VERIFICATION,
              mimeType: 'image/png',
              sizeBytes: 18500,
              url: 'https://example.org/civic-evidence/repaired-road.png',
              caption: 'Post-repair inspection photo showing level asphalt',
            },
          ],
        },
        storage,
        { nowMs: 1_700_000_500_000 }
      );

      const finalBoard = listPublicCivicWorkReports({}, storage);
      const report = finalBoard.reports[0];
      expect(report.status).toBe(CIVIC_WORK_STATES.INDEPENDENTLY_CONFIRMED);
      expect(report.completionVerification.verified).toBe(true);
      expect(report.statusHistory.map((h) => h.sourceType)).toEqual([
        ACTOR_SOURCE_TYPES.CITIZEN,
        ACTOR_SOURCE_TYPES.MODERATOR,
        ACTOR_SOURCE_TYPES.OFFICIAL,
        ACTOR_SOURCE_TYPES.OFFICIAL,
        ACTOR_SOURCE_TYPES.COMMUNITY_VERIFIER,
      ]);
      expect(report.statusHistory.every((h) => Boolean(h.timestamp) && Boolean(h.actorLabel))).toBe(true);
    });

    it('detects duplicate candidates, clusters duplicates without losing individual histories, and splits cleanly', () => {
      const r1 = submitCivicWorkReport(
        {
          ...BASE_SUBMISSION,
          reporterId: 'res_one',
          media: [],
          title: 'Severe pothole outside 100ft Signal bus bay',
          description: 'Deep asphalt pothole outside 100ft Signal bus bay trapping water and traffic.',
        },
        storage,
        { nowMs: 1_700_000_000_000 }
      );

      const r2 = submitCivicWorkReport(
        {
          ...BASE_SUBMISSION,
          reporterId: 'res_two',
          media: [],
          title: 'Bus bay 100ft Signal deep pothole hazard',
          description: 'Vehicles swerving around deep asphalt pothole outside 100ft Signal bus bay.',
        },
        storage,
        { nowMs: 1_700_000_600_000 }
      );

      setCurrentActor(ADMIN_ACTOR);
      moderateCivicWorkReport({ reportId: r1.id, decision: MODERATION_DECISIONS.APPROVED }, storage);
      moderateCivicWorkReport({ reportId: r2.id, decision: MODERATION_DECISIONS.APPROVED }, storage);
      recordOfficialAcknowledgement(
        { reportId: r1.id, department: 'Roads Dept', referenceNumber: 'RD-01' },
        storage
      );

      const candidates = findDuplicateCandidates('Ward 14 - Indiranagar East', storage);
      expect(candidates.candidatePairs.length).toBeGreaterThanOrEqual(1);
      expect(candidates.candidatePairs[0].originalReportsPreserved).toBe(true);

      const merged = clusterDuplicateReports(
        { reportIds: [r1.id, r2.id], primaryReportId: r1.id, reason: 'Identical bus bay crater' },
        storage,
        { nowMs: 1_700_000_900_000 }
      );
      expect(merged.preservedReportCount).toBe(2);
      expect(merged.individualHistories.find((h) => h.reportId === r1.id).historyLength).toBeGreaterThanOrEqual(4);
      expect(merged.individualHistories.find((h) => h.reportId === r2.id).historyLength).toBeGreaterThanOrEqual(3);

      const detail = getClusterDetail(merged.cluster.clusterId, {}, storage);
      expect(detail.memberReports).toHaveLength(2);
      expect(detail.memberReports.find((m) => m.id === r1.id).statusHistory.length).toBeGreaterThanOrEqual(4);
      expect(detail.memberReports.find((m) => m.id === r2.id).statusHistory.length).toBeGreaterThanOrEqual(3);
      expect(detail.combinedTimeline.length).toBeGreaterThanOrEqual(7);

      // Reversible split restores independent unclustered status while preserving timelines
      splitDuplicateCluster({ clusterId: merged.cluster.clusterId, reason: 'Two adjacent craters' }, storage);
      const afterSplit = listPublicCivicWorkReports({}, storage);
      expect(afterSplit.reports.every((r) => r.clusterId === null)).toBe(true);
      expect(afterSplit.wardGroups[0].ward).toBe('Ward 14 - Indiranagar East');
    });

    it('seeds representative ward data cleanly when ensureCivicWorksSeedData is invoked', () => {
      expect(ensureCivicWorksSeedData(storage)).toBe(true);
      expect(ensureCivicWorksSeedData(storage)).toBe(false);

      const seededBoard = listPublicCivicWorkReports({}, storage);
      expect(seededBoard.wardGroups.length).toBeGreaterThanOrEqual(3);
      expect(seededBoard.summary.independentlyConfirmedCount).toBeGreaterThanOrEqual(1);
      expect(seededBoard.summary.workReportedPendingVerificationCount).toBeGreaterThanOrEqual(1);
    });
  });
});
