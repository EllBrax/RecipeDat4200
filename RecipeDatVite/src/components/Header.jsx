import React from "react";
import { Link } from "react-router-dom";
import "./Header.css";
import "./index.css";

const Header = () => {
  return (
    <header>
      <div className="container">          
        <nav className="navbar">
          <h1>RecipeDat</h1>
          <ul className="nav-links">
            <li><Link to="/">Home</Link></li>
            <li><Link to="/about">About</Link></li>
            <li><Link to="/cookbook">Cookbook</Link></li>
            <li><Link to="/thekitchen">The Kitchen</Link></li>
            <li><Link to="/profile/me">Profile</Link></li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;
