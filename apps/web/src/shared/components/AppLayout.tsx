import { NavLink, Outlet } from "react-router-dom";

export function AppLayout() {
  return (
    <>
      <header className="app-header">
        <div className="app-header__inner">
          <NavLink className="brand" to="/">
            Horace
          </NavLink>
          <nav aria-label="Navigation principale">
            <ul className="navigation">
              <li>
                <NavLink
                  className={({ isActive }) =>
                    isActive ? "navigation__link is-active" : "navigation__link"
                  }
                  end
                  to="/"
                >
                  Accueil
                </NavLink>
              </li>
              <li>
                <NavLink
                  className={({ isActive }) =>
                    isActive ? "navigation__link is-active" : "navigation__link"
                  }
                  to="/agencies"
                >
                  Agences
                </NavLink>
              </li>
            </ul>
          </nav>
        </div>
      </header>
      <main className="page-container">
        <Outlet />
      </main>
    </>
  );
}
