import { WorkerProgressResponseState } from './progress';

export type WorkerBaseResponse<T extends any = any> = {
  requestId: string; // Unique UUID
  requestedAt: number; // Datetime of request
  respondedAt: number; // Datetime of response
  action: string; // Action name, ex.: "recipes/getAll"
  message: string; // The response message, safe for UI alerts
  data: T; // The actual returned data
};

export type WorkerSuccessResponse<T extends any = any> = (
  WorkerBaseResponse<T> & {
    error: false;
    binary: boolean; // Is a binary transferable object?
    stream: boolean; // Is a stream transferable object?

    // If set, this is a multi-message response
    // The response is one, but multiple "progress" responses can be sent via
    // See WorkerRequest.onProgress, if provided
    progress: WorkerProgressResponseState | null;
  }
);

export type WorkerErrorResponse<T extends any = any> = (
  WorkerBaseResponse<T> & { error: true }
);

export type WorkerResponse<T extends any = any> = (
  | WorkerSuccessResponse<T>
  | WorkerErrorResponse<T>
);