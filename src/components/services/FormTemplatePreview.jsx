import { useState } from 'react';
import { Copy, Printer, Check, Download, FileText } from 'lucide-react';
import { generatePrintableHtml } from '../../services/civicFormTemplateEngine';

export default function FormTemplatePreview({ filledForm }) {
  const [copied, setCopied] = useState(false);

  if (!filledForm) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(filledForm.filledContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    const html = generatePrintableHtml(filledForm);
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 300);
    }
  };

  const handleDownloadTxt = () => {
    const blob = new Blob([filledForm.filledContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filledForm.templateId || 'civic-application'}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ marginTop: '16px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <div>
          <span style={{ fontWeight: 700, fontSize: '0.92rem', color: '#1e293b' }}>Application Preview</span>
          <span style={{ fontSize: '0.78rem', color: '#64748b', marginLeft: '8px' }}>({filledForm.act})</span>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={handleCopy}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              fontSize: '0.8rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            {copied ? <Check size={14} color="#16a34a" /> : <Copy size={14} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
          <button
            type="button"
            onClick={handleDownloadTxt}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              fontSize: '0.8rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Download size={14} />
            <span>Text</span>
          </button>
          <button
            type="button"
            onClick={handlePrint}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              border: 'none',
              background: '#2563eb',
              color: '#ffffff',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Printer size={14} />
            <span>Print Form</span>
          </button>
        </div>
      </div>

      <div
        style={{
          background: '#f8fafc',
          padding: '16px',
          borderRadius: '8px',
          border: '1px solid #cbd5e1',
          fontFamily: 'Courier New, Courier, monospace',
          fontSize: '0.84rem',
          lineHeight: '1.5',
          whiteSpace: 'pre-wrap',
          maxHeight: '320px',
          overflowY: 'auto',
          color: '#0f172a'
        }}
      >
        {filledForm.filledContent}
      </div>
    </div>
  );
}
