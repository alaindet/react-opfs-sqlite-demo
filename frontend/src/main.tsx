import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router';

import { BackendProvider } from './backend-context';
import routes from './routes';
import './index.css';

const router = createBrowserRouter(routes);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BackendProvider>
      <RouterProvider router={router} />
    </BackendProvider>
  </StrictMode>
);