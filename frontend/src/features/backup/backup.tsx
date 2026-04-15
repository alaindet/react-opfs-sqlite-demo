import { ExportDataSection } from './components/export-data-section';
import { ImportDataSection } from './components/import-data-section';
import { WipeDataSection } from './components/wipe-data-section';
import style from './backup.module.css';

export function BackupPage() {
  return (
    <>
      <h1>Backup</h1>
      <div className={style.controls}>
        <ExportDataSection />
        <ImportDataSection />
        <WipeDataSection />
      </div>
    </>
  );
}