import { Outlet } from 'react-router';

import { Navigation } from './components/navigation/navigation';
import style from './app.module.css';

export function App() {
  return (
    <div className={style.app}>
      <Navigation />
      <Outlet />
    </div>
  );
}