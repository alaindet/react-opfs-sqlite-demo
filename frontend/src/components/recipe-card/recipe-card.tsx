import { useCallback } from 'react';

import { Recipe } from '../../types';
import { RecipeCardImage } from './recipe-card-image';
import style from './recipe-card.module.css';

export type RecipeCardProps = {
  recipe: Recipe;
  onDelete: (recipe: Recipe) => void;
};

export function RecipeCard({
  recipe,
  onDelete,
}: RecipeCardProps) {
  const handleDelete = useCallback(() => onDelete(recipe), []);

  return (
    <div className={style.root}>
    
      <RecipeCardImage
        filename={recipe.imageFilename}
        title={recipe.title}
      />

      <div className={style.content}>

        <h3 className={style.title}>
          {recipe.title}
        </h3>

        <div className={style.description}>
          {recipe.description}
        </div>

        <div className={style.footer}>
          <button
            type="button"
            className={style.deleteButton}
            onClick={handleDelete}
          >
            Delete
          </button>
        </div>

      </div>
    </div>
  );
}