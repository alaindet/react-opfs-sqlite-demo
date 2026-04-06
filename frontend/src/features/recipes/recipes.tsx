import { useCallback, useEffect, useState } from 'react';

import { Recipe } from '../../types';
import { recipesMockData } from './mock';
import { RecipesList } from './recipes-list';
import { RecipeForm, RecipeFormValue } from '../../components/recipe-form/recipe-form';

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

    setRecipesLoading(true);
    await fakePromise('deleted', 1000);
    setRecipes(recipes!.filter(r => r.id !== recipe.id));
    setRecipesLoading(false);
  }, [recipes]);

  const handleCreateRecipe = useCallback(async (formValue: RecipeFormValue) => {
    setRecipesLoading(true);

    const recipe: Recipe = {
      id: String(Math.random()),
      title: formValue.title,
      description: formValue.description,
      imageFilename: 'todo', // TODO
      createdAt: Date.now(),
    };

    await fakePromise('created', 1000);

    setRecipes(recipes!.filter(r => r.id !== recipe.id));
    setRecipesLoading(false);
  }, []);

  const loadData = useCallback(async () => {
    setRecipesLoading(true);
    try {
      const data = await fakePromise(recipesMockData, 1000);
      setRecipes(data);
    } catch (err: any) {
      console.error(err);
      setRecipesError('cannot load recipes');
    } finally {
      setRecipesLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
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

// TODO: Remove
function fakePromise<T extends any>(result: T, delay: number): Promise<T> {
  return new Promise(done => {
    setTimeout(() => done(result), delay);
  });
}