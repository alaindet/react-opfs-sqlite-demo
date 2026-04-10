export type Recipe = {
  id: number;
  title: string;
  description: string;
  imageFile: File | null;
  createdAt: number;
};

type SqlDatetime = string; // '2026-04-09 19:58:38'

export type RecipeDatabaseRow = [
  number, // id
  string, // title
  string, // description
  string | null, // image filename
  SqlDatetime, // created at timestamp, ex '2026-04-09 19:58:38'
];

export type CreateRecipeDto = {
  title: string;
  description: string;
  imageFile: File | null;
};

export type CreateRecipeDatabaseRow = {
  title: string;
  description: string;
  imageFilename: string | null;
  createdAt: SqlDatetime;
};
