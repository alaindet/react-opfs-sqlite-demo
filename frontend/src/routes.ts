import { RouteObject } from 'react-router';

import { App } from './App';
import { RecipesPage } from './features/recipes/recipes';
import { DatabasePage } from './features/database/database';

export default [
  {
    path: '',
    Component: App,
    children: [
      {
        index: true,
        Component: RecipesPage,
      },
      {
        path: 'database',
        Component: DatabasePage,
      },
    ],
  },
] as RouteObject[];