import { useMemo } from 'react';

import { RecipeCard } from '../../components/recipe-card/recipe-card';
import { ASYNC_RESOURCES_STATE, AsyncResourcesState, Recipe } from '../../types';
import style from './recipes-list.module.css';

export type RecipesListProps = {
  recipes: Recipe[] | null;
  isLoading: boolean,
  error: string | null,
  onDelete: (recipe: Recipe) => void;
};

export function RecipesList({
  recipes,
  isLoading,
  error,
  onDelete,
}: RecipesListProps) {

  const recipesState = useMemo<AsyncResourcesState>(() => {
    if (isLoading) {
      return ASYNC_RESOURCES_STATE.LOADING;
    }

    if (error !== null) {
      return ASYNC_RESOURCES_STATE.ERROR;
    }

    if (recipes === null) {
      return ASYNC_RESOURCES_STATE.IDLE;
    }

    if (recipes.length === 0) {
      return ASYNC_RESOURCES_STATE.EMPTY;
    }

    return ASYNC_RESOURCES_STATE.LOADED;
  }, [recipes, isLoading, error]);

  switch (recipesState) {
    case ASYNC_RESOURCES_STATE.IDLE:
      return null;
    
    case ASYNC_RESOURCES_STATE.ERROR:
      return null;

    case ASYNC_RESOURCES_STATE.LOADING:
      return (
        <ul className={style.recipes}>
          <li>
            <p className={style.placeholderText}>Loading recipes...</p>
          </li>
        </ul>
      );

    case ASYNC_RESOURCES_STATE.EMPTY:
      return (
        <ul className={style.recipes}>
          <li>
            <p className={style.placeholderText}>No recipes yet</p>
          </li>
        </ul>
      );

    case ASYNC_RESOURCES_STATE.LOADED:
      return (
        <ul className={style.recipes}>
          {recipes!.map(recipe => (
            <li key={recipe.id} className={style.recipe}>
              <RecipeCard
                recipe={recipe}
                onDelete={onDelete}
              />
            </li>
          ))}
        </ul>
      );
  }
}