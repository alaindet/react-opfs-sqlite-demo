export type Recipe = {
  id: string;
  title: string;
  description: string;
  imageFilename: string;
  createdAt: number;
};

export const ASYNC_RESOURCES_STATE = {
  IDLE: 'idle',
  LOADING: 'loading',
  LOADED: 'loaded',
  ERROR: 'error',
  EMPTY: 'empty',
} as const;

export type AsyncResourcesState = typeof ASYNC_RESOURCES_STATE[
  keyof typeof ASYNC_RESOURCES_STATE
];