import sql from 'sql-template-tag';

export const recipesSeed = sql`
  INSERT INTO recipes (id, title, description, image_filename) VALUES (
    1,
    'Recipe 1',
    'Lorem ipsum dolor sit amet',
    'recipe1.webp'
  );

  INSERT INTO recipes (id, title, description, image_filename) VALUES (
    2,
    'Recipe 2',
    'Lorem ipsum dolor sit amet',
    'recipe2.webp'
  );

  INSERT INTO recipes (id, title, description, image_filename) VALUES (
    3,
    'Recipe 3',
    'Lorem ipsum dolor sit amet',
    'recipe3.webp'
  );
`;