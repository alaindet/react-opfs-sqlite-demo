export const DATA_TRANSFER_PROGRESS_STATUS = {
  START: 'dataTransfer/start',
  NEXT: 'dataTransfer/next',
  END: 'dataTransfer/end',
};

export type DataTransferProgressState = typeof DATA_TRANSFER_PROGRESS_STATUS[
  keyof typeof DATA_TRANSFER_PROGRESS_STATUS
];

export type DataTransferProgressStart = {
  name: typeof DATA_TRANSFER_PROGRESS_STATUS.START;
  current: number;
  total: number;
  percent: number;
};

export type DataTransferProgressNext = {
  name: typeof DATA_TRANSFER_PROGRESS_STATUS.NEXT;
  current: number;
  total: number;
  percent: number;
};

export type DataTransferProgressEnd = {
  name: typeof DATA_TRANSFER_PROGRESS_STATUS.END;
  current: number;
  total: number;
  percent: number;
};

export type DataTransferProgress = (
  | DataTransferProgressStart
  | DataTransferProgressNext
  | DataTransferProgressEnd
);

export function createDataTransferProgress(total: number) {
  let current = 0;

  return {
    start: (): DataTransferProgressStart => ({
      name: 'DATA_TRANSFER_PROGRESS_START',
      current: 0,
      total,
      percent: 0,
    }),
    next: (): DataTransferProgress => {
      if (current < total) {
        current++;
      }

      return {
        name: 'DATA_TRANSFER_PROGRESS',
        current,
        total,
        percent: Math.round(100 * (current / total)),
      };
    },
    end: (): DataTransferProgressEnd => ({
      name: 'DATA_TRANSFER_PROGRESS_END',
      current: total,
      total,
      percent: 100,
    }),
  };
}