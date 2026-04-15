import { BACKUP_ACTION } from '../features/backup';
import { RECIPES_ACTION } from '../features/recipes';

export const BACKEND_ACTION = {
  RECIPES: { ...RECIPES_ACTION },
  BACKUP: { ...BACKUP_ACTION },
} as const;

export const DATABASE_FILENAME = 'db.sqlite3';

export const IMAGES_DIR = 'images';
export const IMAGE_MAX_DIMENSION = 1200; // px - longest edge
export const IMAGE_QUALITY = 0.8;