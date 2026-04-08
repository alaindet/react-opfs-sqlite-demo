export type Recipe = {
  id: string;
  title: string;
  description: string;
  imageFile: File | null;
  createdAt: number;
};

export type CreateRecipeDto = {
  title: string;
  description: string;
  imageFile: File;
};
