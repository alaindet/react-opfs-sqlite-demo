import { WORKER_PROGRESS_RESPONSE_STATE } from './progress';
import { WorkerRequest } from './request';
import { WorkerResponse, WorkerSuccessResponse } from './response';

export class WorkerClient {
  #worker!: Worker;

  #pendingRequests = new Map<string, {
    request: WorkerRequest,
    resolve: (value: any) => void;
    reject: (value: any) => void;
  }>();

  #progressTrackers = new Map<string, {
    request: WorkerRequest,
    onProgress: (res: WorkerSuccessResponse) => void;
  }>();

  constructor(worker: Worker) {
    this.#worker = worker;
    this.#worker.onmessage = this.#handleWorkerMessage.bind(this);
  }

  request<
    TRequest extends any = any,
    TResponse extends any = any,
    TProgress extends any = any,
  >(
    action: string,
    data?: TRequest,
    options?: { onProgress?: (res: WorkerSuccessResponse<TProgress>) => void },
  ): Promise<TResponse> {
    const requestId = crypto.randomUUID();

    return new Promise((resolve, reject) => {

      // Create a request
      const requestedAt = Date.now();
      const request = { requestId, requestedAt, action, data };
      
      // Store it as pending to be later resolved
      this.#pendingRequests.set(requestId, { request, resolve, reject });

      // Store a progress tracker if provided
      if (options?.onProgress) {
        const { onProgress } = options;
        this.#progressTrackers.set(requestId, { request, onProgress });
      }

      // Send the request to the backend
      this.#worker.postMessage(request);
    });
  }

  #handleWorkerMessage(event: MessageEvent<WorkerResponse>) {
    const res = event.data;

    // Error response
    if (res.error) {
      if (this.#pendingRequests.has(res.requestId)) {
        this.#pendingRequests.delete(res.requestId);
      }
      return;
    }

    // Progress response-like
    if (res.progress !== null) {
      this.#handleWorkerProgress(res);
      return;
    }

    this.#handleWorkerResponse(res);
  }

  #handleWorkerResponse<T extends any = any>(res: WorkerSuccessResponse<T>): void {

    // No request found with this ID
    const pendingRequest = this.#pendingRequests.get(res.requestId);
    if (!pendingRequest) {
      console.warn(`No request found with ID: ${res.requestId}`);
      return;
    }

    pendingRequest.resolve(res);
    this.#pendingRequests.delete(res.requestId);
  }

  #handleWorkerProgress<T extends any = any>(res: WorkerSuccessResponse<T>): void {

    // Use the progress tracker, if any
    const progressTracker = this.#progressTrackers.get(res.requestId);
    if (!progressTracker) {
      console.warn('Missing progress tracker', res);
      return;
    }

    progressTracker.onProgress(res);

    // Cleanup progress tracker
    if (res.progress === WORKER_PROGRESS_RESPONSE_STATE.END) {
      if (this.#pendingRequests.has(res.requestId)) {
        this.#pendingRequests.delete(res.requestId);
      }
      this.#progressTrackers.delete(res.requestId);
    }
  }
}