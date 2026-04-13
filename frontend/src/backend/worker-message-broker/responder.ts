import { WORKER_PROGRESS_RESPONSE_STATE, WorkerProgressResponseState } from './progress';
import { WorkerRequest } from './request';
import { WorkerErrorResponse, WorkerResponse, WorkerSuccessResponse } from './response';

export class WorkerResponder {

  #request!: WorkerRequest;

  constructor(request: WorkerRequest) {
    this.#request = request;
  }

  success<T extends any = any>(
    message: string,
    data: T,
    options?: {
      progress?: WorkerProgressResponseState | null;
      binary?: boolean;
      stream?: boolean;
    },
  ): WorkerSuccessResponse<T> {
    return {
      requestId: this.#request.requestId,
      requestedAt: this.#request.requestedAt,
      respondedAt: Date.now(),
      action: this.#request.action,
      error: false,
      progress: options?.progress ?? null,
      binary: !!options?.binary,
      stream: !!options?.stream,
      message,
      data,
    };
  }

  asyncSuccess<T extends any = any>(
    message: string,
    data: T,
  ): Promise<WorkerResponse<T>> {
    return Promise.resolve(this.success(message, data));
  }

  error<T extends any = any>(
    message: string,
    data: T,
  ): WorkerErrorResponse<T> {
    return {
      requestId: this.#request.requestId,
      requestedAt: this.#request.requestedAt,
      respondedAt: Date.now(),
      action: this.#request.action,
      error: true,
      message,
      data,
    };
  }

  asyncError<T extends any = any>(
    message: string,
    data: T,
  ): Promise<WorkerErrorResponse<T>> {
    return Promise.resolve(this.error(message, data));
  }
}