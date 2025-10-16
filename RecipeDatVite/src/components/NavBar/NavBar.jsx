// src/components/NavBar/NavBar.jsx
import { Link, NavLink } from "react-router-dom";
import "./NavBar.css";

export default function NavBar() {
  return (
    <header className="site-header">
      <h1 className="site-brand">
        <Link to="/">RecipeDat</Link>
      </h1>

      <nav className="navbar">
        <ul className="nav-links">
          <li><NavLink to="/" end>Home</NavLink></li>
          <li><NavLink to="/about">About</NavLink></li>
          <li><NavLink to="/cookbook">Cookbook</NavLink></li>
          <li><NavLink to="/thekitchen">The Kitchen</NavLink></li>
        </ul>
      </nav>
    </header>
  );
}
