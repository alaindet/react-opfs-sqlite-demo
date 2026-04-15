import { WorkerRequest } from './request';
import { WorkerResponse } from './response';
import { WorkerResponder } from './responder';

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