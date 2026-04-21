import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router';

import routes from './routes';
import './index.css';

const isProduction = import.meta.env.PROD;

const options = isProduction
  ? { basename: '/react-opfs-sqlite-demo/' }
  : {};

const router = createBrowserRouter(routes, options);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
