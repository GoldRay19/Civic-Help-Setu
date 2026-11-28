import { classifyRequirement } from './requirementTypes.js';

const key = (label) => label.trim().replace(/\s+/g, ' ').toLowerCase();

/**
 * Lines up the document requirements of the compared services. Labels are matched on their exact
 * wording (ignoring case and extra spaces); two guides that word the same paper differently stay
 * separate rows, because guessing that they are equal could mislead someone preparing documents.
 *
 * @returns {{ shared: object[], partial: object[], withoutList: object[] }}
 *   `shared` rows are listed by every service that has a document list.
 */
export function compareRequirements(services = []) {
  const list = Array.isArray(services) ? services.filter(Boolean) : [];
  const rows = new Map();
  const withDocuments = [];
  const withoutList = [];

  for (const service of list) {
    const documents = (Array.isArray(service.documents) ? service.documents : []).filter(
      (d) => typeof d === 'string' && d.trim()
    );
    if (documents.length === 0) {
      withoutList.push(service);
      continue;
    }
    withDocuments.push(service);
    for (const document of documents) {
      const id = key(document);
      if (!rows.has(id)) rows.set(id, { id, label: document.trim(), entries: [] });
      const row = rows.get(id);
      if (row.entries.some((entry) => entry.serviceId === service.id)) continue;
      const { type, condition } = classifyRequirement(document, service.documentRequirements);
      row.entries.push({ serviceId: service.id, serviceName: service.name, type, condition });
    }
  }

  const all = [...rows.values()];
  // "Shared" only means something when there are at least two lists to share between.
  const isShared = (row) => withDocuments.length > 1 && row.entries.length === withDocuments.length;
  return {
    shared: all.filter(isShared),
    partial: all.filter((row) => !isShared(row)),
    withoutList,
  };
}
