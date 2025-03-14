// Menu.js
import React from "react";
import { Link } from "react-router-dom";
import "./Menu.css";

function Menu() {
  return (
    <div className="menu">
      <div className="hamburger-icon">
        <span></span>
        <span></span>
        <span></span>
      </div>
      <div className="menu-items">
        <Link to="/" className="menu-item">
          Home
        </Link>
        <Link to="/shop" className="menu-item">
          Shop
        </Link>
        <Link to="/magazines" className="menu-item">
          Magazines
        </Link>
      </div>
    </div>
  );
}

export default Menu;