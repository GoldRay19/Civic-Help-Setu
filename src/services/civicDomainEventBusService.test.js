import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  CIVIC_EVENT_TYPE,
  OUTBOX_STATUS,
  EVENT_BUS_STATE,
  sanitizeEventPayload,
  stageOutboxEvent,
  registerEventConsumer,
  unregisterEventConsumer,
  dispatchPendingOutboxEvents,
  replayDeadLetterEvent,
  getEventBusHealthMetrics,
  getAdministrativeAuditLog,
  _resetEventBusInternalStores,
} from './civicDomainEventBusService';

describe('civicDomainEventBusService', () => {
  beforeEach(() => {
    _resetEventBusInternalStores();
  });

  describe('Event Staging, Idempotency & PII Sanitization', () => {
    it('stages a valid domain event in the outbox', () => {
      const event = stageOutboxEvent({
        eventType: CIVIC_EVENT_TYPE.APPLICATION_SUBMITTED,
        aggregateId: 'app_789456',
        producerDomain: 'APPLICATION_PORTAL',
        payload: {
          serviceId: 'BIRTH_CERT_TN',
          applicantName: 'Ramesh Kumar',
          phone: '9876543210',
          email: 'ramesh@example.com',
          aadhaarNumber: '1234-5678-9012',
          panNumber: 'ABCDE1234F',
        },
      });

      expect(event.eventId).toBeDefined();
      expect(event.status).toBe(OUTBOX_STATUS.PENDING_DELIVERY);
      expect(event.aggregateId).toBe('app_789456');

      // Verifies PII scrubbing
      expect(event.payload.applicantName).toBe('CITIZEN_REDACTED');
      expect(event.payload.phone).toBe('XXXXXX_REDACTED');
      expect(event.payload.email).toBe('REDACTED@DOMAIN.LOCAL');
      expect(event.payload.aadhaarNumber).toBe('XXXX-XXXX-REDACTED');
      expect(event.payload.panNumber).toBe('XXXXX_REDACTED');
    });

    it('enforces idempotency key and rejects duplicate event staging', () => {
      const input = {
        eventType: CIVIC_EVENT_TYPE.GRIEVANCE_LODGED,
        aggregateId: 'grv_112233',
        idempotencyKey: 'IDEMP_CLIENT_UUID_9999',
        payload: { grievanceCategory: 'MUNICIPAL_WATER' },
      };

      const event1 = stageOutboxEvent(input);
      const event2 = stageOutboxEvent(input);

      expect(event1.eventId).toBe(event2.eventId);
      const metrics = getEventBusHealthMetrics();
      expect(metrics.outboxDepth).toBe(1);
    });

    it('throws error when staging an invalid event type', () => {
      expect(() => {
        stageOutboxEvent({
          eventType: 'UNSUPPORTED_RANDOM_EVENT',
          aggregateId: 'agg_1',
        });
      }).toThrow('Invalid or unsupported eventType');
    });

    it('sanitizes event payloads standalone', () => {
      const scrubbed = sanitizeEventPayload({
        applicantName: 'Secret Name',
        phone: '1234567890',
        aadhaarNumber: '1111-2222-3333',
        authTokens: 'SECRET_JWT_TOKEN',
      });
      expect(scrubbed.applicantName).toBe('CITIZEN_REDACTED');
      expect(scrubbed.phone).toBe('XXXXXX_REDACTED');
      expect(scrubbed.aadhaarNumber).toBe('XXXX-XXXX-REDACTED');
      expect(scrubbed.authTokens).toBeUndefined();
    });
  });

  describe('Consumer Subscriptions & Dispatching', () => {
    it('dispatches events to registered consumers and records delivery', async () => {
      const mockHandler = vi.fn().mockResolvedValue();

      registerEventConsumer('notification_service', [CIVIC_EVENT_TYPE.APPLICATION_SUBMITTED], mockHandler);

      const event = stageOutboxEvent({
        eventType: CIVIC_EVENT_TYPE.APPLICATION_SUBMITTED,
        aggregateId: 'app_100',
        payload: { serviceId: 'INCOME_CERT' },
      });

      const summary = await dispatchPendingOutboxEvents();

      expect(summary.dispatchedCount).toBe(1);
      expect(summary.deliveredCount).toBe(1);
      expect(mockHandler).toHaveBeenCalledTimes(1);
      expect(mockHandler).toHaveBeenCalledWith(expect.objectContaining({ eventId: event.eventId }));

      const metrics = getEventBusHealthMetrics();
      expect(metrics.deliveredCount).toBe(1);
      expect(metrics.pendingCount).toBe(0);
    });

    it('returns EMPTY state when no pending events exist', async () => {
      const summary = await dispatchPendingOutboxEvents();
      expect(summary.status).toBe(EVENT_BUS_STATE.EMPTY);
      expect(summary.dispatchedCount).toBe(0);
    });

    it('respects tenant scope during dispatch', async () => {
      const tenantAHandler = vi.fn().mockResolvedValue();
      const tenantBHandler = vi.fn().mockResolvedValue();

      registerEventConsumer('consumer_tenant_a', [CIVIC_EVENT_TYPE.GRIEVANCE_LODGED], tenantAHandler, {
        tenantScope: 'MUNICIPALITY_PUNE',
      });
      registerEventConsumer('consumer_tenant_b', [CIVIC_EVENT_TYPE.GRIEVANCE_LODGED], tenantBHandler, {
        tenantScope: 'MUNICIPALITY_MUMBAI',
      });

      stageOutboxEvent({
        eventType: CIVIC_EVENT_TYPE.GRIEVANCE_LODGED,
        aggregateId: 'grv_pune_1',
        tenantId: 'MUNICIPALITY_PUNE',
      });

      await dispatchPendingOutboxEvents();

      expect(tenantAHandler).toHaveBeenCalledTimes(1);
      expect(tenantBHandler).not.toHaveBeenCalled();
    });

    it('unregisters consumers cleanly', () => {
      registerEventConsumer('temp_consumer', [CIVIC_EVENT_TYPE.DEFICIENCY_NOTICE_ISSUED], () => {});
      expect(getEventBusHealthMetrics().activeConsumersCount).toBe(1);

      unregisterEventConsumer('temp_consumer');
      expect(getEventBusHealthMetrics().activeConsumersCount).toBe(0);
    });
  });

  describe('Retries, Dead-Letter Queue (DLQ) & Poison Message Isolation', () => {
    it('retries failing consumers with exponential backoff before dead-lettering', async () => {
      const failingHandler = vi.fn().mockRejectedValue(new Error('Downstream service gateway timeout 504'));

      registerEventConsumer('fragile_notifier', [CIVIC_EVENT_TYPE.DEFICIENCY_NOTICE_ISSUED], failingHandler);

      const event = stageOutboxEvent({
        eventType: CIVIC_EVENT_TYPE.DEFICIENCY_NOTICE_ISSUED,
        aggregateId: 'def_404',
        maxAttempts: 2,
      });

      // Attempt 1 -> fails and schedules retry
      const run1 = await dispatchPendingOutboxEvents();
      expect(run1.failedCount).toBe(1);
      expect(run1.deadLetterCount).toBe(0);

      // Fast-forward backoff
      event.nextAttemptAt = new Date(Date.now() - 1000).toISOString();

      // Attempt 2 -> fails and reaches maxAttempts (2), routing to DLQ
      const run2 = await dispatchPendingOutboxEvents();
      expect(run2.deadLetterCount).toBe(1);

      const metrics = getEventBusHealthMetrics();
      expect(metrics.deadLetterCount).toBe(1);
      expect(metrics.status).toBe('ATTENTION_REQUIRED');
    });

    it('does not block subsequent events when one event is dead-lettered', async () => {
      const conditionalHandler = vi.fn().mockImplementation((ev) => {
        if (ev.aggregateId === 'poison_aggregate') {
          throw new Error('Poison message schema corrupt');
        }
        return Promise.resolve();
      });

      registerEventConsumer('civic_worker', [CIVIC_EVENT_TYPE.DOCUMENT_VERIFIED], conditionalHandler);

      // Event 1 (poison)
      const poison = stageOutboxEvent({
        eventType: CIVIC_EVENT_TYPE.DOCUMENT_VERIFIED,
        aggregateId: 'poison_aggregate',
        maxAttempts: 1,
      });

      // Event 2 (healthy)
      const healthy = stageOutboxEvent({
        eventType: CIVIC_EVENT_TYPE.DOCUMENT_VERIFIED,
        aggregateId: 'healthy_aggregate',
        maxAttempts: 1,
      });

      await dispatchPendingOutboxEvents({ batchSize: 5 });

      expect(poison.status).toBe(OUTBOX_STATUS.DEAD_LETTERED);
      expect(healthy.status).toBe(OUTBOX_STATUS.DELIVERED);
    });
  });

  describe('Administrative Replay & Audit Trail', () => {
    it('replays a dead-lettered event and logs administrative audit record', async () => {
      let shouldFail = true;
      const healingHandler = vi.fn().mockImplementation(() => {
        if (shouldFail) throw new Error('Temporary outage');
        return Promise.resolve();
      });

      registerEventConsumer('healing_worker', [CIVIC_EVENT_TYPE.FEE_RECEIPT_ISSUED], healingHandler);

      const event = stageOutboxEvent({
        eventType: CIVIC_EVENT_TYPE.FEE_RECEIPT_ISSUED,
        aggregateId: 'receipt_999',
        maxAttempts: 1,
      });

      await dispatchPendingOutboxEvents();
      expect(event.status).toBe(OUTBOX_STATUS.DEAD_LETTERED);

      // Fix underlying service
      shouldFail = false;

      // Administrative operator replays the event
      const replayResult = await replayDeadLetterEvent(
        `dlq_${event.eventId}`,
        'admin_officer_kaur',
        'Downstream database recovered; retrying failed fee receipt publication.'
      );

      expect(replayResult.replayedEventId).toBe(event.eventId);
      expect(replayResult.dispatchResult.deliveredCount).toBe(1);

      // Verifies audit trail
      const auditLog = getAdministrativeAuditLog();
      expect(auditLog.length).toBe(1);
      expect(auditLog[0].action).toBe('REPLAY_DEAD_LETTER_EVENT');
      expect(auditLog[0].operatorId).toBe('admin_officer_kaur');
      expect(auditLog[0].justification).toContain('Downstream database recovered');
    });

    it('rejects replay when operatorId or justification is missing', async () => {
      await expect(replayDeadLetterEvent('dlq_invalid', '', 'justification')).rejects.toThrow('Operator ID is required');
      await expect(replayDeadLetterEvent('dlq_invalid', 'admin_1', '')).rejects.toThrow('Valid operational justification is required');
    });

    it('rejects replay for non-existent dead-letter ID', async () => {
      await expect(replayDeadLetterEvent('dlq_nonexistent', 'admin_1', 'Reason')).rejects.toThrow(
        "Dead-letter record 'dlq_nonexistent' not found"
      );
    });
  });
});
