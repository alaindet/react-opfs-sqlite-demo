import { WORKER_PROGRESS_RESPONSE_STATE, WorkerProgressResponseState } from './progress';
import { WorkerRequest } from './request';
import { WorkerSuccessResponse } from './response';

export function workerSuccessResponse<
  T extends any = any,
  TRequest extends any = any,
>(
  request: WorkerRequest<TRequest>,
  message: string,
  data: T,
  options?: {
    progress?: WorkerProgressResponseState | null;
    binary?: boolean;
    stream?: boolean;
  },
): WorkerSuccessResponse<T> {
  return {
    requestId: request.requestId,
    requestedAt: request.requestedAt,
    respondedAt: Date.now(),
    action: request.action,
    error: false,
    progress: options?.progress ?? null,
    binary: !!options?.binary,
    stream: !!options?.stream,
    message,
    data,
  };
}

workerSuccessResponse.progressStart = <
  T extends any = any,
  TRequest extends any = any,
>(
  request: WorkerRequest<TRequest>,
  message: string,
  data: T,
) => workerSuccessResponse(request, message, data, {
  progress: WORKER_PROGRESS_RESPONSE_STATE.START,
});

workerSuccessResponse.progress = <
  T extends any = any,
  TRequest extends any = any,
>(
  request: WorkerRequest<TRequest>,
  message: string,
  data: T,
) => workerSuccessResponse(request, message, data, {
  progress: WORKER_PROGRESS_RESPONSE_STATE.NEXT,
});

workerSuccessResponse.progressEnd = <
  T extends any = any,
  TRequest extends any = any,
>(
  request: WorkerRequest<TRequest>,
  message: string,
  data: T,
) => workerSuccessResponse(request, message, data, {
  progress: WORKER_PROGRESS_RESPONSE_STATE.END,
});

workerSuccessResponse.binary = <
  T extends any = any,
  TRequest extends any = any,
>(
  request: WorkerRequest<TRequest>,
  message: string,
  data: T,
) => workerSuccessResponse(request, message, data, {
  binary: true,
});

workerSuccessResponse.stream = <
  T extends any = any,
  TRequest extends any = any,
>(
  request: WorkerRequest<TRequest>,
  message: string,
  data: T,
) => workerSuccessResponse(request, message, data, {
  stream: true,
});