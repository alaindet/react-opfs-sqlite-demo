import { RECIPES_ACTION } from './recipes/actions';

export const BACKEND_ACTION = {
  ...RECIPES_ACTION,
} as const;

export type BackendAction = typeof BACKEND_ACTION[
  keyof typeof BACKEND_ACTION
];
