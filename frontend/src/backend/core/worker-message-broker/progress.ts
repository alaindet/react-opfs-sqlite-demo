export const WORKER_PROGRESS_RESPONSE_STATE = {
  START: 'start',
  NEXT: 'next',
  END: 'end',
} as const;

export type WorkerProgressResponseState = typeof WORKER_PROGRESS_RESPONSE_STATE[
  keyof typeof WORKER_PROGRESS_RESPONSE_STATE
];