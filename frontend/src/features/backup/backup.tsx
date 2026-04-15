import { WipeDataSection } from './components/wipe-data-section';
import { ExportFflateSection } from './components/export-fflate-section';
import { ImportFflateSection } from './components/import-fflate-section';
import style from './backup.module.css';

export function BackupPage() {
  return (
    <>
      <h1>Backup</h1>
      <div className={style.controls}>
        <ExportFflateSection />
        <ImportFflateSection />
        <WipeDataSection />
      </div>
    </>
  );
}