import { RECIPES_ACTION } from './recipes/actions';

export const BACKEND_ACTION = {
  RECIPES: { ...RECIPES_ACTION },
} as const;