const STORAGE_KEY = 'civicbridge_applications';

export const STATUS_LABELS = {
  submitted: 'Submitted',
  'in-progress': 'In Progress',
  'action-required': 'Action Required',
  completed: 'Completed',
};

export const DATE_FALLBACK = 'Not available';

export const normalizeStatus = (status) =>
  Object.prototype.hasOwnProperty.call(STATUS_LABELS, status) ? status : 'submitted';

export const getStatusLabel = (status) => STATUS_LABELS[normalizeStatus(status)];

// Turns free text or a Date into "Mon D, YYYY". Anything unparseable gives the fallback.
export const normalizeDate = (value, fallback = DATE_FALLBACK) => {
  if (value === null || value === undefined) return fallback;
  const text = String(value).trim();
  if (!text) return fallback;
  // Without a year, Date() silently guesses 2001, so treat that as unusable.
  if (!(value instanceof Date) && !/\b\d{4}\b/.test(text)) return fallback;
  const parsed = value instanceof Date ? value : new Date(text);
  if (Number.isNaN(parsed.getTime())) return fallback;
  return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

// Stage the application is currently sitting on. Stages before it are done.
export const getCurrentStageIndex = (status) => {
  const s = normalizeStatus(status);
  if (s === 'completed') return 3;
  if (s === 'in-progress' || s === 'action-required') return 1;
  return 0;
};

// Single place that turns a status into stage flags, so they cannot contradict it.
export const applyStageFlags = (stages, status) => {
  const s = normalizeStatus(status);
  const list = Array.isArray(stages) ? stages : [];
  return list.map((stage, idx) => {
    // eslint-disable-next-line no-unused-vars
    const { completed, inProgress, actionRequired, ...rest } = stage;
    const isStepAfterSubmit = idx === 1;
    const done = s === 'completed' || (s === 'submitted' ? idx === 0 : idx < 1);
    const active = s === 'in-progress' && isStepAfterSubmit;
    const action = s === 'action-required' && isStepAfterSubmit;
    const out = { ...rest, completed: done };
    if (active) out.inProgress = true;
    if (action) out.actionRequired = true;
    return out;
  });
};

const normalizeApplication = (app) => {
  if (!app || typeof app !== 'object') return app;
  const status = normalizeStatus(app.status);
  return {
    ...app,
    status,
    appliedDate: normalizeDate(app.appliedDate),
    estimatedCompletion: normalizeDate(app.estimatedCompletion),
    currentStageIndex: getCurrentStageIndex(status),
    pendingAction: status === 'action-required' ? app.pendingAction || null : null,
    stages: applyStageFlags(app.stages, status),
  };
};

const DEFAULT_APPLICATIONS = [
  {
    id: 'SRV-98234710',
    serviceId: 'income-certificate',
    serviceName: 'Income Certificate',
    category: 'Finance',
    applicantName: 'Ramesh Patel',
    appliedDate: 'Oct 12, 2026',
    estimatedCompletion: 'Oct 22, 2026',
    status: 'in-progress',
    currentStageIndex: 1,
    notes: [
      { id: 'n1', text: 'Submitted salary slips from employer via Tahsildar portal.', date: 'Oct 12, 2026 • 10:30 AM' },
      { id: 'n2', text: 'Revenue inspector scheduled site verification visit.', date: 'Oct 15, 2026 • 02:00 PM' },
    ],
    linkedDocs: [
      { id: 'd1', name: 'Salary_Slip_Aug2026.pdf', size: '1.2 MB', linkedAt: 'Oct 12, 2026' },
      { id: 'd2', name: 'Aadhaar_Card_Copy.pdf', size: '850 KB', linkedAt: 'Oct 12, 2026' },
    ],
    pendingAction: null,
    stages: [
      {
        title: 'Application Submitted',
        description: 'Application and supporting income documents received.',
        timestamp: 'Oct 12, 2026 • 10:15 AM',
        completed: true,
      },
      {
        title: 'Document & Revenue Verification',
        description: 'Tahsildar office is verifying salary slips and revenue records.',
        timestamp: 'Oct 14, 2026 • 03:30 PM',
        completed: false,
        inProgress: true,
      },
      {
        title: 'Digital Signature & Approval',
        description: 'Revenue Inspector approval and digital seal generation.',
        timestamp: 'Pending verification',
        completed: false,
      },
      {
        title: 'Certificate Issuance',
        description: 'Final certificate ready for direct citizen download.',
        timestamp: 'Estimated Oct 22',
        completed: false,
      },
    ],
  },
  {
    id: 'SRV-41829304',
    serviceId: 'driving-license',
    serviceName: 'Driving License',
    category: 'Transport',
    applicantName: 'Sunita Sharma',
    appliedDate: 'Sep 24, 2026',
    estimatedCompletion: 'Oct 10, 2026',
    status: 'completed',
    currentStageIndex: 3,
    notes: [
      { id: 'n3', text: 'Track test cleared with zero negative marks on 8-track.', date: 'Oct 02, 2026 • 03:15 PM' },
    ],
    linkedDocs: [
      { id: 'd3', name: 'Learner_License_Extract.pdf', size: '540 KB', linkedAt: 'Sep 24, 2026' },
      { id: 'd4', name: 'Medical_Certificate_Form1A.pdf', size: '720 KB', linkedAt: 'Sep 24, 2026' },
    ],
    pendingAction: null,
    stages: [
      {
        title: 'Application & Learner Pass Recorded',
        description: 'Learner license validity authenticated at RTO portal.',
        timestamp: 'Sep 24, 2026 • 11:00 AM',
        completed: true,
      },
      {
        title: 'Driving Skill Test Passed',
        description: 'Track examination cleared with RTO motor inspector.',
        timestamp: 'Oct 02, 2026 • 02:45 PM',
        completed: true,
      },
      {
        title: 'Smart Card Endorsement',
        description: 'Biometric chip encoded and approved by RTO officer.',
        timestamp: 'Oct 06, 2026 • 04:10 PM',
        completed: true,
      },
      {
        title: 'Dispatched via Speed Post',
        description: 'Physical smart card dispatched. Tracking: SP-IN948271.',
        timestamp: 'Oct 09, 2026 • 09:20 AM',
        completed: true,
      },
    ],
  },
  {
    id: 'SRV-77319482',
    serviceId: 'birth-certificate',
    serviceName: 'Birth Certificate',
    category: 'Certificates',
    applicantName: 'Aarav Kumar',
    appliedDate: 'Oct 19, 2026',
    estimatedCompletion: 'Nov 02, 2026',
    status: 'action-required',
    currentStageIndex: 1,
    notes: [
      { id: 'n4', text: 'Hospital discharge certificate requires clearer stamp copy.', date: 'Oct 20, 2026 • 11:30 AM' },
    ],
    linkedDocs: [
      { id: 'd5', name: 'Hospital_Discharge_Summary.pdf', size: '920 KB', linkedAt: 'Oct 19, 2026' },
    ],
    pendingAction: {
      title: 'Upload Clearer Hospital Birth Record',
      description: 'The municipal registrar rejected hospital discharge slip due to illegible physician seal. Please upload a re-scanned copy.',
      deadline: 'Oct 28, 2026',
      documentRequired: 'Hospital Birth Card (Seal visible)',
    },
    stages: [
      {
        title: 'Application Submitted',
        description: 'Institutional birth record uploaded from registrar registry.',
        timestamp: 'Oct 19, 2026 • 09:00 AM',
        completed: true,
      },
      {
        title: 'Municipal Record Matching',
        description: 'Verification with hospital birth registers.',
        timestamp: 'Action Needed: Re-upload seal copy',
        completed: false,
        actionRequired: true,
      },
      {
        title: 'Registrar Authentication',
        description: 'Final sign-off by Municipal Health Officer.',
        timestamp: 'Pending verification',
        completed: false,
      },
      {
        title: 'QR-Verified Certificate Generation',
        description: 'Digitally signed certificate issued.',
        timestamp: 'Estimated Nov 02',
        completed: false,
      },
    ],
  },
];

export const getApplications = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_APPLICATIONS));
      return DEFAULT_APPLICATIONS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return DEFAULT_APPLICATIONS;
    // Old saved data may carry stage flags that contradict the status, so repair on read.
    return parsed.filter((a) => a && a.id).map(normalizeApplication);
  } catch (err) {
    console.error('Failed to parse applications from storage', err);
    return DEFAULT_APPLICATIONS;
  }
};

