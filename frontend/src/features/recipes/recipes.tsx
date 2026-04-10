import { useCallback, useEffect, useState } from 'react';

import { backend } from '../../backend/backend';
import { WorkerErrorResponse } from '../../backend/worker-message-broker';
import { RecipeForm } from '../../components/recipe-form/recipe-form';
import { CreateRecipeDto, Recipe } from '../../types';
import { RecipesList } from './recipes-list';

export function RecipesPage() {
  const [recipes, setRecipes] = useState<Recipe[] | null>(null);
  const [recipesError, setRecipesError] = useState<string | null>(null);
  const [recipesLoading, setRecipesLoading] = useState(false);

  const handleDeleteRecipe = useCallback(async (recipe: Recipe) => {
    const confirmed = confirm(`Delete recipe "${recipe.title}"?`);
    if (!confirmed) {
      console.log(`Aborted deleting recipe "${recipe.title}"`);
      return;
    }
    try {
      await backend.recipes.delete(recipe);
      loadRecipes();
    } catch (err) {
      alert((err as WorkerErrorResponse).message);
    }
  }, [recipes]);

  const handleCreateRecipe = useCallback(async (dto: CreateRecipeDto) => {
    try {
      await backend.recipes.create(dto);
      loadRecipes();
    } catch (err) {
      alert((err as WorkerErrorResponse).message);
    }
  }, []);

  useEffect(() => {
    loadRecipes();
  }, []);

  async function loadRecipes() {
    setRecipesLoading(true);
    const res = await backend.recipes.getAll();
    setRecipes(res.data);
    setRecipesLoading(false);
  }

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
