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
    progress: boolean; // Is a multi-message response? See WorkerRequest.onProgress
  }
);

export type WorkerErrorResponse<T extends any = any> = (
  WorkerBaseResponse<T> & { error: true }
);

export type WorkerResponse<T extends any = any> = (
  | WorkerSuccessResponse<T>
  | WorkerErrorResponse<T>
);

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

export type WorkerRequestHandler<
  TRequest extends any = any,
  TResponse extends any = any
> = (
  req: WorkerRequest<TRequest>,
  res: WorkerResponder,
) => Promise<WorkerResponse<TResponse>>;

export type WorkerRequestRouter = Map<string, WorkerRequestHandler>;

export type WorkerAction<
  TRequest extends any = any,
  TResponse extends any = any
> = {
  action: string;
  handle: WorkerRequestHandler<TRequest, TResponse>;
};

export const WORKER_STATE = {
  BOOTSTRAPPING: 'bootstrapping',
  CATCHING_UP: 'catchingup',
  RUNNING: 'running',
} as const;

export type WorkerState = typeof WORKER_STATE[
  keyof typeof WORKER_STATE
];

export class WorkerResponder {

  #request!: WorkerRequest;

  constructor(request: WorkerRequest) {
    this.#request = request;
  }

  success<T extends any = any>(
    message: string,
    data: T,
    options?: {
      progress?: boolean;
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
      progress: !!options?.progress,
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

export class WorkerClient {
  #worker!: Worker;
  #pendingRequests = new Map<string, {
    request: WorkerRequest,
    resolve: (value: any) => void;
    reject: (value: any) => void;
  }>();

  constructor(worker: Worker) {
    this.#worker = worker;
    this.#worker.onmessage = this.#handleMessage.bind(this);
  }

  request<
    TRequest extends any = any,
    TResponse extends any = any,
    TProgress extends any = any,
  >(
    action: string,
    data?: TRequest,
    options?: { onProgress: (res: WorkerResponse<TProgress>) => void },
  ): Promise<TResponse> {
    const requestId = crypto.randomUUID();

    return new Promise((resolve, reject) => {
      const request = {
        requestId,
        requestedAt: Date.now(),
        onProgress: options?.onProgress,
        action,
        data,
      };
      this.#pendingRequests.set(requestId, { request, resolve, reject });
      this.#worker.postMessage(request);
    });
  }

  #handleMessage(event: MessageEvent<WorkerResponse>) {
    const res = event.data;
    const req = this.#pendingRequests.get(res.requestId);

    // No request found with this ID
    if (!req) {
      return;
    }

    // Error response
    if (res.error) {
      req.reject(res);
      this.#pendingRequests.delete(res.requestId);
      return;
    }

    // Progress response, it happens before resolving and does not remove the
    // pending request
    if (res.progress && req.request.onProgress) {
      req.request.onProgress(res);
      return;
    }

    req.resolve(res);
    this.#pendingRequests.delete(res.requestId);
  }
}
