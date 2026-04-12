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
  binary: boolean;
  stream: boolean;
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
    options?: {
      binary?: boolean;
      stream?: boolean;
    },
  ): WorkerErrorResponse<T> {
    return {
      requestId: this.#request.requestId,
      requestedAt: this.#request.requestedAt,
      respondedAt: Date.now(),
      action: this.#request.action,
      error: true,
      binary: !!options?.binary,
      stream: !!options?.stream,
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
