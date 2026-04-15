export const WORKER_STATE = {
  BOOTSTRAPPING: 'bootstrapping',
  CATCHING_UP: 'catchingup',
  RUNNING: 'running',
} as const;

export type WorkerState = typeof WORKER_STATE[
  keyof typeof WORKER_STATE
];