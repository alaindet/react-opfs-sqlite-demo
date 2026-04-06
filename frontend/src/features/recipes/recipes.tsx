import { useCallback, useEffect, useState } from 'react';

import { Recipe, CreateRecipeDto, BackendResponse } from '../../types';
import { RecipesList } from './recipes-list';
import { RecipeForm } from '../../components/recipe-form/recipe-form';
import { useBackend } from '../../context/backend';
import { BACKEND_ACTION } from '../../context/actions';

export function RecipesPage() {
  const backend = useBackend();
  const [recipes, setRecipes] = useState<Recipe[] | null>(null);
  const [recipesError, setRecipesError] = useState<string | null>(null);
  const [recipesLoading, setRecipesLoading] = useState(false);

  const handleDeleteRecipe = useCallback((recipe: Recipe) => {
    const confirmed = confirm(`Delete recipe "${recipe.title}"?`);
    if (!confirmed) {
      console.log(`Aborted deleting recipe "${recipe.title}"`);
      return;
    }
    backend.worker.postMessage({
      id: BACKEND_ACTION.RECIPES_DELETE,
      action: BACKEND_ACTION.RECIPES_DELETE,
      data: recipe,
    });
  }, [recipes]);

  const handleCreateRecipe = useCallback((dto: CreateRecipeDto) => {
    backend.worker.postMessage({
      id: BACKEND_ACTION.RECIPES_CREATE,
      action: BACKEND_ACTION.RECIPES_CREATE,
      data: dto,
    });
  }, []);

  useEffect(() => {
    backend.worker.onmessage = (event: MessageEvent<BackendResponse>) => {
      console.log('[MAIN] From Worker:', event);
      const res = event.data;

      if (res.error) {
        alert(res.message);
        console.error(res.message);
        return;
      }

      switch (res.action) {
        case BACKEND_ACTION.RECIPES_GET_ALL: {
          setRecipes(res.data as Recipe[]);
          setRecipesLoading(false);
          break;
        }

        case BACKEND_ACTION.RECIPES_CREATE: {
          setRecipesLoading(true);
          backend.worker.postMessage({
            id: BACKEND_ACTION.RECIPES_GET_ALL,
            action: BACKEND_ACTION.RECIPES_GET_ALL,
            data: null,
          });
          break;
        }

        case BACKEND_ACTION.RECIPES_DELETE: {
          setRecipesLoading(true);
          backend.worker.postMessage({
            id: BACKEND_ACTION.RECIPES_GET_ALL,
            action: BACKEND_ACTION.RECIPES_GET_ALL,
            data: null,
          });
          break;
        }
      }
    };
  }, []);

  useEffect(() => {
    setRecipesLoading(true);
    backend.worker.postMessage({
      id: BACKEND_ACTION.RECIPES_GET_ALL,
      action: BACKEND_ACTION.RECIPES_GET_ALL,
      data: null,
    });
  }, []);

  return (
    <>
      <h1>Recipes</h1>

      <RecipeForm
        isLoading={recipesLoading}
        onCreated={handleCreateRecipe}
      />

      <div style={{ marginTop: '1rem' }} />

      <RecipesList
        recipes={recipes}
        isLoading={recipesLoading}
        error={recipesError}
        onDelete={handleDeleteRecipe}
      />
    </>
  );
}