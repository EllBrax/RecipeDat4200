// src/components/NavBar/NavBar.jsx
import { Link, NavLink } from "react-router-dom";
import "./NavBar.css";
import logo from "../../assets/Logoandletter.png";
import ThemeToggle from "../ThemeToggle/ThemeToggle";

export default function NavBar() {
  return (
    <header className="site-header">
      <nav className="navbar">
        <ul className="nav-links">
          <li><NavLink to="/" end>Home</NavLink></li>
          <li><NavLink to="/about">About</NavLink></li>
          <li><NavLink to="/cookbook">Cookbook</NavLink></li>
          <li><NavLink to="/thekitchen">The Kitchen</NavLink></li>
          <li><NavLink to="/profile">Profile</NavLink></li>
        </ul>
      </nav>

      <h1 className="site-brand">
        <Link to="/">RecipeDat</Link>
      </h1>

      <div className="site-right">
        <ThemeToggle />
        <div className="site-logo" aria-label="RecipeDat Logo">
          <img src={logo} alt="RecipeDat logo" />
        </div>
        
      </div>
    </header>
  );
}
