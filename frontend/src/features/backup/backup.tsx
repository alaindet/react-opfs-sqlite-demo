import { ExportaDataSection } from './components/export-data-section';
import { ExportStreamDataSection } from './components/export-stream-data-section';
import { ImportDataSection } from './components/import-data-section';
import { WipeDataSection } from './components/wipe-data-section';
import style from './backup.module.css';
import { ExportFflateSection } from './components/export-fflate-section';

export function BackupPage() {
  return (
    <>
      <h1>Backup</h1>
      <div className={style.controls}>
        <ExportStreamDataSection />
        <ExportFflateSection />
        <ExportaDataSection />
        <WipeDataSection />
        <ImportDataSection />
      </div>
    </>
  );
}