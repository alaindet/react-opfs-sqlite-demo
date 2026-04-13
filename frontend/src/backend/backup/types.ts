export type ExportProgress = {
  name: 'EXPORT_PROGRESS';
  currentFile: number;
  totalFiles: number;
  percent: number;
};

export type ExportProgressEnd = {
  name: 'EXPORT_PROGRESS_END';
  currentFile: number;
  totalFiles: number;
  percent: number;
};