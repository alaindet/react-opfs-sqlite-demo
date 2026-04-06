export const BACKEND_ACTION = {
  RECIPES_GET_ALL: 'recipes/getAll',
  RECIPES_CREATE: 'recipes/create',
  RECIPES_DELETE: 'recipes/delete',
} as const;

export type BackendAction = typeof BACKEND_ACTION[
  keyof typeof BACKEND_ACTION
];