export type WorkerRequest<T extends any = any> = {
  requestId: string;
  requestedAt: number;
  action: string;
  data: T;
};

export type WorkerBaseResponse<T extends any = any> = {
  requestId: string;
  requestedAt: number;
  respondedAt: number;
  action: string;
  message: string;
  data: T;
};

export type WorkerSuccessResponse<T extends any = any> = (
  WorkerBaseResponse<T> & { error: false }
);

export type WorkerErrorResponse<T extends any = any> = (
  WorkerBaseResponse<T> & { error: true }
);

export type WorkerResponse<T extends any = any> = (
  | WorkerSuccessResponse<T>
  | WorkerErrorResponse<T>
);

export function createOkWorkerResponse<
  TRequest extends any = any,
  TResponse extends any = any,
>(
  request: WorkerRequest<TRequest>,
  message: string,
  data: TResponse,
): WorkerSuccessResponse<TResponse> {
  return {
    requestId: request.requestId,
    requestedAt: request.requestedAt,
    respondedAt: Date.now(),
    action: request.action,
    error: false,
    message,
    data,
  };
}

export function createErrWorkerResponse<
  TRequest extends any = any,
  TResponse extends any = any,
>(
  request: WorkerRequest<TRequest>,
  message: string,
  data: TResponse,
): WorkerErrorResponse<TResponse> {
  return {
    requestId: request.requestId,
    requestedAt: request.requestedAt,
    respondedAt: Date.now(),
    action: request.action,
    error: true,
    message,
    data,
  };
}

export class WorkerResponder {

  #worker!: DedicatedWorkerGlobalScope;
  #request!: WorkerRequest;

  constructor(
    worker: DedicatedWorkerGlobalScope,
    request: WorkerRequest,
  ) {
    this.#worker = worker;
    this.#request = request;
  }

  success<T extends any = any>(message: string, data: T): void {
    const res = createOkWorkerResponse(this.#request, message, data);
    this.dispatch(res);
  }

  error<T extends any = any>(message: string, data: T): void {
    const res = createErrWorkerResponse(this.#request, message, data);
    this.dispatch(res);
  }

  dispatch<T extends any = any>(response: WorkerResponse<T>) {
    this.#worker.postMessage(response);
  }
}

export class WorkerClient {
  #worker!: Worker;
  #pendingRequests = new Map<string, {
    resolve: (value: any) => void;
    reject: (value: any) => void;
  }>();

  constructor(worker: Worker) {
    this.#worker = worker;
    this.#worker.onmessage = this.#handleMessage.bind(this);
  }

  request<
    TRequest extends any = any,
    TResponse extends any = any
  >(action: string, data?: TRequest): Promise<TResponse> {
    const requestId = crypto.randomUUID();

    return new Promise((resolve, reject) => {
      this.#pendingRequests.set(requestId, { resolve, reject });

      this.#worker.postMessage({
        requestId,
        requestedAt: Date.now(),
        action,
        data,
      });
    });
  }

  #handleMessage(event: MessageEvent<WorkerResponse>) {
    const res = event.data;
    const promise = this.#pendingRequests.get(res.requestId);

    if (!promise) {
      return;
    }

    if (res.error) {
      promise.reject(res);
    } else {
      promise.resolve(res);
    }

    this.#pendingRequests.delete(res.requestId);
  }
}
