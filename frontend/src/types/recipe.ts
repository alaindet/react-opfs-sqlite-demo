export type Recipe = {
  id: string;
  title: string;
  description: string;
  imageFile: File | null;
  createdAt: number;
};

export type RecipeDatabaseRow = {
  id: number;
  title: string;
  description: string;
  image_filename: string;
  created_at: string;
};

export type CreateRecipeDto = {
  title: string;
  description: string;
  imageFile: File;
};