export const getApplicationById = (searchId) => {
  if (!searchId) return null;
  const clean = searchId.trim().toUpperCase();
  const all = getApplications();
  return all.find((app) => app.id.toUpperCase() === clean) || null;
};

export const createApplication = ({ serviceId, serviceName, category, applicantName, aadhaarId }) => {
  const all = getApplications();
  const dateStr = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const randomSuffix = Math.floor(10000000 + Math.random() * 90000000);
  const newId = `SRV-${randomSuffix}`;

  const estDate = new Date();
  estDate.setDate(estDate.getDate() + 15);
  const estDateStr = estDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const newApp = {
    id: newId,
    serviceId: serviceId || 'custom-service',
    serviceName: serviceName || 'Civic Service Request',
    category: category || 'General',
    applicantName: applicantName || 'Citizen Applicant',
    appliedDate: dateStr,
    estimatedCompletion: estDateStr,
    status: 'submitted',
    currentStageIndex: 0,
    aadhaarMasked: aadhaarId ? `XXXX-XXXX-${aadhaarId.slice(-4)}` : 'XXXX-XXXX-8921',
    notes: [
      { id: `n-${Date.now()}`, text: 'Application initiated digitally via Civic Help Setu.', date: `${dateStr} • Just now` },
    ],
    linkedDocs: [],
    pendingAction: null,
    stages: [
      {
        title: 'Application Submitted',
        description: 'Application submitted digitally via Civic Help Setu Fast-Track.',
        timestamp: `${dateStr} • Just now`,
        completed: true,
      },
      {
        title: 'Document & Identity Verification',
        description: 'Verifying submitted identity proof and prerequisite documents.',
        timestamp: 'Estimated within 3 business days',
        completed: false,
      },
      {
        title: 'Competent Authority Assessment',
        description: 'Departmental review and approval clearance.',
        timestamp: 'Pending document check',
        completed: false,
      },
      {
        title: 'Final Certificate / Service Issuance',
        description: 'Digital certificate or dispatch tracking notification.',
        timestamp: `Target completion by ${estDateStr}`,
        completed: false,
      },
    ],
  };

  const updated = [newApp, ...all];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return newApp;
};

