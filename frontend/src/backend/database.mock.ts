import { Recipe } from '../types';

export class RecipesDatabaseMock {
  #db!: Recipe[];
  
  constructor(recipes: Recipe[]) {
    this.#db = recipes;
  }

  create(recipe: Recipe): Promise<Recipe> {
    this.#db.push(recipe); 
    return Promise.resolve(recipe);
  }

  getAll(): Promise<Recipe[]> {
    return Promise.resolve(this.#db);
  }

  getById(id: Recipe['id']): Promise<Recipe | null> {
    const recipe = this.#db.find(recipe => recipe.id === id);
    return Promise.resolve(recipe ?? null);
  }

  getByTitle(title: Recipe['title']): Promise<Recipe | null> {
    const titleQuery = title.trim().toLowerCase();
    const recipe = this.#db.find(recipe => {
      return recipe.title.trim().toLowerCase().includes(titleQuery);
    });
    return Promise.resolve(recipe ?? null);
  }

  deleteById(id: Recipe['id']): Promise<Recipe | null> {
    const recipe = this.#db.find(recipe => recipe.id === id) ?? null;
    this.#db = this.#db.filter(recipe => recipe.id !== id);
    return Promise.resolve(recipe);
  }
}