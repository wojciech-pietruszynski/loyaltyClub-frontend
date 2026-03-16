import type { FormEvent } from 'react';
import type { Translator } from '../types/ui';

type ToolsSectionProps = {
  t: Translator;
  importing: boolean;
  setImportFile: (file: File | null) => void;
  handleImportCustomers: (e: FormEvent) => Promise<void>;
};

export function ToolsSection({
  t,
  importing,
  setImportFile,
  handleImportCustomers,
}: ToolsSectionProps) {
  return (
    <div className="card" style={{ maxWidth: '700px', margin: '0 auto' }}>
      <h2>{t('toolsTitle')}</h2>
      <p>{t('toolsDescription')}</p>
      <form onSubmit={(event) => { void handleImportCustomers(event); }}>
        <div className="form-group">
          <label>{t('csvFile')}</label>
          <input className="input" type="file" accept=".csv,text/csv" onChange={(event) => setImportFile(event.target.files?.[0] ?? null)} required />
        </div>
        <div className="form-actions">
          <button className="btn btn-primary" type="submit" disabled={importing}>
            {importing ? t('importing') : t('importCsv')}
          </button>
        </div>
      </form>
    </div>
  );
}