export const addManualApplication = ({
  referenceId,
  serviceName,
  category = 'General',
  appliedDate,
  estimatedCompletion,
  status: rawStatus = 'submitted',
  initialNote = '',
  applicantName = 'Citizen Applicant',
}) => {
  const all = getApplications();
  const cleanId = referenceId.trim().toUpperCase();

  const status = normalizeStatus(rawStatus);
  const appliedStr = normalizeDate(appliedDate);
  const estimatedStr = normalizeDate(estimatedCompletion);
  const hasEstimate = estimatedStr !== DATE_FALLBACK;

  const stages = applyStageFlags([
    {
      title: 'Application Submitted',
      description: 'Submitted at district portal / physical center.',
      timestamp: appliedStr,
    },
    {
      title: 'Document Verification',
      description: 'Scrutiny of applicant credentials and attachments.',
      timestamp:
        status === 'submitted' ? 'Pending initiation'
          : status === 'action-required' ? 'Action needed'
          : status === 'in-progress' ? 'In review'
          : 'Cleared',
    },
    {
      title: 'Departmental Processing',
      description: 'Officer evaluation and statutory approvals.',
      timestamp: status === 'completed' ? 'Cleared' : 'Pending prior stages',
    },
    {
      title: 'Final Issuance / Dispatch',
      description: 'Ready for collection, digital download, or courier delivery.',
      timestamp: status === 'completed' ? 'Issued' : (hasEstimate ? `Est: ${estimatedStr}` : 'Pending'),
    },
  ], status);

  const currentStageIndex = getCurrentStageIndex(status);

  const newApp = {
    id: cleanId,
    serviceId: cleanId.toLowerCase().replace(/[^a-z0-9]/g, '-'),
    serviceName: serviceName.trim(),
    category,
    applicantName,
    appliedDate: appliedStr,
    estimatedCompletion: estimatedStr,
    status,
    currentStageIndex,
    notes: initialNote
      ? [{ id: `n-${Date.now()}`, text: initialNote, date: `${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}` }]
      : [],
    linkedDocs: [],
    pendingAction: status === 'action-required' ? {
      title: 'Additional Documentation or Clarification Needed',
      description: 'Department requested supplementary records for reference ' + cleanId,
      deadline: 'Within 7 business days',
      documentRequired: 'Supplementary Proof Document',
    } : null,
    stages,
  };

  const updated = [newApp, ...all.filter((a) => a.id.toUpperCase() !== cleanId)];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return newApp;
};

