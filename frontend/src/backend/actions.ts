import { BACKUP_ACTION } from './backup/actions';
import { RECIPES_ACTION } from './recipes/actions';

export const BACKEND_ACTION = {
  RECIPES: { ...RECIPES_ACTION },
  BACKUP: { ...BACKUP_ACTION },
} as const;