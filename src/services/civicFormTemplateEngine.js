import { CIVIC_FORM_TEMPLATES } from '../data/civicFormTemplates';

/**
 * Returns available templates filtered by service or category
 */
export function getAvailableFormTemplates(serviceCategory = 'all') {
  if (!serviceCategory || serviceCategory === 'all') {
    return CIVIC_FORM_TEMPLATES;
  }
  const cat = serviceCategory.toLowerCase();
  return CIVIC_FORM_TEMPLATES.filter(tpl => {
    return (
      tpl.applicableServices.includes('all') ||
      tpl.applicableServices.some(s => cat.includes(s)) ||
      tpl.category.toLowerCase() === cat
    );
  });
}

/**
 * Fills in placeholders in the template text with user values and system defaults
 */
export function populateFormTemplate(templateId, values = {}) {
  const template = CIVIC_FORM_TEMPLATES.find(t => t.id === templateId) || CIVIC_FORM_TEMPLATES[0];
  if (!template) return '';

  const now = new Date();
  const context = {
    date: now.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }),
    year: `${now.getFullYear()}-${now.getFullYear() + 1}`,
    ...values
  };

  let rendered = template.templateText;
  for (const field of template.fields) {
    const val = context[field.key] !== undefined && context[field.key] !== ''
      ? context[field.key]
      : field.default || `[${field.label}]`;
    const regex = new RegExp(`{{${field.key}}}`, 'g');
    rendered = rendered.replace(regex, val);
  }

  // Replace system date and year
  rendered = rendered.replace(/{{date}}/g, context.date);
  rendered = rendered.replace(/{{year}}/g, context.year);

  return {
    templateId: template.id,
    title: template.title,
    act: template.act,
    filledContent: rendered,
    rawValues: context
  };
}

/**
 * Generates clean printable HTML for browser print dialog or saving as PDF
 */
export function generatePrintableHtml(filledForm) {
  if (!filledForm || !filledForm.filledContent) return '';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${filledForm.title || 'Civic Application Form'}</title>
  <style>
    body { font-family: 'Times New Roman', Times, serif; font-size: 14pt; line-height: 1.6; padding: 40px; color: #000; }
    h2 { text-align: center; font-size: 16pt; margin-bottom: 4px; text-transform: uppercase; }
    .subtitle { text-align: center; font-size: 11pt; font-style: italic; margin-bottom: 24px; }
    pre { font-family: inherit; white-space: pre-wrap; word-wrap: break-word; }
    .footer { margin-top: 40px; border-top: 1px dashed #666; padding-top: 10px; font-size: 10pt; color: #555; }
  </style>
</head>
<body>
  <h2>${filledForm.title}</h2>
  <div class="subtitle">${filledForm.act || 'Official Administrative Representation'}</div>
  <pre>${filledForm.filledContent}</pre>
  <div class="footer">Generated via Civic Help Setu Application Drafting Assistant</div>
</body>
</html>`;
}
