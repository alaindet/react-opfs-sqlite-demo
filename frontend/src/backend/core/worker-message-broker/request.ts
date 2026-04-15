import { WorkerResponse } from '../worker-message-broker';

export type WorkerRequest<
  T extends any = any,
  TProgress extends any = any
> = {
  requestId: string;
  requestedAt: number;
  action: string;
  onProgress?: (res: WorkerResponse<TProgress>) => void;
  data: T;
};