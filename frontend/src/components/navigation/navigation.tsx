import { NavLink } from 'react-router';
import style from './navigation.module.css';

export function Navigation() {
  return (
    <nav className={style.navigation}>
      <ul className={style.links}>

        <li className={style.link}>
          <NavLink to="/" end className={r => r.isActive ? style.active : null}>
            Recipes
          </NavLink>
        </li>

        <li className={style.link}>
          <NavLink to="/backup" className={r => r.isActive ? style.active : null}>
            Backup
          </NavLink>
        </li>

      </ul>
    </nav>
  );
}