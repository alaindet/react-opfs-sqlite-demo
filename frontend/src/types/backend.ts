export type BackendRequest<T extends any = any> = {
  id: string;
  action: string;
  data: T;
};

export type BackendResponse<T extends any = any> = {
  id: string;
  action: string;
  message: string;
  error: boolean;
  data: T;
};