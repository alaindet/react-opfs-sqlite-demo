import { ExportaDataSection } from './components/export-data-section';
import { ExportStreamDataSection } from './components/export-stream-data-section';
import { ImportDataSection } from './components/import-data-section';
import { WipeDataSection } from './components/wipe-data-section';
import style from './backup.module.css';

export function BackupPage() {
  return (
    <>
      <h1>Backup</h1>
      <div className={style.controls}>
        <ExportStreamDataSection />
        <ExportaDataSection />
        <WipeDataSection />
        <ImportDataSection />
      </div>
    </>
  );
}