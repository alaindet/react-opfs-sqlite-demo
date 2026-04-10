import { RouteObject } from 'react-router';

import { App } from './App';
import { RecipesPage } from './features/recipes/recipes';
import { BackupPage } from './features/backup/backup';

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
        path: 'backup',
        Component: BackupPage,
      },
    ],
  },
] as RouteObject[];