export const addNoteToApplication = (appId, noteText) => {
  const all = getApplications();
  const target = all.find((a) => a.id.toUpperCase() === appId.toUpperCase());
  if (!target) return null;

  const newNote = {
    id: `n-${Date.now()}`,
    text: noteText.trim(),
    date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
  };

  target.notes = [...(target.notes || []), newNote];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  return target;
};

export const linkDocumentToApplication = (appId, doc) => {
  const all = getApplications();
  const target = all.find((a) => a.id.toUpperCase() === appId.toUpperCase());
  if (!target) return null;

  const newDoc = {
    id: `doc-${Date.now()}`,
    name: doc.name || 'Citizen_Attachment.pdf',
    size: doc.size || '750 KB',
    linkedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
  };

  target.linkedDocs = [...(target.linkedDocs || []), newDoc];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  return target;
};

export const unlinkDocumentFromApplication = (appId, docId) => {
  const all = getApplications();
  const target = all.find((a) => a.id.toUpperCase() === appId.toUpperCase());
  if (!target) return null;

  target.linkedDocs = (target.linkedDocs || []).filter((d) => d.id !== docId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  return target;
};

export const resolveApplicationPendingAction = (appId, resolutionNote = '') => {
  const all = getApplications();
  const target = all.find((a) => a.id.toUpperCase() === appId.toUpperCase());
  if (!target) return null;

  // Nothing to resolve if the application is not waiting on the citizen.
  if (target.status !== 'action-required' && !target.pendingAction) return target;

  target.pendingAction = null;
  target.status = 'in-progress';
  target.currentStageIndex = getCurrentStageIndex('in-progress');
  target.stages = applyStageFlags(target.stages, 'in-progress');
  if (target.stages[1]) target.stages[1].timestamp = 'Action resolved • Resumed verification';

  if (resolutionNote) {
    target.notes = [
      ...(target.notes || []),
      {
        id: `n-${Date.now()}`,
        text: `Action Resolved: ${resolutionNote}`,
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      },
    ];
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  return target;
};

export const getTrackingMetrics = () => {
  const all = getApplications();
  return {
    total: all.length,
    inProgress: all.filter((a) => a.status === 'in-progress').length,
    actionRequired: all.filter((a) => a.status === 'action-required').length,
    completed: all.filter((a) => a.status === 'completed').length,
    submitted: all.filter((a) => a.status === 'submitted').length,
  };
};
